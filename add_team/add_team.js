// api.js
// API functions will go here later

async function fetchJson(url) {
  const response = await fetch(url);
  return await response.json();
}
