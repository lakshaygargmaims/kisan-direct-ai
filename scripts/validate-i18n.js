#!/usr/bin/env node
/**
 * i18n key validation script.
 * Checks that every non-English locale JSON file covers all keys present in en.json.
 * Deeply compares nested objects; reports missing and extra keys.
 *
 * Usage:  node scripts/validate-i18n.js
 * Exit 0 = all clean, exit 1 = gaps found.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'frontend', 'src', 'locales');

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

// Load English as reference
const enRaw = fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8');
const enKeys = flatten(JSON.parse(enRaw));

const localeFiles = fs.readdirSync(LOCALES_DIR)
  .filter(f => f.endsWith('.json') && f !== 'en.json')
  .sort();

let totalMissing = 0;
let totalExtra = 0;

console.log(`\n🔍 i18n validation — ${localeFiles.length} locales, ${Object.keys(enKeys).length} English keys\n`);

for (const file of localeFiles) {
  const locale = file.replace('.json', '');
  const raw = fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8');
  const localeKeys = flatten(JSON.parse(raw));

  const missing = Object.keys(enKeys).filter(k => !(k in localeKeys));
  const extra = Object.keys(localeKeys).filter(k => !(k in enKeys));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ✅ ${locale.padEnd(6)} — complete`);
  } else {
    console.log(`  ⚠️  ${locale.padEnd(6)} — missing: ${missing.length}, extra: ${extra.length}`);
    if (missing.length > 0) {
      totalMissing += missing.length;
      // Show first 5 missing keys
      const shown = missing.slice(0, 5);
      console.log(`       Missing: ${shown.join(', ')}${missing.length > 5 ? ` ... +${missing.length - 5} more` : ''}`);
    }
    if (extra.length > 0) {
      totalExtra += extra.length;
      const shown = extra.slice(0, 5);
      console.log(`       Extra:   ${shown.join(', ')}${extra.length > 5 ? ` ... +${extra.length - 5} more` : ''}`);
    }
  }
}

console.log(`\n📊 Summary: ${totalMissing} missing keys across ${localeFiles.length} locales, ${totalExtra} extra keys\n`);

if (totalMissing > 0) {
  console.log('❌ Some locales are incomplete. Add missing translations to achieve full coverage.\n');
  process.exit(1);
} else {
  console.log('✅ All locales cover every English key.\n');
  process.exit(0);
}
