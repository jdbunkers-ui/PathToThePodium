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
      root.innerHTML = `<p>Missing required parameter: ${name}</p>`;
    }

    throw new Error(`Missing parameter ${name}`);
  }

  return value;
}

/*
Helper: navigate to another page while preserving the league parameter
*/
function navigateWithLeague(path) {
  const league = getQueryParam("league");

  if (!league) {
    window.location.href = path;
    return;
  }

  const url = new URL(path, window.location.origin);
  url.searchParams.set("league", league);

  window.location.href = url.pathname + url.search;
}

/*
Helper: build a link that preserves league parameter
*/
function buildLeagueLink(path) {
  const league = getQueryParam("league");

  if (!league) return path;

  const url = new URL(path, window.location.origin);
  url.searchParams.set("league", league);

  return url.pathname + url.search;
}
