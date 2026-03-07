// /leaders/page.js
// -------------------------------------------------------------
// League Wrestler Leaders Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_league_wrestler_leaders
//   • Filter by league via URL param: ?league=<fantasy_league_guid>
//   • Render a leaderboard table into #page-root
//   • Link wrestler names to /wrestler/?wrestler=<wrestler_guid>
//
// Dependencies (classic scripts; globals must exist):
//   • utils.js: requireParam(), getQueryParam(), buildLeagueLink()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initLeadersPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Wrestler Leaders</h2>
      <p class="page-subtitle">Top-scoring wrestlers in the selected fantasy league.</p>
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
    const weight = getQueryParam("weight");

    const filters = {
      fantasy_league_guid: leagueGuid
    };

    // if (weight) filters.weight_lbs = Number(weight);

    const rows = await queryView(
      "v_league_wrestler_leaders",
      filters,
      { column: "total_points", ascending: false }
    );

    renderLeaders(rows);
  } catch (err) {
    console.error("Leaders page failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Wrestler Leaders</h2>
        <p class="page-subtitle">Top-scoring wrestlers in the selected fantasy league.</p>
      </div>

      <div class="panel">
        <p>Unable to load leaders.</p>
      </div>
    `;
  }
})();

function renderLeaders(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Wrestler Leaders</h2>
        <p class="page-subtitle">Top-scoring wrestlers in the selected fantasy league.</p>
      </div>

      <div class="panel">
        <p>No leader data found for this league.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Wrestler Leaders</h2>
      <p class="page-subtitle">Top-scoring wrestlers in the selected fantasy league.</p>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Wrestler</th>
              <th>Team</th>
              <th style="text-align:right;">Points</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map((r, i) => `
              <tr>
                <td>${i + 1}</td>

                <td>
                  <a href="${buildLeagueLink(`wrestler/index.html?wrestler=${encodeURIComponent(r.wrestler_guid)}`)}">
                    ${safeText(r.wrestler_name || r.display_name || "—")}
                  </a>
                </td>

                <td>${safeText(r.fantasy_team_name || r.team_name || "—")}</td>
                <td style="text-align:right;"><strong>${fmtPoints(r.total_points || r.points)}</strong></td>
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
