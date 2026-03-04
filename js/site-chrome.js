// /js/site-chrome.js
(function () {
  const params = new URLSearchParams(window.location.search);
  const league = params.get("league");

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

  // Attach league query param to league-nav links
  const links = navItems.map(item => {
    const url = new URL(item.href, window.location.origin);
    if (league) url.searchParams.set("league", league);
    return `<a class="nav-link" href="${url.pathname}${url.search}">${item.label}</a>`;
  }).join("");

  const el = document.getElementById("site-nav");
  if (el) {
    el.innerHTML = `<nav class="nav">${links}</nav>`;
  }
})();

