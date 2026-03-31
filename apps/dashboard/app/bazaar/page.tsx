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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Service Bazaar</h1>
        <p className="text-[var(--text-muted)]">
          {services.length} services registered &middot; {healthyCount} healthy
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === cat
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          Loading services...
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-[var(--error)] mb-2">Failed to load services</p>
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Make sure the Bazaar server is running on port 3001
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          No services found for category &quot;{filter}&quot;
        </div>
      )}
    </div>
  );
}
