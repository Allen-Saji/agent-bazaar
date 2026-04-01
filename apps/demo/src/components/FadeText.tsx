import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../styles";

export function FadeText({
  text,
  delay = 0,
  fontSize = 64,
  color = COLORS.text,
  fontFamily = FONTS.heading,
  fontWeight = 600,
  letterSpacing,
  textTransform,
  maxWidth,
  textAlign,
}: {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: string;
  textTransform?: "uppercase" | "none";
  maxWidth?: number;
  textAlign?: "center" | "left";
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [delay, delay + 15], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        fontSize,
        color,
        fontFamily,
        fontWeight,
        letterSpacing,
        textTransform,
        maxWidth,
        lineHeight: 1.3,
        textAlign,
      }}
    >
      {text}
    </div>
  );
}
