import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { getAppSettings, saveAppSettings } from "@/lib/meta-ads.functions";
import { CheckCircle2, ShieldAlert, Save } from "lucide-react";

export const Route = createFileRoute("/settings/meta-ads")({
  head: () => ({
    meta: [
      { title: "Meta Ads Settings — IndustryIntel" },
      { name: "description", content: "Configure Apify Actor and default country for Meta Ad Library scraping." },
    ],
  }),
  component: MetaAdsSettings,
});

function MetaAdsSettings() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["app-settings"], queryFn: () => getAppSettings() });
  const saveFn = useServerFn(saveAppSettings);
  const [actor, setActor] = useState("");
  const [country, setCountry] = useState("IN");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (settings.data) {
      setActor(settings.data.actor_id);
      setCountry(settings.data.country);
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => saveFn({ data: { actor_id: actor, country } }),
    onSuccess: () => {
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });

  return (
    <AppShell>
      <div className="max-w-2xl space-y-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Meta Ads Settings</h1>
          <div className="text-xs text-muted-foreground">
            Configure the Apify actor and default country for Meta Ad Library scraping.
          </div>
        </div>

        <Panel title="Apify Configuration" accent="primary">
          <div className="space-y-4">
            <div>
              <label className="label-caps mb-1 block">APIFY Token</label>
              <div className="flex items-center gap-2 rounded-sm border border-border bg-[color:var(--color-surface)] px-3 py-2 text-xs">
                {settings.data?.has_apify_token ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--color-teal)]" />
                    <span>Token is configured and stored securely on the server.</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 text-[color:var(--color-risk)]" />
                    <span>APIFY_TOKEN is not set. Contact the app owner to configure it.</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                The token is never exposed to the browser. It lives only in server-side environment variables.
              </p>
            </div>

            <div>
              <label className="label-caps mb-1 block">Actor ID</label>
              <input
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                placeholder="curious_coder/facebook-ads-library-scraper"
                className="w-full rounded-sm border border-border bg-[color:var(--color-surface)] px-3 py-2 text-xs font-mono"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Apify actor slug in the form <code>owner/name</code>. Any Meta Ad Library scraper on Apify works.
              </p>
            </div>

            <div>
              <label className="label-caps mb-1 block">Default Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
                placeholder="IN"
                className="w-24 rounded-sm border border-border bg-[color:var(--color-surface)] px-3 py-2 text-xs font-mono uppercase"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Two-letter ISO country code (e.g. IN, US, GB).</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[color:var(--color-primary)]/20 px-3 py-1.5 text-xs font-semibold text-[color:var(--color-primary)] ring-1 ring-[color:var(--color-primary)]/60 hover:bg-[color:var(--color-primary)]/30 disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving..." : "Save Settings"}
              </button>
              {savedAt && Date.now() - savedAt < 4000 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--color-teal)]">
                  <CheckCircle2 className="h-3 w-3" /> Saved
                </span>
              )}
              {save.isError && (
                <span className="text-[11px] text-[color:var(--color-risk)]">
                  {String((save.error as any)?.message ?? save.error)}
                </span>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
