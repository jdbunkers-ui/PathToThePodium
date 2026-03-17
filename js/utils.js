// utils.js
// Shared helper functions used across PTTP pages

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function requireParam(name) {
  const value = getQueryParam(name);

  if (!value) {
    console.error(`Missing required parameter: ${name}`);

    const root = document.getElementById("page-root");
    if (root) {
      root.innerHTML = `
        <div class="panel">
          <p>Missing required parameter: ${name}</p>
        </div>
      `;
    }

    throw new Error(`Missing parameter ${name}`);
  }

  return value;
}

/*
Helper: detect repo base path for GitHub Pages project sites only.
Example:
  GitHub Pages project site:
    https://username.github.io/BracketLeaders/scoreboard/index.html
    => basePath = /BracketLeaders

  Custom domain:
    https://bracketleaders.com/scoreboard/index.html
    => basePath = ""
*/
function getBasePath() {
  const isGitHubPagesHost = window.location.hostname.endsWith("github.io");
  if (!isGitHubPagesHost) return "";

  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "";
}

/*
Helper: build a repo-safe link from a relative path and optional params.
Handles GitHub Pages project-site paths consistently.
*/
function buildRepoLink(relativePath, params = {}) {
  const basePath = getBasePath();
  const cleanPath = String(relativePath || "").replace(/^\/+/, "");
  const url = new URL(`${basePath}/${cleanPath}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return `${url.pathname}${url.search}`;
}

/*
Helper: navigate to another page while preserving the league parameter.
Expects a repo-relative path like:
  "scoreboard/index.html"
  "wrestler/index.html?wrestler=123"
*/
function navigateWithLeague(path) {
  const league = getQueryParam("league");
  const [relativePath, queryString = ""] = String(path).split("?");

  const params = new URLSearchParams(queryString);
  if (league && !params.has("league")) {
    params.set("league", league);
  }

  const href = buildRepoLink(relativePath, Object.fromEntries(params.entries()));
  window.location.href = href;
}

/*
Helper: build a link that preserves league parameter.
Expects a repo-relative path like:
  "wrestler/index.html?wrestler=123"
*/
function buildLeagueLink(path) {
  const league = getQueryParam("league");
  const [relativePath, queryString = ""] = String(path).split("?");

  const params = new URLSearchParams(queryString);
  if (league && !params.has("league")) {
    params.set("league", league);
  }

  return buildRepoLink(relativePath, Object.fromEntries(params.entries()));
}
