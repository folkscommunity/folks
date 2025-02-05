import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { prisma } from "@folks/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const username = (await params).username;

  const user = await prisma.user.findUnique({
    where: {
      username
    },
    select: {
      display_name: true,
      username: true,
      avatar_url: true,
      occupation: true,
      location: true,
      website: true
    }
  });

  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          color: "white",
          background: "black",
          width: "100%",
          height: "100%",
          padding: "50px 200px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <div>{user.display_name}</div>
        {/* <img
          width="256"
          height="256"
          src={user.avatar_url!}
          style={{
            borderRadius: 128
          }}
        /> */}
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
