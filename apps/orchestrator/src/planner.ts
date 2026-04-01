import OpenAI from "openai";
import type { BazaarEntry, PipelineStep } from "@agent-bazaar/common";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PlannedStep {
  service_id: string;
  input_template: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are a pipeline planner for AgentBazaar. Given a user task and a catalog of available paid services, you must plan a pipeline of service calls to accomplish the task.

Rules:
1. Choose the minimum services needed. Don't add unnecessary steps.
2. Each step's output can be referenced in later steps using {{step_N_output}} or {{step_N_output.field}}.
3. The first step must use literal values or the user's task as input.
4. Return valid JSON only.
5. CRITICAL: Match the exact input field names and types from each service's input_schema.
   - If a field expects a "string" but the previous step's output is an array/object, you MUST use {{step_N_output}} which will be auto-stringified. Do NOT reference .results when passing to a string field — the whole output object will be JSON-stringified automatically.
6. For the Summarize Agent: "text" must be a string. Pass the entire previous step output as "{{step_N_output}}" — it will be auto-converted to a string representation.
7. For the Sentiment Agent: "text" must be a string. Same rule as above.
8. For the Format Agent: "title" is a string, "sections" is an array of {heading, content} objects. You can construct these from previous step data.

Response format:
{
  "steps": [
    {
      "service_id": "<id from catalog>",
      "input_template": { "field": "value or {{step_1_output.field}}" }
    }
  ],
  "reasoning": "<brief explanation of why these services were chosen>"
}

Example — Task: "Search for AI news and summarize it"
Available: Search Agent (id: "abc", input: {query: string, num_results: number}), Summarize Agent (id: "def", input: {text: string, max_words: number})
Response:
{
  "steps": [
    { "service_id": "abc", "input_template": { "query": "AI news", "num_results": 5 } },
    { "service_id": "def", "input_template": { "text": "{{step_1_output}}", "max_words": 200 } }
  ],
  "reasoning": "Search first to get articles, then summarize the combined results as text."
}`;

export async function planPipeline(
  task: string,
  catalog: BazaarEntry[],
): Promise<{ steps: PlannedStep[]; reasoning: string }> {
  const catalogSummary = catalog.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
    price_usd: s.price_usd,
    input_schema: s.input_schema,
    output_schema: s.output_schema,
  }));

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Task: "${task}"

Available services:
${JSON.stringify(catalogSummary, null, 2)}`,
      },
    ],
    max_tokens: 1000,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "{}";
  const parsed = JSON.parse(raw) as {
    steps: PlannedStep[];
    reasoning: string;
  };

  if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error("LLM returned empty or invalid pipeline plan");
  }

  // Validate that all service_ids exist in catalog
  for (const step of parsed.steps) {
    const service = catalog.find((s) => s.id === step.service_id);
    if (!service) {
      throw new Error(`LLM referenced unknown service_id: ${step.service_id}`);
    }
  }

  return parsed;
}

export function buildPipelineSteps(
  plan: { steps: PlannedStep[] },
  catalog: BazaarEntry[],
): PipelineStep[] {
  return plan.steps.map((step, idx) => {
    const service = catalog.find((s) => s.id === step.service_id)!;
    return {
      step_number: idx + 1,
      service_id: step.service_id,
      service_name: service.name,
      service_url: service.url,
      path: service.path,
      method: service.method,
      price_usd: service.price_usd,
      input: step.input_template,
      status: "pending" as const,
    };
  });
}
