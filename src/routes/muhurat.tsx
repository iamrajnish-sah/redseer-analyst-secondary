import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { MONTHS, MUHURATS, MONTH_FULL } from "@/lib/data";

export const Route = createFileRoute("/muhurat")({
  head: () => ({
    meta: [
      { title: "Muhurat Calendar — IndustryIntel" },
      { name: "description", content: "Annual auspicious-dates matrix with Shraadh, Kharmas and Chaturmas blockouts." },
    ],
  }),
  component: MuhuratPage,
});

const ROW_DEFS = [
  { key: "shaadi", label: "Shaadi (Wedding)" },
  { key: "janeu", label: "Janeu (Thread)" },
  { key: "namkaran", label: "Namkaran" },
  { key: "grihaPravesh", label: "Griha Pravesh" },
  { key: "annaprashan", label: "Annaprashan" },
] as const;

function MuhuratPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <div className="label-caps">View 3</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Muhurat Calendar Matrix · FY 25-26</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solid orange-shaded columns indicate <span className="text-[color:var(--color-risk)] font-semibold">Shraadh, Kharmas or Chaturmas</span> dead-zones.
        </p>
      </div>

      <Panel title="Annual Auspicious Date Matrix" accent="gold">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="label-caps sticky left-0 z-10 border-b border-border bg-[color:var(--color-surface)] px-2 py-2 text-left">Ceremony</th>
                {MONTHS.map(m => {
                  const block = MUHURATS[m].blockout;
                  return (
                    <th key={m} className={`label-caps border-b border-border px-2 py-2 text-center ${block ? "bg-[color:var(--color-risk)]/15" : ""}`}>
                      <div className="text-foreground">{m}</div>
                      {block && <div className="mt-0.5 text-[9px] font-medium text-[color:var(--color-risk)] tracking-normal normal-case leading-tight">{block}</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="num">
              {ROW_DEFS.map(rd => (
                <tr key={rd.key} className="row-hover">
                  <td className="sticky left-0 z-10 border-b border-border bg-[color:var(--color-surface)] px-2 py-2 font-medium">{rd.label}</td>
                  {MONTHS.map(m => {
                    const v = MUHURATS[m][rd.key];
                    const block = MUHURATS[m].blockout;
                    const intensity = Math.min(1, 0.12 + v * 0.06);
                    return (
                      <td key={m} className={`border-b border-border px-2 py-2 text-center ${block ? "bg-[color:var(--color-risk)]/15" : ""}`}>
                        <div
                          className="mx-auto grid h-7 w-10 place-items-center rounded-sm font-semibold"
                          style={{
                            backgroundColor: v > 0 && !block ? `color-mix(in oklab, var(--color-gold) ${intensity*100}%, transparent)` : "transparent",
                            color: v >= 8 ? "var(--color-background)" : "var(--color-foreground)",
                            opacity: v === 0 ? 0.35 : 1,
                          }}
                        >
                          {v}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="border-b border-border px-2 py-2 font-semibold">Month Total</td>
                {MONTHS.map(m => {
                  const sum = ROW_DEFS.reduce((s, rd) => s + MUHURATS[m][rd.key], 0);
                  const block = MUHURATS[m].blockout;
                  return (
                    <td key={m} className={`border-b border-border px-2 py-2 text-center font-bold ${block ? "bg-[color:var(--color-risk)]/15 text-[color:var(--color-risk)]" : "text-[color:var(--color-gold)]"}`}>
                      {sum}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          {MONTHS.filter(m => MUHURATS[m].blockout).map(m => (
            <div key={m} className="panel-2 border-l-2 border-[color:var(--color-risk)] px-3 py-2">
              <div className="label-caps text-[color:var(--color-risk)]">{MONTH_FULL[m]}</div>
              <div className="mt-0.5 font-medium">{MUHURATS[m].blockout}</div>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
