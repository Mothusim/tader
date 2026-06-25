"""
Unit tests for technical analysis calculations.
Run: pytest backend/tests/test_technical.py -v
"""
import pytest
import sys
import os

# Ensure the project root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.services.technical_analysis import calculate_indicators

# Generate simple mock price data
def make_history(prices):
    return [
        {"date": f"2024-{str(i+1).zfill(2)}-01", "open": p, "high": p+1, "low": p-1, "close": p, "volume": 1000000}
        for i, p in enumerate(prices)
    ]

class TestCalculateIndicators:
    def test_empty_history_returns_none_values(self):
        result = calculate_indicators([])
        assert result["latest"]["rsi"] is None
        assert result["latest"]["sma_50"] is None

    def test_short_history_below_minimum(self):
        history = make_history([100.0] * 15)  # Less than 20 points
        result = calculate_indicators(history)
        assert result["latest"]["rsi"] is None

    def test_valid_history_returns_values(self):
        # Generate 200 synthetic prices (trending upward)
        prices = [100 + i * 0.5 for i in range(200)]
        history = make_history(prices)
        result = calculate_indicators(history)
        assert result["latest"]["rsi"] is not None
        assert result["latest"]["sma_50"] is not None
        assert 0 <= result["latest"]["rsi"] <= 100

    def test_overbought_rsi_on_strong_uptrend(self):
        # Strongly rising prices should produce high RSI
        prices = [100 + i * 3 for i in range(60)]
        history = make_history(prices)
        result = calculate_indicators(history)
        if result["latest"]["rsi"] is not None:
            assert result["latest"]["rsi"] > 50  # should be trending high

    def test_sma50_greater_than_sma200_on_uptrend(self):
        # Uptrending data: SMA50 should be higher than SMA200
        prices = [50 + i * 0.8 for i in range(220)]
        history = make_history(prices)
        result = calculate_indicators(history)
        latest = result["latest"]
        if latest["sma_50"] and latest["sma_200"]:
            assert latest["sma_50"] > latest["sma_200"]
            assert "BULLISH" in latest["trend_signal"]

    def test_history_contains_all_expected_keys(self):
        prices = [100 + i * 0.5 for i in range(100)]
        history = make_history(prices)
        result = calculate_indicators(history)
        for row in result["history"]:
            assert "date" in row
            assert "close" in row
            assert "sma_50" in row
            assert "rsi" in row
            assert "macd" in row
