import { Checkbox } from "@heroui/react";

import { DataTable, DataTableColumn } from "@/components/data-table.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { PartialCourse } from "@/interfaces/globals.ts";

export interface SelectableCourseTableProps {
  courses: PartialCourse[];
  /** 由呼叫端決定要顯示哪些欄位（班級課表還要帶 viewingClassCode）。 */
  columns: DataTableColumn<PartialCourse>[];
  yms: string;
  /** 這個學年期能不能加課，見 useCourseAddGate。 */
  canAdd: boolean;
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
  className,
}: SelectableCourseTableProps) => {
  const { isSelected, toggleCourse } = useSelectedCourses();

  return (
    <DataTable
      cardSubtitle={(item) => item.code}
      cardTitle={(item) => item.name}
      className={className}
      columns={columns}
      leading={{
        label: "加入",
        render: (item) => (
          <Checkbox
            aria-label={`將 ${item.name} (${item.class}) 加入我的課表`}
            // The column stays rendered (just disabled) when the 學年期 can't
            // be added to, so switching semesters doesn't reflow the table.
            isDisabled={!canAdd && !isSelected(item)}
            isSelected={isSelected(item)}
            onChange={() => toggleCourse(item, yms)}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>
        ),
      }}
      rowKey={(item, index) => `${item.code}-${item.class}-${index}`}
      rows={courses}
    />
  );
};

export default SelectableCourseTable;
