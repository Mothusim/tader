"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  getAnalysis,
  AnalysisResult,
  formatCurrency,
  formatPercent,
  formatNumber,
} from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ─── Analyst Reports sub-view ─── */
function AnalystReportsView({ reports }: { reports: { fundamentals: string; technical: string; sentiment: string } }) {
  const sections = [
    { key: "fundamentals", title: "Fundamentals Analyst", emoji: "📊", color: "cyan" },
    { key: "technical", title: "Technical Analyst", emoji: "📈", color: "violet" },
    { key: "sentiment", title: "Sentiment Analyst", emoji: "💬", color: "amber" },
  ] as const;
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.key} className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <span>{s.emoji}</span> {s.title}
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {reports[s.key]}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── Debate Log sub-view ─── */
function DebateLogView({ log }: { log: { role: string; message: string }[] }) {
  const roleLabels: Record<string, { label: string; color: string; emoji: string }> = {
    bullish: { label: "Bull Researcher", color: "text-emerald-400", emoji: "🐂" },
    bearish: { label: "Bear Researcher", color: "text-red-400", emoji: "🐻" },
    bullish_rebuttal: { label: "Bull Rebuttal", color: "text-emerald-300", emoji: "🐂" },
    bearish_conclusion: { label: "Bear Conclusion", color: "text-red-300", emoji: "🐻" },
  };
  return (
    <div className="space-y-4">
      {log.map((turn, i) => {
        const meta = roleLabels[turn.role] ?? { label: turn.role, color: "text-slate-300", emoji: "💬" };
        return (
          <div key={i} className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <p className={`font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2 ${meta.color}`}>
              <span>{meta.emoji}</span> {meta.label}
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{turn.message}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Full Result Viewer (same as dashboard) ─── */
function ResultViewer({ result, onBack }: { result: AnalysisResult; onBack: () => void }) {
  const [researchSubTab, setResearchSubTab] = useState<"overview" | "reports" | "debate" | "feeds">("overview");
  const [chartType, setChartType] = useState<"price" | "rsi" | "macd">("price");
  const chartData = result.technicals?.history ?? [];

  const verdictColor =
    result.recommendation.verdict === "BUY"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : result.recommendation.verdict === "SELL"
      ? "bg-red-500/10 border-red-500/20 text-red-400"
      : "bg-amber-500/10 border-amber-500/20 text-amber-400";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-xs text-slate-400 hover:text-cyan-400 transition flex items-center gap-1.5 mb-2"
      >
        ← Back to History
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">{result.fundamentals.name}</h1>
            <span className="text-xs text-slate-300 font-mono bg-white/5 border border-white/10 rounded px-2.5 py-0.5">{result.ticker}</span>
          </div>
          <p className="text-slate-400 text-xs">{result.fundamentals.sector} · {result.fundamentals.industry}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-white">
            {result.fundamentals.current_price?.toFixed(2)} <span className="text-slate-400 text-xs font-normal">{result.fundamentals.currency}</span>
          </p>
          <p className="text-slate-500 text-[10px] font-mono">
            52W: {formatNumber(result.fundamentals.fifty_two_week_low)} – {formatNumber(result.fundamentals.fifty_two_week_high)}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
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

      {/* Overview */}
      {researchSubTab === "overview" && (
        <div className="space-y-6">
          <div className={`border rounded-2xl p-6 ${verdictColor}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-shrink-0 bg-black/20 border border-white/5 rounded-2xl p-4 text-center min-w-[120px]">
                <div className="text-3xl font-black tracking-tight">{result.recommendation.verdict}</div>
                <div className="text-[10px] opacity-70 mt-1 uppercase tracking-wider font-bold">Trader Call</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>Confidence Index</span>
                  <span>{result.recommendation.confidence}%</span>
                </div>
                <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full rounded-full bg-current transition-all duration-1000" style={{ width: `${result.recommendation.confidence}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center">💼</span>
              Trader&apos;s Executive Summary
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{result.recommendation.summary}</p>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>▲</span> Consensus Catalysts
                </p>
                <ul className="space-y-1.5">
                  {result.recommendation.catalysts.map((c, i) => (
                    <li key={i} className="text-slate-300 text-xs flex gap-2"><span className="text-emerald-400">•</span> {c}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                <p className="text-rose-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>▼</span> Consensus Risks
                </p>
                <ul className="space-y-1.5">
                  {result.recommendation.risks.map((r, i) => (
                    <li key={i} className="text-slate-300 text-xs flex gap-2"><span className="text-rose-400">•</span> {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Financial Snapshot */}
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

      {/* Reports */}
      {researchSubTab === "reports" && result.recommendation.agent_reports && (
        <AnalystReportsView reports={result.recommendation.agent_reports} />
      )}

      {/* Debate */}
      {researchSubTab === "debate" && result.recommendation.debate_log && (
        <DebateLogView log={result.recommendation.debate_log} />
      )}

      {/* Feeds */}
      {researchSubTab === "feeds" && (
        <div className="grid lg:grid-cols-3 gap-6">
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

              {/* Signals */}
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

              {/* Chart */}
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

          {/* News & Reddit sidebar */}
          <div className="space-y-6">
            <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-white text-sm mb-4">RSS News Feed</h3>
              {result.news.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {result.news.map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                      className="block bg-white/3 border border-white/5 rounded-xl p-3.5 hover:border-cyan-500/20 hover:bg-white/5 transition duration-200 group">
                      <p className="text-slate-200 text-xs font-semibold group-hover:text-cyan-400 transition line-clamp-2 mb-1.5">{item.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{item.source}</span><span>·</span><span>{item.published.slice(0, 16)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs">No recent news articles.</p>
              )}
            </div>

            <div className="bg-[#0b121f] border border-white/5 rounded-2xl p-6 shadow-2xl">
              <h3 className="font-bold text-white text-sm mb-4">Retail Sentiment (Reddit)</h3>
              {result.social.length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {result.social.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                      className="block bg-white/3 border border-white/5 rounded-xl p-3.5 hover:border-orange-500/20 hover:bg-white/5 transition duration-200 group">
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
  );
}

/* ═══════════════════════════════════════════════════
   HISTORY PAGE
   ═══════════════════════════════════════════════════ */
export default function HistoryPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);

  /* Auth */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  /* Fetch saved reports */
  const fetchReports = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const data = await getAnalysis(undefined, undefined, session.access_token);
      setReports(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* Sign out */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  /* Not logged in */
  if (!session) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-4">Please sign in to view your history.</p>
          <Link href="/auth" className="text-cyan-400 hover:text-cyan-300 transition text-sm underline">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-cyan-500/30">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute top-[35%] left-[40%] w-[350px] h-[350px] rounded-full bg-violet-600/3 blur-[100px]" />
      </div>

      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center font-extrabold text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] text-white">T</div>
              <span className="font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">TADER</span>
            </Link>
            <Link href="/history" className="ml-4 text-xs text-cyan-400 font-semibold transition">
              History
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:block">{session?.user?.email}</span>
            <button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-white transition duration-200 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/5">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Viewing a selected report */}
        {selectedResult ? (
          <ResultViewer result={selectedResult} onBack={() => setSelectedResult(null)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-white mb-1">Research History</h1>
                <p className="text-slate-400 text-xs">Your previously saved analysis reports.</p>
              </div>
              <Link
                href="/dashboard"
                className="text-xs border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-slate-300 hover:text-cyan-400 rounded-lg px-4 py-2 transition duration-200"
              >
                ← Back to Dashboard
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <svg className="animate-spin w-8 h-8 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-slate-400 text-sm">Loading saved reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center glass border border-white/5 rounded-2xl p-8 max-w-lg mx-auto shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-2xl">
                  📁
                </div>
                <h2 className="text-base font-bold text-white mb-2">No Saved Reports</h2>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                  Run an analysis from the Dashboard and click &quot;Save Report&quot; to store it here for future reference.
                </p>
                <Link href="/dashboard" className="mt-4 text-cyan-400 hover:text-cyan-300 text-xs underline transition">
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => {
                  const r = report.result as AnalysisResult | undefined;
                  const verdict = r?.recommendation?.verdict;
                  const verdictBorder =
                    verdict === "BUY" ? "border-emerald-500/30 hover:border-emerald-500/50" :
                    verdict === "SELL" ? "border-red-500/30 hover:border-red-500/50" :
                    "border-amber-500/30 hover:border-amber-500/50";
                  const verdictBadge =
                    verdict === "BUY" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                    verdict === "SELL" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                    "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  return (
                    <button
                      key={report.id}
                      onClick={() => r && setSelectedResult(r)}
                      className={`bg-[#0b121f] border ${verdictBorder} rounded-2xl p-5 text-left transition duration-250 group shadow-lg hover:shadow-xl hover:scale-[1.01]`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-extrabold font-mono text-base group-hover:text-cyan-400 transition">
                          {report.ticker}
                        </span>
                        {verdict && (
                          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${verdictBadge}`}>
                            {verdict}
                          </span>
                        )}
                      </div>
                      {r && (
                        <p className="text-slate-400 text-[11px] mb-2 line-clamp-1">{r.fundamentals?.name}</p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{r?.fundamentals?.current_price?.toFixed(2)} {r?.fundamentals?.currency}</span>
                        <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                      </div>
                      {r?.recommendation?.confidence && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Confidence</span>
                            <span>{r.recommendation.confidence}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-500/60 transition-all"
                              style={{ width: `${r.recommendation.confidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
