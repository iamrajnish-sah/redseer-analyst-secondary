import { MONTHS, type MonthKey } from "./data";

export const METRO_CITIES = [
  "Delhi","Mumbai","Bengaluru","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad",
] as const;
export type MetroCity = (typeof METRO_CITIES)[number];

/** Climatological monthly averages: [avgTempC, totalRainfallMm] per city × month. */
type MonthlyClim = { temp: number; rain: number };
const CLIM: Record<MetroCity, Record<MonthKey, MonthlyClim>> = {
  Delhi:     { Jan:{temp:14,rain:22}, Feb:{temp:17,rain:18}, Mar:{temp:22,rain:15}, Apr:{temp:29,rain:15}, May:{temp:34,rain:25}, Jun:{temp:34,rain:75},  Jul:{temp:31,rain:210}, Aug:{temp:30,rain:235}, Sep:{temp:29,rain:120}, Oct:{temp:26,rain:15},  Nov:{temp:20,rain:5},   Dec:{temp:15,rain:8} },
  Mumbai:    { Jan:{temp:24,rain:1},  Feb:{temp:25,rain:0},  Mar:{temp:27,rain:0},  Apr:{temp:29,rain:1},  May:{temp:30,rain:15}, Jun:{temp:29,rain:520}, Jul:{temp:28,rain:700}, Aug:{temp:27,rain:580}, Sep:{temp:28,rain:360}, Oct:{temp:30,rain:65},  Nov:{temp:28,rain:20},  Dec:{temp:26,rain:5} },
  Bengaluru: { Jan:{temp:21,rain:3},  Feb:{temp:24,rain:8},  Mar:{temp:26,rain:12}, Apr:{temp:27,rain:45}, May:{temp:26,rain:120},Jun:{temp:24,rain:85},  Jul:{temp:23,rain:110}, Aug:{temp:23,rain:135}, Sep:{temp:23,rain:195}, Oct:{temp:23,rain:180}, Nov:{temp:22,rain:55},  Dec:{temp:21,rain:15} },
  Hyderabad: { Jan:{temp:22,rain:5},  Feb:{temp:25,rain:10}, Mar:{temp:28,rain:15}, Apr:{temp:31,rain:25}, May:{temp:32,rain:40}, Jun:{temp:28,rain:110}, Jul:{temp:26,rain:170}, Aug:{temp:25,rain:175}, Sep:{temp:26,rain:160}, Oct:{temp:25,rain:100}, Nov:{temp:23,rain:25},  Dec:{temp:21,rain:8} },
  Chennai:   { Jan:{temp:25,rain:25}, Feb:{temp:26,rain:10}, Mar:{temp:28,rain:15}, Apr:{temp:30,rain:15}, May:{temp:32,rain:40}, Jun:{temp:32,rain:55},  Jul:{temp:31,rain:95},  Aug:{temp:30,rain:130}, Sep:{temp:29,rain:130}, Oct:{temp:28,rain:280}, Nov:{temp:26,rain:360}, Dec:{temp:25,rain:180} },
  Kolkata:   { Jan:{temp:19,rain:15}, Feb:{temp:22,rain:25}, Mar:{temp:27,rain:35}, Apr:{temp:30,rain:55}, May:{temp:31,rain:120},Jun:{temp:30,rain:300}, Jul:{temp:29,rain:395}, Aug:{temp:29,rain:375}, Sep:{temp:29,rain:320}, Oct:{temp:27,rain:155}, Nov:{temp:23,rain:15},  Dec:{temp:19,rain:8} },
  Pune:      { Jan:{temp:22,rain:2},  Feb:{temp:24,rain:2},  Mar:{temp:28,rain:5},  Apr:{temp:30,rain:15}, May:{temp:30,rain:45}, Jun:{temp:27,rain:175}, Jul:{temp:25,rain:195}, Aug:{temp:24,rain:130}, Sep:{temp:25,rain:130}, Oct:{temp:25,rain:100}, Nov:{temp:23,rain:35},  Dec:{temp:22,rain:8} },
  Ahmedabad: { Jan:{temp:21,rain:4},  Feb:{temp:24,rain:2},  Mar:{temp:28,rain:2},  Apr:{temp:32,rain:2},  May:{temp:34,rain:8},  Jun:{temp:33,rain:100}, Jul:{temp:29,rain:280}, Aug:{temp:28,rain:240}, Sep:{temp:29,rain:130}, Oct:{temp:28,rain:15},  Nov:{temp:25,rain:8},   Dec:{temp:22,rain:4} },
};

