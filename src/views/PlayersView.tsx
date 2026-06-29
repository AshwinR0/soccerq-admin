import React, { useEffect, useState } from "react";
import { Player, Team } from "../types";
import { useSeason } from "../SeasonContext";
import { Search, Filter, Edit2, X, Save } from "lucide-react";

export default function PlayersView() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedSeason } = useSeason();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("all");
  const [selectedPositionFilter, setSelectedPositionFilter] = useState("all");

  // Modal Editing state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<Partial<Player>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const positions = ["GK", "DEF", "MID", "FWD"];

  useEffect(() => {
    if (selectedSeason) {
      fetchPlayersAndTeams();
    }
  }, [selectedSeason]);

  const fetchPlayersAndTeams = async () => {
    setLoading(true);
    try {
      const [playersRes, standingsRes] = await Promise.all([
        fetch(`/api/players?season_id=${selectedSeason}`),
        fetch(`/api/standings?season_id=${selectedSeason}`)
      ]);
      const playersData = await playersRes.json();
      const standingsData = await standingsRes.json();

      if (Array.isArray(playersData)) {
        setPlayers(playersData);
      } else {
        console.error("Failed to load players:", playersData);
        setPlayers([]);
      }

      if (Array.isArray(standingsData)) {
        const seasonTeams = standingsData
          .map((s: any) => s.team)
          .filter(Boolean)
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setTeams(seasonTeams);
      } else {
        console.error("Failed to load standings/teams:", standingsData);
        setTeams([]);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      goals: player.goals ?? 0,
      assists: player.assists ?? 0,
      saves: player.saves ?? 0,
      clean_sheets: player.clean_sheets ?? 0,
      appearances: player.appearances ?? 0,
      minutes_played: player.minutes_played ?? 0,
      yellow_cards: player.yellow_cards ?? 0,
      red_cards: player.red_cards ?? 0,
      team_id: player.team_id
    });
    setError("");
  };

  const handleCloseEdit = () => {
    setEditingPlayer(null);
    setEditForm({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...editForm,
        season_id: selectedSeason // maintain season reference
      };

      const res = await fetch(`/api/players/${editingPlayer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to save updates.");
      }

      const updatedPlayer = await res.json();
      
      // Update local state
      setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...updatedPlayer } : p));
      handleCloseEdit();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while saving statistics.");
    } finally {
      setSaving(false);
    }
  };

  // Filtering Logic
  const filteredPlayers = players.filter(player => {
    const name = player.player_profile?.name || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTeam = selectedTeamFilter === "all" || player.team_id === selectedTeamFilter;
    
    const matchesPosition = selectedPositionFilter === "all" || 
      player.player_profile?.position?.toUpperCase() === selectedPositionFilter.toUpperCase();

    return matchesSearch && matchesTeam && matchesPosition;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return <div className="p-4 md:p-8 text-stone-500 text-sm">Loading players...</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <section className="flex flex-col space-y-6 max-w-6xl mx-auto">
        <header className="mb-2 md:mb-4">
          <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-tight">Players</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">
            Update seasonal performance data and team assignments for players.
          </p>
        </header>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 bg-stone-900/20 border border-stone-850 p-4 rounded-xl items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Search players by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2 pl-9 pr-4 text-xs text-stone-200 placeholder-stone-500 focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap w-full md:w-auto gap-4 items-center">
            {/* Team Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 whitespace-nowrap">Team:</span>
              <select
                value={selectedTeamFilter}
                onChange={e => setSelectedTeamFilter(e.target.value)}
                className="w-full sm:w-auto bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Teams</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Position Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 whitespace-nowrap">Position:</span>
              <select
                value={selectedPositionFilter}
                onChange={e => setSelectedPositionFilter(e.target.value)}
                className="w-full sm:w-auto bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Positions</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Players Table */}
        <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase text-stone-600 border-b border-stone-800 bg-stone-950/20">
              <tr>
                <th className="px-5 py-4">Player</th>
                <th className="px-5 py-4">Team</th>
                <th className="px-5 py-2 text-center">App</th>
                <th className="px-5 py-2 text-center">Min</th>
                <th className="px-5 py-2 text-center">Goals</th>
                <th className="px-5 py-2 text-center">Assists</th>
                <th className="px-5 py-2 text-center">Saves</th>
                <th className="px-5 py-2 text-center">CS</th>
                <th className="px-5 py-2 text-center">YC</th>
                <th className="px-5 py-2 text-center">RC</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {filteredPlayers.map(player => (
                <tr key={player.id} className="hover:bg-stone-900/40 transition-colors">
                  {/* Player Name and Info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center font-serif text-[10px] font-semibold text-amber-500 border border-stone-700 shrink-0">
                        {getInitials(player.player_profile?.name || "")}
                      </div>
                      <div>
                        <span className="font-medium text-stone-200 block text-xs">
                          {player.player_profile?.name || player.player_profile_id}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          #{player.player_profile?.jersey_number} · {player.player_profile?.position}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Team */}
                  <td className="px-5 py-4 font-medium text-stone-300">
                    {player.team?.name || "Unassigned"}
                  </td>

                  {/* Stats */}
                  <td className="px-5 py-4 text-center font-medium text-stone-300">{player.appearances}</td>
                  <td className="px-5 py-4 text-center font-medium text-stone-300">{player.minutes_played}</td>
                  <td className="px-5 py-4 text-center font-bold text-amber-500">{player.goals}</td>
                  <td className="px-5 py-4 text-center font-medium text-stone-300">{player.assists}</td>
                  <td className="px-5 py-4 text-center font-medium text-stone-300">{player.saves}</td>
                  <td className="px-5 py-4 text-center font-medium text-stone-300">{player.clean_sheets}</td>
                  <td className="px-5 py-4 text-center font-medium text-yellow-600">{player.yellow_cards}</td>
                  <td className="px-5 py-4 text-center font-medium text-red-500">{player.red_cards}</td>

                  {/* Action */}
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(player)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-stone-400 hover:text-white bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3. h-3" />
                      Edit Stats
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-8 text-center text-stone-500">
                    No players found matching current search/filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Player Stats Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e0e0e] border border-stone-800 rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-850">
              <div>
                <h3 className="text-sm font-serif italic text-white">
                  Edit Statistics: {editingPlayer.player_profile?.name || editingPlayer.id}
                </h3>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  Update records for Season: {selectedSeason} · {editingPlayer.player_profile?.position}
                </p>
              </div>
              <button
                onClick={handleCloseEdit}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 text-xs">
                  {error}
                </div>
              )}

              {/* Team Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-stone-500">Team Assignment</label>
                <select
                  value={editForm.team_id || ""}
                  onChange={e => setEditForm({ ...editForm, team_id: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Play */}
                <div className="space-y-4 bg-stone-900/10 border border-stone-850 p-4 rounded-xl">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold border-b border-stone-800 pb-1 mb-2">
                    Participation
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Appearances</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.appearances ?? 0}
                        onChange={e => setEditForm({ ...editForm, appearances: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Minutes Played</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.minutes_played ?? 0}
                        onChange={e => setEditForm({ ...editForm, minutes_played: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Offensive Contributions */}
                <div className="space-y-4 bg-stone-900/10 border border-stone-850 p-4 rounded-xl">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold border-b border-stone-800 pb-1 mb-2">
                    Offense
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Goals</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.goals ?? 0}
                        onChange={e => setEditForm({ ...editForm, goals: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-amber-500 font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Assists</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.assists ?? 0}
                        onChange={e => setEditForm({ ...editForm, assists: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Goalkeeping */}
                <div className="space-y-4 bg-stone-900/10 border border-stone-850 p-4 rounded-xl">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold border-b border-stone-800 pb-1 mb-2">
                    Defending & Goalkeeping
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Saves</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.saves ?? 0}
                        onChange={e => setEditForm({ ...editForm, saves: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Clean Sheets</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.clean_sheets ?? 0}
                        onChange={e => setEditForm({ ...editForm, clean_sheets: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Discipline */}
                <div className="space-y-4 bg-stone-900/10 border border-stone-850 p-4 rounded-xl">
                  <h4 className="text-[10px] uppercase tracking-widest text-stone-500 font-bold border-b border-stone-800 pb-1 mb-2">
                    Discipline
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Yellow Cards</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.yellow_cards ?? 0}
                        onChange={e => setEditForm({ ...editForm, yellow_cards: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-yellow-600 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400">Red Cards</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.red_cards ?? 0}
                        onChange={e => setEditForm({ ...editForm, red_cards: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-red-550 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-850">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-white bg-transparent border border-stone-800 hover:border-stone-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-black bg-amber-500 hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
