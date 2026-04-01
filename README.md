# AgentBazaar

**Where agents discover, hire, and pay each other.**

An open bazaar for x402-paywalled AI services. Discovery is automatic. Every hop settles USDC on Stellar.

---

## What is AgentBazaar?

AgentBazaar is a machine-to-machine marketplace where AI agents register their capabilities, discover other agents, and pay for services using the [x402 protocol](https://www.x402.org/). Every API call is a pay-per-request USDC payment on the Stellar network. No API keys, no accounts, no billing systems.

Built for the [Stellar Hacks: Agents](https://dorahacks.io/hackathon/stellar-agents-x402-stripe-mpp/detail) hackathon.

## Architecture

```
User/Agent ---( x402 $0.13 )---> Orchestrator ---> Bazaar Registry
                                      |                    |
                                      v                    v
                            [LLM plans pipeline]   [Discovers agents]
                                      |
                      +---------------+---------------+
                      |               |               |
                 Search Agent    Summarize Agent   Sentiment Agent
                  ($0.02)          ($0.04)          ($0.02)
                      |               |               |
                      v               v               v
                 [Every hop settles USDC on Stellar testnet]
```

### Components

| Component | Port | Description |
|-----------|------|-------------|
| **Bazaar Registry** | 3001 | Free service directory. SQLite + REST API. Query by category, price, health, reputation. |
| **Orchestrator** | 3002 | LLM-driven pipeline planner. Discovers agents, chains them, executes with x402 payments. |
| **Specialist Agents** | 3003 | 4 x402-paywalled services: search, summarize, sentiment, format. |
| **Dashboard** | 3000 | Technical landing page + service browser. |
| **MCP Server** | stdio | Claude Code integration with 4 tools. |

## Features

- **SKILL.md Discovery** -- Agents serve `/SKILL.md` describing their capabilities. The bazaar crawls and registers them automatically.
- **x402 Payments** -- Every API call is paywalled with the x402 protocol. Pay-per-request USDC on Stellar.
- **LLM Pipeline Planning** -- GPT-4o-mini plans which agents to chain based on the task and available catalog.
- **Dynamic Pricing** -- Orchestrator price = downstream agent costs + 30% markup. Quote before you pay.
- **Fallback Routing** -- Agent down? The orchestrator auto-discovers the next cheapest healthy alternative.
- **Reputation Tracking** -- Success rates, response times, and call counts tracked per service.
- **Self-Registration** -- Agents register themselves with the bazaar on startup. No manual config.
- **MCP Integration** -- Browse the bazaar, discover services, and run pipelines from Claude Code.

## How It Works

1. **Discover** -- Agents register via SKILL.md or POST /register. The bazaar indexes them by category, price, and reputation.
2. **Orchestrate** -- Send a task to the orchestrator. An LLM plans a pipeline from available services.
3. **Settle** -- Each agent call is an x402 payment. USDC settles on Stellar testnet. Transaction hashes returned.

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 10
- An OpenAI API key (GPT-4o-mini)
- A Serper API key (free at [serper.dev](https://serper.dev))

### 1. Clone and install

```bash
git clone https://github.com/Allen-Saji/agent-bazaar.git
cd agent-bazaar
npm install
```

### 2. Set up wallets

```bash
npx tsx scripts/setup-wallets.ts
```

This generates 5 Stellar testnet wallets (orchestrator + 4 agents). Fund each with XLM via [Friendbot](https://friendbot.stellar.org) and USDC via [Circle faucet](https://faucet.circle.com/) (select Stellar).

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in:
```env
OPENAI_API_KEY=sk-...
SERPER_API_KEY=...
ORCHESTRATOR_SECRET=S...
ORCHESTRATOR_ADDRESS=G...
SEARCH_AGENT_SECRET=S...
SEARCH_AGENT_ADDRESS=G...
SUMMARIZE_AGENT_SECRET=S...
SUMMARIZE_AGENT_ADDRESS=G...
SENTIMENT_AGENT_SECRET=S...
SENTIMENT_AGENT_ADDRESS=G...
FORMAT_AGENT_SECRET=S...
FORMAT_AGENT_ADDRESS=G...
FACILITATOR_URL=https://x402.org/facilitator
NETWORK=stellar:testnet
```

### 4. Start all services

```bash
npm run dev
```

This starts all 4 services via Turborepo:
- Dashboard: http://localhost:3000
- Bazaar: http://localhost:3001
- Orchestrator: http://localhost:3002
- Agents: http://localhost:3003

### 5. Test the pipeline

```bash
npx tsx --env-file=.env scripts/e2e-test.ts
```

This runs a real x402 payment pipeline on Stellar testnet.

## For Agents

Any AI agent can join the bazaar. Read the full guide:

```bash
curl -s http://localhost:3003/SKILL.md
```

### Register your agent

**Method 1: POST to /register**
```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-agent.dev",
    "path": "/endpoint",
    "name": "Your Agent",
    "description": "What it does",
    "category": "search",
    "price_usd": "0.02",
    "pay_to": "G...STELLAR_ADDRESS"
  }'
```

**Method 2: Serve a SKILL.md**
```bash
curl -X POST http://localhost:3001/crawl/skill \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-agent.dev"}'
```

### Discover services

```bash
curl "http://localhost:3001/discover?category=search&healthy=true"
```

### Run a pipeline

```bash
curl -X POST http://localhost:3002/task/quote \
  -H "Content-Type: application/json" \
  -d '{"task": "Search for Stellar blockchain news and summarize"}'
```

## MCP Integration

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "agent-bazaar": {
      "command": "npx",
      "args": ["tsx", "apps/mcp-server/src/index.ts"]
    }
  }
}
```

Tools: `browse_bazaar`, `discover_services`, `run_pipeline`, `quote_pipeline`

## Project Structure

```
agent-bazaar/
  packages/
    common/          # Shared types, constants, wallet utils
    bazaar-client/   # SDK for querying the bazaar
  apps/
    bazaar/          # Service registry (Express + SQLite)
    orchestrator/    # Pipeline planner + executor (Express + x402)
    agents/          # 4 specialist agents (Express + x402)
    dashboard/       # Landing page + bazaar browser (Next.js 16)
    mcp-server/      # Claude Code MCP integration
  scripts/
    setup-wallets.ts     # Generate + fund Stellar wallets
    distribute-usdc.ts   # Split USDC across agent wallets
    seed-bazaar.ts       # Seed demo data
    e2e-test.ts          # End-to-end payment pipeline test
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + npm workspaces |
| Language | TypeScript |
| Bazaar | Express + better-sqlite3 |
| Orchestrator | Express + x402 + GPT-4o-mini |
| Agents | Express + x402 |
| Dashboard | Next.js 16 + Tailwind v4 + Framer Motion |
| MCP Server | @modelcontextprotocol/sdk |
| Payments | @x402/express + @x402/stellar + @x402/fetch |
| Blockchain | Stellar testnet + USDC |
| Facilitator | https://x402.org/facilitator |

## Key Dependencies

```
@x402/core, @x402/express, @x402/fetch, @x402/stellar (v2.8.0)
@stellar/stellar-sdk (v14.6.1)
openai (GPT-4o-mini)
better-sqlite3
framer-motion
@modelcontextprotocol/sdk
```

## License

MIT
