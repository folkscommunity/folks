/* eslint-disable prefer-const */
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import exifReader from "exif-reader";
import { Router } from "express";
import jwt from "jsonwebtoken";
import sharp from "sharp";

import { prisma } from "@folks/db";
import { JSONtoString, schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { s3 } from "@/lib/aws";
import { sendNotification } from "@/lib/notification_utils";
import { posthog } from "@/lib/posthog";
import { redis } from "@/lib/redis";

const router = Router();

async function generatePostMentions(post_id: string, body: string) {
  const regex = /(?:^|[.,]|\s)@(\w+)(?![^<]*>)/g;

  const matches = body.match(regex);

  if (!matches) {
    return;
  }

  const post = await prisma.post.findUnique({
    where: {
      id: BigInt(post_id)
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          display_name: true
        }
      }
    }
  });

  let processed_matches: string[] = [];

  for await (const match of matches) {
    const match_lower = match
      .toLowerCase()
      .replace("@", "")
      .replaceAll(" ", "");

    if (processed_matches.includes(match_lower)) {
      continue;
    }

    const matched_user = await prisma.user.findFirst({
      where: {
        username: match_lower
      }
    });

    if (matched_user && post.author_id === matched_user.id) {
      continue;
    }

    if (matched_user) {
      await prisma.postMention.create({
        data: {
          post_id: BigInt(post_id),
          user_id: matched_user.id
        }
      });

      if (matched_user.notifications_push_mentioned) {
        await sendNotification(
          matched_user.id,
          `Folks`,
          `${post.author.display_name} mentioned you in a post: ${post.body.slice(
            0,
            20
          )}${post.body.length > 20 ? "..." : ""}`,
          `${process.env.NODE_ENV === "production" ? "https://folkscommunity.com" : process.env.DEV_URL}/${post.author.username}/${post.id}`
        );
      }
    }

    await processed_matches.push(match_lower);
  }

  return;
}

