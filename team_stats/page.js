// /team_stats/page.js
// -------------------------------------------------------------
// League Team Stats Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_league_team_stats
//   • Filter by league via URL param: ?league=<fantasy_league_guid>
//   • Render team-level league stats into #page-root
//
// Dependencies (classic scripts):
//   • utils.js: requireParam(), buildLeagueLink()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initTeamStatsPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">League Team Stats</h2>
      <p class="page-subtitle">Team-level performance metrics for the selected fantasy league.</p>
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
    const leagueGuid = requireParam("league");

    const rows = await queryView(
      "v_league_team_stats",
      { fantasy_league_guid: leagueGuid },
      { column: "total_individual_wins", ascending: false }
    );

    renderTeamStats(rows);
  } catch (err) {
    console.error("Team stats failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">League Team Stats</h2>
        <p class="page-subtitle">Team-level performance metrics for the selected fantasy league.</p>
      </div>

      <div class="panel">
        <p>Unable to load team stats.</p>
      </div>
    `;
  }
})();

function renderTeamStats(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">League Team Stats</h2>
        <p class="page-subtitle">Team-level performance metrics for the selected fantasy league.</p>
      </div>

      <div class="panel">
        <p>No team stats found for this league.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">League Team Stats</h2>
      <p class="page-subtitle">Team-level performance metrics for the selected fantasy league.</p>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Team</th>
              <th style="text-align:right;">Matches</th>
              <th style="text-align:right;">Wins</th>
              <th style="text-align:right;">Pins</th>
              <th style="text-align:right;">Alive</th>
              <th style="text-align:right;">Champ Alive</th>
              <th style="text-align:right;">Upsets</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map(r => `
              <tr>
                <td>
                  <a href="${buildLeagueLink(`team/index.html?team=${encodeURIComponent(r.fantasy_team_guid)}`)}">
                    ${safeText(r.team_name || "—")}
                  </a>
                </td>
                <td style="text-align:right;">${fmtInt(r.total_matches)}</td>
                <td style="text-align:right;">${fmtInt(r.total_individual_wins)}</td>
                <td style="text-align:right;">${fmtInt(r.total_pins)}</td>
                <td style="text-align:right;">${fmtInt(r.still_in_the_tournament)}</td>
                <td style="text-align:right;">${fmtInt(r.still_in_the_championship_bracket)}</td>
                <td style="text-align:right;">${fmtInt(r.upsets)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */

function fmtInt(value) {
  if (value === null || value === undefined || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return String(Math.trunc(n));
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
