import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Match, Team } from "../types";
import { format } from "date-fns";
import { useSeason } from "../SeasonContext";
import { Calendar, Plus, X, Save } from "lucide-react";

const getStageLabel = (stage?: string) => {
  if (!stage) return "";
  const s = stage.toUpperCase();
  if (s === "GROUP") return "Group Stage";
  if (s === "KNOCKOUT") return "Qualifier";
  if (s === "FINAL") return "Final";
  return stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
};

export default function MatchesView() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedSeason } = useSeason();

  // Filters State
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Create Match State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createForm, setCreateForm] = useState({
    home_team_id: "",
    away_team_id: "",
    match_date: format(new Date(), "yyyy-MM-dd"),
    match_time: "17:00",
    timezone: "UTC",
    venue: "",
    status: "Upcoming",
    stage: "GROUP",
    match_group: "",
  });

  // Fetch teams of the selected season
  useEffect(() => {
    if (!selectedSeason) return;
    fetch(`/api/standings?season_id=${selectedSeason}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const seasonTeams = data
            .map((s: any) => s.team)
            .filter(Boolean)
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
          setTeams(seasonTeams);
        }
      })
      .catch(console.error);
  }, [selectedSeason]);

  const loadMatches = (seasonId: string) => {
    setLoading(true);
    fetch(`/api/matches?season_id=${seasonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => {
            const dateA = a.match_date || "";
            const dateB = b.match_date || "";
            if (dateA !== dateB) {
              return dateB.localeCompare(dateA);
            }
            const timeA = a.match_time || "";
            const timeB = b.match_time || "";
            if (timeA !== timeB) {
              return timeB.localeCompare(timeA);
            }
            return b.id.localeCompare(a.id);
          });
          setMatches(sorted);
        } else {
          console.error("Failed to load matches:", data);
          setMatches([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedSeason) {
      loadMatches(selectedSeason);
    }
  }, [selectedSeason]);

  const handleOpenCreateModal = () => {
    setCreateForm({
      home_team_id: teams[0]?.id || "",
      away_team_id: teams[1]?.id || "",
      match_date: format(new Date(), "yyyy-MM-dd"),
      match_time: "17:00",
      timezone: "UTC",
      venue: "",
      status: "Upcoming",
      stage: "GROUP",
      match_group: "",
    });
    setErrorMsg("");
    setIsCreateModalOpen(true);
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.home_team_id || !createForm.away_team_id) {
      setErrorMsg("Please select both Home and Away teams.");
      return;
    }
    if (createForm.home_team_id === createForm.away_team_id) {
      setErrorMsg("Home and Away teams must be different.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        season_id: selectedSeason,
        home_team_id: createForm.home_team_id,
        away_team_id: createForm.away_team_id,
        match_date: createForm.match_date || null,
        match_time: createForm.match_time ? `${createForm.match_time}:00` : null,
        timezone: createForm.timezone || "UTC",
        venue: createForm.venue || null,
        status: createForm.status,
        stage: createForm.stage,
        match_group: createForm.match_group || null,
        home_score: null,
        away_score: null,
        home_penalty_score: null,
        away_penalty_score: null
      };

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to create match.");
      }

      setIsCreateModalOpen(false);
      loadMatches(selectedSeason);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (selectedTeam && match.home_team_id !== selectedTeam && match.away_team_id !== selectedTeam) {
      return false;
    }
    if (selectedDate && match.match_date !== selectedDate) {
      return false;
    }
    if (selectedStatus) {
      if (match.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex justify-center text-stone-500 text-sm">
        <p>Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <section className="flex flex-col space-y-6 max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-tight">Matches</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Select a match to update scores and events.</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-semibold transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Match
          </button>
        </header>

        {/* Filters */}
        <div className="bg-stone-900/20 border border-stone-880 rounded-xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-2">
          {/* Team Filter */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-semibold">Filter by Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg text-xs px-3 py-2 text-stone-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-semibold">Filter by Date</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg text-xs pl-3 pr-10 py-2 text-stone-200 focus:border-amber-500 focus:outline-none cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-stone-500 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-semibold">Filter by Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg text-xs px-3 py-2 text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            {/* Clear Button */}
            {(selectedTeam || selectedDate || selectedStatus) && (
              <button
                onClick={() => {
                  setSelectedTeam("");
                  setSelectedDate("");
                  setSelectedStatus("");
                }}
                className="px-4 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 rounded-lg text-xs transition-colors font-medium h-[34px] self-end"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredMatches.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-700 transition-colors block flex flex-col"
            >
              <div className="p-4 border-b border-stone-800 bg-stone-950/50 flex justify-between items-center text-xs text-stone-500">
                <div className="flex items-center space-x-2">
                  <time className="font-serif italic text-stone-300">
                    {match.match_date ? format(new Date(match.match_date), "MMM d, yyyy") : "TBD"}
                  </time>
                  {match.match_time && (
                    <>
                      <span className="text-stone-700">•</span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {match.match_time.slice(0, 5)}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {match.stage && (
                    <span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-500 border border-amber-900/30 text-[10px] uppercase font-semibold">
                      {getStageLabel(match.stage)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px] uppercase font-semibold">
                    {match.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-center flex-1">
                    <p className="text-sm font-medium text-stone-200 truncate">{match.home_team?.name || match.home_team_id}</p>
                  </div>
                  <div className="text-stone-700 text-xl font-serif italic px-4">VS</div>
                  <div className="text-center flex-1">
                    <p className="text-sm font-medium text-stone-200 truncate">{match.away_team?.name || match.away_team_id}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center px-4 mt-2">
                    <div className="w-12 h-12 bg-black border border-stone-700 rounded flex items-center justify-center text-xl font-serif text-amber-500 mx-auto">
                        {match.home_score !== null ? match.home_score : "-"}
                    </div>
                    <div className="w-12 h-12 bg-black border border-stone-700 rounded flex items-center justify-center text-xl font-serif text-amber-500 mx-auto">
                        {match.away_score !== null ? match.away_score : "-"}
                    </div>
                </div>

                {(match.home_penalty_score !== null && match.away_penalty_score !== null) && (
                  <div className="text-center text-[10px] font-medium text-stone-500 uppercase mt-4">
                    Penalties: {match.home_penalty_score} - {match.away_penalty_score}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {filteredMatches.length === 0 && (
            <div className="col-span-full py-12 text-center text-stone-500 bg-stone-900/40 rounded-xl border border-stone-800 text-sm">
              No matches found.
            </div>
          )}
        </div>
      </section>

      {/* --- CREATE MATCH MODAL --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-stone-800 rounded-2xl w-full max-w-lg max-h-[95vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-stone-850 flex justify-between items-center">
              <h3 className="text-sm font-serif italic text-white tracking-tight">Create New Match</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-stone-550 hover:text-stone-300 hover:bg-stone-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="flex-1 overflow-y-auto p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Home Team</label>
                  <select
                    value={createForm.home_team_id}
                    required
                    onChange={(e) => setCreateForm({ ...createForm, home_team_id: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  >
                    <option value="">-- Select Home Team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Away Team</label>
                  <select
                    value={createForm.away_team_id}
                    required
                    onChange={(e) => setCreateForm({ ...createForm, away_team_id: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  >
                    <option value="">-- Select Away Team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Match Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.match_date}
                    onChange={(e) => setCreateForm({ ...createForm, match_date: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Match Time</label>
                  <input
                    type="time"
                    required
                    value={createForm.match_time}
                    onChange={(e) => setCreateForm({ ...createForm, match_time: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Venue</label>
                  <input
                    type="text"
                    placeholder="Stadium / Venue"
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Match Stage</label>
                  <select
                    value={createForm.stage}
                    onChange={(e) => setCreateForm({ ...createForm, stage: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="GROUP">Group Stage</option>
                    <option value="KNOCKOUT">Qualifier (Knockout)</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Group (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    maxLength={10}
                    value={createForm.match_group}
                    onChange={(e) => setCreateForm({ ...createForm, match_group: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="in_progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Timezone</label>
                <input
                  type="text"
                  placeholder="UTC"
                  value={createForm.timezone}
                  onChange={(e) => setCreateForm({ ...createForm, timezone: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-stone-850">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                  {saving ? "Creating..." : "Create Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

