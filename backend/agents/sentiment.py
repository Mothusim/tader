from typing import List, Dict, Any
from backend.agents.utils import query_llm

async def run_sentiment_analysis(ticker: str, news: List[Dict[str, Any]], social: List[Dict[str, Any]]) -> str:
    """
    Runs LLM-driven sentiment and news analysis.
    """
    news_titles = [f"- {item.get('title')} (Source: {item.get('source')}, Published: {item.get('published')})" for item in news[:7]]
    social_titles = [
        f"- Subreddit r/{item.get('subreddit')}: \"{item.get('title')}\" (Upvotes: {item.get('score')}, Comments: {item.get('num_comments')}) - Summary: {item.get('text')}"
        for item in social[:7]
    ]
    
    news_section = "\n".join(news_titles) if news_titles else "No recent news found."
    social_section = "\n".join(social_titles) if social_titles else "No recent social media discussions found."

    prompt = f"""
You are a senior Sentiment & News Analyst at a quantitative trading firm.
Your task is to write a detailed, professional sentiment research report for the stock ticker '{ticker}'.

Review the following recent news stories and retail social chatter:

### Recent News Coverage:
{news_section}

### Social Media & Community Mentions (Reddit):
{social_section}

Write a concise but comprehensive report covering:
1. **News Sentiment Assessment**: Summarize the prevailing tone of mainstream media. Are there major regulatory actions, earnings revisions, product announcements, or macroeconomic headwinds?
2. **Social & Retail Buzz**: Assess community sentiment from Reddit (e.g. wallstreetbets, stocks). Is there high retail interest, hype, panic, or short-squeeze speculation?
3. **Sentiment Divergence**: Is there a mismatch between institutional news and retail sentiment?
4. **Impact Analysis**: How will this overall mood (bullish, bearish, or fearful) affect the stock's volume and price stability in the short term?
5. **Analyst Recommendation**: Conclude with a strong, sentiment-driven rating: BUY, HOLD, or SELL with brief reasoning.

Use professional, objective language. Format the report using clean Markdown.
Do not include any greeting or conversational filler. Start directly with the markdown report.
"""
    messages = [
        {"role": "system", "content": "You are a professional financial analyst specialising in news sentiment analysis and retail social media tracking. Output raw markdown reports."},
        {"role": "user", "content": prompt}
    ]
    
    return await query_llm(messages, json_mode=False)
