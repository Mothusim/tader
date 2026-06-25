import os
from datetime import datetime
from fastapi import (
    FastAPI, Depends, HTTPException, Header, Query, Body,
)
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from supabase import create_client, Client, ClientOptions
from typing import Optional, Dict, Any

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

app = FastAPI(title="Tader AI API", version="1.0.0")

# Enable CORS for localhost frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase Admin/Service Client
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

supabase_client: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "your-supabase-project-url-here":
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Lazy imports to optimize startup
from backend.services.market_data import fetch_market_data
from backend.services.technical_analysis import calculate_indicators
from backend.services.sentiment_analysis import fetch_news_sentiment
from backend.services.social_media import fetch_social_sentiment
from backend.agents.coordinator import run_analysis

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Verifies the Supabase JWT token passed in the Authorization header.
    Returns user details and organization information.
    """
    if not supabase_client:
        # Development fallback/mock user when Supabase is not configured
        return {
            "id": "mock-user-id",
            "email": "analyst@company.com",
            "org_id": "mock-org-id",
            "role": "admin"
        }
    
    # If no auth token provided, attempt to fetch a demo org/profile for development
    if not authorization or not authorization.startswith("Bearer "):
        try:
            org_resp = supabase_client.table("organizations").select("id").limit(1).execute()
            org_id = org_resp.data[0]["id"] if org_resp.data else None
            if org_id:
                profile_resp = (
                    supabase_client.table("profiles")
                    .select("id, email")
                    .eq("org_id", org_id)
                    .limit(1)
                    .execute()
                )
                if profile_resp.data:
                    profile = profile_resp.data[0]
                    return {
                        "id": profile.get("id"),
                        "email": profile.get("email"),
                        "org_id": org_id,
                        "role": "admin",
                        "token": None
                    }
        except Exception as e:
            print(f"Auth dev fallback error: {e}")
        # Fallback mock user for development
        return {"id": "mock-user-id", "email": "analyst@company.com", "org_id": "mock-org-id", "role": "admin", "token": None}

    token = authorization.split(" ")[1]
    try:
        # Get user auth object from Supabase
        user_response = supabase_client.auth.get_user(token)
        user = user_response.user

        # Create scoped client with user token to pass RLS
        client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))
        # Get matching user profile from database to retrieve org_id and role
        profile_response = client.table("profiles").select("*, organizations(name)").eq("id", user.id).single().execute()
        profile = profile_response.data

        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        return {
            "id": user.id,
            "email": user.email,
            "org_id": profile.get("org_id"),
            "role": profile.get("role"),
            "token": token,
            "org_name": profile.get("organizations", {}).get("name") if profile.get("organizations") else "Standalone"
        }
    except Exception as e:
        # Fallback to mock user in development when authentication fails
        return {"id": "mock-user-id", "email": "analyst@company.com", "org_id": "mock-org-id", "role": "admin", "token": None}

@app.get("/api/analyze")
async def analyze_ticker(
    ticker: str = Query(..., description="The stock ticker or asset symbol (e.g. AAPL, BTC-USD)"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Main research pipeline: pulls fundamentals, technicals, news, and social sentiment,
    queries OpenRouter, and returns comprehensive findings alongside AI recommendation.
    """
    ticker = ticker.upper().strip()
    try:
        # 1. Fetch Market Data & History
        market_data = fetch_market_data(ticker)
        
        # 2. Compute Technical Indicators
        technicals = calculate_indicators(market_data["history"])
        
        # 3. Pull News and RSS Sentiment
        news = fetch_news_sentiment(ticker)
        
        # 4. Pull Social Media Posts (Reddit)
        social = await fetch_social_sentiment(ticker)
        
        # 5. Generate AI Advisor Recommendation (Multi-Agent framework)
        ai_recommendation = await run_analysis(
            ticker=ticker,
            fundamentals=market_data["fundamentals"],
            technicals=technicals,
            news=news,
            social=social
        )

        # Assemble full result payload
        result_payload = {
            "ticker": ticker,
            "fundamentals": market_data["fundamentals"],
            "technicals": technicals,
            "news": news,
            "social": social,
            "recommendation": ai_recommendation,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        
        if supabase_client and current_user.get("org_id") != "mock-org-id":
            try:
                client = supabase_client
                if current_user.get("token"):
                    client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"}))
                # Save concise history
                client.table("research_history").insert({
                    "org_id": current_user["org_id"],
                    "ticker": ticker,
                    "recommendation": ai_recommendation.get("verdict", "HOLD"),
                    "confidence": ai_recommendation.get("confidence", 50),
                    "analysis": {
                        "fundamentals": market_data["fundamentals"],
                        "technicals": technicals.get("latest"),
                        "news_count": len(news),
                        "social_count": len(social),
                        "summary": ai_recommendation.get("summary")
                    },
                    "created_by": current_user["id"]
                }).execute()
                # Save full result payload for later retrieval
                # Automatic full analysis save disabled; user can save via UI button

            except Exception as db_err:
                print(f"Error saving analysis results: {db_err}")

        return result_payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

@app.get("/api/watchlist")
async def get_watchlist(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches watchlist items for the authenticated organization.
    """
    if not supabase_client or current_user.get("org_id") == "mock-org-id":
        return [{"ticker": "AAPL"}, {"ticker": "MSFT"}]
        
    try:
        client = supabase_client
        if current_user.get("token"):
            client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"}))
        response = client.table("watchlists").select("*").eq("org_id", current_user["org_id"]).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/watchlist")
async def add_to_watchlist(
    ticker: str = Query(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Adds a ticker to the organization's shared watchlist.
    """
    ticker = ticker.upper().strip()
    if not supabase_client or current_user.get("org_id") == "mock-org-id":
        return {"status": "success", "message": f"{ticker} added to mock watchlist"}
        
    try:
        client = supabase_client
        if current_user.get("token"):
            client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"}))
        response = client.table("watchlists").insert({
            "org_id": current_user["org_id"],
            "ticker": ticker,
            "added_by": current_user["id"]
        }).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/organization")
async def get_organization_details(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches the organization name and listing of all employee profiles.
    """
    if not supabase_client or current_user.get("org_id") == "mock-org-id":
        return {
            "name": "Mock Org",
            "employees": [
                {"name": "Mock Admin", "role": "admin", "email": "admin@mock.com"},
                {"name": "Mock Employee", "role": "employee", "email": "employee@mock.com"}
            ]
        }
        
    try:
        client = supabase_client
        if current_user.get("token"):
            client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"}))
        org_resp = client.table("organizations").select("name").eq("id", current_user["org_id"]).single().execute()
        emp_resp = client.table("profiles").select("name, role").eq("org_id", current_user["org_id"]).execute()
        
        return {
            "name": org_resp.data.get("name"),
            "employees": emp_resp.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis")
async def get_analysis_results(
    id: Optional[str] = None,
    ticker: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> list:
    """Retrieve saved analysis results. Filter by id or ticker."""
    if not supabase_client:
        return []
    try:
        client = supabase_client
        if current_user.get("token"):
            client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"}))

        query = client.table("analysis_results").select("*")
        if id:
            query = query.eq("id", id)
        elif ticker:
            query = query.eq("ticker", ticker)
        if current_user.get("org_id") != "mock-org-id":
            query = query.eq("org_id", current_user["org_id"]).order("generated_at", desc=True)
        data = query.execute().data
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

## Save analysis result on demand
@app.post("/api/save-analysis")
async def save_analysis_result(
    result_payload: dict = Body(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> dict:
    """Save a full analysis result payload for later retrieval.
    Expected payload matches the structure returned by /api/analyze.
    """
    if not supabase_client or current_user.get("org_id") == "mock-org-id":
        return {"status": "mock", "message": "Result would be saved in production."}
    try:
        client = supabase_client
        if current_user.get("token"):
            client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"}))

        client.table("analysis_results").insert({
            "org_id": current_user["org_id"],
            "ticker": result_payload.get("ticker"),
            "result": result_payload,
            "generated_at": result_payload.get("generated_at") or datetime.utcnow().isoformat() + "Z"
        }).execute()
        return {"status": "success", "message": "Analysis result saved."}
    except Exception as e:
        # Return detailed error response for debugging instead of silent mock
        print(f"Error saving analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {str(e)}")

