"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useInView,
  AnimatePresence,
} from "framer-motion";

/* ── colour tokens ── */
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

/* ── steps ── */
const steps = [
  {
    id: 0,
    label: "Task Received",
    desc: "User sends a natural-language task to the orchestrator via x402 payment.",
  },
  {
    id: 1,
    label: "Discovery",
    desc: "Orchestrator queries the bazaar for available, healthy agents matching the task.",
  },
  {
    id: 2,
    label: "Planning",
    desc: "LLM planner builds an optimal pipeline — selecting agents, order, and fallbacks.",
  },
  {
    id: 3,
    label: "Search",
    desc: "Step 1: Search agent queries the web. x402 payment settles on Stellar.",
    tag: "$0.02",
  },
  {
    id: 4,
    label: "Summarize",
    desc: "Step 2: Search results feed into the summarize agent for distillation.",
    tag: "$0.04",
  },
  {
    id: 5,
    label: "Sentiment",
    desc: "Step 3: Summary is analyzed for sentiment. Final x402 payment made.",
    tag: "$0.02",
  },
  {
    id: 6,
    label: "Result",
    desc: "Final output returned to the caller with all transaction hashes as proof.",
  },
];

const NODE_W = 160;
const NODE_H = 44;
const GAP = 62;
const START_Y = 30;
const CX = 240;
const SVG_W = 480;
const SVG_H = START_Y + steps.length * (NODE_H + GAP) - GAP + 20;

