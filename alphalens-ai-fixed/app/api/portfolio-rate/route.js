// app/api/portfolio-rate/route.js
import { NextResponse } from 'next/server';
import { generateText } from '../../lib/ai';

export async function POST(request) {
  try {
    const { holdings } = await request.json();
    if (!holdings?.length) return NextResponse.json({ error: 'No holdings provided' }, { status: 400 });

    const holdingsSummary = holdings.map(h =>
      `${h.symbol} (${h.exchange}): Bought @ ${h.currencySymbol}${h.buyPrice}, Current ${h.currencySymbol}${h.currentPrice}, Qty: ${h.qty}, P&L: ${h.pnlPct}%, Value: ${h.currencySymbol}${h.value}, Sector: ${h.sector}`
    ).join('\n');

    const raw = await generateText(
      `You are a portfolio analyst. Rate this portfolio out of 10 and provide actionable feedback.
Return ONLY valid JSON:
{
  "score": 7,
  "grade": "Good — Well Diversified",
  "summary": "2-3 sentence overall assessment of portfolio quality, diversification, and risk",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["specific action 1", "specific action 2", "specific action 3"],
  "diversificationScore": 0-10,
  "riskScore": "Low/Medium/High",
  "topPick": "SYMBOL",
  "worstPick": "SYMBOL"
}

Scoring guide:
9-10: Exceptional — perfect diversification, strong performers, optimal risk
7-8: Good — well-diversified, mostly strong picks
5-6: Average — some concentration risk or weak performers
3-4: Below average — poor diversification or significant losses
1-2: Poor — heavily concentrated or all losing positions`,
      `Rate this portfolio:\n\n${holdingsSummary}\n\nTotal holdings: ${holdings.length}\nTotal invested value: ${holdings.reduce((s, h) => s + parseFloat(h.value), 0).toFixed(2)}`,
      { maxTokens: 700, json: true }
    );

    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error('Portfolio rate error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
