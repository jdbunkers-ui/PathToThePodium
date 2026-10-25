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

    const details = await loadOfficialFinishes(selection.selected?.event_guid);
    renderPostedMatches(rows, details);
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

function renderPostedMatches(rows, details = new Map()) {
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
                <td>${formatOfficialFinish(details.get(Number(r.match_number)), r.result)}</td>
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

// v5.1.2: optional official-history enrichment; leaves old site usable
// if the additive database migration has not been deployed yet.
async function loadOfficialFinishes(eventGuid) {
  if (!eventGuid) return new Map();
  try {
    const details = await callRpc('bl_public_match_official_details', { p_event_guid: eventGuid });
    return new Map((details || []).map(d => [Number(d.match_number), d]));
  } catch (error) {
    console.warn('Official finish details unavailable; showing recorded results.', error);
    return new Map();
  }
}

function formatOfficialFinish(detail, recordedResult) {
  if (!detail) return safeText(recordedResult || '—');
  return `<span class="bl-official-finish">${safeText(detail.official_result_text)}</span>`;
}
