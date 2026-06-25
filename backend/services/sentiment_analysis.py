import feedparser
import urllib.parse
from typing import List, Dict, Any

def fetch_news_sentiment(ticker_symbol: str) -> List[Dict[str, Any]]:
    """
    Fetches latest news regarding the ticker symbol using Google News RSS feed.
    """
    query = urllib.parse.quote(ticker_symbol)
    rss_url = f"https://news.google.com/rss/search?q={query}+stock&hl=en-US&gl=US&ceid=US:en"
    
    feed = feedparser.parse(rss_url)
    news_items = []
    
    # Take latest 10 news items
    for entry in feed.entries[:10]:
        news_items.append({
            "title": entry.get("title"),
            "link": entry.get("link"),
            "published": entry.get("published"),
            "source": entry.get("source", {}).get("title", "Unknown Source")
        })
        
    return news_items
