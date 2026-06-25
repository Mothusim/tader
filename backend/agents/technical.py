from typing import Dict, Any
from backend.agents.utils import query_llm

async def run_technical_analysis(ticker: str, technicals: Dict[str, Any]) -> str:
    """
    Runs LLM-driven technical analysis on yfinance indicators.
    """
    latest = technicals.get("latest", {})
    
    prompt = f"""
You are a senior Technical Analyst at a quantitative trading firm.
Your task is to write a detailed, professional technical research report for the stock ticker '{ticker}'.

Analyze the following technical indicator state:
- RSI (14): {latest.get('rsi')} ({latest.get('rsi_signal')})
- Trend State (SMA 50 vs 200): {latest.get('sma_50')} / {latest.get('sma_200')} ({latest.get('trend_signal')})
- MACD Signal: {latest.get('macd')} (Signal: {latest.get('macd_signal')}, Verdict: {latest.get('macd_signal_label')})

Write a concise but comprehensive report covering:
1. **Trend Analysis**: Assess SMA 50 vs 200 (is there a Golden Cross or Death Cross?) and general direction.
2. **Momentum (RSI)**: Interpret the RSI (14) indicator. Is it in overbought, oversold, or neutral zones? What does this mean for immediate price action?
3. **Crossover & Convergence (MACD)**: Explain the MACD line vs the signal line. Is there a bullish or bearish crossover?
4. **Short-Term Outlook**: Provide a technical projection for the next 5-10 trading days.
5. **Key Support/Resistance Indicators**: Discuss typical indicators or zones to watch.
6. **Analyst Recommendation**: Conclude with a strong, technical-driven rating: BUY, HOLD, or SELL with brief reasoning.

Use professional, objective technical analyst language. Format the report using clean Markdown.
Do not include any greeting or conversational filler. Start directly with the markdown report.
"""
    messages = [
        {"role": "system", "content": "You are a professional financial research analyst specialising in technical analysis and chart pattern recognition. Output raw markdown reports."},
        {"role": "user", "content": prompt}
    ]
    
    return await query_llm(messages, json_mode=False)
