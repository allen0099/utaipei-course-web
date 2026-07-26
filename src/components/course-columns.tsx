import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/react";

import { DataTableColumn } from "@/components/data-table.tsx";
import { PartialCourse } from "@/interfaces/globals.ts";

export type CourseColumnKey =
  | "code"
  | "name"
  | "class"
  | "group"
  | "credits"
  | "required"
  | "category"
  | "department"
  | "teacher"
  | "time"
  | "classroom"
  | "capacity"
  | "conflict";

export interface CourseColumnOptions {
  /** 課程代碼 → 與它衝堂的課名。只有「我的課表」與分享頁需要。 */
  conflictNamesByCourseCode?: Map<string, Set<string>>;
  /**
   * 正在檢視的班級代碼。課程的開課班級不是它時標「他班開課」——例如資科系一的
   * 體育課其實掛在 19071411 底下，不標的話使用者會以為課表跑錯班級。
   */
  viewingClassCode?: string;
}

/** 缺值一律顯示「—」，不要用空字串假裝這門課沒有這個屬性。 */
const orDash = (value: string | undefined) => value || "—";

/**
 * 課程欄位的單一定義處。
 *
 * 課程查詢、我的課表、分享頁與三個課表頁以前各自寫一份欄位陣列，同一個欄位在
 * 不同頁的標題、寬度與缺值處理都不一樣。現在共用這張表，各頁只挑要哪幾欄。
 */
export const buildCourseColumns = <T extends PartialCourse>(
  keys: CourseColumnKey[],
  options: CourseColumnOptions = {},
): DataTableColumn<T>[] => {
  const { conflictNamesByCourseCode, viewingClassCode } = options;

  const all: Record<CourseColumnKey, DataTableColumn<T>> = {
    code: {
      key: "code",
      label: "選課代碼",
      headerLabel: "代碼",
      width: "w-[9%]",
      cellClassName: "tabular-nums text-muted",
      hideOnCard: true,
    },
    name: {
      key: "name",
      label: "科目",
      width: "w-[20%]",
      cellClassName: "font-medium text-foreground",
      // 手機卡片改用 cardTitle 呈現，見各頁的 DataTable 設定。
      hideOnCard: true,
      render: (course) => (
        <span className="flex flex-col gap-1">
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {/* 英文課名放 title，滑過才看得到，不佔版面 */}
            <span title={course.nameEn || undefined}>{course.name}</span>
            {viewingClassCode &&
              course.classCode &&
              course.classCode !== viewingClassCode && (
                <Chip size="sm" variant="soft">
                  他班開課
                </Chip>
              )}
          </span>
          {course.note && (
            <span className="text-xs text-muted">{course.note}</span>
          )}
        </span>
      ),
    },
    class: {
      key: "class",
      label: "班級名稱",
      headerLabel: "班級",
      width: "w-[12%]",
      render: (course) =>
        course.mixedClass
          ? `${orDash(course.class)}（合 ${course.mixedClass}）`
          : orDash(course.class),
    },
    group: {
      key: "group",
      label: "分組",
      width: "w-[7%]",
      cellClassName: "tabular-nums",
      render: (course) => orDash(course.group),
    },
    credits: {
      key: "credits",
      label: "學分",
      width: "w-[7%]",
      cellClassName: "tabular-nums",
      render: (course) => orDash(course.credits),
    },
    required: {
      key: "required",
      label: "必選修",
      width: "w-[10%]",
      // 開課別絕大多數是「學期」，每列都印只會讓這欄換行，只在「學年」等其他
      // 值時才標出來。
      render: (course) =>
        orDash(
          [
            course.required,
            course.courseType && course.courseType !== "學期"
              ? course.courseType
              : "",
          ]
            .filter(Boolean)
            .join("・"),
        ),
    },
    category: {
      key: "category",
      label: "領域類",
      width: "w-[11%]",
      // 限制性別絕大多數是「不限」，只有實際有限制時才值得佔版面。
      render: (course) =>
        orDash(
          [
            course.category,
            course.genderLimit && course.genderLimit !== "不限"
              ? course.genderLimit
              : "",
          ]
            .filter(Boolean)
            .join("・"),
        ),
    },
    department: {
      key: "department",
      label: "開課系所",
      headerLabel: "系所",
      width: "w-[14%]",
      cellClassName: "text-muted",
      // 共同課（體育、通識）會關聯到十幾個系所，全部列出來會把整欄撐成一直條。
      // 只列前兩個，其餘收成數量，完整清單放 title。
      render: (course) => {
        const names = course.departments;

        if (!names || names.length === 0) return "—";

        return (
          <span title={names.join("、")}>
            {names.slice(0, 2).join("、")}
            {names.length > 2 && ` 等 ${names.length} 系所`}
          </span>
        );
      },
    },
    teacher: {
      key: "teacher",
      label: "教師",
      width: "w-[11%]",
      render: (course) => orDash(course.teacher),
    },
    time: {
      key: "time",
      label: "時間",
      width: "w-[11%]",
      cellClassName: "tabular-nums text-foreground/80",
      render: (course) => orDash(course.time),
    },
    classroom: {
      // 教室已含校區前綴（「博愛 G313」），所以不另開校區欄。
      key: "classroom",
      label: "教室",
      width: "w-[13%]",
      render: (course) => orDash(course.classroom),
    },
    capacity: {
      key: "capacity",
      label: "人數上限",
      headerLabel: "上限",
      width: "w-[8%]",
      cellClassName: "tabular-nums",
      render: (course) => orDash(course.capacity?.max),
    },
    conflict: {
      key: "conflict",
      label: "衝堂提示",
      width: "w-[18%]",
      render: (course) => {
        const names = conflictNamesByCourseCode?.get(course.code);

        if (!names || names.size === 0) return "—";

        return (
          <span className="inline-flex items-start gap-1 text-danger">
            <ExclamationTriangleIcon className="mt-0.5 shrink-0" width={16} />與{" "}
            {Array.from(names).join("、")} 衝堂
          </span>
        );
      },
    },
  };

  return keys.map((key) => all[key]);
};
