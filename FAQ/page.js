// /faq/page.js
// -------------------------------------------------------------
// FAQ Page Controller
// -------------------------------------------------------------

(async function initFaqPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  root.innerHTML = `<p>Loading FAQs…</p>`;

  try {
    // IMPORTANT: use your existing helper
    const rows = await queryView(
      "faq",
      { is_active: true },
      { column: "sort_order", ascending: true }
    );

    renderFaqs(rows || []);
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
