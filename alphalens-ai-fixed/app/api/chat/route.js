// app/api/chat/route.js
import { NextResponse } from 'next/server';
import { generateText } from '../../lib/ai';
import { CHAT_SYSTEM_PROMPT } from '../../utils/prompts';

export async function POST(request) {
  try {
    const { message, stockContext, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build context-aware system prompt
    let systemPrompt = CHAT_SYSTEM_PROMPT;
    if (stockContext) {
      systemPrompt += `\n\nCURRENT STOCK CONTEXT:\n${buildStockContextString(stockContext)}`;
    }

    // Build conversation history for multi-turn
    let fullPrompt = message;
    if (history && history.length > 0) {
      const historyText = history
        .slice(-6) // Last 3 exchanges
        .map((m) => `${m.role === 'user' ? 'User' : 'AlphaLens'}: ${m.content}`)
        .join('\n');
      fullPrompt = `Conversation history:\n${historyText}\n\nUser: ${message}`;
    }

    const response = await generateText(systemPrompt, fullPrompt, {
      maxTokens: 900,
      temperature: 0.75,
    });

    // Parse structured response
    const parsed = parseStructuredResponse(response);

    return NextResponse.json({
      success: true,
      raw: response,
      parsed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildStockContextString(stock) {
  return `
Symbol: ${stock.displaySymbol || stock.symbol}
Company: ${stock.name}
Price: ${stock.currencySymbol}${stock.price?.toFixed(2)}
Change: ${stock.changePercent?.toFixed(2)}%
Sector: ${stock.sector}
52W High: ${stock.currencySymbol}${stock.week52High?.toFixed(2)}
52W Low: ${stock.currencySymbol}${stock.week52Low?.toFixed(2)}
P/E: ${stock.peRatio?.toFixed(2) || 'N/A'}
Market Cap: ${stock.marketCap ? (stock.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
Volume vs Avg: ${stock.volumeRatio}x
`.trim();
}

function parseStructuredResponse(raw) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const result = {
    short: '',
    context: [],
    signals: [],
    risks: [],
    action: '',
    confidence: 70,
    confidenceReason: '',
  };

  let section = '';

  for (const line of lines) {
    if (line.startsWith('Short Answer:')) {
      result.short = line.replace('Short Answer:', '').trim();
      section = '';
    } else if (line.startsWith('Market Context:')) {
      section = 'context';
    } else if (line.startsWith('Key Signals:')) {
      section = 'signals';
    } else if (line.startsWith('Risks:')) {
      section = 'risks';
    } else if (line.startsWith('Suggested Action:')) {
      result.action = line.replace('Suggested Action:', '').trim();
      section = '';
    } else if (line.startsWith('Confidence:')) {
      const m = line.match(/(\d+)%/);
      if (m) result.confidence = parseInt(m[1]);
      const reasonParts = line.split('—');
      if (reasonParts[1]) result.confidenceReason = reasonParts[1].trim();
      section = '';
    } else if ((line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) && section) {
      const bullet = line.replace(/^[•\-\*]\s*/, '');
      if (result[section]) result[section].push(bullet);
    }
  }

  // Fallbacks
  if (!result.short) result.short = lines[0] || raw.slice(0, 200);
  if (!result.action) result.action = 'Monitor position closely and reassess on next catalyst.';

  return result;
}
