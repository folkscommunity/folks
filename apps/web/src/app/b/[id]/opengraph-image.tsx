import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

import { prisma } from "@folks/db";

export const size = {
  width: 1200,
  height: 675
};

export const contentType = "image/png";

export default async function Image({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  const board = await prisma.board.findUnique({
    where: {
      id: id,
      public: true
    },
    include: {
      user: {
        select: {
          username: true,
          display_name: true,
          avatar_url: true
        }
      }
    }
  });

  if (!board) {
    return notFound();
  }

  const ModernAntiquaRegularData = await readFile(
    join(process.cwd(), "public/fonts/ModernAntiqua-Regular.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: "black",
          color: "white",
          width: "1200px",
          height: "675px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontFamily: "Modern Antiqua",
          padding: "50px"
        }}
      >
        <div style={{ flex: 1 }} />
        <div
          style={{
            marginTop: 40,
            width: "90%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            display: "flex",
            justifyContent: "center",
            textAlign: "center"
          }}
        >
          {board.name}
        </div>

        <div style={{ flex: 1 }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Modern Antiqua",
          data: ModernAntiquaRegularData,
          style: "normal",
          weight: 400
        }
      ]
    }
  );
}
