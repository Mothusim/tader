import json
from typing import Dict, Any, List
from backend.agents.utils import query_llm

async def run_trader_analysis(
    ticker: str,
    fundamentals_report: str,
    technical_report: str,
    sentiment_report: str,
    debate_log: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    Trader Agent reviews all reports and the debate, and makes the final investment decision.
    """
    debate_transcript = ""
    for turn in debate_log:
        role_label = "BULLISH RESEARCHER" if turn["role"].startswith("bullish") else "BEARISH RESEARCHER"
        debate_transcript += f"### {role_label}:\n{turn['message']}\n\n"
        
    prompt = f"""
You are the Chief Investment Officer and Lead Trader at a quantitative hedge fund.
Your task is to review all analyst reports and the structured debate transcript for ticker '{ticker}' and make the final investment decision.

### Analyst Reports:
1. **Fundamentals Report**:
{fundamentals_report}

2. **Technical Report**:
{technical_report}

3. **Sentiment Report**:
{sentiment_report}

### Researcher Debate Transcript:
{debate_transcript}

Make a definitive decision. Weigh the growth arguments of the Bullish Researcher against the risk arguments of the Bearish Researcher.

Respond ONLY with a JSON object. Do not include any greeting, explanation, or conversational filler. Do not wrap the JSON in markdown code blocks. The response must be a valid JSON object matching this schema:
{{
  "verdict": "BUY" | "HOLD" | "SELL",
  "confidence": <integer between 0 and 100>,
  "catalysts": [<list of top 3 growth factors or positive indicators supporting this decision>],
  "risks": [<list of top 3 warning signs or risk factors supporting this decision>],
  "summary": "<a detailed executive summary paragraph explaining your final decision, how you weighed the bull vs bear arguments, and the rationale behind your confidence score>"
}}
"""
    messages = [
        {"role": "system", "content": "You are a professional fund manager. Respond ONLY with a valid raw JSON object matching the requested schema."},
        {"role": "user", "content": prompt}
    ]
    
    raw_response = await query_llm(messages, json_mode=True)
    
    try:
        decision = json.loads(raw_response)
        # Validate keys
        required_keys = ["verdict", "confidence", "catalysts", "risks", "summary"]
        for key in required_keys:
            if key not in decision:
                raise ValueError(f"Missing key in LLM response: {key}")
        return decision
    except Exception as e:
        print(f"Failed to parse Trader Agent JSON response: {e}. Raw response: {raw_response}")
        # Fallback response
        return {
            "verdict": "HOLD",
            "confidence": 50,
            "catalysts": ["Unable to parse final decision logs."],
            "risks": ["System fallback mode active."],
            "summary": "The Trader Agent failed to form a parsed JSON decision. Please check the logs. Fallback rating is HOLD."
        }
