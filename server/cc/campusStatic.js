/**
 * Serve Campus Connect SBB pages and static assets.
 * // CC: new file
 */

const path = require('path');
const express = require('express');

const campusRoot = path.resolve(__dirname, '..', '..', 'campus');

const noCache = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

const CAMPUS_HTML_ROUTES = [
  { path: '/', file: 'index.html' },
  { path: '/seller', file: 'seller.html' },
  // Deep-link shells (History API arrives in M3; for now same HTML)
  { path: '/l/:listingId', file: 'index.html' },
  { path: '/s/:storeId', file: 'index.html' },
  { path: '/orders/:id', file: 'index.html' },
];

/**
 * Mount campus HTML routes and /campus/* static files on an Express app.
 * Must be registered before the React SSR catch-all.
 */
const mountCampus = app => {
  CAMPUS_HTML_ROUTES.forEach(route => {
    app.get(route.path, (req, res) => {
      res.set(noCache);
      res.sendFile(path.join(campusRoot, route.file));
    });
  });

  app.use(
    '/campus',
    express.static(campusRoot, {
      index: false,
      setHeaders: (res, filePath) => {
        if (/\.(html)$/i.test(filePath)) {
          res.set(noCache);
          return;
        }
        // Fingerprinting lands with build-campus.js; until then use a short cache.
        res.setHeader('Cache-Control', 'public, max-age=3600');
      },
    })
  );
};

module.exports = {
  mountCampus,
  campusRoot,
};
