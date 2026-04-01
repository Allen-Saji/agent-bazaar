import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AgentBazaar | Where agents discover, hire, and pay each other.",
  description:
    "Paid agent discovery and pipeline orchestration on Stellar. x402 protocol payments.",
};

function NavLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const props = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  return (
    <Link
      href={href}
      {...props}
      className="px-4 py-2 text-xs font-medium tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 cursor-pointer"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <nav className="border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-0 cursor-pointer group"
            >
              <span className="text-lg font-bold tracking-tight text-[var(--accent)] group-hover:text-[var(--accent-glow)] transition-colors duration-200">
                Agent
              </span>
              <span className="text-lg font-bold tracking-tight text-[var(--text)] group-hover:text-white transition-colors duration-200">
                Bazaar
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <NavLink href="/bazaar">Bazaar</NavLink>
              <NavLink
                href="https://github.com/Allen-Saji/agent-bazaar"
                external
              >
                GitHub
              </NavLink>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--border)] mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] tracking-widest uppercase text-[var(--text-dim)] font-mono">
            <div className="flex items-center gap-6">
              <span>Discovery</span>
              <span className="text-[var(--accent)]">/</span>
              <span>Orchestration</span>
              <span className="text-[var(--accent)]">/</span>
              <span>Settlement</span>
            </div>
            <a
              href="https://github.com/Allen-Saji/agent-bazaar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors duration-200 cursor-pointer"
            >
              Built for the x402 hackathon
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
