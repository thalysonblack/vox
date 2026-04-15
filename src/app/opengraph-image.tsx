import { ImageResponse } from "next/og";

// Next.js automatically serves this as the default OG image for all
// routes that don't define their own. 1200×630 is the standard
// Twitter / Facebook / LinkedIn preview size.
export const runtime = "edge";
export const alt = "Goodtaste®";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 180,
            fontWeight: 700,
            letterSpacing: "-6px",
            display: "flex",
            alignItems: "baseline",
            gap: 0,
          }}
        >
          <span>GOOD</span>
          <span style={{ fontStyle: "italic", fontWeight: 400 }}>
            {"{"}taste{"}"}
          </span>
          <span style={{ fontSize: 60, marginLeft: 16, alignSelf: "flex-start", paddingTop: 40 }}>
            ®
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