router.post("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { body, files, replying_to } = req.body;

    const rate_limit = await redis.get(`rate_limit:post:${req.user.id}`);

    if (Number(rate_limit) > 5) {
      return res.status(429).json({
        error: "rate_limit_exceeded",
        message:
          "You have exceeded the rate limit. Please try again in a few minutes."
      });
    }

    await redis.set(
      `rate_limit:post:${req.user.id}`,
      Number(rate_limit) + 1,
      "EX",
      60
    );

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

    if (user.suspended) {
      return res.status(401).json({
        error: "suspended",
        message: "Your account is suspended."
      });
    }

    if (!user.email_verified) {
      return res.status(401).json({
        error: "email_not_verified",
        message: "You must verify your email before posting."
      });
    }

    if (replying_to) {
      const replying_to_post = await prisma.post.findUnique({
        where: {
          id: BigInt(replying_to)
        }
      });

      if (!replying_to_post) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Replying to post not found."
        });
      }
    }

    try {
      await schemas.postBodySchema.parseAsync(body);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        message: JSON.parse(err.message)[0].message
      });
    }

    if (files && files.length > 1) {
      return res.status(400).json({
        error: "invalid_request",
        message: "You can only upload one photo."
      });
    }

    if (files && files.length > 0) {
      const file = files[0];

      const file_type = file.content.split(";")[0].replace("data:", "");

      if (
        file_type !== "image/png" &&
        file_type !== "image/jpeg" &&
        file_type !== "image/jpg" &&
        file_type !== "image/webp" &&
        file_type !== "image/gif"
      ) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Invalid file type."
        });
      }

      const buffer = Buffer.from(
        file.content.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({
          error: "invalid_request",
          message: "File size exceeds limit."
        });
      }

      let img = await sharp(buffer, {
        animated: true
      }).rotate();

      const img_metadata = await img.metadata();

      if (
        (img_metadata.width > 8000 || img_metadata.height > 8000) &&
        file_type !== "image/gif"
      ) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Image dimensions exceeds limit. (8000x8000 max)"
        });
      }

      img = await img.webp({ quality: 80 });

      const transformed_image_buffer = await img.toBuffer();

      const randomFileName = (randomUUID() + randomUUID()).replaceAll("-", "");

      const file_key = `attachments/${randomFileName}.webp`;

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

      const post = await prisma.post.create({
        data: {
          body,
          author_id: BigInt(req.user.id),
          reply_to_id: replying_to ? BigInt(replying_to) : undefined,
          attachments: {
            create: {
              type: "Image",
              url: process.env.CDN_URL
                ? `${process.env.CDN_URL}/${file_key}`
                : `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${file_key}`,
              width: img_metadata.width,
              height: img_metadata.height
            }
          }
        }
      });

      await generatePostMentions(post.id.toString(), body);

      await posthog.capture({
        distinctId: req.user.id.toString(),
        event: "post",
        properties: {
          post_id: post.id.toString(),
          ip_address:
            req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"],
          user_agent: req.headers["user-agent"],
          replying_to: replying_to ? replying_to : undefined,
          image: process.env.CDN_URL
            ? `${process.env.CDN_URL}/${file_key}`
            : `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${file_key}`,
          body: body
        }
      });

      if (replying_to) {
        const original_post = await prisma.post.findUnique({
          where: {
            id: BigInt(replying_to)
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                notifications_push_replied_to: true
              }
            }
          }
        });

        if (
          original_post.author.notifications_push_replied_to &&
          original_post.author_id !== user.id
        ) {
          await sendNotification(
            original_post.author.id,
            `Folks`,
            `${user.display_name} replied to your post: ${post.body.slice(
              0,
              20
            )}${post.body.length > 20 ? "..." : ""}`,
            `${process.env.NODE_ENV === "production" ? "https://folkscommunity.com" : process.env.DEV_URL}/${user.username}/${post.id}`
          );
        }
      }
    } else {
      const post = await prisma.post.create({
        data: {
          body,
          author_id: BigInt(req.user.id),
          reply_to_id: replying_to ? BigInt(replying_to) : undefined
        }
      });

      await generatePostMentions(post.id.toString(), body);

      await posthog.capture({
        distinctId: req.user.id.toString(),
        event: "post",
        properties: {
          post_id: post.id.toString(),
          ip_address:
            req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"],
          user_agent: req.headers["user-agent"],
          replying_to: replying_to ? replying_to : undefined,
          image: false,
          body: body
        }
      });

      if (replying_to) {
        const original_post = await prisma.post.findUnique({
          where: {
            id: BigInt(replying_to)
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                notifications_push_replied_to: true
              }
            }
          }
        });

        if (
          original_post.author.notifications_push_replied_to &&
          original_post.author_id !== user.id
        ) {
          await sendNotification(
            original_post.author.id,
            `Folks`,
            `${user.display_name} replied to your post: ${post.body.slice(
              0,
              20
            )}${post.body.length > 20 ? "..." : ""}`,
            `${process.env.NODE_ENV === "production" ? "https://folkscommunity.com" : process.env.DEV_URL}/${user.username}/${post.id}`
          );
        }
      }
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

