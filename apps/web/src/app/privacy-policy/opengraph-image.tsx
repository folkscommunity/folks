import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 675
};

export const contentType = "image/png";

export default async function Image() {
  const ModernAntiquaRegularData = await readFile(
    join(process.cwd(), "public/fonts/ModernAntiqua-Regular.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 52,
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
          backgroundImage: `url(https://media-assets.folkscommunity.com/brand/og-bg-main.png)`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          padding: "50px"
        }}
      >
        <div style={{ flex: 1 }} />
        <img
          height="180"
          src="https://media-assets.folkscommunity.com/brand/logo-white.png"
        />
        <div
          style={{
            marginTop: 40
          }}
        >
          Privacy Policy
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
