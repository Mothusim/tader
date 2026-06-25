# Tader - AI Investment Researcher & Advisor

A multi-tenant AI-powered Investment Researcher and Advisor built with FastAPI + Next.js.

---

## Project Structure

```
tader/
├── backend/              # FastAPI Python backend
│   ├── main.py           # API server entry point
│   ├── requirements.txt  # Python dependencies
│   ├── .env              # Backend environment variables (fill in your keys)
│   └── services/
│       ├── market_data.py       # Yahoo Finance data fetching
│       ├── technical_analysis.py # Technical indicators (RSI, MACD, SMA)
│       ├── sentiment_analysis.py # News RSS fetching
│       ├── social_media.py       # Reddit social sentiment
│       └── advisor.py            # OpenRouter AI recommendation engine
├── frontend/             # Next.js + shadcn/ui frontend
│   └── ...
└── supabase/
    └── schema.sql        # Run this in Supabase SQL Editor
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Supabase** free project at https://supabase.com
- **OpenRouter** free API key at https://openrouter.ai

---

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the SQL Editor and paste + run the contents of `supabase/schema.sql`.
3. Note your **Project URL** and **anon/service_role key** from Project Settings > API.

### 2. OpenRouter Setup

1. Create an account at [openrouter.ai](https://openrouter.ai).
2. Get a free API key from your dashboard.
3. The app uses the free `open-router/owl-alpha` model by default (configurable in `.env`).

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Fill in your API keys
# Edit backend/.env with your Supabase URL, Supabase Key, and OpenRouter API Key

# Start the backend
uvicorn backend.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies (already done during scaffold)
npm install

# Fill in your environment variables
# Edit frontend/.env.local with your Supabase URL and anon key

# Start the frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables

### `backend/.env`
```
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=open-router/owl-alpha
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
```

### `frontend/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Features

- 🔍 **Research any global stock, ETF, or crypto** (AAPL, BTC-USD, EURUSD=X, etc.)
- 📊 **Interactive Charts** with price history + SMA/EMA overlays
- 🧮 **Full Technical Analysis**: RSI, MACD, SMA 50/200, EMA 20
- 💼 **Fundamental Analysis**: P/E, Market Cap, Debt/Equity, Profit Margin, ROE
- 📰 **Live News Feed** from Google News RSS
- 💬 **Reddit Social Sentiment** from r/stocks, r/investing, r/wallstreetbets
- 🤖 **AI Advisor**: BUY / HOLD / SELL verdict with confidence score and full reasoning
- 🏢 **Multi-tenant**: Organizations with admin/employee roles and shared research
- 📋 **Shared Watchlist**: All employees in an org can see and contribute to watchlists
- 📜 **Research History**: All past analyses stored and searchable by org
