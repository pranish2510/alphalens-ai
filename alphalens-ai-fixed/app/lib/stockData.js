// app/lib/stockData.js
// Pure Finnhub REST — US stocks via Finnhub, Indian via Yahoo public REST

import { CONFIG } from './config';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function fhKey() {
  return CONFIG.FINNHUB_API_KEY || '';
}

async function fh(path, params = {}) {
  const key = fhKey();
  if (!key) return null;
  const url = new URL(`${FINNHUB_BASE}${path}`);
  url.searchParams.set('token', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AlphaLens/1.0' },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      console.warn(`Finnhub ${path} returned ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.warn(`Finnhub ${path} failed:`, err.message);
    return null;
  }
}

// ─── Indian NSE stocks via Yahoo Finance v8 (public, no key needed) ──────────
async function yahooQuote(symbol) {
  // Yahoo Finance v8 chart endpoint — no API key, works via fetch
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AlphaLens/1.0)',
      'Accept': 'application/json',
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Yahoo quote error: ${res.status} for ${symbol}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No data returned for ${symbol}`);

  const meta = result.meta;
  const closes = result.indicators?.quote?.[0]?.close || [];
  const prevClose = closes[closes.length - 2] || meta.chartPreviousClose || meta.previousClose;
  const currentPrice = meta.regularMarketPrice || closes[closes.length - 1];
  const change = currentPrice - (prevClose || currentPrice);
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return {
    symbol: meta.symbol,
    price: currentPrice,
    prevClose,
    change,
    changePercent,
    open: meta.regularMarketOpen,
    high: meta.regularMarketDayHigh,
    low: meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    week52High: meta.fiftyTwoWeekHigh,
    week52Low: meta.fiftyTwoWeekLow,
    marketCap: meta.marketCap,
    currency: meta.currency || 'INR',
    exchange: meta.exchangeName || meta.fullExchangeName || 'NSE',
    longName: meta.longName || meta.shortName || meta.symbol,
  };
}

async function yahooSummary(symbol) {
  // Yahoo Finance v10 quoteSummary endpoint
  const modules = 'assetProfile,defaultKeyStatistics,financialData,summaryDetail';
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlphaLens/1.0)', 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.quoteSummary?.result?.[0] || null;
  } catch {
    return null;
  }
}

// ─── Symbol classification ─────────────────────────────────────────────────
const US_SYMBOLS = new Set([
  'AAPL','MSFT','GOOGL','GOOG','AMZN','TSLA','META','NVDA','AMD','INTC',
  'NFLX','UBER','LYFT','SNAP','COIN','HOOD','SOFI','PLTR','RBLX','SHOP',
  'SQ','PYPL','V','MA','JPM','BAC','GS','MS','WFC','C','XOM','CVX',
  'JNJ','PFE','MRNA','ABBV','BMY','LLY','UNH','WMT','TGT','COST',
  'HD','LOW','NKE','SBUX','MCD','DIS','CMCSA','T','VZ','SPY','QQQ',
  'BRK','BRK.B','BRKB','AMGN','GILD','REGN','ISRG','TMO','DHR',
]);

export function isUSSymbol(symbol) {
  const s = symbol.toUpperCase().replace('.', '');
  return US_SYMBOLS.has(s) || US_SYMBOLS.has(symbol.toUpperCase());
}

export function toYahooSymbol(symbol) {
  const s = symbol.toUpperCase().trim();
  if (s.includes('.')) return s;           // already has suffix
  if (isUSSymbol(s)) return s;             // US stock — no suffix
  return `${s}.NS`;                        // default NSE
}

// ─── Main: get full stock data ─────────────────────────────────────────────
export async function getStockData(symbol) {
  const isUS = isUSSymbol(symbol);
  const yahooSym = toYahooSymbol(symbol);

  if (isUS) {
    return await getUSStockData(symbol);
  } else {
    return await getIndianStockData(symbol, yahooSym);
  }
}

async function getUSStockData(symbol) {
  const sym = symbol.toUpperCase();

  // ── Primary: Yahoo Finance public REST (no key, always works) ───────────
  const [quoteResult, summaryResult] = await Promise.allSettled([
    yahooQuote(sym),           // US symbol — no .NS suffix
    yahooSummary(sym),
  ]);

  if (quoteResult.status === 'rejected') {
    throw new Error(`Could not fetch data for ${sym}. Please check the symbol and try again.`);
  }

  const q = quoteResult.value;
  const s = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

  const sd = s?.summaryDetail || {};
  const fp = s?.financialData || {};
  const ap = s?.assetProfile || {};
  const ks = s?.defaultKeyStatistics || {};

  const price       = q.price;
  const prevClose   = q.prevClose || price;
  const change      = q.change || (price - prevClose);
  const changePct   = q.changePercent || (prevClose ? (change / prevClose) * 100 : 0);
  const w52High     = q.week52High || sd.fiftyTwoWeekHigh?.raw;
  const w52Low      = q.week52Low  || sd.fiftyTwoWeekLow?.raw;
  const volume      = q.volume || 0;
  const avgVol      = sd.averageVolume?.raw || sd.averageDailyVolume10Day?.raw || null;
  const volumeRatio = avgVol > 0 ? Math.round((volume / avgVol) * 100) / 100 : 1;
  const rangePos    = (w52High && w52Low && w52High !== w52Low)
    ? Math.round(((price - w52Low) / (w52High - w52Low)) * 100) : 50;

  // ── Enrichment: Finnhub (optional — analyst recs + company profile) ─────
  let finnhubProfile = {};
  let finnhubMetrics = {};
  let finnhubRec = null;

  if (fhKey()) {
    const [profile, metrics, recs] = await Promise.allSettled([
      fh('/stock/profile2', { symbol: sym }),
      fh('/stock/metric',   { symbol: sym, metric: 'all' }),
      fh('/stock/recommendation', { symbol: sym }),
    ]);
    finnhubProfile  = profile.status  === 'fulfilled' ? (profile.value  || {}) : {};
    finnhubMetrics  = metrics.status  === 'fulfilled' ? (metrics.value?.metric || {}) : {};
    finnhubRec      = recs.status     === 'fulfilled' && recs.value?.length ? recs.value[0] : null;
  }

  return {
    symbol: sym,
    displaySymbol: sym,
    name: q.longName || finnhubProfile.name || sym,
    price,
    prevClose,
    change,
    changePercent: changePct,
    open:   q.open,
    high:   q.high,
    low:    q.low,
    volume,
    avgVolume: avgVol,
    week52High: w52High || finnhubMetrics['52WeekHigh'],
    week52Low:  w52Low  || finnhubMetrics['52WeekLow'],
    marketCap: q.marketCap
      || sd.marketCap?.raw
      || (finnhubProfile.marketCapitalization ? finnhubProfile.marketCapitalization * 1e6 : null),
    peRatio:  sd.trailingPE?.raw  || finnhubMetrics.peTTM || ks.forwardPE?.raw || null,
    eps:      ks.trailingEps?.raw || finnhubMetrics.epsTTM || null,
    beta:     sd.beta?.raw        || finnhubMetrics.beta   || null,
    sector:   ap.sector           || finnhubProfile.finnhubIndustry || 'N/A',
    industry: ap.industry         || finnhubProfile.finnhubIndustry || 'N/A',
    description: ap.longBusinessSummary || '',
    exchange: q.exchange || finnhubProfile.exchange || 'NASDAQ',
    currency: 'USD',
    currencySymbol: '$',
    logoUrl:  finnhubProfile.logo    || null,
    webUrl:   finnhubProfile.weburl  || null,
    country:  finnhubProfile.country || 'US',
    revenueGrowth: fp.revenueGrowth?.raw || (finnhubMetrics.revenueGrowthTTMYoy ? finnhubMetrics.revenueGrowthTTMYoy / 100 : null),
    returnOnEquity: fp.returnOnEquity?.raw || (finnhubMetrics.roeTTM ? finnhubMetrics.roeTTM / 100 : null),
    debtToEquity: fp.debtToEquity?.raw || null,
    dividendYield: sd.dividendYield?.raw || null,
    recommendationKey: fp.recommendationKey || (finnhubRec ? recKeyFromFinnhub(finnhubRec) : null),
    targetMeanPrice: fp.targetMeanPrice?.raw || null,
    numberOfAnalystOpinions: fp.numberOfAnalystOpinions?.raw || null,
    analystRec: finnhubRec,
    isIndian: false,
    volumeRatio,
    rangePosition: rangePos,
    volumeSpike:   volumeRatio >= 2,
    unusualVolume: volumeRatio >= 1.5,
    pumpFlags: buildPumpFlags({ price, changePercent: changePct, volumeRatio, rangePos }),
    lastUpdated: new Date().toISOString(),
    marketStatus: getMarketStatus(),
  };
}

async function getIndianStockData(symbol, yahooSym) {
  const sym = symbol.toUpperCase();

  // Yahoo Finance public endpoint (no key) for Indian stocks
  const [quoteResult, summaryResult] = await Promise.allSettled([
    yahooQuote(yahooSym),
    yahooSummary(yahooSym),
  ]);

  if (quoteResult.status === 'rejected') {
    // Try BSE suffix fallback
    const bseSym = `${sym}.BO`;
    const bseQuote = await yahooQuote(bseSym);
    return buildIndianStock(sym, bseQuote, null, 'BSE');
  }

  const q = quoteResult.value;
  const s = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

  return buildIndianStock(sym, q, s, q.exchange);
}

function buildIndianStock(sym, q, s, exchange) {
  const sd = s?.summaryDetail || {};
  const fp = s?.financialData || {};
  const ap = s?.assetProfile || {};
  const ks = s?.defaultKeyStatistics || {};

  const price = q.price;
  const prevClose = q.prevClose || price;
  const change = q.change || (price - prevClose);
  const changePercent = q.changePercent || (prevClose ? (change / prevClose) * 100 : 0);

  const w52High = q.week52High || sd.fiftyTwoWeekHigh?.raw;
  const w52Low  = q.week52Low  || sd.fiftyTwoWeekLow?.raw;
  const rangePos = (w52High && w52Low && w52High !== w52Low)
    ? Math.round(((price - w52Low) / (w52High - w52Low)) * 100)
    : 50;

  const volume = q.volume || 0;
  const avgVol = sd.averageVolume?.raw || sd.averageDailyVolume10Day?.raw || null;
  const volumeRatio = avgVol && avgVol > 0 ? Math.round((volume / avgVol) * 100) / 100 : 1;

  return {
    symbol: q.symbol || `${sym}.NS`,
    displaySymbol: sym,
    name: q.longName || sym,
    price,
    prevClose,
    change,
    changePercent,
    open: q.open,
    high: q.high,
    low: q.low,
    volume,
    avgVolume: avgVol,
    week52High: w52High,
    week52Low: w52Low,
    marketCap: q.marketCap || sd.marketCap?.raw || null,
    peRatio: sd.trailingPE?.raw || ks.trailingEps?.raw ? null : null,
    beta: sd.beta?.raw || null,
    sector: ap.sector || 'N/A',
    industry: ap.industry || 'N/A',
    description: ap.longBusinessSummary || '',
    exchange: exchange || 'NSE',
    currency: q.currency || 'INR',
    currencySymbol: '₹',
    revenueGrowth: fp.revenueGrowth?.raw || null,
    returnOnEquity: fp.returnOnEquity?.raw || null,
    debtToEquity: fp.debtToEquity?.raw || null,
    recommendationKey: fp.recommendationKey || null,
    targetMeanPrice: fp.targetMeanPrice?.raw || null,
    numberOfAnalystOpinions: fp.numberOfAnalystOpinions?.raw || null,
    isIndian: true,
    volumeRatio,
    rangePosition: rangePos,
    volumeSpike: volumeRatio >= 2,
    unusualVolume: volumeRatio >= 1.5,
    pumpFlags: buildPumpFlags({ price, changePercent, volumeRatio, rangePos }),
    lastUpdated: new Date().toISOString(),
    marketStatus: getMarketStatus(),
  };
}

// ─── Search ─────────────────────────────────────────────────────────────────
export async function searchStocks(query) {
  // Try Finnhub first (if key available)
  if (fhKey()) {
    try {
      const data = await fh('/search', { q: query });
      if (data?.result?.length) {
        return data.result.slice(0, 8).map(r => ({
          symbol: r.symbol,
          name: r.description,
          exchange: r.primaryExchange || r.type || '',
          type: r.type,
          isIndian: r.symbol?.includes('.NS') || r.symbol?.includes('.BO'),
        }));
      }
    } catch {}
  }

  // Fallback: Yahoo Finance autocomplete (no key needed)
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&enableFuzzyQuery=false`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlphaLens/1.0)' },
      next: { revalidate: 60 },
    });
    const data = await res.json();
    return (data.quotes || []).slice(0, 8).map(r => ({
      symbol: r.symbol,
      name: r.longname || r.shortname || r.symbol,
      exchange: r.exchDisp || r.exchange || '',
      type: r.quoteType,
      isIndian: r.symbol?.includes('.NS') || r.symbol?.includes('.BO'),
    }));
  } catch {
    return [];
  }
}

