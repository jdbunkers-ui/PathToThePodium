// /js/site-chrome.js
// GitHub Pages base path fix: all links are prefixed with /PathtothePodium
// Preserves ?league=<guid> when present.

(function () {
  const params = new URLSearchParams(window.location.search);
  const league = params.get("league");

  // ✅ IMPORTANT: your GitHub Pages repo path
  const BASE_PATH = "/PathtothePodium";

  // Pages that use the global nav (no league param)
  const globalNav = [
    { label: "HOME", href: "/index.html" },
    { label: "COLLEGE", href: "/college/index.html" },
    { label: "RESULTS", href: "/posted/index.html" },
    { label: "CREATE", href: "/new_league/index.html" },
    { label: "FAQ", href: "/FAQ/index.html" },
    { label: "ABOUT", href: "/about/index.html" },
  ];

  // Pages that use the league nav (league param)
  const leagueNav = [
    { label: "SCOREBOARD", href: "/scoreboard/index.html" },
    { label: "STATS", href: "/team_stats/index.html" },
    { label: "LEADERBOARD", href: "/leaders/index.html" },
    { label: "COLLISIONS", href: "/collision/index.html" },
  ];

  const navItems = league ? leagueNav : globalNav;

  const links = navItems.map(item => {
    // Prefix with BASE_PATH so links work on https://.../PathtothePodium/...
    const url = new URL(`${BASE_PATH}${item.href}`, window.location.origin);

    if (league) url.searchParams.set("league", league);

    return `<a class="nav-link" href="${url.pathname}${url.search}">${item.label}</a>`;
  }).join("");

  const el = document.getElementById("site-nav");
  if (el) el.innerHTML = `<nav class="nav">${links}</nav>`;
})();
