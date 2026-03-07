// /page.js
// -------------------------------------------------------------
// Landing Page Controller (Root)
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_paid_leagues_by_year
//   • Render a list of league cards into #page-root
//   • Each card links into league-context pages using:
//       ./scoreboard/?league=<fantasy_league_guid>
// -------------------------------------------------------------

(async function initLandingPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Leagues</h2>
      <p class="page-subtitle">Browse active fantasy leagues and jump into each scoreboard.</p>
    </div>

    <div class="panel">
      <div class="skeleton title"></div>
      <div class="skeleton medium"></div>
      <div class="skeleton long"></div>
      <div class="skeleton text short"></div>
    </div>
  `;

  try {
    const rows = await queryView(
      "v_paid_leagues_by_year",
      {},
      { column: "league_name", ascending: true }
    );

    renderLeagueList(rows);
  } catch (err) {
    console.error("Landing page failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Leagues</h2>
        <p class="page-subtitle">Browse active fantasy leagues and jump into each scoreboard.</p>
      </div>

      <div class="panel">
        <p>Unable to load leagues.</p>
      </div>
    `;
  }
})();

function renderLeagueList(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Leagues</h2>
        <p class="page-subtitle">Browse active fantasy leagues and jump into each scoreboard.</p>
      </div>

      <div class="panel">
        <p>No leagues found.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Leagues</h2>
      <p class="page-subtitle">Browse active fantasy leagues and jump into each scoreboard.</p>
    </div>

    <div class="panel">
      <div class="card-grid">
        ${rows.map(function (r) {
          return renderLeagueCard(r);
        }).join("")}
      </div>
    </div>
  `;
}

function renderLeagueCard(r) {
  const leagueGuid = r.fantasy_league_guid || r.league_guid || r.league_id;
  const leagueName = r.league_name || r.fantasy_league_name || "League";
  const year = r.year || r.tournament_year || r.season_year || "";

  const href = leagueGuid
    ? "./scoreboard/?league=" + encodeURIComponent(leagueGuid)
    : "#";

  return (
    '<a class="card league-card" href="' + href + '">' +
      '<div class="card-title">' + safeText(leagueName) + "</div>" +
      (year
        ? '<div class="card-subtitle">' + safeText(String(year)) + "</div>"
        : "") +
      '<div class="card-cta">View scoreboard -&gt;</div>' +
    "</a>"
  );
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : value;
  return div.innerHTML;
}
