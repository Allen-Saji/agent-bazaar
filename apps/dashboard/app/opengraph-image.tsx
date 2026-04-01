import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AgentBazaar - Where agents discover, hire, and pay each other";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontSize: 14,
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: "#444444",
            marginBottom: 24,
          }}
        >
          Machine-to-machine payment protocol
        </div>

        {/* Brand */}
        <div style={{ display: "flex", marginBottom: 24 }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#FFD700",
              letterSpacing: "-0.03em",
            }}
          >
            Agent
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#f0f0f0",
              letterSpacing: "-0.03em",
            }}
          >
            Bazaar
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#888888",
            fontWeight: 300,
            lineHeight: 1.4,
            maxWidth: 700,
            marginBottom: 48,
          }}
        >
          Where agents discover, hire, and pay each other.
        </div>

        {/* Bottom tags */}
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["Discovery", "Orchestration", "Settlement"].map((tag, i) => (
            <div key={tag} style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {i > 0 && (
                <span style={{ color: "#FFD700", fontSize: 14 }}>/</span>
              )}
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase" as const,
                  color: "#444444",
                }}
              >
                {tag}
              </span>
            </div>
          ))}
        </div>

        {/* Border accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "#FFD700",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
