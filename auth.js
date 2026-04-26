import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

// ── Ошибки (совпадают с iOS) ───────────────────────────────────────────
const ERR = {
  'auth/invalid-email':           'Неверный формат email.',
  'auth/email-already-in-use':    'Этот email уже используется.',
  'auth/weak-password':           'Пароль слишком простой. Минимум 6 символов.',
  'auth/wrong-password':          'Неверный пароль.',
  'auth/user-not-found':          'Пользователь не найден.',
  'auth/user-disabled':           'Учётная запись отключена.',
  'auth/too-many-requests':       'Слишком много попыток. Попробуйте позже.',
  'auth/network-request-failed':  'Проблема с подключением к сети.',
  'auth/invalid-credential':      'Неверный email или пароль.',
  'auth/popup-closed-by-user':    '',
  'auth/popup-blocked':           'Браузер заблокировал всплывающее окно. Разрешите попапы.',
};
const errMsg = code => ERR[code] ?? 'Произошла неизвестная ошибка. Попробуйте ещё раз.';

// ── DOM ────────────────────────────────────────────────────────────────
const screen      = document.getElementById('authScreen');
const loading     = document.getElementById('authLoading');
const content     = document.getElementById('authContent');
const tabLogin    = document.getElementById('authTabLogin');
const tabReg      = document.getElementById('authTabReg');
const subtitle    = document.getElementById('authSubtitle');
const hint        = document.getElementById('authHint');
const emailInput  = document.getElementById('authEmail');
const passInput   = document.getElementById('authPassword');
const confInput   = document.getElementById('authConfirm');
const confWrap    = document.getElementById('authConfirmWrap');
const errorEl     = document.getElementById('authError');
const infoEl      = document.getElementById('authInfo');
const submitBtn   = document.getElementById('authSubmit');
const appleBtn    = document.getElementById('authApple');
const googleBtn   = document.getElementById('authGoogle');
const togglePass  = document.getElementById('authTogglePass');

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let loginMode = true;
let busy      = false;

// ── Табы ───────────────────────────────────────────────────────────────
function setMode(login) {
  loginMode = login;
  tabLogin.classList.toggle('is-active', login);
  tabReg.classList.toggle('is-active', !login);
  subtitle.textContent  = login ? 'Вход в аккаунт' : 'Создание аккаунта';
  hint.textContent      = login ? 'Введите email и пароль, чтобы продолжить' : 'Заполните поля для регистрации';
  submitBtn.textContent = login ? 'Войти' : 'Создать аккаунт';
  confWrap.classList.toggle('hidden', login);
  clearMsg();
}
tabLogin.addEventListener('click', () => setMode(true));
tabReg.addEventListener('click',   () => setMode(false));

// ── Видимость пароля ───────────────────────────────────────────────────
const EYE    = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYEOFF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
let passVis = false;
togglePass.innerHTML = EYE;
togglePass.addEventListener('click', () => {
  passVis = !passVis;
  passInput.type = passVis ? 'text' : 'password';
  togglePass.innerHTML = passVis ? EYEOFF : EYE;
});

// ── Сообщения ─────────────────────────────────────────────────────────
function showError(msg) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); infoEl.classList.add('hidden'); }
function showInfo(msg)  { infoEl.textContent  = msg; infoEl.classList.remove('hidden'); errorEl.classList.add('hidden'); }
function clearMsg()     { errorEl.classList.add('hidden'); infoEl.classList.add('hidden'); }

// ── Загрузка ──────────────────────────────────────────────────────────
const SPINNER = `<span class="auth-spin"></span>`;
function setBusy(on) {
  busy = on;
  submitBtn.disabled = on;
  appleBtn.disabled  = on;
  googleBtn.disabled = on;
  if (on) { submitBtn.innerHTML = SPINNER; }
  else    { submitBtn.textContent = loginMode ? 'Войти' : 'Создать аккаунт'; }
}

// ── Submit ─────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', handleSubmit);
[emailInput, passInput, confInput].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });
});

async function handleSubmit() {
  if (busy) return;
  clearMsg();
  const email = emailInput.value.trim();
  const pass  = passInput.value;
  const conf  = confInput.value;

  if (!email || !email.includes('@')) { showError('Проверьте формат email.'); return; }
  if (pass.length < 6)                { showError('Пароль минимум 6 символов.'); return; }
  if (!loginMode && pass !== conf)    { showError('Пароли не совпадают.'); return; }

  setBusy(true);
  try {
    if (loginMode) {
      const r = await signInWithEmailAndPassword(auth, email, pass);
      await r.user.reload();
      if (!r.user.emailVerified) {
        await signOut(auth);
        showError('Email не подтверждён. Проверьте почту и перейдите по ссылке.');
      }
      // onAuthStateChanged скроет экран если вошёл
    } else {
      const r = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(r.user);
      const userCode = Math.random().toString(36).slice(2, 10).toLowerCase();
      await setDoc(doc(db, 'users', r.user.uid), { email, userCode });
      await signOut(auth);
      showInfo(`Письмо подтверждения отправлено на ${email}. Проверьте почту.`);
      setMode(true);
    }
  } catch (err) {
    const msg = errMsg(err.code);
    if (msg) showError(msg);
  }
  setBusy(false);
}

// ── Хелпер: попап на десктопе, редирект на мобильном ──────────────────
async function signInWith(provider) {
  if (isMobile) {
    await signInWithRedirect(auth, provider);
    // страница перезагрузится — дальнейший код не выполнится
  } else {
    const r = await signInWithPopup(auth, provider);
    if (r.additionalUserInfo?.isNewUser) {
      const userCode = Math.random().toString(36).slice(2, 10).toLowerCase();
      await setDoc(doc(db, 'users', r.user.uid), { email: r.user.email ?? '', userCode });
    }
  }
}

// ── Apple Sign-In ──────────────────────────────────────────────────────
appleBtn.addEventListener('click', async () => {
  if (busy) return;
  clearMsg();
  setBusy(true);
  try {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await signInWith(provider);
  } catch (err) {
    const msg = errMsg(err.code);
    if (msg) showError(msg);
  }
  setBusy(false);
});

// ── Google Sign-In ─────────────────────────────────────────────────────
googleBtn.addEventListener('click', async () => {
  if (busy) return;
  clearMsg();
  setBusy(true);
  try {
    await signInWith(new GoogleAuthProvider());
  } catch (err) {
    const msg = errMsg(err.code);
    if (msg) showError(msg);
  }
  setBusy(false);
});

// ── Auth state ─────────────────────────────────────────────────────────
export function initAuth(onReady) {
  // Обработка возврата после signInWithRedirect (мобильный Safari)
  getRedirectResult(auth).then(async r => {
    if (r?.user && r.additionalUserInfo?.isNewUser) {
      const userCode = Math.random().toString(36).slice(2, 10).toLowerCase();
      await setDoc(doc(db, 'users', r.user.uid), { email: r.user.email ?? '', userCode });
    }
  }).catch(() => {});

  onAuthStateChanged(auth, user => {
    const isGoogle = user?.providerData?.some(p => p.providerId === 'google.com');
    const isApple  = user?.providerData?.some(p => p.providerId === 'apple.com');
    const loggedIn = user && (isGoogle || isApple || user.emailVerified);

    loading.classList.add('hidden');

    if (loggedIn) {
      screen.classList.add('auth-out');
      setTimeout(() => screen.classList.add('hidden'), 340);
      onReady(user);
    } else {
      content.classList.remove('hidden');
    }
  });
}

export function authSignOut() {
  return signOut(auth);
}
