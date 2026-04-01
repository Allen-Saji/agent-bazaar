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
    <div className="border border-[var(--border)] bg-[var(--bg-card)]">
      <div className="px-4 py-2 border-b border-[var(--border)]">
        <h3 className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono">
          Payment Breakdown
        </h3>
      </div>

      <div className="p-4">
        {/* Total paid */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-[var(--text-muted)] font-mono">You paid</span>
            <span className="font-mono text-[var(--accent)] font-bold">
              ${userPaid} USDC
            </span>
          </div>
          <div className="h-1 bg-[var(--border)] overflow-hidden">
            <div className="h-full bg-[var(--accent)] w-full" />
          </div>
        </div>

        {/* Per-service distribution */}
        <div className="space-y-3 mb-4">
          {steps.map((step) => {
            const pct =
              total > 0
                ? (parseFloat(step.price_usd) / total) * 100
                : 0;
            return (
              <div key={step.service_name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-dim)] font-mono text-[10px]">
                    {step.service_name}
                  </span>
                  <span className="font-mono text-[10px]">${step.price_usd}</span>
                </div>
                <div className="h-px bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--stellar-blue)] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t border-[var(--border)] flex justify-between text-[10px] font-mono">
          <div>
            <span className="text-[var(--text-dim)]">Agents </span>
            <span className="text-[var(--text)]">${downstreamCost}</span>
          </div>
          <div>
            <span className="text-[var(--text-dim)]">Margin </span>
            <span className="text-[var(--success)]">
              ${orchestratorFee}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
