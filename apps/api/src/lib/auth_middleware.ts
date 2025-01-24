import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { redis } from "./redis";

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    session?: any;
    token: string;
  };
}

export async function authMiddleware(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const folks_sid = req.cookies.folks_sid;

  try {
    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        req.user = {
          id: jwt_object?.id,
          session: JSON.parse(session),
          token: folks_sid
        };
      } else {
        res.clearCookie("folks_sid");

        await redis.del(`session:${jwt_object.id}:${folks_sid}`);

        return res.status(401).json({ error: "unauthorized" });
      }

      return next();
    } else {
      return res.status(401).json({ error: "unauthorized" });
    }
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "unauthorized" });
  }
}
