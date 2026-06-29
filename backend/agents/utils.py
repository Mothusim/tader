import os
import httpx
import json
from typing import Dict, Any, List

async def query_llm(messages: List[Dict[str, str]], json_mode: bool = False, max_tokens_override: int = None) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    # Use a valid OpenRouter model; default to GPT-4o which supports the requested token limits.
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")
    
    if not api_key or api_key == "your-openrouter-api-key-here":
        if json_mode:
            return json.dumps({
                "verdict": "HOLD",
                "confidence": 50,
                "catalysts": ["API Key not configured. Using placeholder response."],
                "risks": ["Please set up your OpenRouter API key."],
                "summary": "This is a placeholder recommendation. Configure OPENROUTER_API_KEY."
            })
        return "API Key not configured. Please configure OPENROUTER_API_KEY in your env."
        
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tader-advisor.local",
        "X-Title": "Tader AI Advisor"
    }
    
    # Allow per-call override; fall back to env var; global default is 4000 tokens
    # to ensure verbose Markdown reports (Graham, debates, etc.) are never truncated.
    global_default = int(os.getenv("OPENROUTER_MAX_TOKENS", "4000"))
    max_tokens = max_tokens_override if max_tokens_override is not None else global_default
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                
                # Clean markdown code block wraps if model adds them
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                return content.strip()
            else:
                raise Exception(f"OpenRouter API returned status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Error querying OpenRouter: {e}")
        if json_mode:
            return json.dumps({
                "verdict": "HOLD",
                "confidence": 40,
                "catalysts": [],
                "risks": [f"Exception occurred: {str(e)}"],
                "summary": "An exception occurred during LLM generation."
            })
        return f"Error occurred during analysis: {str(e)}"
