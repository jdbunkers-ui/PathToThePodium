(async function initMyLeagues() {
  "use strict";
  const root = document.getElementById("page-root");
  const A = window.BLAuth;
  const leagueGuid = new URLSearchParams(location.search).get("league");

  function paymentStatus(paid) {
    return `<span class="league-status ${paid ? "paid" : ""}">${paid ? "Paid · scoring unlocked" : "Unpaid · scoring locked"}</span>`;
  }

  function toolbar(user) {
    return `<div class="account-toolbar"><p class="account-meta">${A.escape(user.email || "Your account")}</p>
      <div class="actions"><a class="btn primary" href="${A.escape(buildRepoLink("new_league/index.html"))}">Create league</a>
        <a class="btn" href="${A.escape(A.accountLink("signin", buildRepoLink("my_leagues/index.html")))}">Account / sign out</a></div></div>`;
  }

  try {
    const user = await A.requireUser(root);
    if (!user) return;
    if (leagueGuid) {
      const league = await callRpc("bl_manage_league", { p_league_guid: leagueGuid });
      if (!league) throw new Error("This league is not available to this account.");
      const teams = league.teams || [];
      root.innerHTML = `${toolbar(user)}
        ${new URLSearchParams(location.search).get("created") === "1" ? '<p class="account-note" role="status">Your league has been created. You can start preparing your teams.</p>' : ""}
        <section class="panel league-card">
          <h2>${A.escape(league.league_name)}</h2>
          <p class="account-meta">${A.escape(A.eventLabel(league.event_name, league.year))}</p>
          ${paymentStatus(league.paid_ind)}
          <p>${A.escape(A.dateLabel(league.roster_lock_at))}</p>
          ${league.paid_ind ? '<p>Anyone with the scoreboard link can view this league without signing in.</p>' : '<p>League setup is available. Fantasy scores will appear after payment is recorded. Online payment collection is coming later.</p>'}
          <div class="actions">
            ${league.roster_open ? `<a class="btn primary" href="${A.escape(buildRepoLink("add_team/index.html", { league: leagueGuid }))}">Add team</a>` : '<span class="account-meta">Roster submissions are not currently open.</span>'}
            ${league.paid_ind ? `<a class="btn" href="${A.escape(buildRepoLink("scoreboard/index.html", { league: leagueGuid }))}">Public scoreboard</a>` : ""}
            <a class="btn" href="${A.escape(buildRepoLink("my_leagues/index.html"))}">All my leagues</a>
          </div>
        </section>
        <h2 style="margin-top:28px">Teams (${teams.length})</h2>
        ${teams.length ? `<div class="league-grid">${teams.map(team => `<article class="panel league-card">
          <h3>${A.escape(team.team_name)}</h3>
          <ul class="roster-list">${(team.roster || []).map(pick => `<li><strong>${A.escape(pick.weight_lbs)} lbs:</strong> ${A.escape(pick.wrestler_name)}${pick.college_team ? ` (${A.escape(pick.college_team)})` : ""}</li>`).join("")}</ul>
          ${league.paid_ind ? `<div class="actions"><a class="btn" href="${A.escape(buildRepoLink("team/index.html", { league: leagueGuid, team: team.fantasy_team_guid }))}">View team points</a></div>` : ""}
        </article>`).join("")}</div>` : '<div class="panel"><p>No teams have been added yet. If tournament entries are not available, you can return here when the field is published.</p></div>'}`;
      return;
    }

    const leagues = await callRpc("bl_my_leagues");
    root.innerHTML = `${toolbar(user)}
      <p class="account-meta">Your leagues appear here as soon as you create them. Historical leagues are assigned to owners by the site administrator.</p>
      ${(leagues || []).length ? `<div class="league-grid">${leagues.map(league => `<article class="panel league-card">
        <h2>${A.escape(league.league_name)}</h2><p class="account-meta">${A.escape(A.eventLabel(league.event_name, league.year))}</p>
        ${paymentStatus(league.paid_ind)}<p>${A.escape(league.team_count ?? 0)} teams</p>
        <div class="actions"><a class="btn primary" href="${A.escape(buildRepoLink("my_leagues/index.html", { league: league.fantasy_league_guid }))}">Manage league</a>
          ${league.paid_ind ? `<a class="btn" href="${A.escape(buildRepoLink("scoreboard/index.html", { league: league.fantasy_league_guid }))}">Public scoreboard</a>` : ""}</div>
      </article>`).join("")}</div>` : '<section class="panel"><h2>Your first league starts here</h2><p>Create a league for an upcoming tournament, then prepare your teams.</p></section>'}`;
  } catch (error) {
    root.innerHTML = `<section class="panel"><h2>Unable to load your leagues</h2><p class="account-error">${A.escape(A.errorMessage(error))}</p>
      <div class="actions"><a class="btn" href="${A.escape(buildRepoLink("my_leagues/index.html"))}">My Leagues</a>
        <a class="btn" href="${A.escape(A.accountLink())}">Sign in</a></div></section>`;
  }
})();
