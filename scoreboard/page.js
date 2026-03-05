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

  // Optional: show a loading state immediately (helps perceived performance)
  root.innerHTML = `<p>Loading scoreboard…</p>`;

  try {
    // URL contract:
    //   /scoreboard/?league=<fantasy_league_guid>
    const leagueGuid = requireParam("league");

    // Optional query param we may support later:
    //   /scoreboard/?league=...&session=1
    const session = getQueryParam("session");

    // Filters passed into queryView() -> .eq() clauses
    const filters = { fantasy_league_guid: leagueGuid };

    // If your view supports session filtering, enable this and set the correct column name.
    // Common options might be: session_nbr, session, session_number, session_name.
    // if (session) filters.session_nbr = Number(session);

    // Query the view (sort teams by total points descending)
    const rows = await queryView(
      "v_league_scoreboard",
      filters,
      { column: "total_points", ascending: false }
    );

    renderScoreboard(rows);

  } catch (err) {
    console.error("Scoreboard page failed to load:", err);
    // requireParam() already writes a user-facing error to #page-root when missing.
    // If it failed for another reason, show a generic message.
    if (root.innerHTML.trim() === "") {
      root.innerHTML = `<p>Unable to load scoreboard.</p>`;
    }
  }
})();

function renderScoreboard(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No teams found for this league.</p>`;
    return;
  }

  // NOTE ON COLUMN NAMES:
  // If your view uses different column names, adjust the mapping below.
  // Examples that sometimes vary:
  //   - team name: fantasy_team_name vs team_name
  //   - points: consolation_points/championship_points/bonus_points/total_points
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
              <td>${safeText(r.fantasy_team_name || r.team_name || "—")}</td>
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

/**
 * Format a numeric value as points.
 * - Defaults to "0.0"
 * - Keeps non-numeric strings readable (debug-friendly)
 */
function fmtPoints(value) {
  if (value === null || value === undefined || value === "") return "0.0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(1);
}

/**
 * Basic XSS safety: render as text, not HTML.
 * (Prevents view data from injecting markup.)
 */
function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
