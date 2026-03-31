"use client";

interface PaymentFlowProps {
  userPaid: string;
  downstreamCost: string;
  orchestratorFee: string;
  steps: Array<{ service_name: string; price_usd: string }>;
}

export function PaymentFlow({
  userPaid,
  downstreamCost,
  orchestratorFee,
  steps,
}: PaymentFlowProps) {
  const total = parseFloat(userPaid) || 0;

  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
      <h3 className="font-semibold text-sm mb-4">Payment Breakdown</h3>

      {/* User payment bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[var(--text-muted)]">You paid</span>
          <span className="font-mono text-[var(--accent-glow)]">
            ${userPaid} USDC
          </span>
        </div>
        <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full w-full" />
        </div>
      </div>

      {/* Distribution */}
      <div className="space-y-2 mb-4">
        {steps.map((step) => {
          const pct =
            total > 0
              ? (parseFloat(step.price_usd) / total) * 100
              : 0;
          return (
            <div key={step.service_name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-muted)]">
                  {step.service_name}
                </span>
                <span className="font-mono">${step.price_usd}</span>
              </div>
              <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--stellar-blue)] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t border-[var(--border)] flex justify-between text-xs">
        <div>
          <span className="text-[var(--text-muted)]">Agents: </span>
          <span className="font-mono">${downstreamCost}</span>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Orchestrator margin: </span>
          <span className="font-mono text-[var(--success)]">
            ${orchestratorFee}
          </span>
        </div>
      </div>
    </div>
  );
}
