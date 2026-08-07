import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

function tally(values: (string | null | undefined)[]) {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = (v ?? "unknown").toString();
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
}

export default defineTool({
  name: "meta_ads_analytics",
  title: "Meta ads analytics",
  description:
    "Aggregate analytics over the tracked Meta Ad Library records: totals, active share, average days running, and breakdowns by platform, media type, CTA, language, category and advertiser.",
  inputSchema: {
    brand: z.string().optional().describe("Restrict the analysis to one brand/advertiser."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ brand }) => {
    let q = supabaseAnon()
      .from("meta_ads")
      .select("brand,advertiser_name,page_name,platforms,media_type,language,cta,category,status,start_date")
      .limit(5000);
    if (brand) q = q.ilike("brand", `%${brand}%`);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const rows = data ?? [];

    if (rows.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: brand
              ? `No tracked Meta ads for brand "${brand}" yet. Ads are ingested from the app's Meta Ads dashboard.`
              : "No tracked Meta ads yet. Ads are ingested from the app's Meta Ads dashboard.",
          },
        ],
      };
    }

    const now = Date.now();
    const durations = rows
      .map((r) => (r.start_date ? (now - new Date(r.start_date).getTime()) / 86_400_000 : null))
      .filter((d): d is number => typeof d === "number" && Number.isFinite(d));

    const summary = {
      brand: brand ?? "all",
      total_ads: rows.length,
      active_ads: rows.filter((r) => r.status === "ACTIVE").length,
      avg_days_running: durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null,
      longest_running_days: durations.length ? Math.round(Math.max(...durations)) : null,
      by_platform: tally(rows.flatMap((r) => (r.platforms as string[] | null) ?? ["unknown"])),
      by_media_type: tally(rows.map((r) => r.media_type)),
      by_cta: tally(rows.map((r) => r.cta)),
      by_language: tally(rows.map((r) => r.language)),
      by_category: tally(rows.map((r) => r.category)),
      top_advertisers: Object.entries(tally(rows.map((r) => r.advertiser_name ?? r.page_name ?? null)))
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
