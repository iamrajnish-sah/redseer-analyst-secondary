export const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
] as const;
export type MonthKey = (typeof MONTHS)[number];

export const MONTH_FULL: Record<MonthKey, string> = {
  Jan:"January", Feb:"February", Mar:"March", Apr:"April", May:"May", Jun:"June",
  Jul:"July", Aug:"August", Sep:"September", Oct:"October", Nov:"November", Dec:"December",
};

/** Festive density 0-10 used for the ribbon glow + heatmap */
export const FESTIVE_DENSITY: Record<MonthKey, number> = {
  Jan: 6, Feb: 3, Mar: 5, Apr: 4, May: 3, Jun: 2,
  Jul: 3, Aug: 6, Sep: 5, Oct: 10, Nov: 8, Dec: 5,
};

export const SEASON_PROFILE: Record<MonthKey, string> = {
  Jan: "Peak Winter / Cool Dry",
  Feb: "Late Winter / Transition",
  Mar: "Early Summer / Warming",
  Apr: "Hot & Dry",
  May: "Peak Summer / Heatwave Risk",
  Jun: "Monsoon Onset",
  Jul: "Active Monsoon",
  Aug: "Mid Monsoon / Humid",
  Sep: "Withdrawing Monsoon",
  Oct: "Post-Monsoon / Festive Cool",
  Nov: "Early Winter / AQI Spike",
  Dec: "Cold Dry / Wedding Peak",
};

export interface OverviewRow {
  month: MonthKey;
  festivalCY: number;
  festivalLY: number;
  weddingCY: number;
  weddingLY: number;
  saleEvents: number;
  weather: "Normal" | "Anomaly";
  sentiment: "Bullish" | "Flat" | "Bearish";
  confidence: number; // 1-10
}

export const OVERVIEW_BASELINE: OverviewRow[] = [
  { month:"Jan", festivalCY:5, festivalLY:5, weddingCY:11, weddingLY:9,  saleEvents:4, weather:"Normal",  sentiment:"Flat",    confidence:7 },
  { month:"Feb", festivalCY:3, festivalLY:4, weddingCY:14, weddingLY:13, saleEvents:3, weather:"Normal",  sentiment:"Flat",    confidence:6 },
  { month:"Mar", festivalCY:6, festivalLY:5, weddingCY:6,  weddingLY:8,  saleEvents:5, weather:"Anomaly", sentiment:"Bullish", confidence:7 },
  { month:"Apr", festivalCY:4, festivalLY:4, weddingCY:9,  weddingLY:10, saleEvents:3, weather:"Anomaly", sentiment:"Flat",    confidence:6 },
  { month:"May", festivalCY:3, festivalLY:3, weddingCY:10, weddingLY:11, saleEvents:4, weather:"Anomaly", sentiment:"Flat",    confidence:6 },
  { month:"Jun", festivalCY:2, festivalLY:2, weddingCY:5,  weddingLY:6,  saleEvents:3, weather:"Normal",  sentiment:"Bearish", confidence:5 },
  { month:"Jul", festivalCY:3, festivalLY:3, weddingCY:2,  weddingLY:3,  saleEvents:4, weather:"Anomaly", sentiment:"Bearish", confidence:5 },
  { month:"Aug", festivalCY:6, festivalLY:5, weddingCY:0,  weddingLY:0,  saleEvents:5, weather:"Normal",  sentiment:"Flat",    confidence:6 },
  { month:"Sep", festivalCY:5, festivalLY:6, weddingCY:0,  weddingLY:0,  saleEvents:4, weather:"Normal",  sentiment:"Flat",    confidence:7 },
  { month:"Oct", festivalCY:11,festivalLY:10,weddingCY:7,  weddingLY:5,  saleEvents:9, weather:"Normal",  sentiment:"Bullish", confidence:9 },
  { month:"Nov", festivalCY:8, festivalLY:9, weddingCY:13, weddingLY:11, saleEvents:7, weather:"Anomaly", sentiment:"Bullish", confidence:8 },
  { month:"Dec", festivalCY:5, festivalLY:4, weddingCY:9,  weddingLY:10, saleEvents:6, weather:"Normal",  sentiment:"Flat",    confidence:7 },
];

export interface Festival {
  name: string;
  cy: string;     // 2025
  ly: string;     // 2024
  drift: number;  // +late / -early
  impact: "High" | "Medium" | "Low";
}

