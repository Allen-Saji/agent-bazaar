import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  PORTS,
  PRICES,
  NETWORK,
  FACILITATOR_URL,
  SERVICE_URLS,
} from "@agent-bazaar/common";
import type { PipelineResult, PipelinePlan } from "@agent-bazaar/common";
import { BazaarClient } from "@agent-bazaar/bazaar-client";
import { planPipeline, buildPipelineSteps } from "./planner.js";
import { executePipeline } from "./executor.js";
import { calculateCosts } from "./margin.js";

async function startServer() {
  const { paymentMiddleware } = await import("@x402/express");
  const { x402ResourceServer } = await import("@x402/express");
  const { ExactStellarScheme: ServerScheme } = await import(
    "@x402/stellar/exact/server"
  );
  const { HTTPFacilitatorClient } = await import("@x402/core/server");

  const { wrapFetchWithPayment, x402Client } = await import("@x402/fetch");
  const { createEd25519Signer } = await import("@x402/stellar");
  const { ExactStellarScheme: ClientScheme } = await import(
    "@x402/stellar/exact/client"
  );

  const app = express();
  const PORT = process.env.PORT || PORTS.ORCHESTRATOR;

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "orchestrator" });
  });

  // x402 paywall on /task
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });
  const x402Server = new x402ResourceServer(facilitatorClient).register(
    "stellar:testnet",
    new ServerScheme(),
  );

  const orchestratorAddress = process.env.ORCHESTRATOR_ADDRESS;
  if (orchestratorAddress) {
    app.use(
      paymentMiddleware(
        {
          "POST /task": {
            accepts: [
              {
                scheme: "exact",
                price: "1.00", // ceiling — actual cost is dynamic per-request
                network: NETWORK,
                payTo: orchestratorAddress,
              },
            ],
            description: "Run an agent pipeline",
          },
        },
        x402Server,
      ),
    );
  }

  // x402 client for paying downstream agents
  let fetchWithPay: typeof fetch = fetch;

  const orchestratorSecret = process.env.ORCHESTRATOR_SECRET;
  if (orchestratorSecret) {
    const signer = createEd25519Signer(orchestratorSecret, NETWORK);
    const client = new x402Client().register(
      "stellar:*",
      new ClientScheme(signer),
    );
    fetchWithPay = wrapFetchWithPayment(fetch, client);
  }

  const bazaarClient = new BazaarClient(SERVICE_URLS.BAZAAR);

  // SSE endpoint for real-time pipeline updates
  app.get("/task/stream/:taskId", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const taskId = req.params.taskId;

    // Store SSE connection for this task
    if (!sseConnections.has(taskId)) {
      sseConnections.set(taskId, []);
    }
    sseConnections.get(taskId)!.push(res);

    req.on("close", () => {
      const conns = sseConnections.get(taskId);
      if (conns) {
        const idx = conns.indexOf(res);
        if (idx > -1) conns.splice(idx, 1);
        if (conns.length === 0) sseConnections.delete(taskId);
      }
    });
  });

  const sseConnections = new Map<string, express.Response[]>();

  function sendSSE(taskId: string, event: string, data: unknown): void {
    const conns = sseConnections.get(taskId);
    if (!conns) return;
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const conn of conns) {
      conn.write(msg);
    }
  }

  // Main task endpoint
  app.post("/task", async (req, res) => {
    const { task, max_budget_usd } = req.body;

    if (!task || typeof task !== "string") {
      res.status(400).json({ error: "Missing required field: task" });
      return;
    }

    if (task.length > 2000) {
      res.status(400).json({ error: "Task description too long (max 2000 chars)" });
      return;
    }

    const taskId = crypto.randomUUID();

    try {
      // 1. Discover available services
      const catalog = await bazaarClient.discover({ healthy: true });

      // Filter to only our demo agents for reliability
      const demoAgents = catalog.filter(
        (s) => s.source === "manual" && s.url.includes("localhost"),
      );

      if (demoAgents.length === 0) {
        res.status(503).json({ error: "No agents available" });
        return;
      }

      // 2. Plan pipeline via LLM
      const plan = await planPipeline(task, demoAgents);
      const steps = buildPipelineSteps(plan, demoAgents);
      const costs = calculateCosts(steps);

      // Check budget
      if (
        max_budget_usd &&
        parseFloat(costs.user_price_usd) > parseFloat(max_budget_usd)
      ) {
        res.status(400).json({
          error: `Pipeline cost $${costs.user_price_usd} exceeds budget $${max_budget_usd}`,
          plan: { steps, costs },
        });
        return;
      }

      const pipelinePlan: PipelinePlan = {
        task,
        steps,
        total_cost_usd: costs.total_downstream_usd,
        orchestrator_fee_usd: costs.orchestrator_fee_usd,
        user_price_usd: costs.user_price_usd,
      };

      sendSSE(taskId, "plan_ready", pipelinePlan);

      // Fallback finder for failed steps
      const findFallbacks = async (category: string, excludeIds: string[]) => {
        const all = await bazaarClient.discover({ category: category as never, healthy: true });
        return all
          .filter((s) => !excludeIds.includes(s.id))
          .sort((a, b) => parseFloat(a.price_usd) - parseFloat(b.price_usd));
      };

      // 3. Execute pipeline
      const { final_output, duration_ms } = await executePipeline(
        steps,
        fetchWithPay,
        (event, data) => sendSSE(taskId, event, data),
        SERVICE_URLS.BAZAAR,
        findFallbacks,
      );

      const result: PipelineResult = {
        task,
        steps,
        final_output,
        total_downstream_cost_usd: costs.total_downstream_usd,
        orchestrator_fee_usd: costs.orchestrator_fee_usd,
        user_paid_usd: costs.user_price_usd,
        duration_ms,
      };

      sendSSE(taskId, "pipeline_done", result);

      res.json({ task_id: taskId, ...result });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      sendSSE(taskId, "step_failed", { error });
      res.status(500).json({ error, task_id: taskId });
    }
  });

  // Non-paywalled: get a price quote before committing
  app.post("/task/quote", async (req, res) => {
    const { task } = req.body;

    if (!task || typeof task !== "string") {
      res.status(400).json({ error: "Missing required field: task" });
      return;
    }

    try {
      const catalog = await bazaarClient.discover({ healthy: true });
      const demoAgents = catalog.filter(
        (s) => s.source === "manual" && s.url.includes("localhost"),
      );

      if (demoAgents.length === 0) {
        res.status(503).json({ error: "No agents available" });
        return;
      }

      const plan = await planPipeline(task, demoAgents);
      const steps = buildPipelineSteps(plan, demoAgents);
      const costs = calculateCosts(steps);

      res.json({
        task,
        steps: steps.length,
        step_details: steps.map((s) => ({
          service_name: s.service_name,
          price_usd: s.price_usd,
        })),
        ...costs,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Non-paywalled endpoint for dashboard to get task ID before SSE
  app.post("/task/plan", async (req, res) => {
    const { task } = req.body;

    if (!task || typeof task !== "string") {
      res.status(400).json({ error: "Missing required field: task" });
      return;
    }

    const taskId = crypto.randomUUID();
    res.json({ task_id: taskId });
  });

  app.listen(PORT, () => {
    console.log(
      `[orchestrator] Running on http://localhost:${PORT}`,
    );
  });
}

startServer().catch((err) => {
  console.error("[orchestrator] Failed to start:", err);
  process.exit(1);
});
