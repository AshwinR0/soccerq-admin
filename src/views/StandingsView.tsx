import { useEffect, useState } from "react";
import { Standing, Team } from "../types";
import { Save } from "lucide-react";
import { useSeason } from "../SeasonContext";

export default function StandingsView() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Standing>>({});
  const { selectedSeason } = useSeason();

  useEffect(() => {
    if (selectedSeason) {
      fetchStandings(selectedSeason);
    }
  }, [selectedSeason]);

  const fetchStandings = (seasonId: string) => {
    setLoading(true);
    fetch(`/api/standings?season_id=${seasonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStandings(data);
        } else {
          console.error("Failed to load standings:", data);
          setStandings([]);
        }
        setLoading(false);
      })
      .catch(console.error);
  };

  const handleEdit = (standing: Standing) => {
    setEditingId(standing.id);
    setEditForm(standing);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: number) => {
    try {
      const { team, ...updatePayload } = editForm as any;
      const res = await fetch(`/api/standings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (res.ok) {
        setEditingId(null);
        if (selectedSeason) fetchStandings(selectedSeason);
      } else {
        alert("Failed to save standings");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-stone-500 text-sm">Loading standings...</div>;

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
      <section className="flex flex-col space-y-4 md:space-y-6 max-w-6xl mx-auto">
      <header className="mb-2 md:mb-4">
        <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-tight">Standings</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Manage and adjust tournament table standings manually.</p>
      </header>

      <div className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase text-stone-600 border-b border-stone-800">
            <tr>
              <th className="px-5 py-4 w-16">Pos</th>
              <th className="px-5 py-4">Team</th>
              <th className="px-5 py-4 w-16 text-center">P</th>
              <th className="px-5 py-4 w-16 text-center">W</th>
              <th className="px-5 py-4 w-16 text-center">D</th>
              <th className="px-5 py-4 w-16 text-center">L</th>
              <th className="px-5 py-4 w-16 text-center">GF</th>
              <th className="px-5 py-4 w-16 text-center">GA</th>
              <th className="px-5 py-4 w-16 text-center">GD</th>
              <th className="px-5 py-4 w-16 text-center font-bold">Pts</th>
              <th className="px-5 py-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {standings.map((row) => {
              const isEditing = editingId === row.id;
              
              return (
                <tr key={row.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="px-5 py-4 font-serif italic text-stone-400">
                    {isEditing ? (
                      <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.position || 0} onChange={e => setEditForm({...editForm, position: parseInt(e.target.value)})} />
                    ) : (
                      row.position
                    )}
                  </td>
                  <td className="px-5 py-4 font-medium text-stone-200">
                    {row.team?.name || row.team_id}
                  </td>
                  <td className="px-5 py-4 text-center text-stone-400">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.played || 0} onChange={e => setEditForm({...editForm, played: parseInt(e.target.value)})} /> : row.played}
                  </td>
                  <td className="px-5 py-4 text-center text-stone-400">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.wins || 0} onChange={e => setEditForm({...editForm, wins: parseInt(e.target.value)})} /> : row.wins}
                  </td>
                  <td className="px-5 py-4 text-center text-stone-400">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.draws || 0} onChange={e => setEditForm({...editForm, draws: parseInt(e.target.value)})} /> : row.draws}
                  </td>
                  <td className="px-5 py-4 text-center text-stone-400">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.losses || 0} onChange={e => setEditForm({...editForm, losses: parseInt(e.target.value)})} /> : row.losses}
                  </td>
                  <td className="px-5 py-4 text-center text-stone-400">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.goals_for || 0} onChange={e => setEditForm({...editForm, goals_for: parseInt(e.target.value)})} /> : row.goals_for}
                  </td>
                  <td className="px-5 py-4 text-center text-stone-400">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.goals_against || 0} onChange={e => setEditForm({...editForm, goals_against: parseInt(e.target.value)})} /> : row.goals_against}
                  </td>
                  <td className="px-5 py-4 text-center text-stone-400">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.goal_difference || 0} onChange={e => setEditForm({...editForm, goal_difference: parseInt(e.target.value)})} /> : row.goal_difference}
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-amber-500">
                    {isEditing ? <input type="number" className="w-12 bg-black border border-stone-700 rounded p-1 text-center text-stone-200 focus:border-amber-500 focus:outline-none" value={editForm.points || 0} onChange={e => setEditForm({...editForm, points: parseInt(e.target.value)})} /> : row.points}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleSave(row.id)} className="text-amber-500 hover:text-amber-400 font-medium">Save</button>
                        <button onClick={handleCancel} className="text-stone-500 hover:text-stone-300">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(row)} className="text-stone-500 hover:text-stone-300 font-medium">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-8 text-center text-stone-500">
                  No standings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </section>
    </div>
  );
}
