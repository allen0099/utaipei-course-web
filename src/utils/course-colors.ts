/**
 * 使用者替個別課程指定的顏色：選課代碼 → COURSE_COLORS 的索引。
 *
 * 這是個人顯示偏好，跟課表內容分開存，也刻意不放進 /share 的 payload —— 對方
 * 要看到的是課，不是我把體育課塗成什麼顏色；而且 payload 每多一個欄位，所有
 * 連結都會變長。
 */
const STORAGE_KEY = "my-schedule-course-colors";

export type CourseColorOverrides = Record<string, number>;

export const loadCourseColors = (): CourseColorOverrides => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => Number.isInteger(value) && (value as number) >= 0,
      ),
    ) as CourseColorOverrides;
  } catch {
    return {};
  }
};

export const saveCourseColors = (overrides: CourseColorOverrides): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // 存不了就只在這次造訪生效。
  }
};
