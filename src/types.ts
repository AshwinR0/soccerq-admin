export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  short_name?: string;
}

export interface Match {
  id: string;
  season_id: string;
  match_date: string;
  match_time: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  home_team?: Team;
  away_team?: Team;
  home_penalty_score?: number;
  away_penalty_score?: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  jersey_number: number;
}

export interface MatchEvent {
  id: number;
  match_id: string;
  event: string;
  minute: number;
  player: string;
  assist_player: string | null;
  team_id: string;
  event_order: number;
  player_profile?: PlayerProfile;
  assist_profile?: PlayerProfile;
}

export interface Standing {
  id: number;
  season_id: string;
  position: number;
  team_id: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  team?: Team;
}

export interface TopScorer {
  id: number;
  season_id: string;
  rank: number;
  player_id: string;
  goals: number;
  assists: number;
  players?: {
    player_profile?: PlayerProfile;
  };
}

export interface GoldenGlove {
  id: number;
  season_id: string;
  rank: number;
  player_id: string;
  saves: number;
  clean_sheets: number;
  players?: {
    player_profile?: PlayerProfile;
  };
}