export const FESTIVALS: Record<MonthKey, Festival[]> = {
  Jan: [
    { name:"New Year",      cy:"01 Jan", ly:"01 Jan", drift:0,  impact:"Medium" },
    { name:"Makar Sankranti",cy:"14 Jan",ly:"15 Jan",drift:-1, impact:"High" },
    { name:"Pongal",        cy:"14 Jan", ly:"15 Jan",drift:-1, impact:"High" },
    { name:"Republic Day",  cy:"26 Jan", ly:"26 Jan",drift:0,  impact:"Medium" },
  ],
  Feb: [
    { name:"Vasant Panchami",cy:"02 Feb",ly:"14 Feb",drift:-12,impact:"Low" },
    { name:"Maha Shivratri", cy:"26 Feb",ly:"08 Mar",drift:-10,impact:"Medium" },
    { name:"Valentine's Day",cy:"14 Feb",ly:"14 Feb",drift:0,  impact:"High" },
  ],
  Mar: [
    { name:"Holi",           cy:"14 Mar",ly:"25 Mar",drift:-11,impact:"High" },
    { name:"Ramadan Begins", cy:"01 Mar",ly:"11 Mar",drift:-10,impact:"High" },
    { name:"Ugadi/Gudi Padwa",cy:"30 Mar",ly:"09 Apr",drift:-10,impact:"Medium" },
  ],
  Apr: [
    { name:"Eid-ul-Fitr",    cy:"31 Mar",ly:"11 Apr",drift:-11,impact:"High" },
    { name:"Ram Navami",     cy:"06 Apr",ly:"17 Apr",drift:-11,impact:"Medium" },
    { name:"Mahavir Jayanti",cy:"10 Apr",ly:"21 Apr",drift:-11,impact:"Low" },
    { name:"Baisakhi",       cy:"13 Apr",ly:"13 Apr",drift:0,  impact:"Medium" },
    { name:"Good Friday",    cy:"18 Apr",ly:"29 Mar",drift:20, impact:"Low" },
  ],
  May: [
    { name:"Akshaya Tritiya",cy:"30 Apr",ly:"10 May",drift:-10,impact:"High" },
    { name:"Buddha Purnima", cy:"12 May",ly:"23 May",drift:-11,impact:"Low" },
    { name:"Mother's Day",   cy:"11 May",ly:"12 May",drift:-1, impact:"Medium" },
  ],
  Jun: [
    { name:"Eid-ul-Adha",    cy:"07 Jun",ly:"17 Jun",drift:-10,impact:"Medium" },
    { name:"Father's Day",   cy:"15 Jun",ly:"16 Jun",drift:-1, impact:"Medium" },
  ],
  Jul: [
    { name:"Rath Yatra",     cy:"27 Jun",ly:"07 Jul",drift:-10,impact:"Low" },
    { name:"Muharram",       cy:"06 Jul",ly:"17 Jul",drift:-11,impact:"Low" },
    { name:"Guru Purnima",   cy:"10 Jul",ly:"21 Jul",drift:-11,impact:"Low" },
  ],
  Aug: [
    { name:"Raksha Bandhan", cy:"09 Aug",ly:"19 Aug",drift:-10,impact:"High" },
    { name:"Independence Day",cy:"15 Aug",ly:"15 Aug",drift:0, impact:"Medium" },
    { name:"Janmashtami",    cy:"16 Aug",ly:"26 Aug",drift:-10,impact:"Medium" },
    { name:"Onam",           cy:"05 Sep",ly:"15 Sep",drift:-10,impact:"High" },
  ],
  Sep: [
    { name:"Ganesh Chaturthi",cy:"27 Aug",ly:"07 Sep",drift:-11,impact:"High" },
    { name:"Onam",           cy:"05 Sep",ly:"15 Sep",drift:-10,impact:"High" },
    { name:"Pitru Paksha",   cy:"07-21 Sep",ly:"17 Sep-02 Oct",drift:-10,impact:"High" },
  ],
  Oct: [
    { name:"Navratri Begins",cy:"22 Sep",ly:"03 Oct",drift:-11,impact:"High" },
    { name:"Durga Puja",     cy:"28 Sep-02 Oct",ly:"09-13 Oct",drift:-11,impact:"High" },
    { name:"Dussehra",       cy:"02 Oct",ly:"12 Oct",drift:-10,impact:"High" },
    { name:"Karwa Chauth",   cy:"10 Oct",ly:"20 Oct",drift:-10,impact:"High" },
    { name:"Dhanteras",      cy:"18 Oct",ly:"29 Oct",drift:-11,impact:"High" },
    { name:"Diwali",         cy:"20 Oct",ly:"31 Oct",drift:-11,impact:"High" },
    { name:"Bhai Dooj",      cy:"23 Oct",ly:"03 Nov",drift:-11,impact:"Medium" },
  ],
  Nov: [
    { name:"Chhath Puja",    cy:"28 Oct",ly:"07 Nov",drift:-10,impact:"Medium" },
    { name:"Guru Nanak Jayanti",cy:"05 Nov",ly:"15 Nov",drift:-10,impact:"Medium" },
    { name:"Children's Day", cy:"14 Nov",ly:"14 Nov",drift:0,  impact:"Low" },
    { name:"Black Friday",   cy:"28 Nov",ly:"29 Nov",drift:-1, impact:"High" },
  ],
  Dec: [
    { name:"Cyber Monday",   cy:"01 Dec",ly:"02 Dec",drift:-1, impact:"High" },
    { name:"Christmas",      cy:"25 Dec",ly:"25 Dec",drift:0,  impact:"High" },
    { name:"New Year's Eve", cy:"31 Dec",ly:"31 Dec",drift:0,  impact:"High" },
  ],
};

