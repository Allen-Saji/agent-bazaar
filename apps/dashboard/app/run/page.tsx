"use client";

import { useState, useCallback } from "react";
import {
  runTask,
  subscribeToTask,
  type PipelineStep,
  type PipelineResult,
} from "@/lib/api";
import { PipelineViz } from "@/components/PipelineViz";
import { PaymentFlow } from "@/components/PaymentFlow";

const EXAMPLE_TASKS = [
  "Research latest Stellar blockchain news and give me a sentiment-analyzed report",
  "Search for AI agent frameworks in 2026 and summarize the top results",
  "Find recent cryptocurrency market trends and analyze the overall sentiment",
];

export default function RunPage() {
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const handleRun = useCallback(async () => {
    if (!task.trim() || running) return;

    setRunning(true);
    setSteps([]);
    setResult(null);
    setError("");

    try {
      const res = await runTask(task);
      setSteps(res.steps);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setRunning(false);
    }
  }, [task, running]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Run Pipeline</h1>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <p className="text-xs text-[var(--text-muted)] font-mono">
          Describe a task. The orchestrator plans and executes an agent pipeline.
        </p>
      </div>

      {/* Task input area */}
      <div className="mb-8 border border-[var(--border)] glow-hover">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-card)]">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono">
            Task Input
          </span>
          <span className="text-[10px] text-[var(--text-dim)] font-mono">
            {task.length}/2000
          </span>
        </div>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="> Describe your task..."
          rows={4}
          maxLength={2000}
          className="w-full p-4 bg-[var(--bg)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none resize-none font-mono text-sm leading-relaxed"
        />
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {EXAMPLE_TASKS.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setTask(example)}
                className="px-3 py-1 text-[10px] font-mono text-[var(--text-dim)] border border-[var(--border)] hover:border-[var(--accent-dim)] hover:text-[var(--accent)] transition-colors duration-200 truncate max-w-[220px] cursor-pointer"
              >
                {example}
              </button>
            ))}
          </div>
          <button
            onClick={handleRun}
            disabled={!task.trim() || running}
            className="px-6 py-2 bg-[var(--accent)] text-black font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent-glow)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 ml-4 shrink-0 cursor-pointer"
          >
            {running ? (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse-glow" />
                Running
              </span>
            ) : (
              "Execute — $0.15"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-[var(--error)]/30 bg-[var(--error)]/5 mb-6 animate-slide-in">
          <p className="text-xs font-mono text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Pipeline visualization */}
      {steps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="font-semibold text-sm tracking-wide">Pipeline Steps</h2>
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[10px] font-mono text-[var(--text-dim)]">
                {steps.length} steps
              </span>
            </div>
            <PipelineViz steps={steps} />
          </div>

          <div className="space-y-4">
            {result && (
              <>
                <PaymentFlow
                  userPaid={result.user_paid_usd}
                  downstreamCost={result.total_downstream_cost_usd}
                  orchestratorFee={result.orchestrator_fee_usd}
                  steps={result.steps.map((s) => ({
                    service_name: s.service_name,
                    price_usd: s.price_usd,
                  }))}
                />

                <div className="border border-[var(--border)] bg-[var(--bg-card)]">
                  <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono">
                      Output
                    </h3>
                    <span className="text-[10px] font-mono text-[var(--text-dim)]">
                      {result.duration_ms}ms
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto max-h-80 p-4 font-mono text-[var(--text-muted)] leading-relaxed">
                    {JSON.stringify(result.final_output, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!running && steps.length === 0 && !error && (
        <div className="text-center py-24 text-[var(--text-dim)]">
          <p className="font-mono text-xs tracking-widest uppercase mb-2">Awaiting Input</p>
          <p className="text-[10px] font-mono">
            Enter a task and execute to begin
          </p>
        </div>
      )}
    </div>
  );
}
