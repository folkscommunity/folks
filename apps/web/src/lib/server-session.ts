import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { prisma } from "@folks/db";

import { redis } from "@/lib/redis";

export interface Session {
  user_id: bigint;
  ip: string;
  user_agent: string;
  created_at: string;
}

export interface UserWithoutSession {
  id: bigint;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  occupation?: string;
  location?: string;
  pronouns?: string;
  website?: string;
  super_admin?: boolean;
  email_verified: boolean;
  suspended?: boolean;
  notifications_last_read_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface User extends UserWithoutSession {
  session: Session;
}

export async function ServerSession(): Promise<User | false> {
  const session_token = (await cookies()).get("folks_sid");

  if (!session_token || !session_token.value) {
    return false;
  }

  const jwt_object = jwt.decode(session_token.value) as {
    id: string;
  };

  const session = await redis.get(
    `session:${jwt_object.id}:${session_token.value}`
  );

  if (!session) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: BigInt(jwt_object.id)
    }
  });

  if (!user) {
    return false;
  }

  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: user.email,
    avatar_url: user.avatar_url || undefined,
    occupation: user.occupation || undefined,
    location: user.location || undefined,
    pronouns: user.pronouns || undefined,
    website: user.website || undefined,
    email_verified: user.email_verified,
    suspended: user.suspended || undefined,
    created_at: user.created_at,
    updated_at: user.updated_at,
    super_admin: user.super_admin || undefined,
    notifications_last_read_at: user.notifications_last_read_at || undefined,
    session: JSON.parse(session)
  };
}
