(async function initAdminReviewPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `
    <div class="form-card">
      <h2>Review Submissions</h2>

      <label class="label">Admin Key</label>
      <input id="admin-key" class="input" type="password" placeholder="Enter admin key" />

      <div class="actions">
        <button id="load-btn" class="btn primary">Load Pending</button>
        <button id="load-approved" class="btn">Load Approved</button>
        <button id="load-rejected" class="btn">Load Rejected</button>
      </div>

      <p id="msg" class="msg"></p>

      <div class="table-wrap" style="margin-top:16px;">
        <table class="table" id="tbl" style="display:none;">
          <thead>
            <tr>
              <th>Created</th>
              <th>Year</th>
              <th>League</th>
              <th>Team</th>
              <th>Picks (125→285)</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const keyEl = document.getElementById("admin-key");
  const msgEl = document.getElementById("msg");
  const tbl = document.getElementById("tbl");
  const tbody = document.getElementById("tbody");

  const loadBtn = document.getElementById("load-btn");
  const loadApprovedBtn = document.getElementById("load-approved");
  const loadRejectedBtn = document.getElementById("load-rejected");

  function setMsg(text, isError = false) {
    msgEl.textContent = text || "";
    msgEl.className = isError ? "msg error" : "msg";
  }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  function picksRow(r) {
    return [
      r.w125, r.w133, r.w141, r.w149, r.w157,
      r.w165, r.w174, r.w184, r.w197, r.w285
    ].map(x => x || "—").join(" • ");
  }

  async function load(status) {
    const adminKey = (keyEl.value || "").trim();
    if (!adminKey) {
      setMsg("Enter admin key.", true);
      return;
    }

    setMsg(`Loading ${status} submissions…`);
    tbody.innerHTML = "";
    tbl.style.display = "none";

    try {
      const rows = await callRpc("admin_list_fantasy_submissions", {
        p_admin_key: adminKey,
        p_status: status,
        p_limit: 200,
      });

      if (!rows || rows.length === 0) {
        setMsg(`No ${status} submissions found.`);
        return;
      }

      tbody.innerHTML = rows.map(r => `
        <tr data-id="${r.stg_id}">
          <td>${fmtDate(r.created_at)}</td>
          <td>${r.year}</td>
          <td>${escapeHtml(r.league_name)}</td>
          <td>${escapeHtml(r.team_name)}</td>
          <td style="max-width:420px;">${escapeHtml(picksRow(r))}</td>
          <td>${escapeHtml(r.status)}</td>
          <td>
            <input class="input" style="min-width:180px;" type="text"
              value="${escapeHtml(r.review_notes || "")}"
              placeholder="review notes" data-notes="${r.stg_id}" />
          </td>
          <td>
            <button class="btn" data-action="approve" data-id="${r.stg_id}">Approve</button>
            <button class="btn" data-action="reject" data-id="${r.stg_id}">Reject</button>
          </td>
        </tr>
      `).join("");

      tbl.style.display = "";
      setMsg(`Loaded ${rows.length} ${status} submissions.`);
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "Load failed.", true);
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function setStatus(stgId, status) {
    const adminKey = (keyEl.value || "").trim();
    const notesEl = document.querySelector(`input[data-notes="${stgId}"]`);
    const notes = (notesEl?.value || "").trim();

    try {
      await callRpc("admin_set_fantasy_submission_status", {
        p_admin_key: adminKey,
        p_stg_id: Number(stgId),
        p_status: status,
        p_review_notes: notes || null,
      });

      // Remove row from table for quick triage when reviewing PENDING
      const tr = document.querySelector(`tr[data-id="${stgId}"]`);
      if (tr) tr.remove();
      setMsg(`Updated stg_id=${stgId} → ${status}`);
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "Update failed.", true);
    }
  }

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const stgId = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    if (action === "approve") setStatus(stgId, "APPROVED");
    if (action === "reject") setStatus(stgId, "REJECTED");
  });

  loadBtn.addEventListener("click", () => load("PENDING"));
  loadApprovedBtn.addEventListener("click", () => load("APPROVED"));
  loadRejectedBtn.addEventListener("click", () => load("REJECTED"));
})();
