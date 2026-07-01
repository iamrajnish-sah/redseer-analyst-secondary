import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { MONTHS, FESTIVE_DENSITY, type MonthKey, OVERVIEW_BASELINE } from "@/lib/data";
import { usePersistentState } from "@/lib/storage";
import { Download, Activity } from "lucide-react";

const FY_OPTIONS = ["FY 2023-24","FY 2024-25","FY 2025-26","FY 2026-27"];

function densityClasses(d: number) {
  // d 0-10
  if (d >= 9) return "bg-[color:var(--color-gold)]/30 ring-1 ring-[color:var(--color-gold)] shadow-[0_0_18px_-2px_color-mix(in_oklab,var(--color-gold)_70%,transparent)]";
  if (d >= 7) return "bg-[color:var(--color-gold)]/20 ring-1 ring-[color:var(--color-gold)]/70";
  if (d >= 5) return "bg-[color:var(--color-primary)]/15 ring-1 ring-[color:var(--color-primary)]/60";
  if (d >= 3) return "bg-[color:var(--color-primary)]/10 ring-1 ring-[color:var(--color-primary)]/40";
  return "bg-[color:var(--color-surface-2)] ring-1 ring-[color:var(--color-border)]";
}

function exportCSV() {
  const headers = ["Month","FestivalsCY","FestivalsLY","WeddingsCY","WeddingsLY","SaleEvents","Weather","Sentiment","Confidence"];
  const rows = OVERVIEW_BASELINE.map(r =>
    [r.month,r.festivalCY,r.festivalLY,r.weddingCY,r.weddingLY,r.saleEvents,r.weather,r.sentiment,r.confidence].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "industryintel-summary.csv"; a.click();
  URL.revokeObjectURL(url);
}

export function AppShell({ children }: { children: ReactNode }) {
  const [fy, setFy] = usePersistentState<string>("fy", "FY 2025-26");
  const pathname = useRouterState({ select: s => s.location.pathname });

  const navItems = [
    { to: "/", label: "Dashboard Overview", match: pathname === "/" },
    { to: "/month/Oct", label: "Month Details", match: pathname.startsWith("/month") },
    { to: "/upload-hub", label: "Upload Hub & Ingestion Feed", match: pathname === "/upload-hub" },
    { to: "/similarweb", label: "Similarweb Traffic Data", match: pathname === "/similarweb" },
    { to: "/search-interest-comparison", label: "Search Interest (Google Trends)", match: pathname === "/search-interest-comparison" },
    { to: "/reference", label: "Reference Library", match: pathname === "/reference" },
    { to: "/meesho-ads", label: "Meesho Ad Tracker", match: pathname === "/meesho-ads" },
  ];

  const activeMonth: MonthKey | null = pathname.startsWith("/month/")
    ? (pathname.split("/")[2] as MonthKey)
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-sm bg-[color:var(--color-primary)]/20 ring-1 ring-[color:var(--color-primary)]">
              <Activity className="h-4 w-4 text-[color:var(--color-primary)]" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">IndustryIntel</div>
              <div className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Secondary Research Tracker</div>
            </div>
          </Link>

          <div className="ml-2 hidden items-center gap-1.5 md:flex">
            <span className="label-caps">FY</span>
            <select
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="num rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-[color:var(--color-primary)]"
            >
              {FY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {navItems.map(n => (
              <Link
                key={n.to}
                to={n.to}
                className={`rounded-sm px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${
                  n.match
                    ? "bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]/60"
                    : "text-muted-foreground hover:bg-[color:var(--color-surface)] hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <button
              onClick={exportCSV}
              className="ml-2 inline-flex items-center gap-1.5 rounded-sm border border-border bg-[color:var(--color-surface)] px-2.5 py-1.5 text-xs font-medium hover:bg-[color:var(--color-surface-2)]"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </nav>
        </div>

        {/* Month Ribbon */}
        <div className="border-t border-border bg-[color:var(--color-surface)]/60">
          <div className="mx-auto flex max-w-[1600px] items-center gap-1.5 overflow-x-auto px-4 py-2">
            <span className="label-caps shrink-0 mr-1">Months FY 25-26</span>
            {MONTHS.map((m) => {
              const d = FESTIVE_DENSITY[m];
              const active = activeMonth === m;
              return (
                <Link
                  key={m}
                  to="/month/$month"
                  params={{ month: m }}
                  className={`group relative grid h-10 w-14 shrink-0 place-items-center rounded-sm text-[11px] font-semibold tracking-wider transition ${densityClasses(d)} ${
                    active ? "outline-2 outline-[color:var(--color-primary)] outline-offset-1" : ""
                  }`}
                  title={`${m} — festive density ${d}/10`}
                >
                  <span>{m.toUpperCase()}</span>
                  <span className="absolute -bottom-1 right-1 text-[8px] num text-muted-foreground">{d}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5">{children}</main>

      <footer className="border-t border-border py-4 text-center text-[10px] tracking-wider text-muted-foreground uppercase">
        IndustryIntel · Indicator Matrix · No automated verdicts — synthesis is yours
      </footer>
    </div>
  );
}

export function Panel({
  title, accent, action, children, className = "",
}: {
  title?: string;
  accent?: "primary" | "gold" | "teal" | "risk";
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const accentBar = {
    primary: "bg-[color:var(--color-primary)]",
    gold:    "bg-[color:var(--color-gold)]",
    teal:    "bg-[color:var(--color-teal)]",
    risk:    "bg-[color:var(--color-risk)]",
  }[accent ?? "primary"];

  return (
    <section className={`panel relative overflow-hidden ${className}`}>
      {accent && <div className={`absolute left-0 top-0 h-full w-0.5 ${accentBar}`} />}
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2">
          <h3 className="label-caps text-foreground">{title}</h3>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Delta({ cy, ly, suffix = "" }: { cy: number; ly: number; suffix?: string }) {
  const diff = cy - ly;
  const cls = diff > 0 ? "text-[color:var(--color-up)]" : diff < 0 ? "text-[color:var(--color-down)]" : "text-[color:var(--color-flat)]";
  const sign = diff > 0 ? "+" : "";
  return (
    <span className={`num text-xs font-semibold ${cls}`}>
      {sign}{diff}{suffix}
    </span>
  );
}
