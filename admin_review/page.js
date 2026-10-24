(function () {
  const root = document.getElementById("page-root");
  if (!root) return;
  root.innerHTML = `<section class="panel"><h2>Submission administration has moved</h2>
    <p>New leagues and teams are managed by their account owner in My Leagues.</p>
    <p>Historical pending submissions remain stored for review by the site administrator. Administrative review now uses the trusted database tools.</p>
    <p><a href="${buildRepoLink("my_leagues/index.html")}">Open My Leagues</a></p></section>`;
})();
