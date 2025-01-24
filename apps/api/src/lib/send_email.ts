import { randomUUID } from "crypto";

import { prisma } from "@folks/db";
import {
  renderInvite,
  renderPasswordResetConfirmation,
  renderPasswordResetRequest,
  renderVerifyEmail
} from "@folks/email";

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

  if (process.env.NODE_ENV === "production") {
    await ses.sendEmail(params);
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

  if (process.env.NODE_ENV === "production") {
    await ses.sendEmail(params);
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
  const params = {
    Source: "Folks <folks@folkscommunity.com>",
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: await renderPasswordResetRequest(`${url_base}/${url}`, name)
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Reset your password"
      }
    }
  };

  if (process.env.NODE_ENV === "production") {
    await ses.sendEmail(params);
  } else {
    console.log("PASSWORD RESET: ", email, name, url);
  }

  return true;
}

export async function sendPasswordResetConfirmation(
  email: string,
  name: string
) {
  const params = {
    Source: "Folks <folks@folkscommunity.com>",
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: await renderPasswordResetConfirmation(name)
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Reset your password"
      }
    }
  };

  if (process.env.NODE_ENV === "production") {
    await ses.sendEmail(params);
  } else {
    console.log("PASSWORD RESET CONFIRM: ", name);
  }

  return true;
}
