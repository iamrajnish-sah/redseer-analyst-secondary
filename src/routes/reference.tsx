import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { REFERENCE_LIBRARY, type ReferenceFactor } from "@/lib/data";
import { usePersistentState } from "@/lib/storage";
import { Search } from "lucide-react";

export const Route = createFileRoute("/reference")({
  head: () => ({
    meta: [
      { title: "Factor Reference Library — IndustryIntel" },
      { name: "description", content: "Searchable database of 55+ secondary-research indicators with source and reporting cadence." },
    ],
  }),
  component: ReferencePage,
});

const CATEGORIES: Array<"All" | ReferenceFactor["category"]> = [
  "All","Calendar","Climate","Macroeconomic","Funding Ecosystem","Platform Intel","Supply Chain","Consumer Intent Trends",
];

const catColor: Record<ReferenceFactor["category"], string> = {
  Calendar: "text-[color:var(--color-gold)] border-[color:var(--color-gold)]/50",
  Climate: "text-[color:var(--color-primary)] border-[color:var(--color-primary)]/50",
  Macroeconomic: "text-[color:var(--color-teal)] border-[color:var(--color-teal)]/50",
  "Funding Ecosystem": "text-[color:var(--color-up)] border-[color:var(--color-up)]/40",
  "Platform Intel": "text-[color:var(--color-teal)] border-[color:var(--color-teal)]/50",
  "Supply Chain": "text-[color:var(--color-risk)] border-[color:var(--color-risk)]/50",
  "Consumer Intent Trends": "text-[color:var(--color-primary)] border-[color:var(--color-primary)]/50",
};

function ReferencePage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [weights, setWeights] = usePersistentState<Record<string, "High"|"Medium"|"Low">>(
    "factor-weights",
    Object.fromEntries(REFERENCE_LIBRARY.map(f => [f.name, "Medium"]))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REFERENCE_LIBRARY.filter(f => {
      if (cat !== "All" && f.category !== cat) return false;
      if (!q) return true;
      return (f.name + f.why + f.source + f.category).toLowerCase().includes(q);
    });
  }, [query, cat]);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-caps">View 4</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Factor Reference Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="num font-semibold text-foreground">{REFERENCE_LIBRARY.length}</span> indicators across {CATEGORIES.length - 1} core categories.
          </p>
        </div>
        <div className="num text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> / {REFERENCE_LIBRARY.length}
        </div>
      </div>

      <Panel accent="primary">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-sm border border-border bg-[color:var(--color-surface-2)] px-2.5 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query} onChange={(e)=>setQuery(e.target.value)}
              placeholder="Search factor name, source, relevance..."
              className="w-full bg-transparent text-sm focus:outline-hidden"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={()=>setCat(c)}
                className={`rounded-sm border px-2.5 py-1 text-[11px] font-medium tracking-wide transition ${
                  cat === c
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]"
                    : "border-border bg-[color:var(--color-surface-2)] text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-xs">
            <thead className="text-muted-foreground">
              <tr>
                {["Factor","Category","Why It Matters","Primary Source","Frequency","Weight"].map(h=>(
                  <th key={h} className="label-caps border-b border-border px-2 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const w = weights[f.name] ?? "Medium";
                const wcls = w === "High" ? "text-[color:var(--color-risk)] border-[color:var(--color-risk)]/60" :
                             w === "Low" ? "text-muted-foreground border-border" :
                             "text-[color:var(--color-gold)] border-[color:var(--color-gold)]/60";
                return (
                  <tr key={f.name} className="row-hover border-b border-border align-top">
                    <td className="px-2 py-2 font-medium">{f.name}</td>
                    <td className="px-2 py-2">
                      <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${catColor[f.category]}`}>
                        {f.category}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground leading-relaxed max-w-[420px]">{f.why}</td>
                    <td className="px-2 py-2 text-muted-foreground">{f.source}</td>
                    <td className="px-2 py-2 num">{f.freq}</td>
                    <td className="px-2 py-2">
                      <select
                        value={w}
                        onChange={(e)=>setWeights({ ...weights, [f.name]: e.target.value as "High"|"Medium"|"Low" })}
                        className={`rounded-sm border bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] font-medium ${wcls}`}
                      >
                        <option>High</option><option>Medium</option><option>Low</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">No factors match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
