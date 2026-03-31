import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only expose safe, non-secret env vars to the browser
  env: {
    NEXT_PUBLIC_BAZAAR_URL: process.env.NEXT_PUBLIC_BAZAAR_URL || "http://localhost:3001",
    NEXT_PUBLIC_ORCHESTRATOR_URL: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:3002",
  },
};

export default nextConfig;
