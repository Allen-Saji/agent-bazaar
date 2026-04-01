import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../styles";

/*
  Single continuous terminal session simulating a real demo.
  Each "block" is a command + its output, timed to feel like
  someone is actually typing and watching results come in.
*/

interface Line {
  text: string;
  color?: string;
  frame: number; // absolute frame when this line appears
  bold?: boolean;
}

// Frame mapping: 30fps
// Each "section" has a command typed, then output appearing line by line
const LINES: Line[] = [
  // ─── Comment: what we're about to do ───
  { text: "# AgentBazaar Demo — all services running on localhost", frame: 10, color: COLORS.dim },
  { text: "", frame: 12 },

  // ─── 1. SKILL.md fetch ───
  { text: "$ curl -s http://localhost:3003/SKILL.md | head -15", frame: 30, color: COLORS.accent, bold: true },
  { text: "", frame: 38 },
  { text: "# AgentBazaar", frame: 45, color: COLORS.text, bold: true },
  { text: "> An open bazaar for x402-paywalled AI services.", frame: 50, color: COLORS.muted },
  { text: "> Agents discover, hire, and pay each other.", frame: 55, color: COLORS.muted },
  { text: "", frame: 58 },
  { text: "## What is AgentBazaar?", frame: 62, color: COLORS.text },
  { text: "AgentBazaar is a machine-to-machine marketplace where AI", frame: 67, color: COLORS.muted },
  { text: "agents register capabilities, discover other agents, and", frame: 70, color: COLORS.muted },
  { text: "pay for services using the x402 protocol.", frame: 73, color: COLORS.muted },
  { text: "Every API call settles USDC on the Stellar network.", frame: 76, color: COLORS.muted },
  { text: "", frame: 82 },

  // ─── 2. Browse bazaar catalog ───
  { text: "$ curl -s http://localhost:3001/catalog | jq '.[].name, .[].price_usd'", frame: 105, color: COLORS.accent, bold: true },
  { text: "", frame: 113 },
  { text: '  "Search Agent"       — $0.02  — search', frame: 120, color: COLORS.text },
  { text: '  "Summarize Agent"    — $0.04  — inference', frame: 126, color: COLORS.text },
  { text: '  "Sentiment Agent"    — $0.02  — analysis', frame: 132, color: COLORS.text },
  { text: '  "Format Agent"       — $0.02  — format', frame: 138, color: COLORS.text },
  { text: "", frame: 142 },
  { text: "  4 agents registered, all healthy", frame: 148, color: COLORS.success },
  { text: "", frame: 155 },

  // ─── 3. Get a price quote ───
  { text: "$ curl -s -X POST http://localhost:3002/task/quote \\", frame: 175, color: COLORS.accent, bold: true },
  { text: '    -d \'{"task": "Search for Stellar x402 news and summarize"}\'', frame: 178, color: COLORS.accent },
  { text: "", frame: 186 },
  { text: "  Pipeline planned: 2 steps", frame: 195, color: COLORS.text },
  { text: "  Step 1: Search Agent      $0.02", frame: 201, color: COLORS.muted },
  { text: "  Step 2: Summarize Agent   $0.04", frame: 207, color: COLORS.muted },
  { text: "  ─────────────────────────────────", frame: 213, color: COLORS.border },
  { text: "  Downstream:  $0.060", frame: 218, color: COLORS.muted },
  { text: "  Fee (30%):   $0.018", frame: 223, color: COLORS.muted },
  { text: "  Total:       $0.078", frame: 228, color: COLORS.accent },
  { text: "", frame: 236 },

  // ─── 4. Execute the pipeline (the big moment) ───
  { text: "$ npx tsx scripts/e2e-test.ts", frame: 260, color: COLORS.accent, bold: true },
  { text: "", frame: 268 },
  { text: "=== Full Pipeline Test ===", frame: 278, color: COLORS.text, bold: true },
  { text: "", frame: 282 },
  { text: "Sending task to orchestrator...", frame: 288, color: COLORS.muted },
  { text: "x402 payment: signing USDC transaction on Stellar...", frame: 300, color: COLORS.stellar },
  { text: "x402 payment: confirmed ✓", frame: 318, color: COLORS.success },
  { text: "", frame: 324 },
  { text: "Step 1: Search Agent", frame: 332, color: COLORS.text, bold: true },
  { text: "  x402 payment: $0.02 USDC → GC3FZW...F2L4", frame: 340, color: COLORS.accent },
  { text: "  Searching: \"Stellar x402 protocol news\"...", frame: 350, color: COLORS.muted },
  { text: "  3 results returned", frame: 368, color: COLORS.muted },
  { text: "  Status: completed (2.1s)", frame: 376, color: COLORS.success },
  { text: "  TX: 632ff282cd0a949ac514cd6c3f...e6ff84a4", frame: 382, color: COLORS.stellar },
  { text: "", frame: 390 },
  { text: "Step 2: Summarize Agent", frame: 398, color: COLORS.text, bold: true },
  { text: "  x402 payment: $0.04 USDC → GAKNAM...3HHA", frame: 406, color: COLORS.accent },
  { text: "  Summarizing search results...", frame: 416, color: COLORS.muted },
  { text: "  200-word summary generated", frame: 438, color: COLORS.muted },
  { text: "  Status: completed (3.4s)", frame: 446, color: COLORS.success },
  { text: "  TX: a088a7206e0304388f9219a4...57e7faa4", frame: 452, color: COLORS.stellar },
  { text: "", frame: 460 },
  { text: "=== Pipeline Complete ===", frame: 468, color: COLORS.text, bold: true },
  { text: "  Duration:    5.5s", frame: 476, color: COLORS.muted },
  { text: "  Agents:      $0.06", frame: 482, color: COLORS.muted },
  { text: "  Margin:      $0.02", frame: 488, color: COLORS.muted },
  { text: "  Total paid:  $0.08 USDC", frame: 494, color: COLORS.accent },
  { text: "", frame: 502 },
  { text: "  All payments settled on Stellar testnet.", frame: 508, color: COLORS.success },
  { text: "  Verify: https://stellar.expert/explorer/testnet/tx/632ff2...", frame: 516, color: COLORS.stellar },
  { text: "", frame: 528 },

  // ─── 5. Check reputation after run ───
  { text: "$ curl -s http://localhost:3001/services/search-agent/reputation", frame: 548, color: COLORS.accent, bold: true },
  { text: "", frame: 556 },
  { text: '  { "total_calls": 13, "successful_calls": 13,', frame: 564, color: COLORS.text },
  { text: '    "success_rate": 1.0, "avg_response_ms": 2100 }', frame: 568, color: COLORS.text },
  { text: "", frame: 576 },
  { text: "  Reputation updated. The bazaar learns.", frame: 584, color: COLORS.success },
];

