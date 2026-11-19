/** Tiny accessible two-page navigation; no Chrome permissions or storage required. */
export function initializeTabs(tablist) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  if (tabs.length < 2) throw new Error('At least two tabs are required.');
  const doc = tablist.ownerDocument;

  function activate(target, focus = false) {
    if (!tabs.includes(target)) throw new Error('Unknown tab.');
    for (const tab of tabs) {
      const panel = doc.getElementById(tab.getAttribute('aria-controls'));
      if (!panel) throw new Error(`Missing tab panel for ${tab.id}`);
      const selected = tab === target;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
    }
    if (focus) target.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      const rtl = doc.documentElement.dir === 'rtl';
      let targetIndex;
      switch (event.key) {
        case 'ArrowRight': targetIndex = (index + (rtl ? -1 : 1) + tabs.length) % tabs.length; break;
        case 'ArrowLeft': targetIndex = (index + (rtl ? 1 : -1) + tabs.length) % tabs.length; break;
        case 'Home': targetIndex = 0; break;
        case 'End': targetIndex = tabs.length - 1; break;
        default: return;
      }
      event.preventDefault();
      activate(tabs[targetIndex], true);
    });
  });
  activate(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  return {activate};
}
