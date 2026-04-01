import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../styles";

interface TerminalLine {
  text: string;
  color?: string;
  delay: number;
  prefix?: string;
}

export function Terminal({
  lines,
  title = "terminal",
}: {
  lines: TerminalLine[];
  title?: string;
}) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "100%",
        border: `2px solid ${COLORS.border}`,
        background: COLORS.card,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: FONTS.mono,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 24px",
          borderBottom: `2px solid ${COLORS.border}`,
          background: COLORS.bg,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ff5f56" }} />
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#27c93f" }} />
        </div>
        <span style={{ fontSize: 18, color: COLORS.dim, marginLeft: 12, letterSpacing: 1 }}>
          {title}
        </span>
      </div>
      {/* Content */}
      <div style={{ padding: "28px 32px" }}>
        {lines.map((line, i) => {
          const opacity = interpolate(frame, [line.delay, line.delay + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                opacity,
                fontSize: 22,
                lineHeight: 2,
                color: line.color || COLORS.muted,
                display: "flex",
              }}
            >
              {line.prefix && (
                <span style={{ color: COLORS.accent, marginRight: 12 }}>{line.prefix}</span>
              )}
              <span>{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
