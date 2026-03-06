// /scoreboard/page.js
// Purpose:
//   - Read league context from the URL (league=<fantasy_league_guid>)
//   - Query Supabase view v_league_scoreboard via queryView()
//   - Render a simple table into #page-root
//
// Dependencies (classic scripts; globals must exist):
//   - utils.js: requireParam(), getQueryParam()
//   - api.js: queryView()

(async function initScoreboardPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading scoreboard…</p>`;

  try {
    const leagueGuid = requireParam("league");
    const session = getQueryParam("session");

    const filters = { fantasy_league_guid: leagueGuid };

    // if (session) filters.session = Number(session);

    const rows = await queryView(
      "v_league_scoreboard",
      filters,
      { column: "total_points", ascending: false }
    );

    renderScoreboard(rows, leagueGuid);

  } catch (err) {
    console.error("Scoreboard page failed to load:", err);
    if (root.innerHTML.trim() === "") {
      root.innerHTML = `<p>Unable to load scoreboard.</p>`;
    }
  }
})();

function renderScoreboard(rows, leagueGuid) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No teams found for this league.</p>`;
    return;
  }

  root.innerHTML = `
    <h2>League Scoreboard</h2>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Team</th>
            <th style="text-align:right;">Consolation</th>
            <th style="text-align:right;">Championship</th>
            <th style="text-align:right;">Bonus</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              <td>
                <a href="../team/?team=${encodeURIComponent(r.fantasy_team_guid)}&league=${encodeURIComponent(leagueGuid)}">
                  ${safeText(r.fantasy_team_name || r.team_name || "—")}
                </a>
              </td>
              <td style="text-align:right;">${fmtPoints(r.consolation_points)}</td>
              <td style="text-align:right;">${fmtPoints(r.championship_points)}</td>
              <td style="text-align:right;">${fmtPoints(r.bonus_points)}</td>
              <td style="text-align:right;"><strong>${fmtPoints(r.total_points)}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

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
