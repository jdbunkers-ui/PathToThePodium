(async function initAddTeam() {
  "use strict";
  const root = document.getElementById("page-root");
  const A = window.BLAuth;
  const leagueGuid = new URLSearchParams(location.search).get("league");
  if (!leagueGuid) {
    root.innerHTML = `<section class="form-card account-card"><h2>Choose a league from My Leagues</h2>
      <p>Team setup now uses your account’s league list. Open a league there and choose Add team.</p>
      <a class="btn primary" href="${A.escape(buildRepoLink("my_leagues/index.html"))}">My Leagues</a></section>`;
    return;
  }
  const draftKey = `bl-team-draft-v1:${leagueGuid}`;
  let draft = {};
  try { draft = JSON.parse(sessionStorage.getItem(draftKey) || "{}"); } catch (_) { /* optional storage */ }

  try {
    const user = await A.requireUser(root);
    if (!user) return;
    const [league, options] = await Promise.all([
      callRpc("bl_manage_league", { p_league_guid: leagueGuid }),
      callRpc("bl_event_roster_options", { p_league_guid: leagueGuid })
    ]);
    if (!league || !options) throw new Error("This league is not available to this account.");
    if (draft.user_id !== user.id) draft = {};
    const manageLink = buildRepoLink("my_leagues/index.html", { league: leagueGuid });
    const weights = (options.weights || []).map(Number).filter(Number.isFinite);
    const wrestlers = options.wrestlers || [];
    const byWeight = new Map(weights.map(weight => [weight, wrestlers.filter(wrestler => Number(wrestler.weight_lbs) === weight)]));
    const entriesReady = weights.length > 0 && weights.every(weight => byWeight.get(weight).length > 0);
    if (!options.roster_open || !entriesReady) {
      root.innerHTML = `<section class="form-card account-card"><h2>${A.escape(league.league_name)}</h2>
        <p class="account-meta">${A.escape(A.eventLabel(league.event_name, league.year))}</p>
        <p>${entriesReady ? "Roster submissions are not currently open for this event." : "The tournament field is not ready for team selection yet. Your league is saved; return here when the entries are published."}</p>
        <p>${A.escape(A.dateLabel(league.roster_lock_at))}</p>
        <a class="btn" href="${A.escape(manageLink)}">Back to league</a></section>`;
      return;
    }
    root.innerHTML = `<section class="form-card account-card"><h2>${A.escape(league.league_name)}</h2>
      <p class="account-meta">${A.escape(A.eventLabel(league.event_name, league.year))}</p>
      <p>${A.escape(A.dateLabel(league.roster_lock_at))}</p>
      <form id="team-form">
        <label class="label" for="team-name">Team name</label>
        <input class="input" type="text" id="team-name" name="team_name" minlength="2" maxlength="100" required placeholder="e.g., The Mat Monsters" />
        <div class="roster-grid">${weights.map(weight => `<div class="row">
          <label class="label" for="weight-${weight}">${weight} lbs</label>
          <select class="select" id="weight-${weight}" name="weight_${weight}" required>
            <option value="">Choose a wrestler</option>
            ${byWeight.get(weight).map(wrestler => `<option value="${A.escape(wrestler.wrestler_guid)}">${A.escape(wrestler.wrestler_name)}${wrestler.college_team ? ` (${A.escape(wrestler.college_team)})` : ""}${wrestler.seed ? ` · Seed ${A.escape(wrestler.seed)}` : ""}</option>`).join("")}
          </select></div>`).join("")}</div>
        <div class="actions"><button class="btn primary" type="submit" value="done">Save team</button>
          <button class="btn" type="submit" value="another">Save and add another</button>
          <a class="btn" href="${A.escape(manageLink)}">Back to league</a></div>
        <p id="team-message" class="msg" role="status" aria-live="polite"></p>
      </form>
    </section>`;
    const form = document.getElementById("team-form");
    const nameInput = document.getElementById("team-name");
    const message = document.getElementById("team-message");
    nameInput.value = draft.team_name || "";
    for (const weight of weights) document.getElementById(`weight-${weight}`).value = draft.picks?.[weight] || "";

    function persist() {
      draft.user_id = user.id;
      draft.team_name = nameInput.value;
      draft.picks = Object.fromEntries(weights.map(weight => [weight, document.getElementById(`weight-${weight}`).value]));
      try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch (_) { /* optional */ }
    }
    form.addEventListener("input", persist);
    form.addEventListener("change", persist);

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = nameInput.value.trim();
      const picks = weights.map(weight => ({ weight_lbs: weight, wrestler_guid: document.getElementById(`weight-${weight}`).value }));
      const buttons = Array.from(form.querySelectorAll('button[type="submit"]'));
      buttons.forEach(button => { button.disabled = true; });
      A.setMessage(message, "Saving your team…");
      try {
        if (name.length < 2) throw new Error("Enter a team name with at least 2 characters.");
        if (new Set(picks.map(pick => pick.wrestler_guid)).size !== weights.length) throw new Error("Choose a different wrestler for every weight class.");
        const payloadKey = JSON.stringify([name, picks]);
        if (draft.payload_key !== payloadKey || !draft.request_id) {
          draft.payload_key = payloadKey;
          draft.request_id = A.requestId();
        }
        persist();
        const teamGuid = await callRpc("bl_save_team", {
          p_league_guid: leagueGuid, p_team_name: name, p_picks: picks, p_request_id: draft.request_id
        });
        if (!teamGuid) throw new Error("No save confirmation was returned. Please retry.");
        try { sessionStorage.removeItem(draftKey); } catch (_) { /* optional */ }
        draft = {};
        if (event.submitter?.value === "another") {
          form.reset(); nameInput.focus();
          A.setMessage(message, `${name} has been saved. Add your next team.`);
        } else location.assign(manageLink);
      } catch (error) {
        A.setMessage(message, A.errorMessage(error), true);
        if (/JWT|token|session|sign in|authenticated/i.test(String(error?.message))) {
          const signIn = document.createElement("a");
          signIn.href = A.accountLink(); signIn.textContent = "Sign in again"; signIn.className = "btn";
          message.append(document.createTextNode(" "), signIn);
        }
      } finally { buttons.forEach(button => { button.disabled = false; }); }
    });
  } catch (error) {
    root.innerHTML = `<section class="panel"><h2>Unable to load team setup</h2><p class="account-error">${A.escape(A.errorMessage(error))}</p>
      <a class="btn" href="${A.escape(buildRepoLink("my_leagues/index.html"))}">My Leagues</a></section>`;
  }
})();
