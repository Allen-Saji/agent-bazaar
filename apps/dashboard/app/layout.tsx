import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AgentBazaar — Agents hire agents. Every hop pays.",
  description:
    "Paid agent discovery and pipeline orchestration on Stellar. x402 protocol payments.",
};

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors"
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
      <body className="min-h-screen">
        <nav className="border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center font-bold text-white text-sm">
                AB
              </div>
              <span className="font-semibold text-lg">AgentBazaar</span>
            </Link>
            <div className="flex items-center gap-1">
              <NavLink href="/bazaar">Bazaar</NavLink>
              <NavLink href="/run">Run Pipeline</NavLink>
              <NavLink href="/logs">Logs</NavLink>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
