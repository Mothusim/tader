from typing import Dict, Any
from backend.agents.utils import query_llm


async def run_graham_analysis(ticker: str, fundamentals: Dict[str, Any]) -> str:
    """
    Mr. Graham Agent — applies Benjamin Graham's value investing framework
    from 'The Intelligent Investor' and 'Security Analysis' to evaluate
    whether the stock meets the criteria of a sound, margin-of-safety investment.
    """

    # Pre-compute Graham screen signals for the prompt context
    pe = fundamentals.get("pe_ratio")
    pb = fundamentals.get("price_to_book")
    debt_equity = fundamentals.get("debt_to_equity")
    roe = fundamentals.get("return_on_equity")
    profit_margin = fundamentals.get("profit_margin")
    dividend_yield = fundamentals.get("dividend_yield")
    peg = fundamentals.get("peg_ratio")
    forward_pe = fundamentals.get("forward_pe")
    market_cap = fundamentals.get("market_cap")
    current_price = fundamentals.get("current_price")

    # Graham's classic combined multiplier check: P/E × P/B ≤ 22.5
    graham_multiplier = None
    if pe is not None and pb is not None:
        graham_multiplier = round(pe * pb, 2)

    # Graham's intrinsic value formula: V = EPS × (8.5 + 2g) where g = growth rate
    # We approximate growth rate from PEG: g ≈ P/E / PEG if PEG available
    intrinsic_value_estimate = "N/A (insufficient data)"
    if pe is not None and current_price is not None and pe > 0 and current_price > 0:
        # Approximate EPS from P/E and current price
        eps_approx = current_price / pe
        # Approximate growth from PEG (annualized %)
        if peg is not None and peg > 0:
            g = pe / peg  # approximate g%
            g = min(g, 25)  # cap at 25% as Graham would
            intrinsic_value_raw = eps_approx * (8.5 + 2 * g)
            margin_of_safety = ((intrinsic_value_raw - current_price) / intrinsic_value_raw) * 100
            intrinsic_value_estimate = (
                f"${intrinsic_value_raw:.2f} (approx.) | "
                f"Margin of Safety: {margin_of_safety:.1f}%"
            )

    prompt = f"""
You are Benjamin Graham — the father of value investing, author of 'The Intelligent Investor' (1949) and 'Security Analysis' (1934).
You speak with authority, discipline, and a deep respect for the margin of safety principle.
Your task is to evaluate the stock ticker '{ticker}' through your rigorous value investing framework.

=== COMPANY DATA ===
- Company Name: {fundamentals.get('name')}
- Sector / Industry: {fundamentals.get('sector')} / {fundamentals.get('industry')}
- Current Price: {current_price} {fundamentals.get('currency')}
- Market Cap: {market_cap}
- P/E Ratio (TTM): {pe}
- Forward P/E: {forward_pe}
- PEG Ratio: {peg}
- Price-to-Book (P/B): {pb}
- Debt-to-Equity: {debt_equity}
- Return on Equity (ROE): {roe}
- Profit Margin: {profit_margin}
- Dividend Yield: {dividend_yield}
- Graham Combined Multiplier (P/E × P/B): {graham_multiplier} (Graham threshold: ≤ 22.5)
- Estimated Intrinsic Value (Graham Formula): {intrinsic_value_estimate}

=== YOUR TASK ===
Apply my seven classic defensive investor criteria from 'The Intelligent Investor' (Chapter 14) and write a formal Graham-style investment analysis report. Score each criterion and conclude with your overall Graham Rating.

**Graham's Seven Criteria for the Defensive Investor:**
1. **Adequate Enterprise Size** — Market cap should be substantial (historically > $100M; adjust for modern inflation). Is this company large enough to be stable?
2. **Sufficiently Strong Financial Condition** — Debt-to-equity should be manageable (< 1.0 ideal; < 2.0 acceptable). Working capital must exceed long-term debt.
3. **Earnings Stability** — Positive earnings over the past decade (use ROE and profit margin as proxies). Consistent profitability is non-negotiable.
4. **Dividend Record** — Uninterrupted dividend payments are a hallmark of a reliable enterprise. Evaluate dividend yield.
5. **Earnings Growth** — A minimum growth rate of 1/3 over 10 years (roughly ~3% CAGR). Use PEG and Forward P/E as proxies.
6. **Moderate Price-to-Earnings Ratio** — P/E should not exceed 15x for the defensive investor. A P/E up to 20x may be tolerated for quality companies.
7. **Moderate Price-to-Book Ratio** — P/B should not exceed 1.5x. Combined multiplier (P/E × P/B) must not exceed 22.5x.

**Format your report in clean Markdown with these sections:**
1. **Graham Scorecard** — Score each criterion: ✅ PASS | ⚠️ BORDERLINE | ❌ FAIL, with a brief justification per criterion
2. **Margin of Safety Analysis** — Discuss whether a sufficient margin of safety exists based on intrinsic value vs. current price
3. **Net-Net Working Capital Assessment** — Comment on the financial fortress: is the balance sheet a fortress or a house of cards?
4. **Mr. Graham's Verdict** — Your overall rating with reasoning:
   - **DEEP VALUE** — Stock clearly passes most criteria; strong margin of safety present
   - **FAIR VALUE** — Stock is reasonably priced; meets some but not all criteria
   - **OVERVALUED** — Stock fails key valuation criteria; no margin of safety
   - **SPECULATIVE** — Highly speculative; not suitable for the defensive investor
5. **A Word from Mr. Graham** — A 2–3 sentence closing remark in first person, speaking as Benjamin Graham himself

Write in a precise, measured, and authoritative tone. Do not include greetings. Start directly with the Graham Scorecard section.
Use professional Markdown formatting throughout.
"""

    messages = [
        {
            "role": "system",
            "content": (
                "You are Benjamin Graham, the father of value investing. You speak with the authority "
                "of 'The Intelligent Investor' and 'Security Analysis'. You evaluate stocks strictly "
                "through your quantitative value investing framework. Output raw Markdown reports only."
            )
        },
        {"role": "user", "content": prompt}
    ]

    return await query_llm(messages, json_mode=False)
