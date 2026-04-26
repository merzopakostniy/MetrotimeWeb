// ─── PROFILE DATA ───────────────────────────────────────────────
const PROFILE_KEY = 'metrotime-profile-v1';

const ROLES = [
  { id: 'driver',  label: 'Машинист',            sub: 'Машинист электропоезда локомотивных бригад эксплуатации.', color: '#3ecfff', hasVariant: true  },
  { id: 'tcm',     label: 'Машинист-инструктор', sub: 'Служба эксплуатации',  color: '#f0944a', hasVariant: false },
  { id: 'dde',     label: 'Машинист ДДЭ',        sub: 'Служба эксплуатации',  color: '#f0d040', hasVariant: false },
  { id: 'sec',     label: 'Сотрудник СБ',        sub: 'Служба безопасности',  color: '#9b6bff', hasVariant: false },
  { id: 'station', label: 'Дежурный по станции', sub: 'Служба движения / станции', color: '#4cd98a', hasVariant: true  },
];

function generateUserId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function loadProfile() {
  try {
    const s = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (s?.userId) return s;
  } catch {}
  return {
    role: 'driver', avatarVariant: 'm', experienceDate: '',
    qualificationClass: 'Без класса', isSeniorDriver: false,
    isUnionMember: false, tariffRate: '', bonusPercentage: 0,
    alimonyChildren: 0, tcmSalary: '', userId: generateUserId(),
  };
}

function saveProfile(p) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }

let profile = loadProfile();
let draft   = { ...profile };   // working copy while sheet is open
let roleDraft = { role: draft.role, variant: draft.avatarVariant }; // working copy in role picker

// ─── AVATAR HELPERS ──────────────────────────────────────────────
function avatarSrc(role, variant) {
  const map = {
    driver:  v => `assets/avatars/avatar_driver_${v}.png`,
    tcm:     () => 'assets/avatars/avatar_tcm.png',
    dde:     () => 'assets/avatars/avatar_dde.png',
    sec:     () => 'assets/avatars/avatar_sec.png',
    station: v => `assets/avatars/avatar_station_${v}.png`,
  };
  return (map[role] ?? map.driver)(variant);
}

function renderAvatar(el, role, variant) {
  const r = ROLES.find(x => x.id === role);
  const src = avatarSrc(role, variant);
  el.innerHTML = `<img src="${src}" alt="" onerror="this.parentElement.innerHTML='${r?.icon ?? '👤'}'">`;
}

function tryImg(src, onOk, onFail) {
  const img = new Image();
  img.onload = onOk;
  img.onerror = onFail;
  img.src = src;
}

// ─── EXP ─────────────────────────────────────────────────────────
function formatExp(d) {
  if (!d) return 'Стаж: не указан';
  const s = new Date(d), n = new Date();
  let y = n.getFullYear() - s.getFullYear(), m = n.getMonth() - s.getMonth();
  if (m < 0) { y--; m += 12; }
  return y < 0 ? 'Стаж: не указан' : `Стаж: ${y} г. ${m} мес.`;
}

// ─── DOM REFS ─────────────────────────────────────────────────────
const profileBackdrop  = document.getElementById('profileBackdrop');
const profileSheet     = document.getElementById('profileSheet');
const psMain           = document.getElementById('psMain');
const psRoles          = document.getElementById('psRoles');

const profileClose     = document.getElementById('profileClose');
const profileSave      = document.getElementById('profileSave');
const profileAvatar    = document.getElementById('profileAvatar');
const heroRoleName     = document.getElementById('heroRoleName');
const heroExp          = document.getElementById('heroExp');
const heroUserId       = document.getElementById('heroUserId');
const copyIdBtn        = document.getElementById('copyIdBtn');
const roleNavVal       = document.getElementById('roleNavVal');

const openRolePicker   = document.getElementById('openRolePicker');
const rolePickerBack   = document.getElementById('rolePickerBack');
const rolePickerSave   = document.getElementById('rolePickerSave');
const rolePickerConfirm= document.getElementById('rolePickerConfirm');
const roleGrid         = document.getElementById('roleGrid');
const avatarVariantPicker = document.getElementById('avatarVariantPicker');
const avpCircles       = document.getElementById('avpCircles');

const expDateInput     = document.getElementById('expDateInput');
const qualClassSelect  = document.getElementById('qualClassSelect');
const tariffInput      = document.getElementById('tariffInput');
const tcmSalaryInput   = document.getElementById('tcmSalaryInput');
const tcmSalaryRow     = document.getElementById('tcmSalaryRow');
const tcmDivider       = document.getElementById('tcmDivider');
const seniorRow        = document.getElementById('seniorRow');
const seniorDivider    = document.getElementById('seniorDivider');
const unionRow         = document.getElementById('unionRow');
const bonusMinus       = document.getElementById('bonusMinus');
const bonusPlus        = document.getElementById('bonusPlus');
const bonusDisplay     = document.getElementById('bonusDisplay');
const seniorToggle     = document.getElementById('seniorToggle');
const unionToggle      = document.getElementById('unionToggle');
const alimonySelect    = document.getElementById('alimonySelect');

