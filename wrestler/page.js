// /wrestler/page.js
// -------------------------------------------------------------
// Wrestler Match History Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_wrestler_match_history
//   • Filter by wrestler via URL param: ?wrestler=<wrestler_guid>
//   • Render match history table
//   • Add "Back to Scoreboard" link when ?league=<fantasy_league_guid> is present
//   • Make opponent clickable when opponent_wrestler_guid exists
//
// Dependencies (classic scripts):
//   • utils.js: requireParam(), getQueryParam()
//   • api.js: queryView()
// -------------------------------------------------------------

(async function initWrestlerPage() {

  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading wrestler history…</p>`;

  try {

    const wrestlerGuid = requireParam("wrestler");

    const rows = await queryView(
      "v_wrestler_match_history",
      { wrestler_guid: wrestlerGuid },
      { column: "match_number", ascending: true }
    );

    renderWrestlerHistory(rows);

  } catch (err) {

    console.error("Wrestler page failed to load:", err);
    root.innerHTML = `<p>Unable to load wrestler history.</p>`;

  }

})();


function renderWrestlerHistory(rows) {

  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No match history found.</p>`;
    return;
  }

  const wrestlerName = rows[0].wrestler_name || "Wrestler";

  const league = getQueryParam("league");
  const backLink = league
    ? `<p><a href="../scoreboard/?league=${encodeURIComponent(league)}">← Back to Scoreboard</a></p>`
    : "";

  root.innerHTML = `
    <h2>${safeText(wrestlerName)}</h2>
    ${backLink}

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Round</th>
            <th>Opponent</th>
            <th>Result</th>
            <th style="text-align:right;">Red</th>
            <th style="text-align:right;">Green</th>
            <th>Win Type</th>
            <th>End Type</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${safeText(r.round_description || "—")}</td>

              <td>
                ${wrestlerLink(
                  r.opponent_wrestler_guid,
                  r.opponent_wrestler_name || "—",
                  league
                )}
              </td>

              <td>${safeText(r.result || "—")}</td>
              <td style="text-align:right;">${fmtScore(r.red_score)}</td>
              <td style="text-align:right;">${fmtScore(r.green_score)}</td>
              <td>${safeText(r.win_type || "—")}</td>
              <td>${safeText(r.end_type || "—")}</td>
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

function wrestlerLink(wrestlerGuid, label, league) {
  if (!wrestlerGuid) return safeText(label);

  const url = new URL("../wrestler/", window.location.href);
  url.searchParams.set("wrestler", wrestlerGuid);

  if (league) url.searchParams.set("league", league);

  return `<a href="${url.pathname}${url.search}">${safeText(label)}</a>`;
}

function fmtScore(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
