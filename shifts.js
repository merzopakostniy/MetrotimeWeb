import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// ── Локализация ────────────────────────────────────────────────────────────
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS   = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

// ── Парсинг ────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function shiftTitle(s) {
  if (s.isDayOff)               return 'Выходной';
  if (s.isSickLeave)            return 'Больничный';
  if (s.isSickLeaveCare)        return 'Больничный по уходу';
  if (s.isDonorDay)             return 'Донорский день';
  if (s.isVacation)             return 'Отпуск';
  if (s.isMedicalCheckup)       return 'Медкомиссия';
  if (s.isStudyLeave)           return 'Учебный отпуск';
  if (s.isInternalTraining)     return 'Внутреннее обучение';
  if (s.isPsychologicalEvaluation) return 'Псих. обследование';
  return s.name || 'Без названия';
}

function isSpecial(s) {
  return s.isDayOff || s.isSickLeave || s.isSickLeaveCare || s.isDonorDay ||
         s.isVacation || s.isMedicalCheckup || s.isStudyLeave ||
         s.isInternalTraining || s.isPsychologicalEvaluation;
}

function shiftFlags(s) {
  const fl = [];
  if (s.isCoupling)                fl.push({ t: 'Сцеп',         c: '#f5d020', b: 'rgba(245,208,32,.18)' });
  if (s.isReserveShift)            fl.push({ t: 'Резерв',        c: '#b06bff', b: 'rgba(176,107,255,.18)' });
  if (s.isSurfaceReserve)          fl.push({ t: 'Рез.пов.',      c: '#8e6bff', b: 'rgba(142,107,255,.18)' });
  if (s.isFerrying)                fl.push({ t: 'Перегонка',     c: '#f0944a', b: 'rgba(240,148,74,.18)' });
  if (s.isPsychologicalEvaluation) fl.push({ t: 'ПФ',            c: '#ff5555', b: 'rgba(255,85,85,.18)' });
  if (s.isTU)                      fl.push({ t: 'ТУ',            c: '#4cd98a', b: 'rgba(76,217,138,.18)' });
  if (s.isTU152)                   fl.push({ t: 'ТУ-152А',       c: '#4cd98a', b: 'rgba(76,217,138,.18)' });
  if (s.isATZ)                     fl.push({ t: 'АТЗ',           c: '#ff5555', b: 'rgba(255,85,85,.18)' });
  if (s.isMentor)                  fl.push({ t: 'Наставник',     c: '#4cd98a', b: 'rgba(76,217,138,.18)' });
  if (s.isActingSM)                fl.push({ t: 'и.о. СМ',       c: '#4499ff', b: 'rgba(68,153,255,.18)' });
  if (s.isCommission)              fl.push({ t: 'Комиссионный',  c: '#4499ff', b: 'rgba(68,153,255,.18)' });
  if (s.isPrecom)                  fl.push({ t: 'Предком',       c: '#3ecfff', b: 'rgba(62,207,255,.18)' });
  if (s.isBreakIn)                 fl.push({ t: 'Обкатка',       c: '#ff6baa', b: 'rgba(255,107,170,.18)' });
  if (s.isWorkOnDayOff)            fl.push({ t: 'Работа в вых.', c: '#8888ff', b: 'rgba(136,136,255,.18)' });
  if (s.evenOddFlag === 'ЧЕТ')     fl.push({ t: 'Чет',          c: '#4499ff', b: 'rgba(68,153,255,.25)' });
  if (s.evenOddFlag === 'НЕЧ')     fl.push({ t: 'Неч',          c: '#4499ff', b: 'rgba(68,153,255,.25)' });
  return fl;
}

// ── Рендер карточки ────────────────────────────────────────────────────────
function shiftCard(s) {
  const date = new Date(s.date);
  const today = new Date();
  const isToday    = date.toDateString() === today.toDateString();
  const dow        = date.getDay();
  const isWeekend  = dow === 0 || dow === 6;
  const special    = isSpecial(s);
  const flags      = shiftFlags(s);

  let timeHtml = '';
  if (!special) {
    const t1 = fmtTime(s.startTime), t2 = fmtTime(s.endTime);
    const sp = s.startPoint ? ` (${s.startPoint})` : '';
    const ep = s.endPoint   ? ` (${s.endPoint})`   : '';
    timeHtml = `<div class="sr-time">${t1}${sp} — ${t2}${ep}</div>`;
  }

  const flagsHtml = flags.map(f =>
    `<span class="sr-flag" style="color:${f.c};background:${f.b}">${f.t}</span>`
  ).join('');

  const dateClass = [
    'sr-date',
    isWeekend ? 'is-weekend' : '',
    isToday   ? 'is-today'   : '',
  ].filter(Boolean).join(' ');

  return `
  <div class="shift-card${isToday ? ' is-today' : ''}">
    <div class="${dateClass}">
      <span class="sr-day">${date.getDate()}</span>
      <span class="sr-dow">${DAYS[dow]}</span>
    </div>
    <div class="sr-content">
      <div class="sr-top">
        <span class="sr-name">${shiftTitle(s)}</span>
        ${flagsHtml}
      </div>
      ${timeHtml}
    </div>
  </div>`;
}

// ── Рендер списка ──────────────────────────────────────────────────────────
function render(shifts) {
  const el = document.getElementById('shiftsContainer');
  if (!el) return;

  if (!shifts?.length) {
    el.innerHTML = '<p class="placeholder">Смен пока нет.<br>Добавьте первую смену в iOS-приложении.</p>';
    return;
  }

  const sorted = [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date));

  const groups = {};
  sorted.forEach(s => {
    const d = new Date(s.date);
    const key   = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    (groups[key] ??= { label, list: [] }).list.push(s);
  });

  el.innerHTML = Object.keys(groups).sort().map(k => {
    const { label, list } = groups[k];
    return `
    <div class="month-section">
      <div class="month-pill-wrap">
        <span class="month-pill">${label}</span>
      </div>
      ${list.map(shiftCard).join('')}
    </div>`;
  }).join('');

  // Скролл к сегодняшней смене
  const todayEl = el.querySelector('.shift-card.is-today');
  if (todayEl) setTimeout(() => todayEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
}

function loading() {
  const el = document.getElementById('shiftsContainer');
  if (el) el.innerHTML = '<div class="shifts-loading"><div class="auth-spin-large"></div></div>';
}

// ── Public API ─────────────────────────────────────────────────────────────
let unsub = null;

export function initShifts(userId) {
  if (unsub) unsub();
  loading();
  unsub = onSnapshot(
    doc(db, 'users', userId, 'meta', 'shiftsDoc'),
    snap => {
      if (!snap.exists()) { render([]); return; }
      try { render(JSON.parse(snap.data().json || '[]')); }
      catch { render([]); }
    },
    () => render([])
  );
}

export function stopShifts() {
  if (unsub) { unsub(); unsub = null; }
}
