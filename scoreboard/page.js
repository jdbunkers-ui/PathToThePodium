// /scoreboard/page.js
// Wire Scoreboard page to Supabase view: v_league_scoreboard

(async function initScoreboardPage() {
  try {
    // "league" is the URL param your utils preserve (league=<fantasy_league_guid>)
    const leagueGuid = requireParam("league");

    // Optional params you may add later (safe if missing)
    const session = getQueryParam("session"); // e.g. "1", "2", "3" (if your view supports it)

    // Build filters
    const filters = {
      fantasy_league_guid: leagueGuid
    };

    // If your view has a session column, uncomment this:
    // if (session) filters.session_nbr = Number(session);

    // Query the view (order by total points descending)
    const rows = await queryView(
      "v_league_scoreboard",
      filters,
      { column: "total_points", ascending: false }
    );

    renderScoreboard(rows);

  } catch (err) {
    console.error("Scoreboard page failed to load:", err);
    // requireParam already prints a user-facing message if page-root exists
  }
})();

function renderScoreboard(rows) {
  // Expect a container in scoreboard/index.html like:
  // <div id="page-root"></div>
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No teams found for this league.</p>`;
    return;
  }

  // Basic first-pass UI (we’ll polish in the UI phase)
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
              <td style="text-align:right;">${num(r.consolation_points)}</td>
              <td style="text-align:right;">${num(r.championship_points)}</td>
              <td style="text-align:right;">${num(r.bonus_points)}</td>
              <td style="text-align:right;"><strong>${num(r.total_points)}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Small formatting helpers (local to this page for now).
 * If you like them, we can move these into utils.js later.
 */
function num(value) {
  if (value === null || value === undefined || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toFixed(1);
}

function safeText(value) {
  // Basic XSS safety: render as text, not HTML
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
