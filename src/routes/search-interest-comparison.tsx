import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertCircle, Loader2, RefreshCw, TrendingUp, Trophy, Radio } from "lucide-react";

import { AppShell, Panel } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSearchInterest, type MonthlyPoint } from "@/lib/search-interest.functions";

export const Route = createFileRoute("/search-interest-comparison")({
  component: SearchInterestPage,
});

const PLATFORMS = [
  { key: "Amazon", color: "#FF9900" },
  { key: "Flipkart", color: "#2874F0" },
  { key: "Meesho", color: "#F43397" },
  { key: "Myntra", color: "#E11B74" },
  { key: "Shopsy", color: "#008ECE" },
] as const;

type PlatformKey = (typeof PLATFORMS)[number]["key"];

function SearchInterestPage() {
  const fetchFn = useServerFn(getSearchInterest);
  const query = useQuery({
    queryKey: ["search-interest"],
    queryFn: () => fetchFn({ data: {} }),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const points = query.data?.points ?? [];
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const activeMonth = selectedMonth ?? points[points.length - 1]?.month ?? null;
  const activePoint = useMemo(
    () => points.find((p) => p.month === activeMonth) ?? null,
    [points, activeMonth],
  );

  const rankedForMonth = useMemo(() => {
    if (!activePoint) return [];
    return PLATFORMS.map((p) => ({
      platform: p.key,
      color: p.color,
      score: activePoint[p.key],
    })).sort((a, b) => b.score - a.score);
  }, [activePoint]);

  const fastestGrowing = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0];
    const last = points[points.length - 1];
    let best: { platform: PlatformKey; growth: number; from: number; to: number } | null = null;
    for (const p of PLATFORMS) {
      const from = first[p.key];
      const to = last[p.key];
      const growth = from > 0 ? ((to - from) / from) * 100 : to > 0 ? 100 : 0;
      if (!best || growth > best.growth) best = { platform: p.key, growth, from, to };
    }
    return best;
  }, [points]);

  const leader = rankedForMonth[0] ?? null;

  return (
    <AppShell>
      <div className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              E-Commerce Search Interest Comparison
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Google Trends <span className="font-semibold">Search Interest</span> — a relative
              0–100 index of search popularity in India. This is <em>not</em> website visit or
              traffic data; for direct-traffic figures see the{" "}
              <span className="font-mono">Similarweb Traffic Data</span> tab.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="label-caps">Month</span>
              <Select
                value={activeMonth ?? undefined}
                onValueChange={(v) => setSelectedMonth(v)}
                disabled={!points.length}
              >
                <SelectTrigger className="h-8 w-[170px] text-xs">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {points.map((p) => (
                    <SelectItem key={p.month} value={p.month} className="text-xs">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="h-8 text-xs"
            >
              {query.isFetching ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
              )}
              Refresh Live Data
            </Button>
          </div>
        </header>

        {query.isError && (
          <div className="flex items-start gap-2 rounded-sm border border-[color:var(--color-risk)]/50 bg-[color:var(--color-risk)]/10 p-3 text-xs">
            <AlertCircle className="mt-0.5 h-4 w-4 text-[color:var(--color-risk)]" />
            <div>
              <div className="font-semibold text-[color:var(--color-risk)]">
                Failed to load Google Trends data
              </div>
              <div className="text-muted-foreground">
                {(query.error as Error)?.message ??
                  "The SerpApi request failed. You may have exhausted the free tier quota."}
              </div>
            </div>
          </div>
        )}

        {query.isLoading && !points.length && (
          <div className="grid place-items-center rounded-sm border border-border bg-[color:var(--color-surface)] p-10">
            <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-primary)]" />
            <div className="mt-2 text-xs text-muted-foreground">Fetching Google Trends…</div>
          </div>
        )}

        {points.length > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid gap-3 md:grid-cols-3">
              <SummaryCard
                icon={<Trophy className="h-4 w-4" />}
                accent="gold"
                title="Market Leader"
                subtitle={activePoint?.label ?? ""}
                value={leader?.platform ?? "—"}
                detail={leader ? `Search Interest ${leader.score}/100` : ""}
                dotColor={leader?.color}
              />
              <SummaryCard
                icon={<TrendingUp className="h-4 w-4" />}
                accent="teal"
                title="Fastest Growing (12mo)"
                subtitle="First → latest month"
                value={fastestGrowing?.platform ?? "—"}
                detail={
                  fastestGrowing
                    ? `${fastestGrowing.growth >= 0 ? "+" : ""}${fastestGrowing.growth.toFixed(1)}% · ${fastestGrowing.from} → ${fastestGrowing.to}`
                    : ""
                }
              />
              <SummaryCard
                icon={<Radio className="h-4 w-4" />}
                accent="primary"
                title="Data Source Status"
                subtitle={
                  query.data?.source === "cache"
                    ? `Cached · ${Math.round((query.data.cacheAgeMs ?? 0) / 60000)}m old`
                    : "Live via SerpApi"
                }
                value="Google Trends (SerpApi)"
                detail="Separate from Similarweb visit data"
              />
            </div>

            {/* Line chart */}
            <Panel title="12-Month Search Interest Trend" accent="primary">
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #6B7280)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #6B7280)" }}
                      label={{
                        value: "Search Interest (0–100)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 10, fill: "#6B7280" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 2,
                        border: "1px solid var(--color-border)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {PLATFORMS.map((p) => (
                      <Line
                        key={p.key}
                        type="monotone"
                        dataKey={p.key}
                        stroke={p.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Bar chart for selected month */}
            <Panel
              title={`Snapshot — ${activePoint?.label ?? ""} (ranked)`}
              accent="gold"
            >
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rankedForMonth}
                    layout="vertical"
                    margin={{ top: 8, right: 24, bottom: 4, left: 24 }}
                  >
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="platform"
                      tick={{ fontSize: 12, fill: "#1F2937" }}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 2,
                        border: "1px solid var(--color-border)",
                      }}
                      formatter={(v: number) => [`${v}/100`, "Search Interest"]}
                    />
                    <Bar dataKey="score" radius={[0, 2, 2, 0]}>
                      {rankedForMonth.map((r) => (
                        <Cell key={r.platform} fill={r.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SummaryCard({
  icon,
  accent,
  title,
  subtitle,
  value,
  detail,
  dotColor,
}: {
  icon: React.ReactNode;
  accent: "primary" | "gold" | "teal";
  title: string;
  subtitle: string;
  value: string;
  detail: string;
  dotColor?: string;
}) {
  const bar = {
    primary: "bg-[color:var(--color-primary)]",
    gold: "bg-[color:var(--color-gold)]",
    teal: "bg-[color:var(--color-teal)]",
  }[accent];
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className={`absolute left-0 top-0 h-full w-0.5 ${bar}`} />
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="label-caps">{title}</span>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {subtitle}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {dotColor && (
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <span className="text-lg font-bold tracking-tight">{value}</span>
      </div>
      <div className="mt-1 text-xs num text-muted-foreground">{detail}</div>
    </div>
  );
}

// Re-export type to avoid unused import warnings if the file is copied.
export type { MonthlyPoint };
