import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
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
        <div className="p-6 border-t border-stone-800 text-[10px] text-stone-600 uppercase tracking-widest hidden md:block">
          Supabase Connected
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

