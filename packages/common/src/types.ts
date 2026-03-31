export interface BazaarEntry {
  id: string;
  url: string;
  path: string;
  method: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price_usd: string;
  network: string;
  asset: string;
  pay_to: string;
  input_schema?: string;
  output_schema?: string;
  tags?: string;
  registered_at: string;
  last_health_check?: string;
  healthy: boolean;
  source: "manual" | "well-known" | "crawl";
}

export type ServiceCategory =
  | "search"
  | "inference"
  | "analysis"
  | "format"
  | "data"
  | "weather"
  | "news"
  | "crypto"
  | "image"
  | "scrape";

export interface PipelineStep {
  step_number: number;
  service_id: string;
  service_name: string;
  service_url: string;
  path: string;
  method: string;
  price_usd: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  tx_hash?: string;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  duration_ms?: number;
}

export interface PipelinePlan {
  task: string;
  steps: PipelineStep[];
  total_cost_usd: string;
  orchestrator_fee_usd: string;
  user_price_usd: string;
}

export interface PipelineResult {
  task: string;
  steps: PipelineStep[];
  final_output: Record<string, unknown>;
  total_downstream_cost_usd: string;
  orchestrator_fee_usd: string;
  user_paid_usd: string;
  duration_ms: number;
}

export interface PaymentReceipt {
  tx_hash: string;
  from: string;
  to: string;
  amount_usd: string;
  network: string;
  timestamp: string;
}

export interface SSEEvent {
  type:
    | "plan_ready"
    | "step_started"
    | "step_completed"
    | "step_failed"
    | "pipeline_done";
  data: PipelinePlan | PipelineStep | PipelineResult;
}

export interface RegisterServiceRequest {
  url: string;
  path: string;
  method?: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price_usd: string;
  network?: string;
  asset?: string;
  pay_to: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  tags?: string[];
}

export interface DiscoverQuery {
  category?: ServiceCategory;
  max_price?: string;
  healthy?: boolean;
  tags?: string;
}

export interface TaskRequest {
  task: string;
  max_budget_usd?: string;
}
