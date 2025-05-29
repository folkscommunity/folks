import { randomUUID } from "crypto";
import crypto from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";

import { prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { Sentry } from "@/instrument";
import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { s3 } from "@/lib/aws";
import {
  sendMobileNotification,
  sendNotification
} from "@/lib/notification_utils";
import { sendToChannel } from "@/lib/socket";

const router = Router();

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const upload = multer({
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

// Error handling middleware for multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "file_too_large",
        message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "too_many_files",
        message: "Only one file is allowed per request"
      });
    }
  } else if (err) {
    // Handle other errors
    return res.status(400).json({
      error: "file_upload_error",
      message: err.message || "Error uploading file"
    });
  }
  next();
};

// Upload attachment for a message
router.post(
  "/attachment",
  authMiddleware,
  upload.single("file"),
  handleMulterError,
  async (req: RequestWithUser, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: "no_file_provided"
        });
      }

      // Additional file validation (redundant but safe)
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({
          error: "invalid_file_type",
          message: "Only image files are allowed"
        });
      }

      // Process image and convert to JPG
      let processedImage: Buffer;
      let width: number | null = null;
      let height: number | null = null;

      try {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();
        width = metadata.width || null;
        height = metadata.height || null;

        // Convert to JPG with quality 85%
        processedImage = await image
          .jpeg({ quality: 85, mozjpeg: true })
          .toBuffer();
      } catch (e) {
        console.error("Error processing image:", e);
        return res.status(400).json({
          error: "image_processing_error",
          message: "Failed to process the image"
        });
      }

      // Generate a unique filename with .jpg extension
      const filename = `${crypto.randomBytes(32).toString("hex")}.jpg`;
      const key = `chats/${filename}`;

      const s3_file = await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET!,
          Key: key,
          Body: processedImage,
          ContentType: "image/jpeg",
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

      const attachment = await prisma.messageAttachment.create({
        data: {
          user_id: BigInt(req.user.id),
          url: process.env.CDN_URL
            ? `${process.env.CDN_URL}/${key}`
            : `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${key}`,
          type: "Image", // Only images are allowed
          width: width,
          height: height
        }
      });

      res.json({
        ok: true,
        data: {
          id: attachment.id,
          url: attachment.url,
          type: attachment.type,
          width: attachment.width,
          height: attachment.height
        }
      });
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
      res.status(500).json({
        error: "failed_to_upload_attachment"
      });
    }
  }
);

router.get("/channels", authMiddleware, async (req: RequestWithUser, res) => {
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

    const blocked_users = await prisma.userBlocked.findMany({
      where: {
        user_id: BigInt(req.user.id)
      }
    });

    const channel_memberships = await prisma.messageChannelMember.findMany({
      where: {
        user_id: BigInt(req.user.id)
      }
    });

    const channels = await prisma.messageChannel.findMany({
      where: {
        id: {
          in: channel_memberships.map((m) => m.channel_id)
        },
        members: {
          every: {
            user_id: {
              notIn: blocked_users.map((u) => u.target_id)
            }
          }
        }
      },
      include: {
        members: {
          where: {
            user: {
              deleted_at: null
            }
          },
          select: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true
              }
            },
            last_read_at: true
          }
        },

        messages: {
          orderBy: {
            created_at: "desc"
          },
          include: {
            attachments: {
              select: {
                id: true,
                url: true,
                type: true,
                width: true,
                height: true
              }
            }
          },
          take: 1
        },
        _count: {
          select: {
            messages: true,
            members: true
          }
        }
      }
    });

    const filtered_channels = channels.filter((c) => {
      if (c.messages.length === 0) {
        return false;
      } else {
        return true;
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: filtered_channels
      })
    );
  } catch (e) {
    res.status(500).json({
      error: "server_error"
    });
  }
});

router.post("/channel", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { target_id } = req.body;

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

    if (!target_id) {
      res.status(400).json({
        error: "missing_target_id"
      });
      return;
    }

    if (target_id.toString() === user.id.toString()) {
      res.status(400).json({
        error: "cannot_message_self"
      });
      return;
    }

    const target_user = await prisma.user.findUnique({
      where: {
        id: BigInt(target_id),
        deleted_at: null
      }
    });

    if (!target_user) {
      res.status(400).json({
        error: "invalid_target_id"
      });
      return;
    }

    const channels_with_both_users = await prisma.messageChannel.findMany({
      where: {
        AND: [
          {
            members: {
              some: {
                user_id: user.id
              }
            }
          },
          {
            members: {
              some: {
                user_id: target_user.id
              }
            }
          }
        ]
      }
    });

    if (channels_with_both_users.length > 0) {
      res.status(400).json({
        ok: true,
        data: {
          channel_id: channels_with_both_users[0].id
        }
      });
      return;
    }

    const new_channel = await prisma.messageChannel.create({
      data: {
        members: {
          create: [
            {
              user_id: BigInt(req.user.id)
            },
            {
              user_id: BigInt(target_id)
            }
          ]
        }
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          channel_id: new_channel.id
        }
      })
    );
  } catch (e) {
    res.status(500).json({
      error: "server_error"
    });
  }
});

