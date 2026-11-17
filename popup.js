import {LinkStore, SETTINGS, normalizedUrl} from './link-core.mjs';
import {
  LANGUAGE_KEY, DEFAULT_LANGUAGE, normalizeLanguage, translate, translateError,
  displayCategory, internalCategory
} from './i18n.mjs';

const $ = id => document.getElementById(id);
const titleInput = $('titleInput');
const urlInput = $('urlInput');
const categoryInput = $('categoryInput');
const addBtn = $('addBtn');
const categoriesContainer = $('categoriesContainer');
const categoryList = $('categoryList');
const editDialog = $('editDialog');
let editingId = null;
let searchTerm = '';
let openCategories = new Set();
let showMessageTimer = null;
let language = DEFAULT_LANGUAGE;
let isInitialized = false;

const t = (key, params) => translate(language, key, params);
const errorText = error => translateError(language, error);
const store = new LinkStore(chrome, render);

function applyLanguage(nextLanguage) {
  language = normalizeLanguage(nextLanguage);
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  $('languageSelect').value = language;
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  }
  for (const node of document.querySelectorAll('[data-i18n-title]')) {
    node.title = t(node.dataset.i18nTitle);
  }
  for (const node of document.querySelectorAll('[data-i18n-aria-label]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  }
  if (isInitialized) render(store.snapshot(), store.status());
}

function message(text, isError = false) {
  const el = $('message');
  el.hidden = false;
  el.classList.toggle('error', isError);
  el.textContent = text;
  clearTimeout(showMessageTimer);
  showMessageTimer = setTimeout(() => { el.hidden = true; }, 6500);
}

function button(text, className, click, ariaLabel = text) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.textContent = text;
  el.setAttribute('aria-label', ariaLabel);
  el.addEventListener('click', click);
  return el;
}

const categoryForUI = category => displayCategory(language, category);
const categoryForStore = category => internalCategory(language, category);

function render(links, status) {
  $('syncToggle').checked = status.enabled;
  const statusEl = $('syncStatus');
  statusEl.classList.toggle('error', Boolean(status.error));
  statusEl.textContent = status.error ? errorText(status.error) : status.busy ? t('syncBusy') :
    !status.enabled ? t('syncOff') :
    status.warning ? t('syncWarning', {count: status.count}) :
    t('syncOn', {count: status.count});
  $('retrySyncBtn').disabled = !status.enabled || status.busy;
  $('totalCount').textContent = t(links.length === 1 ? 'oneLink' : 'manyLinks', {count: links.length});

  const categories = new Map();
  for (const link of links) {
    if (!categories.has(link.category)) categories.set(link.category, []);
    categories.get(link.category).push(link);
  }
  const locale = language === 'fa' ? 'fa' : 'en';
  const sortedCategories = [...categories.keys()].sort((a, b) =>
    categoryForUI(a).localeCompare(categoryForUI(b), locale));
  categoryList.replaceChildren();
  for (const category of sortedCategories) {
    const option = document.createElement('option');
    option.value = categoryForUI(category);
    categoryList.appendChild(option);
  }

  // Remember accordion state while preserving it across language switches.
  for (const details of categoriesContainer.querySelectorAll('details')) {
    if (details.open) openCategories.add(details.dataset.category);
    else openCategories.delete(details.dataset.category);
  }
  categoriesContainer.replaceChildren();
  const needle = searchTerm.toLocaleLowerCase();
  let visible = 0;
  for (const category of sortedCategories) {
    const group = categories.get(category);
    const categoryLabel = categoryForUI(category);
    const found = group.filter(link => [link.title, link.url, link.category, categoryLabel]
      .some(value => value.toLocaleLowerCase().includes(needle)));
    if (!found.length) continue;
    visible += found.length;
    const details = document.createElement('details');
    details.dataset.category = category;
    details.open = needle.length > 0 || openCategories.has(category);
    const summary = document.createElement('summary');
    const catLabel = document.createElement('span');
    catLabel.textContent = `${categoryLabel} (${found.length})`;
    summary.appendChild(catLabel);
    const openAll = button(t('openAll'), 'open-all-btn', event => {
      event.stopPropagation(); event.preventDefault();
      if (found.length > 40) { message(t('tabLimit'), true); return; }
      if (found.length > 15 && !confirm(t('confirmManyTabs', {count: found.length}))) return;
      for (const link of found) chrome.tabs.create({url: link.url, active: false});
    });
    summary.appendChild(openAll);
    details.appendChild(summary);
    const ul = document.createElement('ul'); ul.className = 'links-list';
    for (const link of found) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.url; a.title = link.url; a.textContent = link.title;
      a.className = 'link-title'; a.rel = 'noopener noreferrer'; a.target = '_blank';
      a.addEventListener('click', event => {
        event.preventDefault(); chrome.tabs.create({url: link.url, active: false});
      });
      li.appendChild(a);
      li.appendChild(button(t('edit'), 'small-btn', () => {
        editingId = link.id;
        $('editTitle').value = link.title;
        $('editUrl').value = link.url;
        $('editCategory').value = categoryForUI(link.category);
        editDialog.showModal();
      }, `${t('edit')}: ${link.title}`));
      li.appendChild(button(t('delete'), 'small-btn danger', async () => {
        if (!confirm(t('confirmDelete', {title: link.title}))) return;
        try { await store.remove(link.id); message(t('linkRemoved')); }
        catch (error) { message(errorText(error), true); }
      }, `${t('delete')}: ${link.title}`));
      ul.appendChild(li);
    }
    details.appendChild(ul);
    categoriesContainer.appendChild(details);
  }
  if (!visible) {
    const div = document.createElement('div'); div.className = 'empty';
    div.textContent = links.length ? t('noResults') : t('noLinks');
    categoriesContainer.appendChild(div);
  }
}

