// /collision/page.js
// -------------------------------------------------------------
// League Collisions Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_league_collisions
//   • Filter by league via URL param: ?league=<fantasy_league_guid>
//   • Render upcoming drafted-vs-drafted matches
//   • Link red/green wrestlers to /wrestler/?wrestler=<wrestler_guid>
//
// Dependencies (classic scripts):
//   • utils.js: requireParam(), buildLeagueLink()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initCollisionPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Upcoming Drafted Wrestler Matchups</h2>
      <p class="page-subtitle">Head-to-head collisions between drafted wrestlers in the selected fantasy league.</p>
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
      "v_league_collisions",
      { fantasy_league_guid: leagueGuid },
      { column: "weight_lbs", ascending: true }
    );

    renderCollisions(rows);
  } catch (err) {
    console.error("Collisions page failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Upcoming Drafted Wrestler Matchups</h2>
        <p class="page-subtitle">Head-to-head collisions between drafted wrestlers in the selected fantasy league.</p>
      </div>

      <div class="panel">
        <p>Unable to load collisions.</p>
      </div>
    `;
  }
})();

function renderCollisions(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Upcoming Drafted Wrestler Matchups</h2>
        <p class="page-subtitle">Head-to-head collisions between drafted wrestlers in the selected fantasy league.</p>
      </div>

      <div class="panel">
        <p>No upcoming collisions.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Upcoming Drafted Wrestler Matchups</h2>
      <p class="page-subtitle">Head-to-head collisions between drafted wrestlers in the selected fantasy league.</p>
    </div>

    <div class="panel">
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
                <td>${safeText(r.weight_lbs || "—")}</td>

                <td>${wrestlerLink(r.red_wrestler_guid, r.red_wrestler_name || "—")}</td>
                <td>${safeText(r.red_fantasy_team_name || "—")}</td>

                <td>${wrestlerLink(r.green_wrestler_guid, r.green_wrestler_name || "—")}</td>
                <td>${safeText(r.green_fantasy_team_name || "—")}</td>
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

function wrestlerLink(wrestlerGuid, label) {
  if (!wrestlerGuid) return safeText(label);

  return `<a href="${buildLeagueLink(`wrestler/index.html?wrestler=${encodeURIComponent(wrestlerGuid)}`)}">${safeText(label)}</a>`;
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
