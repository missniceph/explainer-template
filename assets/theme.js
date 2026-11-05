/* Runs before the page is drawn so there is no flash of the wrong theme.
 * Only the light/dark choice is remembered (in this browser). Nothing else. */
(function () {
  try {
    var saved = localStorage.getItem("explainer-theme");
    if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
  } catch (e) { /* storage blocked: follow the device setting */ }
})();
