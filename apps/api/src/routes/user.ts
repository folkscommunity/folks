import { createHash, randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import argon2 from "argon2";
import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";

import { prisma } from "@folks/db";
import { JSONtoString, schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { s3 } from "@/lib/aws";
import { posthog } from "@/lib/posthog";
import { redis } from "@/lib/redis";

const upload = multer({
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

const router = Router();

router.patch("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { display_name, location, occupation, website, pronouns } = req.body;

    if (!display_name && !location && !occupation && !website && !pronouns) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide at least one field."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        deleted_at: null
      }
    });

    if (!user) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    if (user.suspended) {
      return res.status(401).json({
        error: "suspended",
        msg: "Your account is suspended."
      });
    }

    if (display_name) {
      try {
        await schemas.displayNameSchema.parseAsync(display_name);
      } catch (err) {
        return res.status(400).json({
          error: "invalid_request",
          msg: JSON.parse(err.message)[0].message
        });
      }
    }

    if (location) {
      try {
        await schemas.locationSchema.parseAsync(location);
      } catch (err) {
        return res.status(400).json({
          error: "invalid_request",
          msg: JSON.parse(err.message)[0].message
        });
      }
    }

    if (occupation) {
      try {
        await schemas.occupationSchema.parseAsync(occupation);
      } catch (err) {
        return res.status(400).json({
          error: "invalid_request",
          msg: JSON.parse(err.message)[0].message
        });
      }
    }

    if (website) {
      try {
        await schemas.websiteSchema.parseAsync(website);
      } catch (err) {
        return res.status(400).json({
          error: "invalid_request",
          msg: JSON.parse(err.message)[0].message
        });
      }
    }

    if (pronouns) {
      try {
        await schemas.pronounsSchema.parseAsync(pronouns);
      } catch (err) {
        return res.status(400).json({
          error: "invalid_request",
          msg: JSON.parse(err.message)[0].message
        });
      }
    }

    await prisma.user.update({
      where: {
        id: BigInt(req.user.id)
      },
      data: {
        display_name: display_name,
        location: location,
        occupation: occupation,
        website: website,
        pronouns: pronouns
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.patch("/password", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide both old and new passwords."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        deleted_at: null
      }
    });

    if (!user) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    const isValid = await argon2.verify(user.password_hash, old_password);

    if (!isValid) {
      return res.status(400).json({
        error: "invalid_credentials",
        msg: "Old password is incorrect."
      });
    }

    try {
      await schemas.passwordSchema.parseAsync(new_password);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        msg: JSON.parse(err.message)[0].message
      });
    }

    const hashed_password = await argon2.hash(new_password);

    await prisma.user.update({
      where: {
        id: BigInt(req.user.id)
      },
      data: {
        password_hash: hashed_password
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req: RequestWithUser, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "invalid_request",
          msg: "You must provide an image."
        });
      }

      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        return res.status(400).json({
          error: "invalid_request",
          message: "AWS credentials not set. Avatar uploads are disabled."
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id),
          deleted_at: null
        }
      });

      if (!user) {
        return res.status(401).json({
          error: "unauthorized"
        });
      }

      const buffer = Buffer.from(req.file.buffer);

      if (buffer.length > 15 * 1024 * 1024) {
        return res.status(400).json({
          error: "invalid_request",
          message: "File size exceeds limit."
        });
      }

      let img = await sharp(buffer, {
        animated: false
      });

      const img_metadata = await img.metadata();

      if (img_metadata.width > 8000 || img_metadata.height > 8000) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Image dimensions exceeds limit. (8000x8000 max)"
        });
      }

      img = await img.resize(800, 800, {
        fit: "cover"
      });

      img = await img.webp({ quality: 80 });

      const transformed_image_buffer = await img.toBuffer();

      const file_key = `avatars/${createHash("sha256")
        .update(user.id.toString() + "-" + new Date().getTime())
        .digest("hex")}.webp`;

      const s3_file = await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET!,
          Key: file_key,
          Body: transformed_image_buffer,
          Metadata: {
            "Uploaded-By-User": req.user.id.toString()
          },
          ContentType: "image/webp",
          ACL: "public-read",
          CacheControl: "max-age=2592000" // 30 days
        })
      );

      if (s3_file.$metadata.httpStatusCode !== 200) {
        console.error("Error uploading file to S3.", s3_file);

        return res.status(400).json({
          error: "invalid_request",
          message: "Something went wrong."
        });
      }

      let original_file_key;

      const original_avatar_url = user.avatar_url;
      if (original_avatar_url) {
        original_file_key = original_avatar_url
          .replace("https://", "")
          .replace("http://", "")
          .split("?")[0]
          .split("/");
      }

      await prisma.user.update({
        where: {
          id: BigInt(req.user.id)
        },
        data: {
          avatar_url: process.env.CDN_URL
            ? `${process.env.CDN_URL}/${file_key}`
            : `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${file_key}`
        }
      });

      if (original_avatar_url) {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET!,
            Key: original_file_key[1] + "/" + original_file_key[2]
          })
        );
      }

      await posthog.capture({
        distinctId: user.id.toString(),
        event: "update_avatar"
      });

      res.setHeader("Content-Type", "application/json");
      res.send(JSONtoString({ ok: true }));
    } catch (e) {
      console.error(e);

      res.status(500).json({
        error: "server_error",
        message: "Something went wrong."
      });
    }
  }
);

