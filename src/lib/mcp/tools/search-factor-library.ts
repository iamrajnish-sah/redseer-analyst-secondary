import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { REFERENCE_LIBRARY } from "@/lib/data";

export default defineTool({
  name: "search_factor_library",
  title: "Search factor library",
  description:
    "Search the secondary-indicator reference library (55+ factors) by keyword or category. Each result includes why the factor matters, its source and its update frequency.",
  inputSchema: {
    query: z.string().optional().describe("Keyword matched against factor name, rationale and source."),
    category: z.string().optional().describe("Category filter, e.g. Calendar, Climate, Macroeconomic, Platform Intel."),
    limit: z.number().int().optional().describe("Max results, 1-60 (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, category, limit }) => {
    const take = Math.min(Math.max(limit ?? 20, 1), 60);
    const q = query?.trim().toLowerCase();
    const cat = category?.trim().toLowerCase();

    const rows = REFERENCE_LIBRARY.filter((f) => {
      const catOk = !cat || f.category.toLowerCase().includes(cat);
      const qOk =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.why.toLowerCase().includes(q) ||
        f.source.toLowerCase().includes(q);
      return catOk && qOk;
    }).slice(0, take);

    const payload = {
      total_in_library: REFERENCE_LIBRARY.length,
      count: rows.length,
      factors: rows,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
