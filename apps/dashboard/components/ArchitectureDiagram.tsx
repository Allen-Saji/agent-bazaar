"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  type Variants,
} from "framer-motion";

/* ── colour tokens (match globals.css) ── */
const C = {
  bg: "#000000",
  card: "#0a0a0a",
  border: "#1a1a1a",
  dim: "#444444",
  muted: "#666666",
  text: "#e8e8e8",
  accent: "#FFD700",
  accentGlow: "#FFED4A",
  success: "#00FF87",
  stellar: "#4A9EFF",
};

/* ── layout constants ── */
const W = 900;
const H = 520;

/* node positions (cx, cy) */
const nodes = {
  user:       { x: 140, y: 70,  label: "User / Agent",    sub: "" },
  orch:       { x: 450, y: 70,  label: "Orchestrator",     sub: "" },
  bazaar:     { x: 760, y: 70,  label: "Bazaar",           sub: "Registry" },
  search:     { x: 200, y: 310, label: "Search Agent",     sub: "$0.02" },
  summarize:  { x: 450, y: 310, label: "Summarize Agent",  sub: "$0.04" },
  sentiment:  { x: 700, y: 310, label: "Sentiment Agent",  sub: "$0.02" },
};

const nodeW = 160;
const nodeH = 60;

/* ── arrows (from → to, with label) ── */
type Arrow = {
  id: string;
  from: keyof typeof nodes;
  to: keyof typeof nodes;
  label?: string;
  delay: number;
};

const arrows: Arrow[] = [
  { id: "a1", from: "user",  to: "orch",      label: "x402 $",  delay: 0.6 },
  { id: "a2", from: "orch",  to: "bazaar",    label: "",         delay: 0.9 },
  { id: "a3", from: "orch",  to: "search",    label: "",         delay: 1.2 },
  { id: "a4", from: "orch",  to: "summarize", label: "",         delay: 1.3 },
  { id: "a5", from: "orch",  to: "sentiment", label: "",         delay: 1.4 },
];

/* ── helper: compute arrow start/end snapped to box edges ── */
function edgePoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  isStart: boolean
) {
  const src = isStart ? from : to;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDy > absDx) {
    // vertical-dominant
    return {
      x: src.x,
      y: src.y + (isStart ? (dy > 0 ? nodeH / 2 : -nodeH / 2) : (dy > 0 ? -nodeH / 2 : nodeH / 2)),
    };
  }
  // horizontal-dominant
  return {
    x: src.x + (isStart ? (dx > 0 ? nodeW / 2 : -nodeW / 2) : (dx > 0 ? -nodeW / 2 : nodeW / 2)),
    y: src.y,
  };
}

/* ── flowing dot along a line ── */
function FlowDot({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  return (
    <motion.circle
      r={3}
      fill={C.accent}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{
        cx: [x1, x2],
        cy: [y1, y2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: "easeInOut",
      }}
    >
      <animate
        attributeName="r"
        values="2;4;2"
        dur="2s"
        repeatCount="indefinite"
      />
    </motion.circle>
  );
}

/* ── node component ── */
const nodeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

function DiagramNode({
  x,
  y,
  label,
  sub,
  delay,
  isInView,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
  delay: number;
  isInView: boolean;
}) {
  const rx = x - nodeW / 2;
  const ry = y - nodeH / 2;

  return (
    <motion.g
      custom={delay}
      variants={nodeVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={{ cursor: "default" }}
    >
      {/* glow on hover (SVG filter applied via class) */}
      <rect
        x={rx}
        y={ry}
        width={nodeW}
        height={nodeH}
        rx={4}
        fill={C.card}
        stroke={C.border}
        strokeWidth={1}
        className="transition-all duration-200"
        style={{ filter: "none" }}
        onMouseEnter={(e) => {
          (e.target as SVGRectElement).setAttribute("stroke", C.accent);
          (e.target as SVGRectElement).style.filter = `drop-shadow(0 0 8px ${C.accent}44)`;
        }}
        onMouseLeave={(e) => {
          (e.target as SVGRectElement).setAttribute("stroke", C.border);
          (e.target as SVGRectElement).style.filter = "none";
        }}
      />
      <text
        x={x}
        y={sub ? y - 4 : y + 4}
        textAnchor="middle"
        fill={C.text}
        fontSize={12}
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight={600}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x}
          y={y + 16}
          textAnchor="middle"
          fill={C.accent}
          fontSize={11}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={500}
        >
          {sub}
        </text>
      )}
    </motion.g>
  );
}

