// /js/api.js

const SUPABASE_URL = "https://ddmulriubdluavwcpyrl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbXVscml1YmRsdWF2d2NweXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTc2NjUsImV4cCI6MjA4Nzc5MzY2NX0.SuDATgshWSTFjpQkxTWEBMXBspKYvM9QUNCbZuObu60";

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

// RUN THE TEST
testSupabaseConnection();

// ------------------------------------------------------------
// Generic view query helper
// ------------------------------------------------------------
export async function queryView(viewName, filters = {}, orderBy = null) {

  let query = supabase
    .from(viewName)
    .select('*')

  // Apply filters
  Object.entries(filters).forEach(([column, value]) => {
    if (value !== null && value !== undefined) {
      query = query.eq(column, value)
    }
  })

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
  }

  const { data, error } = await query

  if (error) {
    console.error("Supabase Query Error:", error)
    return []
  }

  return data
}
