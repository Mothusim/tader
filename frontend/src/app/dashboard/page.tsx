"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  analyzeStock,
  getWatchlist,
  addToWatchlist,
  getOrganization,
  formatCurrency,
  formatPercent,
  formatNumber,
  saveAnalysis,
  AnalysisResult,
  WatchlistItem,
  Organization,
  DebateTurn,
  AgentReports,
} from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Markdown parser helper for formatting reports without heavy packages
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split("\n");
  return (
    <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="text-base font-bold text-white mt-4 mb-2 border-b border-white/5 pb-1 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-cyan-500 rounded-sm"></span>
              {trimmed.replace(/^###\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={idx} className="text-lg font-bold text-cyan-400 mt-5 mb-2">
              {trimmed.replace(/^##\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h2 key={idx} className="text-xl font-extrabold text-white mt-6 mb-3 border-l-4 border-cyan-500 pl-3">
              {trimmed.replace(/^#\s*/, "")}
            </h2>
          );
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          return (
            <div key={idx} className="flex gap-2 pl-3">
              <span className="text-cyan-500">•</span>
              <span>{trimmed.replace(/^[-*]\s*/, "")}</span>
            </div>
          );
        }
        if (trimmed.match(/^\d+\./)) {
          return (
            <div key={idx} className="flex gap-2 pl-3">
              <span className="text-cyan-400 font-semibold">{trimmed.match(/^\d+/)?.[0]}.</span>
              <span>{trimmed.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        }
        if (trimmed === "") {
          return <div key={idx} className="h-1.5" />;
        }
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}

// Simulated progressive loading component to track multi-agent pipeline
function ResearchLoadingProgress() {
  const [step, setStep] = useState(0);
  const steps = [
    "Connecting to Yahoo Finance API for market metrics...",
    "Scraping latest RSS feed news and public Reddit posts...",
    "Fundamentals Analyst assessing P/E, debt, and balance sheet health...",
    "Technical Analyst evaluating RSI, MACD, and SMA trend signals...",
    "Initializing Researcher Team: Bullish vs Bearish debate commencing...",
    "Trader Agent synthesising analyst reports and finalising recommendation...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-2xl mx-auto animate-fade-in">
      <div className="relative mb-8">
        {/* Outer glowing pulsing ring */}
        <div className="absolute inset-[-12px] rounded-full border border-cyan-500/25 animate-ping opacity-60" />
        <div className="absolute inset-[-6px] rounded-full border border-cyan-500/15" />
        {/* Inner spinner */}
        <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-cyan-500 animate-spin" />
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2">Analyzing Ticker</h3>
      <p className="text-slate-400 text-xs max-w-sm mb-8 leading-relaxed">
        We are running a multi-agent LLM consensus pipeline. This will take about 15-20 seconds.
      </p>

      <div className="w-full bg-[#0b121f] border border-white/8 rounded-2xl p-5 text-left space-y-3.5 shadow-2xl">
        {steps.map((text, idx) => {
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <div key={idx} className="flex items-center gap-3">
              {isDone ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-[10px] font-bold">✓</div>
              ) : isActive ? (
                <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/10 bg-white/5" />
              )}
              <span className={`text-xs ${isActive ? "text-cyan-400 font-semibold" : isDone ? "text-slate-400" : "text-slate-600"}`}>
                {text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Debate visualization timeline/chat UI
function DebateLogView({ log }: { log: DebateTurn[] }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-base text-white">Researcher Team Debate</h3>
          <p className="text-[11px] text-slate-400">Structured debate log between Bullish and Bearish Analysts</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold uppercase tracking-wider">Bullish Analyst</span>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold uppercase tracking-wider">Bearish Analyst</span>
        </div>
      </div>

      <div className="space-y-6">
        {log.map((turn, idx) => {
          const isBull = turn.role.startsWith("bullish");
          const avatarBg = isBull 
            ? "from-cyan-500 to-blue-600 border-blue-500/30" 
            : "from-rose-500 to-red-600 border-red-500/30";
          const cardBg = isBull
            ? "bg-blue-950/10 border-blue-500/10 shadow-[0_4px_20px_rgba(6,182,212,0.03)]"
            : "bg-rose-950/5 border-rose-500/10 shadow-[0_4px_20px_rgba(244,63,94,0.02)]";
          
          return (
            <div key={idx} className={`flex gap-4 ${isBull ? "" : "flex-row-reverse"} animate-slide-up`}>
              {/* Avatar Icon */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-base border shadow-md flex-shrink-0 ${avatarBg}`}>
                {isBull ? "🐂" : "🐻"}
              </div>

              {/* Chat bubble/card */}
              <div className={`flex-1 rounded-2xl border p-5 max-w-3xl transition-all duration-300 hover:scale-[1.005] ${cardBg}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[11px] font-bold tracking-wider uppercase ${isBull ? "text-cyan-400" : "text-rose-400"}`}>
                    {isBull ? "Bullish Researcher" : "Bearish Researcher"}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                    Round {idx === 0 || idx === 1 ? "1" : "2"} · {idx === 0 ? "Thesis" : idx === 1 ? "Rebuttal" : idx === 2 ? "Counter" : "Conclusion"}
                  </span>
                </div>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {turn.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Independent Analyst Reports View with sub-tabs
function AnalystReportsView({ reports }: { reports: AgentReports }) {
  const [selectedAgent, setSelectedAgent] = useState<"fundamentals" | "technical" | "sentiment">("fundamentals");

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-6">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
          {[
            { id: "fundamentals", label: "Fundamentals Analyst", icon: "📊" },
            { id: "technical", label: "Technical Analyst", icon: "📈" },
            { id: "sentiment", label: "Sentiment Analyst", icon: "📰" },
          ].map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition duration-250 ${
                selectedAgent === agent.id 
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{agent.icon}</span>
              <span className="hidden sm:inline">{agent.label}</span>
              <span className="sm:hidden">{agent.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0b121f] border border-white/8 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fade-in">
        {/* Glow corner indicator */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
        
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
          <span className="text-2xl">
            {selectedAgent === "fundamentals" ? "📊" : selectedAgent === "technical" ? "📈" : "📰"}
          </span>
          <div>
            <h3 className="font-bold text-white capitalize">{selectedAgent} Research Report</h3>
            <p className="text-[10px] text-slate-400">Independent LLM agent assessment for this ticker</p>
          </div>
        </div>

        <MarkdownRenderer content={reports[selectedAgent]} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // UI state
  const [ticker, setTicker] = useState("");
  const [activeTab, setActiveTab] = useState<"research" | "watchlist" | "team">("research");
  const [researchSubTab, setResearchSubTab] = useState<"overview" | "reports" | "debate" | "feeds">("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [chartType, setChartType] = useState<"price" | "rsi" | "macd">("price");
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) router.push("/auth");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) router.push("/auth");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const loadWatchlist = useCallback(async () => {
    try {
      const items = await getWatchlist(session?.access_token);
      setWatchlist(items);
    } catch {}
  }, [session]);

  const loadOrg = useCallback(async () => {
    try {
      const o = await getOrganization(session?.access_token);
      setOrg(o);
    } catch {}
  }, [session]);

  useEffect(() => {
    if (session) {
      loadWatchlist();
      loadOrg();
    }
  }, [session, loadWatchlist, loadOrg]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeStock(ticker.trim().toUpperCase(), session?.access_token);
      setResult(data);
      setActiveTab("research");
      setResearchSubTab("overview");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
    setLoading(false);
  };

  const handleAddWatchlist = async () => {
    if (!result) return;
    setAddingToWatchlist(true);
    try {
      await addToWatchlist(result.ticker, session?.access_token);
      await loadWatchlist();
    } catch {}
    setAddingToWatchlist(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const verdictColor = result?.recommendation.verdict === "BUY"
    ? "text-emerald-400 border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]"
    : result?.recommendation.verdict === "SELL"
    ? "text-red-400 border-red-500/20 bg-gradient-to-r from-red-500/10 to-rose-500/5 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
    : "text-amber-400 border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 shadow-[0_0_30px_rgba(245,158,11,0.05)]";

  const chartData = result?.technicals.history.slice(-90) ?? [];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-white">
      {/* Visual background gradient grid orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute top-[35%] left-[40%] w-[350px] h-[350px] rounded-full bg-violet-600/3 blur-[100px]" />
      </div>

      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center font-extrabold text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] text-white">T</div>
            <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">TADER</span>
            {org && (
            <span className="ml-3 text-[10px] font-semibold text-slate-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full hidden sm:block">
              {org.name}
            </span>
          )}
          {/* History navigation link */}
          <Link href="/history" className="ml-4 text-xs text-slate-300 hover:text-cyan-400 transition">
            History
          </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:block">{user?.email}</span>
            <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-white transition duration-200 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/5">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Input Panel */}
        <form onSubmit={handleAnalyze} className="mb-6 animate-fade-in">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter stock ticker or crypto token: AAPL, TSLA, BTC-USD..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-5 py-3.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-white rounded-xl px-6 py-3.5 font-bold text-sm hover:opacity-90 active:scale-95 transition shadow-lg whitespace-nowrap disabled:opacity-50 disabled:scale-100 flex items-center justify-center min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running...
                </span>
              ) : "Analyze"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm shadow-md animate-fade-in flex items-center gap-2">
            <span className="text-base">⚠</span> {error}
          </div>
        )}

        {/* Outer Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/5 pb-0">
          {(["research", "watchlist", "team"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-semibold capitalize transition border-b-2 -mb-px tracking-wider ${
                activeTab === tab
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab === "research" ? "Research Panel" : tab === "watchlist" ? "Watchlist" : "Team Hub"}
            </button>
          ))}
        </div>

        {/* Research Panel Tab content */}
        {activeTab === "research" && (
          <div>
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center glass border border-white/5 rounded-2xl p-8 max-w-lg mx-auto shadow-2xl animate-slide-up">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-2xl">
                  🔬
                </div>
                <h2 className="text-base font-bold text-white mb-2">Tader Research Terminal</h2>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                  Provide a financial ticker symbol above. The system will trigger sequential AI analyst agents, run a bullish/bearish researcher debate, and synthesize the output.
                </p>
              </div>
            )}

            {loading && <ResearchLoadingProgress />}

            {result && (
              <div className="space-y-6 animate-fade-in">
                {/* Result header banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold tracking-tight text-white">{result.fundamentals.name}</h1>
                      <span className="text-xs text-slate-300 font-mono bg-white/5 border border-white/10 rounded px-2.5 py-0.5">{result.ticker}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{result.fundamentals.sector} · {result.fundamentals.industry}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAddWatchlist}
                      disabled={addingToWatchlist}
                      className="text-xs border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-300 hover:text-cyan-400 rounded-lg px-4 py-2 transition duration-200"
                    >
                      {addingToWatchlist ? "Adding..." : "+ Watchlist"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!result) return;
                        try {
                          await saveAnalysis(result, session?.access_token);
                          alert('Report saved successfully!');
                        } catch (e) {
                          console.error(e);
                          alert('Failed to save report');
                        }
                      }}
                      className="text-xs border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-300 hover:text-cyan-400 rounded-lg px-4 py-2 transition duration-200"
                    >
                      💾 Save Report
                    </button>
                    <div className="text-right">
                      <p className="text-xl font-black text-white">
                        {result.fundamentals.current_price?.toFixed(2)} <span className="text-slate-400 text-xs font-normal">{result.fundamentals.currency}</span>
                      </p>
                      <p className="text-slate-500 text-[10px] font-mono">
                        52W: {formatNumber(result.fundamentals.fifty_two_week_low)} – {formatNumber(result.fundamentals.fifty_two_week_high)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs for Multi-Agent breakdown */}
                <div className="flex gap-1.5 bg-white/3 border border-white/5 rounded-xl p-1 max-w-lg shadow-inner">
                  {[
                    { id: "overview", label: "Trader Verdict" },
                    { id: "reports", label: "Analyst Reports" },
                    { id: "debate", label: "Researcher Debate" },
                    { id: "feeds", label: "News & Social" },
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setResearchSubTab(subTab.id as any)}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition ${
                        researchSubTab === subTab.id
                          ? "bg-[#0b121f] text-cyan-400 border border-white/5 shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* SUB-TAB 1: Overview & Trader Verdict */}
                {researchSubTab === "overview" && (
                  <div className="space-y-6">
                    {/* Trader final verdict banner */}
                    <div className={`border rounded-2xl p-6 ${verdictColor}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-shrink-0 bg-black/20 border border-white/5 rounded-2xl p-4 text-center min-w-[120px]">
                          <div className="text-3xl font-black tracking-tight">{result.recommendation.verdict}</div>
                          <div className="text-[10px] opacity-70 mt-1 uppercase tracking-wider font-bold">Trader Call</div>
                        </div>
                        {/* Confidence score indicator */}
                        <div className="flex-1">
                          <div className="flex justify-between text-xs font-semibold mb-2">
                            <span>Confidence Index</span>
                            <span>{result.recommendation.confidence}%</span>
                          </div>
                          <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full rounded-full bg-current transition-all duration-1000"
                              style={{ width: `${result.recommendation.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
                      <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center">💼</span>
                        Trader's Executive Summary
                      </h3>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{result.recommendation.summary}</p>
                      
                      <div className="grid sm:grid-cols-2 gap-4 mt-6">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                          <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>▲</span> Consensus Catalysts
                          </p>
                          <ul className="space-y-1.5">
                            {result.recommendation.catalysts.map((c, i) => (
                              <li key={i} className="text-slate-300 text-xs flex gap-2">
                                <span className="text-emerald-400">•</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                          <p className="text-rose-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span>▼</span> Consensus Risks
                          </p>
                          <ul className="space-y-1.5">
                            {result.recommendation.risks.map((r, i) => (
                              <li key={i} className="text-slate-300 text-xs flex gap-2">
                                <span className="text-rose-400">•</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Fundamental metrics snapshot */}
                    <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
                      <h3 className="font-bold text-white text-sm mb-4">Financial Snapshot</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { label: "Market Cap", value: formatCurrency(result.fundamentals.market_cap, result.fundamentals.currency) },
                          { label: "P/E Ratio", value: formatNumber(result.fundamentals.pe_ratio) },
                          { label: "Forward P/E", value: formatNumber(result.fundamentals.forward_pe) },
                          { label: "PEG Ratio", value: formatNumber(result.fundamentals.peg_ratio) },
                          { label: "Price/Book", value: formatNumber(result.fundamentals.price_to_book) },
                          { label: "Debt/Equity", value: formatNumber(result.fundamentals.debt_to_equity) },
                          { label: "ROE", value: formatPercent(result.fundamentals.return_on_equity) },
                          { label: "Profit Margin", value: formatPercent(result.fundamentals.profit_margin) },
                          { label: "Dividend Yield", value: formatPercent(result.fundamentals.dividend_yield) },
                        ].map((item) => (
                          <div key={item.label} className="bg-white/3 border border-white/5 rounded-xl p-3 shadow-inner">
                            <p className="text-slate-400 text-[10px] mb-1">{item.label}</p>
                            <p className="text-white font-bold text-xs">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {result.fundamentals.description && (
                        <div className="mt-5 pt-4 border-t border-white/5">
                          <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">Company Background</p>
                          <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">{result.fundamentals.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: Analyst Reports */}
                {researchSubTab === "reports" && result.recommendation.agent_reports && (
                  <AnalystReportsView reports={result.recommendation.agent_reports} />
                )}

                {/* SUB-TAB 3: Researcher Debate */}
                {researchSubTab === "debate" && result.recommendation.debate_log && (
                  <DebateLogView log={result.recommendation.debate_log} />
                )}

                {/* SUB-TAB 4: News & Social feeds + charts */}
                {researchSubTab === "feeds" && (
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Charts block */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <h3 className="font-bold text-white text-sm">Market Chart Indicators</h3>
                          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                            {(["price", "rsi", "macd"] as const).map((ct) => (
                              <button
                                key={ct}
                                onClick={() => setChartType(ct)}
                                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase transition ${
                                  chartType === ct ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400 hover:text-white"
                                }`}
                              >
                                {ct === "price" ? "Price + MAs" : ct.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Signals grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                          {[
                            { label: "RSI (14)", value: formatNumber(result.technicals.latest.rsi), signal: result.technicals.latest.rsi_signal },
                            { label: "Trend (SMA 50/200)", value: `${formatNumber(result.technicals.latest.sma_50)} / ${formatNumber(result.technicals.latest.sma_200)}`, signal: result.technicals.latest.trend_signal },
                            { label: "MACD Indicator", value: `${formatNumber(result.technicals.latest.macd)}`, signal: result.technicals.latest.macd_signal_label },
                          ].map((item) => {
                            const isBull = item.signal.includes("BULLISH") || item.signal.includes("BUY") || item.signal.includes("OVERSOLD");
                            const isBear = item.signal.includes("BEARISH") || item.signal.includes("SELL") || item.signal.includes("OVERBOUGHT");
                            return (
                              <div key={item.label} className="bg-white/3 border border-white/5 rounded-xl p-3">
                                <p className="text-slate-400 text-[10px] mb-1">{item.label}</p>
                                <p className="text-white font-bold text-base mb-1">{item.value}</p>
                                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${
                                  isBull ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                                  isBear ? "text-red-400 bg-red-500/10 border-red-500/20" :
                                  "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                }`}>
                                  {item.signal.split(" ")[0]}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Recharts Wrapper */}
                        <div className="h-64 sm:h-80">
                          {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              {chartType === "price" ? (
                                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} width={45} tickFormatter={(v) => v.toFixed(0)} />
                                  <Tooltip contentStyle={{ background: "#0b121f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                                  <Legend wrapperStyle={{ fontSize: 11 }} />
                                  <Line type="monotone" dataKey="close" name="Price" stroke="#06b6d4" dot={false} strokeWidth={2} />
                                  <Line type="monotone" dataKey="sma_50" name="SMA 50" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                                  <Line type="monotone" dataKey="sma_200" name="SMA 200" stroke="#ec4899" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                                  <Line type="monotone" dataKey="ema_20" name="EMA 20" stroke="#a78bfa" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                                </LineChart>
                              ) : chartType === "rsi" ? (
                                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} width={30} />
                                  <Tooltip contentStyle={{ background: "#0b121f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                                  <Legend wrapperStyle={{ fontSize: 11 }} />
                                  <Line type="monotone" dataKey="rsi" name="RSI (14)" stroke="#06b6d4" dot={false} strokeWidth={2} />
                                </LineChart>
                              ) : (
                                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} tickFormatter={(v) => v.slice(5)} />
                                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} width={45} />
                                  <Tooltip contentStyle={{ background: "#0b121f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                                  <Legend wrapperStyle={{ fontSize: 11 }} />
                                  <Bar dataKey="macd" name="MACD" fill="#06b6d4" opacity={0.85} />
                                  <Bar dataKey="macd_signal" name="Signal" fill="#f59e0b" opacity={0.85} />
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-xs">No chart data available</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Side lists for news & reddit */}
                    <div className="space-y-6">
                      {/* Mainstream News */}
                      <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
                        <h3 className="font-bold text-white text-sm mb-4">RSS News Feed</h3>
                        {result.news.length > 0 ? (
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {result.news.map((item, i) => (
                              <a
                                key={i}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white/3 border border-white/5 rounded-xl p-3.5 hover:border-cyan-500/20 hover:bg-white/5 transition duration-200 group"
                              >
                                <p className="text-slate-200 text-xs font-semibold group-hover:text-cyan-400 transition line-clamp-2 mb-1.5">{item.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <span>{item.source}</span>
                                  <span>·</span>
                                  <span>{item.published.slice(0, 16)}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs">No recent news articles.</p>
                        )}
                      </div>

                      {/* Reddit sentiment */}
                      <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
                        <h3 className="font-bold text-white text-sm mb-4">Retail Sentiment (Reddit)</h3>
                        {result.social.length > 0 ? (
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                            {result.social.map((item, i) => (
                              <a
                                key={i}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white/3 border border-white/5 rounded-xl p-3.5 hover:border-orange-500/20 hover:bg-white/5 transition duration-200 group"
                              >
                                <p className="text-slate-200 text-xs font-semibold group-hover:text-orange-400 transition line-clamp-2 mb-2">{item.title}</p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                  <span className="text-orange-400/80">r/{item.subreddit}</span>
                                  <span>↑ {item.score}</span>
                                  <span>💬 {item.num_comments}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs">No recent Reddit posts.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Watchlist Main Tab */}
        {activeTab === "watchlist" && (
          <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <h2 className="font-bold text-white text-base mb-4">Shared Organization Watchlist</h2>
            {watchlist.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-lg">
                  📌
                </div>
                <p className="text-slate-400 font-semibold text-sm mb-1">Watchlist is currently empty</p>
                <p className="text-slate-500 text-xs max-w-xs leading-relaxed">Search for tickers in the Research Panel and append them to keep your team aligned.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {watchlist.map((item) => (
                  <button
                    key={item.id || item.ticker}
                    onClick={() => { setTicker(item.ticker); setActiveTab("research"); }}
                    className="bg-white/3 border border-white/5 hover:border-cyan-500/30 rounded-xl p-4 text-left transition duration-250 group shadow-sm hover:scale-[1.01]"
                  >
                    <span className="text-white font-extrabold font-mono group-hover:text-cyan-400 transition text-sm">{item.ticker}</span>
                    <p className="text-slate-500 text-[10px] font-mono mt-1">Added: {new Date(item.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Hub Main Tab */}
        {activeTab === "team" && (
          <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl animate-fade-in">
            <h2 className="font-bold text-white text-base mb-1">{org?.name ?? "Your Organization"}</h2>
            <p className="text-slate-400 text-xs mb-6">{org?.employees.length ?? 0} active team members</p>
            <div className="space-y-3 max-w-xl">
              {org?.employees.map((emp, i) => (
                <div key={i} className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300 shadow-inner">
                      {emp.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">{emp.name ?? "Unnamed member"}</p>
                      <p className="text-slate-500 text-[10px] font-mono">{emp.email ?? ""}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
                    emp.role === "admin"
                      ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-sm"
                      : "text-slate-400 bg-white/5 border-white/10"
                  }`}>
                    {emp.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
