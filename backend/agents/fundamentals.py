from typing import Dict, Any
from backend.agents.utils import query_llm

async def run_fundamentals_analysis(ticker: str, fundamentals: Dict[str, Any]) -> str:
    """
    Runs LLM-driven fundamentals analysis on yfinance financials.
    """
    prompt = f"""
You are a senior Fundamentals Analyst at a quantitative trading firm.
Your task is to write a detailed, professional fundamental research report for the stock ticker '{ticker}'.

Analyze the following company metrics:
- Company Name: {fundamentals.get('name')}
- Sector & Industry: {fundamentals.get('sector')} / {fundamentals.get('industry')}
- Current Price: {fundamentals.get('current_price')} {fundamentals.get('currency')}
- Market Cap: {fundamentals.get('market_cap')}
- P/E Ratio: {fundamentals.get('pe_ratio')}
- Forward P/E: {fundamentals.get('forward_pe')}
- PEG Ratio: {fundamentals.get('peg_ratio')}
- Price to Book (P/B): {fundamentals.get('price_to_book')}
- Debt to Equity: {fundamentals.get('debt_to_equity')}
- Return on Equity (ROE): {fundamentals.get('return_on_equity')}
- Profit Margin: {fundamentals.get('profit_margin')}
- Dividend Yield: {fundamentals.get('dividend_yield')}
- Business Summary: {fundamentals.get('description')}

Write a concise but comprehensive report covering:
1. **Valuation Assessment**: Assess P/E, Forward P/E, PEG, and P/B relative to standard benchmarks. Is the stock undervalued, fairly valued, or overvalued?
2. **Financial Health & Profitability**: Evaluate margins, ROE, and debt-to-equity levels.
3. **Core Strengths**: Highlight the top business strengths.
4. **Key Red Flags**: Detail any warning signs (e.g. high debt, low margins, stretched valuations).
5. **Analyst Recommendation**: Conclude with a strong, fundamental-driven rating: BUY, HOLD, or SELL with brief reasoning.

Use professional, objective financial language. Format the report using clean Markdown.
Do not include any greeting or conversational filler. Start directly with the markdown report.
"""
    messages = [
        {"role": "system", "content": "You are a professional financial research analyst specialising in fundamental analysis. Output raw markdown reports."},
        {"role": "user", "content": prompt}
    ]
    
    return await query_llm(messages, json_mode=False)
