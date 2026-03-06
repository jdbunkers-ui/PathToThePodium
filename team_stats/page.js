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
      { column: "total_individual_wins", ascending: false }
    );

    renderTeamStats(rows);

  } catch (err) {

    console.error("Team stats failed to load:", err);
    root.innerHTML = `<p>Unable to load team stats.</p>`;

  }

})();


function renderTeamStats(rows) {

  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No team stats found for this league.</p>`;
    return;
  }

  root.innerHTML = `
    <h2>League Team Stats</h2>

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
                <a href="../team/?team=${encodeURIComponent(r.fantasy_team_guid)}&league=${encodeURIComponent(requireParam("league"))}">
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
