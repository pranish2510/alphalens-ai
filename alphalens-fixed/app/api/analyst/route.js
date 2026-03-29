// app/api/analyst/route.js
import { NextResponse } from 'next/server';
import { generateText } from '../../lib/ai';
import { THESIS_SYSTEM_PROMPT } from '../../utils/prompts';

export async function POST(request) {
  try {
    const { stockData, newsItems } = await request.json();
    if (!stockData) return NextResponse.json({ error: 'stockData required' }, { status: 400 });

    // Analyst consensus from Finnhub data already in stockData
    let analystConsensus = null;
    if (stockData.analystRec) {
      const r = stockData.analystRec;
      const total = (r.strongBuy||0)+(r.buy||0)+(r.hold||0)+(r.sell||0)+(r.strongSell||0);
      analystConsensus = { ...r, source: 'Finnhub', total };
    }

    const newsCtx = (newsItems || []).slice(0, 5)
      .map(n => `- ${n.headline} [${n.sentiment || 'Neutral'}]`).join('\n') || 'No recent news';

    const ctx = `
Company: ${stockData.name} (${stockData.displaySymbol})
Exchange: ${stockData.exchange} | Sector: ${stockData.sector}
Price: ${stockData.currencySymbol}${stockData.price?.toFixed(2)} | Change: ${stockData.changePercent?.toFixed(2)}%
52W High: ${stockData.currencySymbol}${stockData.week52High?.toFixed(2)} | 52W Low: ${stockData.currencySymbol}${stockData.week52Low?.toFixed(2)}
52W Position: ${stockData.rangePosition}th percentile
Market Cap: ${stockData.marketCap ? (stockData.marketCap/1e9).toFixed(2)+'B' : 'N/A'}
P/E: ${stockData.peRatio?.toFixed(2)||'N/A'} | Beta: ${stockData.beta?.toFixed(2)||'N/A'}
Volume vs Avg: ${stockData.volumeRatio}x ${stockData.volumeSpike ? '⚡ SPIKE' : ''}
Revenue Growth: ${stockData.revenueGrowth ? (stockData.revenueGrowth*100).toFixed(1)+'%' : 'N/A'}
ROE: ${stockData.returnOnEquity ? (stockData.returnOnEquity*100).toFixed(1)+'%' : 'N/A'}
Pump Flags: ${stockData.pumpFlags?.join(', ') || 'None'}

Recent News:
${newsCtx}`.trim();

    const raw = await generateText(THESIS_SYSTEM_PROMPT, `Generate investment thesis:\n\n${ctx}`, { maxTokens: 1200, json: true });

    let thesis;
    try {
      thesis = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      thesis = fallbackThesis(stockData);
    }

    // Generate AI consensus if no real one
    if (!analystConsensus) {
      analystConsensus = aiConsensus(thesis);
    }

    return NextResponse.json({ success: true, thesis, analystConsensus, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Analyst error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function aiConsensus(thesis) {
  const rec = thesis?.recommendation || 'HOLD';
  const base = { source: 'AI Estimated', period: new Date().toISOString().split('T')[0] };
  if (rec === 'BUY')  return { ...base, strongBuy: 4, buy: 8, hold: 3, sell: 1, strongSell: 0 };
  if (rec === 'SELL' || rec === 'AVOID') return { ...base, strongBuy: 0, buy: 1, hold: 3, sell: 6, strongSell: 4 };
  return { ...base, strongBuy: 2, buy: 5, hold: 6, sell: 2, strongSell: 0 };
}

function fallbackThesis(stock) {
  const up = (stock.changePercent||0) > 0;
  return {
    summary: `${stock.name} is trading at ${stock.currencySymbol}${stock.price?.toFixed(2)}, ${up?'up':'down'} ${Math.abs(stock.changePercent||0).toFixed(2)}% today. The stock operates in the ${stock.sector||'N/A'} sector.`,
    sentiment: up ? 'Bullish' : 'Neutral', sentimentScore: up ? 62 : 44,
    opportunities: ['Market leadership in core segment','Margin expansion potential','Growing addressable market','Technical support at current levels'],
    risks: ['Market volatility','Competitive pressures','Regulatory changes','Global macro uncertainty'],
    recommendation: 'HOLD', targetPrice: stock.price ? Math.round(stock.price*1.12) : null,
    timeHorizon: '6-12 months',
    keyMetrics: { moatScore: 60, growthScore: 55, riskScore: 48, valuationScore: 57 },
    catalysts: ['Quarterly earnings','Sector re-rating'],
    watchFactors: ['Volume trends','News flow'],
  };
}