router.get("/:id", async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;

    const folks_sid = req.cookies.folks_sid;

    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;
      }
    }

    const post = await prisma.post.findUnique({
      where: {
        id: BigInt(id),
        deleted_at: null
      },
      select: {
        id: true,
        body: true,
        reply_to: {
          select: {
            id: true,
            body: true,
            author: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true
              }
            }
          }
        },
        replies: {
          where: {
            deleted_at: null
          },
          orderBy: {
            created_at: "asc"
          },
          select: {
            id: true,
            created_at: true,
            body: true,
            reply_to: {
              select: {
                id: true,
                author: {
                  select: {
                    username: true,
                    display_name: true
                  }
                }
              }
            },
            attachments: {
              select: {
                id: true,
                url: true,
                type: true,
                height: true,
                width: true
              }
            },
            likes: user_id
              ? { where: { user_id: BigInt(user_id) } }
              : undefined,
            author: {
              select: {
                id: true,
                avatar_url: true,
                display_name: true,
                username: true
              }
            },
            _count: {
              select: {
                replies: {
                  where: {
                    deleted_at: null
                  }
                },
                likes: true
              }
            }
          }
        },
        attachments: {
          select: {
            id: true,
            url: true,
            type: true,
            height: true,
            width: true
          }
        },
        author: {
          select: {
            id: true,
            avatar_url: true,
            display_name: true,
            username: true
          }
        },
        created_at: true,
        likes: user_id ? { where: { user_id: BigInt(user_id) } } : undefined,
        _count: {
          select: {
            replies: {
              where: {
                deleted_at: null
              }
            },
            likes: true
          }
        }
      }
    });

    if (!post) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Post not found."
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        post: {
          ...post,
          id: post.id.toString(),
          author: {
            ...post.author,
            id: post.author.id.toString()
          },
          reply_to: post.reply_to
            ? {
                ...post.reply_to,
                id: post.reply_to.id.toString(),
                author: {
                  ...post.reply_to.author,
                  id: post.reply_to.author.id.toString()
                }
              }
            : {},
          replies: post.replies.map((reply) => ({
            ...reply,
            id: reply.id.toString(),
            author: {
              ...reply.author,
              id: reply.author.id.toString()
            },
            reply_to: {
              id: reply.reply_to?.id.toString(),
              author: reply.reply_to?.author
            },
            count: {
              replies: reply._count.replies.toString(),
              likes: reply._count.likes.toString()
            }
          })),
          likes: post.likes.map((like) => ({
            id: like.id.toString(),
            user_id: like.user_id.toString(),
            post_id: like.post_id.toString()
          })),
          count: {
            replies: post._count.replies.toString(),
            likes: post._count.likes.toString()
          }
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
});

async function getReplies(
  post_id: bigint,
  user_id: string | null,
  depth: number = 0,
  maxDepth: number = 5
) {
  // Stop recursion if we've reached max depth
  if (depth >= maxDepth) {
    return [];
  }

  const replies = await prisma.post.findMany({
    where: {
      reply_to_id: post_id,
      deleted_at: null
    },
    orderBy: {
      created_at: "asc"
    },
    select: {
      id: true,
      body: true,
      created_at: true,
      reply_to: {
        select: {
          id: true,
          author: {
            select: {
              username: true
            }
          }
        }
      },
      attachments: {
        select: {
          id: true,
          url: true,
          type: true,
          height: true,
          width: true
        }
      },
      author: {
        select: {
          id: true,
          avatar_url: true,
          display_name: true,
          username: true
        }
      },
      likes: user_id ? { where: { user_id: BigInt(user_id) } } : false,
      _count: {
        select: {
          replies: {
            where: {
              deleted_at: null
            }
          },
          likes: true
        }
      }
    }
  });

  // Recursively get replies for each reply with incremented depth
  const repliesWithNested = await Promise.all(
    replies.map(async (reply) => {
      const nestedReplies = await getReplies(
        reply.id,
        user_id,
        depth + 1,
        maxDepth
      );
      return {
        ...reply,
        id: reply.id.toString(),
        author: {
          ...reply.author,
          id: reply.author.id.toString()
        },
        reply_to: reply.reply_to
          ? {
              id: reply.reply_to.id.toString(),
              author: {
                username: reply.reply_to.author.username
              }
            }
          : null,
        likes:
          reply.likes &&
          reply.likes.map((like: any) => ({
            id: like.id.toString(),
            user_id: like.user_id.toString(),
            post_id: like.post_id.toString()
          })),
        replies: nestedReplies,
        depth: depth,
        count: {
          replies: reply._count.replies,
          likes: reply._count.likes
        }
      };
    })
  );

  return repliesWithNested;
}

router.get("/:id/thread", async (req, res) => {
  try {
    const { id } = req.params;

    const folks_sid = req.cookies.folks_sid;
    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);
      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);
      if (session) {
        user_id = jwt_object.id;
      }
    }

    const main_post = await prisma.post.findUnique({
      where: {
        id: BigInt(id),
        deleted_at: null
      }
    });

    if (!main_post) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Post not found."
      });
    }

    // Pass initial depth of 0 when calling getReplies
    const replies = await getReplies(main_post.id, user_id, 0);

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        replies
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

