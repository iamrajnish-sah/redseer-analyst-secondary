import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel, Delta } from "@/components/AppShell";
import { OVERVIEW_BASELINE, MONTHS, FESTIVE_DENSITY, SEASON_PROFILE, MONTH_FULL } from "@/lib/data";
import { usePersistentState } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Overview — IndustryIntel" },
      { name: "description", content: "Cross-annual master matrix of festive, climate, macro and platform signals." },
    ],
  }),
  component: OverviewPage,
});

function densityCell(d: number) {
  const opacity = Math.min(1, 0.18 + d * 0.075);
  return {
    backgroundColor: `color-mix(in oklab, var(--color-gold) ${opacity * 100}%, transparent)`,
    color: "var(--color-foreground)",
  };
}

function OverviewPage() {
  const [rows, setRows] = usePersistentState("overview-rows", OVERVIEW_BASELINE);

  const totalFestivalsCY = rows.reduce((s,r)=>s+r.festivalCY,0);
  const totalWeddingsCY = rows.reduce((s,r)=>s+r.weddingCY,0);
  const totalSales = rows.reduce((s,r)=>s+r.saleEvents,0);
  const peak = rows.slice().sort((a,b)=>b.festivalCY-a.festivalCY)[0];

  const heroCards = [
    { label: "Months Sourced", val: "12", sub: "Full FY 2025-26", accent: "primary" },
    { label: "Peak Festive Window", val: peak.month, sub: `${peak.festivalCY} festivals · ${peak.weddingCY} muhurats`, accent: "gold" },
    { label: "Platforms Tracked", val: "18", sub: "4 verticals · India", accent: "teal" },
    { label: "Active Signals Monitored", val: "55+", sub: "Calendar · Climate · Macro · Supply", accent: "primary" },
  ] as const;

  return (
    <AppShell>
      {/* Hero counters */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {heroCards.map(c => (
          <div key={c.label} className="panel relative px-4 py-3">
            <div className={`absolute left-0 top-0 h-full w-0.5 ${
              c.accent === "gold" ? "bg-[color:var(--color-gold)]" :
              c.accent === "teal" ? "bg-[color:var(--color-teal)]" : "bg-[color:var(--color-primary)]"
            }`} />
            <div className="label-caps">{c.label}</div>
            <div className="num mt-1 text-2xl font-bold tracking-tight">{c.val}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr] xl:grid-cols-[2fr_1fr]">
        <Panel title="Cross-Annual Festive & Wedding Heatmap" accent="gold">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="label-caps sticky left-0 bg-[color:var(--color-surface)] px-2 py-1 text-left">Signal</th>
                  {MONTHS.map(m => (
                    <th key={m} className="label-caps px-1.5 py-1 text-center">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="num">
                <tr>
                  <td className="sticky left-0 bg-[color:var(--color-surface)] px-2 py-1.5 text-muted-foreground">Festive Density</td>
                  {MONTHS.map(m => (
                    <td key={m} className="px-1 py-1.5 text-center">
                      <div className="grid h-8 w-full place-items-center rounded-sm font-semibold" style={densityCell(FESTIVE_DENSITY[m])}>
                        {FESTIVE_DENSITY[m]}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky left-0 bg-[color:var(--color-surface)] px-2 py-1.5 text-muted-foreground">Festivals CY</td>
                  {rows.map(r => <td key={r.month} className="px-1 py-1.5 text-center font-medium">{r.festivalCY}</td>)}
                </tr>
                <tr>
                  <td className="sticky left-0 bg-[color:var(--color-surface)] px-2 py-1.5 text-muted-foreground">Weddings CY</td>
                  {rows.map(r => <td key={r.month} className="px-1 py-1.5 text-center font-medium">{r.weddingCY}</td>)}
                </tr>
                <tr>
                  <td className="sticky left-0 bg-[color:var(--color-surface)] px-2 py-1.5 text-muted-foreground">Sale Events</td>
                  {rows.map(r => <td key={r.month} className="px-1 py-1.5 text-center font-medium">{r.saleEvents}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="FY Aggregate Counts" accent="primary">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="panel-2 px-3 py-2">
              <dt className="label-caps">Festivals (CY)</dt>
              <dd className="num mt-1 text-xl font-bold">{totalFestivalsCY}</dd>
            </div>
            <div className="panel-2 px-3 py-2">
              <dt className="label-caps">Weddings (CY)</dt>
              <dd className="num mt-1 text-xl font-bold">{totalWeddingsCY}</dd>
            </div>
            <div className="panel-2 px-3 py-2">
              <dt className="label-caps">Platform Sales</dt>
              <dd className="num mt-1 text-xl font-bold">{totalSales}</dd>
            </div>
            <div className="panel-2 px-3 py-2">
              <dt className="label-caps">Anomalies</dt>
              <dd className="num mt-1 text-xl font-bold text-[color:var(--color-risk)]">
                {rows.filter(r=>r.weather==="Anomaly").length}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            All counts editable in the master matrix below. Persisted to local storage —
            no automated verdicts are produced.
          </p>
        </Panel>
      </div>

      {/* Master matrix */}
      <Panel title="12-Month Master Cross-Comparison Matrix" accent="primary" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="text-left">
                {["Month","Season & Climate","Festivals (CY vs LY)","Wedding Muhurats (YoY)","Sale Events","Weather","Sentiment","Confidence","Detail"].map(h=>(
                  <th key={h} className="label-caps border-b border-border bg-[color:var(--color-surface)] px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const isPeak = r.month === "Oct";
                return (
                  <tr key={r.month} className="row-hover border-b border-border">
                    <td className="border-b border-border px-2 py-2 font-semibold">
                      <div className="flex items-center gap-1.5">
                        {r.month}
                        {isPeak && <span className="rounded-sm bg-[color:var(--color-gold)]/25 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[color:var(--color-gold)] uppercase ring-1 ring-[color:var(--color-gold)]/60">Peak</span>}
                      </div>
                    </td>
                    <td className="border-b border-border px-2 py-2 text-muted-foreground">{SEASON_PROFILE[r.month]}</td>
                    <td className="border-b border-border px-2 py-2">
                      <div className="flex items-baseline gap-2">
                        <span className="num font-semibold">{r.festivalCY}</span>
                        <span className="num text-[10px] text-muted-foreground">vs {r.festivalLY}</span>
                        <Delta cy={r.festivalCY} ly={r.festivalLY} />
                      </div>
                    </td>
                    <td className="border-b border-border px-2 py-2">
                      <div className="flex items-baseline gap-2">
                        <span className="num font-semibold">{r.weddingCY}</span>
                        <span className="num text-[10px] text-muted-foreground">vs {r.weddingLY}</span>
                        <Delta cy={r.weddingCY} ly={r.weddingLY} />
                      </div>
                    </td>
                    <td className="border-b border-border px-2 py-2 num">{r.saleEvents}</td>
                    <td className="border-b border-border px-2 py-2">
                      <select
                        value={r.weather}
                        onChange={(e) => {
                          const next = [...rows]; next[idx] = { ...r, weather: e.target.value as "Normal" | "Anomaly" }; setRows(next);
                        }}
                        className={`rounded-sm border border-border bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] ${r.weather === "Anomaly" ? "text-[color:var(--color-risk)]" : "text-[color:var(--color-up)]"}`}
                      >
                        <option>Normal</option><option>Anomaly</option>
                      </select>
                    </td>
                    <td className="border-b border-border px-2 py-2">
                      <select
                        value={r.sentiment}
                        onChange={(e) => {
                          const next = [...rows]; next[idx] = { ...r, sentiment: e.target.value as "Bullish" | "Flat" | "Bearish" }; setRows(next);
                        }}
                        className={`rounded-sm border border-border bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] ${
                          r.sentiment === "Bullish" ? "text-[color:var(--color-up)]" :
                          r.sentiment === "Bearish" ? "text-[color:var(--color-down)]" : "text-[color:var(--color-flat)]"
                        }`}
                      >
                        <option>Bullish</option><option>Flat</option><option>Bearish</option>
                      </select>
                    </td>
                    <td className="border-b border-border px-2 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min={1} max={10} value={r.confidence}
                          onChange={(e) => {
                            const next = [...rows]; next[idx] = { ...r, confidence: Number(e.target.value) }; setRows(next);
                          }}
                          className="h-1 w-20 accent-[color:var(--color-primary)]"
                        />
                        <span className="num w-6 text-right font-semibold">{r.confidence}</span>
                      </div>
                    </td>
                    <td className="border-b border-border px-2 py-2">
                      <Link
                        to="/month/$month"
                        params={{ month: r.month }}
                        className="rounded-sm border border-border px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/10"
                      >
                        {MONTH_FULL[r.month]} →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
