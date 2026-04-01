/**
 * E2E test: calls the search agent via x402, paying $0.02 USDC on Stellar testnet.
 * Then calls the orchestrator /task endpoint via x402 ($0.15), which plans and
 * executes a full pipeline internally.
 */

async function main() {
  const { wrapFetchWithPayment, x402Client } = await import("@x402/fetch");
  const { createEd25519Signer } = await import("@x402/stellar");
  const { ExactStellarScheme } = await import("@x402/stellar/exact/client");

  const NETWORK = "stellar:testnet";

  // Use orchestrator wallet to pay (it has 16 USDC)
  const signer = createEd25519Signer(
    process.env.ORCHESTRATOR_SECRET!,
    NETWORK,
  );
  const client = new x402Client().register(
    "stellar:*",
    new ExactStellarScheme(signer),
  );
  const fetchWithPay = wrapFetchWithPayment(fetch, client);

  // === Test 1: Direct agent call (Search, $0.02) ===
  console.log("=== Test 1: Search Agent (x402, $0.02) ===\n");
  try {
    const searchRes = await fetchWithPay("http://localhost:3003/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Stellar blockchain x402", num_results: 3 }),
    });

    console.log(`Status: ${searchRes.status}`);
    const txHash = searchRes.headers.get("x-payment-tx-hash");
    if (txHash) console.log(`TX Hash: ${txHash}`);

    const searchData = await searchRes.json();
    console.log(`Results: ${JSON.stringify(searchData, null, 2).slice(0, 500)}`);
  } catch (err) {
    console.error("Search test failed:", (err as Error).message);
  }

  console.log("\n");

  // === Test 2: Full pipeline via orchestrator ($0.15) ===
  // Only run if Test 1 passed
  console.log("=== Test 2: Orchestrator Pipeline (x402, $0.15) ===\n");
  console.log("Task: 'Search for Stellar x402 protocol and summarize the results'\n");
  try {
    const taskRes = await fetchWithPay("http://localhost:3002/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "Search for Stellar x402 protocol and summarize the results",
      }),
    });

    console.log(`Status: ${taskRes.status}`);
    const result = await taskRes.json();
    const r = result as any;

    if (r.error) {
      console.log(`Error: ${r.error}`);
    } else {
      console.log(`Task ID: ${r.task_id}`);
      console.log(`Steps: ${r.steps?.length}`);
      console.log(`Duration: ${r.duration_ms}ms`);
      console.log(`User paid: $${r.user_paid_usd}`);
      console.log(`Downstream: $${r.total_downstream_cost_usd}`);
      console.log(`Margin: $${r.orchestrator_fee_usd}`);
      console.log("\nStep details:");
      for (const step of r.steps || []) {
        console.log(`  ${step.step_number}. ${step.service_name} - $${step.price_usd} - ${step.status} (${step.duration_ms}ms) ${step.tx_hash ? "TX:" + step.tx_hash.slice(0, 12) + "..." : ""}`);
      }
      console.log(`\nFinal output preview: ${JSON.stringify(r.final_output, null, 2).slice(0, 300)}...`);
    }
  } catch (err) {
    console.error("Pipeline test failed:", (err as Error).message);
  }
}

main().catch(console.error);
