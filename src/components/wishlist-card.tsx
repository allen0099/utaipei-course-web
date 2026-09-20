import { useMemo } from "react";
import { Button, Card } from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import { DataTable } from "@/components/data-table.tsx";
import { buildCourseColumns } from "@/components/course-columns.tsx";
import { Notice } from "@/components/states.tsx";
import { cardTitle } from "@/components/primitives.ts";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { useWishlist } from "@/contexts/wishlist-context.tsx";
import { useCourseAddGate } from "@/hooks/useCourseAddGate.ts";
import { useYms } from "@/hooks/useYms.ts";
import { PartialCourse } from "@/interfaces/globals.ts";
import { convertCourses } from "@/utils/convert-course.ts";
import { findConflictsAgainstSchedule } from "@/utils/schedule-conflict.ts";
import { useT } from "@/i18n/language.tsx";
import { semesterName } from "@/i18n/terms.ts";

/**
 * 我的課表頁上的收藏清單：候選的課，逐門決定要排進課表還是放掉。
 *
 * 衝堂欄比的是「這門收藏 vs 目前的課表」，不是收藏彼此之間 —— 兩門互相衝堂的
 * 候選課同時留著很正常，那正是「還在二選一」的狀態。
 */
export const WishlistCard = ({ className }: { className?: string }) => {
  const { wishlist, wishlistYms, removeWish, clearWishlist } = useWishlist();
  const { selectedCourses, scheduleYms, addCourse } = useSelectedCourses();
  const { defaultCode, displayNameOf } = useYms();
  const t = useT();
  const nameOf = (course: PartialCourse) =>
    t(course.name, course.nameEn || course.name);
  // 能不能把收藏升級成課表，問的是課表那一邊的閘門。
  const { canAdd, blockedReason } = useCourseAddGate(wishlistYms ?? "");

  const conflictNamesByCourseCode = useMemo(
    () =>
      scheduleYms !== null && scheduleYms === wishlistYms
        ? findConflictsAgainstSchedule(
            convertCourses(wishlist),
            convertCourses(selectedCourses),
          )
        : new Map<string, Set<string>>(),
    [wishlist, wishlistYms, selectedCourses, scheduleYms],
  );

  const columns = useMemo(
    () =>
      buildCourseColumns<PartialCourse>(
        [
          "code",
          "name",
          "class",
          "credits",
          "teacher",
          "time",
          "classroom",
          "syllabus",
          "conflict",
        ],
        { conflictNamesByCourseCode, yms: wishlistYms ?? undefined, t },
      ),
    [conflictNamesByCourseCode, wishlistYms, t],
  );

  if (wishlist.length === 0) return null;

  const isStale =
    wishlistYms !== null && defaultCode !== null && wishlistYms !== defaultCode;

  const promote = (course: PartialCourse) => {
    if (wishlistYms && addCourse(course, wishlistYms)) removeWish(course);
  };

  return (
    <Card className={className}>
      <Card.Header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <h3 className={cardTitle()}>
            {t(
              `收藏的課程（${wishlist.length}）`,
              `Saved courses (${wishlist.length})`,
            )}
          </h3>
          <span className="text-sm text-muted">
            {t(
              "還沒排進課表的候選課；不計入學分，也不會出現在匯出與分享裡。",
              "Candidates not yet in your schedule. They don't count toward credits and are left out of exports and shared links.",
            )}
          </span>
        </div>
        <Button size="sm" variant="tertiary" onPress={clearWishlist}>
          {t("清空收藏", "Clear saved")}
        </Button>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {isStale ? (
          <Notice>
            {t(
              `這份收藏是 ${displayNameOf(wishlistYms)} 的課，目前學期已是 ${displayNameOf(defaultCode)}；選課代碼每學期重編，要收藏新學期的課請先清空。`,
              `These saved courses are from ${semesterName(displayNameOf(wishlistYms), t)}, but the current semester is now ${semesterName(displayNameOf(defaultCode), t)}. Course codes are reassigned every semester, so clear this list before saving courses from the new one.`,
            )}
          </Notice>
        ) : (
          blockedReason && <Notice tone="info">{blockedReason}</Notice>
        )}
        <DataTable
          cardSubtitle={(course) => course.code}
          cardTitle={nameOf}
          columns={columns}
          leading={{
            label: t("操作", "Actions"),
            width: "w-24",
            render: (course) => (
              <div className="flex items-center gap-1">
                <Button
                  isIconOnly
                  aria-label={t(
                    `將 ${course.name} 加入我的課表`,
                    `Add ${nameOf(course)} to My Schedule`,
                  )}
                  isDisabled={!canAdd}
                  size="sm"
                  variant="secondary"
                  onPress={() => promote(course)}
                >
                  <PlusIcon width={16} />
                </Button>
                <Button
                  isIconOnly
                  aria-label={t(
                    `取消收藏 ${course.name}`,
                    `Unsave ${nameOf(course)}`,
                  )}
                  size="sm"
                  variant="tertiary"
                  onPress={() => removeWish(course)}
                >
                  <TrashIcon width={16} />
                </Button>
              </div>
            ),
          }}
          rowKey={(course) => course.code}
          rows={wishlist}
        />
      </Card.Content>
    </Card>
  );
};

export default WishlistCard;
