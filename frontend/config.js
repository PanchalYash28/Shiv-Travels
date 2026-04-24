// Global frontend configuration for Shiv Travels.
// This prevents hardcoding http://localhost:4000 in multiple files.
(function () {
  function normalizeOrigin(origin) {
    const o = String(origin || '').trim().replace(/\/+$/, '');
    return o || 'http://localhost:4000';
  }

  // Priority:
  // 1) window.SHIV_API_ORIGIN (developer override in console or injected)
  // 2) localStorage override
  // 3) if served from backend (same origin), use current origin
  // 4) default localhost backend
  const ls = (() => {
    try { return localStorage.getItem('SHIV_API_ORIGIN'); } catch { return null; }
  })();

  const inferred =
    (typeof window !== 'undefined' && window.location && window.location.origin && window.location.protocol !== 'file:')
      ? window.location.origin
      : 'http://localhost:4000';

  const apiOrigin = normalizeOrigin((typeof window !== 'undefined' && window.SHIV_API_ORIGIN) || ls || inferred);

  window.SHIV_CONFIG = {
    apiOrigin,
    apiBase: apiOrigin + '/api',
  };
})();

