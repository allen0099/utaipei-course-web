import { PartialCourse } from "@/interfaces/globals.ts";

/**
 * 是否為「他班開課」。
 *
 * 學校把共用課程（例如體育）也掛在班級課表底下 —— 選課代碼相同，但實際開課
 * 班級不是這班。班級課表會在課名旁標示，一鍵加入我的課表時也要排除，兩邊的
 * 判定得是同一份，不然日後只改一邊就會對不起來。
 *
 * classCode 缺值（索引檔 extraCourses 那種只有五欄的殘缺資料）一律當本班，
 * 與標示的行為一致：沒標就不排除。
 */
export const isOtherClassCourse = (
  course: PartialCourse,
  viewingClassCode?: string,
): boolean =>
  !!viewingClassCode &&
  !!course.classCode &&
  course.classCode !== viewingClassCode;
