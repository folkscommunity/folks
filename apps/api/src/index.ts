import { createServer } from "http";
import Queue from "bull";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { Server, Socket } from "socket.io";
import throng from "throng";

import { prisma } from "@folks/db";

import { Sentry } from "./instrument";
import { redis, redis_sub } from "./lib/redis";
import admin_router from "./routes/admin";
import articles_router from "./routes/articles";
import auth_router from "./routes/auth";
import boards_router from "./routes/boards";
import feed_router from "./routes/feed";
import follow_router from "./routes/follow";
import messages_router from "./routes/messages";
import notifications_router from "./routes/notifications";
import post_router from "./routes/post";
import ribbon_router from "./routes/ribbon";
import roadmap_router from "./routes/roadmap";
import stickers_router from "./routes/stickers";
import support_router from "./routes/support";
import user_router from "./routes/user";
import whitelist_router from "./routes/whitelist";
import { workerThread } from "./worker";

dotenv.config({ path: "../../.env" });

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  path: "/ws",
  pingTimeout: 15000,
  pingInterval: 5000,
  serveClient: false,
  addTrailingSlash: false
});

interface SocketWithUser extends Socket {
  user: any;
}

function process_cookies(cookie_header: string) {
  const cookies = cookie_header.split(";").map((cookie) => {
    const parts = cookie.split("=");
    return {
      name: parts[0].trim(),
      value: parts[1].trim()
    };
  });
  return cookies;
}

async function mainThread() {
  // API
  console.log("Main thread started.");

  app.disable("x-powered-by");

  app.use(
    express.json({
      limit: "100mb"
    })
  );

  app.use(cookieParser());

  app.get("/", async (req, res) => {
    res.send("hello there :)");
  });

  app.get("/api", async (req, res) => {
    res.send("ok");
  });

  app.use("/api/auth", auth_router);
  app.use("/api/follow", follow_router);
  app.use("/api/feed", feed_router);
  app.use("/api/post", post_router);
  app.use("/api/whitelist", whitelist_router);
  app.use("/api/user", user_router);
  app.use("/api/ribbon", ribbon_router);
  app.use("/api/notifications", notifications_router);
  app.use("/api/support", support_router);
  app.use("/api/stickers", stickers_router);
  app.use("/api/messages", messages_router);
  app.use("/api/articles", articles_router);
  app.use("/api/boards", boards_router);
  app.use("/api/admin", admin_router);
  app.use("/api/roadmap", roadmap_router);

  io.use(async (socket: SocketWithUser | any, next) => {
    try {
      const auth_header = socket.handshake.headers.mobileauth;

      const folks_session =
        auth_header ||
        decodeURIComponent(
          process_cookies(socket.handshake.headers.cookie).filter((cookie) =>
            cookie.name.includes("folks_sid")
          )[0].value
        );

      const jwt_object: any = jwt.decode(folks_session);

      const session = await redis.get(
        `session:${jwt_object.id}:${folks_session}`
      );

      if (!session) {
        next(new Error("unauthorized"));
        return;
      }

      const user = {
        id: jwt_object?.id,
        session: JSON.parse(session),
        token: folks_session
      };

      socket.user = user;

      next();
    } catch (e) {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket: SocketWithUser) => {
    try {
      const user_id = socket.user.id.toString();

      socket.join("broadcast");
      socket.join("user:" + user_id);

      try {
        const user = await prisma.user.findUnique({
          where: {
            id: BigInt(user_id)
          },
          include: {
            message_channel_membership: true
          }
        });

        if (user.message_channel_membership) {
          for await (const channel of user.message_channel_membership) {
            socket.join("message_channel:" + channel.channel_id);
          }
        }
      } catch (e) {}

      try {
        await prisma.user.update({
          where: {
            id: socket.user.id
          },
          data: {
            last_ping: new Date()
          }
        });
      } catch (e) {}

      socket.conn.on("packet", async function (packet) {
        if (packet.type === "pong") {
          try {
            await prisma.user.update({
              where: {
                id: socket.user.id
              },
              data: {
                last_ping: new Date()
              }
            });
          } catch (e) {}
        }
      });
    } catch (e) {
      socket.disconnect(true);
    }
  });

  io.on("room_join", (data) => {
    console.log("socket data", data);
  });

  io.on("error", (err) => {
    console.log("socket error", err);
  });

  redis_sub.subscribe("socket", (err, count) => {
    if (err) {
      console.error("Failed to subscribe to the Redis 'socket' channel.", err);
    }
  });

  redis_sub.on("message", (c, message) => {
    if (c === "socket") {
      const parsed = JSON.parse(message);
      const channel = parsed.channel;
      const event = parsed.event;
      const data = parsed.data;

      io.to(channel).emit(event, data);
    }
  });

  const purge_deleted_posts = new Queue(
    "queue_purge_deleted_posts",
    process.env.REDIS_URL!
  );

  cron.schedule("0 * * * *", () => {
    purge_deleted_posts.add({});
  });

  Sentry.setupExpressErrorHandler(app);

  app.use(function onError(err, req, res, next) {
    console.error(err);

    res.statusCode = 500;

    res.json({
      error: "server_error",
      error_trace: res.sentry
    });
  });

  httpServer.listen(process.env.PORT || 3002, () => {
    console.log("API started!");
  });
}

throng({
  workers: 1,
  master: mainThread,
  worker: workerThread
});
