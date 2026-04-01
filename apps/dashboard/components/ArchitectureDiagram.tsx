"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  type Variants,
} from "framer-motion";

const C = {
  bg: "#000000",
  card: "#0a0a0a",
  border: "#1a1a1a",
  dim: "#444444",
  muted: "#666666",
  text: "#e8e8e8",
  accent: "#FFD700",
  accentGlow: "#FFED4A",
  stellar: "#4A9EFF",
};

const W = 920;
const H = 560;
const nodeW = 150;
const nodeH = 52;

const nodes = {
  user:    { x: 100, y: 80,  label: "User / Agent",     sub: "" },
  orch:    { x: 380, y: 80,  label: "Orchestrator",      sub: "x402 paywalled" },
  bazaar:  { x: 700, y: 80,  label: "Bazaar Registry",   sub: "Free to query" },
  llm:     { x: 380, y: 210, label: "LLM Planner",       sub: "GPT-4o-mini" },
  agentA:  { x: 180, y: 370, label: "Agent A",           sub: "$" },
  agentB:  { x: 460, y: 370, label: "Agent B",           sub: "$" },
  agentN:  { x: 740, y: 370, label: "Agent N",           sub: "$" },
};

type NodeKey = keyof typeof nodes;

interface Arrow {
  id: string;
  from: NodeKey;
  to: NodeKey;
  label?: string;
  delay: number;
  dashed?: boolean;
  color?: string;
  bidirectional?: boolean;
}

const arrows: Arrow[] = [
  { id: "a1", from: "user",   to: "orch",   label: "x402 $",         delay: 0.5 },
  { id: "a2", from: "orch",   to: "bazaar", label: "discover",       delay: 0.8, bidirectional: true },
  { id: "a3", from: "orch",   to: "llm",    label: "plan",           delay: 1.1 },
  { id: "a4", from: "orch",   to: "agentA", label: "x402 $",         delay: 1.5 },
  { id: "a5", from: "orch",   to: "agentB", label: "x402 $",         delay: 1.7 },
  { id: "a6", from: "orch",   to: "agentN", label: "x402 $",         delay: 1.9 },
  // chaining arrows between agents
  { id: "c1", from: "agentA", to: "agentB", label: "output",         delay: 2.2, color: C.muted },
  { id: "c2", from: "agentB", to: "agentN", label: "output",         delay: 2.4, color: C.muted },
];

function edgePoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  isStart: boolean,
) {
  const src = isStart ? from : to;
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dy) > Math.abs(dx)) {
    return {
      x: src.x,
      y: src.y + (isStart ? (dy > 0 ? nodeH / 2 : -nodeH / 2) : (dy > 0 ? -nodeH / 2 : nodeH / 2)),
    };
  }
  return {
    x: src.x + (isStart ? (dx > 0 ? nodeW / 2 : -nodeW / 2) : (dx > 0 ? -nodeW / 2 : nodeW / 2)),
    y: src.y,
  };
}

function FlowDot({ x1, y1, x2, y2, delay, color }: { x1: number; y1: number; x2: number; y2: number; delay: number; color?: string }) {
  return (
    <motion.circle
      r={3}
      fill={color || C.accent}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{
        cx: [x1, x2],
        cy: [y1, y2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.8,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeInOut",
      }}
    />
  );
}

const nodeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

function DiagramNode({
  x, y, label, sub, delay, isInView, accent,
}: {
  x: number; y: number; label: string; sub: string;
  delay: number; isInView: boolean; accent?: boolean;
}) {
  return (
    <motion.g
      custom={delay}
      variants={nodeVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={{ cursor: "default" }}
    >
      <rect
        x={x - nodeW / 2} y={y - nodeH / 2}
        width={nodeW} height={nodeH} rx={4}
        fill={C.card}
        stroke={accent ? C.accent : C.border}
        strokeWidth={accent ? 1.5 : 1}
        className="transition-all duration-200"
        onMouseEnter={(e) => {
          (e.target as SVGRectElement).setAttribute("stroke", C.accent);
          (e.target as SVGRectElement).style.filter = `drop-shadow(0 0 8px ${C.accent}44)`;
        }}
        onMouseLeave={(e) => {
          (e.target as SVGRectElement).setAttribute("stroke", accent ? C.accent : C.border);
          (e.target as SVGRectElement).style.filter = "none";
        }}
      />
      <text
        x={x} y={sub ? y - 3 : y + 4}
        textAnchor="middle" fill={C.text}
        fontSize={12} fontFamily="'Space Grotesk', sans-serif" fontWeight={600}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x} y={y + 14}
          textAnchor="middle" fill={C.muted}
          fontSize={9} fontFamily="'JetBrains Mono', monospace"
        >
          {sub}
        </text>
      )}
    </motion.g>
  );
}

