import express from "express";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const app = express();

app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Helper to get supabase or throw
const getSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase credentials not configured in environment.");
  }
  return supabase as any;
};

// Authentication middleware to secure all /api/ endpoints
app.use(async (req, res, next) => {
  if (!req.path.startsWith("/api/")) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid session" });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Unauthorized: " + err.message });
  }
});

// --- API ROUTES ---

// Get all seasons
app.get("/api/seasons", async (req, res) => {
  try {
    const { data, error } = await getSupabase().from("seasons").select("*").order("year", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get active matches (or for a specific season)
app.get("/api/matches", async (req, res) => {
  try {
    const { season_id } = req.query;
    let query = getSupabase().from("matches").select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)");
    if (season_id) {
      query = query.eq("season_id", season_id as string);
    }
    query = query
      .order("match_date", { ascending: false })
      .order("match_time", { ascending: false })
      .order("id", { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific match
app.get("/api/matches/:id", async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from("matches")
      .select("*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update match result
app.put("/api/matches/:id", async (req, res) => {
  try {
    const { home_score, away_score, status, home_penalty_score, away_penalty_score } = req.body;
    const { data, error } = await getSupabase()
      .from("matches")
      .update({ home_score, away_score, status, home_penalty_score, away_penalty_score } as any)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get match events
app.get("/api/matches/:id/events", async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from("match_events")
      .select("*, player_profile:player_profile!player(*), assist_profile:player_profile!assist_player(*)")
      .eq("match_id", req.params.id)
      .order("minute", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add match event
app.post("/api/matches/:id/events", async (req, res) => {
  try {
    const event = { ...req.body, match_id: req.params.id };
    const { data, error } = await getSupabase().from("match_events").insert(event).select();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete match event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const { error } = await getSupabase().from("match_events").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit match event
app.put("/api/events/:id", async (req, res) => {
  try {
    const payload = req.body;
    const { data, error } = await getSupabase()
      .from("match_events")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get standings
app.get("/api/standings", async (req, res) => {
  try {
    const { season_id } = req.query;
    let query = getSupabase().from("standings").select("*, team:teams!team_id(*)");
    if (season_id) {
      query = query.eq("season_id", season_id as string);
    }
    query = query.order("position", { ascending: true });
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update standing row
app.put("/api/standings/:id", async (req, res) => {
  try {
    const payload = req.body as any;
    const { data, error } = await getSupabase()
      .from("standings")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;

    if (payload.team_id) {
      const teamPayload = {
        played: payload.played,
        wins: payload.wins,
        draws: payload.draws,
        losses: payload.losses,
        goals_for: payload.goals_for,
        goals_against: payload.goals_against,
        goal_difference: payload.goal_difference,
        points: payload.points
      };
      const { error: teamError } = await getSupabase()
        .from("teams")
        .update(teamPayload)
        .eq("id", payload.team_id);

      if (teamError) console.error("Error updating team:", teamError);
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get teams
app.get("/api/teams", async (req, res) => {
  try {
    const { data, error } = await getSupabase().from("teams").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get players
app.get("/api/players", async (req, res) => {
  try {
    const { season_id } = req.query;
    if (season_id) {
      const { data, error } = await getSupabase()
        .from("players")
        .select("*, player_profile(*), team:teams!team_id(*)")
        .eq("season_id", season_id as string);
      if (error) throw error;
      res.json(data);
    } else {
      const { data, error } = await getSupabase().from("player_profile").select("*");
      if (error) throw error;
      res.json(data);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update player statistics
app.put("/api/players/:id", async (req, res) => {
  try {
    const {
      goals,
      assists,
      saves,
      clean_sheets,
      appearances,
      minutes_played,
      yellow_cards,
      red_cards,
      team_id
    } = req.body;

    const { data, error } = await getSupabase()
      .from("players")
      .update({
        goals,
        assists,
        saves,
        clean_sheets,
        appearances,
        minutes_played,
        yellow_cards,
        red_cards,
        team_id
      })
      .eq("id", req.params.id)
      .select("*, player_profile(*), team:teams!team_id(*)")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// Get Top Scorers
app.get("/api/top-scorers", async (req, res) => {
  try {
    const { season_id } = req.query;
    let query = getSupabase()
      .from("top_scorers")
      .select("*, players(*, player_profile(*))")
      .order("rank", { ascending: true });

    if (season_id) {
      query = query.eq("season_id", season_id as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Top Scorer
app.put("/api/top-scorers/:id", async (req, res) => {
  try {
    const payload = req.body as any;
    const { data, error } = await getSupabase()
      .from("top_scorers")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;

    if (payload.player_id) {
      const { error: playerError } = await getSupabase()
        .from("players")
        .update({
          goals: payload.goals,
          assists: payload.assists
        })
        .eq("id", payload.player_id)
        .eq("season_id", payload.season_id);

      if (playerError) console.error("Error updating player:", playerError);
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/season-players", async (req, res) => {
  try {
    const { season_id } = req.query;
    if (!season_id) {
      return res.status(400).json({ error: "season_id is required" });
    }
    const { data, error } = await getSupabase()
      .from("players")
      .select("*, player_profile(*)")
      .eq("season_id", season_id as string);
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Top Scorer
app.post("/api/top-scorers", async (req, res) => {
  try {
    const payload = req.body as any;

    // Fetch max ID to bypass sequence mismatch issues
    const { data: maxIdData } = await getSupabase()
      .from("top_scorers")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    const nextId = (maxIdData && maxIdData.length > 0) ? maxIdData[0].id + 1 : 1;
    payload.id = nextId;

    const { data, error } = await getSupabase()
      .from("top_scorers")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    if (payload.player_id) {
      const { error: playerError } = await getSupabase()
        .from("players")
        .update({
          goals: payload.goals,
          assists: payload.assists
        })
        .eq("id", payload.player_id)
        .eq("season_id", payload.season_id);

      if (playerError) console.error("Error updating player:", playerError);
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Golden Gloves
app.get("/api/golden-gloves", async (req, res) => {
  try {
    const { season_id } = req.query;
    let query = getSupabase()
      .from("golden_gloves")
      .select("*, players(*, player_profile(*))")
      .order("rank", { ascending: true });

    if (season_id) {
      query = query.eq("season_id", season_id as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Golden Gloves
app.put("/api/golden-gloves/:id", async (req, res) => {
  try {
    const payload = req.body as any;
    const { data, error } = await getSupabase()
      .from("golden_gloves")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;

    if (payload.player_id) {
      const { error: playerError } = await getSupabase()
        .from("players")
        .update({
          saves: payload.saves,
          clean_sheets: payload.clean_sheets
        })
        .eq("id", payload.player_id)
        .eq("season_id", payload.season_id);

      if (playerError) console.error("Error updating player:", playerError);
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Golden Glove
app.post("/api/golden-gloves", async (req, res) => {
  try {
    const payload = req.body as any;

    // Fetch max ID to bypass sequence mismatch issues
    const { data: maxIdData } = await getSupabase()
      .from("golden_gloves")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    const nextId = (maxIdData && maxIdData.length > 0) ? maxIdData[0].id + 1 : 1;
    payload.id = nextId;

    const { data, error } = await getSupabase()
      .from("golden_gloves")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    if (payload.player_id) {
      const { error: playerError } = await getSupabase()
        .from("players")
        .update({
          saves: payload.saves,
          clean_sheets: payload.clean_sheets
        })
        .eq("id", payload.player_id)
        .eq("season_id", payload.season_id);

      if (playerError) console.error("Error updating player:", playerError);
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW CRUD ENDPOINTS ---

// Create Season
app.post("/api/seasons", async (req, res) => {
  try {
    let seasonId = req.body.id;
    if (!seasonId) {
      const { data: maxSeasons } = await getSupabase().from("seasons").select("id");
      let maxNum = 0;
      if (Array.isArray(maxSeasons)) {
        maxSeasons.forEach((s: any) => {
          const m = s.id.match(/^S(\d+)$/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      }
      seasonId = "S" + String(maxNum + 1).padStart(3, "0");
    }

    const { data, error } = await getSupabase()
      .from("seasons")
      .insert({ ...req.body, id: seasonId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Season
app.put("/api/seasons/:id", async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from("seasons")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Season
app.delete("/api/seasons/:id", async (req, res) => {
  try {
    const { error } = await getSupabase()
      .from("seasons")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Team
app.post("/api/teams", async (req, res) => {
  try {
    let teamId = req.body.id;
    if (!teamId) {
      const { data: maxTeams } = await getSupabase().from("teams").select("id");
      let maxNum = 0;
      if (Array.isArray(maxTeams)) {
        maxTeams.forEach((t: any) => {
          const m = t.id.match(/^T(\d+)$/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      }
      teamId = "T" + String(maxNum + 1).padStart(3, "0");
    }

    const teamPayload = {
      id: teamId,
      season_id: req.body.season_id,
      name: req.body.name,
      short_name: req.body.short_name || null,
      coach: req.body.coach || null,
      stadium: req.body.stadium || null,
      founded: req.body.founded || null,
      logo_url: req.body.logo_url || '/api/placeholder/100/100',
      colors: req.body.colors || { primary: '#60a5fa', secondary: '#1e3a8a' },
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0
    };

    const { data, error } = await getSupabase()
      .from("teams")
      .insert(teamPayload)
      .select()
      .single();

    if (error) throw error;

    // Automatically create standing row for this team in this season
    const { data: maxStandings } = await getSupabase()
      .from("standings")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    const nextStandingId = (maxStandings && maxStandings.length > 0) ? maxStandings[0].id + 1 : 1;

    const { count } = await getSupabase()
      .from("standings")
      .select("*", { count: "exact", head: true })
      .eq("season_id", req.body.season_id);
    const nextPosition = (count || 0) + 1;

    const { error: standingError } = await getSupabase()
      .from("standings")
      .insert({
        id: nextStandingId,
        season_id: req.body.season_id,
        team_id: teamId,
        position: nextPosition,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0
      });

    if (standingError) {
      console.error("Error creating standing row for new team:", standingError);
    }

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Team
app.put("/api/teams/:id", async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from("teams")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Team
app.delete("/api/teams/:id", async (req, res) => {
  try {
    // Delete standings row first to prevent foreign key errors
    await getSupabase().from("standings").delete().eq("team_id", req.params.id);

    const { error } = await getSupabase()
      .from("teams")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Match
app.post("/api/matches", async (req, res) => {
  try {
    const { data: maxMatches } = await getSupabase().from("matches").select("id");
    let maxNum = 0;
    if (Array.isArray(maxMatches)) {
      maxMatches.forEach((m: any) => {
        const matchRes = m.id.match(/^M(\d+)$/);
        if (matchRes) {
          const num = parseInt(matchRes[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
    }
    const matchId = "M" + String(maxNum + 1).padStart(3, "0");

    const { data, error } = await getSupabase()
      .from("matches")
      .insert({ ...req.body, id: matchId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;

