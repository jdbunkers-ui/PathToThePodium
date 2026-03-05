// /collision/page.js
// -------------------------------------------------------------
// League Collisions Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_league_collisions
//   • Filter by league via URL param: ?league=<fantasy_league_guid>
//   • Render upcoming drafted-vs-drafted matches
//
// Dependencies (classic scripts):
//   • utils.js: requireParam()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initCollisionPage() {

  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading collisions…</p>`;

  try {

    const leagueGuid = requireParam("league");

    const rows = await queryView(
      "v_league_collisions",
      { fantasy_league_guid: leagueGuid }
    );

    renderCollisions(rows);

  } catch (err) {

    console.error("Collisions page failed to load:", err);
    root.innerHTML = `<p>Unable to load collisions.</p>`;

  }

})();


function renderCollisions(rows) {

  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No upcoming collisions.</p>`;
    return;
  }

  root.innerHTML = `
    <h2>Upcoming Drafted Wrestler Matchups</h2>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Weight</th>
            <th>Red Wrestler</th>
            <th>Red Team</th>
            <th>Green Wrestler</th>
            <th>Green Team</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${safeText(r.weight_class || r.weight_lbs || "—")}</td>
              <td>${safeText(r.red_wrestler_name || "—")}</td>
              <td>${safeText(r.red_team_name || "—")}</td>
              <td>${safeText(r.green_wrestler_name || "—")}</td>
              <td>${safeText(r.green_team_name || "—")}</td>
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

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
