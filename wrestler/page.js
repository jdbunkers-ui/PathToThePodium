// /wrestler/page.js
// -------------------------------------------------------------
// Wrestler Match History Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_wrestler_match_history
//   • Filter by wrestler via URL param: ?wrestler=<wrestler_guid>
//   • Render match history table
//
// Dependencies (classic scripts):
//   • utils.js: requireParam()
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
      { wrestler_guid: wrestlerGuid }
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

  root.innerHTML = `
    <h2>${safeText(wrestlerName)}</h2>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Round</th>
            <th>Opponent</th>
            <th>School</th>
            <th>Result</th>
            <th style="text-align:right;">Points</th>
          </tr>
        </thead>

        <tbody>
          ${rows.map(r => `
            <tr>
              <td>${safeText(r.round_name || "—")}</td>
              <td>${safeText(r.opponent_name || "—")}</td>
              <td>${safeText(r.opponent_school || "—")}</td>
              <td>${safeText(r.result || "—")}</td>
              <td style="text-align:right;">${fmt(r.points)}</td>
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

function fmt(value) {
  if (value === null || value === undefined) return "0";
  return value;
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
