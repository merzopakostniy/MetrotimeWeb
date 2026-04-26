// ─── PROFILE DATA ───────────────────────────────────────────────
const PROFILE_KEY = 'metrotime-profile-v1';

const ROLES = [
  { id: 'driver',  label: 'Машинист',              sub: 'Локомотивные бригады',  icon: '🚇', color: '#3ecfff', hasVariant: true  },
  { id: 'tcm',     label: 'Машинист-инструктор',   sub: 'Служба эксплуатации',   icon: '🔧', color: '#f0944a', hasVariant: false },
  { id: 'dde',     label: 'Машинист ДДЭ',          sub: 'Служба эксплуатации',   icon: '⚡', color: '#f0d040', hasVariant: false },
  { id: 'sec',     label: 'Служба безопасности',   sub: 'СБ',                    icon: '🛡️', color: '#9b6bff', hasVariant: false },
  { id: 'station', label: 'Дежурный по станции',   sub: 'Служба движения',       icon: '🏢', color: '#4cd98a', hasVariant: true  },
];

const QUAL_LABELS = { driver: true, tcm: true, dde: false, sec: false, station: false };

function generateUserId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (saved && saved.userId) return saved;
  } catch {}
  return {
    role: 'driver',
    avatarVariant: 'm',
    experienceDate: '',
    qualificationClass: 'Без класса',
    isSeniorDriver: false,
    isUnionMember: false,
    tariffRate: '',
    bonusPercentage: 0,
    alimonyChildren: 0,
    tcmSalary: '',
    userId: generateUserId(),
  };
}

function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

// Working copy used while sheet is open
let profile = loadProfile();
let draft = { ...profile };

// ─── AVATAR ──────────────────────────────────────────────────────
function avatarSrc(role, variant) {
  const map = {
    driver:  v => `assets/avatars/avatar_driver_${v}.png`,
    tcm:     () => 'assets/avatars/avatar_tcm.png',
    dde:     () => 'assets/avatars/avatar_dde.png',
    sec:     () => 'assets/avatars/avatar_sec.png',
    station: v => `assets/avatars/avatar_station_${v}.png`,
  };
  return (map[role] || map.driver)(variant);
}

function renderAvatar(el, role, variant) {
  const roleData = ROLES.find(r => r.id === role);
  const src = avatarSrc(role, variant);
  const img = new Image();
  img.onload = () => {
    el.innerHTML = `<img src="${src}" alt="${roleData?.label ?? ''}">`;
    el.style.background = '';
  };
  img.onerror = () => {
    // PNG not found yet — show emoji placeholder
    el.innerHTML = `<span>${roleData?.icon ?? '👤'}</span>`;
    el.style.background = `${roleData?.color ?? '#3ecfff'}22`;
    el.style.border = `2px solid ${roleData?.color ?? '#3ecfff'}55`;
  };
  img.src = src;
}

// ─── EXPERIENCE HELPERS ──────────────────────────────────────────
function formatExp(dateStr) {
  if (!dateStr) return 'Стаж: не указан';
  const start = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years < 0) return 'Стаж: не указан';
  return `Стаж: ${years} г. ${months} мес.`;
}

function expBonusPct(dateStr) {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) years--;
  if (years < 1) return 0;
  if (years < 5) return 10;
  if (years < 10) return 15;
  const extra = Math.min(Math.floor((years - 10) / 5), 2);
  return 20 + extra * 5;
}

// ─── PROFILE SHEET UI ────────────────────────────────────────────
const profileBackdrop = document.getElementById('profileBackdrop');
const profileSheet    = document.getElementById('profileSheet');
const profileClose    = document.getElementById('profileClose');
const profileSave     = document.getElementById('profileSave');
const profileAvatar   = document.getElementById('profileAvatar');
const heroRoleName    = document.getElementById('heroRoleName');
const heroExp         = document.getElementById('heroExp');
const heroUserId      = document.getElementById('heroUserId');
const copyIdBtn       = document.getElementById('copyIdBtn');

