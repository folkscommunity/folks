import { createServer } from "http";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { Server, Socket } from "socket.io";
import throng from "throng";

import { Sentry } from "./instrument";
import auth_router from "./routes/auth";
import feed_router from "./routes/feed";
import follow_router from "./routes/follow";
import notifications_router from "./routes/notifications";
import post_router from "./routes/post";
import ribbon_router from "./routes/ribbon";
import stickers_router from "./routes/stickers";
import support_router from "./routes/support";
import user_router from "./routes/user";
import whitelist_router from "./routes/whitelist";
import { workerThread } from "./worker";

dotenv.config({ path: "../../.env" });

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  pingTimeout: 15000,
  pingInterval: 5000
});

async function mainThread() {
  // API
  console.log("Main thread started.");

  app.disable("x-powered-by");

  app.use(
    express.json({
      limit: "50mb"
    })
  );

  app.use(cookieParser());

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
