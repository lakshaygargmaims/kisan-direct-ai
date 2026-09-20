import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Only eagerly import English (the fallback). All other locales are loaded
// on-demand when the user switches language, splitting them into separate
// chunks so the initial JS payload stays small.
import en from './locales/en.json';

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', dir: 'ltr' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', dir: 'ltr' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', dir: 'ltr' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', dir: 'ltr' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', dir: 'ltr' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', dir: 'ltr' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', dir: 'ltr' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', dir: 'ltr' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', dir: 'ltr' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', dir: 'rtl' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', dir: 'ltr' },
];

// Dynamic locale loader — each import() becomes its own chunk
const localeModules: Record<string, () => Promise<{ default: any }>> = {
  hi: () => import('./locales/hi.json'),
  bn: () => import('./locales/bn.json'),
  te: () => import('./locales/te.json'),
  mr: () => import('./locales/mr.json'),
  ta: () => import('./locales/ta.json'),
  gu: () => import('./locales/gu.json'),
  ur: () => import('./locales/ur.json'),
  kn: () => import('./locales/kn.json'),
  or: () => import('./locales/or.json'),
  ml: () => import('./locales/ml.json'),
  pa: () => import('./locales/pa.json'),
  as: () => import('./locales/as.json'),
  mai: () => import('./locales/mai.json'),
  sat: () => import('./locales/sat.json'),
  ks: () => import('./locales/ks.json'),
  ne: () => import('./locales/ne.json'),
  kok: () => import('./locales/kok.json'),
  mni: () => import('./locales/mni.json'),
  brx: () => import('./locales/brx.json'),
  doi: () => import('./locales/doi.json'),
  sd: () => import('./locales/sd.json'),
  sa: () => import('./locales/sa.json'),
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kisandirect-language',
    },
    // Lazy-load non-English locales on demand
    backend: {
      loadPath: '', // not used — we use the custom loader below
    },
  });

// Custom i18next backend plugin for lazy-loading locale chunks
i18n.on('languageChanged', async (lng: string) => {
  if (lng === 'en') return;
  if (i18n.hasResourceBundle(lng, 'translation')) return;
  const loader = localeModules[lng];
  if (!loader) return;
  try {
    const mod = await loader();
    i18n.addResourceBundle(lng, 'translation', mod.default, true, true);
  } catch {
    // Locale file missing — fallback to English (handled by i18next)
  }
});

// Pre-load the detected language if it's not English
const detected = i18n.language?.split('-')[0];
if (detected && detected !== 'en' && localeModules[detected]) {
  localeModules[detected]().then((mod) => {
    i18n.addResourceBundle(detected, 'translation', mod.default, true, true);
  }).catch(() => {});
}

export default i18n;
