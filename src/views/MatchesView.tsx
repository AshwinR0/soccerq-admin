import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Match } from "../types";
import { format } from "date-fns";
import { useSeason } from "../SeasonContext";

export default function MatchesView() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedSeason } = useSeason();

  useEffect(() => {
    if (!selectedSeason) return;
    setLoading(true);
    fetch(`/api/matches?season_id=${selectedSeason}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMatches(data);
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
  }, [selectedSeason]);

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
        <header className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-serif italic text-white tracking-tight">Matches</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Select a match to update scores and events.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {matches.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="bg-stone-900/40 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-700 transition-colors block flex flex-col"
            >
              <div className="p-4 border-b border-stone-800 bg-stone-950/50 flex justify-between items-center text-xs text-stone-500">
                <time className="font-serif italic">{match.match_date ? format(new Date(match.match_date), "MMM d, yyyy") : "TBD"}</time>
                <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px] uppercase font-semibold">
                  {match.status.replace('_', ' ')}
                </span>
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
          {matches.length === 0 && (
            <div className="col-span-full py-12 text-center text-stone-500 bg-stone-900/40 rounded-xl border border-stone-800 text-sm">
              No matches found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
