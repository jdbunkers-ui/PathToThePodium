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
//   • utils.js: getQueryParam()
// -------------------------------------------------------------

(async function initPostedMatchesPage() {

  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading posted matches…</p>`;

  try {

    // Optional filters
    const weight = getQueryParam("weight");
    const session = getQueryParam("session");

    const filters = {};

    // Enable these if your view supports the columns
    // if (weight) filters.weight_lbs = Number(weight);
    // if (session) filters.session_nbr = Number(session);

    const rows = await queryView(
      "v_posted_matches_current_year",
      filters
    );

    renderPostedMatches(rows);

  } catch (err) {

    console.error("Posted matches failed to load:", err);
    root.innerHTML = `<p>Unable to load posted matches.</p>`;

  }

})();


function renderPostedMatches(rows) {

  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No matches have been posted yet.</p>`;
    return;
  }

  root.innerHTML = `
    <h2>Posted Tournament Matches</h2>

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
  `;
}


/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */

function wrestlerLink(wrestlerGuid, label) {
  // If we don't have a guid, render plain text (no broken links)
  if (!wrestlerGuid) return safeText(label);

  return `
    <a href="../wrestler/?wrestler=${encodeURIComponent(wrestlerGuid)}">
      ${safeText(label)}
    </a>
  `;
}

function safeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}
