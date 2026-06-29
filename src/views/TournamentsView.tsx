import React, { useEffect, useState } from "react";
import { useSeason } from "../SeasonContext";
import { Plus, Edit2, Trash2, Save, X, Trophy, Shield, Calendar, Settings } from "lucide-react";
import { format } from "date-fns";

interface SeasonData {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  type: string;
}

interface TeamData {
  id: string;
  season_id: string;
  name: string;
  short_name?: string;
  coach?: string;
  stadium?: string;
  founded?: number;
  logo_url?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
}

export default function TournamentsView() {
  const { seasons, refreshSeasons, selectedSeason: contextSeasonId } = useSeason();
  const [activeTab, setActiveTab] = useState<"seasons" | "teams">("seasons");

  // Local Lists
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  // Season Modals
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<SeasonData | null>(null);
  const [seasonForm, setSeasonForm] = useState({
    id: "",
    name: "",
    year: new Date().getFullYear(),
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    is_active: false,
    type: "LEAGUE",
  });

  // Team Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
  const [teamForm, setTeamForm] = useState({
    id: "",
    season_id: "",
    name: "",
    short_name: "",
    coach: "",
    stadium: "",
    founded: new Date().getFullYear(),
    logo_url: "/api/placeholder/100/100",
    primary_color: "#3b82f6",
    secondary_color: "#1e3a8a",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync selected season with global context on mount
  useEffect(() => {
    if (contextSeasonId && !selectedSeasonId) {
      setSelectedSeasonId(contextSeasonId);
    }
  }, [contextSeasonId]);

  // Fetch Teams
  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeams(data);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // --- SEASONS OPERATIONS ---
  const handleOpenAddSeason = () => {
    setEditingSeason(null);
    setSeasonForm({
      id: "",
      name: "",
      year: new Date().getFullYear(),
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(), "yyyy-MM-dd"),
      is_active: false,
      type: "LEAGUE",
    });
    setErrorMsg("");
    setIsSeasonModalOpen(true);
  };

  const handleOpenEditSeason = (season: SeasonData) => {
    setEditingSeason(season);
    setSeasonForm({
      id: season.id,
      name: season.name,
      year: season.year,
      start_date: season.start_date,
      end_date: season.end_date,
      is_active: season.is_active,
      type: season.type || "LEAGUE",
    });
    setErrorMsg("");
    setIsSeasonModalOpen(true);
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const url = editingSeason ? `/api/seasons/${editingSeason.id}` : "/api/seasons";
    const method = editingSeason ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: seasonForm.id || undefined,
          name: seasonForm.name,
          year: parseInt(String(seasonForm.year), 10),
          start_date: seasonForm.start_date,
          end_date: seasonForm.end_date,
          is_active: seasonForm.is_active,
          type: seasonForm.type,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to save season.");
      }

      await refreshSeasons();
      setIsSeasonModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeason = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this season? This action will fail if teams or matches are associated with it.")) {
      return;
    }

    try {
      const res = await fetch(`/api/seasons/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to delete season. Check if it has references.");
      }
      await refreshSeasons();
    } catch (err: any) {
      alert(`Could not delete season: ${err.message || "Constraint violation. Please delete teams and matches in this season first."}`);
    }
  };

  // --- TEAMS OPERATIONS ---
  const handleOpenAddTeam = () => {
    if (!selectedSeasonId) {
      alert("Please select or create a season first.");
      return;
    }
    setEditingTeam(null);
    setTeamForm({
      id: "",
      season_id: selectedSeasonId,
      name: "",
      short_name: "",
      coach: "",
      stadium: "",
      founded: new Date().getFullYear(),
      logo_url: "/api/placeholder/100/100",
      primary_color: "#3b82f6",
      secondary_color: "#1e3a8a",
    });
    setErrorMsg("");
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (team: TeamData) => {
    setEditingTeam(team);
    setTeamForm({
      id: team.id,
      season_id: team.season_id,
      name: team.name,
      short_name: team.short_name || "",
      coach: team.coach || "",
      stadium: team.stadium || "",
      founded: team.founded || new Date().getFullYear(),
      logo_url: team.logo_url || "/api/placeholder/100/100",
      primary_color: team.colors?.primary || "#3b82f6",
      secondary_color: team.colors?.secondary || "#1e3a8a",
    });
    setErrorMsg("");
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
    const method = editingTeam ? "PUT" : "POST";

    const payload = {
      id: teamForm.id || undefined,
      season_id: teamForm.season_id,
      name: teamForm.name,
      short_name: teamForm.short_name || null,
      coach: teamForm.coach || null,
      stadium: teamForm.stadium || null,
      founded: teamForm.founded ? parseInt(String(teamForm.founded), 10) : null,
      logo_url: teamForm.logo_url || null,
      colors: {
        primary: teamForm.primary_color,
        secondary: teamForm.secondary_color,
      },
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to save team.");
      }

      await fetchTeams();
      setIsTeamModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this team? This will remove its standings data.")) {
      return;
    }

    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to delete team.");
      }
      await fetchTeams();
    } catch (err: any) {
      alert(`Could not delete team: ${err.message || "This team is likely referenced in matches or player profiles."}`);
    }
  };

  // Filter teams by season
  const filteredTeams = teams.filter((t) => t.season_id === selectedSeasonId);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <section className="flex flex-col space-y-6 max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-850 pb-5 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Tournament Management
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">
              Create, update, and manage league seasons and team assignments.
            </p>
          </div>

          <div className="flex bg-stone-900/50 p-1 rounded-lg border border-stone-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("seasons")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "seasons"
                  ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/10"
                  : "text-stone-400 hover:text-stone-250"
              }`}
            >
              Seasons
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "teams"
                  ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/10"
                  : "text-stone-400 hover:text-stone-250"
              }`}
            >
              Teams
            </button>
          </div>
        </header>

        {/* Tab 1: Seasons */}
        {activeTab === "seasons" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 font-semibold">Active Seasons</h2>
              <button
                onClick={handleOpenAddSeason}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Season
              </button>
            </div>

            <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase text-stone-600 border-b border-stone-800 bg-stone-950/20">
                  <tr>
                    <th className="px-5 py-4">Season ID</th>
                    <th className="px-5 py-4">Season Name</th>
                    <th className="px-5 py-4">Year</th>
                    <th className="px-5 py-4">Date Range</th>
                    <th className="px-5 py-4 text-center">Type</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50">
                  {seasons.map((season) => (
                    <tr key={season.id} className="hover:bg-stone-900/25 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-stone-400">{season.id}</td>
                      <td className="px-5 py-4 font-medium text-stone-200">{season.name}</td>
                      <td className="px-5 py-4 text-stone-300">{season.year}</td>
                      <td className="px-5 py-4 text-stone-400 font-medium">
                        {season.start_date ? format(new Date(season.start_date), "MMM d, yyyy") : "-"}
                        <span className="mx-1 text-stone-700 font-normal">to</span>
                        {season.end_date ? format(new Date(season.end_date), "MMM d, yyyy") : "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-stone-900 border border-stone-800 text-stone-400">
                          {season.type === "LEAGUE_KNOCKOUT" ? "League + Knockout" : "League"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${
                            season.is_active
                              ? "bg-emerald-950/30 text-emerald-500 border border-emerald-900/30"
                              : "bg-stone-900 text-stone-500 border border-stone-800"
                          }`}
                        >
                          {season.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenEditSeason(season)}
                            className="p-1 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-900 transition-colors"
                            title="Edit Season"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSeason(season.id)}
                            className="p-1 rounded text-stone-550 hover:text-red-400 hover:bg-stone-900 transition-colors"
                            title="Delete Season"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {seasons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-stone-500">
                        No seasons configured. Click Add Season to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Teams */}
        {activeTab === "teams" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold whitespace-nowrap">
                  Filter Season:
                </span>
                <select
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  className="bg-stone-900 border border-stone-800 rounded-lg text-xs px-3 py-1.5 text-stone-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Select Season --</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.year})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenAddTeam}
                disabled={!selectedSeasonId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Team
              </button>
            </div>

            {loadingTeams ? (
              <div className="py-12 text-center text-stone-500 text-sm">Loading teams...</div>
            ) : selectedSeasonId ? (
              <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] uppercase text-stone-600 border-b border-stone-800 bg-stone-950/20">
                    <tr>
                      <th className="px-5 py-4">ID</th>
                      <th className="px-5 py-4">Team Info</th>
                      <th className="px-5 py-4">Short Name</th>
                      <th className="px-5 py-4">Coach</th>
                      <th className="px-5 py-4">Stadium</th>
                      <th className="px-5 py-4 text-center">Founded</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {filteredTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-stone-900/25 transition-colors">
                        <td className="px-5 py-4 font-mono font-semibold text-stone-400">{team.id}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1 shrink-0">
                              <div
                                className="w-3 h-6 rounded"
                                style={{ backgroundColor: team.colors?.primary || "#3b82f6" }}
                                title="Primary Color"
                              />
                              <div
                                className="w-3 h-6 rounded"
                                style={{ backgroundColor: team.colors?.secondary || "#1e3a8a" }}
                                title="Secondary Color"
                              />
                            </div>
                            <span className="font-semibold text-stone-200">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-stone-300">{team.short_name || "-"}</td>
                        <td className="px-5 py-4 text-stone-400">{team.coach || "-"}</td>
                        <td className="px-5 py-4 text-stone-400">{team.stadium || "-"}</td>
                        <td className="px-5 py-4 text-center text-stone-300">{team.founded || "-"}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => handleOpenEditTeam(team)}
                              className="p-1 rounded text-stone-550 hover:text-stone-300 hover:bg-stone-900 transition-colors"
                              title="Edit Team"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-1 rounded text-stone-550 hover:text-red-400 hover:bg-stone-900 transition-colors"
                              title="Delete Team"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTeams.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-stone-500">
                          No teams registered for this season. Click Add Team to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-stone-900/20 border border-stone-850 rounded-xl p-8 text-center text-stone-500 text-sm">
                Select a season from the dropdown above to view and manage its teams.
              </div>
            )}
          </div>
        )}
      </section>

      {/* --- SEASON ADD/EDIT MODAL --- */}
      {isSeasonModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-stone-800 rounded-2xl w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-stone-850 flex justify-between items-center">
              <h3 className="text-sm font-serif italic text-white tracking-tight">
                {editingSeason ? "Edit Season" : "Create New Season"}
              </h3>
              <button
                onClick={() => setIsSeasonModalOpen(false)}
                className="p-1 rounded-lg text-stone-550 hover:text-stone-300 hover:bg-stone-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeason} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                  Season ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. S009 (Leave blank to auto-generate)"
                  value={seasonForm.id}
                  disabled={!!editingSeason}
                  onChange={(e) => setSeasonForm({ ...seasonForm, id: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 disabled:opacity-50 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                  Season Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premier League S01"
                  value={seasonForm.name}
                  onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Year
                  </label>
                  <input
                    type="number"
                    required
                    value={seasonForm.year}
                    onChange={(e) => setSeasonForm({ ...seasonForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Tournament Type
                  </label>
                  <select
                    value={seasonForm.type}
                    onChange={(e) => setSeasonForm({ ...seasonForm, type: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  >
                    <option value="LEAGUE">League</option>
                    <option value="LEAGUE_KNOCKOUT">League + Knockout</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={seasonForm.start_date}
                    onChange={(e) => setSeasonForm({ ...seasonForm, start_date: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={seasonForm.end_date}
                    onChange={(e) => setSeasonForm({ ...seasonForm, end_date: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={seasonForm.is_active}
                  onChange={(e) => setSeasonForm({ ...seasonForm, is_active: e.target.checked })}
                  className="rounded border-stone-800 bg-stone-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-black w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-xs text-stone-300 font-medium cursor-pointer selection:bg-transparent">
                  Set as Active Season
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-stone-850">
                <button
                  type="button"
                  onClick={() => setIsSeasonModalOpen(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black rounded-lg text-xs font-bold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Season"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TEAM ADD/EDIT MODAL --- */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-stone-800 rounded-2xl w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-stone-850 flex justify-between items-center">
              <h3 className="text-sm font-serif italic text-white tracking-tight">
                {editingTeam ? "Edit Team" : "Register New Team"}
              </h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1 rounded-lg text-stone-550 hover:text-stone-300 hover:bg-stone-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Team ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. T030 (Leave empty for auto)"
                    value={teamForm.id}
                    disabled={!!editingTeam}
                    onChange={(e) => setTeamForm({ ...teamForm, id: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 disabled:opacity-50 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Season
                  </label>
                  <select
                    value={teamForm.season_id}
                    disabled
                    className="w-full bg-stone-950 border border-stone-850 opacity-75 rounded-lg p-2.5 text-xs text-stone-400 focus:outline-none"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real Madrid"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Short Name (Max 10 chars)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RMA"
                    maxLength={10}
                    value={teamForm.short_name}
                    onChange={(e) => setTeamForm({ ...teamForm, short_name: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Coach Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Carlo Ancelotti"
                    value={teamForm.coach}
                    onChange={(e) => setTeamForm({ ...teamForm, coach: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Home Stadium
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Santiago Bernabeu"
                    value={teamForm.stadium}
                    onChange={(e) => setTeamForm({ ...teamForm, stadium: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={teamForm.founded}
                    onChange={(e) => setTeamForm({ ...teamForm, founded: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                  Logo Image URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. /logo.png or http://..."
                  value={teamForm.logo_url}
                  onChange={(e) => setTeamForm({ ...teamForm, logo_url: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-stone-950 p-4 rounded-xl border border-stone-850">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Primary Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={teamForm.primary_color}
                      onChange={(e) => setTeamForm({ ...teamForm, primary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer p-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={teamForm.primary_color}
                      onChange={(e) => setTeamForm({ ...teamForm, primary_color: e.target.value })}
                      className="flex-1 bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs font-mono text-stone-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                    Secondary Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={teamForm.secondary_color}
                      onChange={(e) => setTeamForm({ ...teamForm, secondary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer p-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={teamForm.secondary_color}
                      onChange={(e) => setTeamForm({ ...teamForm, secondary_color: e.target.value })}
                      className="flex-1 bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs font-mono text-stone-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-stone-850">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black rounded-lg text-xs font-bold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
