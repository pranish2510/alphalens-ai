// app/api/news/route.js
import { NextResponse } from 'next/server';
import { getCompanyNews } from '../../lib/stockData';
import { generateText, hasGeminiKey } from '../../lib/ai';
import { SENTIMENT_SYSTEM_PROMPT } from '../../utils/prompts';

// Real news links for top stocks (demo fallback when Finnhub key not set)
const DEMO_NEWS_LINKS = {
  // US stocks
  META:   ['https://www.reuters.com/technology/meta/', 'https://www.cnbc.com/meta-platforms/', 'https://techcrunch.com/tag/meta/'],
  AAPL:   ['https://www.reuters.com/technology/apple/', 'https://www.cnbc.com/apple/', 'https://9to5mac.com/'],
  NVDA:   ['https://www.reuters.com/technology/nvidia/', 'https://www.cnbc.com/nvidia/', 'https://www.theverge.com/nvidia'],
  GOOGL:  ['https://www.reuters.com/technology/alphabet/', 'https://www.cnbc.com/alphabet/', 'https://techcrunch.com/tag/google/'],
  MSFT:   ['https://www.reuters.com/technology/microsoft/', 'https://www.cnbc.com/microsoft/', 'https://techcrunch.com/tag/microsoft/'],
  TSLA:   ['https://www.reuters.com/technology/tesla/', 'https://www.cnbc.com/tesla/', 'https://electrek.co/'],
  AMZN:   ['https://www.reuters.com/technology/amazon/', 'https://www.cnbc.com/amazon/', 'https://techcrunch.com/tag/amazon/'],
  // Indian stocks
  RELIANCE: ['https://www.moneycontrol.com/company-facts/relianceindustries/', 'https://economictimes.indiatimes.com/reliance-industries/', 'https://www.livemint.com/companies/reliance'],
  INFY:     ['https://www.moneycontrol.com/company-facts/infosys/', 'https://economictimes.indiatimes.com/infosys/', 'https://www.livemint.com/companies/infosys'],
  TCS:      ['https://www.moneycontrol.com/company-facts/tataconsultancyservices/', 'https://economictimes.indiatimes.com/tata-consultancy-services/', 'https://www.livemint.com/companies/tcs'],
  HDFCBANK: ['https://www.moneycontrol.com/company-facts/hdfcbank/', 'https://economictimes.indiatimes.com/hdfc-bank/', 'https://www.livemint.com/companies/hdfc-bank'],
  WIPRO:    ['https://www.moneycontrol.com/company-facts/wipro/', 'https://economictimes.indiatimes.com/wipro/', 'https://www.livemint.com/companies/wipro'],
  TATAMOTORS:['https://www.moneycontrol.com/company-facts/tatamotors/', 'https://economictimes.indiatimes.com/tata-motors/', 'https://www.livemint.com/companies/tata-motors'],
  ZOMATO:   ['https://www.moneycontrol.com/company-facts/zomato/', 'https://economictimes.indiatimes.com/zomato/', 'https://www.livemint.com/companies/zomato'],
  BAJFINANCE:['https://www.moneycontrol.com/company-facts/bajajfinance/', 'https://economictimes.indiatimes.com/bajaj-finance/', 'https://www.livemint.com/companies/bajaj-finance'],
  ADANIENT: ['https://www.moneycontrol.com/company-facts/adanient/', 'https://economictimes.indiatimes.com/adani-enterprises/', 'https://www.livemint.com/companies/adani'],
  ICICIBANK:['https://www.moneycontrol.com/company-facts/icicibank/', 'https://economictimes.indiatimes.com/icici-bank/', 'https://www.livemint.com/companies/icici-bank'],
};

function getLinksForSymbol(sym) {
  const clean = sym.toUpperCase().replace('.NS','').replace('.BO','');
  return DEMO_NEWS_LINKS[clean] || [
    `https://economictimes.indiatimes.com/topic/${encodeURIComponent(clean)}`,
    `https://www.moneycontrol.com/stocks/company_info/stock_news.php`,
    `https://finance.yahoo.com/quote/${encodeURIComponent(clean)}/news/`,
  ];
}

