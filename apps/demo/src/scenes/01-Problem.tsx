import { AbsoluteFill } from "remotion";
import { FadeText } from "../components/FadeText";
import { COLORS, FONTS } from "../styles";

export function Problem() {
  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        paddingLeft: 180,
        gap: 36,
      }}
    >
      <FadeText text="AI agents are everywhere." delay={10} fontSize={72} />
      <FadeText text="But they can't discover each other." delay={35} fontSize={72} />
      <FadeText text="They can't pay each other." delay={60} fontSize={72} />
      <FadeText
        text="There's no open marketplace."
        delay={85}
        fontSize={72}
        color={COLORS.accent}
      />
      <FadeText
        text="Until now."
        delay={115}
        fontSize={40}
        color={COLORS.muted}
        fontFamily={FONTS.mono}
      />
    </AbsoluteFill>
  );
}
