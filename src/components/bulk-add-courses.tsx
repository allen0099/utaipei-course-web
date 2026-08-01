import type { ReactNode } from "react";

import { Button, Chip, Link } from "@heroui/react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

import { Notice } from "@/components/states.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { PartialCourse } from "@/interfaces/globals.ts";

export interface BulkAddCoursesProps {
  /** 表格裡全部的課程；「移除本頁課程」與已加入計數看這一份。 */
  courses: PartialCourse[];
  /**
   * 一鍵加入的對象。班級課表會先排掉他班開課的課，所以會小於 courses；
   * 沒傳就等於 courses。
   */
  bulkCourses?: PartialCourse[];
  /** 被排除掉的課要交代清楚，例如「已排除 4 門他班開課課程…」。 */
  excludedNote?: ReactNode;
  yms: string;
  /** 見 useCourseAddGate。 */
  canAdd: boolean;
  blockedReason: string | null;
  className?: string;
}

/**
 * 課表頁上方的整批加入／移除操作列。
 *
 * 刻意不做「已加入 N 門課程」那種結果訊息（分享頁有）：這裡下方就是勾選欄，
 * 按下去整排打勾、按鈕跟著停用，本身就是回饋；多一段文字反而還要多一份得跟著
 * 班級／教師切換重置的 state。
 */
export const BulkAddCourses = ({
  courses,
  bulkCourses,
  excludedNote,
  yms,
  canAdd,
  blockedReason,
  className,
}: BulkAddCoursesProps) => {
  const { selectedCourses, isSelected, importCourses, removeCourse } =
    useSelectedCourses();

  const addable = bulkCourses ?? courses;
  const pending = addable.filter((course) => !isSelected(course));
  const addedHere = courses.filter((course) => isSelected(course));

  return (
    <div className={className}>
      {blockedReason && (
        <Notice className="mb-3" icon={<InformationCircleIcon width={18} />}>
          {blockedReason}
        </Notice>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          isDisabled={!canAdd || pending.length === 0}
          size="sm"
          variant="primary"
          onPress={() => importCourses(addable, yms)}
        >
          加入我的課表（{pending.length}）
        </Button>
        {/* 整批加入沒有對應的整批復原會是死路：使用者只剩一列一列取消，或跑去
            我的課表整個清空。 */}
        {addedHere.length > 0 && (
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => addedHere.forEach((course) => removeCourse(course))}
          >
            移除本頁課程（{addedHere.length}）
          </Button>
        )}
        {selectedCourses.length > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Chip color="accent" size="sm" variant="tertiary">
              已選 {selectedCourses.length} 門課程
            </Chip>
            <Link className="text-sm" href="/my-schedule">
              前往我的課表 →
            </Link>
          </div>
        )}
      </div>
      {excludedNote && (
        <p className="mt-2 text-sm text-muted">{excludedNote}</p>
      )}
    </div>
  );
};

export default BulkAddCourses;