// Compute visible window — auto-scroll as lines appear
const VISIBLE_LINES = 22;
const LINE_HEIGHT = 38;

export function TerminalDemo() {
  const frame = useCurrentFrame();

  // Find which lines are visible
  const visibleLines = LINES.filter((l) => frame >= l.frame);
  const totalVisible = visibleLines.length;

  // Auto-scroll: if more lines than fit, scroll
  const scrollOffset = Math.max(0, totalVisible - VISIBLE_LINES) * LINE_HEIGHT;

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      {/* Terminal chrome */}
      <div
        style={{
          margin: 40,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 12,
          overflow: "hidden",
          height: "calc(100% - 80px)",
          display: "flex",
          flexDirection: "column",
          fontFamily: FONTS.mono,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 24px",
            borderBottom: `2px solid ${COLORS.border}`,
            background: COLORS.bg,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ff5f56" }} />
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#27c93f" }} />
          </div>
          <span style={{ fontSize: 16, color: COLORS.dim, marginLeft: 12, letterSpacing: 1 }}>
            agent-bazaar — bash
          </span>
        </div>

        {/* Terminal content */}
        <div
          style={{
            flex: 1,
            padding: "24px 32px",
            overflow: "hidden",
            background: COLORS.card,
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `translateY(-${scrollOffset}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {LINES.map((line, i) => {
              const opacity = interpolate(
                frame,
                [line.frame, line.frame + 3],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );

              return (
                <div
                  key={i}
                  style={{
                    opacity,
                    height: LINE_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 20,
                    color: line.color || COLORS.muted,
                    fontWeight: line.bold ? 600 : 400,
                    whiteSpace: "pre",
                  }}
                >
                  {line.text}
                </div>
              );
            })}
          </div>

          {/* Blinking cursor */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: 32,
              width: 10,
              height: 22,
              background: COLORS.accent,
              opacity: Math.sin(frame * 0.15) > 0 ? 0.8 : 0,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}
