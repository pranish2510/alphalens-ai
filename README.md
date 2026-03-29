# AlphaLens AI — Institutional Research Terminal
![WhatsApp Image 2026-03-29 at 8 05 19 AM](https://github.com/user-attachments/assets/61122143-8e3d-4a90-b227-789b4bcf6876)

![WhatsApp Image 2026-03-29 at 8 05 20 AM](https://github.com/user-attachments/assets/10d59ca8-66ab-409e-97d6-b7c609ac2e54)

![WhatsApp Image 2026-03-29 at 8 05 21 AM](https://github.com/user-attachments/assets/5cf9a1ff-b272-4616-8e0e-58cd7e02553e)

![WhatsApp Image 2026-03-29 at 8 05 22 AM](https://github.com/user-attachments/assets/e71e02a5-fd52-439b-869a-daa297aba4a9)

![WhatsApp Image 2026-03-29 at 8 06 05 AM](https://github.com/user-attachments/assets/da9c9be0-f483-4490-9424-f3a40fe45f94)






A full-stack AI-powered fintech application for real-time stock research, portfolio analysis, and market insights.

---

## 🚀 Quick Start

### 1. Clone / extract the project
```bash
cd alphalens-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
# Required: At least ONE AI provider
OPENAI_API_KEY=sk-...          # Get from https://platform.openai.com
# OR
GEMINI_API_KEY=AIza...         # Get from https://aistudio.google.com
AI_PROVIDER=openai             # "openai" or "gemini"

# Recommended: For US stocks, analyst ratings, and news
FINNHUB_API_KEY=...            # Free key at https://finnhub.io/register

# Optional: Broader news coverage
NEWS_API_KEY=...               # Free at https://newsapi.org/register
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + React |
| Styling | Tailwind CSS + CSS Variables |
| Backend | Next.js API Routes (Node.js) |
| Stock Data | Yahoo Finance (`yahoo-finance2`) |
| US Market Data | Finnhub API |
| AI | OpenAI GPT-4o-mini OR Google Gemini 1.5 Flash |
| OCR | Tesseract.js (client-side, no server needed) |
| News | Finnhub + NewsAPI |

---

## 🏗️ Project Structure

```
alphalens-ai/
├── app/
│   ├── page.js                    ← Main app shell
│   ├── layout.js                  ← Root layout
│   ├── globals.css                ← Global styles + design tokens
│   │
│   ├── components/
│   │   ├── Sidebar.jsx            ← Left navigation
│   │   ├── Topbar.jsx             ← Search + quick picks
│   │   ├── StockPanel.jsx         ← Main research view (center)
│   │   ├── ThesisBlock.jsx        ← AI investment thesis
│   │   ├── RiskSection.jsx        ← Risk exposure cards
│   │   ├── ChatPanel.jsx          ← AI chat (right rail)
│   │   ├── PortfolioTab.jsx       ← Portfolio OCR upload
│   │   ├── AlertsPanel.jsx        ← Smart alerts view
│   │   ├── RecommendationsPanel   ← Personalized stock picks
│   │   ├── ScamScanner.jsx        ← Fraud/pump detection
│   │   └── NewsPanel.jsx          ← News feed + sentiment
│   │
│   ├── api/
│   │   ├── stock/route.js         ← GET /api/stock?symbol=
│   │   ├── news/route.js          ← GET /api/news?symbol=
│   │   ├── analyst/route.js       ← POST /api/analyst
│   │   ├── chat/route.js          ← POST /api/chat
│   │   ├── recommendations/route  ← POST /api/recommendations
│   │   ├── alerts/route.js        ← POST /api/alerts
│   │   ├── portfolio/route.js     ← POST /api/portfolio
│   │   └── search/route.js        ← GET /api/search?q=
│   │
│   ├── lib/
│   │   ├── ai.js                  ← Unified AI provider (OpenAI/Gemini)
│   │   ├── yahoo.js               ← Yahoo Finance client
│   │   └── finnhub.js             ← Finnhub API client
│   │
│   └── utils/
│       └── prompts.js             ← All AI system prompts
│
├── .env.example                   ← Environment variables template
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔌 API Endpoints

### `GET /api/stock?symbol=RELIANCE`
Returns: price, change, 52W range, volume, P/E, sector, beta, pump flags

### `GET /api/news?symbol=INFY`
Returns: articles with AI sentiment tags (Positive/Negative/Neutral) + impact explanation

### `POST /api/analyst`
Body: `{ stockData, newsItems }`  
Returns: AI investment thesis (summary, opportunities, risks, recommendation, target price)

### `POST /api/chat`
Body: `{ message, stockContext, history }`  
Returns: Structured AI response (Short Answer, Market Context, Key Signals, Risks, Action, Confidence)

### `POST /api/recommendations`
Body: `{ riskTolerance, budget, goal, preferIndian, preferUS }`  
Returns: 4-5 personalized stock picks with allocation % and entry/target/stoploss

### `POST /api/alerts`
Body: `{ stockData, newsData, thesisData }`  
Returns: Smart alerts (volume spikes, price moves, sentiment shifts, pump flags)

### `POST /api/portfolio`
Body: `{ stocks: ['RELIANCE', 'TCS', ...], rawText }`  
Returns: Diversification score, risk level, weak/strong stocks, suggestions

### `GET /api/search?q=reliance`
Returns: Autocomplete results from Yahoo + Finnhub

---

## 🌟 Features

### ✅ Implemented
- **Stock Search**: NSE + BSE + NYSE + NASDAQ with autocomplete
- **Real-Time Data**: Price, volume, 52W range, P/E, beta via Yahoo Finance
- **US Stock Enhancement**: Finnhub integration for real analyst ratings
- **AI Investment Thesis**: Summary, opportunities, risks, recommendation
- **News + Sentiment**: Fetches news, tags each article Positive/Negative/Neutral
- **AI Chat**: Structured responses with Market Context, Key Signals, Risks, Confidence
- **Personalized Picks**: Form-based recommendations by risk/budget/goal
- **Scam/Risk Scanner**: Detects volume spikes, price anomalies, news hype
- **Smart Alerts**: Auto-generated on stock search
- **Portfolio OCR**: Upload Zerodha/Groww screenshot → AI analysis
- **Supports both OpenAI and Gemini**

---

## 🔑 API Keys Guide

| Key | Free Tier | What it unlocks |
|-----|-----------|-----------------|
| `OPENAI_API_KEY` | Pay-per-use (~$0.001/req) | AI thesis, chat, sentiment |
| `GEMINI_API_KEY` | 15 req/min free | Same as OpenAI (alternative) |
| `FINNHUB_API_KEY` | 60 req/min free | US stock data, real analyst ratings, news |
| `NEWS_API_KEY` | 100 req/day free | Broader news coverage |

**Minimum to run**: Just `OPENAI_API_KEY` or `GEMINI_API_KEY`. Yahoo Finance works without keys.

---

## 🚧 Production Deployment

```bash
npm run build
npm start
```

For Vercel:
```bash
vercel --prod
```
Add all environment variables in Vercel dashboard → Settings → Environment Variables.

---

## 📝 Notes

- Indian NSE stocks: just type the symbol (RELIANCE, INFY, TCS)  
- US stocks: type ticker directly (AAPL, NVDA, MSFT)  
- Portfolio OCR: best results with Zerodha Kite, Groww, Upstox screenshots  
- AI responses gracefully degrade if API key is missing  
