from typing import Dict, Any, List
from backend.agents.fundamentals import run_fundamentals_analysis
from backend.agents.technical import run_technical_analysis
from backend.agents.sentiment import run_sentiment_analysis
from backend.agents.debate import run_debate
from backend.agents.trader import run_trader_analysis

async def run_analysis(
    ticker: str,
    fundamentals: Dict[str, Any],
    technicals: Dict[str, Any],
    news: List[Dict[str, Any]],
    social: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Coordinates the sequential multi-agent research pipeline.
    """
    # 1. Run analyst reports in parallel/sequence
    print(f"[{ticker}] Running Fundamentals Analyst...")
    fundamentals_report = await run_fundamentals_analysis(ticker, fundamentals)
    
    print(f"[{ticker}] Running Technical Analyst...")
    technical_report = await run_technical_analysis(ticker, technicals)
    
    print(f"[{ticker}] Running Sentiment Analyst...")
    sentiment_report = await run_sentiment_analysis(ticker, news, social)
    
    # 2. Run researcher debate loop
    print(f"[{ticker}] Running Bullish vs Bearish debate...")
    debate_log = await run_debate(
        ticker,
        fundamentals_report,
        technical_report,
        sentiment_report
    )
    
    # 3. Run final Trader decision maker
    print(f"[{ticker}] Running Trader Agent decision...")
    trader_decision = await run_trader_analysis(
        ticker,
        fundamentals_report,
        technical_report,
        sentiment_report,
        debate_log
    )
    
    # Combine everything under the recommendation payload format
    return {
        "verdict": trader_decision.get("verdict", "HOLD"),
        "confidence": trader_decision.get("confidence", 50),
        "catalysts": trader_decision.get("catalysts", []),
        "risks": trader_decision.get("risks", []),
        "summary": trader_decision.get("summary", ""),
        "agent_reports": {
            "fundamentals": fundamentals_report,
            "technical": technical_report,
            "sentiment": sentiment_report
        },
        "debate_log": debate_log
    }
