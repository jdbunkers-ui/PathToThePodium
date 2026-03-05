// /js/api.js

const SUPABASE_URL = "https://ddmulriubdluavwcpyrl.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_KEY";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ---------- TEST CONNECTION ----------

async function testSupabaseConnection() {

  const { data, error } = await db
    .from("v_college_team_bonus_points")
    .select("*")
    .limit(5);

  console.log("Supabase TEST DATA:", data);
  console.log("Supabase TEST ERROR:", error);

}

testSupabaseConnection();


// ------------------------------------------------------------
// Generic view query helper
// ------------------------------------------------------------
async function queryView(viewName, filters = {}, orderBy = null) {

  let query = db
    .from(viewName)
    .select("*");

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

  return data;
}
