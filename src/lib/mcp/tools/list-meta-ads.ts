import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_meta_ads",
  title: "List Meta ads",
  description:
    "List Meta (Facebook/Instagram) Ad Library records tracked by this app, newest first. Filter by brand, status, media type or a free-text query on the creative copy.",
  inputSchema: {
    brand: z.string().optional().describe("Brand/advertiser filter, e.g. \"Meesho\"."),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional().describe("Ad status filter."),
    media_type: z.string().optional().describe("Media type filter, e.g. image, video, dco."),
    query: z.string().optional().describe("Free-text search across creative text and headline."),
    limit: z.number().int().optional().describe("Max rows to return, 1-100 (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ brand, status, media_type, query, limit }) => {
    const take = Math.min(Math.max(limit ?? 25, 1), 100);
    let q = supabaseAnon()
      .from("meta_ads")
      .select(
        "ad_archive_id,brand,advertiser_name,page_name,platforms,media_type,language,cta,headline,creative_text,category,status,start_date,end_date,snapshot_url",
      )
      .order("start_date", { ascending: false })
      .limit(take);

    if (brand) q = q.ilike("brand", `%${brand}%`);
    if (status) q = q.eq("status", status);
    if (media_type) q = q.ilike("media_type", `%${media_type}%`);
    if (query) q = q.or(`creative_text.ilike.%${query}%,headline.ilike.%${query}%`);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);

    const rows = (data ?? []).map((r) => ({
      ...r,
      days_running: r.start_date
        ? Math.max(
            0,
            Math.floor((Date.now() - new Date(r.start_date).getTime()) / 86_400_000),
          )
        : null,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify({ count: rows.length, ads: rows }, null, 2) }],
      structuredContent: { count: rows.length, ads: rows },
    };
  },
});
