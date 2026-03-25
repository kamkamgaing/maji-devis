const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchPage(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": randomUA(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.5",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });

      if (res.status === 429) {
        const wait = (i + 1) * 5000;
        console.log(`[Scraper] Rate limited sur ${url}, attente ${wait}ms...`);
        await delay(wait);
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries) throw err;
      await delay(2000 * (i + 1));
    }
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.,]/g, "").replace(/\s/g, "");
  const normalized = cleaned.replace(",", ".");
  const parts = normalized.split(".");
  if (parts.length > 2) {
    const last = parts.pop();
    return parseFloat(parts.join("") + "." + last);
  }
  const val = parseFloat(normalized);
  return isNaN(val) ? null : val;
}

function parseStock(text) {
  if (!text) return null;
  const num = text.replace(/[^\d]/g, "");
  const val = parseInt(num);
  return isNaN(val) ? null : val;
}

module.exports = { fetchPage, delay, parsePrice, parseStock, randomUA };
