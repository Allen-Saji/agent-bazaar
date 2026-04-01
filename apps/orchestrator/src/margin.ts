import type { PipelineStep } from "@agent-bazaar/common";

const MARKUP = parseFloat(process.env.ORCHESTRATOR_MARKUP || "0.30");

export function calculateCosts(steps: PipelineStep[]): {
  total_downstream_usd: string;
  orchestrator_fee_usd: string;
  user_price_usd: string;
} {
  const downstream = steps.reduce(
    (sum, s) => sum + parseFloat(s.price_usd),
    0,
  );

  const fee = downstream * MARKUP;
  const userPrice = downstream + fee;

  return {
    total_downstream_usd: downstream.toFixed(4),
    orchestrator_fee_usd: fee.toFixed(4),
    user_price_usd: userPrice.toFixed(4),
  };
}
