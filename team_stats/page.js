// /team_stats/page.js
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
//   • utils.js: requireParam()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initTeamPage() {

  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading team roster…</p>`;

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
    root.innerHTML = `<p>Unable to load team roster.</p>`;

  }

})();


function renderTeamRoster(rows) {

  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No roster found.</p>`;
    return;
  }

  const teamName = rows[0].team_name || "Fantasy Team";

  root.innerHTML = `
    <h2>${safeText(teamName)}</h2>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Weight</th>
            <th>Wrestler</th>
            <th style="text-align:right;">Points</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${safeText(r.weight_lbs || "—")}</td>

              <td>
                <a href="../wrestler/?wrestler=${encodeURIComponent(r.wrestler_guid)}">
                  ${safeText(r.wrestler_name || "—")}
                </a>
              </td>

              <td style="text-align:right;"><strong>${fmtPoints(r.wrestler_total_points)}</strong></td>
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
