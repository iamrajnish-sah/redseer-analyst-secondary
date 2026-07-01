import { createServerFn } from "@tanstack/react-start";

export type MonthlyPoint = {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2025"
  Amazon: number;
  Flipkart: number;
  Meesho: number;
  Myntra: number;
  Shopsy: number;
};

export type SearchInterestPayload = {
  points: MonthlyPoint[];
  fetchedAt: string;
  source: "serpapi" | "cache";
  cacheAgeMs: number;
};

const KEYWORDS = ["Amazon", "Flipkart", "Meesho", "Myntra", "Shopsy"] as const;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = { data: Omit<SearchInterestPayload, "source" | "cacheAgeMs">; ts: number };
// Module-level cache. Workers may recycle, so this is best-effort.
let cache: CacheEntry | null = null;

const MONTH_LABEL = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseSerpDate(raw: string): Date | null {
  // SerpApi returns e.g. "Jun 29 – Jul 5, 2025" (en-dash) or "Jul 2024".
  // Strip a trailing " – Mmm dd" or " - dd" range fragment before the year.
  const yearMatch = raw.match(/(\d{4})\s*$/);
  if (!yearMatch) return null;
  const year = yearMatch[1];
  const head = raw.slice(0, yearMatch.index).replace(/,\s*$/, "");
  // Take the part before any dash (hyphen or en/em-dash)
  const firstSegment = head.split(/[-–—]/)[0].trim();
  const d = new Date(`${firstSegment}, ${year}`);
  if (!isNaN(d.getTime())) return d;
  return null;
}

async function fetchFromSerpApi(): Promise<Omit<SearchInterestPayload, "source" | "cacheAgeMs">> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY not configured");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_trends");
  url.searchParams.set("q", KEYWORDS.join(","));
  url.searchParams.set("data_type", "TIMESERIES");
  url.searchParams.set("date", "today 12-m");
  url.searchParams.set("geo", "IN");
  url.searchParams.set("api_key", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpApi ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    error?: string;
    interest_over_time?: {
      timeline_data?: Array<{
        date: string;
        values: Array<{ query: string; value: string; extracted_value: number }>;
      }>;
    };
  };
  if (json.error) throw new Error(`SerpApi: ${json.error}`);
  const timeline = json.interest_over_time?.timeline_data ?? [];
  if (!timeline.length) throw new Error("No timeline data returned");

  // Aggregate to calendar months.
  const buckets = new Map<string, { sums: Record<string, number>; n: number; date: Date }>();
  for (const row of timeline) {
    const d = parseSerpDate(row.date);
    if (!d) continue;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    let b = buckets.get(key);
    if (!b) {
      b = { sums: Object.fromEntries(KEYWORDS.map((k) => [k, 0])), n: 0, date: d };
      buckets.set(key, b);
    }
    for (const v of row.values) {
      const kw = KEYWORDS.find((k) => k.toLowerCase() === v.query.toLowerCase());
      if (kw) b.sums[kw] += Number(v.extracted_value) || 0;
    }
    b.n += 1;
  }

  const points: MonthlyPoint[] = Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, b]) => ({
      month,
      label: `${MONTH_LABEL[b.date.getUTCMonth()]} ${b.date.getUTCFullYear()}`,
      Amazon: Math.round(b.sums.Amazon / Math.max(b.n, 1)),
      Flipkart: Math.round(b.sums.Flipkart / Math.max(b.n, 1)),
      Meesho: Math.round(b.sums.Meesho / Math.max(b.n, 1)),
      Myntra: Math.round(b.sums.Myntra / Math.max(b.n, 1)),
      Shopsy: Math.round(b.sums.Shopsy / Math.max(b.n, 1)),
    }));

  return { points, fetchedAt: new Date().toISOString() };
}

export const getSearchInterest = createServerFn({ method: "GET" })
  .inputValidator((data: { refresh?: boolean } | undefined) => data ?? {})
  .handler(async ({ data }): Promise<SearchInterestPayload> => {
    const now = Date.now();
    if (!data.refresh && cache && now - cache.ts < CACHE_TTL_MS) {
      return { ...cache.data, source: "cache", cacheAgeMs: now - cache.ts };
    }
    const fresh = await fetchFromSerpApi();
    cache = { data: fresh, ts: now };
    return { ...fresh, source: "serpapi", cacheAgeMs: 0 };
  });
