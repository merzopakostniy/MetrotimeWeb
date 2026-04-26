// Navigation
const tabs = document.querySelectorAll(".tab[data-target]");
const screens = document.querySelectorAll(".screen[data-screen]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => navigate(tab.dataset.target));
});

function navigate(name) {
  screens.forEach((s) => s.classList.toggle("is-active", s.dataset.screen === name));
  tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.target === name));
}

// Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
