/** Open via top-right icon; close on outside click or Ctrl+I (Cmd+I on macOS). */
export function setupPaneToggle({ panel, toggleBtn }) {
  let visible = false;

  function setVisible(show) {
    visible = show;
    panel.classList.toggle("hidden", !show);
    toggleBtn?.setAttribute("aria-expanded", String(show));
  }

  function toggle() {
    setVisible(!visible);
  }

  toggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!visible) setVisible(true);
  });

  panel.addEventListener("click", (e) => e.stopPropagation());

  document.addEventListener("click", () => {
    if (visible) setVisible(false);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "i" && e.key !== "I") return;
    if (!e.ctrlKey && !e.metaKey) return;
    if (e.altKey || e.shiftKey) return;

    e.preventDefault();
    toggle();
  });

  setVisible(false);

  return { setVisible, toggle, isVisible: () => visible };
}
