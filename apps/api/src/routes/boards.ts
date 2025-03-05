import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import sharp from "sharp";

import { prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { Sentry } from "@/instrument";
import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { s3 } from "@/lib/aws";
import { redis } from "@/lib/redis";

const genid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 11);

const router = Router();

async function generate_id() {
  const id = genid();

  const board = await prisma.board.findUnique({
    where: {
      id: id
    }
  });

  if (board) {
    return generate_id();
  }

  return id;
}

router.get("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const boards = await prisma.board.findMany({
      where: {
        user_id: BigInt(req.user.id)
      },
      include: {
        _count: {
          select: {
            items: true
          }
        },
        items: {
          where: {
            type: "Image"
          },
          select: {
            id: true,
            url: true,
            width: true,
            height: true
          },
          orderBy: {
            created_at: "desc"
          },
          take: 4
        }
      },
      orderBy: {
        created_at: "asc"
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: boards.map((d) => {
          return {
            id: d.id,
            name: d.name,
            public: d.public,
            items: d.items,
            count: {
              items: d._count.items ?? 0
            }
          };
        })
      })
    );
  } catch (err) {
    Sentry.captureException(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post("/create", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const { name, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: "invalid_request" });
    }

    if (name.length > 46) {
      return res.status(400).json({ error: "name_too_long" });
    }

    const id = await generate_id();

    await prisma.board.create({
      data: {
        id: id,
        name: name,
        user_id: BigInt(req.user.id),
        public: isPublic ?? false
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true, data: { id: id } }));
  } catch (err) {
    Sentry.captureException(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/user/:user_id", async (req, res) => {
  try {
    const folks_sid = req.cookies.folks_sid;
    let user_id = null;
    let user = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;

        user = await prisma.user.findUnique({
          where: {
            id: BigInt(user_id)
          }
        });
      }
    }

    const boards = await prisma.board.findMany({
      where: {
        user_id: BigInt(req.params.user_id),
        public: true,
        items: {
          some: {
            type: "Image"
          }
        }
      },
      include: {
        items: {
          where: {
            type: "Image"
          },
          select: {
            id: true,
            url: true,
            width: true,
            height: true
          },
          orderBy: {
            created_at: "desc"
          },
          take: 1
        }
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true, data: boards }));
  } catch (err) {
    Sentry.captureException(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post(
  "/:board_id/upload",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        return res.status(400).json({ error: "invalid_request" });
      }

      const { board_id } = req.params;

      const board = await prisma.board.findUnique({
        where: {
          id: board_id,
          user_id: BigInt(req.user.id)
        }
      });

      if (!board) {
        return res.status(400).json({ error: "invalid_request" });
      }

      const { files } = req.body;

      if (!files || files.length === 0) {
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

      const file = files[0];

      const file_type = file.content.split(";")[0].replace("data:", "");

      console.log(file_type);

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

      if (buffer.length > 95 * 1024 * 1024) {
        return res.status(400).json({
          error: "invalid_request",
          message: "File size exceeds limit."
        });
      }

      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY
      ) {
        return res.status(400).json({
          error: "invalid_request",
          message: "AWS credentials not set. Image uploads are disabled."
        });
      }

      let img = await sharp(buffer, {
        animated: true
      }).rotate();

      const img_metadata = await img.metadata();

      if (
        (img_metadata.width > 10000 ||
          (img_metadata.pageHeight || img_metadata.height) > 10000) &&
        file_type !== "image/gif"
      ) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Image dimensions exceeds limit. (8000x8000 max)"
        });
      }

      let quality = 80;

      if (buffer.length < 5 * 1024 * 1024) {
        quality = 100;
      }

      img = await img.webp({ quality: quality });

      const transformed_image_buffer = await img.toBuffer();

      const randomFileName = (randomUUID() + randomUUID()).replaceAll("-", "");

      const file_key = `boards/${randomFileName}.webp`;

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

      await prisma.boardItem.create({
        data: {
          board_id: board.id,
          type: "Image",
          url: process.env.CDN_URL
            ? `${process.env.CDN_URL}/${file_key}`
            : `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${file_key}`,
          width: img_metadata.width,
          height: img_metadata.pageHeight || img_metadata.height
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(JSONtoString({ ok: true }));
    } catch (e) {
      Sentry.captureException(e);

      return res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.get("/:board_id/items", async (req, res) => {
  try {
    const folks_sid = req.cookies.folks_sid;
    let user_id = null;
    let user = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;

        user = await prisma.user.findUnique({
          where: {
            id: BigInt(user_id)
          }
        });
      }
    }

    const { board_id } = req.params;

    const board = await prisma.board.findUnique({
      where: {
        id: board_id,
        OR: user
          ? [
              {
                public: true
              },
              {
                user_id: BigInt(user.id)
              }
            ]
          : [
              {
                public: true
              }
            ]
      }
    });

    if (!board) {
      return res.status(400).json({
        error: "invalid_request"
      });
    }

    const items = await prisma.boardItem.findMany({
      where: {
        board_id: board.id
      },
      orderBy: {
        created_at: "desc"
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        items: items.map((item) => ({
          id: item.id.toString(),
          type: item.type,
          url: item.url,
          width: item.width,
          height: item.height,
          created_at: item.created_at
        }))
      })
    );
  } catch (e) {
    Sentry.captureException(e);

    return res.status(500).json({
      error: "server_error"
    });
  }
});

router.post(
  "/:board_id/edit",
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

      const { board_id } = req.params;

      const board = await prisma.board.findUnique({
        where: {
          id: board_id,
          user_id: BigInt(req.user.id)
        }
      });

      if (!board) {
        return res.status(400).json({
          error: "invalid_request"
        });
      }

      const { name, isPublic } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "invalid_request",
          msg: "You must provide a name."
        });
      }

      if (name.length > 46) {
        return res.status(400).json({
          error: "name_too_long"
        });
      }

      await prisma.board.update({
        where: {
          id: board_id
        },
        data: {
          name: name,
          public: isPublic ?? false
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

router.delete(
  "/:board_id/:item_id",
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

      const { board_id, item_id } = req.params;

      const board = await prisma.board.findUnique({
        where: {
          id: board_id,
          user_id: BigInt(req.user.id)
        }
      });

      if (!board) {
        return res.status(400).json({
          error: "invalid_request"
        });
      }

      const item = await prisma.boardItem.findUnique({
        where: {
          id: item_id
        }
      });

      if (!item) {
        return res.status(400).json({
          error: "invalid_request"
        });
      }

      const item_url_no_domain =
        "boards/" + item.url.split("/").slice(-1).join("/");

      console.log(item_url_no_domain);

      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET!,
          Key: item_url_no_domain
        })
      );

      await prisma.boardItem.delete({
        where: {
          id: item_id
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

router.delete(
  "/:board_id",
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

      const { board_id } = req.params;

      const board = await prisma.board.findUnique({
        where: {
          id: board_id,
          user_id: BigInt(req.user.id)
        }
      });

      if (!board) {
        return res.status(400).json({
          error: "invalid_request"
        });
      }

      const items = await prisma.boardItem.findMany({
        where: {
          board_id: board_id
        }
      });

      for await (const item of items) {
        const item_url_no_domain =
          "boards/" + item.url.split("/").slice(-1).join("/");

        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET!,
            Key: item_url_no_domain
          })
        );

        await prisma.boardItem.delete({
          where: {
            id: item.id
          }
        });
      }

      await prisma.board.delete({
        where: {
          id: board_id
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
