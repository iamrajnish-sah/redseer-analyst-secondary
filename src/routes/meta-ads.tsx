import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  RefreshCw,
  Search,
  Sparkles,
  ImageOff,
  ExternalLink,
  Settings as SettingsIcon,
  Activity,
} from "lucide-react";
import { AppShell, Panel } from "@/components/AppShell";
import {
  refreshMetaAds,
  getMetaAnalytics,
  listMetaAds,
  classifyPending,
  type Analytics,
  type AdRow,
} from "@/lib/meta-ads.functions";

export const Route = createFileRoute("/meta-ads")({
  head: () => ({
    meta: [
      { title: "Meta Ad Intelligence — IndustryIntel" },
      {
        name: "description",
        content:
          "Meta Ad Library intelligence dashboard: track competitor ads, creatives, CTAs and platforms across Facebook, Instagram, Messenger and Audience Network.",
      },
    ],
  }),
  component: MetaAdsPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <Panel title="Error">
        <div className="text-sm text-[color:var(--color-risk)]">{String(error?.message ?? error)}</div>
      </Panel>
    </AppShell>
  ),
});

const BRANDS = [
  "Meesho",
  "Flipkart",
  "Amazon",
  "Nykaa",
  "Ajio",
  "Myntra",
  "Blinkit",
  "Zepto",
  "Swiggy",
];

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877F2",
  INSTAGRAM: "#E4405F",
  MESSENGER: "#00B2FF",
  AUDIENCE_NETWORK: "#F5B400",
  THREADS: "#8B5CF6",
};

const MEDIA_COLORS: Record<string, string> = {
  Image: "#38BDF8",
  Video: "#F472B6",
  Carousel: "#FBBF24",
  Collection: "#34D399",
  Unknown: "#94A3B8",
};

type Step = "idle" | "fetching" | "processing" | "saving" | "classifying" | "done" | "error";

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="panel p-4">
      <div className="label-caps text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold num tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function AdThumb({ src, alt }: { src: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return (
      <div className="grid h-14 w-14 place-items-center rounded-sm bg-[color:var(--color-surface-2)] text-muted-foreground">
        <ImageOff className="h-4 w-4" />
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErr(true)}
      className="h-14 w-14 rounded-sm object-cover ring-1 ring-border"
      loading="lazy"
    />
  );
}

