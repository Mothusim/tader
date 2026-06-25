export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Fundamentals {
  name: string;
  sector: string;
  industry: string;
  market_cap: number | null;
  pe_ratio: number | null;
  forward_pe: number | null;
  peg_ratio: number | null;
  price_to_book: number | null;
  debt_to_equity: number | null;
  return_on_equity: number | null;
  profit_margin: number | null;
  dividend_yield: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  current_price: number | null;
  currency: string;
  description: string;
}

export interface TechnicalLatest {
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  sma_50: number | null;
  sma_200: number | null;
  rsi_signal: string;
  trend_signal: string;
  macd_signal_label: string;
}

export interface IndicatorDataPoint {
  date: string;
  close: number;
  sma_50: number | null;
  sma_200: number | null;
  ema_20: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
}

export interface Technicals {
  latest: TechnicalLatest;
  history: IndicatorDataPoint[];
}

export interface NewsItem {
  title: string;
  link: string;
  published: string;
  source: string;
}

export interface SocialItem {
  title: string;
  subreddit: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
  text: string;
}

export interface AgentReports {
  fundamentals: string;
  technical: string;
  sentiment: string;
}

export interface DebateTurn {
  role: "bullish" | "bearish" | "bullish_rebuttal" | "bearish_conclusion";
  message: string;
}

export interface Recommendation {
  verdict: "BUY" | "HOLD" | "SELL";
  confidence: number;
  catalysts: string[];
  risks: string[];
  summary: string;
  agent_reports?: AgentReports;
  debate_log?: DebateTurn[];
}


export interface AnalysisResult {
  ticker: string;
  fundamentals: Fundamentals;
  technicals: Technicals;
  news: NewsItem[];
  social: SocialItem[];
  recommendation: Recommendation;
}

export interface WatchlistItem {
  id: string;
  org_id: string;
  ticker: string;
  added_by: string;
  created_at: string;
}

export interface Employee {
  name: string;
  role: string;
  email: string;
}

export interface Organization {
  name: string;
  employees: Employee[];
}

export async function analyzeStock(
  ticker: string,
  token?: string
): Promise<AnalysisResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/api/analyze?ticker=${encodeURIComponent(ticker)}`, {
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to analyze stock");
  }
  return res.json();
}

export async function getWatchlist(token?: string): Promise<WatchlistItem[]> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/watchlist`, { headers });
  if (!res.ok) throw new Error("Failed to load watchlist");
  return res.json();
}

export async function addToWatchlist(
  ticker: string,
  token?: string
): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/watchlist?ticker=${encodeURIComponent(ticker)}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Failed to add to watchlist");
}

export async function getAnalysis(id?: string, ticker?: string, token?: string): Promise<any[]> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const params = new URLSearchParams();
  if (id) params.append('id', id);
  if (ticker) params.append('ticker', ticker);
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_URL}/api/analysis${query}`, { headers });
  if (!res.ok) throw new Error('Failed to load analysis history');
  return res.json();
}

export async function saveAnalysis(resultPayload: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/save-analysis`, {
    method: "POST",
    headers,
    body: JSON.stringify(resultPayload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to save analysis');
  }
  return res.json();
}

export async function getOrganization(token?: string): Promise<Organization> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/organization`, { headers });
  if (!res.ok) throw new Error("Failed to load organization");
  return res.json();
}

export function formatCurrency(val: number | null | undefined, currency = "USD"): string {
  if (val === null || val === undefined) return "N/A";
  if (val >= 1_000_000_000_000)
    return `${(val / 1_000_000_000_000).toFixed(2)}T ${currency}`;
  if (val >= 1_000_000_000)
    return `${(val / 1_000_000_000).toFixed(2)}B ${currency}`;
  if (val >= 1_000_000)
    return `${(val / 1_000_000).toFixed(2)}M ${currency}`;
  return `${val.toFixed(2)} ${currency}`;
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined) return "N/A";
  return `${(val * 100).toFixed(2)}%`;
}

export function formatNumber(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined) return "N/A";
  return val.toFixed(decimals);
}
