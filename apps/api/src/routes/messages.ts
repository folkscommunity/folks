import { Router } from "express";

import { prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { sendNotification } from "@/lib/notification_utils";
import { sendToChannel, sendToUser } from "@/lib/socket";

const router = Router();

router.get("/channels", authMiddleware, async (req: RequestWithUser, res) => {
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

    const channel_memberships = await prisma.messageChannelMember.findMany({
      where: {
        user_id: BigInt(req.user.id)
      }
    });

    const channels = await prisma.messageChannel.findMany({
      where: {
        id: {
          in: channel_memberships.map((m) => m.channel_id)
        }
      },
      include: {
        members: {
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

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: channels
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
        id: BigInt(req.user.id)
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
        id: BigInt(target_id)
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
  "/channel/:channel_id",
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
          id: BigInt(req.user.id)
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
          user_id: BigInt(req.user.id)
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
          channel_id: channel_id
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
    const { channel_id, message } = req.body;

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

    if (!channel_id || !message) {
      res.status(400).json({
        error: "missing_parameters"
      });
      return;
    }

    const channel = await prisma.messageChannel.findUnique({
      where: {
        id: channel_id,
        members: {
          some: {
            user_id: user.id
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

    await prisma.message.create({
      data: {
        content: message,
        channel_id: channel.id,
        user_id: user.id,
        channel_member_id: member.id
      }
    });

    await sendToChannel(
      `message_channel:${channel.id.toString()}`,
      "messages:" + channel_id,
      {
        from: user.id.toString()
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
        if (
          !(
            new Date(member.last_read_at).getTime() >
            new Date().getTime() - 15000
          ) &&
          !member.muted
        ) {
          await sendNotification(
            member.user_id,
            user.display_name,
            message.toString().slice(0, 200),
            `https://folkscommunity.com/messages/${channel_id}`
          );
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

export default router;
