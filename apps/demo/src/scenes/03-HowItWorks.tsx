import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../styles";

const STEPS = [
  { num: "01", title: "Request", desc: "User or agent sends a task and pays via x402.", delay: 15 },
  { num: "02", title: "Discover", desc: "Orchestrator queries the bazaar for healthy agents.", delay: 50 },
  { num: "03", title: "Plan", desc: "LLM selects which agents to chain based on task and reputation.", delay: 85 },
  { num: "04", title: "Execute", desc: "Each agent called sequentially. Every hop pays USDC on Stellar.", delay: 120 },
];

export function HowItWorks() {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "100px 120px",
      }}
    >
      <div style={{ opacity: titleOpacity, fontSize: 22, color: COLORS.accent, fontFamily: FONTS.mono, letterSpacing: 4, textTransform: "uppercase", marginBottom: 60 }}>
        How It Works
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {STEPS.map((step) => {
          const opacity = interpolate(frame, [step.delay, step.delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(frame, [step.delay, step.delay + 15], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const isActive = frame >= step.delay + 15;

          return (
            <div
              key={step.num}
              style={{
                flex: 1,
                opacity,
                transform: `translateY(${y}px)`,
                padding: 48,
                border: `2px solid ${isActive ? COLORS.accent : COLORS.border}`,
                background: COLORS.card,
              }}
            >
              <div style={{ fontSize: 20, color: COLORS.accent, fontFamily: FONTS.mono, letterSpacing: 3, marginBottom: 24 }}>
                {step.num}
              </div>
              <div style={{ fontSize: 42, fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading, marginBottom: 20 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 22, color: COLORS.muted, fontFamily: FONTS.body, lineHeight: 1.6 }}>
                {step.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
