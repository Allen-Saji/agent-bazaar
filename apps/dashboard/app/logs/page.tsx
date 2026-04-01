"use client";

import { useState, useEffect } from "react";
import type { PipelineResult } from "@/lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState<PipelineResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Transaction Logs</h1>
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[10px] font-mono text-[var(--text-dim)]">
            {logs.length} records
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          Pipeline execution history with Stellar transaction links
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-24 text-[var(--text-dim)]">
          <p className="font-mono text-xs tracking-widest uppercase mb-2">No Records</p>
          <p className="text-[10px] font-mono">
            Run a pipeline from the{" "}
            <a href="/run" className="text-[var(--accent)] hover:text-[var(--accent-glow)] transition-colors cursor-pointer">
              Pipeline
            </a>{" "}
            page
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)]">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_100px_80px_60px_32px] gap-4 px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border)] text-[10px] font-mono tracking-widest uppercase text-[var(--text-dim)]">
            <span>#</span>
            <span>Task</span>
            <span className="text-right">Steps</span>
            <span className="text-right">Duration</span>
            <span className="text-right">Cost</span>
            <span />
          </div>

          {logs.map((log, idx) => (
            <div
              key={idx}
              className="border-b border-[var(--border)] last:border-b-0 animate-slide-in"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <button
                onClick={() =>
                  setExpanded(expanded === String(idx) ? null : String(idx))
                }
                className="w-full grid grid-cols-[40px_1fr_100px_80px_60px_32px] gap-4 px-4 py-3 hover:bg-[var(--bg-card-hover)] transition-colors duration-150 text-left cursor-pointer items-center"
              >
                <span className="text-[10px] text-[var(--text-dim)] font-mono">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-sm truncate">
                  {log.task}
                </p>
                <span className="text-xs text-[var(--text-muted)] font-mono text-right">
                  {log.steps.length} steps
                </span>
                <span className="text-xs text-[var(--text-dim)] font-mono text-right">
                  {log.duration_ms}ms
                </span>
                <span className="font-mono text-xs text-[var(--accent)] text-right font-semibold">
                  ${log.user_paid_usd}
                </span>
                <span className="text-[var(--text-dim)] text-xs text-center">
                  {expanded === String(idx) ? "\u25B4" : "\u25BE"}
                </span>
              </button>

              {expanded === String(idx) && (
                <div className="px-4 pb-4 border-t border-[var(--border)] bg-[var(--bg-surface)] animate-slide-in">
                  {/* Cost breakdown */}
                  <div className="grid grid-cols-3 gap-px bg-[var(--border)] my-4">
                    <div className="bg-[var(--bg)] p-4 text-center">
                      <p className="font-mono text-lg text-[var(--accent)]">${log.user_paid_usd}</p>
                      <p className="text-[10px] font-mono text-[var(--text-dim)] tracking-widest uppercase mt-1">User Paid</p>
                    </div>
                    <div className="bg-[var(--bg)] p-4 text-center">
                      <p className="font-mono text-lg text-[var(--stellar-blue)]">
                        ${log.total_downstream_cost_usd}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-dim)] tracking-widest uppercase mt-1">Agent Costs</p>
                    </div>
                    <div className="bg-[var(--bg)] p-4 text-center">
                      <p className="font-mono text-lg text-[var(--success)]">
                        ${log.orchestrator_fee_usd}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-dim)] tracking-widest uppercase mt-1">Margin</p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-px">
                    {log.steps.map((step) => (
                      <div
                        key={step.step_number}
                        className="flex items-center justify-between p-3 bg-[var(--bg)] text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${step.status === "completed" ? "bg-[var(--success)]" : "bg-[var(--error)]"}`}
                          />
                          <span className="text-xs">{step.service_name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {step.tx_hash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${step.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[var(--stellar-blue)] hover:text-[var(--accent)] font-mono transition-colors cursor-pointer"
                            >
                              {step.tx_hash.slice(0, 8)}...
                            </a>
                          )}
                          <span className="font-mono text-xs text-[var(--accent)]">
                            ${step.price_usd}
                          </span>
                          {step.duration_ms !== undefined && (
                            <span className="text-[10px] text-[var(--text-dim)] font-mono w-16 text-right">
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
