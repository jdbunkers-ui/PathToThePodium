// /page.js
// -------------------------------------------------------------
// Landing Page Controller (Root)
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_paid_leagues_by_year
//   • Render a list of "league cards" into #page-root
//   • Each card links into league-context pages using:
//       /scoreboard/?league=<fantasy_league_guid>
//
// Dependencies (classic scripts; globals must exist):
//   • api.js: queryView()
//   • utils.js: safe rendering helpers are local here for now
//   • site-chrome.js: renders global nav into #site-nav
// -------------------------------------------------------------

(async function initLandingPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  // Basic loading state
  root.innerHTML = `<p>Loading leagues…</p>`;

  try {
    // NOTE: If your view expects a year filter later, we can add it here
    const rows = await queryView(
      "v_paid_leagues_by_year",
      {},                                // filters
      { column: "league_name", ascending: true } // ordering (adjust if needed)
    );

    renderLeagueList(rows);

  } catch (err) {
    console.error("Landing page failed to load:", err);
    root.innerHTML = `<p>Unable to load leagues.</p>`;
  }
})();

function renderLeagueList(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No leagues found.</p>`;
    return;
  }

  // Render simple cards (UI polish later in Phase 6)
  root.innerHTML = `
    <h2>Leagues</h2>

    <div class="card-grid">
      ${rows.map(r => renderLeagueCard(r)).join("")}
    </div>
  `;
}

function renderLeagueCard(r) {
  // Column names can vary; these fallbacks prevent blank UI
  const leagueGuid = r.fantasy_league_guid || r.league_guid || r.league_id;
  const leagueName = r.league_name || r.fantasy_league_name || "League";
  const year = r.year || r.tournament_year || r.season_year || "";

  // Enter league context at the scoreboard page
  const href = leagueGuid
    ? `/scoreboard/?league=${encodeURIComponent(leagueGuid)}`
    : "#";

  return `
    <a class="card league-card" href="${href}">
      <div class="card-title">${safeText(leagueName)}</div>
      ${year ? `<div class="card-subtitle">${safeText(String(year))}</div>` : ``}
      <div class="card-cta">View scoreboard →</div>
    </a>
  `;
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
