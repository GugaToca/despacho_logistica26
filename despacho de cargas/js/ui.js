// js/ui.js
export function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

export function pad4(n) {
  const s = String(n ?? "");
  return s.padStart(4, "0");
}
