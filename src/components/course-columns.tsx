import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Chip, Tooltip } from "@heroui/react";

import { DataTableColumn } from "@/components/data-table.tsx";
import { siteConfig } from "@/config/site.ts";
import { PartialCourse } from "@/interfaces/globals.ts";
import { isOtherClassCourse } from "@/utils/course-class.ts";

export type CourseColumnKey =
  | "code"
  | "name"
  | "class"
  | "group"
  | "credits"
  | "required"
  | "category"
  | "genderLimit"
  | "teacher"
  | "time"
  | "classroom"
  | "capacity"
  | "syllabus"
  | "conflict";

export interface CourseColumnOptions {
  /** 課程代碼 → 與它衝堂的課名。只有「我的課表」與分享頁需要。 */
  conflictNamesByCourseCode?: Map<string, Set<string>>;
  /**
   * 正在檢視的班級代碼。課程的開課班級不是它時標「他班開課」——例如資科系一的
   * 體育課其實掛在 19071411 底下，不標的話使用者會以為課表跑錯班級。
   */
  viewingClassCode?: string;
  /** 學年期，如 "114#1"。教學綱要連結需要它才組得出來。 */
  yms?: string;
}

/** 缺值一律顯示「—」，不要用空字串假裝這門課沒有這個屬性。 */
const orDash = (value: string | undefined) => value || "—";

/** 「未定」的值刻意壓低對比：它是真的還沒排，不是重點資訊。 */
const undecided = (value: string | undefined) =>
  !value || value.includes("未定");

const mutedIfUndecided = (value: string | undefined) =>
  undecided(value) ? (
    <span className="text-muted">{orDash(value)}</span>
  ) : (
    value
  );

const syllabusUrl = (yms: string, syllabusKey: string): string => {
  const [year, semester] = yms.split("#");
  const params = new URLSearchParams({
    uid: "guest",
    arg01: year,
    arg02: semester,
    arg04: syllabusKey,
  });

  return `${siteConfig.links.utaipei.syllabus}?${params}`;
};

const restrictionUrl = (yms: string, code: string): string => {
  const [year, semester] = yms.split("#");
  const params = new URLSearchParams({
    uid: "guest",
    yms_yms: yms,
    ls_year: year,
    ls_sms: semester,
    data: code,
  });

  return `${siteConfig.links.utaipei.restriction}?${params}`;
};

/**
 * 外部連結一律用原生 <a>，不要用 HeroUI 的 Link：provider.tsx 把 RouterProvider
 * 接上 react-router，HeroUI Link 會把 href 當成站內路徑導航，外部網址會被解析成
 * /search/https:/shcourse...。footbar 的外部連結也是為了同一個原因用原生 <a>。
 */
const ExternalLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <a
    className={className ?? "text-accent hover:underline"}
    href={href}
    rel="noopener noreferrer"
    target="_blank"
  >
    {children}
  </a>
);

/**
 * 課程欄位的單一定義處。
 *
 * 課程查詢、我的課表、分享頁與三個課表頁以前各自寫一份欄位陣列，同一個欄位在
 * 不同頁的標題、寬度與缺值處理都不一樣。現在共用這張表，各頁只挑要哪幾欄。
 *
 * 學分與時數併成一欄：兩者都是學生會看的，但欄位總數已經逼近一列放得下的
 * 上限，各佔一欄會把其他欄擠到換行；併成「3.0 / 2.0」既省寬度又看得到差異
 * （體育課就是 0 學分 2 時數）。
 */
