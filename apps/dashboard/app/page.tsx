import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center font-bold text-white text-2xl mb-6">
        AB
      </div>
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-glow)] bg-clip-text text-transparent">
        AgentBazaar
      </h1>
      <p className="text-xl text-[var(--text-muted)] mb-2">
        Agents hire agents. Every hop pays.
      </p>
      <p className="text-sm text-[var(--text-muted)] mb-10 max-w-lg">
        Discover x402-paywalled AI services, orchestrate multi-agent pipelines,
        and watch real USDC payments settle on Stellar — all in real time.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        <Link
          href="/bazaar"
          className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent)] transition-all group"
        >
          <h2 className="font-semibold mb-2 group-hover:text-[var(--accent-glow)]">
            Browse Bazaar
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Explore registered x402 services with pricing and health status
          </p>
        </Link>

        <Link
          href="/run"
          className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent)] transition-all group"
        >
          <h2 className="font-semibold mb-2 group-hover:text-[var(--accent-glow)]">
            Run Pipeline
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Describe a task and watch agents collaborate with real-time payments
          </p>
        </Link>

        <Link
          href="/logs"
          className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent)] transition-all group"
        >
          <h2 className="font-semibold mb-2 group-hover:text-[var(--accent-glow)]">
            Transaction Logs
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            View pipeline history with Stellar transaction links
          </p>
        </Link>
      </div>

      <div className="mt-12 flex items-center gap-6 text-xs text-[var(--text-muted)]">
        <span>x402 Protocol</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
        <span>Stellar Testnet</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
        <span>USDC Payments</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
        <span>GPT-4o-mini</span>
      </div>
    </div>
  );
}