router.post(
  "/notification-preferences",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const {
        push_reply,
        push_mention,
        push_follow,
        push_like,
        marketing_emails
      } = req.body;

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        return res.status(401).json({
          error: "unauthorized"
        });
      }

      await prisma.user.update({
        where: {
          id: BigInt(req.user.id)
        },
        data: {
          notifications_push_replied_to: push_reply,
          notifications_push_mentioned: push_mention,
          notifications_push_followed: push_follow,
          notifications_push_liked_posts: push_like,
          marketing_emails: marketing_emails
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(JSONtoString({ ok: true }));
    } catch (e) {
      console.error(e);

      res.status(500).json({
        error: "server_error",
        message: "Something went wrong."
      });
    }
  }
);

router.get(
  "/notification-preferences",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        return res.status(401).json({
          error: "unauthorized"
        });
      }

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true,
          data: {
            push_reply: user.notifications_push_replied_to,
            push_mention: user.notifications_push_mentioned,
            push_follow: user.notifications_push_followed,
            push_like: user.notifications_push_liked_posts,
            marketing_emails: user.marketing_emails
          }
        })
      );
    } catch (e) {
      console.error(e);

      res.status(500).json({
        error: "server_error",
        message: "Something went wrong."
      });
    }
  }
);

router.post("/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide an email."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (!user) {
      res.setHeader("Content-Type", "application/json");
      return res.send(JSONtoString({ ok: true }));
    }

    await prisma.user.update({
      where: {
        id: BigInt(user.id)
      },
      data: {
        marketing_emails: false
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.post("/unsubscribe/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const email_raw = Buffer.from(email, "base64").toString("utf-8");

    const user = await prisma.user.findUnique({
      where: {
        email: email_raw
      }
    });

    if (!user) {
      return res.send("ok");
    }

    await prisma.user.update({
      where: {
        id: BigInt(user.id)
      },
      data: {
        marketing_emails: false
      }
    });

    res.send("ok");
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

// search users
router.get("/search", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      res.status(400).json({
        error: "missing_query"
      });
      return;
    }

    const query_string = q.toString();

    if (query_string.length < 2 || query_string.length > 30) {
      res.status(400).json({
        error: "invalid_query"
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        deleted_at: null
      }
    });

    if (!user) {
      res.status(403).json({
        error: "forbidden"
      });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
        suspended: false,
        email_verified: true,
        search_hidden: false,
        OR: [
          {
            display_name: {
              contains: query_string,
              mode: "insensitive"
            }
          },
          {
            username: {
              contains: query_string,
              mode: "insensitive"
            }
          }
        ]
      },
      take: 5,
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true
      }
    });

    // Get follow states for all users in search results
    const followStates = await prisma.following.findMany({
      where: {
        user_id: user.id,
        target_id: {
          in: users.map((u) => u.id)
        }
      },
      select: {
        target_id: true
      }
    });

    const followingMap = new Map(
      followStates.map((f) => [f.target_id.toString(), true])
    );

    const usersWithFollowState = users.map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      following: followingMap.has(u.id.toString())
    }));

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: usersWithFollowState
      })
    );
  } catch (e) {
    res.status(500).json({
      error: "server_error"
    });
  }
});

