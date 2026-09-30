// ---- Light / dark theme ----
// Loaded in <head> (before first paint) so the page never flashes the wrong theme.
// No saved choice = follow the phone's setting. Tapping the moon/sun saves an explicit choice.
(function () {
  var KEY = "av_theme", root = document.documentElement, mq = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function effective() { var s = saved(); return s === "dark" || s === "light" ? s : (mq && mq.matches ? "dark" : "light"); }
  var subs = [];
  function apply() {
    var t = effective();
    root.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#232427" : "#FBFAF9");
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
      b.title = t === "dark" ? "Light mode" : "Dark mode";
    });
    subs.forEach(function (f) { try { f(t); } catch (e) {} });
  }
  window.AVTheme = {
    get: effective,
    isDark: function () { return effective() === "dark"; },
    toggle: function () { try { localStorage.setItem(KEY, effective() === "dark" ? "light" : "dark"); } catch (e) {} apply(); },
    onChange: function (f) { subs.push(f); },
    // wire every [data-theme-toggle] button on the page
    bind: function () { document.querySelectorAll("[data-theme-toggle]").forEach(function (b) { b.onclick = window.AVTheme.toggle; }); apply(); }
  };
  if (mq) { var h = function () { if (!saved()) apply(); }; if (mq.addEventListener) mq.addEventListener("change", h); else if (mq.addListener) mq.addListener(h); }
  apply();
})();
// Illustrations are drawn with a gray outline + off-white fill. Re-point those two colors at CSS
// tokens so the drawings stay legible on the dark theme (outline → currentColor, fill → --illus-paper).
function inkSVG() {
  for (var i = 0; i < arguments.length; i++) {
    var o = arguments[i]; if (!o) continue;
    Object.keys(o).forEach(function (k) {
      if (typeof o[k] !== "string") return;
      o[k] = o[k].replace(/(stroke|fill)="#55565A"/gi, '$1="currentColor"').replace(/fill="#FBFAF9"/gi, 'style="fill:var(--illus-paper)"');
    });
  }
}
