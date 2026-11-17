/** Localized user-facing copy. English is deliberately the first-run default,
 * independent of Chrome/OS language. Stored link records are locale-neutral. */
export const LANGUAGE_KEY = 'alm_v2_language';
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES = Object.freeze(['en', 'fa']);

export const MESSAGES = Object.freeze({
  en: {
    languageLabel: 'Language',
    subtitle: 'Link management · v1.2',
    themeToggle: 'Toggle light / dark mode',
    newLink: 'New link',
    currentTab: '+ Current tab',
    titlePlaceholder: 'Link title (e.g. Zabbix)',
    categoryPlaceholder: 'Category (optional)',
    addLink: '+ Add link',
    searchPlaceholder: 'Search links and categories…',
    searchLabel: 'Search links and categories',
    backupSync: 'Backup & sync',
    syncToggle: 'Sync with Chrome Sync',
    syncHelp: 'When Chrome Sync is enabled for your Google account, links can sync across installations of this extension with the same ID.',
    retrySync: 'Sync again',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    syncPrivacy: 'Sync is not a backup. Internal or private URLs will also be stored in your Google account’s Chrome Sync data.',
    editLink: 'Edit link',
    editTitle: 'Title',
    editUrl: 'URL',
    editCategory: 'Category',
    cancel: 'Cancel',
    saveChanges: 'Save changes',
    openAll: 'Open all',
    edit: 'Edit',
    delete: 'Delete',
    defaultCategory: 'Other links',
    noResults: 'No links matched your search.',
    noLinks: 'No links saved yet.',
    syncBusy: 'Checking and syncing…',
    syncOff: 'Off · Links are stored only on this device.',
    syncWarning: 'On · {count} cloud records; approaching the Chrome Sync limit.',
    syncOn: 'On · {count} synced records (when Chrome Sync is enabled).',
    oneLink: '{count} link',
    manyLinks: '{count} links',
    confirmManyTabs: 'Open {count} tabs?',
    tabLimit: 'You can open a maximum of 40 tabs at once.',
    confirmDelete: 'Delete “{title}”?',
    linkRemoved: 'Link deleted.',
    linkSaved: 'Link saved.',
    changesSaved: 'Changes saved.',
    confirmSync: 'Links, including internal network addresses, may be uploaded to your Google account’s Chrome Sync storage. Enable sync?',
    syncEnabled: 'Sync enabled. Check the other devices to confirm it works.',
    syncDisabled: 'Sync disabled on this device.',
    retryDone: 'Links checked and merged.',
    backupReady: 'Backup saved. Keep the JSON file somewhere safe.',
    importTooLarge: 'Backup files must be 5 MB or smaller.',
    importResult: '{added} links imported; {skipped} duplicates or invalid entries skipped.',
    importFailed: 'Import failed: {reason}',
    tabNoUrl: 'Cannot access this tab’s URL.',
    tabUnavailable: 'Cannot add current tab: {reason}',
    startupFailed: 'Could not start the extension: {reason}',
    invalidUrl: 'Enter a valid website address.',
    unsupportedUrl: 'This type of URL is not allowed.',
    httpOnly: 'Only HTTP/HTTPS URLs without a username or password are allowed.',
    invalidTitle: 'The title must be between 1 and 150 characters.',
    categoryTooLong: 'The category name is too long.',
    urlTooLong: 'The URL is too long.',
    syncItemTooBig: 'A link exceeds the Chrome Sync item size limit.',
    duplicateUrl: 'This URL is already saved.',
    linkNotFound: 'Link not found.',
    invalidBackup: 'Invalid backup file format.',
    syncFailed: 'Sync failed: {reason}',
    syncReadFailed: 'Could not read synced data: {reason}',
    cloudError: 'cloud storage error',
    unknownError: 'unknown error'
  },
  fa: {
    languageLabel: 'زبان',
    subtitle: 'مدیریت لینک‌ها · نسخه ۱.۲',
    themeToggle: 'تغییر حالت روشن/تاریک',
    newLink: 'لینک جدید',
    currentTab: '+ تب فعلی',
    titlePlaceholder: 'عنوان لینک (مثلاً: Zabbix)',
    categoryPlaceholder: 'دسته‌بندی (اختیاری)',
    addLink: '+ افزودن لینک',
    searchPlaceholder: 'جست‌وجو در لینک‌ها و دسته‌ها...',
    searchLabel: 'جست‌وجو در لینک‌ها و دسته‌ها',
    backupSync: 'پشتیبان‌گیری و همگام‌سازی',
    syncToggle: 'همگام‌سازی با Chrome Sync',
    syncHelp: 'در صورت فعال بودن همگام‌سازی حساب گوگل در Chrome، لینک‌ها بین دستگاه‌های دارای همین افزونه و شناسه مشترک منتقل می‌شوند.',
    retrySync: 'همگام‌سازی مجدد',
    exportJson: 'خروجی JSON',
    importJson: 'ورودی JSON',
    syncPrivacy: 'سینک جایگزین بکاپ نیست. لینک‌های داخلی سازمان نیز در فضای همگام‌سازی حساب گوگل ذخیره خواهند شد.',
    editLink: 'ویرایش لینک',
    editTitle: 'عنوان',
    editUrl: 'آدرس',
    editCategory: 'دسته‌بندی',
    cancel: 'انصراف',
    saveChanges: 'ذخیره تغییرات',
    openAll: 'باز کردن همه',
    edit: 'ویرایش',
    delete: 'حذف',
    defaultCategory: 'سایر لینک‌ها',
    noResults: 'نتیجه‌ای برای جست‌وجوی شما پیدا نشد.',
    noLinks: 'هنوز لینکی ذخیره نشده است.',
    syncBusy: 'در حال بررسی و هماهنگ‌سازی...',
    syncOff: 'خاموش · لینک‌ها فقط روی این دستگاه ذخیره می‌شوند.',
    syncWarning: 'فعال · {count} رکورد ابری؛ نزدیک محدودیت Chrome Sync',
    syncOn: 'فعال · {count} رکورد همگام‌شونده (در صورت فعال بودن Chrome Sync)',
    oneLink: '{count} لینک',
    manyLinks: '{count} لینک',
    confirmManyTabs: 'باز کردن {count} تب؟',
    tabLimit: 'حداکثر ۴۰ تب را می‌توان یک‌باره باز کرد.',
    confirmDelete: 'لینک «{title}» حذف شود؟',
    linkRemoved: 'لینک حذف شد.',
    linkSaved: 'لینک ذخیره شد.',
    changesSaved: 'تغییرات ذخیره شد.',
    confirmSync: 'لینک‌های این افزونه، از جمله آدرس‌های داخلی، ممکن است به فضای Chrome Sync حساب گوگل منتقل شوند. فعال شود؟',
    syncEnabled: 'همگام‌سازی فعال شد؛ وضعیت را در سایر دستگاه‌ها بررسی کن.',
    syncDisabled: 'همگام‌سازی در این دستگاه خاموش شد.',
    retryDone: 'بازخوانی و ادغام اطلاعات انجام شد.',
    backupReady: 'فایل پشتیبان آماده شد. آن را در محل امن نگهداری کن.',
    importTooLarge: 'فایل پشتیبان بیش از ۵ مگابایت است.',
    importResult: '{added} لینک وارد شد؛ {skipped} مورد تکراری یا نامعتبر رد شد.',
    importFailed: 'ورودی ناموفق بود: {reason}',
    tabNoUrl: 'آدرس این تب قابل دریافت نیست.',
    tabUnavailable: 'تب فعلی قابل افزودن نیست: {reason}',
    startupFailed: 'بارگذاری افزونه ناموفق بود: {reason}',
    invalidUrl: 'آدرس سایت معتبر نیست.',
    unsupportedUrl: 'این نوع آدرس مجاز نیست.',
    httpOnly: 'فقط آدرس‌های HTTP/HTTPS بدون نام کاربری و رمز مجازند.',
    invalidTitle: 'عنوان باید بین ۱ تا ۱۵۰ نویسه باشد.',
    categoryTooLong: 'نام دسته‌بندی بیش از حد طولانی است.',
    urlTooLong: 'آدرس بیش از حد طولانی است.',
    syncItemTooBig: 'یکی از لینک‌ها بیش از ظرفیت مجاز همگام‌سازی است.',
    duplicateUrl: 'این آدرس قبلاً ذخیره شده است.',
    linkNotFound: 'لینک موردنظر پیدا نشد.',
    invalidBackup: 'ساختار فایل پشتیبان معتبر نیست.',
    syncFailed: 'همگام‌سازی انجام نشد: {reason}',
    syncReadFailed: 'امکان خواندن داده‌های همگام‌شده نیست: {reason}',
    cloudError: 'خطای فضای ابری',
    unknownError: 'خطای نامشخص'
  }
});

