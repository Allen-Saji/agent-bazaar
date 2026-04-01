import type { PipelineStep, BazaarEntry } from "@agent-bazaar/common";

type SSECallback = (event: string, data: unknown) => void;
type FallbackFinder = (category: string, excludeIds: string[]) => Promise<BazaarEntry[]>;

export async function executePipeline(
  steps: PipelineStep[],
  fetchWithPay: typeof fetch,
  onEvent: SSECallback,
  bazaarUrl: string,
  findFallbacks?: FallbackFinder,
): Promise<{ final_output: Record<string, unknown>; duration_ms: number }> {
  const startTime = Date.now();
  const stepOutputs: Record<string, unknown> = {};

  for (const step of steps) {
    step.status = "running";
    onEvent("step_started", { ...step });

    const resolvedInput = resolveTemplates(step.input, stepOutputs);
    let succeeded = false;
    let lastError = "";

    // Try the primary service
    const result = await attemptStep(step, resolvedInput, fetchWithPay);

    if (result.ok) {
      succeeded = true;
      reportToReputation(bazaarUrl, step.service_id, true, step.duration_ms || 0);
    } else {
      lastError = result.error;
      reportToReputation(bazaarUrl, step.service_id, false, step.duration_ms || 0);

      // Fallback routing: try alternative services
      if (findFallbacks && step.category) {
        const excludeIds = [step.service_id];
        const fallbacks = await findFallbacks(step.category, excludeIds);

        for (const fallback of fallbacks.slice(0, 3)) {
          const originalId = step.service_id;
          step.service_id = fallback.id;
          step.service_name = fallback.name;
          step.service_url = fallback.url;
          step.path = fallback.path;
          step.price_usd = fallback.price_usd;
          step.fallback_from = originalId;

          onEvent("step_started", { ...step, _fallback: true });

          const fallbackResult = await attemptStep(step, resolvedInput, fetchWithPay);
          if (fallbackResult.ok) {
            succeeded = true;
            reportToReputation(bazaarUrl, fallback.id, true, step.duration_ms || 0);
            break;
          } else {
            lastError = fallbackResult.error;
            reportToReputation(bazaarUrl, fallback.id, false, step.duration_ms || 0);
            excludeIds.push(fallback.id);
          }
        }
      }
    }

    if (!succeeded) {
      step.status = "failed";
      step.error = lastError;
      onEvent("step_failed", { ...step });
      throw new Error(
        `Step ${step.step_number} (${step.service_name}) failed: ${step.error}`,
      );
    }

    stepOutputs[`step_${step.step_number}_output`] = step.output;
    onEvent("step_completed", { ...step });
  }

  const lastStep = steps[steps.length - 1];
  return {
    final_output: (lastStep?.output as Record<string, unknown>) || {},
    duration_ms: Date.now() - startTime,
  };
}

async function attemptStep(
  step: PipelineStep,
  resolvedInput: Record<string, unknown>,
  fetchWithPay: typeof fetch,
): Promise<{ ok: boolean; error: string }> {
  const stepStart = Date.now();
  const url = `${step.service_url}${step.path}`;

  try {
    const res = await fetchWithPay(url, {
      method: step.method || "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolvedInput),
    });

    step.duration_ms = Date.now() - stepStart;

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      return { ok: false, error: `HTTP ${res.status}: ${errorText}` };
    }

    const output = (await res.json()) as Record<string, unknown>;
    step.output = output;
    step.status = "completed";

    const txHash = res.headers.get("x-payment-tx-hash");
    if (txHash) {
      step.tx_hash = txHash;
    }

    return { ok: true, error: "" };
  } catch (err) {
    step.duration_ms = Date.now() - stepStart;
    return { ok: false, error: (err as Error).message };
  }
}

function reportToReputation(
  bazaarUrl: string,
  serviceId: string,
  success: boolean,
  responseMs: number,
): void {
  fetch(`${bazaarUrl}/services/${serviceId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ success, response_ms: responseMs }),
  }).catch(() => {}); // fire-and-forget
}

function resolveTemplates(
  input: Record<string, unknown>,
  stepOutputs: Record<string, unknown>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      resolved[key] = resolveStringTemplate(value, stepOutputs);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveTemplates(
        value as Record<string, unknown>,
        stepOutputs,
      );
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

function resolveStringTemplate(
  template: string,
  stepOutputs: Record<string, unknown>,
): unknown {
  const fullMatch = template.match(/^\{\{(\w+(?:\.\w+)*)\}\}$/);
  if (fullMatch) {
    const val = resolvePathFromOutputs(fullMatch[1], stepOutputs);
    if (typeof val === "object" && val !== null) {
      return JSON.stringify(val);
    }
    return val;
  }

  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const val = resolvePathFromOutputs(path, stepOutputs);
    if (typeof val === "object") return JSON.stringify(val);
    return String(val ?? "");
  });
}

function resolvePathFromOutputs(
  path: string,
  stepOutputs: Record<string, unknown>,
): unknown {
  const parts = path.split(".");
  let current: unknown = stepOutputs;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