export default function FlowDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.25 });
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCycle = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 2500);
  }, []);

  useEffect(() => {
    if (isInView) {
      setActive(0);
      startCycle();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInView, startCycle]);

  const handleStepClick = (idx: number) => {
    setActive(idx);
    startCycle(); // reset timer
  };

  return (
    <div ref={ref} className="w-full flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
      {/* SVG diagram */}
      <div className="w-full lg:w-auto flex-shrink-0 overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full lg:w-[420px] h-auto"
          role="img"
          aria-label="AgentBazaar pipeline flow diagram"
        >
          <defs>
            <filter id="flow-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="flow-arrow"
              markerWidth={6}
              markerHeight={5}
              refX={5}
              refY={2.5}
              orient="auto"
            >
              <path d="M0,0 L6,2.5 L0,5" fill={C.dim} />
            </marker>
            <marker
              id="flow-arrow-active"
              markerWidth={6}
              markerHeight={5}
              refX={5}
              refY={2.5}
              orient="auto"
            >
              <path d="M0,0 L6,2.5 L0,5" fill={C.accent} />
            </marker>
          </defs>

          {/* background dots */}
          <g opacity={0.1}>
            {Array.from({ length: Math.floor(SVG_W / 30) }).map((_, i) =>
              Array.from({ length: Math.floor(SVG_H / 30) }).map((_, j) => (
                <circle
                  key={`${i}-${j}`}
                  cx={i * 30 + 15}
                  cy={j * 30 + 15}
                  r={0.4}
                  fill={C.dim}
                />
              ))
            )}
          </g>

          {/* arrows between steps */}
          {steps.slice(0, -1).map((step, i) => {
            const y1 = START_Y + i * (NODE_H + GAP) + NODE_H;
            const y2 = START_Y + (i + 1) * (NODE_H + GAP);
            const isActive = i < active;
            const isCurrentTransition = i === active - 1;

            return (
              <g key={`arrow-${i}`}>
                <line
                  x1={CX}
                  y1={y1}
                  x2={CX}
                  y2={y2}
                  stroke={isActive ? C.accent : C.dim}
                  strokeWidth={isActive ? 1.5 : 1}
                  strokeDasharray={isActive ? "none" : "3 3"}
                  markerEnd={isActive ? "url(#flow-arrow-active)" : "url(#flow-arrow)"}
                  opacity={isActive ? 0.8 : 0.4}
                />
                {/* flowing dot on current transition */}
                {isCurrentTransition && isInView && (
                  <motion.circle
                    cx={CX}
                    r={3}
                    fill={C.accent}
                    filter="url(#flow-glow)"
                    initial={{ cy: y1 }}
                    animate={{ cy: [y1, y2] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: 0.8,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* step nodes */}
          {steps.map((step, i) => {
            const y = START_Y + i * (NODE_H + GAP);
            const rx = CX - NODE_W / 2;
            const isActive = i === active;
            const isCompleted = i < active;

            return (
              <g
                key={step.id}
                onClick={() => handleStepClick(i)}
                style={{ cursor: "pointer" }}
              >
                {/* active glow ring */}
                {isActive && isInView && (
                  <motion.rect
                    x={rx - 4}
                    y={y - 4}
                    width={NODE_W + 8}
                    height={NODE_H + 8}
                    rx={6}
                    fill="none"
                    stroke={C.accent}
                    strokeWidth={1.5}
                    filter="url(#flow-glow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* node background */}
                <rect
                  x={rx}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={4}
                  fill={isActive ? C.card : C.bg}
                  stroke={isActive ? C.accent : isCompleted ? C.success : C.border}
                  strokeWidth={isActive ? 1.5 : 1}
                  opacity={isActive || isCompleted ? 1 : 0.5}
                />

                {/* completed indicator */}
                {isCompleted && (
                  <g>
                    <circle
                      cx={rx + 16}
                      cy={y + NODE_H / 2}
                      r={5}
                      fill={C.success}
                      opacity={0.2}
                    />
                    <circle
                      cx={rx + 16}
                      cy={y + NODE_H / 2}
                      r={2.5}
                      fill={C.success}
                    />
                  </g>
                )}

                {/* active pulsing dot */}
                {isActive && isInView && (
                  <motion.circle
                    cx={rx + 16}
                    cy={y + NODE_H / 2}
                    r={3}
                    fill={C.accent}
                    animate={{ r: [2.5, 4, 2.5], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* label */}
                <text
                  x={CX + (isCompleted || isActive ? 6 : 0)}
                  y={y + NODE_H / 2 + 4}
                  textAnchor="middle"
                  fill={isActive ? C.accent : isCompleted ? C.text : C.muted}
                  fontSize={11}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontWeight={isActive ? 600 : 500}
                >
                  {step.label}
                </text>

                {/* price tag */}
                {step.tag && (
                  <text
                    x={rx + NODE_W - 12}
                    y={y + NODE_H / 2 + 3}
                    textAnchor="end"
                    fill={isActive ? C.accentGlow : C.dim}
                    fontSize={9}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight={500}
                  >
                    {step.tag}
                  </text>
                )}

                {/* step number */}
                <text
                  x={rx - 16}
                  y={y + NODE_H / 2 + 3}
                  textAnchor="end"
                  fill={isActive ? C.accent : C.dim}
                  fontSize={9}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* info panel */}
      <div className="flex-1 min-w-0 lg:pt-8">
        <div className="border border-[var(--border)] bg-[var(--bg-card)] p-6 min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)] font-mono font-semibold">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {steps[active].label}
                </span>
                {steps[active].tag && (
                  <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 border border-[var(--accent)]/20">
                    {steps[active].tag}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {steps[active].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* step indicators */}
        <div className="flex gap-1.5 mt-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => handleStepClick(i)}
              className="cursor-pointer group"
              aria-label={`Go to step ${i + 1}: ${steps[i].label}`}
            >
              <div
                className={`h-1 transition-all duration-300 ${
                  i === active
                    ? "w-8 bg-[var(--accent)]"
                    : i < active
                    ? "w-4 bg-[var(--success)]"
                    : "w-4 bg-[var(--border)] group-hover:bg-[var(--text-dim)]"
                }`}
              />
            </button>
          ))}
        </div>

        {/* keyboard hint */}
        <p className="text-[10px] text-[var(--text-dim)] font-mono mt-4">
          Click any step to jump. Auto-advances every 2.5s.
        </p>
      </div>
    </div>
  );
}
