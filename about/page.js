// /about/page.js
// -------------------------------------------------------------
// About Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Render About page content
//   • Load approved comments from public.site_comment
//   • Insert new comments for moderation
//
// Dependencies:
//   • api.js
//   • window.supabaseClient (or window.db)
// -------------------------------------------------------------

(async function initAboutPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  renderShell();

  const supabase = window.supabaseClient || window.db;

  if (!supabase) {
    console.error("Supabase client is not available on window.");
    const listEl = document.getElementById("comment-list");
    if (listEl) {
      listEl.innerHTML = `<p>Comments are unavailable right now.</p>`;
    }
    return;
  }

  await loadComments();

  const form = document.getElementById("comment-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitComment();
    });
  }

  function renderShell() {
    root.innerHTML = `
      <section class="stack-md">

        <section class="content-card">
          <h2>How the fantasy leagues work</h2>
          <p>
            Honey Barrel Hunter lets wrestling fans create leagues, draft wrestlers, and compete
            against friends based on real wrestling results throughout the season.
          </p>
          <p>
            Commissioners create a league, league members join in, and teams score points as real
            match outcomes and tournament results come in. The goal is to build the strongest roster
            and outscore the rest of the league.
          </p>
        </section>

        <section class="content-card">
          <h2>How to create a league</h2>
          <p>
            Creating a league is simple. Go to the league creation page, enter your league details,
            and share the league with your friends. Once your members are in, you can run your draft
            and start following the standings.
          </p>
        </section>

        <section class="content-card">
          <h2>League payment for 2026</h2>
          <p>
            For the 2026 season, participation is donation only. There is no required fee to play.
          </p>
          <p>
            If you enjoy the site and want to support future development, updates, and hosting, you
            can contribute through Venmo.
          </p>
          <p>
            <a
              class="btn primary"
              href="https://venmo.com/HoneyBarrelHunter"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support Honey Barrel Hunter on Venmo
            </a>
          </p>
        </section>

        <section class="content-card">
          <h2>Comments</h2>
          <p>Leave a comment, suggestion, or note. Comments are reviewed before they appear publicly.</p>

          <form id="comment-form" class="stack-md">
            <div>
              <label class="label" for="comment-name">Name</label>
              <input
                id="comment-name"
                class="input"
                type="text"
                maxlength="80"
                placeholder="Your name"
              />
            </div>

            <div>
              <label class="label" for="comment-text">Comment</label>
              <textarea
                id="comment-text"
                class="textarea"
                rows="5"
                maxlength="1000"
                placeholder="Share your comment or suggestion"
              ></textarea>
            </div>

            <div class="actions">
              <button type="submit" class="btn primary">Submit Comment</button>
            </div>

            <p id="comment-status" class="helper-text"></p>
          </form>
        </section>

        <section class="content-card">
          <h2>Public Comments</h2>
          <div id="comment-list">
            <p>Loading comments…</p>
          </div>
        </section>

      </section>
    `;
  }

  async function loadComments() {
    const listEl = document.getElementById("comment-list");
    if (!listEl) return;

    listEl.innerHTML = `<p>Loading comments…</p>`;

    try {
      const { data, error } = await supabase
        .from("site_comment")
        .select("display_name, comment_text, created_at")
        .eq("page_key", "about")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || !data.length) {
        listEl.innerHTML = `<p>No public comments yet.</p>`;
        return;
      }

      listEl.innerHTML = data.map((row) => `
        <article class="comment-card">
          <h3>${escapeHtml(row.display_name)}</h3>
          <p>${formatText(row.comment_text)}</p>
          <small>${formatDate(row.created_at)}</small>
        </article>
      `).join("");
    } catch (err) {
      console.error("Comment load failed:", err);
      listEl.innerHTML = `<p>Unable to load comments right now.</p>`;
    }
  }

  async function submitComment() {
    const statusEl = document.getElementById("comment-status");
    const nameEl = document.getElementById("comment-name");
    const textEl = document.getElementById("comment-text");
    const form = document.getElementById("comment-form");

    if (!statusEl || !nameEl || !textEl || !form) return;

    const displayName = (nameEl.value || "").trim() || "Anonymous";
    const commentText = (textEl.value || "").trim();

    if (!commentText) {
      statusEl.textContent = "Please enter a comment before submitting.";
      return;
    }

    statusEl.textContent = "Submitting comment…";

    try {
      const { error } = await supabase
        .from("site_comment")
        .insert([
          {
            page_key: "about",
            display_name: displayName,
            comment_text: commentText
          }
        ]);

      if (error) throw error;

      form.reset();
      statusEl.textContent = "Comment submitted. It will appear after review.";
    } catch (err) {
      console.error("Comment insert failed:", err);
      statusEl.textContent = "Unable to submit comment right now.";
    }
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return "";
    }
  }

  function formatText(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
