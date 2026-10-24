// /js/api.js

const SUPABASE_URL = "https://ddmulriubdluavwcpyrl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbXVscml1YmRsdWF2d2NweXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc2NjUsImV4cCI6MjA4Nzc5MzY2NX0.SuDATgshWSTFjpQkxTWEBMXBspKYvM9QUNCbZuObu60";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ------------------------------------------------------------
// Optional: TEST CONNECTION (disable for prod)
// ------------------------------------------------------------
// async function testSupabaseConnection() {
//   const { data, error } = await db
//     .from("v_college_team_bonus_points")
//     .select("*")
//     .limit(5);
//
//   console.log("Supabase TEST DATA:", data);
//   console.log("Supabase TEST ERROR:", error);
// }
// testSupabaseConnection();


// ------------------------------------------------------------
// Generic view query helper
// ------------------------------------------------------------
async function queryView(viewName, filters = {}, orderBy = null) {
  // Public access is intentional. This is a display/status check; the database
  // independently blocks unpaid scores on every view and scoring RPC.
  const leagueViews = new Set([
    "v_league_scoreboard", "v_league_scoreboard_backup", "v_team_points",
    "v_team_roster_points", "v_league_wrestler_leaders", "v_league_team_stats",
    "v_league_collisions"
  ]);
  if (leagueViews.has(viewName)) {
    const status = filters.fantasy_team_guid
      ? await callRpc("bl_public_team", { p_team_guid: filters.fantasy_team_guid })
      : await callRpc("bl_public_league", { p_league_guid: filters.fantasy_league_guid });
    if (!status?.found || !status.scoring_available) {
      const error = new Error(status?.found
        ? "Scoring is locked until this league is paid."
        : "This league or team could not be found.");
      error.code = status?.found ? "BL_SCORING_LOCKED" : "BL_NOT_FOUND";
      throw error;
    }
    window.BLPublicContext = status;
  }
  let query = db.from(viewName).select("*");

  Object.entries(filters).forEach(([column, value]) => {
    if (value !== null && value !== undefined) {
      query = query.eq(column, value);
    }
  });

  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase Query Error:", error);
    throw error;
  }

  return data || [];
}

function renderPublicAccessMessage(root, error) {
  if (!['BL_SCORING_LOCKED', 'BL_NOT_FOUND'].includes(error?.code)) return false;
  root.replaceChildren();
  const panel = document.createElement('section');
  panel.className = 'panel';
  const title = document.createElement('h2');
  title.textContent = error.code === 'BL_SCORING_LOCKED' ? 'Scoring is locked' : 'League not found';
  const message = document.createElement('p');
  message.textContent = error.message;
  const link = document.createElement('a');
  link.href = buildRepoLink('index.html');
  link.textContent = 'Browse public leagues';
  panel.append(title, message, link);
  root.append(panel);
  return true;
}

// Event selection is public and requires no session. This preserves official
// event context when browsing several tournaments in the same calendar year.
async function getPublicEventSelection() {
  const events = await callRpc('bl_browse_events');
  const requested = new URLSearchParams(location.search).get('event');
  const fallback = requested || await callRpc('bl_default_event');
  const selected = (events || []).find(event => event.event_guid === fallback) || null;
  if (requested && !selected) throw new Error('That tournament could not be found.');
  window.BLSelectedEvent = selected;
  return { events: events || [], selected };
}

function renderPublicEventSelector(root, selection) {
  const panel = document.createElement('div');
  panel.className = 'toolbar-card';
  const label = document.createElement('label');
  label.className = 'label';
  label.htmlFor = 'event-select';
  label.textContent = 'Tournament';
  const select = document.createElement('select');
  select.className = 'select';
  select.id = 'event-select';
  for (const event of selection.events) {
    const option = document.createElement('option');
    option.value = event.event_guid;
    option.textContent = event.event_name + (event.has_results ? '' : ' · results pending');
    option.selected = event.event_guid === selection.selected?.event_guid;
    select.append(option);
  }
  select.addEventListener('change', () => {
    const url = new URL(location.href);
    url.searchParams.set('event', select.value);
    location.assign(url.pathname + url.search);
  });
  panel.append(label, select);
  root.prepend(panel);
}


// ------------------------------------------------------------
// RPC helper (for writes like submit_fantasy_team)
// ------------------------------------------------------------
async function callRpc(fnName, params = {}) {
  const { data, error } = await db.rpc(fnName, params);
  if (error) {
    console.error("Supabase RPC Error:", error);
    throw error;
  }
  return data;
}
