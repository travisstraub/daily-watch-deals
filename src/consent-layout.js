// Presentation only: never reads or changes measurement permissions.
export function installConsentLayout({ window, document }) {
  const panel = document.querySelector('#analytics-consent');
  const content = document.querySelector('#site-content');
  if (!panel || !content) return;
  const root = document.documentElement;
  const mobileBuy = document.querySelector('.mobile-buy');
  let wasVisible = false;
  function measure() {
    const visible = !panel.hidden;
    const gap = visible ? Math.max(0, window.innerHeight - panel.getBoundingClientRect().top) + 12 : 0;
    root.style.setProperty('--consent-offset', `${Math.ceil(gap)}px`);
    const buyHeight = mobileBuy?.getBoundingClientRect().height || 0;
    root.style.setProperty('--shopping-offset', buyHeight ? `${Math.ceil(buyHeight) + 12}px` : '0px');
    // Give the page its own unobscured scroll area while the panel is open.
    // Preserve the reading position when switching back to normal document scroll.
    if (visible !== wasVisible) {
      const top = visible ? window.scrollY : content.scrollTop;
      root.classList.toggle('consent-open', visible);
      if (visible) content.scrollTop = top;
      else window.scrollTo({ top, behavior: 'instant' });
      wasVisible = visible;
    }
  }
  // If layout helpers cannot run, retain the usable in-flow notice.
  if (!window.ResizeObserver || !window.MutationObserver) return;
  panel.classList.add('consent-floating');
  const resize = new window.ResizeObserver(measure);
  resize.observe(panel);
  if (mobileBuy) resize.observe(mobileBuy);
  const mutations = new window.MutationObserver(measure);
  mutations.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  // Before a visitor focuses content, browser scroll keys target the locked body.
  // Route only background keys to the visible page; controls keep native behavior.
  document.addEventListener('keydown', event => {
    if (panel.hidden || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey
      || (event.shiftKey && event.key !== ' ')
      || (event.target !== document.body && event.target !== root)) return;
    const pageStep = Math.max(40, content.clientHeight * 0.875);
    const steps = { ArrowDown: 40, ArrowUp: -40, PageDown: pageStep, PageUp: -pageStep, ' ': event.shiftKey ? -pageStep : pageStep };
    if (Object.hasOwn(steps, event.key)) {
      event.preventDefault();
      content.scrollBy({ top: steps[event.key], behavior: 'auto' });
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      content.scrollTo({ top: event.key === 'Home' ? 0 : content.scrollHeight, behavior: 'auto' });
    }
  });
  window.addEventListener('resize', measure);
  window.visualViewport?.addEventListener('resize', measure);
  measure();
}
