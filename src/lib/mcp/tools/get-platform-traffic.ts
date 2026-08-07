import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SIMILARWEB_DATA } from "@/lib/data";

export default defineTool({
  name: "get_platform_traffic",
  title: "Get platform traffic",
  description:
    "Return the tracked SimilarWeb-style web traffic snapshot for Indian e-commerce platforms: monthly visits (millions), MoM change %, avg visit duration and bounce rate.",
  inputSchema: {
    platform: z.string().optional().describe("Optional platform name filter, e.g. \"Myntra\"."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ platform }) => {
    const needle = platform?.trim().toLowerCase();
    const rows = SIMILARWEB_DATA.filter(
      (r) => !needle || r.platform.toLowerCase().includes(needle),
    ).map((r) => ({
      platform: r.platform,
      visits_millions: r.visits,
      mom_change_pct: r.mom,
      avg_visit_duration: r.duration,
      bounce_rate_pct: r.bounce,
    }));

    const payload = {
      metric: "Web visits (SimilarWeb-style estimates) — not Google search interest",
      rows,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
