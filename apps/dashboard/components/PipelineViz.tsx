"use client";

import type { PipelineStep } from "@/lib/api";

const statusStyles: Record<string, { dot: string; bg: string; border: string; line: string }> = {
  pending: {
    dot: "bg-[var(--text-dim)]",
    bg: "bg-[var(--bg)]",
    border: "border-[var(--border)]",
    line: "bg-[var(--border)]",
  },
  running: {
    dot: "bg-[var(--accent)] animate-pulse-glow",
    bg: "bg-[var(--accent)]/5",
    border: "border-[var(--accent-dim)]",
    line: "bg-[var(--accent-dim)]",
  },
  completed: {
    dot: "bg-[var(--success)]",
    bg: "bg-[var(--success)]/3",
    border: "border-[var(--success)]/20",
    line: "bg-[var(--success)]/40",
  },
  failed: {
    dot: "bg-[var(--error)]",
    bg: "bg-[var(--error)]/3",
    border: "border-[var(--error)]/20",
    line: "bg-[var(--error)]/40",
  },
};

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] text-[var(--stellar-blue)] hover:text-[var(--accent)] font-mono transition-colors duration-200 cursor-pointer"
    >
      tx:{hash.slice(0, 8)}...{hash.slice(-6)}
    </a>
  );
}

export function PipelineViz({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const style = statusStyles[step.status] || statusStyles.pending;
        return (
          <div key={step.step_number}>
            {idx > 0 && (
              <div className="flex justify-start pl-[11px] py-0">
                <div
                  className={`w-px h-4 ${style.line}`}
                />
              </div>
            )}
            <div
              className={`p-4 border ${style.border} ${style.bg} animate-slide-in`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-[10px] font-mono text-[var(--text-dim)] tracking-widest uppercase">
                    Step {String(step.step_number).padStart(2, "0")}
                  </span>
                  <span className="font-semibold text-sm">
                    {step.service_name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-[var(--accent)] font-bold">
                    ${step.price_usd}
                  </span>
                  {step.duration_ms !== undefined && (
                    <span className="text-[10px] text-[var(--text-dim)] font-mono">
                      {step.duration_ms}ms
                    </span>
                  )}
                </div>
              </div>

              {step.tx_hash && (
                <div className="ml-5 mt-1">
                  <TxLink hash={step.tx_hash} />
                </div>
              )}

              {step.output && (
                <details className="mt-2 ml-5">
                  <summary className="text-[10px] font-mono text-[var(--text-dim)] cursor-pointer hover:text-[var(--accent)] transition-colors duration-200 tracking-widest uppercase">
                    View output
                  </summary>
                  <pre className="mt-2 p-3 bg-black text-[10px] overflow-x-auto max-h-40 font-mono text-[var(--text-muted)] border border-[var(--border)] leading-relaxed">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                </details>
              )}

              {step.error && (
                <p className="mt-2 ml-5 text-[10px] font-mono text-[var(--error)]">{step.error}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
