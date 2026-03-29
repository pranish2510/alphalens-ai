// app/api/chart/route.js
// Fetches OHLC candle data from Yahoo Finance — no API key required
import { NextResponse } from 'next/server';

const US_SYMBOLS = new Set([
  'AAPL','MSFT','GOOGL','GOOG','AMZN','TSLA','META','NVDA','AMD','INTC',
  'NFLX','UBER','SNAP','COIN','PLTR','RBLX','SHOP','SQ','PYPL','V','MA',
  'JPM','BAC','GS','WFC','XOM','CVX','JNJ','PFE','WMT','TGT','HD','NKE',
  'SBUX','MCD','DIS','SPY','QQQ','AMGN','GILD','ABBV','LLY','UNH',
]);

function toYahooSym(symbol) {
  const s = symbol.toUpperCase().replace('.NS','').replace('.BO','');
  if (US_SYMBOLS.has(s)) return s;
  return `${s}.NS`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim();
  const range = searchParams.get('range') || '3mo';
  const interval = searchParams.get('interval') || '1d';

  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

  const ySym = toYahooSym(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=${interval}&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlphaLens/1.0)',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      // Try .BO fallback for Indian
      const bSym = `${symbol.toUpperCase().replace('.NS','').replace('.BO','')}.BO`;
      const res2 = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(bSym)}?interval=${interval}&range=${range}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        next: { revalidate: 300 },
      });
      if (!res2.ok) return NextResponse.json({ error: `Yahoo: ${res.status}` }, { status: 502 });
      return processYahooResponse(await res2.json(), symbol);
    }

    return processYahooResponse(await res.json(), symbol);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function processYahooResponse(raw, displaySymbol) {
  const result = raw?.chart?.result?.[0];
  if (!result) return NextResponse.json({ error: 'No chart data' }, { status: 404 });

  const timestamps = result.timestamp || [];
  const q = result.indicators?.quote?.[0] || {};
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose;

  const candles = timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().split('T')[0],
    open:  q.open?.[i]  ?? null,
    high:  q.high?.[i]  ?? null,
    low:   q.low?.[i]   ?? null,
    close: q.close?.[i] ?? null,
    adjClose: adjClose?.[i] ?? q.close?.[i] ?? null,
    volume: q.volume?.[i] ?? null,
  })).filter(c => c.close !== null);

  const meta = result.meta || {};
  return NextResponse.json({
    success: true,
    symbol: meta.symbol,
    displaySymbol: displaySymbol.toUpperCase(),
    currency: meta.currency,
    exchange: meta.exchangeName,
    candles,
    count: candles.length,
  });
}
