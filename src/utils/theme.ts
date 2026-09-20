/**
 * 主題偏好。`system` 不寫進 localStorage —— 沒有那個 key 就是跟隨系統，這也是
 * index.html 開機腳本一直以來的判斷方式，兩邊不必另外對一份格式。
 */
export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export const readThemePreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
};

export const systemPrefersDark = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(DARK_QUERY).matches;

export const resolveIsDark = (preference: ThemePreference): boolean =>
  preference === "system" ? systemPrefersDark() : preference === "dark";

/**
 * 套用到 <html> 與瀏覽器的 theme-color。
 *
 * index.html 的兩個 theme-color meta 是照 `prefers-color-scheme` 分的，所以
 * 使用者手動選了跟系統相反的主題時，手機狀態列會停在系統那個顏色 —— 深色頁面
 * 頂著一條白色狀態列。兩個 meta 一起改成實際生效的顏色，不管哪一個的 media
 * 命中都是對的。
 */
export const applyTheme = (preference: ThemePreference): void => {
  const isDark = resolveIsDark(preference);

  document.documentElement.classList.toggle("dark", isDark);
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) =>
      meta.setAttribute("content", isDark ? "#000000" : "#ffffff"),
    );
};

export const saveThemePreference = (preference: ThemePreference): void => {
  try {
    if (preference === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // 存不了就只在這次造訪生效。
  }
};

/** 系統主題改變時通知；回傳取消訂閱的函式。 */
export const onSystemThemeChange = (listener: () => void): (() => void) => {
  if (typeof window.matchMedia !== "function") return () => {};

  const query = window.matchMedia(DARK_QUERY);

  query.addEventListener("change", listener);

  return () => query.removeEventListener("change", listener);
};
