import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import vi from "./languages/vi";
import en from "./languages/en";

const LANGUAGE_KEY = "language";
const dictionaries = { vi, en };

export const LanguageContext = createContext({
  lang: "vi",
  t: (key) => key,
  setLang: () => {},
});

function getValue(obj, path) {
  return path
    .split(".")
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
      obj
    );
}

export const LanguageProvider = ({ initial = "vi", children }) => {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved && dictionaries[saved] ? saved : initial;
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem(LANGUAGE_KEY, l);
  }, []);

  const dict = dictionaries[lang] || dictionaries.vi;

  const t = useCallback(
    (key, fallback) => {
      const val = getValue(dict, key);
      if (val === undefined) return fallback !== undefined ? fallback : key;
      return val;
    },
    [dict]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
