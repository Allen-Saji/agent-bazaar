"use client";

import type { BazaarService } from "@/lib/api";

const categoryColors: Record<string, string> = {
  search: "bg-blue-500/20 text-blue-400",
  inference: "bg-purple-500/20 text-purple-400",
  analysis: "bg-amber-500/20 text-amber-400",
  format: "bg-green-500/20 text-green-400",
  weather: "bg-cyan-500/20 text-cyan-400",
  news: "bg-orange-500/20 text-orange-400",
  crypto: "bg-yellow-500/20 text-yellow-400",
  image: "bg-pink-500/20 text-pink-400",
  scrape: "bg-red-500/20 text-red-400",
  data: "bg-gray-500/20 text-gray-400",
};

export function ServiceCard({ service }: { service: BazaarService }) {
  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${service.healthy ? "bg-[var(--success)]" : "bg-[var(--error)]"}`}
          />
          <h3 className="font-semibold text-sm">{service.name}</h3>
        </div>
        <span className="text-[var(--accent-glow)] font-mono text-sm font-semibold">
          ${service.price_usd}
        </span>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">
        {service.description}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[service.category] || categoryColors.data}`}
        >
          {service.category}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--stellar-blue)]/20 text-[var(--stellar-blue)]">
          {service.network}
        </span>
        {service.source === "crawl" && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400">
            xlm402
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        <code className="text-xs text-[var(--text-muted)] block truncate">
          {service.method} {service.url}
          {service.path}
        </code>
      </div>
    </div>
  );
}
