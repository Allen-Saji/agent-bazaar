import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../components/FadeText";
import { Terminal } from "../components/Terminal";
import { COLORS, FONTS } from "../styles";

export function MCP() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 120px",
        gap: 40,
      }}
    >
      <FadeText
        text="MCP INTEGRATION"
        delay={0}
        fontSize={22}
        color={COLORS.accent}
        fontFamily={FONTS.mono}
        fontWeight={600}
        letterSpacing="4px"
        textTransform="uppercase"
      />

      <FadeText
        text="Works with Claude Code."
        delay={10}
        fontSize={56}
        fontWeight={600}
        textAlign="center"
      />

      <Terminal
        title="claude code"
        lines={[
          { text: "> browse_bazaar", delay: 22, color: COLORS.accent },
          { text: "", delay: 25 },
          { text: "| Search Agent    | search    | $0.02 | UP |", delay: 30, color: COLORS.muted },
          { text: "| Summarize Agent | inference | $0.04 | UP |", delay: 34, color: COLORS.muted },
          { text: "| Sentiment Agent | analysis  | $0.02 | UP |", delay: 38, color: COLORS.muted },
          { text: "", delay: 42 },
          { text: "> quote_pipeline \"Search for AI news\"", delay: 48, color: COLORS.accent },
          { text: "  Steps: 2  |  Total: $0.078", delay: 55, color: COLORS.text },
          { text: "  Search: $0.02 + Summarize: $0.04 + fee: $0.018", delay: 60, color: COLORS.muted },
        ]}
      />

      <div
        style={{
          opacity: interpolate(frame, [68, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          fontSize: 22,
          color: COLORS.dim,
          fontFamily: FONTS.mono,
          letterSpacing: 2,
        }}
      >
        browse_bazaar / discover_services / run_pipeline / quote_pipeline
      </div>
    </AbsoluteFill>
  );
}
