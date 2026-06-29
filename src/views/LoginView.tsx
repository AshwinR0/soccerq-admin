import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Shield, Sparkles, AlertCircle } from "lucide-react";

export default function LoginView() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "An error occurred during sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[#050505] bg-[radial-gradient(#e5a50a12_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      {/* Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-700/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Glassmorphic Login Card */}
      <div className="w-full max-w-md bg-stone-950/70 backdrop-blur-xl border border-stone-800/80 rounded-2xl p-8 md:p-10 shadow-2xl relative z-10 flex flex-col items-center text-center transition-all duration-300 hover:border-stone-700/80">
        
        {/* Animated Badge */}
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6 relative group overflow-hidden transition-transform duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className="w-8 h-8 text-black" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-serif italic text-white tracking-tight mb-1">Soccer-Q</h1>
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-500 font-semibold mb-6">Admin Management Portal</p>
        
        <div className="w-12 h-[1px] bg-stone-800 mb-6" />

        {/* Description */}
        <p className="text-xs text-stone-400 leading-relaxed mb-8 max-w-xs">
          Welcome to the Soccer-Q administrative control panel. Please sign in below using your authorized Google Account. Access is restricted to provisioned administrators.
        </p>

        {/* OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center py-3.5 px-4 bg-white hover:bg-stone-100 disabled:bg-stone-300 text-stone-950 font-medium rounded-xl shadow-xl hover:shadow-white/5 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin mr-3" />
          ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          )}
          <span className="text-sm font-semibold tracking-wide">
            {loading ? "Connecting to Supabase..." : "Sign in with Google"}
          </span>
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-6 w-full text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg p-3 text-left flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Authentication Error</p>
              <p className="text-[11px] text-red-400/80 leading-normal">{error}</p>
            </div>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="mt-8 text-[10px] text-stone-600 uppercase tracking-widest flex items-center gap-1.5 pointer-events-none">
          <Shield className="w-3.5 h-3.5 text-stone-700" />
          <span>Secured by Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
