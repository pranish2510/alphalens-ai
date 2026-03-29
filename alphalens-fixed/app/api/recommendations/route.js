// app/api/recommendations/route.js
import { NextResponse } from 'next/server';
import { generateText } from '../../lib/ai';
import { RECOMMENDATIONS_SYSTEM_PROMPT } from '../../utils/prompts';

export async function POST(request) {
  try {
    const { riskTolerance, budget, goal, preferIndian, preferUS } = await request.json();

    if (!riskTolerance || !budget || !goal) {
      return NextResponse.json(
        { error: 'riskTolerance, budget, and goal are required' },
        { status: 400 }
      );
    }

    const budgetNum = parseFloat(budget.toString().replace(/[^0-9.]/g, ''));
    const isLargeBudget = budgetNum > 500000; // 5L INR

    const userProfile = `
Risk Tolerance: ${riskTolerance} (${riskTolerance === 'low' ? 'prefers stable, dividend-paying blue chips' : riskTolerance === 'high' ? 'comfortable with volatility, seeks alpha' : 'balanced growth with moderate protection'})
Budget: ₹${budgetNum.toLocaleString('en-IN')} (${isLargeBudget ? 'substantial allocation, consider diversification' : 'retail-sized position, focus on high-conviction picks'})
Investment Goal: ${goal} (${goal === 'growth' ? 'capital appreciation over 1-2 years' : goal === 'income' ? 'regular dividends and steady returns' : 'short-term momentum trades, 1-4 weeks'})
Market Preference: ${preferIndian ? 'Indian equities (NSE/BSE)' : ''} ${preferUS ? 'US equities (NYSE/NASDAQ)' : ''} ${!preferIndian && !preferUS ? 'both Indian and US markets' : ''}
Current Market Context: Indian markets influenced by FII flows, RBI policy; US markets watching Fed decisions
`.trim();

    const raw = await generateText(
      RECOMMENDATIONS_SYSTEM_PROMPT,
      `Generate 4-5 personalized stock recommendations for this investor profile:\n\n${userProfile}\n\nInclude specific NSE tickers (with .NS suffix for context) if Indian, or NASDAQ/NYSE tickers if US. Make allocation percentages sum to 100.`,
      { maxTokens: 1400, json: true, temperature: 0.8 }
    );

    let data;
    try {
      data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      data = generateFallbackRecs(riskTolerance, goal, budgetNum);
    }

    return NextResponse.json({ success: true, ...data, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Recommendations error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generateFallbackRecs(risk, goal, budget) {
  const recs = {
    low: [
      { ticker: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', allocation: 30, rationale: 'India\'s largest private sector bank with strong asset quality and consistent dividend history. Defensive play with steady growth in retail banking.', entryRange: '₹1,580 - ₹1,620', targetPrice: '₹1,850', stopLoss: '₹1,500', timeHorizon: '12 months', riskLevel: 'Low', catalyst: 'Credit growth recovery and NIM expansion' },
      { ticker: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', allocation: 25, rationale: 'IT sector leader with diversified global revenue, strong cash flows, and consistent dividend payouts. Defensive quality at reasonable valuation.', entryRange: '₹3,950 - ₹4,050', targetPrice: '₹4,600', stopLoss: '₹3,700', timeHorizon: '12 months', riskLevel: 'Low', catalyst: 'Q4 deal wins and US tech spending recovery' },
      { ticker: 'NESTLEIND', name: 'Nestle India', exchange: 'NSE', allocation: 20, rationale: 'FMCG giant with pricing power, volume recovery in rural markets, and strong brand equity across categories.', entryRange: '₹2,200 - ₹2,280', targetPrice: '₹2,600', stopLoss: '₹2,050', timeHorizon: '12 months', riskLevel: 'Low', catalyst: 'Rural consumption recovery' },
      { ticker: 'POWERGRID', name: 'Power Grid Corp', exchange: 'NSE', allocation: 25, rationale: 'Regulated utility with predictable cash flows, high dividend yield ~5%, and infrastructure growth tailwinds from India\'s energy transition.', entryRange: '₹295 - ₹310', targetPrice: '₹360', stopLoss: '₹275', timeHorizon: '12 months', riskLevel: 'Low', catalyst: 'New transmission project awards' },
    ],
    high: [
      { ticker: 'ADANIENT', name: 'Adani Enterprises', exchange: 'NSE', allocation: 20, rationale: 'Diversified conglomerate with significant exposure to airports, green energy, and data centers. High volatility but strong infrastructure pipeline.', entryRange: '₹2,900 - ₹3,050', targetPrice: '₹3,800', stopLoss: '₹2,600', timeHorizon: '9 months', riskLevel: 'High', catalyst: 'Airport monetization and green hydrogen milestones' },
      { ticker: 'ZOMATO', name: 'Zomato', exchange: 'NSE', allocation: 25, rationale: 'Food tech and quick commerce leader with path to profitability confirmed. Growing Blinkit GMV and expanding take rates make it a high-conviction growth play.', entryRange: '₹215 - ₹230', targetPrice: '₹310', stopLoss: '₹185', timeHorizon: '9 months', riskLevel: 'High', catalyst: 'Blinkit profitability and B2B expansion' },
      { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', allocation: 30, rationale: 'Dominant AI chip supplier with data center revenue compounding >100% YoY. Blackwell GPU cycle provides multi-year earnings visibility.', entryRange: '$870 - $910', targetPrice: '$1,200', stopLoss: '$780', timeHorizon: '9 months', riskLevel: 'High', catalyst: 'Blackwell ramp and hyperscaler capex' },
      { ticker: 'TATAMOTORS', name: 'Tata Motors', exchange: 'NSE', allocation: 25, rationale: 'Jaguar Land Rover recovery + India PV market share gains + EV portfolio launch provides multiple re-rating triggers.', entryRange: '₹950 - ₹990', targetPrice: '₹1,250', stopLoss: '₹880', timeHorizon: '9 months', riskLevel: 'High', catalyst: 'JLR EBIT margin expansion and Tata EV launch' },
    ],
  };

  const selected = recs[risk] || recs.low;
  return {
    recommendations: selected,
    portfolioStrategy: `Based on your ${risk} risk profile and ${goal} goal, this portfolio emphasizes ${risk === 'low' ? 'quality compounders with strong balance sheets' : 'high-growth opportunities with asymmetric upside'}.`,
    diversificationAdvice: `Split your ₹${budget.toLocaleString('en-IN')} across these ${selected.length} positions as per the allocation percentages for optimal risk-adjusted returns.`,
    riskWarning: risk === 'high' ? 'High-risk picks can decline 20-40% in adverse conditions. Use stop losses strictly.' : 'Even low-risk stocks carry market risk. Maintain a 6-month emergency fund before investing.',
  };
}
