// /js/site-chrome.js
// -------------------------------------------------------------
// Site Chrome (Navigation)
// -------------------------------------------------------------
// Responsible for rendering the top navigation bar on every page.
//
// Behavior:
//   • If a "league" query parameter exists in the URL,
//     show the league navigation.
//   • Otherwise show the global navigation.
//
// Example URLs:
//
//   Global:
//     /index.html
//
//   League context:
//     /scoreboard/?league=<fantasy_league_guid>
//
// The league parameter is preserved automatically across links
// when the league navigation is active.
// -------------------------------------------------------------

(function () {

  // Read the current URL query parameters
  const params = new URLSearchParams(window.location.search);
  const league = params.get("league");

  // -----------------------------------------------------------
  // GLOBAL NAVIGATION
  // -----------------------------------------------------------
  // Used when NOT inside a specific league
  // -----------------------------------------------------------
  const globalNav = [
    { label: "HOME", href: "/index.html" },
    { label: "COLLEGE", href: "/college/index.html" },
    { label: "RESULTS", href: "/posted/index.html" },
    { label: "CREATE", href: "/new_league/index.html" },
    { label: "FAQ", href: "/FAQ/index.html" },
    { label: "ABOUT", href: "/about/index.html" }
  ];

  // -----------------------------------------------------------
  // LEAGUE NAVIGATION
  // -----------------------------------------------------------
  // Used when a league context exists
  // -----------------------------------------------------------
  const leagueNav = [
    { label: "SCOREBOARD", href: "/scoreboard/index.html" },
    { label: "STATS", href: "/team_stats/index.html" },
    { label: "LEADERBOARD", href: "/leaders/index.html" },
    { label: "COLLISIONS", href: "/collision/index.html" }
  ];

  // Decide which navigation to use
  const navItems = league ? leagueNav : globalNav;

  // -----------------------------------------------------------
  // BUILD LINKS
  // -----------------------------------------------------------
  // If a league exists, append ?league=<guid> to each link
  // -----------------------------------------------------------
  const links = navItems.map(item => {

    const url = new URL(item.href, window.location.origin);

    if (league) {
      url.searchParams.set("league", league);
    }

    return `<a class="nav-link" href="${url.pathname}${url.search}">${item.label}</a>`;

  }).join("");

  // -----------------------------------------------------------
  // RENDER NAVIGATION
  // -----------------------------------------------------------
  const navContainer = document.getElementById("site-nav");

  if (navContainer) {
    navContainer.innerHTML = `
      <nav class="nav">
        ${links}
      </nav>
    `;
  }

})();
