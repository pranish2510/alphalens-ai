// app/api/stock/route.js
import { NextResponse } from 'next/server';
import { getStockData } from '../../lib/stockData';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim();
  if (!symbol) return NextResponse.json({ error: 'symbol is required' }, { status: 400 });

  try {
    const data = await getStockData(symbol);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Stock API error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
