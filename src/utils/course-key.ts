import { PartialCourse } from "@/interfaces/globals.ts";

/**
 * 課程的唯一識別。
 *
 * 選課代碼在一個學年期內唯一（114#1 實測 3514 個代碼零衝突），所以直接用它，
 * 不必再像以前那樣拼 `code-class` —— 那是資料還沒統一、同一門課在不同來源
 * 有不同 class 值時的權宜做法。
 */
export const getCourseKey = (course: { code: string }): string => course.code;

export type SelectedCourseMap = Record<string, PartialCourse>;