// ─── Analyst recs (Finnhub) ──────────────────────────────────────────────────
export async function getAnalystRecs(symbol) {
  if (!isUSSymbol(symbol)) return null;
  try {
    const data = await fh('/stock/recommendation', { symbol: symbol.toUpperCase() });
    return data?.[0] || null;
  } catch {
    return null;
  }
}

// ─── News (Finnhub) ──────────────────────────────────────────────────────────
export async function getCompanyNews(symbol) {
  const sym = symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
  const to   = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
  try {
    const data = await fh('/company-news', { symbol: sym, from, to });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getCompanyProfile(symbol) {
  try {
    return await fh('/stock/profile2', { symbol: symbol.toUpperCase() });
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildPumpFlags({ price, changePercent, volumeRatio, rangePos }) {
  const flags = [];
  if (volumeRatio >= 2) flags.push(`Volume spike: ${volumeRatio}x average`);
  if (Math.abs(changePercent || 0) > 10) flags.push(`Extreme move: ${changePercent?.toFixed(1)}% today`);
  if (rangePos >= 90) flags.push('Trading near 52-week high');
  return flags;
}

function recKeyFromFinnhub(rec) {
  if (!rec) return null;
  const buy = (rec.strongBuy || 0) + (rec.buy || 0);
  const sell = (rec.strongSell || 0) + (rec.sell || 0);
  const hold = rec.hold || 0;
  const total = buy + sell + hold;
  if (!total) return null;
  if (buy / total > 0.6) return 'buy';
  if (sell / total > 0.4) return 'sell';
  return 'hold';
}

function getMarketStatus() {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcMin = utcH * 60 + utcM;
  const day = now.getUTCDay(); // 0=Sun,6=Sat
  const isWeekday = day >= 1 && day <= 5;

  // NSE: 9:15–15:30 IST = 3:45–10:00 UTC
  const nseOpen = isWeekday && utcMin >= 225 && utcMin <= 600;
  // NYSE: 9:30–16:00 ET = 14:30–21:00 UTC
  const nyseOpen = isWeekday && utcMin >= 870 && utcMin <= 1260;

  return { nse: nseOpen ? 'OPEN' : 'CLOSED', nyse: nyseOpen ? 'OPEN' : 'CLOSED' };
}

export function formatLargeNumber(n, symbol = '') {
  if (n == null) return 'N/A';
  const abs = Math.abs(n);
  let s;
  if (abs >= 1e12) s = (n / 1e12).toFixed(2) + 'T';
  else if (abs >= 1e9)  s = (n / 1e9).toFixed(2)  + 'B';
  else if (abs >= 1e6)  s = (n / 1e6).toFixed(2)  + 'M';
  else if (abs >= 1e3)  s = (n / 1e3).toFixed(1)  + 'K';
  else s = n.toLocaleString();
  return symbol + s;
}
