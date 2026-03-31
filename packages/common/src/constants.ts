export const USDC_CONTRACT =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://x402.org/facilitator";

export const NETWORK: `${string}:${string}` =
  (process.env.NETWORK as `${string}:${string}`) || "stellar:testnet";

export const PORTS = {
  BAZAAR: 3001,
  ORCHESTRATOR: 3002,
  AGENTS: 3003,
} as const;

export const PRICES = {
  ORCHESTRATOR: "0.15",
  SEARCH: "0.02",
  SUMMARIZE: "0.04",
  SENTIMENT: "0.02",
  FORMAT: "0.02",
} as const;

export const SERVICE_URLS = {
  BAZAAR: process.env.BAZAAR_URL || `http://localhost:${PORTS.BAZAAR}`,
  ORCHESTRATOR:
    process.env.ORCHESTRATOR_URL || `http://localhost:${PORTS.ORCHESTRATOR}`,
  AGENTS: process.env.AGENTS_URL || `http://localhost:${PORTS.AGENTS}`,
} as const;
