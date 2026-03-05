// /team_stats/page.js
// -------------------------------------------------------------
// Fantasy Team Stats Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_league_team_stats
//   • Filter by league via URL param: ?league=<fantasy_league_guid>
//   • Render team statistics leaderboard
//
// Dependencies (classic scripts):
//   • utils.js: requireParam()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initTeamStatsPage() {

  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading team stats…</p>`;

  try {

    const leagueGuid = requireParam("league");

    const rows = await queryView(
      "v_league_team_stats",
      { fantasy_league_guid: leagueGuid },
      { column: "total_points", ascending: false }
    );

    renderTeamStats(rows);

  } catch (err) {

    console.error("Team stats failed to load:", err);
    root.innerHTML = `<p>Unable to load team statistics.</p>`;

  }

})();


function renderTeamStats(rows) {

  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No team statistics found.</p>`;
    return;
  }

  root.innerHTML = `
    <h2>League Team Statistics</h2>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Team</th>
            <th style="text-align:right;">Wins</th>
            <th style="text-align:right;">Losses</th>
            <th style="text-align:right;">Bonus</th>
            <th style="text-align:right;">Total Points</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${safeText(r.fantasy_team_name || r.team_name || "—")}</td>
              <td style="text-align:right;">${fmt(r.wins)}</td>
              <td style="text-align:right;">${fmt(r.losses)}</td>
              <td style="text-align:right;">${fmt(r.bonus_points)}</td>
              <td style="text-align:right;"><strong>${fmt(r.total_points)}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */

function fmt(value) {
  if (value === null || value === undefined) return "0";
  return value;
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
