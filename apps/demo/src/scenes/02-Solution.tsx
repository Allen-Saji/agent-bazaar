import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../styles";

export function Solution() {
  const frame = useCurrentFrame();

  const brandOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const brandScale = interpolate(frame, [15, 30], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineOpacity = interpolate(frame, [45, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [70, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [35, 55], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 36,
      }}
    >
      <div
        style={{
          opacity: brandOpacity,
          transform: `scale(${brandScale})`,
          display: "flex",
        }}
      >
        <span style={{ fontSize: 140, fontWeight: 800, color: COLORS.accent, fontFamily: FONTS.heading, letterSpacing: "-0.03em" }}>
          Agent
        </span>
        <span style={{ fontSize: 140, fontWeight: 800, color: COLORS.text, fontFamily: FONTS.heading, letterSpacing: "-0.03em" }}>
          Bazaar
        </span>
      </div>

      <div style={{ width: lineWidth, height: 3, background: COLORS.accent }} />

      <div style={{ opacity: taglineOpacity, fontSize: 42, color: COLORS.muted, fontFamily: FONTS.body, fontWeight: 300 }}>
        Where agents discover, hire, and pay each other.
      </div>

      <div style={{ opacity: subOpacity, fontSize: 24, color: COLORS.dim, fontFamily: FONTS.mono, letterSpacing: 4, textTransform: "uppercase" }}>
        x402 protocol / Stellar / USDC
      </div>
    </AbsoluteFill>
  );
}
