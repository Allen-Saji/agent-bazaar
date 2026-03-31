// All API calls go through Next.js API routes (server-side proxy)
// This ensures no secrets are exposed to the browser

const BAZAAR_URL = process.env.NEXT_PUBLIC_BAZAAR_URL || "http://localhost:3001";
const ORCHESTRATOR_URL = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:3002";

export interface BazaarService {
  id: string;
  url: string;
  path: string;
  method: string;
  name: string;
  description: string;
  category: string;
  price_usd: string;
  network: string;
  asset: string;
  pay_to: string;
  tags?: string;
  healthy: boolean;
  source: string;
  registered_at: string;
}

export interface PipelineStep {
  step_number: number;
  service_name: string;
  price_usd: string;
  status: "pending" | "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  tx_hash?: string;
  error?: string;
  duration_ms?: number;
}

export interface PipelineResult {
  task_id: string;
  task: string;
  steps: PipelineStep[];
  final_output: Record<string, unknown>;
  total_downstream_cost_usd: string;
  orchestrator_fee_usd: string;
  user_paid_usd: string;
  duration_ms: number;
}

export async function fetchCatalog(): Promise<BazaarService[]> {
  const res = await fetch(`${BAZAAR_URL}/catalog`);
  if (!res.ok) throw new Error("Failed to fetch catalog");
  return res.json();
}

export async function fetchDiscover(params?: Record<string, string>): Promise<BazaarService[]> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${BAZAAR_URL}/discover${query}`);
  if (!res.ok) throw new Error("Failed to discover services");
  return res.json();
}

export async function runTask(task: string): Promise<PipelineResult> {
  const res = await fetch(`${ORCHESTRATOR_URL}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function subscribeToTask(
  taskId: string,
  onEvent: (event: string, data: unknown) => void,
): EventSource {
  const es = new EventSource(`${ORCHESTRATOR_URL}/task/stream/${taskId}`);

  for (const eventType of [
    "plan_ready",
    "step_started",
    "step_completed",
    "step_failed",
    "pipeline_done",
  ]) {
    es.addEventListener(eventType, (e) => {
      onEvent(eventType, JSON.parse(e.data));
    });
  }

  return es;
}
