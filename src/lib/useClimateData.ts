import { useQueries } from "@tanstack/react-query";
import { type MonthKey } from "./data";
import {
  METRO_CITIES, type MetroCity, CY_YEAR, LY_YEAR,
  fetchDailyClimate, climateSeries, metroMonthlySummary,
  type ClimateDayPoint,
} from "./climate";

export interface MetroSummaryRow {
  city: MetroCity;
  avgTempCY: number;
  avgTempLY: number;
  totalRainCY: number;
  totalRainLY: number;
  maxRainCY: number;
}

interface UseClimateResult {
  /** Merged daily series for the active city (CY 2025 vs LY 2024). */
  series: ClimateDayPoint[];
  /** Per-city monthly aggregates for the metro table. */
  summary: MetroSummaryRow[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  source: "live" | "fallback" | "mixed";
}

const avg = (xs: number[]) => xs.length ? xs.reduce((a,b)=>a+b,0) / xs.length : 0;
const sum = (xs: number[]) => xs.reduce((a,b)=>a+b,0);
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Fetch real Open-Meteo data for all 8 metros × CY/LY for the given month.
 *  Falls back to the climatological synthetic series for any city/year that errors. */
export function useClimateData(month: MonthKey, activeCity: MetroCity): UseClimateResult {
  const queries = useQueries({
    queries: METRO_CITIES.flatMap(city => [LY_YEAR, CY_YEAR].map(year => ({
      queryKey: ["climate", city, month, year],
      queryFn: () => fetchDailyClimate(city, month, year),
      staleTime: 1000 * 60 * 60 * 24, // historical data — cache 1 day
      gcTime:    1000 * 60 * 60 * 24,
      retry: 1,
    }))),
  });

  const isLoading = queries.some(q => q.isLoading);
  const isFetching = queries.some(q => q.isFetching);
  const isError = queries.every(q => q.isError);

  // Index results: [cityIndex*2 + yearIndex] (LY first, CY second).
  const get = (cityIdx: number, yearIdx: 0 | 1) => queries[cityIdx * 2 + yearIdx];

  let liveCount = 0; let fallbackCount = 0;

  const summary: MetroSummaryRow[] = METRO_CITIES.map((city, ci) => {
    const ly = get(ci, 0);
    const cy = get(ci, 1);
    const fallback = metroMonthlySummary(month).find(s => s.city === city)!;

    const lyOk = ly.data && ly.data.length > 0;
    const cyOk = cy.data && cy.data.length > 0;
    if (lyOk && cyOk) liveCount++; else fallbackCount++;

    const tempsCY = cyOk ? cy.data!.map(d => d.temp).filter((v): v is number => v != null) : [];
    const tempsLY = lyOk ? ly.data!.map(d => d.temp).filter((v): v is number => v != null) : [];
    const rainsCY = cyOk ? cy.data!.map(d => d.rain ?? 0) : [];
    const rainsLY = lyOk ? ly.data!.map(d => d.rain ?? 0) : [];

    return {
      city,
      avgTempCY: tempsCY.length ? round1(avg(tempsCY)) : fallback.avgTempCY,
      avgTempLY: tempsLY.length ? round1(avg(tempsLY)) : fallback.avgTempLY,
      totalRainCY: rainsCY.length ? Math.round(sum(rainsCY)) : fallback.totalRainCY,
      totalRainLY: rainsLY.length ? Math.round(sum(rainsLY)) : fallback.totalRainLY,
      maxRainCY: rainsCY.length ? round1(Math.max(...rainsCY, 0)) : fallback.maxRainCY,
    };
  });

  // Merge the active city's CY+LY daily series.
  const cityIdx = METRO_CITIES.indexOf(activeCity);
  const lyQ = get(cityIdx, 0);
  const cyQ = get(cityIdx, 1);
  const lyData = lyQ.data ?? [];
  const cyData = cyQ.data ?? [];

  let series: ClimateDayPoint[];
  if (lyData.length || cyData.length) {
    const maxDay = Math.max(
      lyData.length ? Math.max(...lyData.map(d => d.day)) : 0,
      cyData.length ? Math.max(...cyData.map(d => d.day)) : 0,
    );
    const lyMap = new Map(lyData.map(d => [d.day, d]));
    const cyMap = new Map(cyData.map(d => [d.day, d]));
    const fallback = climateSeries(activeCity, month);
    series = Array.from({ length: maxDay }, (_, i) => {
      const day = i + 1;
      const ly = lyMap.get(day);
      const cy = cyMap.get(day);
      const fb = fallback[i];
      return {
        day,
        tempCY: cy?.temp != null ? round1(cy.temp) : fb?.tempCY ?? 0,
        tempLY: ly?.temp != null ? round1(ly.temp) : fb?.tempLY ?? 0,
        rainCY: cy?.rain != null ? round1(cy.rain) : fb?.rainCY ?? 0,
        rainLY: ly?.rain != null ? round1(ly.rain) : fb?.rainLY ?? 0,
      };
    });
  } else {
    series = climateSeries(activeCity, month);
  }

  const source: UseClimateResult["source"] =
    fallbackCount === 0 ? "live" : liveCount === 0 ? "fallback" : "mixed";

  return { series, summary, isLoading, isFetching, isError, source };
}
