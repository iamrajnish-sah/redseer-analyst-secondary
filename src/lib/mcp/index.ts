import { defineMcp } from "@lovable.dev/mcp-js";
import listMetaAds from "./tools/list-meta-ads";
import metaAdsAnalytics from "./tools/meta-ads-analytics";
import getMonthSignals from "./tools/get-month-signals";
import getCrossComparisonMatrix from "./tools/get-cross-comparison-matrix";
import getPlatformTraffic from "./tools/get-platform-traffic";
import getMacroIndicators from "./tools/get-macro-indicators";
import searchFactorLibrary from "./tools/search-factor-library";

export default defineMcp({
  name: "market-compass",
  title: "Market Compass",
  version: "0.1.0",
  instructions:
    "Secondary-research tools for Indian e-commerce market intelligence. Use `get_cross_comparison_matrix` for the 12-month overview, `get_month_signals` for a single month's festivals, muhurats, sale windows and academic cycles, `get_macro_indicators` for MoM macro and electronics-import data, `get_platform_traffic` for web-visit estimates, `search_factor_library` for the secondary-indicator reference library, and `list_meta_ads` / `meta_ads_analytics` for tracked Meta Ad Library creatives. All tools return secondary signals for a human analyst to synthesise — never present an automated buy/sell or bullish/bearish verdict.",
  tools: [
    getCrossComparisonMatrix,
    getMonthSignals,
    getMacroIndicators,
    getPlatformTraffic,
    searchFactorLibrary,
    listMetaAds,
    metaAdsAnalytics,
  ],
});
