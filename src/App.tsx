import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import LoginView from "./views/LoginView";
import MatchesView from "./views/MatchesView";
import MatchDetailView from "./views/MatchDetailView";
import StandingsView from "./views/StandingsView";
import LeaderboardView from "./views/LeaderboardView";
import PlayersView from "./views/PlayersView";
import TournamentsView from "./views/TournamentsView";
import { SeasonProvider, useSeason } from "./SeasonContext";

function Layout() {
  const location = useLocation();
  const { seasons, selectedSeason, setSelectedSeason } = useSeason();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);
  
  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
    return isActive 
      ? "flex items-center px-4 py-3 bg-stone-900 border-l-2 border-amber-500 text-white rounded-r-lg transition-colors"
      : "flex items-center px-4 py-3 text-stone-500 hover:text-stone-200 transition-colors";
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-stone-200 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-stone-800 flex items-center justify-between px-4 z-30">
        <h1 className="text-xl font-serif italic text-white tracking-tight">Soccer-Q</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-stone-300">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-stone-800 flex flex-col shrink-0 z-20 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} pt-16 md:pt-0`}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-serif italic text-white tracking-tight">Soccer-Q</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Admin Management</p>
        </div>
        
        <div className="px-6 py-4 md:py-0 mb-4 border-b border-stone-800 md:border-none">
          <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Season</label>
          <select 
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded text-xs px-3 py-2 text-stone-200 focus:border-amber-500 focus:outline-none"
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.year}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 px-4 md:py-4 space-y-1">
          <Link to="/" onClick={() => setSidebarOpen(false)} className={getLinkClass("/")}>
            <span className="text-sm font-medium">Match Updates</span>
          </Link>
          <Link to="/tournaments" onClick={() => setSidebarOpen(false)} className={getLinkClass("/tournaments")}>
            <span className="text-sm font-medium">Tournaments</span>
          </Link>
          <Link to="/standings" onClick={() => setSidebarOpen(false)} className={getLinkClass("/standings")}>
            <span className="text-sm font-medium">League Standings</span>
          </Link>
          <Link to="/leaderboard" onClick={() => setSidebarOpen(false)} className={getLinkClass("/leaderboard")}>
            <span className="text-sm font-medium">Leaderboard</span>
          </Link>
          <Link to="/players" onClick={() => setSidebarOpen(false)} className={getLinkClass("/players")}>
            <span className="text-sm font-medium">Players</span>
          </Link>
        </nav>
        <div className="p-6 border-t border-stone-800 flex flex-col gap-3 mt-auto">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold">Logged in as</span>
            <span className="text-xs text-stone-300 truncate" title={userEmail}>
              {userEmail || "Loading..."}
            </span>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="w-full text-center py-2 px-3 bg-stone-900 border border-stone-800 hover:border-red-950 hover:bg-red-950/20 hover:text-red-400 rounded text-[11px] font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto mt-16 md:mt-0 relative">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-stone-200 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-stone-500 animate-pulse">Loading Soccer-Q Admin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <SeasonProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MatchesView />} />
            <Route path="matches/:id" element={<MatchDetailView />} />
            <Route path="standings" element={<StandingsView />} />
            <Route path="leaderboard" element={<LeaderboardView />} />
            <Route path="players" element={<PlayersView />} />
            <Route path="tournaments" element={<TournamentsView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SeasonProvider>
  );
}