$('languageSelect').addEventListener('change', async event => {
  const previous = language;
  const next = normalizeLanguage(event.target.value);
  if (editDialog.open && $('editCategory').value === translate(previous, 'defaultCategory')) {
    $('editCategory').value = translate(next, 'defaultCategory');
  }
  applyLanguage(next);
  try { await chrome.storage.local.set({[LANGUAGE_KEY]: next}); }
  catch (error) { message(errorText(error), true); }
});

$('addForm').addEventListener('submit', async event => {
  event.preventDefault();
  addBtn.disabled = true;
  try {
    await store.add({title:titleInput.value, url:urlInput.value, category:categoryForStore(categoryInput.value)});
    titleInput.value = ''; urlInput.value = ''; categoryInput.value = '';
    message(t('linkSaved'));
  } catch(error) { message(errorText(error), true); }
  finally { addBtn.disabled = false; }
});
$('searchInput').addEventListener('input', event => {
  searchTerm = event.target.value.trim(); render(store.snapshot(), store.status());
});
$('editForm').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await store.edit(editingId, {
      title:$('editTitle').value, url:$('editUrl').value,
      category:categoryForStore($('editCategory').value)
    });
    editDialog.close(); message(t('changesSaved'));
  } catch(error) { message(errorText(error), true); }
});
$('cancelEditBtn').addEventListener('click', () => editDialog.close());
$('syncToggle').addEventListener('change', async event => {
  const enabled = event.target.checked;
  if (enabled && !confirm(t('confirmSync'))) {
    event.target.checked = false; return;
  }
  try {
    await store.toggleSync(enabled);
    message(t(enabled ? 'syncEnabled' : 'syncDisabled'));
  } catch(error) { message(errorText(error), true); }
});
$('retrySyncBtn').addEventListener('click', async () => {
  try { await store.retrySync(); }
  catch(error) { message(errorText(error), true); return; }
  const status = store.status();
  message(status.error ? errorText(status.error) : t('retryDone'), Boolean(status.error));
});
$('exportBtn').addEventListener('click', () => {
  const json = JSON.stringify(store.exportData(), null, 2);
  const blob = new Blob([json], {type:'application/json;charset=utf-8'});
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl; a.download = `araanco-links-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  message(t('backupReady'));
});
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error(t('importTooLarge'));
    const data = JSON.parse(await file.text());
    const result = await store.importData(data);
    message(t('importResult', result));
  } catch(error) { message(t('importFailed', {reason:errorText(error)}), true); }
  event.target.value = '';
});
$('currentTabBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab?.url) throw new Error(t('tabNoUrl'));
    titleInput.value = (tab.title || '').slice(0,150);
    urlInput.value = normalizedUrl(tab.url);
    titleInput.focus();
  } catch(error) { message(t('tabUnavailable', {reason:errorText(error)}), true); }
});
$('themeBtn').addEventListener('click', async () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { await chrome.storage.local.set({[SETTINGS.theme]:next}); }
  catch(error) { message(errorText(error), true); }
});

async function boot() {
  try {
    const prefs = await chrome.storage.local.get([SETTINGS.theme, LANGUAGE_KEY]);
    document.documentElement.dataset.theme = prefs[SETTINGS.theme] ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');
    applyLanguage(prefs[LANGUAGE_KEY] ?? DEFAULT_LANGUAGE);
    await store.init();
    isInitialized = true;
    render(store.snapshot(), store.status());
  } catch(error) {
    message(t('startupFailed', {reason:errorText(error)}), true);
  }
}
boot();
