import { ImageResponse } from "next/og";

/** Default social share image — used when routes do not specify their own `openGraph.images`. */

export const alt = "49GIG — high-trust freelance marketplace for world-class African talent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg,#07122B 0%,#0f1f45 52%,#1a2856 100%)",
          fontFamily:
            "ui-sans-serif,system-ui,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
          }}
        >
          49GIG
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 40,
            fontWeight: 600,
            color: "#fec110",
            lineHeight: 1.18,
          }}
        >
          World-class African talent
        </div>
        <div
          style={{
            marginTop: 36,
            maxWidth: 880,
            fontSize: 30,
            color: "rgba(255,255,255,0.88)",
            lineHeight: 1.42,
          }}
        >
          Vetted freelancers for software engineering, AI, design, DevOps, data — hire with escrow and milestones.
        </div>
      </div>
    ),
    { ...size }
  );
}
