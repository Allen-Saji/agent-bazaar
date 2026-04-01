"use client";

import type { BazaarService } from "@/lib/api";

const categoryAccents: Record<string, string> = {
  search: "text-[var(--stellar-blue)]",
  inference: "text-purple-400",
  analysis: "text-[var(--accent)]",
  format: "text-[var(--success)]",
  weather: "text-cyan-400",
  news: "text-orange-400",
  crypto: "text-[var(--accent)]",
  image: "text-pink-400",
  scrape: "text-red-400",
  data: "text-[var(--text-muted)]",
};

export function ServiceCard({ service }: { service: BazaarService }) {
  return (
    <div className="p-5 bg-[var(--bg)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 group cursor-pointer">
      {/* Header: name + price */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${service.healthy ? "bg-[var(--success)]" : "bg-[var(--error)]"}`}
          />
          <h3 className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors duration-200">
            {service.name}
          </h3>
        </div>
        <span className="text-[var(--accent)] font-mono text-sm font-bold">
          ${service.price_usd}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--text-muted)] mb-4 line-clamp-2 leading-relaxed">
        {service.description}
      </p>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className={`text-[10px] font-mono tracking-wider uppercase ${categoryAccents[service.category] || categoryAccents.data}`}
        >
          {service.category}
        </span>
        <span className="text-[var(--text-dim)]">/</span>
        <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--stellar-blue)]">
          {service.network}
        </span>
        {service.source === "crawl" && (
          <>
            <span className="text-[var(--text-dim)]">/</span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-dim)]">
              xlm402
            </span>
          </>
        )}
      </div>

      {/* Reputation */}
      {(service.total_calls ?? 0) > 0 && (
        <div className="flex items-center gap-3 mb-3 text-[10px] font-mono">
          <span className="text-[var(--success)]">
            {Math.round(((service.successful_calls ?? 0) / (service.total_calls ?? 1)) * 100)}% success
          </span>
          <span className="text-[var(--text-dim)]">/</span>
          <span className="text-[var(--text-muted)]">
            {service.total_calls} calls
          </span>
          <span className="text-[var(--text-dim)]">/</span>
          <span className="text-[var(--text-muted)]">
            {Math.round(service.avg_response_ms ?? 0)}ms avg
          </span>
        </div>
      )}

      {/* Endpoint */}
      <div className="pt-3 border-t border-[var(--border)]">
        <code className="text-[10px] text-[var(--text-dim)] block truncate font-mono">
          {service.method} {service.url}
          {service.path}
        </code>
      </div>
    </div>
  );
}
