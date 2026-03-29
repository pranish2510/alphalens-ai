// app/api/search/route.js
import { NextResponse } from 'next/server';
import { searchStocks } from '../../lib/stockData';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q || q.length < 1) return NextResponse.json({ results: [] });

  try {
    const results = await searchStocks(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    return NextResponse.json({ results: [], error: err.message });
  }
}
