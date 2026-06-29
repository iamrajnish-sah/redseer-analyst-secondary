import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell, Panel, Delta } from "@/components/AppShell";
import {
  MONTHS, MONTH_FULL, type MonthKey, FESTIVALS, MUHURATS_V2, SALE_EVENTS, SALE_TAGLINES_DEFAULTS,
  PLATFORM_VERTICALS, PLATFORM_METRICS, CATEGORIES_18, MACRO_SIGNALS_V2, SUPPLY_FACTORS,
  SEASON_PROFILE, ACADEMIC_CYCLES, ELECTRONICS_IMPORTS, SEGMENT_INDICATORS, predictOutlook,
} from "@/lib/data";
import { METRO_CITIES, type MetroCity, climateSeries, metroMonthlySummary } from "@/lib/climate";
import { usePersistentState } from "@/lib/storage";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, GraduationCap } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
      </div>

      <WeatherSection monthKey={monthKey} />

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

/* ------------- 1 Calendar & Festivals (+ Academic Cycles) ------------- */
function CalendarSection({ monthKey }: { monthKey: MonthKey }) {
  const baseline = FESTIVALS[monthKey] ?? [];
  const [rows, setRows] = usePersistentState(`fest::${monthKey}`, baseline);
  const academic = ACADEMIC_CYCLES[monthKey] ?? [];

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

      {/* Academic cycle overlay */}
      <div className="mt-3 panel-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-3.5 w-3.5 text-[color:var(--color-primary)]" />
          <span className="label-caps">Academic Cycle Overlay</span>
        </div>
        {academic.length === 0 ? (
          <div className="mt-1 text-[11px] text-muted-foreground">No major school/college calendar markers for this month.</div>
        ) : (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {academic.map(a => (
              <span key={a} className="rounded-sm bg-[color:var(--color-primary)]/10 px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]/30">
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ------------- 2 Muhurats (CY vs LY side-by-side + dates grid) ------------- */
function MuhuratSection({ monthKey }: { monthKey: MonthKey }) {
  const baseline = MUHURATS_V2[monthKey];
  const [m, setM] = usePersistentState(`muh2::${monthKey}`, baseline);

  const counts: Array<{ key: "shaadi"|"janeu"|"namkaran"|"grihaPravesh"; label: string }> = [
    { key:"shaadi",       label:"Shaadi (Wedding)" },
    { key:"janeu",        label:"Janeu (Thread)" },
    { key:"namkaran",     label:"Namkaran" },
    { key:"grihaPravesh", label:"Griha Pravesh" },
  ];

  return (
    <Panel title="2 · Auspicious Muhurats" accent="gold">
      {m.blockout && (
        <div className="mb-3 flex items-start gap-2 rounded-sm border border-[color:var(--color-risk)]/60 bg-[color:var(--color-risk)]/10 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-risk)]" />
          <div>
            <div className="font-bold tracking-wide text-[color:var(--color-risk)] uppercase">⚠️ Inauspicious Window — {m.blockout}</div>
            <div className="mt-0.5 text-muted-foreground">Discretionary FMCG & retail spend traditionally paused. Verify with primary telemetry.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {counts.map(f => {
          const cy = m[f.key].cy; const ly = m[f.key].ly;
          const diff = cy - ly;
          const cls = diff > 0 ? "text-[color:var(--color-up)]" : diff < 0 ? "text-[color:var(--color-down)]" : "text-[color:var(--color-flat)]";
          return (
            <div key={f.key} className="panel-2 px-3 py-2">
              <div className="label-caps">{f.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <input
                  type="number" min={0} value={cy}
                  onChange={(e) => setM({ ...m, [f.key]: { ...m[f.key], cy: Number(e.target.value) } })}
                  className="num w-12 bg-transparent text-xl font-bold focus:outline-hidden"
                />
                <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Days CY</span>
                <span className="text-muted-foreground">vs</span>
                <input
                  type="number" min={0} value={ly}
                  onChange={(e) => setM({ ...m, [f.key]: { ...m[f.key], ly: Number(e.target.value) } })}
                  className="num w-12 bg-transparent text-base font-semibold text-muted-foreground focus:outline-hidden"
                />
                <span className="text-[10px] tracking-wider text-muted-foreground uppercase">LY</span>
                <span className={`ml-auto num text-xs font-semibold ${cls}`}>{diff > 0 ? `+${diff}` : diff}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative dates grid */}
      <div className="mt-3 panel-2 px-3 py-2">
        <div className="label-caps mb-1.5">Comparative Wedding Muhurat Dates · {MONTH_FULL[monthKey]}</div>
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <div className="text-muted-foreground">2025 (CY) · {m.datesCY.length} dates</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {m.datesCY.length === 0 && <span className="text-muted-foreground">—</span>}
              {m.datesCY.map(d => (
                <span key={d} className="num rounded-sm bg-[color:var(--color-up)]/12 px-1.5 py-0.5 font-semibold text-[color:var(--color-up)] ring-1 ring-[color:var(--color-up)]/30">{d}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">2024 (LY) · {m.datesLY.length} dates</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {m.datesLY.length === 0 && <span className="text-muted-foreground">—</span>}
              {m.datesLY.map(d => (
                <span key={d} className="num rounded-sm bg-[color:var(--color-flat)]/15 px-1.5 py-0.5 font-medium text-muted-foreground ring-1 ring-border">{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------- 3 Platform Sale Events + Tagline Tracker ------------- */
function PlatformSaleSection({ monthKey }: { monthKey: MonthKey }) {
  const [rows] = usePersistentState(`sales::${monthKey}`, SALE_EVENTS[monthKey] ?? []);
  const [tagline, setTagline] = usePersistentState(`tagline::${monthKey}`, SALE_TAGLINES_DEFAULTS[monthKey] ?? "");
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

      <div className="mt-3 panel-2 px-3 py-2">
        <label className="label-caps">Ad Campaign Tagline / Punchline Tracker</label>
        <textarea
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          rows={3}
          placeholder="Log specific slogans run by platforms this month — e.g. 'Sabse bada sale', 'Pink Friday', etc."
          className="mt-1 w-full resize-y rounded-sm bg-transparent text-xs leading-relaxed focus:outline-hidden"
        />
        <div className="mt-1 text-[10px] text-muted-foreground">Tracks promotion aggression beyond standard sale dates.</div>
      </div>
    </Panel>
  );
}

/* ------------- 4 Weather & Climate ------------- */
function WeatherSection({ monthKey }: { monthKey: MonthKey }) {
  const [city, setCity] = usePersistentState<MetroCity>(`weatherCity::${monthKey}`, "Delhi");
  const [w, setW] = usePersistentState(`weather::${monthKey}`, {
    monsoonOnsetDelay: 0,
    arrivalSpeed: "Normal" as "Early" | "Normal" | "Delayed",
    aqi: 180,
  });

  const { series, summary, isLoading, isFetching, source } = useClimateData(monthKey, city);
  const cityRow = summary.find(s => s.city === city)!;
  const longName = MONTH_FULL[monthKey];

  const PRIMARY = "var(--color-primary)";
  const MUTED = "var(--color-flat)";
  const TEAL = "var(--color-teal)";

  return (
    <Panel title="4 · Weather & Climate" accent="primary" className="mt-4">
      {/* City switcher + month summary */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="label-caps mr-1">Metro City</span>
        <div className="flex flex-wrap gap-1">
          {METRO_CITIES.map(c => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold tracking-wide transition ${
                c === city
                  ? "bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]/60"
                  : "panel-2 text-muted-foreground hover:text-foreground"
              }`}
            >{c}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 text-[11px]">
          <div className="panel-2 px-2.5 py-1">
            <span className="label-caps">Avg Temp CY</span>
            <span className="num ml-1.5 font-semibold">{cityRow.avgTempCY}°C</span>
            <Delta cy={cityRow.avgTempCY} ly={cityRow.avgTempLY} suffix="°" />
          </div>
          <div className="panel-2 px-2.5 py-1">
            <span className="label-caps">Rain CY</span>
            <span className="num ml-1.5 font-semibold">{cityRow.totalRainCY} mm</span>
            <Delta cy={cityRow.totalRainCY} ly={cityRow.totalRainLY} suffix=" mm" />
          </div>
          <div className="panel-2 px-2.5 py-1">
            <span className="label-caps">Peak Day Rain</span>
            <span className="num ml-1.5 font-semibold">{cityRow.maxRainCY} mm</span>
          </div>
        </div>
      </div>

      {/* Two charts side-by-side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-2 px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="label-caps">Daily Avg Temperature · {city} · {longName}</div>
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3 bg-[color:var(--color-primary)]" />2025</span>
              <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3 bg-[color:var(--color-flat)]" />2024</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} stroke="var(--color-border)" />
                <YAxis unit="°" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} stroke="var(--color-border)" domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10, display: "none" }} />
                <Line type="monotone" dataKey="tempCY" name="2025" stroke={PRIMARY} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tempLY" name="2024" stroke={MUTED} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-2 px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="label-caps">Daily Rainfall (mm) · {city} · {longName}</div>
            <div className="flex gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-[color:var(--color-teal)]" />2025</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-[color:var(--color-flat)]/60" />2024</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} stroke="var(--color-border)" />
                <YAxis unit="mm" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} stroke="var(--color-border)" />
                <Tooltip contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", fontSize: 11 }} />
                <Bar dataKey="rainLY" name="2024" fill={MUTED} fillOpacity={0.45} />
                <Bar dataKey="rainCY" name="2025" fill={TEAL} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metro city comparison table */}
      <div className="mt-4 panel-2 overflow-hidden">
        <header className="border-b border-border px-3 py-1.5">
          <h4 className="label-caps">Top 8 Metro Cities · {longName} Climate Snapshot</h4>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="text-muted-foreground">
              <tr>
                {["City","Avg Temp 2025","Avg Temp 2024","Δ Temp","Rain 2025 (mm)","Rain 2024 (mm)","Δ Rain","Peak Day Rain"].map(h => (
                  <th key={h} className="label-caps px-2 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.map(r => (
                <tr
                  key={r.city}
                  className={`row-hover border-t border-border cursor-pointer ${r.city === city ? "bg-[color:var(--color-primary)]/5" : ""}`}
                  onClick={() => setCity(r.city)}
                >
                  <td className="px-2 py-1.5 font-semibold">{r.city}</td>
                  <td className="num px-2 py-1.5">{r.avgTempCY}°C</td>
                  <td className="num px-2 py-1.5 text-muted-foreground">{r.avgTempLY}°C</td>
                  <td className="px-2 py-1.5"><Delta cy={r.avgTempCY} ly={r.avgTempLY} suffix="°" /></td>
                  <td className="num px-2 py-1.5">{r.totalRainCY}</td>
                  <td className="num px-2 py-1.5 text-muted-foreground">{r.totalRainLY}</td>
                  <td className="px-2 py-1.5"><Delta cy={r.totalRainCY} ly={r.totalRainLY} suffix=" mm" /></td>
                  <td className="num px-2 py-1.5">{r.maxRainCY} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analyst fields */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="panel-2 flex flex-col gap-1 px-3 py-2">
          <span className="label-caps">Monsoon Onset/Withdraw Δ (days)</span>
          <input
            type="number" step={1} value={w.monsoonOnsetDelay}
            onChange={(e)=>setW({ ...w, monsoonOnsetDelay: Number(e.target.value) })}
            className="num bg-transparent text-base font-semibold focus:outline-hidden"
          />
        </label>
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
        <label className="panel-2 flex flex-col gap-1 px-3 py-2">
          <span className="label-caps">Avg AQI (Tier-1 Metros)</span>
          <input
            type="number" step={1} value={w.aqi}
            onChange={(e)=>setW({ ...w, aqi: Number(e.target.value) })}
            className="num bg-transparent text-base font-semibold focus:outline-hidden"
          />
        </label>
        <div className="panel-2 flex flex-col gap-1 px-3 py-2">
          <span className="label-caps">AQI Band</span>
          <div className="text-base font-semibold">
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

/* ------------- 6 Category Grid + Predictive Outlook ------------- */
function CategoryGridSection({ monthKey }: { monthKey: MonthKey }) {
  const init: Record<string, Trend> = Object.fromEntries(CATEGORIES_18.map(c => [c, "Flat" as Trend]));
  const [data, setData] = usePersistentState(`cat::${monthKey}`, init);
  const cycle = (t: Trend): Trend => (t === "Up" ? "Down" : t === "Down" ? "Flat" : "Up");

  return (
    <Panel title="6 · Category Performance Grid + Secondary Predictive Outlook" accent="primary" className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="label-caps border-b border-border px-3 py-1.5 text-left">Category</th>
              <th className="label-caps border-b border-border px-3 py-1.5 text-left">Segment-Specific Indicator</th>
              <th className="label-caps border-b border-border px-3 py-1.5 text-center">Analyst Direction</th>
              <th className="label-caps border-b border-border px-3 py-1.5 text-center">Secondary Predictive Outlook</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES_18.map(c => {
              const t = data[c];
              const Icon = t === "Up" ? TrendingUp : t === "Down" ? TrendingDown : Minus;
              const tCls = t === "Up" ? "text-[color:var(--color-up)] ring-[color:var(--color-up)]/40" :
                          t === "Down" ? "text-[color:var(--color-down)] ring-[color:var(--color-down)]/40" :
                          "text-[color:var(--color-flat)] ring-border";
              const outlook = predictOutlook(monthKey, c);
              const oMeta =
                outlook === "Up"   ? { sym: "▲", label: "Expected Growth",  cls: "text-[color:var(--color-up)] bg-[color:var(--color-up)]/10 ring-[color:var(--color-up)]/40" } :
                outlook === "Down" ? { sym: "▼", label: "Expected Decline", cls: "text-[color:var(--color-down)] bg-[color:var(--color-down)]/10 ring-[color:var(--color-down)]/40" } :
                                     { sym: "▶", label: "Expected Flat",    cls: "text-[color:var(--color-flat)] bg-[color:var(--color-flat)]/10 ring-border" };
              return (
                <tr key={c} className="row-hover border-b border-border">
                  <td className="px-3 py-1.5 font-semibold">{c}</td>
                  <td className="px-3 py-1.5 text-[11px] text-muted-foreground">
                    {SEGMENT_INDICATORS[c] ?? <span className="text-muted-foreground/70">—</span>}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => setData({ ...data, [c]: cycle(t) })}
                      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ${tCls}`}
                      title="Click to cycle Up → Down → Flat"
                    >
                      <Icon className="h-3 w-3" /> {t}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ${oMeta.cls}`}>
                      {oMeta.sym} {oMeta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Outlook combines festive density, active sale clusters, MoM inflation pressure and category-specific bias. Use it as a secondary
        sanity-check — not as a verdict — against your primary expert numbers.
      </p>
    </Panel>
  );
}

/* ------------- 7 Macro & Consumer Signals — MoM + split inflation + Electronics Imports ------------- */
function MacroSection({ monthKey }: { monthKey: MonthKey }) {
  const init = Object.fromEntries(MACRO_SIGNALS_V2.map(s => [s.key, { cm: Number(s.cm), pm: Number(s.pm) }]));
  const [data, setData] = usePersistentState(`macro2::${monthKey}`, init);
  const [imports, setImports] = usePersistentState(`imports::${monthKey}`, ELECTRONICS_IMPORTS);
  return (
    <Panel title="7 · Macro & Consumer Trends (MoM)" accent="primary">
      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="label-caps border-b border-border px-2 py-1.5 text-left">Indicator</th>
            <th className="label-caps border-b border-border px-2 py-1.5 text-right">Current Month</th>
            <th className="label-caps border-b border-border px-2 py-1.5 text-right">Prev Month</th>
            <th className="label-caps border-b border-border px-2 py-1.5 text-right">Δ MoM</th>
          </tr>
        </thead>
        <tbody>
          {MACRO_SIGNALS_V2.map(s => {
            const v = data[s.key];
            return (
              <tr key={s.key} className="row-hover border-b border-border">
                <td className="px-2 py-1.5 font-medium">{s.label}</td>
                <td className="px-2 py-1.5 text-right">
                  <input
                    type="number" step={0.01} value={v.cm}
                    onChange={(e) => setData({ ...data, [s.key]: { ...v, cm: Number(e.target.value) } })}
                    className="num w-20 bg-transparent text-right focus:outline-hidden"
                  />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <input
                    type="number" step={0.01} value={v.pm}
                    onChange={(e) => setData({ ...data, [s.key]: { ...v, pm: Number(e.target.value) } })}
                    className="num w-20 bg-transparent text-right text-muted-foreground focus:outline-hidden"
                  />
                </td>
                <td className="px-2 py-1.5 text-right"><Delta cy={v.cm} ly={v.pm} suffix={s.unit ? ` ${s.unit}` : ""} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Electronics Imports Sub-Grid */}
      <div className="mt-4 panel-2 overflow-hidden">
        <header className="border-b border-border px-3 py-1.5">
          <h4 className="label-caps text-[color:var(--color-teal)]">Electronics Import Sub-Grid · Customs Data (USD Millions)</h4>
        </header>
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="label-caps px-3 py-1.5 text-left">Category</th>
              <th className="label-caps px-3 py-1.5 text-right">CY (USD M)</th>
              <th className="label-caps px-3 py-1.5 text-right">PY (USD M)</th>
              <th className="label-caps px-3 py-1.5 text-right">Δ YoY</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((r, i) => (
              <tr key={r.name} className="row-hover border-t border-border">
                <td className="px-3 py-1.5 font-medium">{r.name}</td>
                <td className="px-3 py-1.5 text-right">
                  <input
                    type="number" value={r.cy}
                    onChange={(e) => { const n = [...imports]; n[i] = { ...r, cy: Number(e.target.value) }; setImports(n); }}
                    className="num w-20 bg-transparent text-right focus:outline-hidden"
                  />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <input
                    type="number" value={r.py}
                    onChange={(e) => { const n = [...imports]; n[i] = { ...r, py: Number(e.target.value) }; setImports(n); }}
                    className="num w-20 bg-transparent text-right text-muted-foreground focus:outline-hidden"
                  />
                </td>
                <td className="px-3 py-1.5 text-right"><Delta cy={r.cy} ly={r.py} suffix=" M" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-3 py-1.5 text-[10px] text-muted-foreground">Source: Govt of India customs / DGCI&amp;S monthly imports — edit to match latest pull.</p>
      </div>
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
