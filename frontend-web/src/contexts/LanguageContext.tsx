import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Lang, type Translations } from '../i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang | null) ?? 'es'
  );

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