export interface MuhuratBlock {
  shaadi: number;
  janeu: number;
  namkaran: number;
  grihaPravesh: number;
  annaprashan: number;
  blockout?: "Shraadh / Pitru Paksha" | "Kharmas" | "Chaturmas (No Weddings)";
}

export const MUHURATS: Record<MonthKey, MuhuratBlock> = {
  Jan: { shaadi:6, janeu:2, namkaran:4, grihaPravesh:5, annaprashan:3, blockout:"Kharmas" },
  Feb: { shaadi:14, janeu:4, namkaran:6, grihaPravesh:7, annaprashan:5 },
  Mar: { shaadi:6, janeu:2, namkaran:3, grihaPravesh:4, annaprashan:2 },
  Apr: { shaadi:9, janeu:5, namkaran:6, grihaPravesh:7, annaprashan:4 },
  May: { shaadi:10,janeu:6, namkaran:7, grihaPravesh:8, annaprashan:5 },
  Jun: { shaadi:5, janeu:2, namkaran:3, grihaPravesh:3, annaprashan:2 },
  Jul: { shaadi:2, janeu:1, namkaran:1, grihaPravesh:1, annaprashan:1, blockout:"Chaturmas (No Weddings)" },
  Aug: { shaadi:0, janeu:0, namkaran:0, grihaPravesh:0, annaprashan:0, blockout:"Chaturmas (No Weddings)" },
  Sep: { shaadi:0, janeu:0, namkaran:0, grihaPravesh:0, annaprashan:0, blockout:"Shraadh / Pitru Paksha" },
  Oct: { shaadi:7, janeu:2, namkaran:3, grihaPravesh:4, annaprashan:2 },
  Nov: { shaadi:13,janeu:4, namkaran:5, grihaPravesh:6, annaprashan:4 },
  Dec: { shaadi:9, janeu:2, namkaran:3, grihaPravesh:4, annaprashan:2, blockout:"Kharmas" },
};

export interface SaleEvent { platform: string; name: string; window: string; }

