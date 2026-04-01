import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../styles";

const FEATURES = [
  "SKILL.md Discovery",
  "x402 Payments",
  "LLM Planning",
  "Fallback Routing",
  "Reputation Tracking",
  "Dynamic Pricing",
  "MCP Integration",
];

export function Closing() {
  const frame = useCurrentFrame();

  const brandOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const closingOpacity = interpolate(frame, [80, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const githubOpacity = interpolate(frame, [100, 115], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 40,
      }}
    >
      {/* Features flash */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, maxWidth: 1200, marginBottom: 32 }}>
        {FEATURES.map((feat, i) => {
          const delay = 10 + i * 5;
          const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={feat}
              style={{
                opacity,
                padding: "14px 32px",
                border: `2px solid ${COLORS.accent}`,
                fontSize: 20,
                fontFamily: FONTS.mono,
                color: COLORS.accent,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {feat}
            </div>
          );
        })}
      </div>

      {/* Brand */}
      <div style={{ opacity: brandOpacity, display: "flex" }}>
        <span style={{ fontSize: 100, fontWeight: 800, color: COLORS.accent, fontFamily: FONTS.heading, letterSpacing: "-0.03em" }}>
          Agent
        </span>
        <span style={{ fontSize: 100, fontWeight: 800, color: COLORS.text, fontFamily: FONTS.heading, letterSpacing: "-0.03em" }}>
          Bazaar
        </span>
      </div>

      <div style={{ opacity: closingOpacity, fontSize: 40, color: COLORS.muted, fontFamily: FONTS.body, fontWeight: 300 }}>
        The bazaar is open.
      </div>

      <div style={{ opacity: githubOpacity, fontSize: 24, color: COLORS.dim, fontFamily: FONTS.mono }}>
        github.com/Allen-Saji/agent-bazaar
      </div>
    </AbsoluteFill>
  );
}
