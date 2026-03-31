"use client";

import type { PipelineStep } from "@/lib/api";

const statusStyles: Record<string, { dot: string; bg: string; border: string }> = {
  pending: {
    dot: "bg-gray-500",
    bg: "bg-[var(--bg-card)]",
    border: "border-[var(--border)]",
  },
  running: {
    dot: "bg-[var(--accent)] animate-pulse-glow",
    bg: "bg-[var(--accent)]/5",
    border: "border-[var(--accent)]/50",
  },
  completed: {
    dot: "bg-[var(--success)]",
    bg: "bg-[var(--success)]/5",
    border: "border-[var(--success)]/30",
  },
  failed: {
    dot: "bg-[var(--error)]",
    bg: "bg-[var(--error)]/5",
    border: "border-[var(--error)]/30",
  },
};

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-[var(--stellar-blue)] hover:underline font-mono"
    >
      {hash.slice(0, 8)}...{hash.slice(-8)}
    </a>
  );
}

export function PipelineViz({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const style = statusStyles[step.status] || statusStyles.pending;
        return (
          <div key={step.step_number}>
            {idx > 0 && (
              <div className="flex justify-center py-1">
                <div
                  className={`w-0.5 h-6 ${step.status === "completed" ? "bg-[var(--success)]/40" : "bg-[var(--border)]"}`}
                />
              </div>
            )}
            <div
              className={`p-4 rounded-xl border ${style.border} ${style.bg} animate-slide-in`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                  <span className="font-semibold text-sm">
                    Step {step.step_number}: {step.service_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-[var(--accent-glow)]">
                    ${step.price_usd}
                  </span>
                  {step.duration_ms !== undefined && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {step.duration_ms}ms
                    </span>
                  )}
                </div>
              </div>

              {step.tx_hash && (
                <div className="mb-2">
                  <TxLink hash={step.tx_hash} />
                </div>
              )}

              {step.output && (
                <details className="mt-2">
                  <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-white">
                    View output
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-black/30 text-xs overflow-x-auto max-h-40">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                </details>
              )}

              {step.error && (
                <p className="mt-2 text-xs text-[var(--error)]">{step.error}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
