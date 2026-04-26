const titles = {
  shifts: 'Смены',
  today: 'Сегодня',
  norm: 'Норма',
  stats: 'Статистика',
  thirteen: '13',
  messages: 'Сообщения',
};

const tabs = document.querySelectorAll('.tab[data-target]');
const screens = document.querySelectorAll('.screen[data-screen]');
const topbarTitle = document.getElementById('topbarTitle');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => navigate(tab.dataset.target));
});

function navigate(name) {
  screens.forEach((s) => s.classList.toggle('is-active', s.dataset.screen === name));
  tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.target === name));
  topbarTitle.textContent = titles[name] ?? name;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
