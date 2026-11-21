/**
 * History API routing for Campus Connect shells.
 * // CC: new file (M3) — E2E deep links / refresh
 */

const ROUTES = [
  { pattern: /^\/l\/([^/]+)\/?$/, view: 'listing', param: 'selectedListingId' },
  { pattern: /^\/s\/([^/]+)\/?$/, view: 'store', param: 'selectedStoreId' },
  { pattern: /^\/orders\/([^/]+)\/?$/, view: 'order', param: 'selectedOrderId' },
  { pattern: /^\/seller\/?$/, seller: true },
  { pattern: /^\/?$/, view: 'home' },
];

function pathForState() {
  if (IS_SELLER) {
    if (state.seller?.selectedOrderId) return `/orders/${state.seller.selectedOrderId}`;
    return '/seller';
  }
  if (state.view === 'listing' && state.selectedListingId) return `/l/${state.selectedListingId}`;
  if (state.view === 'store' && state.selectedStoreId) return `/s/${state.selectedStoreId}`;
  if (state.view === 'order' && state.selectedOrderId) return `/orders/${state.selectedOrderId}`;
  if (state.view && state.view !== 'home') return `/?view=${encodeURIComponent(state.view)}`;
  return '/';
}

function applyPath(pathname, search = '') {
  const path = pathname || '/';
  const params = new URLSearchParams(search);

  if (IS_SELLER) {
    if (path.startsWith('/orders/')) {
      const id = path.split('/')[2];
      state.seller = state.seller || {};
      state.seller.selectedOrderId = id;
      state.view = 'seller-order';
      return;
    }
    if (params.get('view')) state.view = params.get('view');
    return;
  }

  for (const route of ROUTES) {
    if (route.seller) continue;
    const match = path.match(route.pattern);
    if (!match) continue;
    if (route.param && match[1]) state[route.param] = decodeURIComponent(match[1]);
    if (route.view) state.view = route.view;
    return;
  }

  const view = params.get('view');
  if (view && VIEWS[view]) state.view = view;
}

function pushRoute(replace = false) {
  const url = pathForState();
  const method = replace ? 'replaceState' : 'pushState';
  if (`${location.pathname}${location.search}` === url) return;
  history[method]({ view: state.view }, '', url);
}

function bindRouter() {
  applyPath(location.pathname, location.search);

  const originalSetView = window.setView;
  window.setView = function setViewRouted(view, extra = {}) {
    originalSetView(view, extra);
    pushRoute();
  };

  window.addEventListener('popstate', () => {
    applyPath(location.pathname, location.search);
    render();
  });
}
