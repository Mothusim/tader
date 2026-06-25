from typing import List, Dict
from backend.agents.utils import query_llm

async def run_debate(
    ticker: str,
    fundamentals_report: str,
    technical_report: str,
    sentiment_report: str
) -> List[Dict[str, str]]:
    """
    Orchestrates a 4-turn structured debate between a Bullish Researcher and a Bearish Researcher.
    """
    
    # 1. Round 1: Bullish Researcher presents the initial thesis
    bullish_system = f"""
You are the Lead Bullish Researcher at a quantitative trading firm.
Your job is to read analyst reports for '{ticker}' and argue a persuasive, logical, and evidence-backed BUY case.
Focus on undervalued assets, growth catalysts, positive technical breakouts, or high sentiment momentum.
Defend your thesis vigorously but professionally.
"""
    bullish_r1_prompt = f"""
Here are the reports compiled by our analyst team for ticker '{ticker}':

### Fundamentals Analyst Report:
{fundamentals_report}

### Technical Analyst Report:
{technical_report}

### Sentiment Analyst Report:
{sentiment_report}

Please review this information and write your initial BUY thesis (Round 1 of the debate).
Focus on the most promising indicators, financial strengths, positive news, and potential catalysts that warrant a buy recommendation.
Do not include any greeting or conversational filler. Start directly with your thesis.
"""
    messages_bull = [
        {"role": "system", "content": bullish_system},
        {"role": "user", "content": bullish_r1_prompt}
    ]
    bullish_1 = await query_llm(messages_bull)

    # 2. Round 2: Bearish Researcher reviews the thesis and presents counterarguments
    bearish_system = f"""
You are the Lead Bearish Researcher at a quantitative trading firm.
Your job is to read analyst reports for '{ticker}' and argue a skeptical, risk-aware SELL or HOLD case.
Analyze high debt, overstretched valuations, poor cash flows, negative news, or bearish chart signals.
Address the Bullish Researcher's points directly and explain why their arguments are overoptimistic or fail to account for hidden risks.
"""
    bearish_r1_prompt = f"""
Here are the analyst reports for ticker '{ticker}':

### Fundamentals Analyst Report:
{fundamentals_report}

### Technical Analyst Report:
{technical_report}

### Sentiment Analyst Report:
{sentiment_report}

Here is the initial BUY thesis presented by the Bullish Researcher:
---
{bullish_1}
---

Please write your critique and counter-thesis (Round 2 of the debate).
Highlight specific risks, warning signs, valuation traps, and rebut the Bullish Researcher's points directly.
Do not include any greeting or conversational filler. Start directly with your critique.
"""
    messages_bear = [
        {"role": "system", "content": bearish_system},
        {"role": "user", "content": bearish_r1_prompt}
    ]
    bearish_1 = await query_llm(messages_bear)

    # 3. Round 3: Bullish Researcher counter-rebuttal
    bullish_r2_prompt = f"""
The Bearish Researcher has critiqued your thesis:
---
{bearish_1}
---

Please write your counter-rebuttal (Round 3 of the debate).
Address their criticisms directly. Explain why their concerns are exaggerated, factored into the current price, or why the growth catalysts outweigh the risks they pointed out.
Do not include any greeting or conversational filler. Start directly.
"""
    # Append history to bullish message list
    messages_bull.append({"role": "assistant", "content": bullish_1})
    messages_bull.append({"role": "user", "content": bearish_r1_prompt + "\n\n" + bearish_r1_prompt}) # Give it context
    # Let's clean the history and just send the direct prompt to prevent context dilution
    messages_bull_r2 = [
        {"role": "system", "content": bullish_system},
        {"role": "user", "content": f"Here is your initial thesis:\n\n{bullish_1}\n\nHere is the Bearish Researcher's critique:\n\n{bearish_1}\n\nPlease write your counter-rebuttal (Round 3) responding to these points."}
    ]
    bullish_2 = await query_llm(messages_bull_r2)

    # 4. Round 4: Bearish Researcher conclusion & warning summary
    messages_bear_r2 = [
        {"role": "system", "content": bearish_system},
        {"role": "user", "content": f"Here is your critique:\n\n{bearish_1}\n\nHere is the Bullish Researcher's counter-rebuttal:\n\n{bullish_2}\n\nPlease write your final conclusion (Round 4) highlighting the critical warning signs and why caution is still advised."}
    ]
    bearish_2 = await query_llm(messages_bear_r2)

    return [
        {"role": "bullish", "message": bullish_1},
        {"role": "bearish", "message": bearish_1},
        {"role": "bullish_rebuttal", "message": bullish_2},
        {"role": "bearish_conclusion", "message": bearish_2}
    ]
