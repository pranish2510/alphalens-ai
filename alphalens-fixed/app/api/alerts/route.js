// app/api/alerts/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { stockData, newsData, thesisData } = await request.json();
    const alerts = generateAlerts(stockData, newsData, thesisData);
    return NextResponse.json({ success: true, alerts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generateAlerts(stock, news, thesis) {
  const alerts = [];
  const now = new Date();

  if (!stock) return alerts;

  // Volume spike alert
  if (stock.volumeRatio >= 2) {
    alerts.push({
      id: 'vol-spike',
      type: 'volume',
      severity: stock.volumeRatio >= 3 ? 'critical' : 'warning',
      title: 'Volume Spike Detected',
      message: `Trading at ${stock.volumeRatio}x average volume. Unusual institutional activity may be signaling a move.`,
      icon: '📊',
      timestamp: now.toISOString(),
    });
  }

  // Abnormal price move
  const absPct = Math.abs(stock.changePercent || 0);
  if (absPct >= 5) {
    alerts.push({
      id: 'price-move',
      type: 'price',
      severity: absPct >= 10 ? 'critical' : 'warning',
      title: absPct >= 10 ? 'Extreme Price Movement' : 'Significant Price Move',
      message: `${stock.displaySymbol} moved ${stock.changePercent > 0 ? '+' : ''}${stock.changePercent?.toFixed(2)}% today. Check for news catalysts.`,
      icon: stock.changePercent > 0 ? '📈' : '📉',
      timestamp: now.toISOString(),
    });
  }

  // Near 52-week high
  if (stock.rangePosition >= 90) {
    alerts.push({
      id: '52w-high',
      type: 'technical',
      severity: 'info',
      title: 'Near 52-Week High',
      message: `${stock.displaySymbol} is at the ${stock.rangePosition}th percentile of its 52-week range. Resistance may be near.`,
      icon: '🔝',
      timestamp: now.toISOString(),
    });
  }

  // Near 52-week low
  if (stock.rangePosition <= 10) {
    alerts.push({
      id: '52w-low',
      type: 'technical',
      severity: 'warning',
      title: 'Near 52-Week Low',
      message: `${stock.displaySymbol} is trading near its 52-week low. Potential capitulation or value opportunity.`,
      icon: '⚠️',
      timestamp: now.toISOString(),
    });
  }

  // Sentiment shift (if news data available)
  if (news?.sentiment) {
    const score = news.sentiment.sentimentScore || 50;
    if (score >= 75) {
      alerts.push({
        id: 'sent-positive',
        type: 'sentiment',
        severity: 'info',
        title: 'Strong Positive Sentiment',
        message: `News sentiment score: ${score}/100. Recent coverage is overwhelmingly positive — check for over-hype risk.`,
        icon: '🟢',
        timestamp: now.toISOString(),
      });
    } else if (score <= 30) {
      alerts.push({
        id: 'sent-negative',
        type: 'sentiment',
        severity: 'warning',
        title: 'Negative Sentiment Alert',
        message: `News sentiment score: ${score}/100. Negative coverage may continue to pressure the stock.`,
        icon: '🔴',
        timestamp: now.toISOString(),
      });
    }
  }

  // Pump and dump flags
  if (stock.pumpFlags && stock.pumpFlags.length >= 2) {
    alerts.push({
      id: 'pump-risk',
      type: 'fraud',
      severity: 'critical',
      title: 'Potential Manipulation Detected',
      message: `⚠️ Multiple pump indicators: ${stock.pumpFlags.join('; ')}. Exercise extreme caution.`,
      icon: '🚨',
      timestamp: now.toISOString(),
    });
  }

  // AI thesis contradiction
  if (thesis?.thesis) {
    const rec = thesis.thesis.recommendation;
    const isDown = (stock.changePercent || 0) < -3;
    if (rec === 'BUY' && isDown) {
      alerts.push({
        id: 'thesis-contra',
        type: 'analysis',
        severity: 'info',
        title: 'Thesis vs Price Divergence',
        message: `AI rates ${stock.displaySymbol} as BUY but price is down ${Math.abs(stock.changePercent).toFixed(1)}% today. Could be an accumulation opportunity or thesis break.`,
        icon: '🔄',
        timestamp: now.toISOString(),
      });
    }
  }

  return alerts;
}