router.get(
  "/channel/:username",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { username } = req.params;

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id),
          deleted_at: null
        }
      });

      if (!user) {
        res.redirect(302, "/messages");
        return;
      }

      if (!username) {
        res.redirect(302, "/messages");
        return;
      }

      if (username.toString() === user.username) {
        res.redirect(302, "/messages");
        return;
      }

      const target_user = await prisma.user.findUnique({
        where: {
          username: username.toString(),
          deleted_at: null
        }
      });

      if (!target_user) {
        res.redirect(302, "/messages");
        return;
      }

      const channels_with_both_users = await prisma.messageChannel.findMany({
        where: {
          AND: [
            {
              members: {
                some: {
                  user_id: user.id
                }
              }
            },
            {
              members: {
                some: {
                  user_id: target_user.id
                }
              }
            }
          ]
        }
      });

      if (channels_with_both_users.length > 0) {
        res.redirect(302, `/messages/${channels_with_both_users[0].id}`);
        return;
      }

      const new_channel = await prisma.messageChannel.create({
        data: {
          members: {
            create: [
              {
                user_id: BigInt(user.id)
              },
              {
                user_id: BigInt(target_user.id)
              }
            ]
          }
        }
      });

      res.redirect(302, `/messages/${new_channel.id}`);
    } catch (e) {
      res.redirect(302, "/messages");
    }
  }
);

