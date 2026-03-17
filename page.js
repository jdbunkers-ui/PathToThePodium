// /page.js
// -------------------------------------------------------------
// Landing Page Controller (Root)
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_paid_leagues_by_year
//   • Render leagues in a searchable table
//   • Link each row into scoreboard pages using:
//       ./scoreboard/?league=<fantasy_league_guid>
// -------------------------------------------------------------

(async function initLandingPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Leagues</h2>
      <p class="page-subtitle">
        Browse active fantasy leagues and jump into each scoreboard.
      </p>
    </div>

    <div class="panel">
      <div class="skeleton title"></div>
      <div class="skeleton medium"></div>
      <div class="skeleton long"></div>
      <div class="skeleton table-row"></div>
      <div class="skeleton table-row"></div>
      <div class="skeleton table-row"></div>
    </div>
  `;

  try {
    const rows = await queryView(
      "v_paid_leagues_by_year",
      {},
      { column: "league_name", ascending: true }
    );

    renderLeagueTable(rows || []);
  } catch (err) {
    console.error("Landing page failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Leagues</h2>
        <p class="page-subtitle">
          Browse active fantasy leagues and jump into each scoreboard.
        </p>
      </div>

      <div class="panel">
        <p>Unable to load leagues.</p>
      </div>
    `;
  }
})();

function renderLeagueTable(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  const normalizedRows = rows.map(normalizeLeagueRow);

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Leagues</h2>
      <p class="page-subtitle">
        Browse active fantasy leagues and jump into each scoreboard.
      </p>
    </div>

    <div class="toolbar-card">
      <label for="league-search" class="label">Search leagues</label>
      <input
        id="league-search"
        class="input"
        type="text"
        placeholder="Search by league name or year"
        autocomplete="off"
      />
      <p id="league-count" class="helper-text"></p>
    </div>

    <div id="league-table-region"></div>
  `;

  const searchInput = document.getElementById("league-search");
  const tableRegion = document.getElementById("league-table-region");
  const countEl = document.getElementById("league-count");

  function draw(filteredRows) {
    if (countEl) {
      countEl.textContent =
        filteredRows.length +
        " league" +
        (filteredRows.length === 1 ? "" : "s") +
        " shown";
    }

    if (!filteredRows.length) {
      tableRegion.innerHTML = `
        <div class="panel">
          <p>No leagues found.</p>
        </div>
      `;
      return;
    }

    tableRegion.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>League</th>
              <th>Year</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows.map(renderLeagueRow).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  draw(normalizedRows);

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const needle = (searchInput.value || "").trim().toLowerCase();

      if (!needle) {
        draw(normalizedRows);
        return;
      }

      const filtered = normalizedRows.filter(function (row) {
        return (
          row.league_name.toLowerCase().includes(needle) ||
          row.year_text.toLowerCase().includes(needle)
        );
      });

      draw(filtered);
    });
  }
}

function normalizeLeagueRow(r) {
  const leagueGuid = r.fantasy_league_guid || r.league_guid || r.league_id || "";
  const leagueName = r.league_name || r.fantasy_league_name || "League";
  const year = r.year || r.tournament_year || r.season_year || "";

  return {
    league_guid: String(leagueGuid),
    league_name: String(leagueName),
    year: year,
    year_text: year == null ? "" : String(year),
    href: leagueGuid
      ? "./scoreboard/?league=" + encodeURIComponent(leagueGuid)
      : "#"
  };
}

function renderLeagueRow(row) {
  return (
    "<tr>" +
      "<td>" + safeText(row.league_name) + "</td>" +
      "<td>" + safeText(row.year_text) + "</td>" +
      '<td><a class="btn-link" href="' + row.href + '">View scoreboard</a></td>' +
    "</tr>"
  );
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : value;
  return div.innerHTML;
}
