import yfinance as yf
import pandas as pd
from typing import Dict, Any, Optional

def fetch_market_data(ticker_symbol: str) -> Dict[str, Any]:
    """
    Fetches historical price data and fundamental metrics for a given ticker.
    """
    ticker = yf.Ticker(ticker_symbol)
    
    # 1. Fetch historical price history (1 year, daily)
    history = ticker.history(period="1y")
    history_list = []
    if not history.empty:
        # Format for charting
        history = history.reset_index()
        for _, row in history.iterrows():
            history_list.append({
                "date": row["Date"].strftime("%Y-%m-%d"),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"])
            })
            
    # 2. Fetch Info / Fundamental statistics
    info = ticker.info or {}
    
    fundamentals = {
        "name": info.get("longName") or info.get("shortName") or ticker_symbol,
        "sector": info.get("sector") or "N/A",
        "industry": info.get("industry") or "N/A",
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
        "forward_pe": info.get("forwardPE"),
        "peg_ratio": info.get("pegRatio"),
        "price_to_book": info.get("priceToBook"),
        "debt_to_equity": info.get("debtToEquity"),
        "return_on_equity": info.get("returnOnEquity"),
        "profit_margin": info.get("profitMargins"),
        "dividend_yield": info.get("dividendYield"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice") or (history_list[-1]["close"] if history_list else None),
        "currency": info.get("currency") or "USD",
        "description": info.get("longBusinessSummary") or "No description available."
    }

    return {
        "ticker": ticker_symbol,
        "fundamentals": fundamentals,
        "history": history_list
    }
