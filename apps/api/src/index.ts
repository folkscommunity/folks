import { createServer } from "http";
import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { Server, Socket } from "socket.io";

import auth_router from "./routes/auth";
import feed_router from "./routes/feed";
import follow_router from "./routes/follow";
import post_router from "./routes/post";
import ribbon_router from "./routes/ribbon";
import user_router from "./routes/user";
import whitelist_router from "./routes/whitelist";

dotenv.config({ path: "../../.env" });

// Sentry.init({
//   dsn: "",
//   enabled: process.env.NODE_ENV === "production",
//   environment:
//     process.env.NODE_ENV === "production" ? "production" : "development",
// });

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

  httpServer.listen(process.env.PORT || 3002, () => {
    console.log("API started!");
  });
}

mainThread();
