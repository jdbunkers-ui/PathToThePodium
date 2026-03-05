(async function initCreateLeaguePage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="form-card">
      <h2>Create a New League</h2>

      <label class="label">League Name</label>
      <input id="league-name" class="input" type="text" placeholder="e.g., Jersey Brackets" />

      <div class="actions">
        <button id="next-btn" class="btn primary">Next</button>
      </div>

      <p id="msg" class="msg"></p>
    </div>
  `;

  const leagueNameEl = document.getElementById("league-name");
  const msgEl = document.getElementById("msg");
  const nextBtn = document.getElementById("next-btn");

  function setMsg(text, isError = false) {
    msgEl.textContent = text || "";
    msgEl.className = isError ? "msg error" : "msg";
  }

  nextBtn.addEventListener("click", () => {
    const leagueName = (leagueNameEl.value || "").trim();
    if (leagueName.length < 3) {
      setMsg("Please enter a league name (at least 3 characters).", true);
      return;
    }

    // Carry league_name forward to add_team
    const url = `/add_team/?league_name=${encodeURIComponent(leagueName)}`;
    window.location.href = url;
  });
})();
