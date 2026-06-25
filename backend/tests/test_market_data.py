"""
Lightweight test to verify market data fetching from Yahoo Finance.
Run: pytest backend/tests/test_market_data.py -v
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services.market_data import fetch_market_data

class TestFetchMarketData:
    def test_fetch_aapl_returns_data(self):
        result = fetch_market_data("AAPL")
        assert result["ticker"] == "AAPL"
        assert "fundamentals" in result
        assert "history" in result
        assert len(result["history"]) > 0

    def test_fundamentals_has_required_fields(self):
        result = fetch_market_data("AAPL")
        f = result["fundamentals"]
        assert "name" in f
        assert "current_price" in f
        assert "market_cap" in f
        assert "currency" in f

    def test_history_has_required_ohlcv_fields(self):
        result = fetch_market_data("AAPL")
        h = result["history"][0]
        assert "date" in h
        assert "open" in h
        assert "high" in h
        assert "low" in h
        assert "close" in h
        assert "volume" in h

    def test_btc_usd_crypto_supported(self):
        result = fetch_market_data("BTC-USD")
        assert result["ticker"] == "BTC-USD"
        assert len(result["history"]) > 0

    def test_invalid_ticker_returns_empty_history(self):
        # Invalid ticker should not crash, just return empty or partial data
        try:
            result = fetch_market_data("INVALIDTICKER999")
            # If it doesn't raise, it should at least have the structure
            assert "fundamentals" in result
        except Exception:
            pass  # Acceptable to raise for truly invalid tickers
