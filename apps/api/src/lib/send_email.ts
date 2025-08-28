import { randomUUID } from "crypto";

import { prisma } from "@folks/db";
import {
  renderInvite,
  renderPasswordResetConfirmation,
  renderPasswordResetRequest,
  renderVerifyEmail
} from "@folks/email";

import { resend } from "./resend";

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

  const token =
    user.email_token || (randomUUID() + randomUUID()).replaceAll("-", "");

  if (!user.email_token) {
    await prisma.user.update({
      where: {
        id: BigInt(id)
      },
      data: {
        email_token: token
      }
    });
  }

  const url = `${url_base}/verify/${token}`;

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "Folks <folks@hey.folkscommunity.com>",
      to: [user.email],
      subject: "Folks Account Verification",
      html: await renderVerifyEmail(url, user.display_name),
      replyTo: "support@folkscommunity.com"
    });
  } else {
    console.log("VERIFY EMAIL: ", user.email, url);
  }

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

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "Folks <folks@hey.folkscommunity.com>",
      to: [email],
      subject: "You've been invited to join Folks",
      html: await renderInvite(url),
      replyTo: "support@folkscommunity.com"
    });
  } else {
    console.log("INVITE: ", email);
  }

  return true;
}

export async function sendPasswordResetRequest(
  email: string,
  name: string,
  url: string
) {
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "Folks <folks@hey.folkscommunity.com>",
      to: [email],
      subject: "Reset your password",
      html: await renderPasswordResetRequest(`${url_base}/${url}`, name),
      replyTo: "support@folkscommunity.com"
    });
  } else {
    console.log("PASSWORD RESET: ", email, name, url);
  }

  return true;
}

export async function sendPasswordResetConfirmation(
  email: string,
  name: string
) {
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "Folks <folks@hey.folkscommunity.com>",
      to: [email],
      subject: "Your password was reset successfully",
      html: await renderPasswordResetConfirmation(name),
      replyTo: "support@folkscommunity.com"
    });
  } else {
    console.log("PASSWORD RESET CONFIRM: ", name);
  }

  return true;
}
