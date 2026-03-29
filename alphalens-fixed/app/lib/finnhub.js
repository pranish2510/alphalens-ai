// app/lib/finnhub.js
import { CONFIG } from './config';

const BASE = 'https://finnhub.io/api/v1';

async function fhFetch(path, params = {}) {
  const key = CONFIG.FINNHUB_API_KEY;
  if (!key || key === 'PASTE_FINNHUB_KEY_HERE') return null;
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('token', key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export const getFinnhubQuote          = (sym) => fhFetch('/quote',                  { symbol: sym.toUpperCase() });
export const getCompanyProfile        = (sym) => fhFetch('/stock/profile2',          { symbol: sym.toUpperCase() });
export const getAnalystRecommendations= (sym) => fhFetch('/stock/recommendation',    { symbol: sym.toUpperCase() });
export const getCompanyNews           = (sym, from, to) => {
  const t = to   || new Date().toISOString().split('T')[0];
  const f = from || new Date(Date.now() - 7*864e5).toISOString().split('T')[0];
  return fhFetch('/company-news', { symbol: sym.toUpperCase(), from: f, to: t });
};
export const getBasicFinancials       = (sym) => fhFetch('/stock/metric',            { symbol: sym.toUpperCase(), metric: 'all' });
export const getMarketNews            = (cat='general') => fhFetch('/news',          { category: cat });
export const searchSymbol             = (q)   => fhFetch('/search',                  { q });
