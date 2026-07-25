import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { DataTableColumn } from "@/components/data-table.tsx";
import { CourseItem } from "@/interfaces/globals.ts";

/**
 * The 已選課程 table layout, shared by 我的課表 and the read-only shared
 * schedule so the two render identically.
 *
 * Generic over the row type because 我的課表 passes MergedCourseItem (its
 * remove button needs the full item) while a shared schedule only carries the
 * five CourseItem fields that fit in a link.
 */
export const buildCourseColumns = <T extends CourseItem>(
  conflictNamesByCourseCode: Map<string, Set<string>>,
): DataTableColumn<T>[] => [
  {
    key: "code",
    label: "課程代碼",
    headerLabel: "代碼",
    width: "w-[12%]",
    cellClassName: "tabular-nums text-muted",
    hideOnCard: true,
  },
  {
    key: "name",
    label: "課程名稱",
    width: "w-[20%]",
    cellClassName: "font-medium text-foreground",
    hideOnCard: true,
  },
  {
    key: "class",
    label: "班級名稱",
    headerLabel: "班級",
    width: "w-[14%]",
  },
  { key: "teacher", label: "教師", width: "w-[12%]" },
  {
    key: "time",
    label: "時間",
    width: "w-[14%]",
    cellClassName: "tabular-nums text-foreground/80",
  },
  {
    key: "conflict",
    label: "衝堂提示",
    width: "w-[22%]",
    render: (course) => {
      const names = conflictNamesByCourseCode.get(course.code);

      if (!names || names.size === 0) return "-";

      return (
        <span className="inline-flex items-start gap-1 text-danger">
          <ExclamationTriangleIcon className="mt-0.5 shrink-0" width={16} />與{" "}
          {Array.from(names).join("、")} 衝堂
        </span>
      );
    },
  },
];