export const buildCourseColumns = <T extends PartialCourse>(
  keys: CourseColumnKey[],
  options: CourseColumnOptions = {},
): DataTableColumn<T>[] => {
  const { conflictNamesByCourseCode, viewingClassCode, yms } = options;

  const all: Record<CourseColumnKey, DataTableColumn<T>> = {
    code: {
      key: "code",
      label: "選課代碼",
      headerLabel: "代碼",
      width: "w-[7%]",
      cellClassName: "tabular-nums text-muted",
      hideOnCard: true,
    },
    name: {
      key: "name",
      label: "科目",
      width: "w-[19%]",
      cellClassName: "font-medium text-foreground",
      // 手機卡片改用 cardTitle 呈現，見各頁的 DataTable 設定。
      hideOnCard: true,
      render: (course) => (
        <span className="flex flex-col gap-0.5">
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {course.name}
            {isOtherClassCourse(course, viewingClassCode) && (
              <>
                <Tooltip delay={0}>
                  <Tooltip.Trigger>
                    <Chip size="sm" variant="soft">
                      他班開課
                    </Chip>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <p>該課程非本系所課程，僅在資料中列出，通常為共用課程</p>
                  </Tooltip.Content>
                </Tooltip>
              </>
            )}
          </span>
          {course.nameEn && (
            <span className="text-xs font-normal text-muted">
              {course.nameEn}
            </span>
          )}
          {course.note && (
            <span className="text-xs font-normal text-warning">
              {course.note}
            </span>
          )}
          {/* 擋修條件。放在這裡而不是自成一欄，是因為只有少數課有 —— 一整欄會
              大半都是「—」；學校自己也是把這顆按鈕放在備註欄。 */}
          {course.hasRestriction && yms && (
            <ExternalLink
              className="text-xs font-normal text-danger hover:underline"
              href={restrictionUrl(yms, course.code)}
            >
              有擋修條件
            </ExternalLink>
          )}
        </span>
      ),
    },
    class: {
      key: "class",
      label: "班級名稱",
      headerLabel: "班級",
      width: "w-[10%]",
      render: (course) =>
        course.mixedClass
          ? `${orDash(course.class)}（合 ${course.mixedClass}）`
          : orDash(course.class),
    },
    group: {
      key: "group",
      label: "分組",
      width: "w-[6%]",
      cellClassName: "tabular-nums",
      render: (course) => orDash(course.group),
    },
    credits: {
      key: "credits",
      label: "學分／時數",
      headerLabel: "學分/時數",
      width: "w-[9%]",
      cellClassName: "tabular-nums",
      render: (course) => {
        if (!course.credits && !course.hours) return "—";

        return (
          <span>
            <span className="font-medium text-foreground">
              {orDash(course.credits)}
            </span>
            <span className="text-muted"> / {orDash(course.hours)}</span>
          </span>
        );
      },
    },
    required: {
      key: "required",
      label: "必選修",
      width: "w-[8%]",
      // 必修用警示色：這是「不選不行」的資訊，選修則不需要搶注意力。
      // 開課別絕大多數是「學期」，只在「學年」等其他值時才標，否則每列都換行。
      render: (course) => {
        if (!course.required) return "—";

        const extra =
          course.courseType && course.courseType !== "學期"
            ? course.courseType
            : "";

        return (
          <span
            className={
              course.required.includes("必") ? "font-medium text-danger" : ""
            }
          >
            {course.required}
            {extra && <span className="text-muted">・{extra}</span>}
          </span>
        );
      },
    },
    category: {
      key: "category",
      label: "領域類",
      width: "w-[10%]",
      render: (course) => orDash(course.category),
    },
    genderLimit: {
      key: "genderLimit",
      label: "限制性別",
      headerLabel: "性別",
      width: "w-[6%]",
      // 絕大多數是「不限」，所以「不限」壓成低對比、有限制的才標色 —— 掃過表格
      // 時真正需要注意的那幾列才會跳出來。
      render: (course) => {
        if (!course.genderLimit) return "—";

        return course.genderLimit === "不限" ? (
          <span className="text-muted">不限</span>
        ) : (
          <span className="font-medium text-warning">{course.genderLimit}</span>
        );
      },
    },
    teacher: {
      key: "teacher",
      label: "教師",
      width: "w-[9%]",
      render: (course) => mutedIfUndecided(course.teacher),
    },
    time: {
      key: "time",
      label: "時間",
      width: "w-[9%]",
      cellClassName: "tabular-nums",
      render: (course) => mutedIfUndecided(course.time),
    },
    classroom: {
      // 教室已含校區前綴（「博愛 G313」），所以不另開校區欄。
      key: "classroom",
      label: "教室",
      width: "w-[11%]",
      render: (course) => mutedIfUndecided(course.classroom),
    },
    capacity: {
      key: "capacity",
      label: "人數上限",
      headerLabel: "上限",
      width: "w-[5%]",
      cellClassName: "tabular-nums",
      render: (course) => orDash(course.capacity?.max),
    },
    syllabus: {
      key: "syllabus",
      label: "教學綱要",
      headerLabel: "綱要",
      width: "w-[6%]",
      render: (course) => {
        if (!yms || !course.syllabusKey) return "—";

        return (
          <ExternalLink href={syllabusUrl(yms, course.syllabusKey)}>
            綱要
          </ExternalLink>
        );
      },
    },
    conflict: {
      key: "conflict",
      label: "衝堂提示",
      width: "w-[16%]",
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
