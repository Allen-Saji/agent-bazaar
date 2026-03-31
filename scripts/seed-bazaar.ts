const BAZAAR_URL = process.env.BAZAAR_URL || "http://localhost:3001";

async function main() {
  console.log("=== Seeding Bazaar Registry ===\n");

  // Crawl xlm402.com
  console.log("Crawling xlm402.com...");
  const crawlRes = await fetch(`${BAZAAR_URL}/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://xlm402.com" }),
  });

  if (crawlRes.ok) {
    const result = await crawlRes.json();
    console.log(`  Crawled: ${JSON.stringify(result)}`);
  } else {
    console.error(`  Failed: ${crawlRes.status} ${await crawlRes.text()}`);
  }

  // Check catalog
  console.log("\nFetching catalog...");
  const catalogRes = await fetch(`${BAZAAR_URL}/catalog`);
  if (catalogRes.ok) {
    const catalog = (await catalogRes.json()) as Array<{ name: string; category: string; price_usd: string }>;
    console.log(`  Total services: ${catalog.length}`);
    for (const s of catalog) {
      console.log(`  - ${s.name} [${s.category}] $${s.price_usd}`);
    }
  }
}

main().catch(console.error);