// search recommended users
router.get(
  "/search/recommended",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id),
          deleted_at: null
        }
      });

      if (!user) {
        res.status(403).json({
          error: "forbidden"
        });
        return;
      }

      const recommendedUsers = await prisma.user.findMany({
        where: {
          deleted_at: null,
          suspended: false,
          email_verified: true,
          search_hidden: false,
          NOT: {
            id: user.id
          },
          posts: {
            some: {} // Only include users who have at least one post
          }
        },
        take: 40,
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true
        },
        orderBy: {
          posts: {
            _count: "desc"
          }
        }
      });

      // Get the most recent post for each user
      const userPosts = await prisma.post.findMany({
        where: {
          deleted_at: null,
          author_id: {
            in: recommendedUsers.map((u) => u.id)
          }
        },
        select: {
          author_id: true,
          created_at: true
        },
        orderBy: {
          created_at: "desc"
        }
      });

      // Create a map of most recent post dates
      const mostRecentPosts = new Map();
      for (const post of userPosts) {
        if (!mostRecentPosts.has(post.author_id.toString())) {
          mostRecentPosts.set(post.author_id.toString(), post.created_at);
        }
      }

      // Sort recommended users by their most recent post date
      const sortedUsers = [...recommendedUsers].sort((a, b) => {
        const aDate = mostRecentPosts.get(a.id.toString());
        const bDate = mostRecentPosts.get(b.id.toString());
        // Handle cases where dates might be undefined
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1; // Users with no posts go to the end
        if (!bDate) return -1; // Users with posts come before those without
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // Get follow states for all recommended users
      const followStates = await prisma.following.findMany({
        where: {
          user_id: user.id,
          target_id: {
            in: sortedUsers.map((u) => u.id)
          }
        },
        select: {
          target_id: true
        }
      });

      const followingMap = new Map(
        followStates.map((f) => [f.target_id.toString(), true])
      );

      const usersWithFollowState = sortedUsers.map((u) => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        following: followingMap.has(u.id.toString())
      }));

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true,
          data: usersWithFollowState
        })
      );
    } catch (e) {
      console.log(e);

      console.error(
        JSON.stringify({
          error: true,
          path: "/api/user/search/recommended",
          stack: JSON.stringify(e)
        })
      );

      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

// block user
router.post("/block", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { target_id } = req.body;

    if (!target_id) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide a target user ID."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    if (user.id === BigInt(target_id)) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You cannot block yourself."
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: BigInt(target_id)
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        error: "not_found",
        msg: "Target user not found."
      });
    }

    const isBlocked = await prisma.userBlocked.findUnique({
      where: {
        user_blocked_unique: {
          user_id: BigInt(req.user.id),
          target_id: BigInt(target_id)
        }
      }
    });

    if (isBlocked) {
      return res.status(400).json({
        error: "already_blocked"
      });
    }

    await prisma.userBlocked.create({
      data: {
        user_id: BigInt(req.user.id),
        target_id: BigInt(target_id)
      }
    });

    await prisma.following.deleteMany({
      where: {
        user_id: BigInt(req.user.id),
        target_id: BigInt(target_id)
      }
    });

    await posthog.capture({
      event: "user_blocked",
      distinctId: req.user.id.toString(),
      properties: {
        target_id: target_id.toString()
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.post("/unblock", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { target_id } = req.body;

    if (!target_id) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide a target user ID."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    const isBlocked = await prisma.userBlocked.findUnique({
      where: {
        user_blocked_unique: {
          user_id: BigInt(req.user.id),
          target_id: BigInt(target_id)
        }
      }
    });

    if (!isBlocked) {
      return res.status(400).json({
        error: "not_blocked"
      });
    }

    await prisma.userBlocked.delete({
      where: {
        user_blocked_unique: {
          user_id: BigInt(req.user.id),
          target_id: BigInt(target_id)
        }
      }
    });

    await posthog.capture({
      event: "user_unblocked",
      distinctId: req.user.id.toString(),
      properties: {
        target_id: target_id.toString()
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.get("/blocked", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const blockedUsers = await prisma.userBlocked.findMany({
      where: {
        user_id: BigInt(req.user.id)
      },
      select: {
        target: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true
          }
        }
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: blockedUsers ? blockedUsers.map((u) => u.target) : []
      })
    );
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.get("/get-id/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        username: username
      },
      select: {
        id: true
      }
    });

    if (!user) {
      res.status(404).json({
        error: "not_found"
      });
      return;
    }

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true, data: user.id }));
  } catch (e) {
    console.error(e);
  }
});

