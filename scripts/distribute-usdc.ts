import {
  Keypair,
  Contract,
  rpc,
  Address,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

const USDC_CONTRACT = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET!;
const orchestratorKeypair = Keypair.fromSecret(ORCHESTRATOR_SECRET);
const orchestratorAddress = orchestratorKeypair.publicKey();

// Agent wallets that need USDC
const AGENTS = [
  { name: "SEARCH", address: process.env.SEARCH_AGENT_ADDRESS! },
  { name: "SUMMARIZE", address: process.env.SUMMARIZE_AGENT_ADDRESS! },
  { name: "SENTIMENT", address: process.env.SENTIMENT_AGENT_ADDRESS! },
  { name: "FORMAT", address: process.env.FORMAT_AGENT_ADDRESS! },
];

// Amount per agent: 1 USDC each (7 decimals)
const AMOUNT_PER_AGENT = 1_0000000n; // 1 USDC

function i128ToScVal(value: bigint): xdr.ScVal {
  const lo = value & ((1n << 64n) - 1n);
  const hi = value >> 64n;
  return xdr.ScVal.scvI128(
    new xdr.Int128Parts({
      lo: new xdr.Uint64(lo),
      hi: new xdr.Int64(hi),
    }),
  );
}

async function checkBalance(address: string): Promise<bigint> {
  const contract = new Contract(USDC_CONTRACT);
  const call = contract.call("balance", new Address(address).toScVal());
  const account = await server.getAccount(address);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(call)
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
    const parts = sim.result.retval.value() as any;
    const lo = parts.lo();
    const hi = parts.hi();
    const bigLo = BigInt(lo.low >>> 0) + (BigInt(lo.high >>> 0) << 32n);
    const bigHi = BigInt(hi.low >>> 0) + (BigInt(hi.high >>> 0) << 32n);
    return bigLo + (bigHi << 64n);
  }
  return 0n;
}

async function transfer(to: string, amount: bigint): Promise<string> {
  const contract = new Contract(USDC_CONTRACT);
  const call = contract.call(
    "transfer",
    new Address(orchestratorAddress).toScVal(),
    new Address(to).toScVal(),
    i128ToScVal(amount),
  );

  const account = await server.getAccount(orchestratorAddress);
  const tx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(call)
    .setTimeout(60)
    .build();

  // Simulate first
  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim)}`);
  }

  // Prepare and sign
  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(orchestratorKeypair);

  // Submit
  const sendResult = await server.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(`Send failed: ${JSON.stringify(sendResult)}`);
  }

  // Poll for result
  let result;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    result = await server.getTransaction(sendResult.hash);
    if (result.status !== "NOT_FOUND") break;
  }

  if (!result || result.status !== "SUCCESS") {
    throw new Error(`TX failed: ${result?.status}`);
  }

  return sendResult.hash;
}

async function main() {
  console.log("=== USDC Distribution ===\n");

  // Check orchestrator balance
  const orchBalance = await checkBalance(orchestratorAddress);
  console.log(`Orchestrator USDC: ${Number(orchBalance) / 1e7} USDC`);

  if (orchBalance === 0n) {
    console.log("\nNo USDC found in orchestrator wallet!");
    console.log("Make sure the Circle faucet transaction has settled.");
    process.exit(1);
  }

  // Transfer 1 USDC to each agent
  for (const agent of AGENTS) {
    console.log(`\nTransferring 1 USDC to ${agent.name} (${agent.address.slice(0, 8)}...)...`);
    try {
      const hash = await transfer(agent.address, AMOUNT_PER_AGENT);
      console.log(`  Done! TX: ${hash}`);
    } catch (err) {
      console.error(`  Error: ${(err as Error).message.slice(0, 200)}`);
    }
  }

  // Final balances
  console.log("\n=== Final Balances ===\n");
  const finalOrch = await checkBalance(orchestratorAddress);
  console.log(`Orchestrator: ${Number(finalOrch) / 1e7} USDC`);
  for (const agent of AGENTS) {
    const bal = await checkBalance(agent.address);
    console.log(`${agent.name}: ${Number(bal) / 1e7} USDC`);
  }
}

main().catch(console.error);
