import { createServerFn } from "@tanstack/react-start";

const APIFY_BASE = "https://api.apify.com/v2";

function actorPath(actorId: string) {
  return actorId.replace("/", "~");
}

async function getSetting(admin: any, key: string, fallback: string): Promise<string> {
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? fallback;
}

function inferMediaType(raw: any): string {
  const snap = raw?.snapshot ?? {};
  if (Array.isArray(raw?.cards) && raw.cards.length > 1) return "Carousel";
  if (Array.isArray(snap?.cards) && snap.cards.length > 1) return "Carousel";
  if (raw?.video || raw?.video_url || snap?.video || Array.isArray(snap?.videos) && snap.videos.length) return "Video";
  if (Array.isArray(snap?.images) && snap.images.length > 1) return "Carousel";
  if (raw?.image || snap?.image || Array.isArray(snap?.images)) return "Image";
  return "Unknown";
}

function inferCta(raw: any): string | null {
  const snap = raw?.snapshot ?? {};
  const t = raw?.cta_type ?? raw?.call_to_action?.type ?? snap?.cta_type ?? snap?.cta_text;
  if (!t) return null;
  return String(t).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferSnapshotUrl(raw: any): string | null {
  const snap = raw?.snapshot ?? {};
  if (raw?.image) return raw.image;
  if (typeof snap?.image === "string") return snap.image;
  if (snap?.image?.original_image_url) return snap.image.original_image_url;
  if (Array.isArray(snap?.images) && snap.images[0]) {
    const img = snap.images[0];
    return typeof img === "string" ? img : img?.original_image_url ?? img?.resized_image_url ?? null;
  }
  if (Array.isArray(snap?.cards) && snap.cards[0]?.original_image_url) return snap.cards[0].original_image_url;
  return null;
}

function toIso(v: any): string | null {
  if (!v) return null;
  if (typeof v === "number") return new Date(v * 1000).toISOString();
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 1_000_000_000 && n < 10_000_000_000) return new Date(n * 1000).toISOString();
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function normalizeAd(brand: string, raw: any) {
  const id = String(raw.id ?? raw.ad_archive_id ?? raw.adArchiveID ?? raw.adArchiveId ?? "");
  if (!id) return null;
  const platforms: string[] = Array.isArray(raw.publisher_platform)
    ? raw.publisher_platform
    : Array.isArray(raw.publisher_platforms)
    ? raw.publisher_platforms
    : [];
  const start = toIso(raw.start_date ?? raw.startDate ?? raw.snapshot?.start_date);
  const end = toIso(raw.end_date ?? raw.endDate ?? raw.snapshot?.end_date);
  const isActive =
    typeof raw.is_active === "boolean"
      ? raw.is_active
      : end
      ? new Date(end).getTime() > Date.now()
      : true;
  return {
    ad_archive_id: id,
    brand,
    advertiser_name: raw.page_name ?? raw.advertiser_name ?? brand,
    page_name: raw.page_name ?? null,
    page_id: raw.page_id ? String(raw.page_id) : null,
    platforms: platforms.map((p) => String(p).toUpperCase()),
    media_type: inferMediaType(raw),
    language: raw.language ?? raw.locale ?? raw.snapshot?.language ?? null,
    cta: inferCta(raw),
    creative_text: raw.body ?? raw.ad_creative_body ?? raw.snapshot?.body?.text ?? raw.snapshot?.body ?? null,
    headline: raw.title ?? raw.headline ?? raw.snapshot?.title ?? null,
    description: raw.link_description ?? raw.description ?? raw.snapshot?.link_description ?? null,
    snapshot_url: inferSnapshotUrl(raw),
    status: isActive ? "ACTIVE" : "ENDED",
    start_date: start,
    end_date: end,
    raw,
    fetched_at: new Date().toISOString(),
  };
}

export type RefreshResult = {
  ok: boolean;
  fetched: number;
  inserted: number;
  updated: number;
  brand: string;
};

export const refreshMetaAds = createServerFn({ method: "POST" })
  .inputValidator((d: { brand: string; count?: number }) => ({
    brand: String(d.brand || "").trim(),
    count: Math.max(10, Math.min(200, Number(d.count) || 50)),
  }))
  .handler(async ({ data }): Promise<RefreshResult> => {
    const token = process.env.APIFY_TOKEN;
    if (!token) throw new Error("APIFY_TOKEN not configured");
    if (!data.brand) throw new Error("Brand is required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actorId = await getSetting(supabaseAdmin, "apify_actor_id", "curious_coder/facebook-ads-library-scraper");
    const country = await getSetting(supabaseAdmin, "default_country", "IN");

    const params = new URLSearchParams({
      active_status: "all",
      ad_type: "all",
      country,
      q: data.brand,
      search_type: "keyword_unordered",
      media_type: "all",
    });
    const fbUrl = `https://www.facebook.com/ads/library/?${params.toString()}`;

    const url = `${APIFY_BASE}/acts/${actorPath(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(
      token,
    )}&timeout=240`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [{ url: fbUrl }],
        count: data.count,
        "scrapeAdDetails": false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Apify error ${res.status}: ${text.slice(0, 400)}`);
    }
    const items = (await res.json()) as any[];
    const rows = (items ?? []).map((r) => normalizeAd(data.brand, r)).filter(Boolean) as any[];

    let inserted = 0;
    let updated = 0;
    if (rows.length > 0) {
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const { data: existing } = await supabaseAdmin
          .from("meta_ads")
          .select("ad_archive_id")
          .in(
            "ad_archive_id",
            slice.map((r) => r.ad_archive_id),
          );
        const existingSet = new Set((existing ?? []).map((e: any) => e.ad_archive_id));
        for (const r of slice) {
          if (existingSet.has(r.ad_archive_id)) updated++;
          else inserted++;
        }
        const { error } = await supabaseAdmin
          .from("meta_ads")
          .upsert(slice, { onConflict: "ad_archive_id" });
        if (error) throw new Error(`DB upsert failed: ${error.message}`);
      }
    }

    return { ok: true, fetched: rows.length, inserted, updated, brand: data.brand };
  });

export type AdRow = {
  id: string;
  ad_archive_id: string;
  brand: string | null;
  advertiser_name: string | null;
  page_name: string | null;
  platforms: string[];
  media_type: string | null;
  language: string | null;
  cta: string | null;
  creative_text: string | null;
  headline: string | null;
  snapshot_url: string | null;
  status: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
};

export const listMetaAds = createServerFn({ method: "GET" })
  .inputValidator(
    (
      d:
        | {
            page?: number;
            pageSize?: number;
            brand?: string | null;
            platform?: string | null;
            mediaType?: string | null;
            cta?: string | null;
            language?: string | null;
            status?: string | null;
            search?: string | null;
          }
        | undefined,
    ) => ({
      page: Math.max(1, Number(d?.page) || 1),
      pageSize: Math.max(10, Math.min(100, Number(d?.pageSize) || 25)),
      brand: d?.brand || null,
      platform: d?.platform || null,
      mediaType: d?.mediaType || null,
      cta: d?.cta || null,
      language: d?.language || null,
      status: d?.status || null,
      search: d?.search || null,
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ rows: AdRow[]; total: number; page: number; pageSize: number }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let q = supabaseAdmin
        .from("meta_ads")
        .select(
          "id, ad_archive_id, brand, advertiser_name, page_name, platforms, media_type, language, cta, creative_text, headline, snapshot_url, status, category, start_date, end_date",
          { count: "exact" },
        );
      if (data.brand) q = q.eq("brand", data.brand);
      if (data.mediaType) q = q.eq("media_type", data.mediaType);
      if (data.cta) q = q.eq("cta", data.cta);
      if (data.language) q = q.eq("language", data.language);
      if (data.status) q = q.eq("status", data.status);
      if (data.platform) q = q.contains("platforms", [data.platform]);
      if (data.search)
        q = q.or(
          `creative_text.ilike.%${data.search}%,headline.ilike.%${data.search}%,advertiser_name.ilike.%${data.search}%`,
        );
      q = q.order("start_date", { ascending: false, nullsFirst: false });
      const from = (data.page - 1) * data.pageSize;
      q = q.range(from, from + data.pageSize - 1);
      const { data: rows, count, error } = await q;
      if (error) throw new Error(error.message);
      return {
        rows: (rows ?? []) as AdRow[],
        total: count ?? 0,
        page: data.page,
        pageSize: data.pageSize,
      };
    },
  );

export type Analytics = {
  totalAds: number;
  activeAds: number;
  newToday: number;
  platforms: Record<string, number>;
  mediaTypes: Record<string, number>;
  languages: Record<string, number>;
  ctas: Record<string, number>;
  categories: Record<string, number>;
  daily: Array<{ date: string; count: number }>;
  weekly: Array<{ week: string; count: number }>;
  monthly: Array<{ month: string; count: number }>;
  rolling30: number;
  topBrands: Array<{ brand: string; total: number; active: number; new_week: number }>;
  brands: string[];
  unclassified: number;
};

export const getMetaAnalytics = createServerFn({ method: "GET" })
  .inputValidator((d: { brand?: string | null } | undefined) => ({ brand: d?.brand || null }))
  .handler(async ({ data }): Promise<Analytics> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("meta_ads")
      .select(
        "brand, platforms, media_type, language, cta, category, status, start_date",
      );
    if (data.brand) q = q.eq("brand", data.brand);
    const { data: rows, error } = await q.limit(50000);
    if (error) throw new Error(error.message);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const a: Analytics = {
      totalAds: rows?.length ?? 0,
      activeAds: 0,
      newToday: 0,
      platforms: { FACEBOOK: 0, INSTAGRAM: 0, MESSENGER: 0, AUDIENCE_NETWORK: 0 },
      mediaTypes: {},
      languages: {},
      ctas: {},
      categories: {},
      daily: [],
      weekly: [],
      monthly: [],
      rolling30: 0,
      topBrands: [],
      brands: [],
      unclassified: 0,
    };

    const dailyMap = new Map<string, number>();
    const weeklyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    const brandMap = new Map<string, { total: number; active: number; new_week: number }>();
    const brandSet = new Set<string>();

    for (const r of (rows ?? []) as any[]) {
      if (r.status === "ACTIVE") a.activeAds++;
      if (r.start_date && r.start_date >= startOfToday) a.newToday++;
      if (r.start_date && r.start_date >= thirtyAgo) a.rolling30++;
      for (const p of r.platforms ?? []) {
        a.platforms[p] = (a.platforms[p] ?? 0) + 1;
      }
      const mt = r.media_type ?? "Unknown";
      a.mediaTypes[mt] = (a.mediaTypes[mt] ?? 0) + 1;
      if (r.language) a.languages[r.language] = (a.languages[r.language] ?? 0) + 1;
      const cta = r.cta ?? "Other";
      a.ctas[cta] = (a.ctas[cta] ?? 0) + 1;
      if (!r.category) a.unclassified++;
      const cat = r.category ?? "Unclassified";
      a.categories[cat] = (a.categories[cat] ?? 0) + 1;

      if (r.start_date) {
        const d = new Date(r.start_date);
        const day = d.toISOString().slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
        const ws = new Date(d);
        ws.setDate(d.getDate() - d.getDay());
        const wk = ws.toISOString().slice(0, 10);
        weeklyMap.set(wk, (weeklyMap.get(wk) ?? 0) + 1);
        monthlyMap.set(day.slice(0, 7), (monthlyMap.get(day.slice(0, 7)) ?? 0) + 1);
      }

      if (r.brand) {
        brandSet.add(r.brand);
        const b = brandMap.get(r.brand) ?? { total: 0, active: 0, new_week: 0 };
        b.total++;
        if (r.status === "ACTIVE") b.active++;
        if (r.start_date && r.start_date >= weekAgo) b.new_week++;
        brandMap.set(r.brand, b);
      }
    }

    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }
    a.daily = days.map((d) => ({ date: d, count: dailyMap.get(d) ?? 0 }));

    a.weekly = Array.from(weeklyMap.entries())
      .sort(([x], [y]) => (x < y ? -1 : 1))
      .slice(-12)
      .map(([week, count]) => ({ week, count }));
    a.monthly = Array.from(monthlyMap.entries())
      .sort(([x], [y]) => (x < y ? -1 : 1))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));

    a.topBrands = Array.from(brandMap.entries())
      .map(([brand, v]) => ({ brand, ...v }))
      .sort((x, y) => y.total - x.total)
      .slice(0, 10);
    a.brands = Array.from(brandSet).sort();

    return a;
  });

export const classifyPending = createServerFn({ method: "POST" })
  .inputValidator((d: { limit?: number } | undefined) => ({
    limit: Math.max(1, Math.min(50, Number(d?.limit) || 20)),
  }))
  .handler(async ({ data }): Promise<{ classified: number }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { classified: 0 };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("meta_ads")
      .select("id, brand, creative_text, headline")
      .is("category", null)
      .not("creative_text", "is", null)
      .limit(data.limit);
    if (!rows || rows.length === 0) return { classified: 0 };

    const CATEGORIES = [
      "Fashion",
      "Beauty",
      "Electronics",
      "Grocery",
      "Home",
      "Finance",
      "Travel",
      "Education",
      "Healthcare",
      "Food Delivery",
      "Others",
    ];
    let count = 0;
    for (const r of rows as any[]) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You classify Indian e-commerce Meta ads into exactly ONE category from this list: ${CATEGORIES.join(", ")}. Respond with only the category name.`,
              },
              {
                role: "user",
                content: `Brand: ${r.brand ?? ""}\nHeadline: ${r.headline ?? ""}\nAd copy: ${(r.creative_text ?? "").slice(0, 400)}`,
              },
            ],
            max_tokens: 12,
            temperature: 0,
          }),
        });
        if (!res.ok) continue;
        const j = (await res.json()) as any;
        const raw = String(j?.choices?.[0]?.message?.content ?? "").trim();
        const match = CATEGORIES.find((c) => raw.toLowerCase().includes(c.toLowerCase())) ?? "Others";
        await supabaseAdmin.from("meta_ads").update({ category: match }).eq("id", r.id);
        count++;
      } catch {
        // skip
      }
    }
    return { classified: count };
  });

export const getAppSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("key, value");
  const map: Record<string, string> = {};
  for (const r of (data ?? []) as any[]) map[r.key] = r.value ?? "";
  return {
    actor_id: map["apify_actor_id"] ?? "curious_coder/facebook-ads-library-scraper",
    country: map["default_country"] ?? "IN",
    has_apify_token: !!process.env.APIFY_TOKEN,
  };
});

export const saveAppSettings = createServerFn({ method: "POST" })
  .inputValidator((d: { actor_id?: string; country?: string }) => ({
    actor_id: (d.actor_id ?? "").trim(),
    country: (d.country ?? "").trim().toUpperCase(),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows: any[] = [];
    if (data.actor_id) rows.push({ key: "apify_actor_id", value: data.actor_id });
    if (data.country) rows.push({ key: "default_country", value: data.country });
    if (rows.length > 0) {
      const { error } = await supabaseAdmin
        .from("app_settings")
        .upsert(rows, { onConflict: "key" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