export const SALE_EVENTS: Record<MonthKey, SaleEvent[]> = {
  Jan: [
    { platform:"Amazon",   name:"Republic Day Sale", window:"15-20 Jan" },
    { platform:"Flipkart", name:"Big Saving Days",    window:"16-21 Jan" },
    { platform:"Myntra",   name:"EORS Winter",        window:"19-23 Jan" },
    { platform:"Ajio",     name:"Republic Day",        window:"18-22 Jan" },
  ],
  Feb: [
    { platform:"Nykaa",    name:"Love Sale", window:"08-14 Feb" },
    { platform:"Amazon",   name:"Valentine Store", window:"05-14 Feb" },
    { platform:"Zomato",   name:"Date Night Deals", window:"12-14 Feb" },
  ],
  Mar: [
    { platform:"Amazon",   name:"Holi Store",     window:"08-14 Mar" },
    { platform:"Flipkart", name:"Holi Sale",      window:"10-15 Mar" },
    { platform:"Meesho",   name:"Holi Bash",      window:"10-14 Mar" },
    { platform:"Myntra",   name:"Holi Edit",      window:"08-14 Mar" },
    { platform:"BigBasket",name:"Holi Pantry",    window:"05-14 Mar" },
  ],
  Apr: [
    { platform:"Amazon",   name:"Summer Sale", window:"01-07 Apr" },
    { platform:"Flipkart", name:"Big Summer",  window:"05-11 Apr" },
    { platform:"Ajio",     name:"Big Bold Sale",window:"15-20 Apr" },
  ],
  May: [
    { platform:"Amazon",     name:"Akshaya Tritiya Jewellery", window:"28 Apr-02 May" },
    { platform:"Tanishq/Caratlane Online", name:"AT Gold Push", window:"25 Apr-05 May" },
    { platform:"Myntra",     name:"EORS Summer",  window:"24-30 May" },
    { platform:"Nykaa",      name:"Hot Pink Sale", window:"15-20 May" },
  ],
  Jun: [
    { platform:"Amazon",   name:"Father's Day Store", window:"08-15 Jun" },
    { platform:"Flipkart", name:"Crazy Deals Days",   window:"10-13 Jun" },
    { platform:"Zepto",    name:"Monsoon Mania",      window:"15-30 Jun" },
  ],
  Jul: [
    { platform:"Amazon",  name:"Prime Day",          window:"12-13 Jul" },
    { platform:"Flipkart",name:"GOAT Sale (counter)",window:"13-17 Jul" },
    { platform:"Myntra",  name:"EORS Monsoon",       window:"19-26 Jul" },
    { platform:"Meesho",  name:"Sawan Sale",         window:"15-21 Jul" },
  ],
  Aug: [
    { platform:"Amazon",   name:"Freedom Sale",   window:"08-12 Aug" },
    { platform:"Flipkart", name:"Independence Sale", window:"09-13 Aug" },
    { platform:"Ajio",     name:"Freedom Big Bold",  window:"08-14 Aug" },
    { platform:"Nykaa",    name:"Rakhi Edit",     window:"01-09 Aug" },
  ],
  Sep: [
    { platform:"Amazon",   name:"Pre-GIF Teaser",  window:"15-22 Sep" },
    { platform:"Flipkart", name:"BBD Early Access (Plus)", window:"21-23 Sep" },
    { platform:"Meesho",   name:"Mega Blockbuster Teaser", window:"22-25 Sep" },
  ],
  Oct: [
    { platform:"Amazon",   name:"Great Indian Festival",  window:"24 Sep-15 Oct" },
    { platform:"Flipkart", name:"Big Billion Days",       window:"23 Sep-13 Oct" },
    { platform:"Meesho",   name:"Mega Blockbuster Sale",  window:"26 Sep-08 Oct" },
    { platform:"Myntra",   name:"Big Fashion Festival",   window:"01-12 Oct" },
    { platform:"Ajio",     name:"Big Bold Sale",          window:"23 Sep-10 Oct" },
    { platform:"Nykaa",    name:"Pink Friday (Early)",    window:"15-20 Oct" },
    { platform:"Tata CLiQ",name:"Diwali Luxury",          window:"10-20 Oct" },
    { platform:"Blinkit/Zepto", name:"Diwali Pantry",     window:"14-20 Oct" },
    { platform:"Zomato",   name:"Diwali Feast",           window:"18-22 Oct" },
  ],
  Nov: [
    { platform:"Amazon",   name:"Black Friday",       window:"24-30 Nov" },
    { platform:"Flipkart", name:"BBD Encore",         window:"01-07 Nov" },
    { platform:"Nykaa",    name:"Pink Friday",        window:"24-30 Nov" },
    { platform:"Myntra",   name:"EORS Wedding Edit",  window:"15-22 Nov" },
    { platform:"Ajio",     name:"All Stars Sale",     window:"25 Nov-02 Dec" },
    { platform:"Tata CLiQ",name:"Wedding Edit",       window:"10-25 Nov" },
    { platform:"Swiggy",   name:"Match Day Mania",    window:"all month" },
  ],
  Dec: [
    { platform:"Amazon",   name:"Year-End Sale",      window:"15-31 Dec" },
    { platform:"Flipkart", name:"Big End-of-Season",  window:"20-31 Dec" },
    { platform:"Myntra",   name:"EORS Festive",       window:"22-28 Dec" },
    { platform:"Nykaa",    name:"Beauty Bonanza",     window:"18-25 Dec" },
    { platform:"Zomato/Swiggy",name:"NYE Feast",      window:"28-31 Dec" },
    { platform:"Meesho",   name:"Mega Dhamaka",       window:"15-22 Dec" },
  ],
};

