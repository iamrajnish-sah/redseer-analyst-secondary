import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MACRO_SIGNALS_V2, ELECTRONICS_IMPORTS, SUPPLY_FACTORS } from "@/lib/data";

export default defineTool({
  name: "get_macro_indicators",
  title: "Get macro indicators",
  description:
    "Return the macro & consumer indicator set with month-on-month comparison (inflation, fuel, UPI volume, card spends, repo rate), plus the electronics import sub-grid and supply-chain watch factors.",
  inputSchema: {
    query: z.string().optional().describe("Optional text filter on the indicator label."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    const needle = query?.trim().toLowerCase();
    const macro = MACRO_SIGNALS_V2.filter(
      (m) => !needle || m.label.toLowerCase().includes(needle),
    ).map((m) => ({
      key: m.key,
      label: m.label,
      current_month: m.cm,
      previous_month: m.pm,
      unit: m.unit,
      mom_delta: Number((m.cm - m.pm).toFixed(2)),
    }));

    const payload = {
      comparison_basis: "Month-on-Month (MoM)",
      macro_indicators: macro,
      electronics_imports: ELECTRONICS_IMPORTS.map((r) => ({
        segment: r.name,
        current_year: r.cy,
        previous_year: r.py,
        yoy_delta: Number((r.cy - r.py).toFixed(2)),
      })),
      supply_chain_watch: SUPPLY_FACTORS,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
