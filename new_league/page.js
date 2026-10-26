(async function initCreateLeague() {
  "use strict";
  const root = document.getElementById("page-root");
  const A = window.BLAuth;
  const draftKey = "bl-create-league-v1";
  let draft = {};
  try { draft = JSON.parse(sessionStorage.getItem(draftKey) || "{}"); } catch (_) { /* storage is optional */ }

  try {
    const user = await A.requireUser(root);
    if (!user) return;
    const events = await callRpc("bl_list_events");
    const available = (events || []).filter(event => event.can_create);
    if (!available.length) {
      root.innerHTML = `<section class="form-card account-card"><h2>New events are coming</h2>
        <p>No tournaments are currently accepting new leagues. Your account is ready for the next event.</p>
        <a class="btn" href="${A.escape(buildRepoLink("my_leagues/index.html"))}">My Leagues</a></section>`;
      return;
    }
    if (draft.user_id !== user.id) draft = {};
    root.innerHTML = `<section class="form-card account-card">
      <p>Choose a tournament and year, then name your league. New leagues include fantasy scoring at no charge. Once tournament rosters open, you can add your drafted teams. Existing league records are not changed by this policy.</p>
      <form id="create-league-form">
        <label class="label" for="event">Tournament and year</label>
        <select class="select" id="event" name="event" required>
          <option value="">Choose a tournament</option>
          ${available.map(event => `<option value="${A.escape(event.event_guid)}">${A.escape(A.eventLabel(event.event_name, event.year))}</option>`).join("")}
        </select>
        <p id="event-details" class="helper-text"></p>
        <label class="label" for="league-name">League name</label>
        <input class="input" id="league-name" name="league_name" type="text" minlength="3" maxlength="100" required placeholder="e.g., Jersey Mat Mafia" />
        <p class="account-note">League creation and fantasy scoring are free. No credit card required. Commissioners manage rosters; participants can follow public results without signing in.</p>
        <div class="actions"><button class="btn primary" id="create-button" type="submit">Create league</button>
          <a class="btn" href="${A.escape(buildRepoLink("my_leagues/index.html"))}">My Leagues</a></div>
        <p id="create-message" class="msg" role="status" aria-live="polite"></p>
      </form>
    </section>`;
    const form = document.getElementById("create-league-form");
    const eventInput = document.getElementById("event");
    const nameInput = document.getElementById("league-name");
    const message = document.getElementById("create-message");
    const button = document.getElementById("create-button");
    eventInput.value = draft.event_guid || "";
    nameInput.value = draft.league_name || "";

    function persist() {
      draft.user_id = user.id;
      draft.event_guid = eventInput.value;
      draft.league_name = nameInput.value;
      try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch (_) { /* submit still works */ }
    }

    function updateDetails() {
      const selected = available.find(event => event.event_guid === eventInput.value);
      document.getElementById("event-details").textContent = selected ? A.dateLabel(selected.roster_lock_at) : "";
      persist();
    }
    nameInput.addEventListener("input", persist);
    eventInput.addEventListener("change", updateDetails);
    updateDetails();

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = nameInput.value.trim();
      if (name.length < 3) { A.setMessage(message, "Enter a league name with at least 3 characters.", true); return; }
      button.disabled = true;
      A.setMessage(message, "Creating your league…");
      try {
        const payloadKey = JSON.stringify([eventInput.value, name]);
        if (draft.payload_key !== payloadKey || !draft.request_id) {
          draft.payload_key = payloadKey;
          draft.request_id = A.requestId();
        }
        persist();
        const leagueGuid = await callRpc("bl_create_league", {
          p_event_guid: eventInput.value, p_league_name: name, p_request_id: draft.request_id
        });
        if (!leagueGuid) throw new Error("No league confirmation was returned. Please retry.");
        try { sessionStorage.removeItem(draftKey); } catch (_) { /* optional */ }
        location.assign(buildRepoLink("my_leagues/index.html", { league: leagueGuid, created: "1" }));
      } catch (error) {
        A.setMessage(message, A.errorMessage(error), true);
        if (/JWT|token|session|sign in|authenticated/i.test(String(error?.message))) {
          const signIn = document.createElement("a");
          signIn.href = A.accountLink(); signIn.textContent = "Sign in again"; signIn.className = "btn";
          message.append(document.createTextNode(" "), signIn);
        }
      } finally { button.disabled = false; }
    });
  } catch (error) {
    root.innerHTML = `<section class="panel"><h2>Unable to load league setup</h2><p class="account-error">${A.escape(A.errorMessage(error))}</p>
      <a class="btn" href="${A.escape(location.pathname + location.search)}">Try again</a></section>`;
  }
})();
