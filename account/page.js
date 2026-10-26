(async function initAccount() {
  "use strict";
  const root = document.getElementById("page-root");
  const A = window.BLAuth;
  const query = new URLSearchParams(location.search);
  const callbackError = query.get("error_description") || new URLSearchParams(location.hash.slice(1)).get("error_description");
  const next = A.safeNext(query.get("next"));
  let mode = query.get("mode") || "signin";
  let currentUser = null;

  const link = target => A.accountLink(target, next);
  const tabs = () => `<nav class="account-tabs" aria-label="Account options">
    <a href="${A.escape(link("signin"))}" ${mode === "signin" ? 'aria-current="page"' : ""}>Sign in</a>
    <a href="${A.escape(link("register"))}" ${mode === "register" ? 'aria-current="page"' : ""}>Create account</a>
  </nav>`;

  function formField(id, label, type, autocomplete, extra = "") {
    return `<label class="label" for="${id}">${label}</label><input class="input" id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}" ${extra} />`;
  }

  function bindForm(handler) {
    const form = document.getElementById("account-form");
    const message = document.getElementById("account-message");
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      A.setMessage(message, "Working…");
      try { await handler(form, message); }
      catch (error) { A.setMessage(message, A.errorMessage(error), true); }
      finally { if (button.isConnected) button.disabled = false; }
    });
  }

  function showSignedIn(confirmed = false) {
    root.innerHTML = `<section class="form-card account-card">
      <h2>${confirmed ? "Your email is confirmed" : "You’re signed in"}</h2>
      <p>${A.escape(currentUser?.email || "Your account is ready.")}</p>
      <div class="actions"><a class="btn primary" href="${A.escape(next)}">Continue to your leagues</a>
        <button class="btn" id="signout" type="button">Sign out</button></div>
      <p id="account-message" class="msg" role="status" aria-live="polite"></p>
    </section>`;
    bindSignOut();
  }

  function bindSignOut() {
    document.getElementById("signout").addEventListener("click", async event => {
      const button = event.currentTarget;
      button.disabled = true;
      const { error } = await db.auth.signOut();
      if (error) {
        A.setMessage(document.getElementById("account-message"), A.errorMessage(error), true);
        button.disabled = false;
      } else {
        currentUser = null;
        mode = "signin";
        showSignin();
      }
    });
  }

  function showConfirmationRequired() {
    root.innerHTML = `<section class="form-card account-card">
      <h2>Confirm your email to continue</h2>
      <p>${A.escape(currentUser?.email || "Your email address")} is waiting for confirmation.</p>
      <p>Open the confirmation email to finish setting up your account. You can request a new link below.</p>
      <div class="actions"><a class="btn primary" href="${A.escape(link("resend"))}">Send confirmation link</a>
        <button class="btn" id="signout" type="button">Sign out</button></div>
      <p id="account-message" class="msg" role="status" aria-live="polite"></p>
    </section>`;
    bindSignOut();
  }

  function showSignin() {
    root.innerHTML = `<section class="form-card account-card">${tabs()}
      <h2>Welcome back</h2><p>Sign in to create and manage your leagues.</p>
      <form id="account-form">
        ${formField("email", "Email address", "email", "username", 'required maxlength="254"')}
        ${formField("password", "Password", "password", "current-password", "required")}
        <div class="actions"><button class="btn primary" type="submit">Sign in</button>
          <a href="${A.escape(link("forgot"))}">Forgot password?</a></div>
        <p id="account-message" class="msg" role="status" aria-live="polite"></p>
      </form>
      <p class="helper-text">Waiting for a confirmation email? <a href="${A.escape(link("resend"))}">Send a new confirmation link</a>.</p>
      <p class="helper-text">You can <a href="${A.escape(buildRepoLink("index.html"))}">browse public leagues and fantasy scoreboards</a> without signing in.</p>
    </section>`;
    bindForm(async (form) => {
      const { data, error } = await db.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
      if (error) throw error;
      if (A.needsConfirmation(data?.user)) {
        currentUser = data.user;
        showConfirmationRequired();
        return;
      }
      if (!A.isRegistered(data?.user)) throw new Error("Sign in with a registered account to manage leagues.");
      location.assign(next);
    });
  }

  function showRegister() {
    root.innerHTML = `<section class="form-card account-card">${tabs()}
      <h2>Create your account</h2><p>Your account, league setup, and fantasy scoring are free. No credit card is required.</p>
      <form id="account-form">
        ${formField("display_name", "Name (optional)", "text", "name", 'maxlength="100"')}
        ${formField("email", "Email address", "email", "username", 'required maxlength="254"')}
        ${formField("password", "Password", "password", "new-password", 'required minlength="8" aria-describedby="password-help"')}
        <p id="password-help" class="helper-text">Use at least 8 characters. A longer, unique password is best.</p>
        ${formField("confirm_password", "Confirm password", "password", "new-password", 'required minlength="8"')}
        <div class="actions"><button class="btn primary" type="submit">Create account</button></div>
        <p id="account-message" class="msg" role="status" aria-live="polite"></p>
      </form>
    </section>`;
    bindForm(async (form, message) => {
      if (form.password.value !== form.confirm_password.value) throw new Error("The passwords do not match.");
      const { data, error } = await db.auth.signUp({
        email: form.email.value.trim(), password: form.password.value,
        options: { emailRedirectTo: A.callbackUrl("confirmed", next), data: { display_name: form.display_name.value.trim() } }
      });
      if (error) throw error;
      form.password.value = "";
      form.confirm_password.value = "";
      if (data?.session && A.isRegistered(data?.user)) {
        location.assign(next);
        return;
      }
      root.innerHTML = `<section class="form-card account-card"><h2>Check your email</h2>
        <p>If this address can be registered, a confirmation link will arrive shortly. Open it to finish setting up your account.</p>
        <p>Already registered? Sign in, or use the password reset option.</p>
        <div class="actions"><a class="btn primary" href="${A.escape(link("signin"))}">Go to sign in</a>
          <a class="btn" href="${A.escape(link("forgot"))}">Reset password</a></div></section>`;
    });
  }

  function showForgot() {
    root.innerHTML = `<section class="form-card account-card"><h2>Reset your password</h2>
      <p>We’ll email you a link to choose a new password.</p>
      <form id="account-form">
        ${formField("email", "Email address", "email", "username", 'required maxlength="254"')}
        <div class="actions"><button class="btn primary" type="submit">Send reset link</button>
          <a href="${A.escape(link("signin"))}">Back to sign in</a></div>
        <p id="account-message" class="msg" role="status" aria-live="polite"></p>
      </form></section>`;
    bindForm(async (form, message) => {
      const { error } = await db.auth.resetPasswordForEmail(form.email.value.trim(), { redirectTo: A.callbackUrl("reset", next) });
      if (error) throw error;
      A.setMessage(message, "If an account exists for this email, a password reset link will arrive shortly.");
    });
  }

  function showResend() {
    root.innerHTML = `<section class="form-card account-card"><h2>Confirm your email</h2>
      <p>Request a new confirmation link for your account.</p>
      <form id="account-form">
        ${formField("email", "Email address", "email", "username", 'required maxlength="254"')}
        <div class="actions"><button class="btn primary" type="submit">Send confirmation link</button>
          <a href="${A.escape(link("signin"))}">Back to sign in</a></div>
        <p id="account-message" class="msg" role="status" aria-live="polite"></p>
      </form></section>`;
    bindForm(async (form, message) => {
      const { error } = await db.auth.resend({
        type: "signup", email: form.email.value.trim(),
        options: { emailRedirectTo: A.callbackUrl("confirmed", next) }
      });
      if (error) throw error;
      A.setMessage(message, "If this account is waiting for confirmation, a new link will arrive shortly.");
    });
  }

  function showReset() {
    mode = "reset";
    root.innerHTML = `<section class="form-card account-card"><h2>Choose a new password</h2>
      <form id="account-form">
        ${formField("password", "New password", "password", "new-password", 'required minlength="8"')}
        ${formField("confirm_password", "Confirm new password", "password", "new-password", 'required minlength="8"')}
        <div class="actions"><button class="btn primary" type="submit">Save new password</button></div>
        <p id="account-message" class="msg" role="status" aria-live="polite"></p>
      </form>
      <p class="helper-text">Link expired? <a href="${A.escape(link("forgot"))}">Request a new reset link</a>.</p>
    </section>`;
    bindForm(async (form) => {
      if (form.password.value !== form.confirm_password.value) throw new Error("The passwords do not match.");
      const { data: sessionData, error: sessionError } = await db.auth.getSession();
      if (sessionError || !sessionData?.session) throw new Error("This reset link is missing or expired. Please request a new reset link below.");
      const { error } = await db.auth.updateUser({ password: form.password.value });
      if (error) throw error;
      root.innerHTML = `<section class="form-card account-card"><h2>Password updated</h2>
        <p>Your new password is ready to use.</p><a class="btn primary" href="${A.escape(next)}">Continue to your leagues</a></section>`;
    });
  }

  window.addEventListener("bl-auth-change", event => {
    if (event.detail?.event === "PASSWORD_RECOVERY" && mode !== "reset") showReset();
  });

  try {
    const { data, error } = await db.auth.getSession();
    currentUser = data?.session?.user || null;
    if (A.isRecovering() || mode === "reset") { showReset(); return; }
    if (callbackError) {
      mode = "signin";
      showSignin();
      A.setMessage(document.getElementById("account-message"), callbackError, true);
      return;
    }
    if (A.isRegistered(currentUser) && !error && mode !== "forgot") { showSignedIn(mode === "confirmed"); return; }
    if (A.needsConfirmation(currentUser) && !error && !["forgot", "resend"].includes(mode)) { showConfirmationRequired(); return; }
    if (mode === "register") showRegister();
    else if (mode === "forgot") showForgot();
    else if (mode === "resend") showResend();
    else {
      mode = "signin";
      showSignin();
      if (query.get("mode") === "confirmed") A.setMessage(document.getElementById("account-message"), "Please sign in to continue. If your confirmation link expired, use Send a new confirmation link below.");
    }
  } catch (error) {
    showSignin();
    A.setMessage(document.getElementById("account-message"), A.errorMessage(error), true);
  }
})();