export const PLATFORM_VERTICALS = {
  "Horizontal Engines": ["Amazon","Flipkart","Meesho","Shopsy","JioMart"],
  "Fashion Verticals": ["Myntra","Ajio","Nykaa Fashion","Limeroad"],
  "Beauty & Personal Care": ["Nykaa","Purplle","Mamaearth","Plum"],
  "Food Delivery & Quick Commerce": ["Zomato","Swiggy","Blinkit","Zepto","Swiggy Instamart"],
} as const;

export const PLATFORM_METRICS = [
  "GMV Signal",
  "Order Volume Index",
  "Average Ticket Size (AOV)",
  "Top Performing Sub-Category",
  "Discount Aggression Level",
  "Returns/RTO Rate Spike",
] as const;

export const CATEGORIES_18 = [
  "Apparel","Footwear","Beauty/BPC","Electronics/Smartphones","Laptops/Computers",
  "Grocery/Staples","Home Decor","Kitchen Appliances","Toys","Fitness/Sports Gear",
  "Fresh Produce","Meat","Medicines","Premium Electronics","Pet Care","Office Supplies",
  "Prepared Food Delivery","Instant Snacks",
] as const;

export const MACRO_SIGNALS = [
  { key:"cpi",      label:"CPI Inflation %",            cy:"5.1",   ly:"5.4",   unit:"%" },
  { key:"foodInf",  label:"Food Inflation Index",       cy:"6.2",   ly:"7.8",   unit:"%" },
  { key:"petrol",   label:"Petrol Avg (₹/L, Delhi)",    cy:"96.7",  ly:"94.8",  unit:"₹" },
  { key:"diesel",   label:"Diesel Avg (₹/L, Delhi)",    cy:"89.6",  ly:"87.5",  unit:"₹" },
  { key:"upi",      label:"UPI Txn Volume (Bn)",        cy:"18.4",  ly:"13.9",  unit:"Bn" },
  { key:"cc",       label:"Credit Card Spends (₹ Lakh Cr)", cy:"1.82", ly:"1.65", unit:"₹L Cr" },
  { key:"repo",     label:"RBI Repo Rate %",            cy:"6.25",  ly:"6.50",  unit:"%" },
];

export const SUPPLY_FACTORS = [
  "Logistics / Trucker Strike Risk",
  "Warehouse Capacity Bottlenecks",
  "Last-Mile Weather Delays",
  "Sourcing Factory Holiday Shutdown",
  "Raw Material Cost Shocks (Cotton/Crude)",
] as const;

export interface ReferenceFactor {
  name: string;
  category: "Calendar" | "Climate" | "Macroeconomic" | "Funding Ecosystem" | "Platform Intel" | "Supply Chain" | "Consumer Intent Trends";
  why: string;
  source: string;
  freq: string;
}

