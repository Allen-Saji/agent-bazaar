import {
  Keypair,
  TransactionBuilder,
  Networks,
} from "@stellar/stellar-sdk";

const SPONSOR_URL =
  "https://stellar-sponsored-agent-account.onrender.com";

const WALLET_NAMES = [
  "ORCHESTRATOR",
  "SEARCH_AGENT",
  "SUMMARIZE_AGENT",
  "SENTIMENT_AGENT",
  "FORMAT_AGENT",
];

interface CreateResponse {
  transactionXDR: string;
}

async function createSponsoredAccount(
  keypair: Keypair,
  name: string,
): Promise<void> {
  console.log(`\n[${name}] Creating sponsored account...`);
  console.log(`  Public Key: ${keypair.publicKey()}`);

  // Step 1: Request account creation XDR
  const createRes = await fetch(`${SPONSOR_URL}/create-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey: keypair.publicKey() }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create account for ${name}: ${err}`);
  }

  const { transactionXDR } = (await createRes.json()) as CreateResponse;

  // Step 2: Sign the XDR
  const tx = TransactionBuilder.fromXDR(transactionXDR, Networks.TESTNET);
  tx.sign(keypair);
  const signedXDR = tx.toXDR();

  // Step 3: Submit signed transaction
  const submitRes = await fetch(`${SPONSOR_URL}/submit-transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedXDR }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Failed to submit transaction for ${name}: ${err}`);
  }

  const result = await submitRes.json();
  console.log(`  Account created! TX: ${(result as { hash?: string }).hash || "OK"}`);
}

async function main() {
  console.log("=== AgentBazaar Wallet Setup ===\n");
  console.log("Generating 5 Stellar testnet wallets...\n");

  const envLines: string[] = [];

  for (const name of WALLET_NAMES) {
    const keypair = Keypair.random();

    try {
      await createSponsoredAccount(keypair, name);
    } catch (err) {
      console.error(
        `  Error: ${(err as Error).message}`,
      );
      console.log(
        `  You can manually create this account at https://lab.stellar.org`,
      );
    }

    envLines.push(`${name}_SECRET=${keypair.secret()}`);
    envLines.push(`${name}_ADDRESS=${keypair.publicKey()}`);
  }

  console.log("\n=== Add these to your .env file ===\n");
  console.log(envLines.join("\n"));
  console.log(
    "\n=== IMPORTANT: Fund each address with testnet USDC ===",
  );
  console.log("Go to: https://faucet.circle.com/ (select Stellar)");
  console.log("Fund these addresses:");
  for (const name of WALLET_NAMES) {
    const addrLine = envLines.find((l) =>
      l.startsWith(`${name}_ADDRESS=`),
    );
    if (addrLine) console.log(`  ${addrLine}`);
  }
}

main().catch(console.error);
