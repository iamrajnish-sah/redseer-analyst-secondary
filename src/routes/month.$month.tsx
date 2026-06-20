import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell, Panel, Delta } from "@/components/AppShell";
import {
  MONTHS, MONTH_FULL, type MonthKey, FESTIVALS, MUHURATS, SALE_EVENTS,
  PLATFORM_VERTICALS, PLATFORM_METRICS, CATEGORIES_18, MACRO_SIGNALS, SUPPLY_FACTORS,
  SEASON_PROFILE,
} from "@/lib/data";
import { usePersistentState } from "@/lib/storage";
import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";

export const Route = createFileRoute("/month/$month")({
  parseParams: ({ month }) => {
    if (!MONTHS.includes(month as MonthKey)) throw notFound();
    return { month: month as MonthKey };
  },
  head: ({ params }) => ({
    meta: [
      { title: `${MONTH_FULL[params.month as MonthKey]} Details — IndustryIntel` },
      { name: "description", content: `Festive, climate, macro and platform indicators for ${MONTH_FULL[params.month as MonthKey]}.` },
    ],
  }),
  component: MonthPage,
});

type Impact = "High" | "Medium" | "Low";
type Trend = "Up" | "Down" | "Flat";

const impactColor: Record<Impact, string> = {
  High:   "text-[color:var(--color-risk)] border-[color:var(--color-risk)]/60",
  Medium: "text-[color:var(--color-gold)] border-[color:var(--color-gold)]/60",
  Low:    "text-muted-foreground border-border",
};

