import type { PipelineStep } from "@agent-bazaar/common";

type SSECallback = (event: string, data: unknown) => void;

export async function executePipeline(
  steps: PipelineStep[],
  fetchWithPay: typeof fetch,
  onEvent: SSECallback,
): Promise<{ final_output: Record<string, unknown>; duration_ms: number }> {
  const startTime = Date.now();
  const stepOutputs: Record<string, unknown> = {};

  for (const step of steps) {
    step.status = "running";
    onEvent("step_started", { ...step });

    const stepStart = Date.now();

    // Resolve template variables in input
    const resolvedInput = resolveTemplates(step.input, stepOutputs);

    const url = `${step.service_url}${step.path}`;

    const res = await fetchWithPay(url, {
      method: step.method || "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolvedInput),
    });

    step.duration_ms = Date.now() - stepStart;

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      step.status = "failed";
      step.error = `HTTP ${res.status}: ${errorText}`;
      onEvent("step_failed", { ...step });
      throw new Error(
        `Step ${step.step_number} (${step.service_name}) failed: ${step.error}`,
      );
    }

    const output = (await res.json()) as Record<string, unknown>;
    step.output = output;
    step.status = "completed";

    // Extract tx hash from x402 payment header if present
    const txHash = res.headers.get("x-payment-tx-hash");
    if (txHash) {
      step.tx_hash = txHash;
    }

    stepOutputs[`step_${step.step_number}_output`] = output;
    onEvent("step_completed", { ...step });
  }

  const lastStep = steps[steps.length - 1];
  return {
    final_output: (lastStep?.output as Record<string, unknown>) || {},
    duration_ms: Date.now() - startTime,
  };
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
  // Check if the entire string is a single template reference
  const fullMatch = template.match(/^\{\{(\w+(?:\.\w+)*)\}\}$/);
  if (fullMatch) {
    const val = resolvePathFromOutputs(fullMatch[1], stepOutputs);
    // If the resolved value is an object/array, stringify it so it works as a string input
    if (typeof val === "object" && val !== null) {
      return JSON.stringify(val);
    }
    return val;
  }

  // Replace embedded template references within a larger string
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