// ─── OPEN / CLOSE ─────────────────────────────────────────────────
function openProfile() {
  draft = { ...profile };
  fillMain();
  profileBackdrop.classList.remove('hidden');
  profileSheet.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProfile() {
  profileBackdrop.classList.add('hidden');
  profileSheet.classList.add('hidden');
  document.body.style.overflow = '';
  // reset role picker screen
  psRoles.classList.remove('ps-screen--active');
  psMain.classList.remove('ps-screen--left');
}

profileClose.addEventListener('click', closeProfile);
profileBackdrop.addEventListener('click', closeProfile);

// ─── MAIN SCREEN ─────────────────────────────────────────────────
function fillMain() {
  const role = ROLES.find(r => r.id === draft.role) ?? ROLES[0];
  renderAvatar(profileAvatar, draft.role, draft.avatarVariant);
  heroRoleName.textContent = role.label;
  heroExp.textContent = formatExp(draft.experienceDate);
  heroUserId.textContent = draft.userId;
  roleNavVal.textContent = role.label;
  expDateInput.value = draft.experienceDate;
  qualClassSelect.value = draft.qualificationClass;
  tariffInput.value = draft.tariffRate;
  tcmSalaryInput.value = draft.tcmSalary;
  bonusDisplay.textContent = `${draft.bonusPercentage}%`;
  setToggle(seniorToggle, draft.isSeniorDriver);
  setToggle(unionToggle, draft.isUnionMember);
  alimonySelect.value = draft.alimonyChildren;
  updateWorkRows();
}

function updateWorkRows() {
  const isTcm    = draft.role === 'tcm';
  const isDriver = draft.role === 'driver';
  tcmSalaryRow.classList.toggle('hidden', !isTcm);
  tcmDivider.classList.toggle('hidden', !isTcm);
  seniorRow.classList.toggle('hidden', !isDriver);
  seniorDivider.classList.toggle('hidden', !isDriver);
  unionRow.classList.toggle('hidden', !isDriver && !isTcm);
}

// Collapsible sections
document.querySelectorAll('.ps-col-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const col = btn.closest('.ps-collapsible');
    const body = col.querySelector('.ps-col-body');
    const open = col.classList.toggle('is-open');
    body.classList.toggle('hidden', !open);
    // update chevron SVG direction
    const poly = btn.querySelector('polyline');
    if (poly) poly.setAttribute('points', open ? '18 15 12 9 6 15' : '6 9 12 15 18 9');
  });
});

// Save main
profileSave.addEventListener('click', () => {
  draft.tariffRate      = tariffInput.value;
  draft.tcmSalary       = tcmSalaryInput.value;
  draft.qualificationClass = qualClassSelect.value;
  draft.alimonyChildren = Number(alimonySelect.value);
  draft.experienceDate  = expDateInput.value;
  profile = { ...draft };
  saveProfile(profile);
  closeProfile();
  updateTopbarAvatar();
});

// Inputs live
expDateInput.addEventListener('change', () => {
  draft.experienceDate = expDateInput.value;
  heroExp.textContent = formatExp(draft.experienceDate);
});
bonusMinus.addEventListener('click', () => { draft.bonusPercentage = Math.max(0, draft.bonusPercentage - 1); bonusDisplay.textContent = `${draft.bonusPercentage}%`; });
bonusPlus.addEventListener('click',  () => { draft.bonusPercentage = Math.min(100, draft.bonusPercentage + 1); bonusDisplay.textContent = `${draft.bonusPercentage}%`; });
seniorToggle.addEventListener('click', () => { draft.isSeniorDriver = !draft.isSeniorDriver; setToggle(seniorToggle, draft.isSeniorDriver); });
unionToggle.addEventListener('click',  () => { draft.isUnionMember  = !draft.isUnionMember;  setToggle(unionToggle,  draft.isUnionMember);  });

function setToggle(btn, on) {
  btn.dataset.on = on ? 'true' : 'false';
  btn.setAttribute('aria-checked', on ? 'true' : 'false');
}

// Copy ID
copyIdBtn.addEventListener('click', () => {
  navigator.clipboard?.writeText(profile.userId).catch(() => {});
  copyIdBtn.style.color = 'var(--green)';
  setTimeout(() => { copyIdBtn.style.color = ''; }, 1200);
});

// ─── ROLE PICKER SCREEN ───────────────────────────────────────────
function goToRolePicker() {
  roleDraft = { role: draft.role, variant: draft.avatarVariant };
  renderRoleList();
  psMain.classList.add('ps-screen--left');
  psRoles.classList.add('ps-screen--active');
}

function goBackFromRolePicker() {
  psRoles.classList.remove('ps-screen--active');
  psMain.classList.remove('ps-screen--left');
}