function MonthPage() {
  const params = Route.useParams() as { month: MonthKey };
  const monthKey: MonthKey = params.month;
  const longName = MONTH_FULL[monthKey];


  return (
    <AppShell>
      {/* Sub-header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-caps">Month Detail</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {longName} <span className="text-muted-foreground font-normal">/ FY 25-26</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{SEASON_PROFILE[monthKey]}</p>
        </div>
        <div className="flex gap-2">
          {MONTHS.map(m => (
            <a key={m} href={`/month/${m}`} className={`grid h-7 w-9 place-items-center rounded-sm text-[11px] font-semibold ${
              m === monthKey ? "bg-[color:var(--color-primary)]/25 text-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]/60" : "panel-2 text-muted-foreground"
            }`}>{m}</a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CalendarSection monthKey={monthKey} />
        <MuhuratSection monthKey={monthKey} />
        <PlatformSaleSection monthKey={monthKey} />
        <WeatherSection monthKey={monthKey} />
      </div>

      <PlatformPerformanceSection monthKey={monthKey} />
      <CategoryGridSection monthKey={monthKey} />

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <MacroSection monthKey={monthKey} />
        <SupplyChainSection monthKey={monthKey} />
      </div>

      <NewsSection monthKey={monthKey} />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <DataQualitySection monthKey={monthKey} />
        <ScorecardSection monthKey={monthKey} />
        <NotesSection monthKey={monthKey} />
      </div>
    </AppShell>
  );
}

/* ------------- 1 Calendar & Festivals ------------- */
function CalendarSection({ monthKey }: { monthKey: MonthKey }) {
  const baseline = FESTIVALS[monthKey] ?? [];
  const [rows, setRows] = usePersistentState(`fest::${monthKey}`, baseline);

  return (
    <Panel title={`1 · Calendar & Festivals`} accent="gold">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr>
              {["Festival","2025 (CY)","2024 (LY)","Drift (Δ days)","Impact"].map(h=>(
                <th key={h} className="label-caps border-b border-border px-2 py-1.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-2 py-4 text-center text-muted-foreground">No mapped festivals.</td></tr>}
            {rows.map((f, i) => (
              <tr key={f.name + i} className="row-hover border-b border-border">
                <td className="px-2 py-1.5 font-medium">{f.name}</td>
                <td className="num px-2 py-1.5">{f.cy}</td>
                <td className="num px-2 py-1.5 text-muted-foreground">{f.ly}</td>
                <td className="num px-2 py-1.5">
                  <span className={`font-semibold ${f.drift > 0 ? "text-[color:var(--color-down)]" : f.drift < 0 ? "text-[color:var(--color-up)]" : "text-[color:var(--color-flat)]"}`}>
                    {f.drift > 0 ? `+${f.drift} late` : f.drift < 0 ? `${f.drift} early` : "no shift"}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <select
                    value={f.impact}
                    onChange={(e) => {
                      const next = [...rows]; next[i] = { ...f, impact: e.target.value as "High" | "Medium" | "Low" }; setRows(next);
                    }}
                    className={`rounded-sm border bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] font-medium ${impactColor[f.impact as Impact]}`}
                  >
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ------------- 2 Muhurats ------------- */
function MuhuratSection({ monthKey }: { monthKey: MonthKey }) {
  const baseline = MUHURATS[monthKey];
  const [m, setM] = usePersistentState(`muh::${monthKey}`, baseline);

  const fields: Array<{ key: keyof typeof m; label: string }> = [
    { key:"shaadi", label:"Shaadi (Wedding)" },
    { key:"janeu", label:"Janeu (Thread)" },
    { key:"namkaran", label:"Namkaran" },
    { key:"grihaPravesh", label:"Griha Pravesh" },
    { key:"annaprashan", label:"Annaprashan" },
  ];

  return (
    <Panel title="2 · Auspicious Muhurats" accent="gold">
      {m.blockout && (
        <div className="mb-3 flex items-start gap-2 rounded-sm border border-[color:var(--color-risk)]/60 bg-[color:var(--color-risk)]/10 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-risk)]" />
          <div>
            <div className="font-bold tracking-wide text-[color:var(--color-risk)] uppercase">⚠️ Inauspicious Window Detected — {m.blockout}</div>
            <div className="mt-0.5 text-muted-foreground">Discretionary FMCG & retail spend traditionally paused. Verify with primary telemetry before sizing.</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fields.map(f => (
          <label key={String(f.key)} className="panel-2 flex flex-col gap-1 px-3 py-2">
            <span className="label-caps">{f.label}</span>
            <input
              type="number"
              min={0}
              value={m[f.key] as number}
              onChange={(e) => setM({ ...m, [f.key]: Number(e.target.value) })}
              className="num bg-transparent text-lg font-bold focus:outline-hidden"
            />
          </label>
        ))}
      </div>
    </Panel>
  );
}

/* ------------- 3 Platform Sale Events ------------- */
function PlatformSaleSection({ monthKey }: { monthKey: MonthKey }) {
  const [rows] = usePersistentState(`sales::${monthKey}`, SALE_EVENTS[monthKey] ?? []);
  return (
    <Panel title="3 · Platform Sale Events" accent="teal">
      <div className="space-y-1.5">
        {rows.length === 0 && <div className="text-xs text-muted-foreground">No mapped sale events for this month.</div>}
        {rows.map((s,i) => (
          <div key={i} className="row-hover grid grid-cols-[120px_1fr_auto] items-center gap-3 border-b border-border py-1.5 text-xs">
            <div className="font-semibold tracking-wide text-[color:var(--color-teal)] uppercase text-[11px]">{s.platform}</div>
            <div className="text-foreground">{s.name}</div>
            <div className="num text-muted-foreground">{s.window}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ------------- 4 Weather & Climate ------------- */
function WeatherSection({ monthKey }: { monthKey: MonthKey }) {
  const [w, setW] = usePersistentState(`weather::${monthKey}`, {
    tempDev: 0.4,
    rainfallCY: 0,
    rainfallLY: 0,
    monsoonOnsetDelay: 0,
    arrivalSpeed: "Normal" as "Early" | "Normal" | "Delayed",
    aqi: 180,
  });
  const fields = [
    { label:"Avg Temp Deviation vs LY (°C)", key:"tempDev", step:0.1 },
    { label:"Rainfall (mm) CY", key:"rainfallCY", step:1 },
    { label:"Rainfall (mm) LY", key:"rainfallLY", step:1 },
    { label:"Monsoon Onset/Withdraw Δ (days)", key:"monsoonOnsetDelay", step:1 },
    { label:"Avg AQI (Tier-1 Metros)", key:"aqi", step:1 },
  ] as const;
  return (
    <Panel title="4 · Weather & Climate" accent="primary">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fields.map(f => (
          <label key={f.key} className="panel-2 flex flex-col gap-1 px-3 py-2">
            <span className="label-caps">{f.label}</span>
            <input
              type="number" step={f.step}
              value={(w as Record<string,number|string>)[f.key] as number}
              onChange={(e)=>setW({ ...w, [f.key]: Number(e.target.value) })}
              className="num bg-transparent text-base font-semibold focus:outline-hidden"
            />
          </label>
        ))}
        <label className="panel-2 flex flex-col gap-1 px-3 py-2">
          <span className="label-caps">Season Arrival</span>
          <select
            value={w.arrivalSpeed}
            onChange={(e)=>setW({ ...w, arrivalSpeed: e.target.value as "Early"|"Normal"|"Delayed" })}
            className="bg-transparent text-base font-semibold focus:outline-hidden"
          >
            <option>Early</option><option>Normal</option><option>Delayed</option>
          </select>
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="panel-2 px-3 py-2">
          <span className="label-caps">Rainfall Δ vs LY</span>
          <div className="mt-1"><Delta cy={w.rainfallCY} ly={w.rainfallLY} suffix=" mm" /></div>
        </div>
        <div className="panel-2 px-3 py-2">
          <span className="label-caps">AQI Band</span>
          <div className="mt-1 font-semibold">
            {w.aqi < 100 ? "Moderate" : w.aqi < 200 ? "Poor" : w.aqi < 300 ? "Very Poor" : "Severe"}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------- 5 Platform Performance ------------- */
const HML = ["High","Medium","Low"] as const;
function PlatformPerformanceSection({ monthKey }: { monthKey: MonthKey }) {
  return (
    <Panel title="5 · Platform Performance Trackers" accent="teal" className="mt-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(PLATFORM_VERTICALS).map(([vertical, platforms]) => (
          <PlatformMatrix key={vertical} monthKey={monthKey} vertical={vertical} platforms={platforms as readonly string[]} />
        ))}
      </div>
    </Panel>
  );
}

function PlatformMatrix({ monthKey, vertical, platforms }: { monthKey: MonthKey; vertical: string; platforms: readonly string[] }) {
  type Row = Record<string, string>;
  const init: Record<string, Row> = Object.fromEntries(
    platforms.map(p => [p, Object.fromEntries(PLATFORM_METRICS.map(m => [m, m === "Top Performing Sub-Category" ? "—" : "Medium"]))])
  );
  const [data, setData] = usePersistentState(`platperf::${monthKey}::${vertical}`, init);

  return (
    <div className="panel-2 overflow-hidden">
      <header className="border-b border-border px-3 py-1.5">
        <h4 className="label-caps text-[color:var(--color-teal)]">{vertical}</h4>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="text-muted-foreground">
            <tr>
              <th className="label-caps px-2 py-1 text-left">Platform</th>
              {PLATFORM_METRICS.map(m => <th key={m} className="label-caps px-1.5 py-1 text-left">{m.replace(" Signal","").replace(" Index","").replace(" Spike","")}</th>)}
            </tr>
          </thead>
          <tbody>
            {platforms.map(p => (
              <tr key={p} className="row-hover border-t border-border">
                <td className="px-2 py-1.5 font-semibold">{p}</td>
                {PLATFORM_METRICS.map(m => {
                  const val = data[p]?.[m] ?? "Medium";
                  if (m === "Top Performing Sub-Category") {
                    return (
                      <td key={m} className="px-1.5 py-1.5">
                        <input
                          value={val}
                          onChange={(e)=>setData({ ...data, [p]: { ...data[p], [m]: e.target.value } })}
                          className="w-28 rounded-sm border border-border bg-[color:var(--color-surface)] px-1.5 py-0.5 text-[11px] focus:outline-hidden"
                          placeholder="e.g. Smartphones"
                        />
                      </td>
                    );
                  }
                  const cls = val === "High" ? "text-[color:var(--color-up)]" : val === "Low" ? "text-[color:var(--color-down)]" : "text-[color:var(--color-flat)]";
                  return (
                    <td key={m} className="px-1.5 py-1.5">
                      <select
                        value={val}
                        onChange={(e)=>setData({ ...data, [p]: { ...data[p], [m]: e.target.value } })}
                        className={`rounded-sm border border-border bg-[color:var(--color-surface)] px-1.5 py-0.5 text-[11px] font-medium ${cls}`}
                      >
                        {HML.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------- 6 Category Grid ------------- */
function CategoryGridSection({ monthKey }: { monthKey: MonthKey }) {
  const init: Record<string, Trend> = Object.fromEntries(CATEGORIES_18.map(c => [c, "Flat" as Trend]));
  const [data, setData] = usePersistentState(`cat::${monthKey}`, init);
  const cycle = (t: Trend): Trend => (t === "Up" ? "Down" : t === "Down" ? "Flat" : "Up");
  return (
    <Panel title="6 · Category Performance Grid (18 Sectors)" accent="primary" className="mt-4">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {CATEGORIES_18.map(c => {
          const t = data[c];
          const Icon = t === "Up" ? TrendingUp : t === "Down" ? TrendingDown : Minus;
          const cls = t === "Up" ? "text-[color:var(--color-up)] ring-[color:var(--color-up)]/40" :
                      t === "Down" ? "text-[color:var(--color-down)] ring-[color:var(--color-down)]/40" :
                      "text-[color:var(--color-flat)] ring-[color:var(--color-border)]";
          return (
            <button
              key={c}
              onClick={()=>setData({ ...data, [c]: cycle(t) })}
              className={`panel-2 flex items-center justify-between gap-2 px-2 py-1.5 text-left text-[11px] font-medium ring-1 ${cls}`}
            >
              <span className="truncate">{c}</span>
              <Icon className="h-3.5 w-3.5 shrink-0" />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">Click a tile to cycle Up → Down → Flat.</p>
    </Panel>
  );
}

/* ------------- 7 Macro Signals ------------- */
function MacroSection({ monthKey }: { monthKey: MonthKey }) {
  const init = Object.fromEntries(MACRO_SIGNALS.map(s => [s.key, { cy: Number(s.cy), ly: Number(s.ly) }]));
  const [data, setData] = usePersistentState(`macro::${monthKey}`, init);
  return (
    <Panel title="7 · Macro & Consumer Signals" accent="primary">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="label-caps border-b border-border px-2 py-1.5 text-left">Indicator</th>
            <th className="label-caps border-b border-border px-2 py-1.5 text-right">CY</th>
            <th className="label-caps border-b border-border px-2 py-1.5 text-right">LY</th>
            <th className="label-caps border-b border-border px-2 py-1.5 text-right">Δ YoY</th>
          </tr>
        </thead>
        <tbody>
          {MACRO_SIGNALS.map(s => {
            const v = data[s.key];
            return (
              <tr key={s.key} className="row-hover border-b border-border">
                <td className="px-2 py-1.5 font-medium">{s.label}</td>
                <td className="px-2 py-1.5 text-right">
                  <input
                    type="number" step={0.01} value={v.cy}
                    onChange={(e)=>setData({ ...data, [s.key]: { ...v, cy: Number(e.target.value) } })}
                    className="num w-20 bg-transparent text-right focus:outline-hidden"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <input
                    type="number" step={0.01} value={v.ly}
                    onChange={(e)=>setData({ ...data, [s.key]: { ...v, ly: Number(e.target.value) } })}
                    className="num w-20 bg-transparent text-right text-muted-foreground focus:outline-hidden"
                  />
                </td>
                <td className="px-2 py-1.5 text-right"><Delta cy={v.cy} ly={v.ly} suffix={s.unit ? ` ${s.unit}` : ""} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

/* ------------- 8 Supply chain ------------- */
function SupplyChainSection({ monthKey }: { monthKey: MonthKey }) {
  const init = Object.fromEntries(SUPPLY_FACTORS.map(f => [f, "Medium"]));
  const [data, setData] = usePersistentState(`supply::${monthKey}`, init);
  return (
    <Panel title="8 · Supply Chain & Operations Signals" accent="risk">
      <ul className="space-y-1.5 text-xs">
        {SUPPLY_FACTORS.map(f => {
          const v = data[f];
          const cls = v === "High" ? "text-[color:var(--color-risk)] border-[color:var(--color-risk)]/60" :
                      v === "Low" ? "text-[color:var(--color-up)] border-[color:var(--color-up)]/40" :
                      "text-[color:var(--color-gold)] border-[color:var(--color-gold)]/40";
          return (
            <li key={f} className="row-hover flex items-center justify-between gap-3 border-b border-border py-1.5">
              <span className="font-medium">{f}</span>
              <select
                value={v} onChange={(e)=>setData({ ...data, [f]: e.target.value })}
                className={`rounded-sm border bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium ${cls}`}
              >
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ------------- 9 News log ------------- */
interface NewsItem { date: string; headline: string; source: string; impact: Impact; platforms: string; }
function NewsSection({ monthKey }: { monthKey: MonthKey }) {
  const [rows, setRows] = usePersistentState<NewsItem[]>(`news::${monthKey}`, []);
  const add = () => setRows([...rows, { date:"", headline:"", source:"", impact:"Medium", platforms:"" }]);
  const update = (i: number, patch: Partial<NewsItem>) => {
    const next = [...rows]; next[i] = { ...next[i], ...patch }; setRows(next);
  };
  return (
    <Panel title="9 · News, Funding & Competitive Intel Log" accent="primary" className="mt-4"
      action={<button onClick={add} className="rounded-sm border border-border px-2 py-0.5 text-[11px] hover:bg-[color:var(--color-surface-2)]">+ Add Row</button>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-xs">
          <thead className="text-muted-foreground">
            <tr>
              {["Date","Headline","Source","Impact","Platforms Affected",""].map(h=>(
                <th key={h} className="label-caps border-b border-border px-2 py-1.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-2 py-4 text-center text-muted-foreground">No entries yet — log press, funding, or competitive moves above.</td></tr>}
            {rows.map((r,i) => (
              <tr key={i} className="row-hover border-b border-border">
                <td className="px-2 py-1"><input value={r.date} onChange={(e)=>update(i,{date:e.target.value})} placeholder="DD MMM" className="num w-20 bg-transparent focus:outline-hidden" /></td>
                <td className="px-2 py-1"><input value={r.headline} onChange={(e)=>update(i,{headline:e.target.value})} placeholder="Headline" className="w-full bg-transparent focus:outline-hidden" /></td>
                <td className="px-2 py-1"><input value={r.source} onChange={(e)=>update(i,{source:e.target.value})} placeholder="Source" className="w-32 bg-transparent text-muted-foreground focus:outline-hidden" /></td>
                <td className="px-2 py-1">
                  <select value={r.impact} onChange={(e)=>update(i,{impact:e.target.value as Impact})} className={`rounded-sm border bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] ${impactColor[r.impact]}`}>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </td>
                <td className="px-2 py-1"><input value={r.platforms} onChange={(e)=>update(i,{platforms:e.target.value})} placeholder="e.g. Amazon, Flipkart" className="w-40 bg-transparent focus:outline-hidden" /></td>
                <td className="px-2 py-1 text-right"><button onClick={()=>setRows(rows.filter((_,idx)=>idx!==i))} className="text-[11px] text-muted-foreground hover:text-[color:var(--color-risk)]">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ------------- 10 Data quality ------------- */
function DataQualitySection({ monthKey }: { monthKey: MonthKey }) {
  const [q, setQ] = usePersistentState(`quality::${monthKey}`, {
    sampleSize: 0, expertCount: 0, lagDays: 0, mismatchPct: 0, confidence: 7,
  });
  return (
    <Panel title="10 · Data Quality & Triangulation" accent="primary">
      <div className="grid grid-cols-2 gap-2">
        {([
          ["sampleSize","Sample Size"],
          ["expertCount","Expert Contributors"],
          ["lagDays","Reporting Lag (days)"],
          ["mismatchPct","Primary vs Secondary Δ %"],
        ] as const).map(([k, label]) => (
          <label key={k} className="panel-2 flex flex-col gap-1 px-3 py-2">
            <span className="label-caps">{label}</span>
            <input type="number" value={q[k]} onChange={(e)=>setQ({ ...q, [k]: Number(e.target.value) })}
              className="num bg-transparent text-base font-semibold focus:outline-hidden" />
          </label>
        ))}
      </div>
      <div className="panel-2 mt-3 px-3 py-2">
        <div className="flex items-baseline justify-between">
          <span className="label-caps">Analyst Confidence</span>
          <span className="num text-xl font-bold">{q.confidence}<span className="text-xs text-muted-foreground">/10</span></span>
        </div>
        <input type="range" min={1} max={10} value={q.confidence}
          onChange={(e)=>setQ({ ...q, confidence: Number(e.target.value) })}
          className="mt-1 w-full accent-[color:var(--color-primary)]" />
      </div>
    </Panel>
  );
}

/* ------------- 11 Scorecard dial ------------- */
function ScorecardSection({ monthKey }: { monthKey: MonthKey }) {
  const [score, setScore] = usePersistentState(`score::${monthKey}`, 6);
  const pct = (score - 1) / 9; // 0-1
  const hue = 0 + pct * 130; // 0(red) → 130(green)
  const color = `oklch(0.70 0.18 ${hue})`;
  const dash = pct * 251.2;
  return (
    <Panel title="11 · Monthly Performance Scorecard" accent="primary">
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="40" stroke="var(--color-border)" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="8" fill="none"
              strokeDasharray={`${dash} 251.2`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="num text-3xl font-bold" style={{ color }}>{score}</div>
              <div className="text-[10px] tracking-wider text-muted-foreground uppercase">/10</div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">Aggregated strength of secondary signals. Manual adjustment — no auto-calc.</p>
          <input type="range" min={1} max={10} value={score} onChange={(e)=>setScore(Number(e.target.value))}
            className="mt-3 w-full accent-[color:var(--color-primary)]" />
          <div className="mt-1 flex justify-between text-[10px] tracking-wider text-muted-foreground uppercase">
            <span>Low</span><span>Mid</span><span>High</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------- 12 Notes ------------- */
function NotesSection({ monthKey }: { monthKey: MonthKey }) {
  const [notes, setNotes] = usePersistentState(`notes::${monthKey}`, "");
  return (
    <Panel title="12 · Analyst Synthesis & Strategic Commentary" accent="primary">
      <textarea
        value={notes} onChange={(e)=>setNotes(e.target.value)}
        rows={9}
        placeholder="Log qualitative findings, hypotheses to verify with primary research, anomalies vs prior year, and recommended deep-dives..."
        className="panel-2 w-full resize-y bg-[color:var(--color-surface-2)] p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-[color:var(--color-primary)]"
      />
      <div className="mt-1 text-right text-[10px] text-muted-foreground num">{notes.length} chars · auto-saved</div>
    </Panel>
  );
}
