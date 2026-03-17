// /js/api.js

const SUPABASE_URL = "https://ddmulriubdluavwcpyrl.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_CURRENT_KEY";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Expose client globally for page controllers like FAQ/About
window.db = db;
window.supabaseClient = db;

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
    return [];
  }

  return data || [];
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
