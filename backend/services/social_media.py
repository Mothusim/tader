import httpx
from typing import List, Dict, Any

async def fetch_social_sentiment(ticker_symbol: str) -> List[Dict[str, Any]]:
    """
    Fetches public mentions, titles, and self-text for a given ticker from Reddit search.
    """
    url = f"https://www.reddit.com/r/stocks+investing+wallstreetbets/search.json"
    params = {
        "q": ticker_symbol,
        "sort": "new",
        "limit": 15,
        "restrict_sr": "on"
    }
    # Setting a distinct User-Agent prevents Reddit from returning 429 Rate Limit errors
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TaderInvestmentResearcher/1.0"
    }
    
    findings = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                posts = data.get("data", {}).get("children", [])
                for post in posts:
                    post_data = post.get("data", {})
                    findings.append({
                        "title": post_data.get("title"),
                        "subreddit": post_data.get("subreddit"),
                        "score": post_data.get("score"),
                        "num_comments": post_data.get("num_comments"),
                        "url": f"https://reddit.com{post_data.get('permalink')}",
                        "created_utc": post_data.get("created_utc"),
                        "text": post_data.get("selftext")[:300] if post_data.get("selftext") else ""
                    })
    except Exception as e:
        print(f"Error fetching social sentiment for {ticker_symbol}: {e}")
        
    return findings
