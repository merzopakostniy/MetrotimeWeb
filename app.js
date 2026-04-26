const defaultShifts = [
  {
    date: "2026-04-26",
    name: "Смена 2 линия",
    start: "08:00",
    end: "20:00",
    startPoint: "ТЧ-4",
    endPoint: "Новокосино",
    earnings: 8900,
    tags: ["Наставник", "ТУ", "Чет"],
  },
  {
    date: "2026-04-28",
    name: "Резерв",
    start: "07:30",
    end: "19:30",
    startPoint: "Печатники",
    endPoint: "Печатники",
    earnings: 7200,
    tags: ["Резерв"],
  },
  {
    date: "2026-04-30",
    name: "Ночная смена",
    start: "20:00",
    end: "08:00",
    startPoint: "Сокол",
    endPoint: "Планерная",
    earnings: 10400,
    tags: ["Ночь", "Неч"],
  },
];

const titles = {
  today: "Сегодня",
  shifts: "Смены",
  norm: "Норма",
  stats: "Статистика",
  premium: "Premium",
};

const storageKey = "metrotime-web-shifts-v1";
const shifts = loadShifts();

const navButtons = document.querySelectorAll("[data-target]");
const screens = document.querySelectorAll("[data-screen]");
const screenTitle = document.querySelector("#screenTitle");
const shiftList = document.querySelector("#shiftList");
const upcomingList = document.querySelector("#upcomingList");
const dialog = document.querySelector("#addShiftDialog");
const form = document.querySelector("#shiftForm");

document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => activateScreen(button.dataset.jump));
});

document.querySelectorAll("[data-open-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const dateInput = form.elements.date;
    dateInput.value = new Date().toISOString().slice(0, 10);
    dialog.showModal();
  });
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => activateScreen(button.dataset.target));
});

form.addEventListener("submit", (event) => {
  if (event.submitter?.value !== "save") return;
  event.preventDefault();

  const data = new FormData(form);
  shifts.push({
    date: data.get("date"),
    name: data.get("name") || "Смена",
    start: data.get("start"),
    end: data.get("end"),
    startPoint: "ЛП",
    endPoint: "ЛП",
    earnings: Number(data.get("earnings")) || 0,
    tags: ["Новая"],
  });

  shifts.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(storageKey, JSON.stringify(shifts));
  renderShifts();
  dialog.close();
  activateScreen("shifts");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

renderShifts();

function activateScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.target === name);
  });
  screenTitle.textContent = titles[name] || "МетроТайм";
}

function loadShifts() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    return Array.isArray(saved) ? saved : [...defaultShifts];
  } catch {
    return [...defaultShifts];
  }
}

function renderShifts() {
  shiftList.innerHTML = shifts.map(renderShift).join("");
  upcomingList.innerHTML = shifts.slice(1, 4).map(renderShift).join("");
}

function renderShift(shift) {
  const date = parseDate(shift.date);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date);
  const day = new Intl.DateTimeFormat("ru-RU", { day: "2-digit" }).format(date);
  const money = new Intl.NumberFormat("ru-RU").format(shift.earnings || 0);

  return `
    <article class="shift-item">
      <div class="date-chip">
        <div>
          <strong>${day}</strong>
          <span>${weekday}</span>
        </div>
      </div>
      <div class="shift-main">
        <h3>${escapeHtml(shift.name)}</h3>
        <p>${shift.start}-${shift.end} · ${escapeHtml(shift.startPoint)} → ${escapeHtml(shift.endPoint)}</p>
        <div class="shift-tags">
          ${(shift.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
      <strong class="money">${money} ₽</strong>
    </article>
  `;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
