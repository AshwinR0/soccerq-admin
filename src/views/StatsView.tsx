import { useEffect, useState } from "react";
import { TopScorer, GoldenGlove, PlayerProfile } from "../types";
import { useSeason } from "../SeasonContext";

export default function StatsView() {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [goldenGloves, setGoldenGloves] = useState<GoldenGlove[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerProfile>>({});
  const [loading, setLoading] = useState(true);
  const { selectedSeason } = useSeason();

  // Editing state for top scorers
  const [editingScorerId, setEditingScorerId] = useState<number | null>(null);
  const [scorerForm, setScorerForm] = useState<Partial<TopScorer>>({});
  const [isAddingScorer, setIsAddingScorer] = useState(false);
  const [newScorerForm, setNewScorerForm] = useState<Partial<TopScorer>>({});

  // Editing state for golden gloves
  const [editingGloveId, setEditingGloveId] = useState<number | null>(null);
  const [gloveForm, setGloveForm] = useState<Partial<GoldenGlove>>({});
  const [isAddingGlove, setIsAddingGlove] = useState(false);
  const [newGloveForm, setNewGloveForm] = useState<Partial<GoldenGlove>>({});

  useEffect(() => {
    if (!selectedSeason) return;
    
    setLoading(true);
    Promise.all([
      fetch(`/api/top-scorers?season_id=${selectedSeason}`).then(res => res.json()),
      fetch(`/api/golden-gloves?season_id=${selectedSeason}`).then(res => res.json()),
      fetch("/api/players").then(res => res.json())
    ])
    .then(([scorersData, glovesData, playersData]) => {
      if (Array.isArray(scorersData)) {
        setTopScorers(scorersData);
      } else {
        console.error("Failed to load top scorers:", scorersData);
        setTopScorers([]);
      }
      
      if (Array.isArray(glovesData)) {
        setGoldenGloves(glovesData);
      } else {
        console.error("Failed to load golden gloves:", glovesData);
        setGoldenGloves([]);
      }
      
      const playerMap: Record<string, PlayerProfile> = {};
      if (Array.isArray(playersData)) {
        playersData.forEach((p: PlayerProfile) => {
          playerMap[p.id] = p;
        });
      } else {
        console.error("Failed to load players:", playersData);
      }
      setPlayers(playerMap);
      
      setLoading(false);
    })
    .catch(console.error);
  }, [selectedSeason]);

  const refreshData = async () => {
    if (!selectedSeason) return;
    const scorers = await fetch(`/api/top-scorers?season_id=${selectedSeason}`).then(res => res.json());
    const gloves = await fetch(`/api/golden-gloves?season_id=${selectedSeason}`).then(res => res.json());
    if (Array.isArray(scorers)) setTopScorers(scorers);
    if (Array.isArray(gloves)) setGoldenGloves(gloves);
  };

  const handleSaveScorer = async (id: number) => {
    try {
      const { players, player, profile, ...updatePayload } = scorerForm as any;
      await fetch(`/api/top-scorers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
      setEditingScorerId(null);
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGlove = async (id: number) => {
    try {
      const { players, player, profile, ...updatePayload } = gloveForm as any;
      await fetch(`/api/golden-gloves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
      setEditingGloveId(null);
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddScorer = async () => {
    try {
      const payload = { ...newScorerForm, season_id: selectedSeason };
      await fetch(`/api/top-scorers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setIsAddingScorer(false);
      setNewScorerForm({});
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGlove = async () => {
    try {
      const payload = { ...newGloveForm, season_id: selectedSeason };
      await fetch(`/api/golden-gloves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setIsAddingGlove(false);
      setNewGloveForm({});
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-stone-500 text-sm">Loading stats...</div>;

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <section className="flex flex-col space-y-6 md:space-y-8 max-w-6xl mx-auto">
      <header className="mb-2 md:mb-4">
        <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-tight">Player Stats</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Manage top scorers and golden gloves rankings.</p>
      </header>

      {/* Top Scorers */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">Top Scorers</h2>
          {!isAddingScorer && (
            <button 
              onClick={() => setIsAddingScorer(true)}
              className="text-xs text-stone-300 hover:text-white px-3 py-1 bg-stone-900 border border-stone-800 rounded transition-colors"
            >
              Add Player
            </button>
          )}
        </div>
        <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase text-stone-600 border-b border-stone-800">
              <tr>
                <th className="px-5 py-4 w-20">Rank</th>
                <th className="px-5 py-4">Player ID</th>
                <th className="px-5 py-4 w-24 text-center">Goals</th>
                <th className="px-5 py-4 w-24 text-center">Assists</th>
                <th className="px-5 py-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {topScorers.map(row => {
                const isEditing = editingScorerId === row.id;
                return (
                  <tr key={row.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="px-5 py-4 font-serif italic text-stone-400">
                      {isEditing ? <input type="number" className="w-16 bg-black border border-stone-700 rounded p-1 text-stone-200 focus:border-amber-500 focus:outline-none" value={scorerForm.rank || 0} onChange={e => setScorerForm({...scorerForm, rank: parseInt(e.target.value)})} /> : row.rank}
                    </td>
                    <td className="px-5 py-4 font-medium text-stone-200">
                      {row.players?.player_profile?.name || row.player_id}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-amber-500">
                      {isEditing ? <input type="number" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={scorerForm.goals || 0} onChange={e => setScorerForm({...scorerForm, goals: parseInt(e.target.value)})} /> : row.goals}
                    </td>
                    <td className="px-5 py-4 text-center text-stone-400">
                      {isEditing ? <input type="number" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={scorerForm.assists || 0} onChange={e => setScorerForm({...scorerForm, assists: parseInt(e.target.value)})} /> : row.assists}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleSaveScorer(row.id)} className="text-amber-500 hover:text-amber-400 font-medium">Save</button>
                          <button onClick={() => setEditingScorerId(null)} className="text-stone-500 hover:text-stone-300">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingScorerId(row.id); setScorerForm(row); }} className="text-stone-500 hover:text-stone-300 font-medium">Edit</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {topScorers.length === 0 && !isAddingScorer && <tr><td colSpan={5} className="px-5 py-8 text-center text-stone-500">No top scorers found.</td></tr>}
              {isAddingScorer && (
                <tr className="bg-stone-900/60 border-t border-stone-800">
                  <td className="px-5 py-4">
                    <input type="number" placeholder="Rank" className="w-16 bg-black border border-stone-700 rounded p-1 text-stone-200 focus:border-amber-500 focus:outline-none" value={newScorerForm.rank || ''} onChange={e => setNewScorerForm({...newScorerForm, rank: parseInt(e.target.value)})} />
                  </td>
                  <td className="px-5 py-4">
                    <select 
                      className="w-full bg-black border border-stone-700 rounded p-1 text-stone-200 focus:border-amber-500 focus:outline-none" 
                      value={newScorerForm.player_id || ''} 
                      onChange={e => setNewScorerForm({...newScorerForm, player_id: e.target.value})}
                    >
                      <option value="">Select Player...</option>
                      {Object.values(players).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <input type="number" placeholder="Goals" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={newScorerForm.goals || 0} onChange={e => setNewScorerForm({...newScorerForm, goals: parseInt(e.target.value)})} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <input type="number" placeholder="Assists" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={newScorerForm.assists || 0} onChange={e => setNewScorerForm({...newScorerForm, assists: parseInt(e.target.value)})} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={handleAddScorer} className="text-amber-500 hover:text-amber-400 font-medium">Add</button>
                      <button onClick={() => {setIsAddingScorer(false); setNewScorerForm({});}} className="text-stone-500 hover:text-stone-300">Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Golden Gloves */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500">Golden Gloves</h2>
          {!isAddingGlove && (
            <button 
              onClick={() => setIsAddingGlove(true)}
              className="text-xs text-stone-300 hover:text-white px-3 py-1 bg-stone-900 border border-stone-800 rounded transition-colors"
            >
              Add Player
            </button>
          )}
        </div>
        <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase text-stone-600 border-b border-stone-800">
              <tr>
                <th className="px-5 py-4 w-20">Rank</th>
                <th className="px-5 py-4">Player ID</th>
                <th className="px-5 py-4 w-24 text-center">Clean Sheets</th>
                <th className="px-5 py-4 w-24 text-center">Saves</th>
                <th className="px-5 py-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {goldenGloves.map(row => {
                const isEditing = editingGloveId === row.id;
                return (
                  <tr key={row.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="px-5 py-4 font-serif italic text-stone-400">
                      {isEditing ? <input type="number" className="w-16 bg-black border border-stone-700 rounded p-1 text-stone-200 focus:border-amber-500 focus:outline-none" value={gloveForm.rank || 0} onChange={e => setGloveForm({...gloveForm, rank: parseInt(e.target.value)})} /> : row.rank}
                    </td>
                    <td className="px-5 py-4 font-medium text-stone-200">
                      {row.players?.player_profile?.name || row.player_id}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-amber-500">
                      {isEditing ? <input type="number" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={gloveForm.clean_sheets || 0} onChange={e => setGloveForm({...gloveForm, clean_sheets: parseInt(e.target.value)})} /> : row.clean_sheets}
                    </td>
                    <td className="px-5 py-4 text-center text-stone-400">
                      {isEditing ? <input type="number" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={gloveForm.saves || 0} onChange={e => setGloveForm({...gloveForm, saves: parseInt(e.target.value)})} /> : row.saves}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleSaveGlove(row.id)} className="text-amber-500 hover:text-amber-400 font-medium">Save</button>
                          <button onClick={() => setEditingGloveId(null)} className="text-stone-500 hover:text-stone-300">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingGloveId(row.id); setGloveForm(row); }} className="text-stone-500 hover:text-stone-300 font-medium">Edit</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {goldenGloves.length === 0 && !isAddingGlove && <tr><td colSpan={5} className="px-5 py-8 text-center text-stone-500">No golden gloves found.</td></tr>}
              {isAddingGlove && (
                <tr className="bg-stone-900/60 border-t border-stone-800">
                  <td className="px-5 py-4">
                    <input type="number" placeholder="Rank" className="w-16 bg-black border border-stone-700 rounded p-1 text-stone-200 focus:border-amber-500 focus:outline-none" value={newGloveForm.rank || ''} onChange={e => setNewGloveForm({...newGloveForm, rank: parseInt(e.target.value)})} />
                  </td>
                  <td className="px-5 py-4">
                    <select 
                      className="w-full bg-black border border-stone-700 rounded p-1 text-stone-200 focus:border-amber-500 focus:outline-none" 
                      value={newGloveForm.player_id || ''} 
                      onChange={e => setNewGloveForm({...newGloveForm, player_id: e.target.value})}
                    >
                      <option value="">Select Player...</option>
                      {Object.values(players).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <input type="number" placeholder="Clean Sheets" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={newGloveForm.clean_sheets || 0} onChange={e => setNewGloveForm({...newGloveForm, clean_sheets: parseInt(e.target.value)})} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <input type="number" placeholder="Saves" className="w-16 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={newGloveForm.saves || 0} onChange={e => setNewGloveForm({...newGloveForm, saves: parseInt(e.target.value)})} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={handleAddGlove} className="text-amber-500 hover:text-amber-400 font-medium">Add</button>
                      <button onClick={() => {setIsAddingGlove(false); setNewGloveForm({});}} className="text-stone-500 hover:text-stone-300">Cancel</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      </section>
    </div>
  );
}