const DAYS_IN_MONTH: Record<MonthKey, number> = {
  Jan:31,Feb:28,Mar:31,Apr:30,May:31,Jun:30,Jul:31,Aug:31,Sep:30,Oct:31,Nov:30,Dec:31,
};

function hash(s: string) {
  let h = 2166136261;
  for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export interface ClimateDayPoint {
  day: number;
  tempCY: number;
  tempLY: number;
  rainCY: number;
  rainLY: number;
}

/** Deterministic 30-day daily series for (city, month) — CY=2025, LY=2024.
 *  Temperature: avg ± 3°C with a smooth sine + small jitter.
 *  Rainfall: monthly total distributed across days with a few peak days. */
export function climateSeries(city: MetroCity, month: MonthKey): ClimateDayPoint[] {
  const base = CLIM[city][month];
  const days = Math.min(30, DAYS_IN_MONTH[month]);
  // Temperature trend direction varies by month (warming half vs cooling half)
  const monthIdx = MONTHS.indexOf(month);
  const warming = monthIdx >= 1 && monthIdx <= 4; // Feb-May warming
  const cooling = monthIdx >= 8 && monthIdx <= 11; // Sep-Dec cooling
  const drift = warming ? 2.5 : cooling ? -2.5 : 0;

  // Distribute rainfall: split month into ~5 wet windows
  const distribute = (total: number, seed: string) => {
    const arr = new Array(days).fill(0);
    const wetDays = Math.max(2, Math.round((total > 50 ? 14 : total > 10 ? 7 : 3)));
    let remaining = total;
    for (let i = 0; i < wetDays; i++) {
      const r = hash(seed + i);
      const d = Math.floor(r * days);
      const share = (0.4 + hash(seed + "s" + i) * 1.2) / wetDays;
      const amt = total * share;
      arr[d] += amt;
      remaining -= amt;
    }
    // Spread small residual
    if (remaining > 0) {
      for (let i = 0; i < days; i++) arr[i] += remaining / days;
    }
    return arr.map(v => Math.max(0, Math.round(v * 10) / 10));
  };

  const rainCY = distribute(base.rain * (0.9 + hash(city+month+"cy")*0.3), city+month+"cyr");
  const rainLY = distribute(base.rain * (0.85 + hash(city+month+"ly")*0.3), city+month+"lyr");

  const out: ClimateDayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const t = i / (days - 1);
    const wave = Math.sin(t * Math.PI) * 2; // mid-month peak deviation
    const jitterCY = (hash(city+month+"tcy"+i) - 0.5) * 2.4;
    const jitterLY = (hash(city+month+"tly"+i) - 0.5) * 2.4;
    const tempCY = base.temp + drift * t + wave * 0.4 + jitterCY;
    const tempLY = base.temp + drift * t + wave * 0.4 + jitterLY - 0.3;
    out.push({
      day: i + 1,
      tempCY: Math.round(tempCY * 10) / 10,
      tempLY: Math.round(tempLY * 10) / 10,
      rainCY: rainCY[i],
      rainLY: rainLY[i],
    });
  }
  return out;
}

/** Monthly aggregates per city for the metro table. */
export function metroMonthlySummary(month: MonthKey) {
  return METRO_CITIES.map(city => {
    const series = climateSeries(city, month);
    const avgTempCY = series.reduce((a,b)=>a+b.tempCY,0) / series.length;
    const avgTempLY = series.reduce((a,b)=>a+b.tempLY,0) / series.length;
    const totalRainCY = series.reduce((a,b)=>a+b.rainCY,0);
    const totalRainLY = series.reduce((a,b)=>a+b.rainLY,0);
    const maxRainCY = Math.max(...series.map(s=>s.rainCY));
    return {
      city,
      avgTempCY: Math.round(avgTempCY * 10)/10,
      avgTempLY: Math.round(avgTempLY * 10)/10,
      totalRainCY: Math.round(totalRainCY),
      totalRainLY: Math.round(totalRainLY),
      maxRainCY: Math.round(maxRainCY * 10)/10,
    };
  });
}
