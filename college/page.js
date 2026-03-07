// /college/page.js
// -------------------------------------------------------------
// College Standings Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_college_scoreboard
//   • Render the college leaderboard into #page-root
//
// Dependencies (classic scripts; globals must exist):
//   • api.js: queryView()
//   • site.css: table styles (.table, .table-wrap)
// -------------------------------------------------------------

(async function initCollegePage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">NCAA Team Scoreboard</h2>
      <p class="page-subtitle">Current college standings by total tournament points.</p>
    </div>

    <div class="panel">
      <div class="skeleton table-row"></div>
      <div class="skeleton table-row"></div>
      <div class="skeleton table-row"></div>
      <div class="skeleton table-row"></div>
      <div class="skeleton table-row"></div>
    </div>
  `;

  try {
    const rows = await queryView(
      "v_college_scoreboard",
      {},
      { column: "total_points", ascending: false }
    );

    renderCollegeStandings(rows);
  } catch (err) {
    console.error("College standings failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">NCAA Team Scoreboard</h2>
        <p class="page-subtitle">Current college standings by total tournament points.</p>
      </div>

      <div class="panel">
        <p>Unable to load college standings.</p>
      </div>
    `;
  }
})();

function renderCollegeStandings(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">NCAA Team Scoreboard</h2>
        <p class="page-subtitle">Current college standings by total tournament points.</p>
      </div>

      <div class="panel">
        <p>No college data available.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">NCAA Team Scoreboard</h2>
      <p class="page-subtitle">Current college standings by total tournament points.</p>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>School</th>
              <th style="text-align:right;">Total Points</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${safeText(r.college_name || r.college_team_name || r.school_name || "—")}</td>
                <td style="text-align:right;"><strong>${fmtPoints(r.total_points)}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------
   Helpers (kept local for now)
------------------------------------------------------------- */

function fmtPoints(value) {
  if (value === null || value === undefined || value === "") return "0.0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(1);
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
