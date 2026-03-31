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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Run Pipeline</h1>
        <p className="text-[var(--text-muted)]">
          Describe a task and the orchestrator will plan and execute an agent
          pipeline
        </p>
      </div>

      {/* Task input */}
      <div className="mb-6">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe your task..."
          rows={3}
          maxLength={2000}
          className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2 flex-wrap">
            {EXAMPLE_TASKS.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setTask(example)}
                className="px-3 py-1 rounded-lg text-xs bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text)] transition-colors truncate max-w-[250px]"
              >
                {example}
              </button>
            ))}
          </div>
          <button
            onClick={handleRun}
            disabled={!task.trim() || running}
            className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-4 shrink-0"
          >
            {running ? "Running..." : "Run Pipeline ($0.15)"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/5 mb-6">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Pipeline visualization */}
      {steps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="font-semibold mb-4">Pipeline Steps</h2>
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

                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
                  <h3 className="font-semibold text-sm mb-3">Final Output</h3>
                  <pre className="text-xs overflow-x-auto max-h-80 bg-black/30 rounded-lg p-3">
                    {JSON.stringify(result.final_output, null, 2)}
                  </pre>
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    Total duration: {result.duration_ms}ms
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!running && steps.length === 0 && !error && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-lg mb-2">No pipeline running</p>
          <p className="text-sm">
            Enter a task above and click &quot;Run Pipeline&quot; to get started
          </p>
        </div>
      )}
    </div>
  );
}