router.get("/:id/likes", async (req, res) => {
  try {
    const { id } = req.params;

    const folks_sid = req.cookies.folks_sid;

    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;
      }
    }

    const likes = await prisma.postLike.findMany({
      where: {
        post_id: BigInt(id)
      },
      select: {
        id: true,
        user_id: true,
        post_id: true,
        user: {
          select: {
            avatar_url: true,
            username: true,
            display_name: true
          }
        }
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        likes: likes.map((like) => ({
          ...like,
          id: like.id.toString(),
          user_id: like.user_id.toString(),
          post_id: like.post_id.toString()
        })),
        count: {
          likes: likes.length
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
});

router.post("/like", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { post_id } = req.body;

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

    if (user.suspended) {
      return res.status(401).json({
        error: "suspended",
        msg: "Your account is suspended."
      });
    }

    const post = await prisma.post.findUnique({
      where: {
        id: BigInt(post_id)
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            notifications_push_liked_posts: true
          }
        }
      }
    });

    if (!post) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Post not found."
      });
    }

    const like = await prisma.postLike.findFirst({
      where: {
        user_id: BigInt(req.user.id),
        post_id: BigInt(post_id)
      }
    });

    if (like) {
      return res.status(400).json({
        error: "already_liked",
        message: "You've already liked this post."
      });
    }

    await prisma.postLike.create({
      data: {
        user_id: BigInt(req.user.id),
        post_id: BigInt(post_id)
      }
    });

    await posthog.capture({
      distinctId: req.user.id.toString(),
      event: "like",
      properties: {
        post_id: post_id
      }
    });

    if (post.author.notifications_push_liked_posts) {
      await sendNotification(
        post.author.id,
        `Folks`,
        `${user.display_name} liked your post: ${post.body.slice(0, 20)}${post.body.length > 20 ? "..." : ""}`,
        `${process.env.NODE_ENV === "production" ? "https://folkscommunity.com" : process.env.DEV_URL}/${post.author.username}/${post_id}`
      );
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

router.delete("/like", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { post_id } = req.body;

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

    if (user.suspended) {
      return res.status(401).json({
        error: "suspended",
        msg: "Your account is suspended."
      });
    }

    const post = await prisma.post.findUnique({
      where: {
        id: BigInt(post_id)
      }
    });

    if (!post) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Post not found."
      });
    }

    const like = await prisma.postLike.findFirst({
      where: {
        user_id: BigInt(req.user.id),
        post_id: BigInt(post_id)
      }
    });

    if (!like) {
      return res.status(400).json({
        error: "not_liked",
        message: "You haven't liked this post."
      });
    }

    await prisma.postLike.delete({
      where: {
        id: like.id
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

router.delete("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;

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

    const post = await prisma.post.findUnique({
      where: {
        id: BigInt(id)
      }
    });

    if (!post) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Post not found."
      });
    }

    if (post.author_id !== user.id && !user.super_admin) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    // We're going to keep the post for 24 hours, and then delete it along with the likes, and the attachments.
    // TODO: Add the cron job to delete the post after 24 hours.
    await prisma.post.updateMany({
      where: {
        id: BigInt(id)
      },
      data: {
        deleted_at: new Date()
      }
    });

    await posthog.capture({
      distinctId: req.user.id.toString(),
      event: "delete_post",
      properties: {
        post_id: id
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

// admin only
router.post(
  "/highlight/:id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id),
          super_admin: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: "unauthorized"
        });
      }

      let post = await prisma.post.findUnique({
        where: {
          id: BigInt(id)
        }
      });

      if (!post) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Post not found."
        });
      }

      post = await prisma.post.update({
        where: {
          id: BigInt(id)
        },
        data: {
          highlighted: true
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

// admin only
router.delete(
  "/highlight/:id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id),
          super_admin: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: "unauthorized"
        });
      }

      const post = await prisma.post.findUnique({
        where: {
          id: BigInt(id)
        }
      });

      if (!post) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Post not found."
        });
      }

      await prisma.post.update({
        where: {
          id: BigInt(id)
        },
        data: {
          highlighted: false
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

export default router;
