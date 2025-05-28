import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { prisma } from "@folks/db";

import { optimizedImageUrl } from "@/lib/utils";

export const size = {
  width: 1200,
  height: 675
};

export const contentType = "image/png";

export default async function Image({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const username = (await params).username;

  const user = await prisma.user.findUnique({
    where: {
      username: username,
      deleted_at: null
    },
    select: {
      display_name: true,
      occupation: true,
      location: true,
      username: true,
      pronouns: true,
      website: true,
      avatar_url: true
    }
  });

  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  const IBMPlexMonoRegularData = await readFile(
    join(process.cwd(), "public/fonts/IBMPlexMono-Regular.ttf")
  );

  const IBMPlexMonoBoldData = await readFile(
    join(process.cwd(), "public/fonts/IBMPlexMono-Bold.ttf")
  );

  const avatar = optimizedImageUrl(user.avatar_url || "", 200, 200);

  const bio = `${user.occupation ? `${user.occupation}` : ""}${user.location ? `, ${user.location}` : ""}${user.pronouns ? `, ${user.pronouns}` : ""}`;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "black",
          color: "white",
          width: "1200px",
          height: "675px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontFamily: "IBM Plex Mono",
          backgroundImage: `url(https://media-assets.folkscommunity.com/brand/og-bg-main.png)`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          padding: "50px"
        }}
      >
        <img
          height="100"
          src="https://media-assets.folkscommunity.com/brand/logo-white.png"
        />

        <div style={{ flex: 1 }} />

        {user.avatar_url && (
          <img
            height="150"
            style={{
              borderRadius: 150
            }}
            src={avatar}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 10
          }}
        >
          <div>{user?.display_name}</div>
          <div
            style={{
              fontSize: 24,
              opacity: 0.5
            }}
          >
            {"@" + user?.username}
          </div>
          <div
            style={{
              fontSize: 24,
              paddingTop: 20
            }}
          >
            {bio}
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "IBM Plex Mono",
          data: IBMPlexMonoRegularData,
          style: "normal",
          weight: 400
        },
        {
          name: "IBM Plex Mono",
          data: IBMPlexMonoBoldData,
          style: "normal",
          weight: 700
        }
      ]
    }
  );
}
