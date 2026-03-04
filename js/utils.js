// utils.js
// Common helper functions used across PTTP pages

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
