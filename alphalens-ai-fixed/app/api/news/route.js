// app/api/news/route.js
import { NextResponse } from 'next/server';
import { CONFIG } from '../../lib/config';
import { generateText } from '../../lib/ai';
import { SENTIMENT_SYSTEM_PROMPT } from '../../utils/prompts';

// ── Company name map for better Google News queries ─────────────────────────
const COMPANY_NAMES = {
  // US
  AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Google Alphabet', GOOG: 'Google Alphabet',
  AMZN: 'Amazon', TSLA: 'Tesla', META: 'Meta Facebook', NVDA: 'Nvidia',
  AMD: 'AMD semiconductor', INTC: 'Intel', NFLX: 'Netflix', UBER: 'Uber',
  JPM: 'JPMorgan Chase', BAC: 'Bank of America', GS: 'Goldman Sachs',
  V: 'Visa', MA: 'Mastercard', WMT: 'Walmart', DIS: 'Disney',
  PYPL: 'PayPal', SHOP: 'Shopify', COIN: 'Coinbase', PLTR: 'Palantir',
  // Indian
  RELIANCE: 'Reliance Industries', INFY: 'Infosys', TCS: 'Tata Consultancy Services',
  HDFCBANK: 'HDFC Bank', ICICIBANK: 'ICICI Bank', SBIN: 'State Bank of India',
  WIPRO: 'Wipro', TATAMOTORS: 'Tata Motors', BAJFINANCE: 'Bajaj Finance',
  ADANIENT: 'Adani Enterprises', ZOMATO: 'Zomato', PAYTM: 'Paytm One97',
  ONGC: 'ONGC Oil', MARUTI: 'Maruti Suzuki', SUNPHARMA: 'Sun Pharmaceutical',
  AXISBANK: 'Axis Bank', LTIM: 'LTIMindtree', ASIANPAINT: 'Asian Paints',
  KOTAKBANK: 'Kotak Mahindra Bank', BHARTIARTL: 'Bharti Airtel',
};

// ── Fetch from Google News RSS (no API key needed, always works) ─────────────
async function fetchGoogleNews(symbol, companyName) {
  const query = encodeURIComponent(`${companyName || symbol} stock`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlphaLens/1.0)', Accept: 'application/rss+xml' },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];

  const xml = await res.text();

  // Parse RSS items manually (no xml2js in edge runtime)
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.slice(0, 8).map(m => {
    const item = m[1];
    const headline = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || '';
    const url     = (item.match(/<link>(.*?)<\/link>/))?.[1]?.trim() || '';
    const source  = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1]?.trim() ||
                    (item.match(/<source[^>]*url="([^"]+)"/))?.[1]?.trim() || 'Google News';
    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() || '';
    const summary = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/))?.[1]
      ?.replace(/<[^>]+>/g, '').trim().slice(0, 200) || '';

    return {
      headline: headline.replace(/\s*-\s*[^-]+$/, '').trim(), // strip trailing source name
      url,
      source,
      summary,
      datetime: pubDate ? new Date(pubDate).getTime() : Date.now(),
      image: null,
    };
  }).filter(a => a.headline && a.url);
}

// ── Fetch from Finnhub (if key is set) ──────────────────────────────────────
async function fetchFinnhubNews(symbol) {
  const key = CONFIG.FINNHUB_API_KEY;
  if (!key || key === 'PASTE_FINNHUB_KEY_HERE') return [];

  const sym = symbol.toUpperCase().replace(/\.(NS|BO)$/, '');
  const to   = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
  const url  = `https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${from}&to=${to}&token=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).slice(0, 8).map(n => ({
      headline: n.headline,
      url: n.url,
      source: n.source,
      summary: n.summary || '',
      datetime: n.datetime * 1000,
      image: n.image || null,
    })).filter(a => a.headline && a.url);
  } catch { return []; }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol  = searchParams.get('symbol')?.trim();
  const analyze = searchParams.get('analyze') !== 'false';

  try {
    let articles = [];

    if (symbol) {
      const sym         = symbol.toUpperCase().replace(/\.(NS|BO)$/, '');
      const companyName = COMPANY_NAMES[sym] || sym;

      // Try Finnhub first (has richer data when key is set), then Google News
      const [fh, gn] = await Promise.all([
        fetchFinnhubNews(symbol),
        fetchGoogleNews(sym, companyName),
      ]);

      // Prefer Finnhub; merge unique Google News articles on top
      const seen = new Set(fh.map(a => a.headline.slice(0, 40)));
      const extra = gn.filter(a => !seen.has(a.headline.slice(0, 40)));
      articles = [...fh, ...extra].slice(0, 8);
    }

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        articles: [],
        sentiment: null,
        message: 'No recent news found for this symbol.',
      });
    }

    // ── AI sentiment analysis via Gemini ────────────────────────────────────
    let sentimentData = null;
    if (analyze) {
      try {
        const headlines = articles
          .map((a, i) => `${i + 1}. ${a.headline}\n${a.summary?.slice(0, 120) || ''}`)
          .join('\n\n');

        const raw = await generateText(
          SENTIMENT_SYSTEM_PROMPT,
          `Stock: ${symbol}\n\nAnalyze:\n\n${headlines}`,
          { maxTokens: 900, json: true }
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        sentimentData = parsed;
        if (parsed.items) {
          articles = articles.map((a, i) => ({
            ...a,
            ...(parsed.items[i] || { sentiment: 'Neutral', magnitude: 'Low', impact: '' }),
          }));
        }
      } catch {
        // Fallback: keyword-based sentiment
        articles = articles.map(a => ({ ...a, ...basicSentiment(a.headline + ' ' + (a.summary || '')) }));
      }
    }

    return NextResponse.json({ success: true, articles, sentiment: sentimentData, count: articles.length });
  } catch (err) {
    console.error('News error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function basicSentiment(text) {
  const t = text.toLowerCase();
  const pos = ['surge','gain','beat','profit','growth','record','upgrade','strong','rally','rise','high','bullish','soar','jump'];
  const neg = ['fall','drop','loss','miss','decline','downgrade','weak','risk','concern','cut','bearish','crash','plunge','slump'];
  const p = pos.filter(w => t.includes(w)).length;
  const n = neg.filter(w => t.includes(w)).length;
  if (p > n) return { sentiment: 'Positive', magnitude: p > 2 ? 'High' : 'Medium', priceDirection: 'rise', impact: 'Positive news may support price' };
  if (n > p) return { sentiment: 'Negative', magnitude: n > 2 ? 'High' : 'Medium', priceDirection: 'fall', impact: 'Negative news may pressure price' };
  return { sentiment: 'Neutral', magnitude: 'Low', priceDirection: 'stable', impact: 'Limited price impact expected' };
}
