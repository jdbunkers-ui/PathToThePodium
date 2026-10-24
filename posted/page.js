// /posted/page.js
// -------------------------------------------------------------
// Posted Matches Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase view: v_posted_matches_current_year
//   • Optionally filter by weight/session via query params
//   • Render match results into #page-root
//   • Link red/green/winner names to /wrestler/?wrestler=<wrestler_guid>
//
// Dependencies (classic scripts):
//   • api.js: queryView()
//   • utils.js: getQueryParam(), buildRepoLink()
// -------------------------------------------------------------

(async function initPostedMatchesPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Posted Tournament Matches</h2>
      <p class="page-subtitle">Match results for the selected tournament.</p>
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
    const selection = await getPublicEventSelection();
    let rows = selection.selected
      ? await callRpc("bl_event_results", { p_event_guid: selection.selected.event_guid })
      : [];
    const weight = getQueryParam("weight");
    const session = getQueryParam("session");
    if (weight) rows = rows.filter(row => Number(row.weight_lbs) === Number(weight));
    if (session) rows = rows.filter(row => Number(row.session) === Number(session));

    renderPostedMatches(rows);
    renderPublicEventSelector(root, selection);
  } catch (err) {
    console.error("Posted matches failed to load:", err);
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Posted Tournament Matches</h2>
        <p class="page-subtitle">Match results for the selected tournament.</p>
      </div>

      <div class="panel">
        <p>Unable to load posted matches.</p>
      </div>
    `;
  }
})();

function renderPostedMatches(rows) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2 class="page-title">Posted Tournament Matches</h2>
        <p class="page-subtitle">Match results for the selected tournament.</p>
      </div>

      <div class="panel">
        <p>No matches have been posted yet.</p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Posted Tournament Matches</h2>
      <p class="page-subtitle">Match results for the selected tournament.</p>
    </div>

    <div class="panel">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Weight</th>
              <th>Red Wrestler</th>
              <th>Green Wrestler</th>
              <th>Winner</th>
              <th>Result</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${safeText(r.weight_class || r.weight_lbs || "—")}</td>
                <td>${wrestlerLink(r.red_wrestler_guid, r.red_wrestler_name || "—")}</td>
                <td>${wrestlerLink(r.green_wrestler_guid, r.green_wrestler_name || "—")}</td>
                <td>${wrestlerLink(r.winner_guid || r.winner_wrestler_guid, r.winner_name || "—")}</td>
                <td>${safeText(r.result || "—")}</td>
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

  return `<a href="${buildRepoLink(`wrestler/index.html?wrestler=${encodeURIComponent(wrestlerGuid)}&event=${encodeURIComponent(window.BLSelectedEvent?.event_guid || "")}`)}">${safeText(label)}</a>`;
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
