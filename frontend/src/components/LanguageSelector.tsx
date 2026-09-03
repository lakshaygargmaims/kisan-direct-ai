import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { languages } from '../i18n';

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentLang = languages.find((l) => i18n.language?.startsWith(l.code)) || languages[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    const lang = languages.find((l) => l.code === code);
    if (lang) {
      document.documentElement.dir = lang.dir;
      document.documentElement.lang = code;
    }
    localStorage.setItem('kisandirect-language', code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label={t('language.change')}
      >
        <Globe className="h-4 w-4 text-green-600" />
        <span className="hidden sm:inline font-medium">{currentLang.nativeName}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[400px] overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">{t('language.select')}</p>
            </div>
            <div className="p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    i18n.language?.startsWith(lang.code)
                      ? 'bg-green-50 text-green-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-base font-medium min-w-[80px]">{lang.nativeName}</span>
                  <span className="text-sm text-gray-500">{lang.name}</span>
                  {lang.dir === 'rtl' && (
                    <span className="text-xs text-gray-400 ml-auto">RTL</span>
                  )}
                  {i18n.language?.startsWith(lang.code) && (
                    <Check className="h-4 w-4 text-green-600 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
