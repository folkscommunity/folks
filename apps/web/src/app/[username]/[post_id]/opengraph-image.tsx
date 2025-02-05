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

function calculateWidth(
  originalHeight: number,
  originalWidth: number,
  targetHeight: number
) {
  const ratio = originalHeight / originalWidth;

  return targetHeight * ratio;
}

export default async function Image({
  params
}: {
  params: Promise<{ post_id: string }>;
}) {
  const post_id = (await params).post_id;

  try {
    BigInt(post_id);
  } catch (e) {
    return new Response("Not found", { status: 404 });
  }

  const post = await prisma.post.findUnique({
    where: {
      id: BigInt(post_id)
    },
    include: {
      author: {
        select: {
          id: true,
          display_name: true,
          username: true,
          avatar_url: true
        }
      },
      attachments: true
    }
  });

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const user = post.author;

  const IBMPlexMonoRegularData = await readFile(
    join(process.cwd(), "public/fonts/IBMPlexMono-Regular.ttf")
  );

  const IBMPlexMonoBoldData = await readFile(
    join(process.cwd(), "public/fonts/IBMPlexMono-Bold.ttf")
  );

  const avatar = optimizedImageUrl(user.avatar_url || "", 200, 200);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          color: "white",
          width: "1200px",
          height: "675px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontFamily: "IBM Plex Mono",
          backgroundColor: "black",
          background:
            post.attachments && post.attachments.length > 0
              ? "black"
              : "url(https://media-assets.folkscommunity.com/brand/og-bg-main.png)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          padding: "50px",
          paddingBottom: "5px"
        }}
      >
        {post.attachments && post.attachments.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "675px",
              opacity: 0.2,
              background: `url(${optimizedImageUrl(post.attachments[0].url, 1200, 675)})`
            }}
          ></div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            width: "100%"
          }}
        >
          {user.avatar_url && (
            <img
              height="90"
              style={{
                borderRadius: 90
              }}
              src={avatar}
            />
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "0 10px"
            }}
          >
            <div>{user?.display_name}</div>
            <div
              style={{
                fontSize: 24,
                color: "#aaaaaa"
              }}
            >
              {"@" + user?.username}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <img
            height="50"
            src="https://media-assets.folkscommunity.com/brand/logo-white.png"
          />
        </div>
        <div style={{ flex: 1 }} />

        <pre
          style={{
            fontSize: 24,
            paddingTop: 20,
            width: "100%",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            height: "100%",
            fontWeight: 400
          }}
        >
          {post.body.replace(
            /[^\w.:/?!@#$%^&*()_+\-={[}\];:'"\\|,.<>`~§±\s]/g,
            ""
          )}
        </pre>

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
