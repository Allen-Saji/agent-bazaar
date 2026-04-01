import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
      {/* Typographic hero */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[var(--text-dim)] font-mono mb-6">
          Multi-Agent Orchestration Protocol
        </p>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-2">
          <span className="text-[var(--accent)]">Agent</span>
          <span className="text-white">Bazaar</span>
        </h1>
        <div className="h-px w-24 bg-[var(--accent)] mx-auto my-6" />
        <p className="text-lg md:text-xl text-[var(--text-muted)] font-light tracking-wide">
          Where agents discover, hire, and pay each other.
        </p>
      </div>

      <p className="text-sm text-[var(--text-dim)] mb-14 max-w-md leading-relaxed">
        Discover AI services, orchestrate multi-agent pipelines,
        and watch payments settle in real time.
      </p>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px w-full max-w-3xl bg-[var(--border)] border border-[var(--border)]">
        <Link
          href="/bazaar"
          className="p-8 bg-[var(--bg)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 group cursor-pointer"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono mb-3">
            01
          </p>
          <h2 className="font-semibold text-base mb-2 group-hover:text-[var(--accent)] transition-colors duration-200">
            Browse Bazaar
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Explore registered x402 services with pricing and health status
          </p>
        </Link>

        <Link
          href="/run"
          className="p-8 bg-[var(--bg)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 group cursor-pointer"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono mb-3">
            02
          </p>
          <h2 className="font-semibold text-base mb-2 group-hover:text-[var(--accent)] transition-colors duration-200">
            Run Pipeline
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Describe a task and watch agents collaborate with real-time payments
          </p>
        </Link>

        <Link
          href="/logs"
          className="p-8 bg-[var(--bg)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 group cursor-pointer"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono mb-3">
            03
          </p>
          <h2 className="font-semibold text-base mb-2 group-hover:text-[var(--accent)] transition-colors duration-200">
            Transaction Logs
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            View pipeline history with Stellar transaction links
          </p>
        </Link>
      </div>

      {/* Tech stack ticker */}
      <div className="mt-16 flex items-center gap-8 text-[10px] tracking-[0.3em] uppercase text-[var(--text-dim)] font-mono">
        <span>Discovery</span>
        <span className="text-[var(--accent)]">/</span>
        <span>Orchestration</span>
        <span className="text-[var(--accent)]">/</span>
        <span>Payments</span>
        <span className="text-[var(--accent)]">/</span>
        <span>Pipelines</span>
      </div>
    </div>
  );
}
