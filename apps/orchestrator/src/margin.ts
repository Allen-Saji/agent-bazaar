import type { PipelineStep } from "@agent-bazaar/common";
import { PRICES } from "@agent-bazaar/common";

export function calculateCosts(steps: PipelineStep[]): {
  total_downstream_usd: string;
  orchestrator_fee_usd: string;
  user_price_usd: string;
} {
  const downstream = steps.reduce(
    (sum, s) => sum + parseFloat(s.price_usd),
    0,
  );

  const userPrice = parseFloat(PRICES.ORCHESTRATOR);
  const fee = userPrice - downstream;

  return {
    total_downstream_usd: downstream.toFixed(2),
    orchestrator_fee_usd: Math.max(0, fee).toFixed(2),
    user_price_usd: userPrice.toFixed(2),
  };
}