const roleGrid          = document.getElementById('roleGrid');
const avatarVariantRow  = document.getElementById('avatarVariantRow');
const expDateInput      = document.getElementById('expDateInput');
const qualClassSelect   = document.getElementById('qualClassSelect');
const tariffInput       = document.getElementById('tariffInput');
const tcmSalaryInput    = document.getElementById('tcmSalaryInput');
const tcmSalaryRow      = document.getElementById('tcmSalaryRow');
const tcmDivider        = document.getElementById('tcmDivider');
const seniorRow         = document.getElementById('seniorRow');
const seniorDivider     = document.getElementById('seniorDivider');
const unionRow          = document.getElementById('unionRow');
const bonusMinus        = document.getElementById('bonusMinus');
const bonusPlus         = document.getElementById('bonusPlus');
const bonusDisplay      = document.getElementById('bonusDisplay');
const seniorToggle      = document.getElementById('seniorToggle');
const unionToggle       = document.getElementById('unionToggle');
const alimonySelect     = document.getElementById('alimonySelect');

function openProfile() {
  draft = { ...profile };
  fillSheet();
  profileBackdrop.classList.remove('hidden');
  profileSheet.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  profileBackdrop.classList.add('hidden');
  profileSheet.classList.add('hidden');
  document.body.style.overflow = '';
}

function fillSheet() {
  const role = ROLES.find(r => r.id === draft.role) ?? ROLES[0];

  // Hero
  renderAvatar(profileAvatar, draft.role, draft.avatarVariant);
  heroRoleName.textContent = role.label;
  heroExp.textContent = formatExp(draft.experienceDate);
  heroUserId.textContent = draft.userId;

  // Role grid
  roleGrid.innerHTML = ROLES.map(r => `
    <button class="role-card ${draft.role === r.id ? 'is-selected' : ''}" data-role="${r.id}" type="button">
      <div class="role-card-icon" style="background:${r.color}22;">${r.icon}</div>
      <div class="role-card-name">${r.label}</div>
      <div class="role-card-sub">${r.sub}</div>
    </button>
  `).join('');

  roleGrid.querySelectorAll('.role-card').forEach(btn => {
    btn.addEventListener('click', () => selectRole(btn.dataset.role));
  });

  // Avatar variant row
  updateVariantRow();

  // Exp & qual
  expDateInput.value = draft.experienceDate;
  qualClassSelect.value = draft.qualificationClass;

  // Work fields
  tariffInput.value = draft.tariffRate;
  tcmSalaryInput.value = draft.tcmSalary;
  bonusDisplay.textContent = `${draft.bonusPercentage}%`;
  setToggle(seniorToggle, draft.isSeniorDriver);
  setToggle(unionToggle, draft.isUnionMember);
  alimonySelect.value = draft.alimonyChildren;

  updateRoleSpecificRows();
}

function selectRole(roleId) {
  draft.role = roleId;
  roleGrid.querySelectorAll('.role-card').forEach(btn => {
    btn.classList.toggle('is-selected', btn.dataset.role === roleId);
  });
  const role = ROLES.find(r => r.id === roleId) ?? ROLES[0];
  heroRoleName.textContent = role.label;
  renderAvatar(profileAvatar, draft.role, draft.avatarVariant);
  updateVariantRow();
  updateRoleSpecificRows();
}

function updateVariantRow() {
  const role = ROLES.find(r => r.id === draft.role);
  if (role?.hasVariant) {
    avatarVariantRow.classList.remove('hidden');
    avatarVariantRow.querySelectorAll('.variant-tab').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.variant === draft.avatarVariant);
    });
  } else {
    avatarVariantRow.classList.add('hidden');
  }
}

function updateRoleSpecificRows() {
  const isTcm = draft.role === 'tcm';
  const isDriver = draft.role === 'driver';
  tcmSalaryRow.classList.toggle('hidden', !isTcm);
  tcmDivider.classList.toggle('hidden', !isTcm);
  seniorRow.classList.toggle('hidden', !isDriver);
  seniorDivider.classList.toggle('hidden', !isDriver);
  unionRow.classList.toggle('hidden', !isDriver && draft.role !== 'tcm');
}

