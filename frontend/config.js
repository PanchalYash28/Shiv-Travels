// // Global frontend configuration for Shiv Travels.
// // This prevents hardcoding http://localhost:4000 in multiple files.
// (function () {
//   function normalizeOrigin(origin) {
//     const o = String(origin || '').trim().replace(/\/+$/, '');
//     return o || 'http://localhost:4000';
//   }

//   // Priority:
//   // 1) window.SHIV_API_ORIGIN (developer override in console or injected)
//   // 2) localStorage override
//   // 3) if served from backend (same origin), use current origin
//   // 4) default localhost backend
//   const ls = (() => {
//     try { return localStorage.getItem('SHIV_API_ORIGIN'); } catch { return null; }
//   })();

//   const inferred =
//     (typeof window !== 'undefined' && window.location && window.location.origin && window.location.protocol !== 'file:')
//       ? window.location.origin
//       : 'http://localhost:4000';

//   const apiOrigin = normalizeOrigin((typeof window !== 'undefined' && window.SHIV_API_ORIGIN) || ls || inferred);

//   window.SHIV_CONFIG = {
//     apiOrigin,
//     apiBase: apiOrigin + '/api',
//   };
// })();

// Global frontend configuration for Shiv Travels.
(function () {
  function normalizeOrigin(origin) {
    const o = String(origin || '').trim().replace(/\/+$/, '');
    return o || 'https://shiv-travels-api.onrender.com';
  }

  const ls = (() => {
    try { return localStorage.getItem('SHIV_API_ORIGIN'); } catch { return null; }
  })();

  const apiOrigin =
    normalizeOrigin(
      (typeof window !== 'undefined' && window.SHIV_API_ORIGIN) ||
      ls ||
      'https://shiv-travels-api.onrender.com'
    );

  window.SHIV_CONFIG = {
    apiOrigin,
    apiBase: apiOrigin + '/api',
  };
})();



// Global frontend configuration for Shiv Travels.
// (function () {
//   function normalizeOrigin(origin) {
//     return String(origin || "").trim().replace(/\/+$/, "");
//   }

//   const isLocalhost =
//     window.location.hostname === "localhost" ||
//     window.location.hostname === "127.0.0.1";

//   const localAPI = "http://localhost:4000";
//   const liveAPI = "https://shiv-travels-api.onrender.com";

//   const apiOrigin = isLocalhost ? localAPI : liveAPI;

//   window.SHIV_CONFIG = {
//     apiOrigin,
//     apiBase: apiOrigin + "/api",
//   };
// })();