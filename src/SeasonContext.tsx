import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Season {
  id: string;
  name: string;
  year: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  type: string;
}

interface SeasonContextType {
  seasons: Season[];
  selectedSeason: string;
  setSelectedSeason: (id: string) => void;
  loading: boolean;
  refreshSeasons: () => Promise<void>;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refreshSeasons = () => {
    setLoading(true);
    return fetch("/api/seasons")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSeasons(data);
          const active = data.find(s => s.is_active);
          if (active) {
            setSelectedSeason(active.id);
          } else if (data.length > 0) {
            // Keep selected if still exists, otherwise set to first
            if (!data.some(s => s.id === selectedSeason)) {
              setSelectedSeason(data[0].id);
            }
          } else {
            setSelectedSeason("");
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshSeasons();
  }, []);

  return (
    <SeasonContext.Provider value={{ seasons, selectedSeason, setSelectedSeason, loading, refreshSeasons }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (!context) throw new Error("useSeason must be used within SeasonProvider");
  return context;
}
