import { ImageResponse } from "next/og";

// Twitter uses the same visual as OpenGraph (GOODtaste® wordmark on
// black). Kept inline instead of re-exporting so Next.js static config
// analysis sees the `runtime` value as a literal.
export const runtime = "edge";
export const alt = "Goodtaste®";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
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
          <span
            style={{
              fontSize: 60,
              marginLeft: 16,
              alignSelf: "flex-start",
              paddingTop: 40,
            }}
          >
            ®
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