export function normalizeLanguage(candidate) {
  return LANGUAGES.includes(candidate) ? candidate : DEFAULT_LANGUAGE;
}

export function translate(language, key, params = {}) {
  const messages = MESSAGES[normalizeLanguage(language)];
  const template = messages[key] ?? MESSAGES.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, param) =>
    Object.hasOwn(params, param) ? String(params[param]) : match);
}

const ERROR_KEYS = Object.freeze({
  'آدرس سایت معتبر نیست.': 'invalidUrl',
  'این نوع آدرس مجاز نیست.': 'unsupportedUrl',
  'فقط آدرس‌های HTTP/HTTPS بدون نام کاربری و رمز مجازند.': 'httpOnly',
  'عنوان باید بین ۱ تا ۱۵۰ نویسه باشد.': 'invalidTitle',
  'نام دسته‌بندی بیش از حد طولانی است.': 'categoryTooLong',
  'آدرس بیش از حد طولانی است.': 'urlTooLong',
  'یکی از لینک‌ها بیش از ظرفیت مجاز همگام‌سازی است.': 'syncItemTooBig',
  'این آدرس قبلاً ذخیره شده است.': 'duplicateUrl',
  'لینک موردنظر پیدا نشد.': 'linkNotFound',
  'ساختار فایل پشتیبان معتبر نیست.': 'invalidBackup',
  'خطای فضای ابری': 'cloudError',
  'خطای نامشخص': 'unknownError'
});

export function translateError(language, error) {
  const source = String(error?.message ?? error ?? '');
  const key = ERROR_KEYS[source];
  if (key) return translate(language, key);
  for (const [prefix, translationKey] of [
    ['همگام‌سازی انجام نشد: ', 'syncFailed'],
    ['امکان خواندن داده‌های همگام‌شده نیست: ', 'syncReadFailed']
  ]) {
    if (source.startsWith(prefix)) {
      const remaining = source.slice(prefix.length);
      return translate(language, translationKey, { reason: translateError(language, remaining) });
    }
  }
  // Preserve unknown Chrome/browser errors verbatim instead of obscuring diagnostics.
  return source || translate(language, 'unknownError');
}

export const INTERNAL_DEFAULT_CATEGORY = 'سایر لینک‌ها';
export function displayCategory(language, category) {
  return category === INTERNAL_DEFAULT_CATEGORY
    ? translate(language, 'defaultCategory') : category;
}
export function internalCategory(language, category) {
  const candidate = String(category ?? '').trim();
  return candidate === translate(language, 'defaultCategory')
    ? INTERNAL_DEFAULT_CATEGORY : category;
}