const NEWS_GEN_PROMPT = `You are a financial news generator for demo purposes. Generate 6 realistic, plausible recent news headlines and summaries for the given stock symbol. Base them on what is generally known about this company.

Return ONLY valid JSON (no markdown, no backticks):
{
  "articles": [
    {
      "headline": "Realistic news headline about the company (max 100 chars)",
      "summary": "2-3 sentence summary with specific details. Include numbers/percentages where realistic.",
      "source": "Reuters" | "Bloomberg" | "CNBC" | "Economic Times" | "Moneycontrol" | "LiveMint" | "Financial Times",
      "sentiment": "Positive" | "Negative" | "Neutral",
      "magnitude": "High" | "Medium" | "Low",
      "impact": "One sentence explaining likely price impact",
      "priceDirection": "rise" | "fall" | "stable"
    }
  ],
  "overallSentiment": "Positive" | "Negative" | "Neutral",
  "sentimentScore": 45-75
}

Mix sentiments realistically — not all positive. Make headlines specific to this company, not generic.`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim();
  const analyze = searchParams.get('analyze') !== 'false';

  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    let articles = [];
    let sentimentData = null;
    let source = 'live';

    // ── Try Finnhub first ─────────────────────────────────────────────────
    const raw = await getCompanyNews(symbol);
    articles = (raw || []).slice(0, 8).map(n => ({
      id: n.id,
      headline: n.headline,
      summary: n.summary || '',
      source: n.source,
      url: n.url,
      datetime: n.datetime * 1000,
      image: n.image || null,
      category: n.category,
    }));

    // ── If no Finnhub news, use Gemini to generate demo news ──────────────
    if (articles.length === 0 && hasGeminiKey()) {
      source = 'ai-generated';
      try {
        const raw = await generateText(
          NEWS_GEN_PROMPT,
          `Generate news for: ${symbol.toUpperCase().replace('.NS','').replace('.BO','')}`,
          { maxTokens: 1500, json: true }
        );
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

        const links = getLinksForSymbol(symbol);
        articles = (parsed.articles || []).map((a, i) => ({
          ...a,
          url: links[i % links.length],
          datetime: Date.now() - i * 2 * 3600 * 1000, // stagger by 2h
          id: i + 1,
        }));
        sentimentData = {
          overallSentiment: parsed.overallSentiment,
          sentimentScore: parsed.sentimentScore,
          source: 'AI Analysis',
        };
      } catch (e) {
        console.error('Gemini news gen error:', e.message);
      }
    }

    // ── If we have Finnhub articles, run AI sentiment on them ─────────────
    if (articles.length > 0 && !sentimentData && analyze && hasGeminiKey()) {
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
        sentimentData = {
          overallSentiment: parsed.overallSentiment,
          sentimentScore: parsed.sentimentScore,
        };
        if (parsed.items) {
          articles = articles.map((a, i) => ({
            ...a,
            ...(parsed.items[i] || { sentiment: 'Neutral', magnitude: 'Low', impact: '' }),
          }));
        }
      } catch {
        articles = articles.map(a => ({ ...a, ...basicSentiment(a.headline + ' ' + (a.summary || '')) }));
      }
    }

    // ── Keyword sentiment fallback if no AI ───────────────────────────────
    if (articles.length > 0 && !sentimentData) {
      articles = articles.map(a => ({ ...a, ...basicSentiment(a.headline + ' ' + (a.summary || '')) }));
    }

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        articles: [],
        sentiment: null,
        message: hasGeminiKey()
          ? 'No news found for this symbol.'
          : 'Configure FINNHUB_API_KEY or GEMINI_API_KEY in config.js to see news.',
      });
    }

    return NextResponse.json({ success: true, articles, sentiment: sentimentData, count: articles.length, source });
  } catch (err) {
    console.error('News error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function basicSentiment(text) {
  const t = text.toLowerCase();
  const pos = ['surge','gain','beat','profit','growth','record','upgrade','strong','rally','rise','high','bullish','launch','expand','record'];
  const neg = ['fall','drop','loss','miss','decline','downgrade','weak','risk','concern','cut','bearish','crash','probe','lawsuit','fine'];
  const p = pos.filter(w => t.includes(w)).length;
  const n = neg.filter(w => t.includes(w)).length;
  if (p > n) return { sentiment: 'Positive', magnitude: p > 2 ? 'High' : 'Medium', priceDirection: 'rise', impact: 'Positive news may support price' };
  if (n > p) return { sentiment: 'Negative', magnitude: n > 2 ? 'High' : 'Medium', priceDirection: 'fall', impact: 'Negative news may pressure price' };
  return { sentiment: 'Neutral', magnitude: 'Low', priceDirection: 'stable', impact: 'Limited price impact expected' };
}
