// /team/page.js
// -------------------------------------------------------------
// Fantasy Team Roster Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_team_roster_points
//   • Filter by team via URL param: ?team=<fantasy_team_guid>
//   • Render roster + points into #page-root
//   • Link wrestler names to /wrestler/?wrestler=<wrestler_guid>
//
// Dependencies (classic scripts):
//   • utils.js: requireParam(), buildLeagueLink()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initTeamPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Fantasy Team Roster</h2>
      <p class="page-subtitle">Roster and wrestler points for the selected fantasy team.</p>
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
    const teamGuid = requireParam("team");

    const rows = await queryView(
      "v_team_roster_points",
      { fantasy_team_guid: teamGuid },
      { column: "weight_lbs", ascending: true }
    );

    renderTeamRoster(rows);
  } catch (err) {
    console.error("Team roster failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Fantasy Team Roster</h2>
        <p class="page-subtitle">Roster and wrestler points for the selected fantasy team.</p>
      </div>

      <div class="panel">
        <p>Unable to load team roster.</p>
      </div>
    `;
  }
})();

function renderTeamRoster(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Fantasy Team Roster</h2>
        <p class="page-subtitle">Roster and wrestler points for the selected fantasy team.</p>
      </div>

      <div class="panel">
        <p>No roster found.</p>
      </div>
    `;
    return;
  }

  const teamName = rows[0].team_name || "Fantasy Team";

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">${safeText(teamName)}</h2>
      <p class="page-subtitle">Roster and wrestler points for this fantasy team.</p>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Weight</th>
              <th>Wrestler</th>
              <th>School</th>
              <th style="text-align:right;">Points</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${safeText(r.weight_lbs || "—")}</td>

                <td>
                  <a href="${buildLeagueLink(`../wrestler/?wrestler=${encodeURIComponent(r.wrestler_guid)}`)}">
                    ${safeText(r.wrestler_name || "—")}
                  </a>
                </td>

                <td>${safeText(r.college_team_name || "—")}</td>
                <td style="text-align:right;"><strong>${fmtPoints(r.wrestler_total_points)}</strong></td>
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

function fmtPoints(value) {
  if (value === null || value === undefined) return "0.0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(1);
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
