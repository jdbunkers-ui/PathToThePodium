// /js/site-chrome.js
(function () {
  const params = new URLSearchParams(window.location.search);
  const league = params.get("league");

  // Detect repo base path for GitHub Pages project sites.
  // Example pathname: /PathToThePodium/index.html -> basePath = /PathToThePodium
  const parts = window.location.pathname.split("/").filter(Boolean);
  const basePath = parts.length ? `/${parts[0]}` : "";

  const globalNav = [
    { label: "HOME", href: "index.html" },
    { label: "COLLEGE", href: "college/index.html" },
    { label: "RESULTS", href: "posted/index.html" },
    { label: "CREATE", href: "new_league/index.html" },
    { label: "FAQ", href: "FAQ/index.html" },
    { label: "ABOUT", href: "about/index.html" },
  ];

  const leagueNav = [
    { label: "HOME", href: "index.html" },
    { label: "SCOREBOARD", href: "scoreboard/index.html" },
    { label: "STATS", href: "team_stats/index.html" },
    { label: "LEADERBOARD", href: "leaders/index.html" },
    { label: "COLLISIONS", href: "collision/index.html" },
  ];

  const navItems = league ? leagueNav : globalNav;

  const links = navItems
    .map((item) => {
      const url = new URL(`${basePath}/${item.href}`, window.location.origin);

      // Preserve league context when navigating within league pages
      if (league && item.label !== "HOME") {
        url.searchParams.set("league", league);
      }

      return `<a class="nav-link" href="${url.pathname}${url.search}">${item.label}</a>`;
    })
    .join("");

  const navRoot = document.getElementById("site-nav");

  if (navRoot) {
    navRoot.innerHTML = `
      <header class="site-header">
        <div class="site-header-inner">
          <nav class="nav" aria-label="Primary navigation">
            ${links}
          </nav>

          <div class="site-brand">
            <img
              src="${basePath}/images/podium.png"
              alt="Champion Wrestler"
              class="header-podium"
            >
          </div>
        </div>
      </header>
    `;
  }

  const footerRoot = document.getElementById("site-footer");

  if (footerRoot) {
    footerRoot.innerHTML = `
      <footer class="footer" aria-label="Site footer">
        Developed by White Blaze Analytics LLC
      </footer>
    `;
  }
})();
