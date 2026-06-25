"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgAction, setOrgAction] = useState<"create" | "join">("create");
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signupError || !data.user) {
      setError(signupError?.message || "Signup failed");
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    try {
      const { error: setupError } = await supabase.rpc('setup_user_org', {
        p_user_id: userId,
        p_email: email,
        p_name: name,
        p_org_action: orgAction,
        p_org_name: orgName,
        p_invite_code: inviteCode
      });

      if (setupError) {
        setError(setupError.message || "Failed to setup organization");
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with the server");
      setLoading(false);
      return;
    }

    setMessage("Account created! Please check your email to confirm your account, then log in.");
    setMode("login");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050a15] flex items-center justify-center p-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">T</div>
            <span className="text-2xl font-bold text-white tracking-tight">Tader</span>
          </div>
          <p className="text-slate-400 text-sm">AI-Powered Investment Research Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex rounded-lg bg-white/5 p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {message}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg py-2.5 font-medium text-sm hover:opacity-90 transition disabled:opacity-60 mt-2"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                />
              </div>

              {/* Organization Section */}
              <div className="border border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-slate-300 text-sm font-medium">Organization</p>
                <div className="flex rounded-lg bg-white/5 p-1">
                  <button
                    type="button"
                    onClick={() => setOrgAction("create")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      orgAction === "create" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400"
                    }`}
                  >
                    Create New Org
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrgAction("join")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                      orgAction === "join" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-400"
                    }`}
                  >
                    Join Existing Org
                  </button>
                </div>
                {orgAction === "create" ? (
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Organization name (e.g. Acme Capital)"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Invite code (from your admin)"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg py-2.5 font-medium text-sm hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-slate-500 text-xs mt-4">
          All analysis is for informational purposes only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
