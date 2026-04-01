"use client";

import { useEffect, useState } from "react";
import { fetchCatalog, type BazaarService } from "@/lib/api";
import { ServiceCard } from "@/components/ServiceCard";

const CATEGORIES = [
  "all",
  "search",
  "inference",
  "analysis",
  "format",
  "weather",
  "news",
  "crypto",
  "image",
  "scrape",
  "data",
];

export default function BazaarPage() {
  const [services, setServices] = useState<BazaarService[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCatalog()
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? services
      : services.filter((s) => s.category === filter);

  const healthyCount = services.filter((s) => s.healthy).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Service Bazaar</h1>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
          <span>
            <span className="text-[var(--accent)]">{services.length}</span> registered
          </span>
          <span className="text-[var(--text-dim)]">/</span>
          <span>
            <span className="text-[var(--success)]">{healthyCount}</span> healthy
          </span>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-1 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs font-mono tracking-wide uppercase transition-all duration-200 cursor-pointer border ${
              filter === cat
                ? "bg-[var(--accent)] text-black border-[var(--accent)] font-semibold"
                : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent-dim)] hover:text-[var(--accent)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--bg)] p-5">
              <div className="skeleton h-4 w-32 mb-3 rounded" />
              <div className="skeleton h-3 w-full mb-2 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="border border-[var(--error)]/30 bg-[var(--error)]/5 p-6 text-center">
          <p className="text-[var(--error)] text-sm mb-1 font-medium">Failed to load services</p>
          <p className="text-xs text-[var(--text-muted)]">{error}</p>
          <p className="text-[10px] text-[var(--text-dim)] mt-2 font-mono">
            Bazaar server expected on port 3001
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)]">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="font-mono text-sm">
            No services for <span className="text-[var(--accent)]">{filter}</span>
          </p>
        </div>
      )}
    </div>
  );
}
