import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { SIMILARWEB_DATA } from "@/lib/data";
import { usePersistentState } from "@/lib/storage";

export const Route = createFileRoute("/similarweb")({
  head: () => ({
    meta: [
      { title: "Similarweb Traffic Data — IndustryIntel" },
      { name: "description", content: "Monthly traffic, MoM growth, average duration and bounce rate across 8 platforms." },
    ],
  }),
  component: SimilarwebPage,
});

function deltaCls(v: number) {
  return v > 0
    ? "text-[color:var(--color-up)]"
    : v < 0
    ? "text-[color:var(--color-down)]"
    : "text-[color:var(--color-flat)]";
}

function SimilarwebPage() {
  const [rows, setRows] = usePersistentState("similarweb-rows", SIMILARWEB_DATA);

  const totalVisits = rows.reduce((s, r) => s + r.visits, 0);
  const avgMoM = rows.reduce((s, r) => s + r.mom, 0) / rows.length;
  const avgBounce = rows.reduce((s, r) => s + r.bounce, 0) / rows.length;

  return (
    <AppShell>
      <div className="mb-4">
        <div className="label-caps">Web Traffic</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Similarweb Traffic Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monthly engagement signals for 8 priority horizontal, fashion and quick-commerce platforms.
          Values are analyst-editable for triangulation against primary panels.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="panel px-4 py-3">
          <div className="label-caps">Total Visits Tracked</div>
          <div className="num mt-1 text-2xl font-bold">{totalVisits.toFixed(1)} M</div>
        </div>
        <div className="panel px-4 py-3">
          <div className="label-caps">Avg MoM Growth</div>
          <div className={`num mt-1 text-2xl font-bold ${deltaCls(avgMoM)}`}>
            {avgMoM >= 0 ? "+" : ""}{avgMoM.toFixed(2)}%
          </div>
        </div>
        <div className="panel px-4 py-3">
          <div className="label-caps">Avg Bounce Rate</div>
          <div className="num mt-1 text-2xl font-bold">{avgBounce.toFixed(1)}%</div>
        </div>
        <div className="panel px-4 py-3">
          <div className="label-caps">Platforms Monitored</div>
          <div className="num mt-1 text-2xl font-bold">{rows.length}</div>
        </div>
      </div>

      <Panel title="Platform Traffic Matrix" accent="primary">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead className="text-muted-foreground">
              <tr>
                {["Platform", "Total Monthly Visits (M)", "MoM Traffic Growth %", "Avg Visit Duration", "Bounce Rate %"].map(h => (
                  <th key={h} className="label-caps border-b border-border px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.platform} className="row-hover border-b border-border">
                  <td className="px-3 py-2 font-semibold">{r.platform}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number" step={0.1} value={r.visits}
                      onChange={(e) => {
                        const next = [...rows]; next[i] = { ...r, visits: Number(e.target.value) }; setRows(next);
                      }}
                      className="num w-24 rounded-sm border border-border bg-[color:var(--color-surface-2)] px-2 py-1 text-right focus:outline-hidden focus:ring-1 focus:ring-[color:var(--color-primary)]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number" step={0.1} value={r.mom}
                        onChange={(e) => {
                          const next = [...rows]; next[i] = { ...r, mom: Number(e.target.value) }; setRows(next);
                        }}
                        className={`num w-20 rounded-sm border border-border bg-[color:var(--color-surface-2)] px-2 py-1 text-right font-semibold focus:outline-hidden ${deltaCls(r.mom)}`}
                      />
                      <span className={`text-[11px] font-semibold ${deltaCls(r.mom)}`}>
                        {r.mom > 0 ? "▲" : r.mom < 0 ? "▼" : "▶"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={r.duration}
                      onChange={(e) => {
                        const next = [...rows]; next[i] = { ...r, duration: e.target.value }; setRows(next);
                      }}
                      className="num w-20 rounded-sm border border-border bg-[color:var(--color-surface-2)] px-2 py-1 text-right focus:outline-hidden"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" step={0.1} value={r.bounce}
                      onChange={(e) => {
                        const next = [...rows]; next[i] = { ...r, bounce: Number(e.target.value) }; setRows(next);
                      }}
                      className="num w-20 rounded-sm border border-border bg-[color:var(--color-surface-2)] px-2 py-1 text-right focus:outline-hidden"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Source: Similarweb Digital Intelligence (placeholder values — overwrite with monthly pull).
          Edits persist to local storage.
        </p>
      </Panel>
    </AppShell>
  );
}
