import assert from 'node:assert/strict';
import {
  LANGUAGE_KEY, DEFAULT_LANGUAGE, LANGUAGES, MESSAGES, normalizeLanguage,
  translate, translateError, displayCategory, internalCategory, INTERNAL_DEFAULT_CATEGORY
} from '../i18n.mjs';

assert.equal(LANGUAGE_KEY, 'alm_v2_language');
assert.equal(DEFAULT_LANGUAGE, 'en');
assert.deepEqual(LANGUAGES, ['en','fa']);
assert.equal(normalizeLanguage(undefined), 'en');
assert.equal(normalizeLanguage('fr'), 'en');
assert.equal(normalizeLanguage('fa'), 'fa');
assert.equal(translate('en','newLink'),'New link');
assert.equal(translate('fa','newLink'),'لینک جدید');
assert.equal(translate('en','oneLink',{count:1}),'1 link');
assert.equal(translate('fa','manyLinks',{count:2}),'2 لینک');
assert.equal(translate('en','confirmDelete',{title:'Zabbix'}),'Delete “Zabbix”?');
assert.equal(translateError('en', 'این آدرس قبلاً ذخیره شده است.'), 'This URL is already saved.');
assert.equal(translateError('fa', 'این آدرس قبلاً ذخیره شده است.'), 'این آدرس قبلاً ذخیره شده است.');
assert.equal(translateError('en', 'همگام‌سازی انجام نشد: network error'), 'Sync failed: network error');
assert.equal(translateError('en', 'امکان خواندن داده‌های همگام‌شده نیست: خطای نامشخص'), 'Could not read synced data: unknown error');
assert.equal(translateError('en', 'quota_exceeded'), 'quota_exceeded');
assert.equal(displayCategory('en', INTERNAL_DEFAULT_CATEGORY), 'Other links');
assert.equal(displayCategory('fa', INTERNAL_DEFAULT_CATEGORY), 'سایر لینک‌ها');
assert.equal(displayCategory('en', 'Monitoring'), 'Monitoring');
assert.equal(internalCategory('en', 'Other links'), INTERNAL_DEFAULT_CATEGORY);
assert.equal(internalCategory('fa', 'سایر لینک‌ها'), INTERNAL_DEFAULT_CATEGORY);
assert.equal(internalCategory('en', 'Operations'), 'Operations');
assert.equal(internalCategory('en', ''), '');
const enKeys = Object.keys(MESSAGES.en).sort();
const faKeys = Object.keys(MESSAGES.fa).sort();
assert.deepEqual(faKeys,enKeys,'Both languages must have identical message keys');
for(const lang of LANGUAGES)for(const key of enKeys)assert.ok(MESSAGES[lang][key]);
console.log(`PASS: ${enKeys.length} aligned translation keys, language fallback, RTL labels, validation/sync errors, default category`);
