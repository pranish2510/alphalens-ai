// app/api/chart/route.js
// Historical OHLC price data from Yahoo Finance — no API key needed
import { NextResponse } from 'next/server';

const US_SYMBOLS = new Set([
  'AAPL','MSFT','GOOGL','GOOG','AMZN','TSLA','META','NVDA','AMD','INTC',
  'NFLX','UBER','SNAP','COIN','PLTR','RBLX','SHOP','SQ','PYPL','V','MA',
  'JPM','BAC','GS','MS','WFC','XOM','CVX','JNJ','PFE','MRNA','ABBV',
  'WMT','TGT','COST','HD','NKE','SBUX','MCD','DIS','SPY','QQQ','LLY',
  'UNH','BMY','AMGN','ISRG','TMO','DHR','CMCSA','T','VZ','CRM','ORCL',
]);

function toYahooSymbol(symbol) {
  const s = symbol.toUpperCase().trim();
  if (s.includes('.')) return s;
  if (US_SYMBOLS.has(s)) return s;
  return `${s}.NS`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol   = searchParams.get('symbol')?.trim();
  const range    = searchParams.get('range') || '3mo';
  const interval = range === '1d' ? '5m' : range === '5d' ? '30m' : '1d';

  if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 });

  const yahooSym = toYahooSymbol(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=${interval}&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlphaLens/1.0)',
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return NextResponse.json({ error: `Yahoo error ${res.status}` }, { status: 502 });

    const raw = await res.json();
    const result = raw?.chart?.result?.[0];
    if (!result) return NextResponse.json({ error: 'No data' }, { status: 404 });

    const timestamps = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};

    const candles = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open:  q.open?.[i]  ?? null,
      high:  q.high?.[i]  ?? null,
      low:   q.low?.[i]   ?? null,
      close: q.close?.[i] ?? null,
      volume: q.volume?.[i] ?? null,
    })).filter(c => c.close !== null);

    return NextResponse.json({
      success: true,
      symbol: yahooSym,
      range,
      candles,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
