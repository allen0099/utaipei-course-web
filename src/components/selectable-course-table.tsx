import { useMemo } from "react";
import { Checkbox, Tooltip } from "@heroui/react";
import {
  ExclamationTriangleIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

import { DataTable, DataTableColumn } from "@/components/data-table.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { useWishGate, useWishlist } from "@/contexts/wishlist-context.tsx";
import { PartialCourse } from "@/interfaces/globals.ts";
import { convertCourses } from "@/utils/convert-course.ts";
import { findConflictsAgainstSchedule } from "@/utils/schedule-conflict.ts";

export interface SelectableCourseTableProps {
  courses: PartialCourse[];
  /** 由呼叫端決定要顯示哪些欄位（班級課表還要帶 viewingClassCode）。 */
  columns: DataTableColumn<PartialCourse>[];
  yms: string;
  /** 這個學年期能不能加課，見 useCourseAddGate。 */
  canAdd: boolean;
  /** 見 DataTable.cardFooter。 */
  cardFooter?: (course: PartialCourse) => React.ReactNode;
  /** 見 DataTable.onRowHover。 */
  onRowHover?: (course: PartialCourse | null) => void;
  className?: string;
}

/**
 * 前面加一欄勾選框的課程表格：課程查詢與班級／教師課表共用。
 *
 * useSelectedCourses 刻意留在表格這一層而不是下放到每一列 —— 勾任何一門課都會
 * 讓整張表重繪，每列各自訂閱 context 不會比較省，只會多出上百個訂閱。
 */
export const SelectableCourseTable = ({
  courses,
  columns,
  yms,
  canAdd,
  cardFooter,
  onRowHover,
  className,
}: SelectableCourseTableProps) => {
  const { isSelected, toggleCourse, selectedCourses } = useSelectedCourses();
  const { isWished, toggleWish, removeWish } = useWishlist();
  const canWish = useWishGate(yms);

  // 衝堂 used to surface only on 我的課表, i.e. after the user had left this
  // page -- so picking courses meant committing first and finding out later.
  // Annotate the row itself instead, at the moment the decision is made.
  const conflictNames = useMemo(
    () =>
      findConflictsAgainstSchedule(
        convertCourses(courses),
        convertCourses(selectedCourses),
      ),
    [courses, selectedCourses],
  );

  const renderConflictWarning = (item: PartialCourse) => {
    const names = conflictNames.get(item.code);

    if (!names || names.size === 0) return null;

    const label = `與 ${Array.from(names).join("、")} 衝堂`;

    return (
      <Tooltip>
        <Tooltip.Trigger>
          <span
            aria-label={label}
            className="text-danger"
            // Tooltips never fire on touch, so the label has to be reachable
            // without hover as well.
            title={label}
          >
            <ExclamationTriangleIcon width={16} />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip>
    );
  };

  return (
    <DataTable
      cardFooter={cardFooter}
      cardSubtitle={(item) => item.code}
      cardTitle={(item) => item.name}
      className={className}
      columns={columns}
      leading={{
        label: "加入",
        // 勾選框 + 星號 + 衝堂圖示，預設的 w-14 放不下。
        width: "w-24",
        render: (item) => (
          <div className="flex items-center gap-1">
            <Checkbox
              aria-label={`將 ${item.name} (${item.class}) 加入我的課表`}
              // The column stays rendered (just disabled) when the 學年期 can't
              // be added to, so switching semesters doesn't reflow the table.
              isDisabled={!canAdd && !isSelected(item)}
              isSelected={isSelected(item)}
              onChange={() => {
                const wasSelected = isSelected(item);

                // 收藏是候選名單；課一旦進了課表就不再是「候選」，留著只會讓
                // 同一門課在兩個清單各出現一次。
                if (toggleCourse(item, yms) && !wasSelected) removeWish(item);
              }}
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox.Content>
            </Checkbox>
            {/* 已經在課表裡的課不需要收藏；位置留著，整欄才不會左右跳。 */}
            <button
              aria-label={
                isWished(item) ? `取消收藏 ${item.name}` : `收藏 ${item.name}`
              }
              aria-pressed={isWished(item)}
              className={
                isSelected(item)
                  ? "invisible size-6"
                  : "grid size-6 place-items-center rounded text-muted hover:text-amber-500 disabled:opacity-30 aria-pressed:text-amber-500"
              }
              disabled={isSelected(item) || (!canWish && !isWished(item))}
              type="button"
              onClick={() => toggleWish(item, yms)}
            >
              {isWished(item) ? (
                <StarSolidIcon width={18} />
              ) : (
                <StarOutlineIcon width={18} />
              )}
            </button>
            {renderConflictWarning(item)}
          </div>
        ),
      }}
      rowKey={(item, index) => `${item.code}-${item.class}-${index}`}
      rows={courses}
      onRowHover={onRowHover}
    />
  );
};

export default SelectableCourseTable;
