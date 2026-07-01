import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import adsData from "@/lib/meesho-ads.json";
import { ExternalLink, ImageOff } from "lucide-react";

export const Route = createFileRoute("/meesho-ads")({
  head: () => ({
    meta: [
      { title: "Meesho Ad Tracker — IndustryIntel" },
      { name: "description", content: "Meta ad-library ads for Meesho with days-running ranking." },
    ],
  }),
  component: MeeshoAdsPage,
});

type Ad = {
  id: string | null;
  page_name: string | null;
  page_profile_picture_url: string | null;
  page_profile_uri: string | null;
  body: string | null;
  image: string | null;
  start_date: number | null;
  end_date: number | null;
  is_active: boolean;
  publisher_platform: string[] | null;
};

function daysBetween(startSec: number, endSec: number) {
  return Math.max(0, Math.floor((endSec - startSec) / 86400));
}

function fmt(sec: number | null) {
  if (!sec) return "—";
  return new Date(sec * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function AdImage({ src, alt }: { src: string | null; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="flex h-48 w-full items-center justify-center border-b border-border bg-[color:var(--color-surface-2)] text-muted-foreground">
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setErr(true)}
      className="h-48 w-full border-b border-border bg-[color:var(--color-surface-2)] object-cover"
    />
  );
}

function MeeshoAdsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [q, setQ] = useState("");

  const ads = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const list = (adsData as Ad[]).map((a) => {
      const end = a.is_active ? now : a.end_date ?? now;
      const start = a.start_date ?? end;
      return { ...a, _days: daysBetween(start, Math.min(end, now)) };
    });
    return list
      .filter((a) => (filter === "all" ? true : filter === "active" ? a.is_active : !a.is_active))
      .filter((a) => (q.trim() ? (a.body ?? "").toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b._days - a._days);
  }, [filter, q]);

  const stats = useMemo(() => {
    const total = (adsData as Ad[]).length;
    const active = (adsData as Ad[]).filter((a) => a.is_active).length;
    return { total, active, inactive: total - active };
  }, []);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Meesho Ad Tracker</h1>
          <p className="text-xs text-muted-foreground">
            Meta Ad Library snapshot · sorted by longest-running · static dataset (Apify curious_coder/facebook-ads-library-scraper)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ad copy…"
            className="rounded-sm border border-border bg-[color:var(--color-surface)] px-2 py-1 text-xs focus:outline-hidden focus:ring-1 focus:ring-[color:var(--color-primary)]"
          />
          <div className="flex items-center rounded-sm border border-border bg-[color:var(--color-surface)] text-xs">
            {(["all", "active", "inactive"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2.5 py-1 capitalize ${filter === k ? "bg-[color:var(--color-primary)]/20 text-[color:var(--color-primary)]" : "text-muted-foreground hover:text-foreground"}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Panel title="Total Ads">
          <div className="num text-2xl font-bold">{stats.total}</div>
        </Panel>
        <Panel title="Currently Active" accent="teal">
          <div className="num text-2xl font-bold text-[color:var(--color-up)]">{stats.active}</div>
        </Panel>
        <Panel title="Inactive / Ended" accent="risk">
          <div className="num text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ads.map((a) => (
          <article key={a.id ?? Math.random()} className="panel flex flex-col overflow-hidden">
            <AdImage src={a.image} alt={a.body ?? "Meesho ad"} />
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              {a.page_profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.page_profile_picture_url}
                  alt={a.page_name ?? ""}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full border border-border object-cover"
                  onError={(e) => ((e.currentTarget.style.visibility = "hidden"))}
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-[color:var(--color-surface-2)]" />
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-xs font-semibold">{a.page_name ?? "Unknown"}</div>
                <div className="text-[10px] text-muted-foreground">{a.is_active ? "● Active" : "○ Ended"}</div>
              </div>
              {a.page_profile_uri && (
                <a
                  href={a.page_profile_uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-[color:var(--color-primary)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <div className="flex-1 px-3 py-2 text-xs leading-snug text-foreground">
              <p className="line-clamp-5">{a.body ?? <span className="italic text-muted-foreground">No ad copy</span>}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border bg-[color:var(--color-surface)]/60 px-3 py-2 text-[10px]">
              <div>
                <div className="label-caps text-muted-foreground">Days Run</div>
                <div className="num text-sm font-bold text-[color:var(--color-primary)]">{a._days}</div>
              </div>
              <div>
                <div className="label-caps text-muted-foreground">Start</div>
                <div className="num">{fmt(a.start_date)}</div>
              </div>
              <div>
                <div className="label-caps text-muted-foreground">End</div>
                <div className="num">{a.is_active ? "—" : fmt(a.end_date)}</div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {ads.length === 0 && (
        <div className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No ads match your filter.
        </div>
      )}
    </AppShell>
  );
}
