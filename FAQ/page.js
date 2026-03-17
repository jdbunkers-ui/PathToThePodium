// /faq/page.js
// -------------------------------------------------------------
// FAQ Page Controller
// -------------------------------------------------------------
// Purpose:
//   • Query Supabase table: faq
//   • Render active FAQs ordered by sort_order
//
// Dependencies:
//   • api.js: queryView() or window.supabase client setup
//   • Supabase client loaded in faq/index.html
// -------------------------------------------------------------

(async function initFaqPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading FAQs…</p>`;

  try {
    const supabase = window.supabaseClient || window.supabase;

    if (!supabase) {
      throw new Error("Supabase client is not available on window.");
    }

    const { data, error } = await supabase
      .from("faq")
      .select("faq_guid, question, answer, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    renderFaqs(data || []);
  } catch (err) {
    console.error("FAQ page failed to load:", err);
    root.innerHTML = `<p>Unable to load FAQs right now.</p>`;
  }

  function renderFaqs(rows) {
    if (!rows.length) {
      root.innerHTML = `<p>No FAQs available yet.</p>`;
      return;
    }

    root.innerHTML = `
      <section class="stack-md">
        ${rows.map((row) => `
          <details class="faq-item">
            <summary>${escapeHtml(row.question)}</summary>
            <div class="faq-answer">
              <p>${formatAnswer(row.answer)}</p>
            </div>
          </details>
        `).join("")}
      </section>
    `;
  }

  function formatAnswer(value) {
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
