import { createHash, randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import argon2 from "argon2";
import { Router } from "express";
import sharp from "sharp";

import { prisma } from "@folks/db";
import { JSONtoString, schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { s3 } from "@/lib/aws";
import { posthog } from "@/lib/posthog";

const router = Router();

router.patch("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { name, location, occupation, website, pronouns } = req.body;

    if (!name && !location && !occupation && !website && !pronouns) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide at least one field."
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

    if (user.suspended) {
      return res.status(401).json({
        error: "suspended",
        msg: "Your account is suspended."
      });
    }

    if (name) {
      try {
        await schemas.displayNameSchema.parseAsync(name);
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
        display_name: name,
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
        id: BigInt(req.user.id)
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

router.post("/avatar", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { files } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide an image."
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

    const file = files[0];

    const file_type = file.content.split(";")[0].replace("data:", "");

    if (
      file_type !== "image/png" &&
      file_type !== "image/jpeg" &&
      file_type !== "image/jpg" &&
      file_type !== "image/webp"
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

    const file_key = `avatars/${createHash("sha256").update(user.id.toString()).digest("hex")}.webp`;

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

    await prisma.user.update({
      where: {
        id: BigInt(req.user.id)
      },
      data: {
        avatar_url: process.env.CDN_URL
          ? `${process.env.CDN_URL}/${file_key}`
          : `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${file_key}?${new Date().getTime()}`
      }
    });

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
});

router.post(
  "/notification-preferences",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { push_reply, push_mention, push_follow, push_like } = req.body;

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
          notifications_push_liked_posts: push_like
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
            push_like: user.notifications_push_liked_posts
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

export default router;
