import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../components/FadeText";
import { Terminal } from "../components/Terminal";
import { COLORS, FONTS } from "../styles";

export function LiveDemo() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 120px",
        gap: 36,
      }}
    >
      <FadeText
        text="LIVE PIPELINE EXECUTION"
        delay={0}
        fontSize={22}
        color={COLORS.accent}
        fontFamily={FONTS.mono}
        fontWeight={600}
        letterSpacing="4px"
        textTransform="uppercase"
      />

      <FadeText
        text={'"Search for Stellar x402 and summarize"'}
        delay={8}
        fontSize={36}
        color={COLORS.muted}
        fontFamily={FONTS.body}
        fontWeight={300}
        textAlign="center"
      />

      <Terminal
        title="e2e-test.ts"
        lines={[
          { text: "Sending task to orchestrator...", delay: 18, color: COLORS.muted, prefix: "$" },
          { text: "x402 payment: $0.08 USDC on Stellar", delay: 28, color: COLORS.accent },
          { text: "", delay: 32 },
          { text: "Step 1: Search Agent  [$0.02]", delay: 36, color: COLORS.text },
          { text: "  Status: completed (2.1s)", delay: 42, color: COLORS.success },
          { text: "  TX: 632ff282cd0a...e6ff84a4", delay: 46, color: COLORS.stellar },
          { text: "", delay: 50 },
          { text: "Step 2: Summarize Agent  [$0.04]", delay: 54, color: COLORS.text },
          { text: "  Status: completed (3.4s)", delay: 60, color: COLORS.success },
          { text: "  TX: a088a720...57e7faa4", delay: 64, color: COLORS.stellar },
          { text: "", delay: 68 },
          { text: "Pipeline complete  |  5.5s  |  $0.06 agents  |  $0.02 margin", delay: 74, color: COLORS.accent },
        ]}
      />

      <div
        style={{
          opacity: interpolate(frame, [82, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          fontSize: 30,
          color: COLORS.accent,
          fontFamily: FONTS.mono,
          fontWeight: 600,
        }}
      >
        Real USDC. On-chain settlement. Verifiable on stellar.expert.
      </div>
    </AbsoluteFill>
  );
}
