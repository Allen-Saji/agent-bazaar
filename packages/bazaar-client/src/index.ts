import type { BazaarEntry, DiscoverQuery } from "@agent-bazaar/common";
import { SERVICE_URLS } from "@agent-bazaar/common";

export class BazaarClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || SERVICE_URLS.BAZAAR;
  }

  async discover(query?: DiscoverQuery): Promise<BazaarEntry[]> {
    const params = new URLSearchParams();
    if (query?.category) params.set("category", query.category);
    if (query?.max_price) params.set("max_price", query.max_price);
    if (query?.healthy !== undefined)
      params.set("healthy", String(query.healthy));
    if (query?.tags) params.set("tags", query.tags);

    const url = `${this.baseUrl}/discover${params.toString() ? `?${params}` : ""}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Bazaar discover failed: ${res.status}`);
    }

    return res.json() as Promise<BazaarEntry[]>;
  }

  async catalog(): Promise<BazaarEntry[]> {
    const res = await fetch(`${this.baseUrl}/catalog`);

    if (!res.ok) {
      throw new Error(`Bazaar catalog failed: ${res.status}`);
    }

    return res.json() as Promise<BazaarEntry[]>;
  }

  async register(
    entry: Omit<
      BazaarEntry,
      "id" | "registered_at" | "last_health_check" | "healthy" | "source"
    >,
  ): Promise<{ id: string }> {
    const res = await fetch(`${this.baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      throw new Error(`Bazaar register failed: ${res.status}`);
    }

    return res.json() as Promise<{ id: string }>;
  }
}
