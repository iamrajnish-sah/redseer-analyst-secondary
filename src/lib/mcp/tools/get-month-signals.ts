import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  ACADEMIC_CYCLES,
  FESTIVALS,
  FESTIVE_DENSITY,
  MONTHS,
  MONTH_FULL,
  MUHURATS_V2,
  OVERVIEW_BASELINE,
  SALE_EVENTS,
  SEASON_PROFILE,
  type MonthKey,
} from "@/lib/data";

export default defineTool({
  name: "get_month_signals",
  title: "Get month signals",
  description:
    "Return the secondary-research signal bundle for one calendar month: festive density, festivals with drift, wedding/auspicious muhurat counts (CY vs LY), platform sale windows, academic cycles and the season profile.",
  inputSchema: {
    month: z
      .string()
      .describe("Month as a 3-letter key (Jan, Feb, ... Dec) or full name (January)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ month }) => {
    const input = month.trim().toLowerCase();
    const key = MONTHS.find(
      (m) => m.toLowerCase() === input || MONTH_FULL[m].toLowerCase() === input,
    ) as MonthKey | undefined;
    if (!key) throw new ToolError(`Unknown month "${month}". Use Jan–Dec or a full month name.`);

    const overview = OVERVIEW_BASELINE.find((r) => r.month === key);
    const payload = {
      month: key,
      month_full: MONTH_FULL[key],
      festive_density: FESTIVE_DENSITY[key],
      season_profile: SEASON_PROFILE[key],
      overview,
      festivals: FESTIVALS[key] ?? [],
      muhurats: MUHURATS_V2[key] ?? null,
      sale_events: SALE_EVENTS[key] ?? [],
      academic_cycles: ACADEMIC_CYCLES[key] ?? [],
      note: "Secondary signals only — no automated buy/sell or bullish/bearish verdict is implied.",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
