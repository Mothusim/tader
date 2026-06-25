import pandas as pd
import numpy as np
from ta.trend import SMAIndicator, MACD, EMAIndicator
from ta.momentum import RSIIndicator
from typing import List, Dict, Any

def calculate_indicators(history_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates technical indicators (SMA, EMA, RSI, MACD) from historical data.
    """
    if len(history_data) < 20:
        return {
            "rsi": None,
            "macd": None,
            "macd_signal": None,
            "sma_50": None,
            "sma_200": None,
            "ema_20": None,
            "latest_signals": {}
        }
        
    df = pd.DataFrame(history_data)
    close_prices = df["close"]
    
    # Calculate SMA 50
    sma_50_series = SMAIndicator(close=close_prices, window=min(50, len(close_prices))).sma_indicator()
    # Calculate SMA 200
    sma_200_series = SMAIndicator(close=close_prices, window=min(200, len(close_prices))).sma_indicator()
    # Calculate EMA 20
    ema_20_series = EMAIndicator(close=close_prices, window=min(20, len(close_prices))).ema_indicator()
    # Calculate RSI
    rsi_series = RSIIndicator(close=close_prices, window=min(14, len(close_prices))).rsi()
    # Calculate MACD
    macd_indicator = MACD(close=close_prices)
    macd_series = macd_indicator.macd()
    macd_signal_series = macd_indicator.macd_signal()
    
    # Fill NaN values with None for JSON serialization
    df["sma_50"] = sma_50_series.replace({np.nan: None})
    df["sma_200"] = sma_200_series.replace({np.nan: None})
    df["ema_20"] = ema_20_series.replace({np.nan: None})
    df["rsi"] = rsi_series.replace({np.nan: None})
    df["macd"] = macd_series.replace({np.nan: None})
    df["macd_signal"] = macd_signal_series.replace({np.nan: None})
    
    # Latest value checks for signals
    latest_rsi = df["rsi"].iloc[-1]
    latest_close = df["close"].iloc[-1]
    latest_sma_50 = df["sma_50"].iloc[-1]
    latest_sma_200 = df["sma_200"].iloc[-1]
    latest_macd = df["macd"].iloc[-1]
    latest_macd_signal = df["macd_signal"].iloc[-1]
    
    # General signal logic
    rsi_signal = "NEUTRAL"
    if latest_rsi is not None:
        if latest_rsi > 70:
            rsi_signal = "OVERBOUGHT (SELL)"
        elif latest_rsi < 30:
            rsi_signal = "OVERSOLD (BUY)"
            
    trend_signal = "NEUTRAL"
    if latest_sma_50 is not None and latest_sma_200 is not None:
        if latest_sma_50 > latest_sma_200:
            trend_signal = "BULLISH (SMA 50 > SMA 200)"
        else:
            trend_signal = "BEARISH (SMA 50 < SMA 200)"
            
    macd_signal = "NEUTRAL"
    if latest_macd is not None and latest_macd_signal is not None:
        if latest_macd > latest_macd_signal:
            macd_signal = "BULLISH CROSSOVER (BUY)"
        else:
            macd_signal = "BEARISH CROSSOVER (SELL)"
            
    latest_indicators = {
        "rsi": float(latest_rsi) if latest_rsi is not None else None,
        "macd": float(latest_macd) if latest_macd is not None else None,
        "macd_signal": float(latest_macd_signal) if latest_macd_signal is not None else None,
        "sma_50": float(latest_sma_50) if latest_sma_50 is not None else None,
        "sma_200": float(latest_sma_200) if latest_sma_200 is not None else None,
        "rsi_signal": rsi_signal,
        "trend_signal": trend_signal,
        "macd_signal_label": macd_signal
    }
    
    # Format detailed history series to return to frontend
    indicator_history = []
    for idx, row in df.iterrows():
        indicator_history.append({
            "date": row["date"],
            "close": row["close"],
            "sma_50": row["sma_50"],
            "sma_200": row["sma_200"],
            "ema_20": row["ema_20"],
            "rsi": row["rsi"],
            "macd": row["macd"],
            "macd_signal": row["macd_signal"]
        })
        
    return {
        "latest": latest_indicators,
        "history": indicator_history
    }
