// Bracket Leaders v5.1.0 — account helpers. Public pages never require sign-in.
(function () {
  "use strict";

  const recoveryRequested = new URLSearchParams(location.search).get("mode") === "reset"
    || new URLSearchParams(location.hash.slice(1)).get("type") === "recovery";
  let recovering = recoveryRequested;

  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function safeNext(value) {
    const fallback = buildRepoLink("my_leagues/index.html");
    if (!value) return fallback;
    try {
      const target = new URL(value, location.origin);
      const base = getBasePath();
      if (target.origin !== location.origin || target.username || target.password) return fallback;
      const allowed = ["my_leagues/", "new_league/", "add_team/"];
      const path = target.pathname.slice(base.length + 1);
      if (!target.pathname.startsWith(`${base}/`) || !allowed.some(prefix => path.startsWith(prefix))) return fallback;
      return target.pathname + target.search;
    } catch (_) { return fallback; }
  }

  function accountLink(mode = "signin", next = location.pathname + location.search) {
    return buildRepoLink("account/index.html", { mode, next: safeNext(next) });
  }

  function callbackUrl(mode, next) {
    return new URL(accountLink(mode, next), location.origin).href;
  }

  function setMessage(element, message, error = false) {
    element.textContent = message || "";
    element.className = error ? "msg error" : "msg";
    element.setAttribute("role", error ? "alert" : "status");
  }

  function errorMessage(error) {
    const message = String(error?.message || "Something went wrong. Please try again.");
    if (/confirm.*email|verify.*email|email.*confirm/i.test(message)) {
      return "Confirm your email address before managing leagues. Open Account to request a new confirmation link.";
    }
    if (/JWT|token.*expired|session.*missing|not authenticated|sign in|registered account/i.test(message)) {
      return "Please sign in again, then retry. Your form entries have been kept.";
    }
    if (/schema cache|Could not find the function|relation .* does not exist/i.test(message)) {
      return "League setup is temporarily unavailable while the site is being updated. Please try again shortly.";
    }
    if (/Failed to fetch|NetworkError|Network request failed/i.test(message)) {
      return "Unable to connect. Check your connection and retry. Your form entries have been kept.";
    }
    return message;
  }

  function isRegistered(user) {
    return Boolean(user && !user.is_anonymous && user.email_confirmed_at);
  }

  function needsConfirmation(user) {
    return Boolean(user && !user.is_anonymous && !user.email_confirmed_at);
  }

  async function requireUser(root) {
    let data, error;
    try { ({ data, error } = await db.auth.getUser()); }
    catch (failure) { error = failure; }
    if (!error && isRegistered(data?.user)) return data.user;
    if (error && !([400, 401, 403].includes(error.status)
      || /AuthSessionMissingError/.test(error.name || "")
      || /session.*missing|not authenticated|invalid.*JWT|JWT.*expired/i.test(error.message || ""))) {
      root.innerHTML = `<section class="form-card account-card">
        <h2>Unable to check your account</h2>
        <p>We couldn’t verify your sign-in right now. Please check your connection and try again.</p>
        <div class="actions"><a class="btn primary" href="${escape(location.pathname + location.search)}">Try again</a>
          <a class="btn" href="${escape(buildRepoLink("index.html"))}">Browse public leagues</a></div>
      </section>`;
      return null;
    }
    if (!error && needsConfirmation(data?.user)) {
      root.innerHTML = `<section class="form-card account-card">
        <h2>Confirm your email to continue</h2>
        <p>Open the confirmation email to finish setting up your account. Then sign in to create and manage leagues.</p>
        <div class="actions"><a class="btn primary" href="${escape(accountLink("resend"))}">Send confirmation link</a>
          <a class="btn" href="${escape(accountLink())}">Account / sign out</a></div>
        <p class="helper-text">Public league links remain available without signing in.</p>
      </section>`;
      return null;
    }
    root.innerHTML = `<section class="form-card account-card">
      <h2>Sign in to manage your leagues</h2>
      <p>Create a free account to create a league and prepare your teams.</p>
      <p>Public leagues and paid-league scoreboards are available to everyone.</p>
      <div class="actions"><a class="btn primary" href="${escape(accountLink())}">Sign in</a>
      <a class="btn" href="${escape(accountLink("register"))}">Create account</a></div>
      <p class="helper-text"><a href="${escape(buildRepoLink("index.html"))}">Browse public leagues</a></p>
    </section>`;
    return null;
  }

  function requestId() {
    if (!window.crypto?.randomUUID) throw new Error("Please use the secure https:// site and a current browser.");
    return window.crypto.randomUUID();
  }

  function dateLabel(value) {
    if (!value) return "Roster deadline will be announced";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Roster deadline will be announced" : `Rosters lock ${date.toLocaleString()}`;
  }

  function eventLabel(name, year) {
    const label = String(name || "Tournament").trim();
    const signature = String(year ?? "").trim();
    if (!/^\d{4}$/.test(signature)) return label;
    return new RegExp(`(^|\\D)${signature}(\\D|$)`).test(label)
      ? label : `${label} — ${signature}`;
  }

  // Subscribe before waiting for the initial session so recovery is never
  // mistaken for an ordinary sign-in. Supabase parses the callback URL.
  db.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") recovering = true;
    window.dispatchEvent(new CustomEvent("bl-auth-change", { detail: { event } }));
  });

  window.BLAuth = {
    escape, safeNext, accountLink, callbackUrl, setMessage, errorMessage,
    isRegistered, needsConfirmation, requireUser, requestId, dateLabel, eventLabel,
    isRecovering: () => recovering
  };
})();
