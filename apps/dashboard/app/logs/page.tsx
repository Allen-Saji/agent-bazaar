"use client";

import { useState, useEffect } from "react";
import type { PipelineResult } from "@/lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState<PipelineResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Load logs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("agent-bazaar-logs");
    if (stored) {
      try {
        setLogs(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Listen for new pipeline results
  useEffect(() => {
    const handler = (event: CustomEvent<PipelineResult>) => {
      setLogs((prev) => {
        const updated = [event.detail, ...prev].slice(0, 50);
        localStorage.setItem("agent-bazaar-logs", JSON.stringify(updated));
        return updated;
      });
    };
    window.addEventListener(
      "pipeline-complete",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "pipeline-complete",
        handler as EventListener,
      );
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transaction Logs</h1>
        <p className="text-[var(--text-muted)]">
          Pipeline execution history with Stellar transaction links
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-lg mb-2">No pipeline runs yet</p>
          <p className="text-sm">
            Run a pipeline from the{" "}
            <a href="/run" className="text-[var(--accent)] hover:underline">
              Run Pipeline
            </a>{" "}
            page to see logs here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === String(idx) ? null : String(idx))
                }
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm truncate max-w-md">
                      {log.task}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {log.steps.length} steps &middot; {log.duration_ms}ms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-[var(--accent-glow)]">
                    ${log.user_paid_usd}
                  </span>
                  <span className="text-[var(--text-muted)]">
                    {expanded === String(idx) ? "\u25B2" : "\u25BC"}
                  </span>
                </div>
              </button>

              {expanded === String(idx) && (
                <div className="p-4 pt-0 border-t border-[var(--border)]">
                  <div className="grid grid-cols-3 gap-4 py-3 text-center text-xs">
                    <div>
                      <p className="font-mono text-lg">${log.user_paid_usd}</p>
                      <p className="text-[var(--text-muted)]">User Paid</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg text-[var(--stellar-blue)]">
                        ${log.total_downstream_cost_usd}
                      </p>
                      <p className="text-[var(--text-muted)]">Agent Costs</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg text-[var(--success)]">
                        ${log.orchestrator_fee_usd}
                      </p>
                      <p className="text-[var(--text-muted)]">Margin</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    {log.steps.map((step) => (
                      <div
                        key={step.step_number}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg)]/50 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2 h-2 rounded-full ${step.status === "completed" ? "bg-[var(--success)]" : "bg-[var(--error)]"}`}
                          />
                          <span>{step.service_name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {step.tx_hash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${step.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--stellar-blue)] hover:underline font-mono"
                            >
                              {step.tx_hash.slice(0, 8)}...
                            </a>
                          )}
                          <span className="font-mono text-xs">
                            ${step.price_usd}
                          </span>
                          {step.duration_ms !== undefined && (
                            <span className="text-xs text-[var(--text-muted)]">
                              {step.duration_ms}ms
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
