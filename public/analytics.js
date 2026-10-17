// Provider-independent event seam. An outbound click is never a purchase or sale.
export const placements = Object.freeze([
  'catalog_card', 'related_card', 'product_primary', 'product_details',
  'product_mobile', 'comparison_pick', 'comparison_final',
  'instagram_landing',
]);

// Values, not just parameter names, must be reviewed. This draft campaign is NOT live.
const campaignValues = Object.freeze({
  utm_source: ['google'],
  utm_medium: ['cpc'],
  utm_campaign: ['first50'],
  utm_content: ['comparison'],
});

export function campaignDimensions(search = '') {
  const params = new URLSearchParams(search);
  const dimensions = {};
  for (const [key, allowed] of Object.entries(campaignValues)) {
    const values = params.getAll(key);
    if (values.length === 1 && allowed.includes(values[0])) dimensions[key] = values[0];
  }
  return dimensions;
}

export function outboundEvent(anchor, { catalog, pages, page, search = '' }) {
  if (!anchor || !pages.includes(page)) return null;
  const { amazonModel, placement } = anchor.dataset;
  if (!Object.hasOwn(catalog, amazonModel) || !placements.includes(placement)) return null;
  const watch = catalog[amazonModel];
  // Reject altered destinations, external hosts and tags rather than collecting URLs.
  if (anchor.href !== watch.destination) return null;
  return Object.freeze({
    event: 'outbound_amazon_click',
    model: watch.model,
    page,
    placement,
    destination_type: watch.destination_type,
    ...campaignDimensions(search),
  });
}

const installed = new WeakMap();
export function installOutboundTracking({
  document, location, catalog, pages, enabled = false, send,
}) {
  // The disabled path does not read location/campaigns or attach listeners.
  if (enabled !== true || typeof send !== 'function') return () => {};
  if (installed.has(document)) return installed.get(document);
  const onActivation = event => {
    if (event.defaultPrevented || event.isTrusted === false) return;
    if (event.type === 'click' ? event.button !== 0 : event.button !== 1) return;
    try {
      const target = event.target?.closest ? event.target : event.target?.parentElement;
      const anchor = target?.closest('a[data-amazon-model]');
      const payload = outboundEvent(anchor, {
        catalog, pages, page: document.body.dataset.page, search: location.search,
      });
      // No preventDefault, redirect, timeout, retry, or navigation delay.
      // Every intentional activation is a click, including repeated activations.
      if (payload) Promise.resolve(send(payload)).catch(() => {});
    } catch {
      // A broken adapter or malformed element must never break ordinary links.
    }
  };
  document.addEventListener('click', onActivation, { passive: true });
  document.addEventListener('auxclick', onActivation, { passive: true });
  const cleanup = () => {
    document.removeEventListener('click', onActivation);
    document.removeEventListener('auxclick', onActivation);
    installed.delete(document);
  };
  installed.set(document, cleanup);
  return cleanup;
}
