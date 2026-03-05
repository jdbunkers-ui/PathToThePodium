(async function initAddTeamPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  // --- Helpers (use your utils.js if you already have equivalents) ---
  function getParam(name) {
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  const leagueName = (getParam("league_name") || "").trim();
  if (!leagueName) {
    root.innerHTML = `<p>Missing league_name. Please start from Create League.</p>`;
    return;
  }

  const WEIGHTS = [125,133,141,149,157,165,174,184,197,285];

  root.innerHTML = `
    <div class="form-card">
      <h2>Add Team</h2>

      <label class="label">League Name</label>
      <input class="input" type="text" value="${escapeHtml(leagueName)}" disabled />

      <label class="label">Team Name</label>
      <input id="team-name" class="input" type="text" placeholder="e.g., The Mat Monsters" />

      <div id="weights-wrap"></div>

      <div class="actions">
        <button id="add-another" class="btn">Add Another Team</button>
        <button id="done" class="btn primary">Done</button>
      </div>

      <p id="msg" class="msg"></p>
    </div>
  `;

  const weightsWrap = document.getElementById("weights-wrap");
  const teamNameEl = document.getElementById("team-name");
  const msgEl = document.getElementById("msg");
  const addAnotherBtn = document.getElementById("add-another");
  const doneBtn = document.getElementById("done");

  function setMsg(text, isError = false) {
    msgEl.textContent = text || "";
    msgEl.className = isError ? "msg error" : "msg";
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // 1) Load wrestlers once
  setMsg("Loading wrestlers…");
  let rows = [];
  try {
    rows = await queryView(
      "v_wrestlers_by_weight_class",
      {},
      { column: "wrestler_name", ascending: true }
    );
  } catch (err) {
    console.error(err);
    setMsg("Unable to load wrestlers.", true);
    return;
  }

  // 2) Group by weight_lbs
  const byWeight = new Map();
  for (const w of WEIGHTS) byWeight.set(w, []);
  for (const r of rows) {
    if (!byWeight.has(r.weight_lbs)) continue;
    byWeight.get(r.weight_lbs).push(r);
  }

  // 3) Render 10 dropdowns
  weightsWrap.innerHTML = WEIGHTS.map((w) => {
    const opts = (byWeight.get(w) || []).map((r) => {
      const label = r.college_team ? `${r.wrestler_name} (${r.college_team})` : r.wrestler_name;
      return `<option value="${r.wrestler_guid}">${escapeHtml(label)}</option>`;
    }).join("");

    return `
      <div class="row">
        <label class="label">${w} lbs</label>
        <select class="select" id="w_${w}">
          <option value="">-- Select wrestler --</option>
          ${opts}
        </select>
      </div>
    `;
  }).join("");

  setMsg("");

  function readPayload() {
    const teamName = (teamNameEl.value || "").trim();
    if (teamName.length < 2) throw new Error("Team name is required (min 2 chars).");

    const picks = {};
    for (const w of WEIGHTS) {
      const sel = document.getElementById(`w_${w}`);
      const val = sel ? sel.value : "";
      if (!val) throw new Error(`Please select a wrestler for ${w} lbs.`);
      picks[w] = val;
    }

    // NOTE: use your actual “active year” value here.
    // If you already keep it in a URL param or operational table, we can wire it in later.
    const year = new Date().getFullYear();

    return {
      p_year: year,
      p_league_name: leagueName,
      p_team_name: teamName,

      p_w_125: picks[125],
      p_w_133: picks[133],
      p_w_141: picks[141],
      p_w_149: picks[149],
      p_w_157: picks[157],
      p_w_165: picks[165],
      p_w_174: picks[174],
      p_w_184: picks[184],
      p_w_197: picks[197],
      p_w_285: picks[285],
    };
  }

  async function submitTeam(closeAfter) {
    setMsg("");
    addAnotherBtn.disabled = true;
    doneBtn.disabled = true;

    try {
      const payload = readPayload();

      const stgId = await callRpc("submit_fantasy_team", payload);

      if (closeAfter) {
        setMsg(`Saved (stg_id=${stgId}). Closing…`);
        try {
          window.close();
        } catch (e) {}
        // Fallback if the browser blocks closing
        setTimeout(() => {
          root.innerHTML = `<p>Saved (stg_id=${stgId}). You can close this window.</p>`;
        }, 500);
      } else {
        setMsg(`Saved (stg_id=${stgId}). Add the next team.`);
        // Clear team inputs for next entry
        teamNameEl.value = "";
        for (const w of WEIGHTS) {
          const sel = document.getElementById(`w_${w}`);
          if (sel) sel.value = "";
        }
        teamNameEl.focus();
      }
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "Submit failed.", true);
    } finally {
      addAnotherBtn.disabled = false;
      doneBtn.disabled = false;
    }
  }

  addAnotherBtn.addEventListener("click", () => submitTeam(false));
  doneBtn.addEventListener("click", () => submitTeam(true));
})();
