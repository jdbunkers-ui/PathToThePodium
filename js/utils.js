// utils.js
// Common helper functions used across PTTP pages

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function requireParam(name) {
  const value = getQueryParam(name);

  if (!value) {
    console.error(`Missing required parameter: ${name}`);
    document.getElementById("page-root").innerHTML =
      `<p>Missing required parameter: ${name}</p>`;
    throw new Error(`Missing parameter ${name}`);
  }

  return value;
}
