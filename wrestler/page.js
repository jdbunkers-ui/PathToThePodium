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

    const filters = { wrestler_guid: wrestlerGuid };
    let eventGuid = getQueryParam("event");
    const leagueGuid = getQueryParam("league");
    if (leagueGuid) {
      const context = await callRpc("bl_public_league", { p_league_guid: leagueGuid });
      if (context?.found) eventGuid = context.event_guid;
    }
    if (eventGuid) filters.event_guid = eventGuid;
    window.BLWrestlerEvent = eventGuid;

    const rows = await queryView(
      "v_wrestler_match_history",
      filters,
      { column: "match_number", ascending: true }
    );

    const officialFinishes = await loadWrestlerOfficialFinishes(rows);
    renderWrestlerHistory(rows, officialFinishes);
  } catch (err) {
    console.error("Wrestler page failed to load:", err);
    root.innerHTML = `<p>Unable to load wrestler history.</p>`;
  }
})();

function renderWrestlerHistory(rows, officialFinishes = new Map()) {
  const root = document.getElementById("page-root");
  if (!root) return;

  if (!rows || rows.length === 0) {
    root.innerHTML = `<p>No match history found.</p>`;
    return;
  }

  const wrestlerName = rows[0].wrestler_name || "Wrestler";

  const league = getQueryParam("league");
  const backLink = league
    ? `<p><a href="${buildRepoLink("scoreboard/index.html", { league })}">← Back to Scoreboard</a></p>`
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
            <th>Official Finish</th>
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
              <td>${renderOfficialWrestlerFinish(officialFinishes.get(r.match_guid))}</td>
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

  return `<a href="${buildRepoLink("wrestler/index.html", {
    wrestler: wrestlerGuid,
    event: window.BLWrestlerEvent,
    league
  })}">${safeText(label)}</a>`;
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

// v5.1.2: only request detail for events present in this wrestler history.
// Any failure falls back to the established win/end-type columns.
async function loadWrestlerOfficialFinishes(rows) {
  const eventGuids = [...new Set(rows.map(r => r.event_guid).filter(Boolean))];
  const outputs = await Promise.all(eventGuids.map(async eventGuid => {
    try {
      return await callRpc('bl_public_match_official_details', { p_event_guid: eventGuid });
    } catch (error) {
      console.warn('Official match finishes unavailable for event', eventGuid, error);
      return [];
    }
  }));
  return new Map(outputs.flat().map(detail => [detail.match_guid, detail]));
}

function renderOfficialWrestlerFinish(detail) {
  if (!detail) return '—';
  return `<span class="bl-official-finish">${safeText(detail.official_result_text)}</span>`;
}
