import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Match, MatchEvent, PlayerProfile } from "../types";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";

export default function MatchDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);

  // Form State
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [status, setStatus] = useState<string>("Upcoming");
  
  const [newEvent, setNewEvent] = useState({
    event: "Goal",
    minute: "",
    player: "",
    assist_player: "",
    team_id: "",
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/matches/${id}`)
      .then(res => res.json())
      .then(matchData => {
        if (matchData && !matchData.error) {
          setMatch(matchData);
          setHomeScore(matchData.home_score !== null ? String(matchData.home_score) : "");
          setAwayScore(matchData.away_score !== null ? String(matchData.away_score) : "");
          setStatus(matchData.status || "Upcoming");
          
          if (matchData.home_team_id) {
            setNewEvent(prev => ({ ...prev, team_id: matchData.home_team_id }));
          }

          // Fetch events and players of this season in parallel
          return Promise.all([
            fetch(`/api/matches/${id}/events`).then(res => res.json()),
            fetch(`/api/season-players?season_id=${matchData.season_id}`).then(res => res.json())
          ]);
        } else {
          throw new Error("Match not found");
        }
      })
      .then(([eventsData, playersData]) => {
        if (Array.isArray(eventsData)) {
          setEvents(eventsData);
        } else {
          console.error("Failed to load events:", eventsData);
          setEvents([]);
        }

        if (Array.isArray(playersData)) {
          // Extract player_profile from season players data
          const seasonProfiles = playersData
            .map((p: any) => p.player_profile)
            .filter(Boolean);
          setPlayers(seasonProfiles);
        } else {
          console.error("Failed to load players:", playersData);
          setPlayers([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const [eventError, setEventError] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editEventForm, setEditEventForm] = useState<Partial<MatchEvent>>({});

  const handleSaveMatch = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home_score: homeScore === "" ? null : parseInt(homeScore, 10),
          away_score: awayScore === "" ? null : parseInt(awayScore, 10),
          status
        })
      });
      if (!res.ok) throw new Error("Failed to save match");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvent = async () => {
    setEventError("");
    if (!newEvent.minute || !newEvent.player || !newEvent.team_id) {
      setEventError("Minute, Player, and Team are required.");
      return;
    }
    
    try {
      const res = await fetch(`/api/matches/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: newEvent.event,
          minute: parseInt(newEvent.minute, 10),
          player: newEvent.player,
          assist_player: newEvent.assist_player || null,
          team_id: newEvent.team_id,
          event_order: 1 // simplified
        })
      });
      
      if (res.ok) {
        // Re-fetch events to get joined data
        const freshEvents = await fetch(`/api/matches/${id}/events`).then(r => r.json());
        setEvents(freshEvents);
        
        // Reset form slightly
        setNewEvent(prev => ({ ...prev, minute: "", player: "", assist_player: "" }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditEvent = async (eventId: number) => {
    try {
      const payload: any = {
        event: editEventForm.event,
        minute: editEventForm.minute ? parseInt(String(editEventForm.minute), 10) : undefined,
        player: editEventForm.player,
        team_id: editEventForm.team_id,
        assist_player: editEventForm.assist_player || null
      };

      await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setEditingEventId(null);
      const freshEvents = await fetch(`/api/matches/${id}/events`).then(r => r.json());
      setEvents(freshEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-stone-500 text-sm">Loading...</div>;
  if (!match) return <div className="p-4 md:p-8 text-stone-500 text-sm">Match not found.</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 w-full">
      <button 
        onClick={() => navigate("/")}
        className="flex items-center text-xs font-medium text-stone-500 hover:text-stone-300 transition-colors mb-2"
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        Back to Matches
      </button>

      <header className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-tight">Edit Match</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">{match.home_team?.name} vs {match.away_team?.name}</p>
      </header>

      {/* Match Result Editor */}
      <section className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 md:p-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-4 md:mb-6">Result & Status</h2>
        
        <div className="flex flex-row items-center gap-2 md:gap-6">
          <div className="flex-1 text-right">
            <label className="block text-xs md:text-sm font-medium text-stone-200 mb-2 md:mb-3 truncate">{match.home_team?.name}</label>
            <input 
              type="number"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-12 h-12 md:w-16 md:h-16 bg-black border border-stone-700 rounded text-center text-xl md:text-2xl font-serif text-amber-500 ml-auto block focus:border-amber-500 focus:outline-none"
            />
          </div>
          
          <div className="text-stone-700 text-xl md:text-2xl font-serif italic mt-4 md:mt-6">VS</div>
          
          <div className="flex-1 text-left">
            <label className="block text-xs md:text-sm font-medium text-stone-200 mb-2 md:mb-3 truncate">{match.away_team?.name}</label>
            <input 
              type="number"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-12 h-12 md:w-16 md:h-16 bg-black border border-stone-700 rounded text-center text-xl md:text-2xl font-serif text-amber-500 block focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-stone-800">
          <div className="w-full sm:w-1/3">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Match Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded text-xs px-3 py-2 text-stone-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="Upcoming">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <button 
            onClick={handleSaveMatch}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center justify-center mt-4 sm:mt-0"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Result"}
          </button>
        </div>
      </section>

      {/* Match Events */}
      <section className="bg-stone-900/40 border border-stone-800 rounded-xl p-4 md:p-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-4 md:mb-6">Match Events</h2>
        
        {/* Existing Events List */}
        <div className="space-y-2 mb-6">
          {events.length === 0 ? (
            <p className="text-sm text-stone-500 italic px-2">No events recorded yet.</p>
          ) : (
            events.map(ev => {
              if (editingEventId === ev.id) {
                return (
                  <div key={ev.id} className="flex flex-wrap md:flex-nowrap items-center text-xs p-3 bg-stone-900 border border-stone-700 rounded gap-2">
                    <input type="number" className="w-12 bg-black border border-stone-600 rounded p-1 text-stone-200" value={editEventForm.minute || ''} onChange={e => setEditEventForm({...editEventForm, minute: parseInt(e.target.value)})} />
                    <select className="flex-1 bg-black border border-stone-600 rounded p-1 text-stone-200" value={editEventForm.player || ''} onChange={e => setEditEventForm({...editEventForm, player: e.target.value})}>
                      {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="w-24 bg-black border border-stone-600 rounded p-1 text-stone-200" value={editEventForm.event || ''} onChange={e => setEditEventForm({...editEventForm, event: e.target.value})}>
                      <option value="Goal">Goal</option>
                      <option value="Yellow Card">Yellow Card</option>
                      <option value="Red Card">Red Card</option>
                      <option value="Own Goal">Own Goal</option>
                      <option value="Penalty Miss">Penalty Miss</option>
                      <option value="Penalty Goal">Penalty Goal</option>
                      <option value="Substitution">Substitution</option>
                    </select>
                    <select className="w-24 bg-black border border-stone-600 rounded p-1 text-stone-200" value={editEventForm.team_id || ''} onChange={e => setEditEventForm({...editEventForm, team_id: e.target.value})}>
                      <option value={match.home_team_id}>{match.home_team?.name || 'Home'}</option>
                      <option value={match.away_team_id}>{match.away_team?.name || 'Away'}</option>
                    </select>
                    {editEventForm.event === 'Goal' && (
                      <select className="w-24 bg-black border border-stone-600 rounded p-1 text-stone-200" value={editEventForm.assist_player || ''} onChange={e => setEditEventForm({...editEventForm, assist_player: e.target.value})}>
                        <option value="">No Assist</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                    <button onClick={() => handleEditEvent(ev.id)} className="text-amber-500 hover:text-amber-400 p-1">Save</button>
                    <button onClick={() => setEditingEventId(null)} className="text-stone-500 hover:text-stone-400 p-1">Cancel</button>
                  </div>
                );
              }
              return (
              <div key={ev.id} className="flex items-center text-xs p-3 bg-stone-950/50 border border-stone-800 rounded">
                <span className="w-8 md:w-10 font-serif italic text-stone-500">{ev.minute}'</span>
                <span className="flex-1 font-medium text-stone-200 truncate pr-2" onClick={() => { setEditingEventId(ev.id); setEditEventForm({ minute: ev.minute, event: ev.event, player: ev.player, team_id: ev.team_id, assist_player: ev.assist_player }); }} style={{cursor: 'pointer'}}>
                  {ev.player_profile?.name || ev.player}
                  {ev.assist_profile && (
                    <span className="text-stone-500 text-[10px] ml-2 italic block md:inline">
                      (Assist: {ev.assist_profile.name})
                    </span>
                  )}
                </span>
                <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase mr-2 md:mr-3 whitespace-nowrap", 
                  ['goal', 'own goal', 'penalty goal'].includes(ev.event.toLowerCase()) ? 'bg-amber-900/30 text-amber-400' :
                  ['yellow card', 'yellow_card'].includes(ev.event.toLowerCase()) ? 'bg-yellow-900/30 text-yellow-400' :
                  ['red card', 'red_card'].includes(ev.event.toLowerCase()) ? 'bg-red-900/30 text-red-400' : 'bg-stone-800 text-stone-300'
                )}>
                  {ev.event.replace('_', ' ')}
                </span>
                <button 
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="text-stone-600 hover:text-red-400 transition-colors p-1 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )})
          )}
        </div>

        {/* Add New Event Form */}
        <div className="pt-6 border-t border-stone-800 space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-4">Add Event</h3>
          {eventError && <p className="text-red-500 text-xs">{eventError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="col-span-1">
              <label className="block text-[10px] uppercase text-stone-500 mb-1">Min</label>
              <input 
                type="number" 
                value={newEvent.minute}
                onChange={e => setNewEvent({...newEvent, minute: e.target.value})}
                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none" 
                placeholder="45"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] uppercase text-stone-500 mb-1">Type</label>
              <select 
                value={newEvent.event}
                onChange={e => setNewEvent({...newEvent, event: e.target.value})}
                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="Goal">Goal</option>
                <option value="Yellow Card">Yellow Card</option>
                <option value="Red Card">Red Card</option>
                <option value="Own Goal">Own Goal</option>
                <option value="Penalty Miss">Penalty Miss</option>
                <option value="Penalty Goal">Penalty Goal</option>
                <option value="Substitution">Substitution</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] uppercase text-stone-500 mb-1">Team</label>
              <select 
                value={newEvent.team_id}
                onChange={e => setNewEvent({...newEvent, team_id: e.target.value})}
                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value={match.home_team_id}>{match.home_team?.name || 'Home'}</option>
                <option value={match.away_team_id}>{match.away_team?.name || 'Away'}</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] uppercase text-stone-500 mb-1">Player</label>
              <select 
                value={newEvent.player}
                onChange={e => setNewEvent({...newEvent, player: e.target.value})}
                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="">Select Player...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {newEvent.event === 'Goal' && (
            <div className="grid grid-cols-1 gap-4 items-end">
               <div className="col-span-1">
                <label className="block text-[10px] uppercase text-stone-500 mb-1">Assist (Optional)</label>
                <select 
                  value={newEvent.assist_player}
                  onChange={e => setNewEvent({...newEvent, assist_player: e.target.value})}
                  className="w-full md:w-2/5 bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none ml-auto block"
                >
                  <option value="">No Assist...</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <button 
              onClick={handleAddEvent}
              className="w-full md:w-auto px-4 py-2 bg-stone-800 border border-stone-700 text-stone-200 rounded text-xs hover:bg-stone-700 transition-colors font-medium flex items-center justify-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Event
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
