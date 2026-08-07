import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { FESTIVE_DENSITY, MONTHS, OVERVIEW_BASELINE, SEASON_PROFILE } from "@/lib/data";

export default defineTool({
  name: "get_cross_comparison_matrix",
  title: "Get 12-month matrix",
  description:
    "Return the full 12-month cross-comparison matrix: festival counts (current vs last year), wedding muhurat counts, sale-event counts, weather flag, analyst sentiment label, confidence and festive density.",
  inputSchema: {
    month: z.string().optional().describe("Optional 3-letter month key to return a single row."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ month }) => {
    const wanted = month?.trim().toLowerCase();
    const rows = OVERVIEW_BASELINE.filter(
      (r) => !wanted || r.month.toLowerCase() === wanted,
    ).map((r) => ({
      ...r,
      festive_density: FESTIVE_DENSITY[r.month],
      season_profile: SEASON_PROFILE[r.month],
      festival_delta: r.festivalCY - r.festivalLY,
      wedding_delta: r.weddingCY - r.weddingLY,
    }));

    const payload = { months: MONTHS, rows };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
