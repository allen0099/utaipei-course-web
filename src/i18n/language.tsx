import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "zh" | "en";

const STORAGE_KEY = "lang";

/**
 * 沒有存過偏好時看瀏覽器：介面語言不是中文的人（交換生、外籍生）第一次進來就是
 * 英文，不必先在一個看不懂的介面裡找到切換鈕。
 */
const detectLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === "zh" || stored === "en") return stored;
  } catch {
    // fall through to the browser's language
  }

  return typeof navigator !== "undefined" &&
    !navigator.language.toLowerCase().startsWith("zh")
    ? "en"
    : "zh";
};

/** `t("課程查詢", "Course search")` — 回傳目前語言的那一個。 */
export type Translate = (zh: string, en: string) => string;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * 介面語言。
 *
 * 翻譯是就地成對寫的 —— `t("課程查詢", "Course search")` —— 而不是 key 加字典檔：
 * - 看原始碼就知道畫面上是什麼字，不必在兩個檔案之間對 key；
 * - 可以一個元件一個元件地採用，還沒改的字串就是維持中文，不會出現漏掉 key
 *   時畫面上印出 `search.title` 那種事；
 * - 這個站只有兩種語言，也不打算有第三種，字典檔買到的彈性用不上。
 *
 * **只翻介面，不翻資料。** 教師姓名、教室、系所、公告、行事曆事件都來自學校，
 * 只有中文；課程名稱有英文 (nameEn) 時英文介面會優先顯示它。
 */
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  // 螢幕閱讀器與瀏覽器的翻譯提示都看 <html lang>。
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-TW";
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 存不了就只在這次造訪生效。
    }
  }, []);

  const t = useCallback<Translate>(
    (zh, en) => (language === "en" ? en : zh),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
};

/** 只需要 `t` 的元件用這個。 */
export const useT = (): Translate => useLanguage().t;
