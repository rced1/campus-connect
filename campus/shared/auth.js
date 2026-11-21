/**
 * Sign in / sign up / pending / verify screens (SBB modal style).
 * // CC: new file (M3)
 */

const AUTH_RETURN_KEY = 'cc-auth-return';

function saveAuthReturn(action) {
  try {
    sessionStorage.setItem(AUTH_RETURN_KEY, JSON.stringify(action || null));
  } catch (_) {
    /* ignore */
  }
}

function takeAuthReturn() {
  try {
    const raw = sessionStorage.getItem(AUTH_RETURN_KEY);
    sessionStorage.removeItem(AUTH_RETURN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function openAuthModal(mode = 'sign-in') {
  state.authMode = mode;
  if (mode === 'sign-in') openSignInModal();
  else if (mode === 'sign-up') openSignUpModal();
  else if (mode === 'forgot') openForgotPasswordModal();
  else if (mode === 'check-email') openCheckEmailModal();
  else if (mode === 'pending') openPendingApprovalModal();
}

function openSignInModal() {
  renderModal(`<div class="eyebrow">Welcome back</div>
    <h2>Sign in to Campus Connect.</h2>
    <p class="muted">Browse freely. Sign in to buy, message, save, or sell.</p>
    <form data-form="sign-in">
      <div class="field"><label for="auth-email">Email</label><input id="auth-email" name="email" type="email" required autocomplete="username" placeholder="you@sdsu.edu" /></div>
      <div class="field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" required autocomplete="current-password" /></div>
      <div class="modal-actions"><button class="ghost-button" type="button" data-action="open-forgot">Forgot password</button><button class="primary-button" type="submit">Sign in ${icon('arrow')}</button></div>
    </form>
    <p class="muted small" style="margin-top: 14px">New here? <button type="button" class="text-button" data-action="open-sign-up">Create an account</button></p>`);
}

function openSignUpModal() {
  renderModal(`<div class="eyebrow">Join Campus Connect</div>
    <h2>Create your student account.</h2>
    <p class="muted">@sdsu.edu emails are approved automatically after you verify. Other emails can browse, and a human reviews them before buying or selling.</p>
    <form data-form="sign-up">
      <div class="form-grid">
        <div class="field"><label for="auth-first">First name</label><input id="auth-first" name="firstName" required autocomplete="given-name" /></div>
        <div class="field"><label for="auth-last">Last name</label><input id="auth-last" name="lastName" required autocomplete="family-name" /></div>
      </div>
      <div class="field"><label for="auth-email">Email</label><input id="auth-email" name="email" type="email" required autocomplete="username" placeholder="you@sdsu.edu" /></div>
      <div class="field"><label for="auth-password">Password</label><input id="auth-password" name="password" type="password" required minlength="8" autocomplete="new-password" /></div>
      <div class="modal-actions"><button class="ghost-button" type="button" data-action="open-sign-in">I already have an account</button><button class="primary-button" type="submit">Create account ${icon('arrow')}</button></div>
    </form>`);
}

function openForgotPasswordModal() {
  renderModal(`<div class="eyebrow">Password</div>
    <h2>Reset your password.</h2>
    <p class="muted">We will email a reset link if that address has an account.</p>
    <form data-form="forgot-password">
      <div class="field"><label for="auth-email">Email</label><input id="auth-email" name="email" type="email" required autocomplete="username" /></div>
      <div class="modal-actions"><button class="ghost-button" type="button" data-action="open-sign-in">Back</button><button class="primary-button" type="submit">Send reset link</button></div>
    </form>`);
}

function openCheckEmailModal(email = '') {
  renderModal(`<div class="success-mark">${icon('check')}</div>
    <div class="eyebrow">Check your email</div>
    <h2>Verify your address.</h2>
    <p class="muted">We sent a link${email ? ` to ${escapeHtml(email)}` : ''}. Open it, then come back and sign in.</p>
    <div class="modal-actions">
      <button class="ghost-button" type="button" data-action="resend-verification" data-email="${escapeHtml(email)}">Resend email</button>
      <button class="primary-button" type="button" data-action="open-sign-in">Sign in</button>
    </div>`);
}

function openPendingApprovalModal() {
  renderModal(`<div class="eyebrow">Almost there</div>
    <h2>Your account is waiting for approval.</h2>
    <p class="muted">You can keep browsing. Buying, messaging, and selling unlock once a human approves you. @sdsu.edu accounts are usually approved right after email verification.</p>
    <div class="modal-actions"><button class="primary-button" type="button" data-action="close-modal">Keep browsing</button></div>`);
}

/**
 * Ensures a signed-in, approved user before running `fn`.
 * @param {() => Promise<void>|void} fn
 * @param {{ action?: string }} [meta]
 */
async function requireAuth(fn, meta = {}) {
  const session = data.session || (await api.getSession());
  data.session = session;
  if (!session.userId) {
    saveAuthReturn({ type: 'callback' });
    state._authResume = fn;
    openAuthModal('sign-in');
    return;
  }
  if (session.state === 'pendingApproval' || (session.emailVerified && !session.verified && session.state !== 'active')) {
    openAuthModal('pending');
    return;
  }
  if (!session.emailVerified) {
    openCheckEmailModal(session.email || '');
    return;
  }
  if (!session.verified && session.state !== 'active') {
    openAuthModal('pending');
    return;
  }
  await fn();
}

async function resumeAfterAuth() {
  const resume = state._authResume;
  state._authResume = null;
  takeAuthReturn();
  if (typeof resume === 'function') await resume();
}

Object.assign(ACTIONS, {
  'open-sign-in': () => openAuthModal('sign-in'),
  'open-sign-up': () => openAuthModal('sign-up'),
  'open-forgot': () => openAuthModal('forgot'),
  'resend-verification': async (target) => {
    await api.resendVerification();
    showToast('Verification email sent.');
    openCheckEmailModal(target.dataset.email || '');
  },
});

Object.assign(FORMS, {
  'sign-in': async (fields) => {
    await api.signIn(fields);
    await load('session', 'account');
    closeModal();
    showToast('Signed in.');
    updateChrome();
    await resumeAfterAuth();
  },
  'sign-up': async (fields) => {
    await api.signUp(fields);
    closeModal();
    openCheckEmailModal(fields.email);
  },
  'forgot-password': async (fields) => {
    await api.requestPasswordReset(fields.email);
    closeModal();
    showToast('If that email has an account, a reset link is on the way.');
  },
});
