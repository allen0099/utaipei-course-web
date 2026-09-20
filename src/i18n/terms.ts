import { Translate } from "@/i18n/language.tsx";

/**
 * 「第 3 節」→ "Period 3"、「第 A 節」→ "Period A"。
 *
 * 節次標籤存在 DEFAULT_CAMPUS_MAPPINGS 裡（週課表、節次表、ICS 匯出共用），
 * 資料本身維持中文；顯示時才轉。
 */
export const periodLabel = (label: string, t: Translate): string =>
  t(label, label.replace(/^第\s*(\w+)\s*節$/, "Period $1"));

const DAYS_ZH = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];
const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** day 是 0=週一…6=週日，與 WeeklyScheduleCourse.day 相同。 */
export const dayName = (day: number, t: Translate): string =>
  t(DAYS_ZH[day] ?? "", DAYS_EN[day] ?? "");

/** "115 學年度第 1 學期" → "AY 115, Semester 1"（民國學年度照學校的編號保留）。 */
export const semesterName = (displayName: string, t: Translate): string =>
  t(
    displayName,
    displayName.replace(
      /^(\d+)\s*學年度第\s*(\d+)\s*學期$/,
      "AY $1, Semester $2",
    ),
  );

const CAMPUS_EN: Record<string, string> = {
  博愛校區: "Bo'ai Campus",
  天母校區: "Tianmu Campus",
  博愛: "Bo'ai",
  天母: "Tianmu",
};

/** 校區名稱是資料（節次對照表、教室前綴都用它），顯示時才轉。 */
export const campusName = (name: string, t: Translate): string =>
  t(name, CAMPUS_EN[name] ?? name);