router.get("/username/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const folks_sid =
      req.cookies.folks_sid ||
      req.headers.authorization ||
      req.headers.Authorization;

    let user_id = null;
    let user;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;

        user = await prisma.user.findUnique({
          where: {
            id: BigInt(user_id)
          },
          select: {
            id: true,
            username: true
          }
        });
      }
    }

    const selectedUser = await prisma.user.findUnique({
      where: {
        username: username,
        deleted_at: null
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        occupation: true,
        location: true,
        pronouns: true,
        website: true,
        super_admin: true,
        suspended: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            following: user && user.username === username ? true : false,
            followers: user && user.username === username ? true : false,
            articles: true,
            boards: {
              where: {
                public: true
              }
            },
            posts: true
          }
        }
      }
    });

    if (!selectedUser) {
      res.status(404).json({
        error: "not_found"
      });
      return;
    }

    let blockedByUser = false;

    if (user_id) {
      const isBlockedByUser = await prisma.userBlocked.findUnique({
        where: {
          user_blocked_unique: {
            user_id: BigInt(user_id),
            target_id: BigInt(selectedUser.id)
          }
        }
      });

      if (isBlockedByUser) {
        blockedByUser = true;
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          id: selectedUser.id,
          username: selectedUser.username,
          display_name: selectedUser.display_name,
          occupation: selectedUser.occupation || undefined,
          avatar_url: selectedUser.avatar_url || undefined,
          location: selectedUser.location || undefined,
          pronouns: selectedUser.pronouns || undefined,
          website: selectedUser.website || undefined,
          ...(selectedUser.super_admin && { super_admin: true }),
          ...(selectedUser.suspended && { suspended: true }),
          ...(user_id && { blocked_by_user: blockedByUser }),
          created_at: selectedUser.created_at,
          updated_at: selectedUser.updated_at,
          count: {
            following: selectedUser._count.following || undefined,
            followers: selectedUser._count.followers || undefined,
            articles: selectedUser._count.articles ?? 0,
            boards: selectedUser._count.boards ?? 0,
            posts: selectedUser._count.posts ?? 0
          }
        }
      })
    );
  } catch (e) {
    res.status(500).json({
      error: "server_error"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const folks_sid =
      req.cookies.folks_sid ||
      req.headers.authorization ||
      req.headers.Authorization;

    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;
      }
    }

    const selectedUser = await prisma.user.findUnique({
      where: {
        id: BigInt(id),
        deleted_at: null
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        occupation: true,
        location: true,
        pronouns: true,
        website: true,
        super_admin: true,
        suspended: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            following:
              user_id && user_id.toString() === id.toString() ? true : false,
            followers:
              user_id && user_id.toString() === id.toString() ? true : false,
            articles: true,
            boards: {
              where: {
                public: true
              }
            },
            posts: true
          }
        }
      }
    });

    if (!selectedUser) {
      res.status(404).json({
        error: "not_found"
      });
      return;
    }

    let blockedByUser = false;

    if (user_id) {
      const isBlockedByUser = await prisma.userBlocked.findUnique({
        where: {
          user_blocked_unique: {
            user_id: BigInt(user_id),
            target_id: BigInt(id)
          }
        }
      });

      if (isBlockedByUser) {
        blockedByUser = true;
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          id: selectedUser.id,
          username: selectedUser.username,
          display_name: selectedUser.display_name,
          occupation: selectedUser.occupation || undefined,
          avatar_url: selectedUser.avatar_url || undefined,
          location: selectedUser.location || undefined,
          pronouns: selectedUser.pronouns || undefined,
          website: selectedUser.website || undefined,
          ...(selectedUser.super_admin && { super_admin: true }),
          ...(selectedUser.suspended && { suspended: true }),
          ...(user_id && { blocked_by_user: blockedByUser }),
          created_at: selectedUser.created_at,
          updated_at: selectedUser.updated_at,
          count: {
            following: selectedUser._count.following || undefined,
            followers: selectedUser._count.followers || undefined,
            articles: selectedUser._count.articles ?? 0,
            boards: selectedUser._count.boards ?? 0,
            posts: selectedUser._count.posts ?? 0
          }
        }
      })
    );
  } catch (e) {
    res.status(500).json({
      error: "server_error"
    });
  }
});

router.post("/delete", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    const isValid = await argon2.verify(user.password_hash, password);

    if (!isValid) {
      return res.status(400).json({
        error: "invalid_password"
      });
    }

    // destroy session
    const token =
      req.cookies.folks_sid ||
      req.headers.authorization ||
      req.headers.Authorization;

    if (token) {
      const jwt_object = jwt.decode(token) as {
        id: string;
      };

      await redis.del(`session:${jwt_object.id}:${token}`);
    }

    await prisma.user.update({
      where: {
        id: BigInt(req.user.id)
      },
      data: {
        deleted_at: new Date(),
        marketing_emails: false,
        notifications_push_replied_to: false,
        notifications_push_mentioned: false,
        notifications_push_followed: false,
        notifications_push_liked_posts: false
      }
    });

    await prisma.following.deleteMany({
      where: {
        user_id: BigInt(req.user.id)
      }
    });

    await prisma.post.updateMany({
      where: {
        author_id: BigInt(req.user.id)
      },
      data: {
        deleted_at: new Date()
      }
    });

    await prisma.article.updateMany({
      where: {
        author_id: BigInt(req.user.id)
      },
      data: {
        deleted_at: new Date()
      }
    });

    try {
      await posthog.capture({
        event: "user_deleted",
        distinctId: req.user.id.toString()
      });
    } catch (e) {
      console.error(e);
    }

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

export default router;
