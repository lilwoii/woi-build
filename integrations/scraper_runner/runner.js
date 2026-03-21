import fetch from "node-fetch";
import { PlaywrightCrawler } from "crawlee";

const API_BASE = process.env.WOI_API_BASE || "http://localhost:8000";
const MAX_PER_CYCLE = Number(process.env.SCRAPER_MAX_PER_CYCLE || 3);

async function getBatch() {
  const res = await fetch(`${API_BASE}/api/woi/scrape/run_once`, { method: "POST" });
  if (!res.ok) throw new Error(`batch failed ${res.status}`);
  return res.json();
}

async function markDone(id) {
  // For v1 we don't expose mark endpoints; node runner just crawls.
  // Bundle 5 upgrades this to mark status and ingest.
}

async function main() {
  console.log("WOI Scraper Runner starting:", { API_BASE, MAX_PER_CYCLE });

  while (true) {
    let batch = [];
    try {
      const data = await getBatch();
      batch = data.batch || [];
    } catch (e) {
      console.error("Batch error:", e.message);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    if (!batch.length) {
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    const urls = batch.map(x => x.url).filter(Boolean);
    console.log("Crawling:", urls);

    const crawler = new PlaywrightCrawler({
      maxRequestsPerCrawl: MAX_PER_CYCLE,
      async requestHandler({ request, page, log }) {
        const title = await page.title().catch(()=> "");
        const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 20000) || "").catch(()=> "");
        const payload = { url: request.url, title, text: bodyText };

        // Store to WOI memory via chat endpoint for now (acts as ingestion signal)
        await fetch(`${API_BASE}/api/woi/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `SCRAPE_RESULT\nURL: ${payload.url}\nTITLE: ${payload.title}\nCONTENT:\n${payload.text}`,
            tier: "light",
            mode: "analyst"
          })
        }).catch(()=>{});

        log.info(`Posted scrape result: ${request.url}`);
      }
    });

    try {
      await crawler.run(urls);
    } catch (e) {
      console.error("Crawler run error:", e.message);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
