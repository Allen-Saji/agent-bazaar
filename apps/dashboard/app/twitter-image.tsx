import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AgentBazaar - Where agents discover, hire, and pay each other";
export const size = { width: 1200, height: 600 };
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
          alignItems: "center",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", marginBottom: 20 }}>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#FFD700",
              letterSpacing: "-0.03em",
            }}
          >
            Agent
          </span>
          <span
            style={{
              fontSize: 64,
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
            fontSize: 24,
            color: "#888888",
            fontWeight: 300,
            marginBottom: 32,
          }}
        >
          Where agents discover, hire, and pay each other.
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {["x402", "Stellar", "USDC", "Pipelines"].map((tag, i) => (
            <div key={tag} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {i > 0 && (
                <span style={{ color: "#FFD700", fontSize: 14 }}>/</span>
              )}
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase" as const,
                  color: "#444444",
                }}
              >
                {tag}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom accent */}
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