openRolePicker.addEventListener('click', goToRolePicker);
rolePickerBack.addEventListener('click', goBackFromRolePicker);

function renderRoleList() {
  roleGrid.innerHTML = ROLES.map(r => {
    const src = r.hasVariant
      ? avatarSrc(r.id, roleDraft.role === r.id ? roleDraft.variant : 'm')
      : avatarSrc(r.id, 'm');
    return `
    <button class="role-card ${roleDraft.role === r.id ? 'is-selected' : ''}" data-role="${r.id}" type="button">
      <div class="role-card-avatar" style="background:${r.color}22;">
        <img src="${src}" alt="" onerror="this.parentElement.innerHTML='👤'">
      </div>
      <div class="role-card-text">
        <div class="role-card-name">${r.label}</div>
        <div class="role-card-sub">${r.sub}</div>
      </div>
      <div class="role-card-check">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <polyline points="2,6 5,9 10,3" stroke="#0d1114" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </button>`;
  }).join('');

  roleGrid.querySelectorAll('.role-card').forEach(btn => {
    btn.addEventListener('click', () => selectRoleInPicker(btn.dataset.role));
  });

  updateVariantPicker();
}

function selectRoleInPicker(roleId) {
  roleDraft.role = roleId;
  const role = ROLES.find(r => r.id === roleId);
  if (!role?.hasVariant) roleDraft.variant = 'm';
  roleGrid.querySelectorAll('.role-card').forEach(btn => {
    btn.classList.toggle('is-selected', btn.dataset.role === roleId);
  });
  updateVariantPicker();
}

function updateVariantPicker() {
  const role = ROLES.find(r => r.id === roleDraft.role);
  if (!role?.hasVariant) {
    avatarVariantPicker.classList.add('hidden');
    return;
  }
  avatarVariantPicker.classList.remove('hidden');

  const variants = [
    { v: 'm', label: 'Мужской' },
    { v: 'f', label: 'Женский' },
  ];
  avpCircles.innerHTML = variants.map(({ v, label }) => {
    const src = avatarSrc(roleDraft.role, v);
    return `
    <button class="avp-circle ${roleDraft.variant === v ? 'is-active' : ''}" data-variant="${v}" type="button">
      <div class="avp-img">
        <img src="${src}" alt="${label}" onerror="this.parentElement.innerHTML='👤'">
      </div>
      <span class="avp-label">${label}</span>
    </button>`;
  }).join('');

  avpCircles.querySelectorAll('.avp-circle').forEach(btn => {
    btn.addEventListener('click', () => {
      roleDraft.variant = btn.dataset.variant;
      avpCircles.querySelectorAll('.avp-circle').forEach(b => b.classList.toggle('is-active', b.dataset.variant === roleDraft.variant));
    });
  });
}

function applyRoleSelection() {
  draft.role = roleDraft.role;
  draft.avatarVariant = roleDraft.variant;
  const role = ROLES.find(r => r.id === draft.role) ?? ROLES[0];
  roleNavVal.textContent = role.label;
  heroRoleName.textContent = role.label;
  renderAvatar(profileAvatar, draft.role, draft.avatarVariant);
  updateWorkRows();
  goBackFromRolePicker();
}

rolePickerSave.addEventListener('click', applyRoleSelection);
rolePickerConfirm.addEventListener('click', applyRoleSelection);

// ─── TOPBAR AVATAR ────────────────────────────────────────────────
function updateTopbarAvatar() {
  const btn = document.querySelector('.btn-icon--profile');
  const src = avatarSrc(profile.role, profile.avatarVariant);
  tryImg(src, () => {
    btn.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }, () => {
    const role = ROLES.find(r => r.id === profile.role);
    btn.style.background = `linear-gradient(145deg,${role?.color ?? '#3ecfff'}cc,${role?.color ?? '#3ecfff'}88)`;
  });
}

// ─── NAVIGATION ───────────────────────────────────────────────────
const SCREEN_TITLES = {
  shifts: 'Смены', today: 'Сегодня', norm: 'Норма',
  stats: 'Статистика', thirteen: '13', messages: 'Сообщения',
};
const tabs = document.querySelectorAll('.tab[data-target]');
const screens = document.querySelectorAll('.screen[data-screen]');
const topbarTitle = document.getElementById('topbarTitle');

tabs.forEach(tab => tab.addEventListener('click', () => navigate(tab.dataset.target)));
function navigate(name) {
  screens.forEach(s => s.classList.toggle('is-active', s.dataset.screen === name));
  tabs.forEach(t => t.classList.toggle('is-active', t.dataset.target === name));
  topbarTitle.textContent = SCREEN_TITLES[name] ?? name;
}

// Profile button
document.querySelector('.btn-icon--profile').addEventListener('click', openProfile);

// ─── INIT ─────────────────────────────────────────────────────────
updateTopbarAvatar();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
