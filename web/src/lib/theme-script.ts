// Inline script string injected into <head> of the root layout.
// Runs synchronously before first paint to set the .dark class and
// color-scheme based on the persisted preference (localStorage.theme)
// or the OS preference. Prevents the light-theme flash on dark-pref users.
export const themeInitScript = `(function(){
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'dark' || stored === 'light' ? stored : 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    var root = document.documentElement;
    if (resolved === 'dark') { root.classList.add('dark'); } else { root.classList.remove('dark'); }
    root.style.colorScheme = resolved;
  } catch (e) {}
})();`;
