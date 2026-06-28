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
    query = query.order("match_date", { ascending: false });
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
    const { data, error } = await getSupabase().from("player_profile").select("*");
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

// Create Top Scorer
app.post("/api/top-scorers", async (req, res) => {
  try {
    const payload = req.body as any;
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

export default app;