function MetaAdsPage() {
  const qc = useQueryClient();
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [refreshBrand, setRefreshBrand] = useState<string>("Meesho");

  const analytics = useQuery({
    queryKey: ["meta-analytics", brandFilter || null],
    queryFn: () => getMetaAnalytics({ data: { brand: brandFilter || null } }),
  });

  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState<string>("");
  const [mediaType, setMediaType] = useState<string>("");
  const [cta, setCta] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");

  const listKey = [
    "meta-ads-list",
    page,
    brandFilter,
    platform,
    mediaType,
    cta,
    language,
    status,
    tableSearch,
  ];
  const list = useQuery({
    queryKey: listKey,
    queryFn: () =>
      listMetaAds({
        data: {
          page,
          pageSize: 25,
          brand: brandFilter || null,
          platform: platform || null,
          mediaType: mediaType || null,
          cta: cta || null,
          language: language || null,
          status: status || null,
          search: tableSearch || null,
        },
      }),
  });

  const refreshFn = useServerFn(refreshMetaAds);
  const classifyFn = useServerFn(classifyPending);
  const [step, setStep] = useState<Step>("idle");
  const [refreshMsg, setRefreshMsg] = useState<string>("");

  const refreshMut = useMutation({
    mutationFn: async () => {
      setStep("fetching");
      setRefreshMsg(`Fetching ads for ${refreshBrand}...`);
      const result = await refreshFn({ data: { brand: refreshBrand, count: 60 } });
      setStep("processing");
      setRefreshMsg(`Processing ${result.fetched} results...`);
      await new Promise((r) => setTimeout(r, 250));
      setStep("saving");
      setRefreshMsg(`Saved ${result.inserted} new, ${result.updated} updated.`);
      await new Promise((r) => setTimeout(r, 250));
      setStep("classifying");
      setRefreshMsg("Classifying creatives with AI...");
      try {
        const c = await classifyFn({ data: { limit: 20 } });
        setRefreshMsg(`Classified ${c.classified} creatives.`);
      } catch {
        // ignore classify errors
      }
      setStep("done");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meta-analytics"] });
      qc.invalidateQueries({ queryKey: ["meta-ads-list"] });
    },
    onError: (err: any) => {
      setStep("error");
      setRefreshMsg(String(err?.message ?? err));
    },
  });

  const stepLabel: Record<Step, string> = {
    idle: "Refresh Ads",
    fetching: "Fetching Ads...",
    processing: "Processing Results...",
    saving: "Saving Database...",
    classifying: "Classifying...",
    done: "Completed",
    error: "Error",
  };

  const a = analytics.data;

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Meta Ad Intelligence</h1>
            <div className="text-xs text-muted-foreground">
              Meta Ad Library data via Apify · Facebook · Instagram · Messenger · Audience Network
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1.5 text-xs"
            >
              <option value="">All brands ({a?.brands.length ?? 0})</option>
              {(a?.brands ?? BRANDS).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search brand to refresh..."
                list="brand-suggest"
                className="w-40 bg-transparent text-xs outline-hidden"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchInput.trim()) {
                    setRefreshBrand(searchInput.trim());
                    refreshMut.mutate();
                  }
                }}
              />
              <datalist id="brand-suggest">
                {BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <select
              value={refreshBrand}
              onChange={(e) => setRefreshBrand(e.target.value)}
              className="rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1.5 text-xs"
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              {searchInput.trim() && !BRANDS.includes(searchInput.trim()) && (
                <option value={searchInput.trim()}>{searchInput.trim()}</option>
              )}
            </select>
            <button
              onClick={() => refreshMut.mutate()}
              disabled={refreshMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[color:var(--color-primary)]/20 px-3 py-1.5 text-xs font-semibold text-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]/60 hover:bg-[color:var(--color-primary)]/30 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshMut.isPending ? "animate-spin" : ""}`} />
              {stepLabel[step]}
            </button>
            <Link
              to="/settings/meta-ads"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs hover:bg-[color:var(--color-surface-2)]"
            >
              <SettingsIcon className="h-3.5 w-3.5" /> Settings
            </Link>
          </div>
        </div>

        {refreshMut.isPending || step !== "idle" ? (
          <div
            className={`rounded-sm border px-3 py-2 text-xs ${
              step === "error"
                ? "border-[color:var(--color-risk)]/60 bg-[color:var(--color-risk)]/10 text-[color:var(--color-risk)]"
                : "border-[color:var(--color-primary)]/50 bg-[color:var(--color-primary)]/10 text-foreground"
            }`}
          >
            <span className="font-semibold">{stepLabel[step]}</span> — {refreshMsg}
          </div>
        ) : null}

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Total Active Ads" value={a?.activeAds ?? "—"} sub={`${a?.totalAds ?? 0} total`} />
          <Kpi label="New Ads Today" value={a?.newToday ?? "—"} sub={`${a?.rolling30 ?? 0} last 30d`} />
          <Kpi label="Facebook" value={a?.platforms.FACEBOOK ?? 0} />
          <Kpi label="Instagram" value={a?.platforms.INSTAGRAM ?? 0} />
          <Kpi label="Messenger" value={a?.platforms.MESSENGER ?? 0} />
          <Kpi label="Audience Network" value={a?.platforms.AUDIENCE_NETWORK ?? 0} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel title="Daily New Ads (30d)" accent="primary">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={a?.daily ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 11 }} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Platform Distribution" accent="teal">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(a?.platforms ?? {}).map(([name, value]) => ({ name, value }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {Object.keys(a?.platforms ?? {}).map((name) => (
                      <Cell key={name} fill={PLATFORM_COLORS[name] ?? "#64748B"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Media Types" accent="gold">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(a?.mediaTypes ?? {}).map(([name, value]) => ({ name, value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 11 }} />
                  <Bar dataKey="value">
                    {Object.keys(a?.mediaTypes ?? {}).map((name) => (
                      <Cell key={name} fill={MEDIA_COLORS[name] ?? "#64748B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Secondary breakdowns */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel title="CTA Analysis">
            <BreakdownList data={a?.ctas ?? {}} empty="No CTAs yet — refresh ads to populate." />
          </Panel>
          <Panel title="Language Analysis">
            <BreakdownList data={a?.languages ?? {}} empty="No language data yet." />
          </Panel>
          <Panel title="Creative Themes (AI)" action={<span className="text-[10px] text-muted-foreground">{a?.unclassified ?? 0} pending</span>}>
            <BreakdownList data={a?.categories ?? {}} empty="AI classification runs after refresh." />
          </Panel>
        </div>

        {/* Top advertisers + weekly/monthly */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Panel title="Top Advertisers Leaderboard" accent="primary">
            {(a?.topBrands ?? []).length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Refresh a brand to populate the leaderboard.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-1.5">Brand</th>
                    <th className="num text-right">Total</th>
                    <th className="num text-right">Active</th>
                    <th className="num text-right">New 7d</th>
                  </tr>
                </thead>
                <tbody>
                  {(a?.topBrands ?? []).map((b) => (
                    <tr key={b.brand} className="border-b border-border/50">
                      <td className="py-1.5 font-medium">{b.brand}</td>
                      <td className="num text-right">{b.total}</td>
                      <td className="num text-right text-[color:var(--color-teal)]">{b.active}</td>
                      <td className="num text-right text-[color:var(--color-gold)]">{b.new_week}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Weekly & Monthly Trend" accent="teal">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 11 }} />
                  <Bar dataKey="count" fill="var(--color-teal)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Ads table */}
        <Panel
          title="Advertisements"
          action={
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search headline or copy..."
                className="rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1"
              />
              <FilterSelect value={platform} setValue={(v) => { setPlatform(v); setPage(1); }} options={["FACEBOOK","INSTAGRAM","MESSENGER","AUDIENCE_NETWORK"]} placeholder="Platform" />
              <FilterSelect value={mediaType} setValue={(v) => { setMediaType(v); setPage(1); }} options={["Image","Video","Carousel","Collection","Unknown"]} placeholder="Media" />
              <FilterSelect value={cta} setValue={(v) => { setCta(v); setPage(1); }} options={Object.keys(a?.ctas ?? {})} placeholder="CTA" />
              <FilterSelect value={language} setValue={(v) => { setLanguage(v); setPage(1); }} options={Object.keys(a?.languages ?? {})} placeholder="Language" />
              <FilterSelect value={status} setValue={(v) => { setStatus(v); setPage(1); }} options={["ACTIVE","ENDED"]} placeholder="Status" />
            </div>
          }
        >
          <AdTable data={list.data?.rows ?? []} loading={list.isLoading} />
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="text-muted-foreground">
              {list.data ? `${list.data.total.toLocaleString()} ads · page ${list.data.page}` : "…"}
            </div>
            <div className="flex gap-1">
              <button
                disabled={page <= 1 || list.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={!!list.data && page * list.data.pageSize >= list.data.total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </Panel>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          Data source: Apify Meta Ad Library actor · <Sparkles className="h-3 w-3" /> Creative themes classified by Lovable AI
        </div>
      </div>
    </AppShell>
  );
}

function BreakdownList({ data, empty }: { data: Record<string, number>; empty: string }) {
  const entries = useMemo(
    () => Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [data],
  );
  const max = entries[0]?.[1] ?? 1;
  if (entries.length === 0)
    return <div className="py-6 text-center text-xs text-muted-foreground">{empty}</div>;
  return (
    <ul className="space-y-1.5">
      {entries.map(([k, v]) => (
        <li key={k} className="text-xs">
          <div className="flex items-center justify-between">
            <span className="truncate">{k}</span>
            <span className="num tabular-nums text-muted-foreground">{v}</span>
          </div>
          <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-[color:var(--color-surface-2)]">
            <div
              className="h-full bg-[color:var(--color-primary)]"
              style={{ width: `${(v / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function FilterSelect({
  value,
  setValue,
  options,
  placeholder,
}: {
  value: string;
  setValue: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function AdTable({ data, loading }: { data: AdRow[]; loading: boolean }) {
  if (loading && data.length === 0)
    return <div className="py-10 text-center text-xs text-muted-foreground">Loading…</div>;
  if (data.length === 0)
    return (
      <div className="py-10 text-center text-xs text-muted-foreground">
        No ads yet. Pick a brand and click <span className="font-semibold">Refresh Ads</span>.
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-2">Brand</th>
            <th>Creative</th>
            <th>Headline / Copy</th>
            <th>CTA</th>
            <th>Platform</th>
            <th>Media</th>
            <th>Lang</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.id} className="border-b border-border/40 align-top">
              <td className="py-2 pr-2 font-medium">{r.brand ?? "—"}</td>
              <td className="py-2 pr-2">
                <AdThumb src={r.snapshot_url} alt={r.advertiser_name ?? "ad"} />
              </td>
              <td className="max-w-sm py-2 pr-2">
                {r.headline && <div className="font-semibold">{r.headline}</div>}
                <div className="line-clamp-3 text-muted-foreground">{r.creative_text ?? ""}</div>
                {r.category && (
                  <span className="mt-1 inline-block rounded-sm bg-[color:var(--color-primary)]/15 px-1.5 py-0.5 text-[10px] text-[color:var(--color-primary)]">
                    {r.category}
                  </span>
                )}
              </td>
              <td className="py-2 pr-2">{r.cta ?? "—"}</td>
              <td className="py-2 pr-2">
                <div className="flex flex-wrap gap-1">
                  {(r.platforms ?? []).slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="rounded-sm px-1.5 py-0.5 text-[10px]"
                      style={{
                        background: `${PLATFORM_COLORS[p] ?? "#64748B"}20`,
                        color: PLATFORM_COLORS[p] ?? "#64748B",
                      }}
                    >
                      {p.slice(0, 2)}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-2 pr-2">{r.media_type ?? "—"}</td>
              <td className="py-2 pr-2">{r.language ?? "—"}</td>
              <td className="num py-2 pr-2">{r.start_date?.slice(0, 10) ?? "—"}</td>
              <td className="num py-2 pr-2">{r.end_date?.slice(0, 10) ?? "—"}</td>
              <td className="py-2 pr-2">
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[10px] ${
                    r.status === "ACTIVE"
                      ? "bg-[color:var(--color-teal)]/15 text-[color:var(--color-teal)]"
                      : "bg-[color:var(--color-surface-2)] text-muted-foreground"
                  }`}
                >
                  {r.status ?? "—"}
                </span>
              </td>
              <td className="py-2 pr-2">
                <a
                  href={`https://www.facebook.com/ads/library/?id=${r.ad_archive_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[color:var(--color-primary)] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
