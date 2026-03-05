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

  // Loading state
  root.innerHTML = `<p>Loading college standings…</p>`;

  try {

    // Query the Supabase view
    const rows = await queryView(
      "v_college_scoreboard",
      {},
      { column: "total_points", ascending: false }
    );

    renderCollegeStandings(rows);

  } catch (err) {

    console.error("College standings failed to load:", err);
    root.innerHTML = `<p>Unable to load college standings.</p>`;

  }

})();


function renderCollegeStandings(rows) {

  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No college data available.</p>`;
    return;
  }

  root.innerHTML = `
    <h2>NCAA Team Scoreboard</h2>

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
              <td>${safeText(r.college_na,e || r.college_team_name || r.school_name || "—")}</td>
              <td style="text-align:right;"><strong>${fmtPoints(r.total_points)}</strong></td>
            </tr>
          `).join("")}
        </tbody>

      </table>
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
