import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Router } from "express";
import sharp from "sharp";

import { prisma } from "@folks/db";
import { JSONtoString, schemas } from "@folks/utils";

import { Sentry } from "@/instrument";
import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { s3 } from "@/lib/aws";
import { posthog } from "@/lib/posthog";

const router = Router();

router.post("/create", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      res.status(403).json({
        error: "forbidden"
      });
      return;
    }

    const { title, slug } = req.body;

    if (!title || !slug) {
      res.status(400).json({
        error: "invalid_request"
      });
      return;
    }

    try {
      await schemas.articleSlugSchema.parse(slug);
      await schemas.articleTitleSchema.parse(title);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        message: JSON.parse(err.message)[0].message
      });
    }

    const created_article = await prisma.article.create({
      data: {
        title,
        slug,
        author: {
          connect: {
            id: BigInt(user.id)
          }
        },
        published: false
      }
    });

    await posthog.capture({
      distinctId: req.user.id.toString(),
      event: "article_create",
      properties: {
        article_id: created_article.id,
        title,
        slug
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          id: created_article.id
        }
      })
    );
  } catch (e) {
    res.status(500).json({
      error: "server_error"
    });
  }
});

router.post(
  "/update/:article_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        res.status(403).json({
          error: "forbidden"
        });
        return;
      }

      const { article_id } = req.params;

      const article = await prisma.article.findUnique({
        where: {
          id: BigInt(article_id),
          author: {
            id: BigInt(user.id)
          }
        }
      });

      if (!article) {
        res.status(400).json({
          error: "invalid_request"
        });
        return;
      }

      const { title, slug, body, html_body } = req.body;

      if (!title && !slug && !body && !html_body) {
        res.status(400).json({
          error: "invalid_request"
        });
        return;
      }

      if (title) {
        try {
          await schemas.articleTitleSchema.parse(title);
        } catch (err) {
          return res.status(400).json({
            error: "invalid_request",
            message: JSON.parse(err.message)[0].message
          });
        }
      }

      if (slug) {
        try {
          await schemas.articleSlugSchema.parse(slug);
        } catch (err) {
          return res.status(400).json({
            error: "invalid_request",
            message: JSON.parse(err.message)[0].message
          });
        }
      }

      if (body && body.length > 1000000) {
        return res.status(400).json({
          error: "invalid_request",
          message: "The body is invalid."
        });
      }

      if (html_body && html_body.length > 1000000) {
        return res.status(400).json({
          error: "invalid_request",
          message: "The body is invalid."
        });
      }

      if ((html_body && !body) || (body && !html_body)) {
        return res.status(400).json({
          error: "invalid_request",
          message: "The body is invalid."
        });
      }

      await prisma.article.update({
        where: {
          id: BigInt(article_id)
        },
        data: {
          title,
          slug,
          body,
          html_body
        }
      });

      await posthog.capture({
        distinctId: req.user.id.toString(),
        event: "article_update",
        properties: {
          article_id: article_id,
          title,
          slug
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true
        })
      );
    } catch (e) {
      console.error(e);

      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.post(
  "/publish/:article_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        res.status(403).json({
          error: "forbidden"
        });
        return;
      }

      const { article_id } = req.params;

      const article = await prisma.article.findUnique({
        where: {
          id: BigInt(article_id),
          author: {
            id: BigInt(user.id)
          }
        }
      });

      if (!article) {
        res.status(400).json({
          error: "invalid_request"
        });
        return;
      }

      await prisma.article.update({
        where: {
          id: BigInt(article_id)
        },
        data: {
          published: true,
          published_at: new Date()
        }
      });

      await posthog.capture({
        distinctId: req.user.id.toString(),
        event: "article_publish",
        properties: {
          article_id: article_id,
          slug: article.slug
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true
        })
      );
    } catch (e) {
      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.post(
  "/unpublish/:article_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        res.status(403).json({
          error: "forbidden"
        });
        return;
      }

      const { article_id } = req.params;

      const article = await prisma.article.findUnique({
        where: {
          id: BigInt(article_id),
          author: {
            id: BigInt(user.id)
          }
        }
      });

      if (!article) {
        res.status(400).json({
          error: "invalid_request"
        });
        return;
      }

      await prisma.article.update({
        where: {
          id: BigInt(article_id)
        },
        data: {
          published: false
        }
      });

      await posthog.capture({
        distinctId: req.user.id.toString(),
        event: "article_unpublish",
        properties: {
          article_id: article_id
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true
        })
      );
    } catch (e) {
      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.delete(
  "/delete/:article_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        res.status(403).json({
          error: "forbidden"
        });
        return;
      }

      const { article_id } = req.params;

      const article = await prisma.article.findUnique({
        where: {
          id: BigInt(article_id),
          author: {
            id: BigInt(user.id)
          }
        }
      });

      if (!article) {
        res.status(400).json({
          error: "invalid_request"
        });
        return;
      }

      await prisma.article.update({
        where: {
          id: BigInt(article_id)
        },
        data: {
          deleted_at: new Date()
        }
      });

      await posthog.capture({
        distinctId: req.user.id.toString(),
        event: "article_delete",
        properties: {
          article_id: article_id
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true
        })
      );
    } catch (e) {
      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.post(
  "/attachment",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        res.status(403).json({
          error: "forbidden"
        });
        return;
      }

      const { article_id, file } = req.body;

      if (!article_id || !file) {
        res.status(400).json({
          error: "invalid_request"
        });
        return;
      }

      const article = await prisma.article.findUnique({
        where: {
          id: BigInt(article_id),
          author: {
            id: BigInt(user.id)
          }
        }
      });

      if (!article) {
        res.status(400).json({
          error: "invalid_request"
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          error: "invalid_request"
        });
      }

      const file_type = file.split(";")[0].replace("data:", "");

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
        file.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );

      if (buffer.length > 50 * 1024 * 1024) {
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
        (img_metadata.width > 8000 ||
          (img_metadata.pageHeight || img_metadata.height) > 8000) &&
        file_type !== "image/gif"
      ) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Image dimensions exceeds limit. (8000x8000 max)"
        });
      }

      img = await img.webp({ quality: 100 });

      const transformed_image_buffer = await img.toBuffer();

      const randomFileName = (randomUUID() + randomUUID()).replaceAll("-", "");

      const file_key = `articles/${randomFileName}.webp`;

      const s3_file = await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET!,
          Key: file_key,
          Body: transformed_image_buffer,
          Metadata: {
            "Uploaded-By-User": req.user.id.toString(),
            "Article-ID": article_id
          },
          ContentType: "image/webp",
          ACL: "public-read",
          CacheControl: "max-age=2592000" // 30 days
        })
      );

      if (s3_file.$metadata.httpStatusCode !== 200) {
        console.error("Error uploading file to S3.", s3_file);

        Sentry.captureException(s3_file, {
          user: {
            id: req.user.id.toString()
          }
        });

        return res.status(400).json({
          error: "invalid_request",
          message: "Something went wrong."
        });
      }

      const attachment = await prisma.articleAttachment.create({
        data: {
          article_id: BigInt(article_id),
          url: process.env.CDN_URL
            ? `${process.env.CDN_URL}/${file_key}`
            : `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${file_key}`,
          type: "Image"
        }
      });

      await posthog.capture({
        distinctId: req.user.id.toString(),
        event: "article_attachment_upload",
        properties: {
          article_id: article_id,
          attachment_id: attachment.id
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true,
          data: {
            url: attachment.url
          }
        })
      );
    } catch (e) {
      console.error(e);

      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.get("/user-feed/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(user_id)
      }
    });

    if (!user) {
      res.status(404).json({
        error: "not_found"
      });
      return;
    }

    const articles = await prisma.article.findMany({
      where: {
        author: {
          id: user.id
        },
        deleted_at: null,
        published: true,
        NOT: {
          body: null,
          html_body: null,
          published_at: null
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        articles: articles.map((article) => ({
          id: article.id,
          title: article.title,
          published: article.published_at,
          slug: article.slug
        }))
      })
    );
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error"
    });
  }
});

export default router;
