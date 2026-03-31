import { Keypair } from "@stellar/stellar-sdk";

export function generateKeypair(): {
  publicKey: string;
  secretKey: string;
} {
  const pair = Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

export async function createSponsoredAccount(
  publicKey: string,
): Promise<{ xdr: string }> {
  const res = await fetch(
    "https://stellar-sponsored-agent-account.onrender.com/create-account",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey }),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to create sponsored account: ${res.status} ${await res.text()}`,
    );
  }

  return res.json() as Promise<{ xdr: string }>;
}

export async function submitSignedTransaction(
  signedXdr: string,
): Promise<{ hash: string }> {
  const res = await fetch(
    "https://stellar-sponsored-agent-account.onrender.com/submit-transaction",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedXdr }),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to submit transaction: ${res.status} ${await res.text()}`,
    );
  }

  return res.json() as Promise<{ hash: string }>;
}