function setToggle(btn, on) {
  btn.dataset.on = on ? 'true' : 'false';
  btn.setAttribute('aria-checked', on ? 'true' : 'false');
}

// Variant tabs
avatarVariantRow.addEventListener('click', e => {
  const btn = e.target.closest('.variant-tab');
  if (!btn) return;
  draft.avatarVariant = btn.dataset.variant;
  updateVariantRow();
  renderAvatar(profileAvatar, draft.role, draft.avatarVariant);
});

// Exp date → update hero
expDateInput.addEventListener('change', () => {
  draft.experienceDate = expDateInput.value;
  heroExp.textContent = formatExp(draft.experienceDate);
});

// Bonus stepper
bonusMinus.addEventListener('click', () => {
  draft.bonusPercentage = Math.max(0, draft.bonusPercentage - 1);
  bonusDisplay.textContent = `${draft.bonusPercentage}%`;
});
bonusPlus.addEventListener('click', () => {
  draft.bonusPercentage = Math.min(100, draft.bonusPercentage + 1);
  bonusDisplay.textContent = `${draft.bonusPercentage}%`;
});

// Toggles
seniorToggle.addEventListener('click', () => {
  draft.isSeniorDriver = draft.isSeniorDriver !== true;
  setToggle(seniorToggle, draft.isSeniorDriver);
});
unionToggle.addEventListener('click', () => {
  draft.isUnionMember = draft.isUnionMember !== true;
  setToggle(unionToggle, draft.isUnionMember);
});

// Save
profileSave.addEventListener('click', () => {
  draft.tariffRate     = tariffInput.value;
  draft.tcmSalary      = tcmSalaryInput.value;
  draft.qualificationClass = qualClassSelect.value;
  draft.alimonyChildren    = Number(alimonySelect.value);
  profile = { ...draft };
  saveProfile(profile);
  closeProfile();
  updateTopbarAvatar();
});

// Close
profileClose.addEventListener('click', closeProfile);
profileBackdrop.addEventListener('click', closeProfile);

// Copy ID
copyIdBtn.addEventListener('click', () => {
  navigator.clipboard?.writeText(profile.userId).catch(() => {});
  copyIdBtn.style.color = 'var(--green)';
  setTimeout(() => { copyIdBtn.style.color = ''; }, 1200);
});

// Profile button in topbar opens sheet
document.querySelector('.btn-icon--profile').addEventListener('click', openProfile);

// ─── TOPBAR AVATAR REFLECTION ─────────────────────────────────────
function updateTopbarAvatar() {
  const btn = document.querySelector('.btn-icon--profile');
  const role = ROLES.find(r => r.id === profile.role);
  const src = avatarSrc(profile.role, profile.avatarVariant);
  const img = new Image();
  img.onload = () => {
    btn.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  };
  img.onerror = () => {
    // keep SVG icon, just tint it by role color
    btn.style.background = `linear-gradient(145deg, ${role?.color ?? '#3ecfff'}cc, ${role?.color ?? '#3ecfff'}88)`;
  };
  img.src = src;
}

// ─── NAVIGATION ──────────────────────────────────────────────────
const SCREEN_TITLES = {
  shifts: 'Смены', today: 'Сегодня', norm: 'Норма',
  stats: 'Статистика', thirteen: '13', messages: 'Сообщения',
};

const tabs    = document.querySelectorAll('.tab[data-target]');
const screens = document.querySelectorAll('.screen[data-screen]');
const topbarTitle = document.getElementById('topbarTitle');

tabs.forEach(tab => tab.addEventListener('click', () => navigate(tab.dataset.target)));

function navigate(name) {
  screens.forEach(s => s.classList.toggle('is-active', s.dataset.screen === name));
  tabs.forEach(t => t.classList.toggle('is-active', t.dataset.target === name));
  topbarTitle.textContent = SCREEN_TITLES[name] ?? name;
}

// ─── INIT ─────────────────────────────────────────────────────────
updateTopbarAvatar();

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
