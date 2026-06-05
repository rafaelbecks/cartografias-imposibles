/** Fixed side panel shell for Tweakpane — scrollable content + top-right toggle. */
export function createSidePanel() {
  const panel = document.getElementById("side-panel");
  const scroll = document.getElementById("side-panel-scroll");
  const toggleBtn = document.getElementById("panel-toggle");

  if (!panel || !scroll || !toggleBtn) {
    throw new Error("Side panel markup missing from index.html");
  }

  return { panel, scroll, toggleBtn };
}
