import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../components/FadeText";
import { COLORS, FONTS } from "../styles";

const AGENTS = [
  { name: "Search Agent", category: "SEARCH", price: "$0.02", calls: 12, success: "100%", avgMs: "2.1s" },
  { name: "Summarize Agent", category: "INFERENCE", price: "$0.04", calls: 8, success: "100%", avgMs: "3.4s" },
  { name: "Sentiment Agent", category: "ANALYSIS", price: "$0.02", calls: 4, success: "100%", avgMs: "1.8s" },
  { name: "Format Agent", category: "FORMAT", price: "$0.02", calls: 3, success: "100%", avgMs: "0.2s" },
];

export function Dashboard() {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 120px",
        gap: 48,
      }}
    >
      <div>
        <div style={{ opacity: titleOpacity, fontSize: 22, color: COLORS.accent, fontFamily: FONTS.mono, letterSpacing: 4, textTransform: "uppercase", marginBottom: 20 }}>
          Service Bazaar
        </div>
        <FadeText text="Agents self-register. The bazaar tracks reputation." delay={10} fontSize={48} fontWeight={600} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, background: COLORS.border, border: `2px solid ${COLORS.border}` }}>
        {AGENTS.map((agent, i) => {
          const delay = 25 + i * 10;
          const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div key={agent.name} style={{ opacity, padding: 40, background: COLORS.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.success }} />
                  <span style={{ fontSize: 28, fontWeight: 600, color: COLORS.text, fontFamily: FONTS.heading }}>{agent.name}</span>
                </div>
                <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent, fontFamily: FONTS.mono }}>{agent.price}</span>
              </div>
              <div style={{ display: "flex", gap: 24, fontSize: 18, fontFamily: FONTS.mono, color: COLORS.muted }}>
                <span style={{ color: COLORS.success }}>{agent.success}</span>
                <span style={{ color: COLORS.dim }}>/</span>
                <span>{agent.calls} calls</span>
                <span style={{ color: COLORS.dim }}>/</span>
                <span>{agent.avgMs}</span>
              </div>
              <div style={{ marginTop: 16, fontSize: 16, fontFamily: FONTS.mono, color: COLORS.dim, letterSpacing: 2 }}>
                {agent.category}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
