import os
import httpx
import json
from typing import Dict, Any, List

async def generate_recommendation(
    ticker: str,
    fundamentals: Dict[str, Any],
    technicals: Dict[str, Any],
    news: List[Dict[str, Any]],
    social: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Sends compiled stock findings to OpenRouter and retrieves the AI investment recommendation.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "open-router/owl-alpha")
    
    if not api_key or api_key == "your-openrouter-api-key-here":
        # Return fallback recommendation when API key is missing
        return {
            "verdict": "HOLD",
            "confidence": 50,
            "catalysts": ["API Key not configured. Using placeholder response."],
            "risks": ["Please set up your OpenRouter API key to receive AI-driven advice."],
            "summary": "This is a placeholder recommendation. Configure OPENROUTER_API_KEY in your backend/.env."
        }

    # Format data summaries for the LLM prompt
    news_titles = [f"- {item['title']} ({item['source']})" for item in news[:5]]
    social_titles = [f"- {item['title']} (Score: {item['score']}, Subreddit: {item['subreddit']})" for item in social[:5]]
    
    prompt = f"""
You are an expert financial researcher and investment advisor.
Analyze the following investment data for ticker '{ticker}' and provide a structured decision:

### Fundamental Metrics:
- Name: {fundamentals.get('name')}
- Price: {fundamentals.get('current_price')} {fundamentals.get('currency')}
- Market Cap: {fundamentals.get('market_cap')}
- P/E Ratio: {fundamentals.get('pe_ratio')}
- Forward P/E: {fundamentals.get('forward_pe')}
- PEG Ratio: {fundamentals.get('peg_ratio')}
- Debt to Equity: {fundamentals.get('debt_to_equity')}
- ROE: {fundamentals.get('return_on_equity')}
- Profit Margin: {fundamentals.get('profit_margin')}

### Technical Signals:
- RSI (14): {technicals.get('latest', {}).get('rsi')} ({technicals.get('latest', {}).get('rsi_signal')})
- Trend Signal: {technicals.get('latest', {}).get('trend_signal')}
- MACD Signal: {technicals.get('latest', {}).get('macd_signal_label')}

### Recent News:
{chr(10).join(news_titles) if news_titles else "No recent news."}

### Social Media Sentiment:
{chr(10).join(social_titles) if social_titles else "No recent social media mentions."}

Respond ONLY with a JSON object containing these keys:
- "verdict": "BUY" | "HOLD" | "SELL"
- "confidence": Integer between 0 and 100
- "catalysts": List of string key growth factors/bullish catalysts
- "risks": List of string key risk factors/bearish indicators
- "summary": Detailed paragraphs explaining the reasoning behind the verdict based on fundamentals, technicals, and sentiment.

Do not include any markdown wrappers (like ```json) in your final response. Just output valid raw JSON.
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        # Required for some OpenRouter models to rank/appear correctly
        "HTTP-Referer": "https://tader-advisor.local",
        "X-Title": "Tader AI Advisor"
    }
    
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                # Clean up any potential markdown fences returned by the model
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                return json.loads(content)
            else:
                return {
                    "verdict": "HOLD",
                    "confidence": 40,
                    "catalysts": [f"API returned status {response.status_code}"],
                    "risks": ["Unable to fetch recommendation from OpenRouter"],
                    "summary": f"Error: {response.text}"
                }
    except Exception as e:
        return {
            "verdict": "HOLD",
            "confidence": 30,
            "catalysts": [],
            "risks": [f"Exception occurred: {str(e)}"],
            "summary": "An exception occurred during LLM generation. Please check backend logs."
        }
