// /FAQ/page.js — v5.1.5
// The FAQ table may still contain legacy 2026/donation content. Maintain
// accurate public copy without modifying the customer's Supabase schema.
(async function initFaqPage() {
  const root = document.getElementById("page-root");
  if (!root) return;

  const currentFaqs = [
    {
      question: "How do fantasy leagues work?",
      answer: "Commissioners create a league, hold a live wrestler draft independently, and upload their leagues' rosters through our intuitive app. Points scored in real college wrestling tournaments are reflected in fantasy league standings as results are processed, and anyone can view and share public standings online."
    },
    {
      question: "How do I create a league?",
      answer: "Create a free commissioner account, set up a league, conduct your draft independently, and upload each team's completed roster when roster entry opens. Participants do not need accounts just to view the results."
    },
    {
      question: "Is Bracket Leaders free?",
      answer: "Yes. New commissioner leagues include fantasy scoring at no charge, with no credit card or payment required. Public results are free to view. Leagues created before the free-scoring change keep their existing access settings. Donations are optional and never affect access."
    },
    {
      question: "Does Bracket Leaders host a live draft?",
      answer: "No. Hold your draft in person or however your group prefers. Bracket Leaders handles the finalized rosters and fantasy scoring, not the draft itself."
    },
    {
      question: "Do participants need an account?",
      answer: "No. Only commissioners need accounts to create and administer leagues. Anyone can view public league standings and results without signing in."
    },
    {
      question: "Can I view results from previous seasons?",
      answer: "Yes. Published Bracket Leaders results are available from 2025 onward, including the FloWrestling and LMCC fantasy leagues. LMCC has held its fantasy league since 2018; the online results archive begins in 2025."
    },
    {
      question: "Can I make an optional donation?",
      answer: "Yes, but contributions are never expected. Our About page has a voluntary Venmo link for anyone who wants to support the site."
    }
  ];

  root.innerHTML = `<p>Loading FAQs…</p>`;

  try {
    const rows = await queryView("faq", { is_active: true }, { column: "sort_order", ascending: true });
    renderFaqs(rows || []);
  } catch (err) {
    console.error("FAQ page failed to load:", err);
    // Keep the FAQ page useful if the database is temporarily unavailable.
    renderFaqs([]);
  }

  function renderFaqs(remoteRows) {
    // Replace obsolete topic rows from Supabase so old pricing / 2026 / Honey
    // Barrel Hunter copy cannot reappear. Retain unrelated current FAQ entries.
    const replacedTopics = [
      /how do the fantasy leagues work/i,
      /how do fantasy leagues work/i,
      /how do i create a league/i,
      /how much does it cost/i,
      /is .*free/i,
      /how do i support/i,
      /support honey barrel/i,
      /donat/i,
      /does .*host .*draft/i,
      /do .*participants .*account/i,
      /can i view results from previous/i
    ];
    const legacyTerms = /honey\s*barrel\s*hunter|venmo|donat|payment options|in 2026|for 2026|users create or join a league|throughout the season/i;
    const keep = (remoteRows || []).filter(row => {
      const question = String(row.question || "");
      const answer = String(row.answer || "");
      return !replacedTopics.some(pattern => pattern.test(question)) &&
             !legacyTerms.test(question + " " + answer);
    });
    root.innerHTML = `
      <section class="stack-md">
        ${[...currentFaqs, ...keep].map(row => `
          <details class="faq-item">
            <summary>${escapeHtml(row.question)}</summary>
            <div class="faq-answer"><p>${formatAnswer(row.answer)}</p></div>
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
