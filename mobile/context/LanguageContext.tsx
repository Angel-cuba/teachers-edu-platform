import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type Lang, type Translations } from '../lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    AsyncStorage.getItem('lang').then((saved) => {
      if (saved === 'en' || saved === 'es') setLangState(saved);
    });
  }, []);

  const setLang = (l: Lang) => {
    AsyncStorage.setItem('lang', l);
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