/* ── main component ── */
export default function ArchitectureDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div className="w-full overflow-hidden">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxHeight: 520 }}
        role="img"
        aria-label="AgentBazaar architecture diagram showing how users interact with the orchestrator, bazaar, and specialist agents"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth={8}
            markerHeight={6}
            refX={7}
            refY={3}
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6" fill={C.accent} />
          </marker>
          <marker
            id="arrowhead-dim"
            markerWidth={8}
            markerHeight={6}
            refX={7}
            refY={3}
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6" fill={C.dim} />
          </marker>
          {/* glow filter for accents */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── background grid dots ── */}
        <g opacity={0.15}>
          {Array.from({ length: Math.floor(W / 40) }).map((_, i) =>
            Array.from({ length: Math.floor(H / 40) }).map((_, j) => (
              <circle
                key={`${i}-${j}`}
                cx={i * 40 + 20}
                cy={j * 40 + 20}
                r={0.5}
                fill={C.dim}
              />
            ))
          )}
        </g>

        {/* ── arrows ── */}
        {arrows.map((arrow) => {
          const from = nodes[arrow.from];
          const to = nodes[arrow.to];
          const start = edgePoint(from, to, true);
          const end = edgePoint(from, to, false);

          return (
            <g key={arrow.id}>
              {/* base dim line */}
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={C.dim}
                strokeWidth={1}
                strokeDasharray="4 4"
                markerEnd="url(#arrowhead-dim)"
              />
              {/* animated yellow line */}
              <motion.line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={C.accent}
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  isInView
                    ? { pathLength: 1, opacity: 1 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{
                  pathLength: { duration: 0.8, delay: arrow.delay, ease: "easeInOut" },
                  opacity: { duration: 0.3, delay: arrow.delay },
                }}
              />
              {/* label */}
              {arrow.label && (
                <motion.text
                  x={(start.x + end.x) / 2}
                  y={(start.y + end.y) / 2 - 10}
                  textAnchor="middle"
                  fill={C.accent}
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={500}
                  filter="url(#glow)"
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: [0.6, 1, 0.6] } : { opacity: 0 }}
                  transition={{
                    opacity: {
                      duration: 2,
                      delay: arrow.delay + 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  {arrow.label}
                </motion.text>
              )}
              {/* flowing dot */}
              {isInView && (
                <FlowDot
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  delay={arrow.delay + 1}
                />
              )}
            </g>
          );
        })}

        {/* ── "Plans pipeline" label ── */}
        <motion.text
          x={350}
          y={190}
          fill={C.muted}
          fontSize={10}
          fontFamily="'JetBrains Mono', monospace"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.7 } : { opacity: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          Plans pipeline
        </motion.text>

        {/* ── "Discovers agents" label ── */}
        <motion.text
          x={660}
          y={130}
          fill={C.muted}
          fontSize={10}
          fontFamily="'JetBrains Mono', monospace"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.7 } : { opacity: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          Discovers agents
        </motion.text>

        {/* ── nodes ── */}
        {(Object.entries(nodes) as [keyof typeof nodes, typeof nodes[keyof typeof nodes]][]).map(
          ([key, node], i) => (
            <DiagramNode
              key={key}
              x={node.x}
              y={node.y}
              label={node.label}
              sub={node.sub}
              delay={i * 0.12}
              isInView={isInView}
            />
          )
        )}

        {/* ── settlement bar at bottom ── */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 1.8, duration: 0.6 }}
        >
          {/* arrows from agents down */}
          {[nodes.search, nodes.summarize, nodes.sentiment].map((n, i) => (
            <g key={`settle-${i}`}>
              <line
                x1={n.x}
                y1={n.y + nodeH / 2}
                x2={n.x}
                y2={430}
                stroke={C.dim}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <motion.line
                x1={n.x}
                y1={n.y + nodeH / 2}
                x2={n.x}
                y2={430}
                stroke={C.stellar}
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  isInView
                    ? { pathLength: 1, opacity: 0.6 }
                    : { pathLength: 0, opacity: 0 }
                }
                transition={{ duration: 0.6, delay: 1.8 + i * 0.1 }}
              />
            </g>
          ))}
          {/* settlement bar */}
          <rect
            x={120}
            y={430}
            width={W - 240}
            height={44}
            rx={4}
            fill="transparent"
            stroke={C.stellar}
            strokeWidth={1}
            opacity={0.4}
          />
          <rect
            x={120}
            y={430}
            width={W - 240}
            height={44}
            rx={4}
            fill={C.stellar}
            opacity={0.06}
          />
          <text
            x={W / 2}
            y={448}
            textAnchor="middle"
            fill={C.stellar}
            fontSize={10}
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={600}
            letterSpacing={2}
          >
            USDC SETTLEMENT
          </text>
          <text
            x={W / 2}
            y={464}
            textAnchor="middle"
            fill={C.muted}
            fontSize={9}
            fontFamily="'JetBrains Mono', monospace"
          >
            Stellar Testnet
          </text>
        </motion.g>
      </svg>

      {/* mobile fallback label */}
      <p className="text-center text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono mt-4 md:hidden">
        Scroll horizontally to explore
      </p>
    </div>
  );
}