export const REFERENCE_LIBRARY: ReferenceFactor[] = [
  { name:"Hindu Festival Calendar (Drik Panchang)", category:"Calendar", why:"Anchors discretionary demand peaks; lunar drift moves Diwali ±10-30 days YoY.", source:"Drik Panchang / IPanchang", freq:"Annual" },
  { name:"Muslim Festival Calendar", category:"Calendar", why:"Ramadan & Eid shift apparel/grocery demand windows by ~11 days/yr.", source:"Hijri Calendar", freq:"Annual" },
  { name:"Christian Calendar (Christmas/Easter)", category:"Calendar", why:"Year-end gifting + Easter chocolate/apparel demand.", source:"Liturgical Calendar", freq:"Annual" },
  { name:"Sikh / Regional Festivals", category:"Calendar", why:"Pongal, Onam, Baisakhi drive regional GMV spikes.", source:"State holiday gazettes", freq:"Annual" },
  { name:"Wedding Muhurat Count (Shaadi)", category:"Calendar", why:"Direct lift for jewellery, apparel, electronics, appliances.", source:"Panchang almanacs", freq:"Monthly" },
  { name:"Janeu / Thread Ceremony Muhurats", category:"Calendar", why:"Tier 2/3 spend in apparel + small gold.", source:"Panchang", freq:"Monthly" },
  { name:"Namkaran Muhurats", category:"Calendar", why:"Baby & gifting category signal.", source:"Panchang", freq:"Monthly" },
  { name:"Griha Pravesh Muhurats", category:"Calendar", why:"Home & kitchen appliance demand lift.", source:"Panchang", freq:"Monthly" },
  { name:"Annaprashan Muhurats", category:"Calendar", why:"Infant food + gifting categories.", source:"Panchang", freq:"Monthly" },
  { name:"Shraadh / Pitru Paksha", category:"Calendar", why:"15-day pause on discretionary FMCG/retail spend.", source:"Panchang", freq:"Annual" },
  { name:"Kharmas", category:"Calendar", why:"Wedding-spend blockout (mid-Dec to mid-Jan, mid-Mar to mid-Apr).", source:"Panchang", freq:"Bi-annual" },
  { name:"Chaturmas", category:"Calendar", why:"4-month wedding & griha-pravesh blockout window.", source:"Panchang", freq:"Annual" },
  { name:"IMD Monsoon Onset/Withdrawal", category:"Climate", why:"Triggers monsoon-skew categories: umbrellas, rain gear, AC slow-down.", source:"IMD", freq:"Daily" },
  { name:"Average Temperature Deviation", category:"Climate", why:"Drives apparel mix, AC/cooler, beverages.", source:"IMD / NASA POWER", freq:"Monthly" },
  { name:"Rainfall vs Normal (mm)", category:"Climate", why:"Rural sentiment + agri income proxy.", source:"IMD", freq:"Weekly" },
  { name:"Air Quality Index (AQI)", category:"Climate", why:"Air-purifier, mask, indoor-recreation demand.", source:"CPCB / SAFAR", freq:"Daily" },
  { name:"Heatwave / Cold Wave Alerts", category:"Climate", why:"Demand shocks for cooling/heating SKUs.", source:"IMD", freq:"Event" },
  { name:"Cyclone / Flood Events", category:"Climate", why:"Last-mile disruption + relief category surge.", source:"IMD / NDMA", freq:"Event" },
  { name:"CPI Inflation", category:"Macroeconomic", why:"Discretionary spend elasticity baseline.", source:"MOSPI", freq:"Monthly" },
  { name:"Food Inflation Index", category:"Macroeconomic", why:"Wallet share squeeze on non-food.", source:"MOSPI", freq:"Monthly" },
  { name:"Fuel Prices (Petrol/Diesel)", category:"Macroeconomic", why:"Logistics cost + rural spending mood.", source:"IOCL / PPAC", freq:"Daily" },
  { name:"RBI Repo Rate", category:"Macroeconomic", why:"EMI sensitivity for high-AOV (electronics, appliances).", source:"RBI", freq:"Bi-monthly" },
  { name:"GST Collections", category:"Macroeconomic", why:"Headline consumption proxy.", source:"GSTN", freq:"Monthly" },
  { name:"UPI Transaction Volumes", category:"Macroeconomic", why:"Digital payment penetration + commerce health.", source:"NPCI", freq:"Monthly" },
  { name:"Credit Card Spends", category:"Macroeconomic", why:"Premium/discretionary momentum.", source:"RBI", freq:"Monthly" },
  { name:"IIP (Industrial Production)", category:"Macroeconomic", why:"Consumer durables supply pulse.", source:"MOSPI", freq:"Monthly" },
  { name:"PMI Manufacturing / Services", category:"Macroeconomic", why:"Forward-looking demand indicator.", source:"S&P Global", freq:"Monthly" },
  { name:"Forex (INR/USD)", category:"Macroeconomic", why:"Import-heavy categories (electronics, beauty).", source:"RBI", freq:"Daily" },
  { name:"Consumer Confidence Index (RBI)", category:"Consumer Intent Trends", why:"Mood-meter for discretionary categories.", source:"RBI", freq:"Bi-monthly" },
  { name:"Google Trends — Category Queries", category:"Consumer Intent Trends", why:"Top-of-funnel demand signal.", source:"Google Trends", freq:"Weekly" },
  { name:"Search Trend — 'Sale'/'Offer'", category:"Consumer Intent Trends", why:"Deal-seeking intensity proxy.", source:"Google Trends", freq:"Weekly" },
  { name:"App Downloads (Sensor Tower)", category:"Consumer Intent Trends", why:"Platform mindshare shifts.", source:"Sensor Tower / App Annie", freq:"Monthly" },
  { name:"Social Listening — Brand Mentions", category:"Consumer Intent Trends", why:"Brand-health + virality flags.", source:"Brandwatch / Sprinklr", freq:"Daily" },
  { name:"Influencer Activity Index", category:"Consumer Intent Trends", why:"Beauty/Fashion top-of-funnel push.", source:"Qoruz / Klug", freq:"Monthly" },
  { name:"Startup Funding Rounds (D2C)", category:"Funding Ecosystem", why:"Marketing-spend war-chest signal.", source:"Tracxn / Inc42", freq:"Weekly" },
  { name:"VC Dry Powder (India focused)", category:"Funding Ecosystem", why:"Discount-aggression sustainability.", source:"Bain India PE/VC Report", freq:"Annual" },
  { name:"E-com IPO Filings (DRHP)", category:"Funding Ecosystem", why:"Pre-IPO platforms ramp ad-spend.", source:"SEBI", freq:"Event" },
  { name:"M&A Deals in Retail/D2C", category:"Funding Ecosystem", why:"Consolidation reshapes shelf share.", source:"Inc42 / VCCircle", freq:"Event" },
  { name:"Amazon GIF Window", category:"Platform Intel", why:"Single biggest H2 GMV event.", source:"Amazon Press / Tracker", freq:"Annual" },
  { name:"Flipkart BBD Window", category:"Platform Intel", why:"Counter-positioning vs GIF.", source:"Flipkart Press", freq:"Annual" },
  { name:"Meesho Mega Blockbuster", category:"Platform Intel", why:"Tier 3/4 demand barometer.", source:"Meesho Newsroom", freq:"Annual" },
  { name:"Myntra EORS Window", category:"Platform Intel", why:"Fashion clearance cadence.", source:"Myntra Press", freq:"Bi-annual" },
  { name:"Nykaa Pink Friday", category:"Platform Intel", why:"Beauty deal benchmark.", source:"Nykaa Press", freq:"Annual" },
  { name:"Quick Commerce Sale Clusters", category:"Platform Intel", why:"Festive pantry + impulse.", source:"Blinkit/Zepto/Instamart", freq:"Event" },
  { name:"Prime Day India", category:"Platform Intel", why:"Mid-year premium signal.", source:"Amazon Press", freq:"Annual" },
  { name:"Tata CLiQ Luxury Edit", category:"Platform Intel", why:"Luxury demand signal.", source:"Tata CLiQ", freq:"Event" },
  { name:"Logistics / Trucker Strike Risk", category:"Supply Chain", why:"Multi-day delivery SLA hit.", source:"AIMTC / News", freq:"Event" },
  { name:"Warehouse Capacity Utilization", category:"Supply Chain", why:"Capacity squeeze in festive peak.", source:"Knight Frank / JLL", freq:"Quarterly" },
  { name:"Diesel-driven Freight Index", category:"Supply Chain", why:"Cost-of-fulfilment proxy.", source:"CRISIL", freq:"Monthly" },
  { name:"Port Container Dwell Time", category:"Supply Chain", why:"Import-heavy SKUs delays.", source:"JNPA / DPA", freq:"Weekly" },
  { name:"Air Cargo Tonnage (BLR/DEL)", category:"Supply Chain", why:"Cross-border D2C velocity.", source:"AAI", freq:"Monthly" },
  { name:"Factory Holiday Shutdown Map", category:"Supply Chain", why:"Diwali / Eid factory pauses hit replen.", source:"Industry bodies", freq:"Annual" },
  { name:"Cotton Price Index", category:"Supply Chain", why:"Apparel COGS pressure.", source:"CCI / Cotlook", freq:"Daily" },
  { name:"Crude / Polymer Derivatives", category:"Supply Chain", why:"Packaging + plastics cost.", source:"PPAC / Platts", freq:"Daily" },
  { name:"E-way Bill Generation", category:"Supply Chain", why:"Movement-of-goods proxy.", source:"GSTN", freq:"Monthly" },
  { name:"Festive SKU Lead-Time Tracker", category:"Supply Chain", why:"OOS risk for star SKUs.", source:"Internal tracker", freq:"Weekly" },
];
