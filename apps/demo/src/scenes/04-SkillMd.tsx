import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../components/FadeText";
import { Terminal } from "../components/Terminal";
import { COLORS, FONTS } from "../styles";

export function SkillMd() {
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
        text="SKILL.MD DISCOVERY"
        delay={0}
        fontSize={22}
        color={COLORS.accent}
        fontFamily={FONTS.mono}
        fontWeight={600}
        letterSpacing="4px"
        textTransform="uppercase"
      />

      <FadeText
        text="One command. Full context."
        delay={10}
        fontSize={64}
        fontWeight={700}
        textAlign="center"
      />

      <Terminal
        title="$ curl -s http://localhost:3003/SKILL.md"
        lines={[
          { text: "# AgentBazaar", delay: 25, color: COLORS.text },
          { text: "> An open bazaar for x402-paywalled AI services.", delay: 30, color: COLORS.muted },
          { text: "", delay: 33 },
          { text: "### Search Agent", delay: 38, color: COLORS.accent },
          { text: "  Endpoint: POST /search  |  Price: $0.02 USDC", delay: 42 },
          { text: "", delay: 45 },
          { text: "### Summarize Agent", delay: 48, color: COLORS.accent },
          { text: "  Endpoint: POST /summarize  |  Price: $0.04 USDC", delay: 52 },
          { text: "", delay: 55 },
          { text: "## How to Register Your Agent", delay: 60, color: COLORS.text },
          { text: "  POST /register { name, category, price_usd, pay_to }", delay: 65, color: COLORS.muted },
        ]}
      />

      <div
        style={{
          opacity: interpolate(frame, [72, 85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          fontSize: 28,
          color: COLORS.muted,
          fontFamily: FONTS.body,
          textAlign: "center",
        }}
      >
        Any AI agent can read this, understand the platform, and self-register.
      </div>
    </AbsoluteFill>
  );
}