router.get(
  "/get_channel/:channel_id",
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

      const { channel_id } = req.params;

      if (!channel_id) {
        res.status(400).json({
          error: "missing_channel_id"
        });
        return;
      }

      const channel = await prisma.messageChannel.findUnique({
        where: {
          id: channel_id,
          members: {
            some: {
              user_id: BigInt(req.user.id)
            }
          }
        },
        include: {
          members: {
            where: {
              user: {
                deleted_at: null
              }
            },
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                  display_name: true,
                  avatar_url: true
                }
              },
              muted: true,
              last_read_at: true
            }
          },
          messages: {
            orderBy: {
              created_at: "desc"
            },
            take: 1,
            include: {
              attachments: {
                select: {
                  id: true,
                  url: true,
                  type: true,
                  width: true,
                  height: true,
                  created_at: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: true,
              members: true
            }
          }
        }
      });

      if (!channel) {
        res.status(404).json({
          error: "channel_not_found"
        });
        return;
      }

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true,
          data: channel
        })
      );
    } catch (e) {
      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.get(
  "/messages/:channel_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { channel_id } = req.params;
      const { cursor, limit }: any = req.query;

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

      const membership = await prisma.messageChannelMember.findFirst({
        where: {
          channel_id: channel_id,
          user_id: BigInt(req.user.id),
          user: {
            deleted_at: null
          }
        }
      });

      if (!membership) {
        res.status(403).json({
          error: "forbidden"
        });
        return;
      }

      const messages = await prisma.message.findMany({
        where: {
          channel_id: channel_id,
          user: {
            deleted_at: null
          }
        },
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        take: limit ? Number(limit) : 50,
        orderBy: {
          created_at: "desc"
        },
        select: {
          id: true,
          content: true,
          edited_at: true,
          created_at: true,
          attachments: {
            select: {
              id: true,
              url: true,
              type: true,
              width: true,
              height: true,
              created_at: true
            }
          },
          user: {
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
          data: messages,
          nextCursor:
            messages.length > 0
              ? messages[messages.length - 1].id.toString()
              : undefined
        })
      );
    } catch (e) {
      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.post("/message", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { channel_id, message, attachment_ids } = req.body;

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

    if (!channel_id) {
      res.status(400).json({
        error: "missing_parameters",
        message: "Channel ID is required"
      });
      return;
    }

    // Either message or attachments must be provided
    if (!message && (!attachment_ids || attachment_ids.length === 0)) {
      res.status(400).json({
        error: "missing_parameters",
        message: "Either message text or attachments are required"
      });
      return;
    }

    const blocked_users = await prisma.userBlocked.findMany({
      where: {
        target_id: BigInt(req.user.id)
      }
    });

    const channel = await prisma.messageChannel.findUnique({
      where: {
        id: channel_id
      }
    });

    if (!channel) {
      res.status(404).json({
        error: "channel_not_found"
      });
      return;
    }

    const member = await prisma.messageChannelMember.findFirst({
      where: {
        channel_id: channel.id,
        user_id: user.id
      }
    });

    if (!member) {
      res.status(403).json({
        error: "forbidden"
      });
      return;
    }

    // Validate attachments if any
    let attachments = [];

    if (
      attachment_ids &&
      Array.isArray(attachment_ids) &&
      attachment_ids.length > 0
    ) {
      // Validate number of attachments
      if (attachment_ids.length > 10) {
        return res.status(400).json({
          error: "too_many_attachments",
          message: "Maximum 10 attachments allowed per message"
        });
      }

      // Verify all attachments exist and belong to the user
      const attachmentsCount = await prisma.messageAttachment.count({
        where: {
          id: { in: attachment_ids },
          user_id: user.id,
          message_id: null // Only allow unattached files
        }
      });

      if (attachmentsCount !== attachment_ids.length) {
        return res.status(400).json({
          error: "invalid_attachments",
          message: "One or more attachments are invalid or already used"
        });
      }

      attachments = attachment_ids;
    }

    // Create the message with attachments
    await prisma.$transaction(async (prisma) => {
      const newMessage = await prisma.message.create({
        data: {
          content: message,
          channel_id: channel.id,
          user_id: user.id,
          channel_member_id: member.id
        }
      });

      // Update attachments with the message ID
      if (attachments.length > 0) {
        await prisma.messageAttachment.updateMany({
          where: {
            id: { in: attachments },
            user_id: user.id
          },
          data: {
            message_id: newMessage.id
          }
        });
      }

      return newMessage;
    });

    await sendToChannel(
      `message_channel:${channel.id.toString()}`,
      "messages:" + channel_id,
      {
        from: user.id.toString()
      }
    );

    await sendToChannel(
      `message_channel:${channel.id.toString()}`,
      "messages",
      {
        channel_id: channel_id,
        from: user.id.toString(),
        content: message
      }
    );

    const other_members = await prisma.messageChannelMember.findMany({
      where: {
        channel_id: channel_id,
        user_id: {
          not: user.id
        }
      }
    });

    try {
      for await (const member of other_members) {
        if (blocked_users.map((u) => u.user_id).includes(member.user_id)) {
          continue;
        }

        if (
          !(
            new Date(member.last_read_at).getTime() >
            new Date().getTime() - 15000
          ) &&
          !member.muted
        ) {
          await sendNotification({
            user_id: member.user_id,
            title: "Folks",
            body: `${user.display_name} sent you a message: ${message.toString().slice(0, 500)}`,
            url: `/messages/${channel_id}`
          });

          let image_url;

          if (attachments.length > 0) {
            try {
              const get_attachment = await prisma.messageAttachment.findFirst({
                where: {
                  id: attachments[0]
                }
              });

              image_url = get_attachment?.url;
            } catch (e) {
              console.error(e);
            }
          }

          await sendMobileNotification({
            user_id: member.user_id,
            title: `${user.display_name}`,
            body: message
              ? message.toString()
              : image_url
                ? attachment_ids.length > 1
                  ? `sent you ${attachment_ids.length} images`
                  : `sent you an image`
                : null,
            url: `/messages/${channel_id}`,
            thread_id: "messages-" + channel_id,
            sender_id: "folks-" + user.username.toString(),
            sender_name: user.display_name,
            sender_avatar_url: user.avatar_url,
            channel_id: "messages-" + channel_id,
            image_url: image_url ?? null
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

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
});

router.get(
  "/muted/:channel_id",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { channel_id } = req.params;
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

      const member = await prisma.messageChannelMember.findFirst({
        where: {
          channel_id: channel_id,
          user_id: user.id
        }
      });

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true,
          data: {
            muted: member.muted || false
          }
        })
      );
    } catch (e) {
      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

router.patch("/muted", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { channel_id, muted } = req.body;

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

    await prisma.messageChannelMember.updateMany({
      where: {
        channel_id: channel_id,
        user_id: user.id
      },
      data: {
        muted: muted
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
});

router.post("/read", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { channel_id } = req.body;

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

    await prisma.messageChannelMember.updateMany({
      where: {
        channel_id: channel_id,
        user_id: user.id
      },
      data: {
        last_read_at: new Date()
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
});

router.get(
  "/unread-count",
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
      const blocked_users = await prisma.userBlocked.findMany({
        where: {
          user_id: BigInt(req.user.id)
        }
      });

      const channels = await prisma.messageChannel.findMany({
        where: {
          members: {
            every: {
              user_id: {
                notIn: blocked_users.map((u) => u.target_id)
              }
            },
            some: {
              user_id: user.id
            }
          }
        },
        include: {
          messages: {
            where: {
              NOT: {
                user_id: user.id
              }
            },
            orderBy: {
              created_at: "desc"
            },
            take: 1
          },
          members: {
            where: {
              user_id: user.id
            }
          }
        }
      });

      const unread_channels = channels.filter((c) => {
        const last_message = c.messages[0];
        const member_last_read_at = c.members[0].last_read_at;

        return (
          last_message &&
          member_last_read_at &&
          new Date(member_last_read_at).getTime() <
            new Date(last_message.created_at).getTime()
        );
      });

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true,
          data: {
            unread_channels: unread_channels?.length || 0
          }
        })
      );
    } catch (e) {
      res.status(500).json({
        error: "server_error"
      });
    }
  }
);

export default router;