export default function ArchitectureDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <div className="w-full overflow-hidden">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxHeight: 560 }}
        role="img"
        aria-label="AgentBazaar architecture: User pays Orchestrator via x402, Orchestrator discovers agents from Bazaar, plans pipeline via LLM, then calls agents sequentially with x402 payments"
      >
        <defs>
          <marker id="ah" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6" fill={C.accent} />
          </marker>
          <marker id="ah-dim" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6" fill={C.dim} />
          </marker>
          <marker id="ah-muted" markerWidth={8} markerHeight={6} refX={7} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6" fill={C.muted} />
          </marker>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grid dots */}
        <g opacity={0.12}>
          {Array.from({ length: Math.floor(W / 40) }).map((_, i) =>
            Array.from({ length: Math.floor(H / 40) }).map((_, j) => (
              <circle key={`${i}-${j}`} cx={i * 40 + 20} cy={j * 40 + 20} r={0.5} fill={C.dim} />
            ))
          )}
        </g>

        {/* step labels */}
        {[
          { x: 100, y: 28, text: "01 REQUEST", delay: 0.3 },
          { x: 540, y: 28, text: "02 DISCOVER", delay: 0.7 },
          { x: 380, y: 170, text: "03 PLAN", delay: 1.0 },
          { x: 460, y: 300, text: "04 EXECUTE + PAY", delay: 1.4 },
        ].map((s) => (
          <motion.text
            key={s.text} x={s.x} y={s.y}
            fill={C.accent} fontSize={9}
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={600} letterSpacing={2} opacity={0.6}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.6 } : { opacity: 0 }}
            transition={{ delay: s.delay, duration: 0.4 }}
          >
            {s.text}
          </motion.text>
        ))}

        {/* arrows */}
        {arrows.map((arrow) => {
          const from = nodes[arrow.from];
          const to = nodes[arrow.to];
          const start = edgePoint(from, to, true);
          const end = edgePoint(from, to, false);
          const lineColor = arrow.color || C.accent;
          const markerEnd = arrow.color ? "url(#ah-muted)" : "url(#ah)";
          const markerDim = arrow.color ? "url(#ah-muted)" : "url(#ah-dim)";

          return (
            <g key={arrow.id}>
              <line
                x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                stroke={C.dim} strokeWidth={1} strokeDasharray="4 4"
                markerEnd={markerDim}
              />
              <motion.line
                x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                stroke={lineColor} strokeWidth={1.5}
                markerEnd={markerEnd}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{
                  pathLength: { duration: 0.7, delay: arrow.delay, ease: "easeInOut" },
                  opacity: { duration: 0.3, delay: arrow.delay },
                }}
              />
              {arrow.label && (
                <motion.text
                  x={(start.x + end.x) / 2}
                  y={(start.y + end.y) / 2 - 10}
                  textAnchor="middle"
                  fill={lineColor}
                  fontSize={9}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={500}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 0.8 } : { opacity: 0 }}
                  transition={{ delay: arrow.delay + 0.3, duration: 0.4 }}
                >
                  {arrow.label}
                </motion.text>
              )}
              {isInView && (
                <FlowDot
                  x1={start.x} y1={start.y} x2={end.x} y2={end.y}
                  delay={arrow.delay + 1} color={lineColor}
                />
              )}
            </g>
          );
        })}

        {/* "..." between Agent B and Agent N */}
        <motion.text
          x={600} y={374}
          fill={C.dim} fontSize={20}
          fontFamily="'JetBrains Mono', monospace"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
          transition={{ delay: 2.0, duration: 0.4 }}
        >
          ...
        </motion.text>

        {/* nodes */}
        <DiagramNode x={nodes.user.x} y={nodes.user.y} label={nodes.user.label} sub={nodes.user.sub} delay={0.0} isInView={isInView} />
        <DiagramNode x={nodes.orch.x} y={nodes.orch.y} label={nodes.orch.label} sub={nodes.orch.sub} delay={0.1} isInView={isInView} accent />
        <DiagramNode x={nodes.bazaar.x} y={nodes.bazaar.y} label={nodes.bazaar.label} sub={nodes.bazaar.sub} delay={0.2} isInView={isInView} />
        <DiagramNode x={nodes.llm.x} y={nodes.llm.y} label={nodes.llm.label} sub={nodes.llm.sub} delay={0.4} isInView={isInView} />
        <DiagramNode x={nodes.agentA.x} y={nodes.agentA.y} label={nodes.agentA.label} sub={nodes.agentA.sub} delay={0.6} isInView={isInView} />
        <DiagramNode x={nodes.agentB.x} y={nodes.agentB.y} label={nodes.agentB.label} sub={nodes.agentB.sub} delay={0.7} isInView={isInView} />
        <DiagramNode x={nodes.agentN.x} y={nodes.agentN.y} label={nodes.agentN.label} sub={nodes.agentN.sub} delay={0.8} isInView={isInView} />

        {/* settlement bar */}
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 2.6, duration: 0.6 }}
        >
          {[nodes.agentA, nodes.agentB, nodes.agentN].map((n, i) => (
            <g key={`s-${i}`}>
              <line
                x1={n.x} y1={n.y + nodeH / 2} x2={n.x} y2={470}
                stroke={C.dim} strokeWidth={1} strokeDasharray="3 3"
              />
              <motion.line
                x1={n.x} y1={n.y + nodeH / 2} x2={n.x} y2={470}
                stroke={C.stellar} strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.5, delay: 2.6 + i * 0.1 }}
              />
            </g>
          ))}
          <rect x={80} y={470} width={W - 160} height={44} rx={4}
            fill={C.stellar} opacity={0.05} stroke={C.stellar} strokeWidth={1} strokeOpacity={0.3} />
          <text x={W / 2} y={488} textAnchor="middle" fill={C.stellar}
            fontSize={10} fontFamily="'JetBrains Mono', monospace" fontWeight={600} letterSpacing={2}>
            USDC SETTLEMENT ON STELLAR
          </text>
          <text x={W / 2} y={504} textAnchor="middle" fill={C.muted}
            fontSize={9} fontFamily="'JetBrains Mono', monospace">
            Every agent call is an on-chain payment
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
