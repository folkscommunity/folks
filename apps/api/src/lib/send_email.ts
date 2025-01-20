import { randomUUID } from "crypto";

import { prisma } from "@folks/db";
import { renderInvite, renderVerifyEmail } from "@folks/email";

import { ses } from "./aws";

const url_base =
  process.env.NODE_ENV === "production"
    ? "https://folkscommunity.com"
    : "http://localhost:3000";

export async function sendVerifyEmail(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: BigInt(id),
      email_verified: false
    }
  });

  if (!user) {
    return;
  }

  const token = (randomUUID() + randomUUID()).replaceAll("-", "");

  await prisma.user.update({
    where: {
      id: BigInt(id)
    },
    data: {
      email_token: token
    }
  });

  const url = `${url_base}/api/auth/verify/${token}`;

  const emailHtml = await renderVerifyEmail(url, user.display_name);

  const params = {
    Source: "Folks <folks@folkscommunity.com>",
    Destination: {
      ToAddresses: [user.email]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: emailHtml
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Folks Account Verification"
      }
    }
  };

  await ses.sendEmail(params);

  return true;
}

export async function sendInviteEmail(email: string) {
  const whitelist_request = await prisma.whitelistRequest.findUnique({
    where: {
      email: email
    }
  });

  if (whitelist_request) {
    await prisma.whitelistRequest.update({
      where: {
        id: whitelist_request.id
      },
      data: {
        accepted_at: new Date()
      }
    });
  } else {
    await prisma.whitelistRequest.create({
      data: {
        email: email,
        name: email.split("@")[0],
        accepted_at: new Date()
      }
    });
  }

  const url = `${url_base}/register`;

  const emailHtml = await renderInvite(url);

  const params = {
    Source: "Folks <folks@folkscommunity.com>",
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: emailHtml
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "You've been invited to join Folks"
      }
    }
  };

  await ses.sendEmail(params);

  return true;
}
