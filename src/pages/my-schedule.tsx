import { useMemo, useState } from "react";
import { Button, Card, Link, Modal } from "@heroui/react";
import {
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/page-header.tsx";
import DefaultLayout from "@/layouts/default";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { findScheduleConflicts } from "@/utils/schedule-conflict.ts";
import { MergedCourseItem } from "@/interfaces/globals.ts";
import { cardTitle } from "@/components/primitives.ts";
import { DataTable, DataTableColumn } from "@/components/data-table.tsx";
import { EmptyState } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";

export const MySchedulePage = () => {
  const { selectedCourses, removeCourse, clearAll } = useSelectedCourses();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const scheduleCourses = useMemo(
    () => convertCourses(selectedCourses),
    [selectedCourses],
  );

  const conflicts = useMemo(
    () => findScheduleConflicts(scheduleCourses),
    [scheduleCourses],
  );

  // Map each course code to the names of the other courses it conflicts with.
  const conflictNamesByCourseCode = useMemo(() => {
    const result = new Map<string, Set<string>>();

    conflicts.forEach((conflict) => {
      const slot = scheduleCourses.find((c) => c.id === conflict.slotId);

      if (!slot) return;

      const names = result.get(slot.code) || new Set<string>();

      conflict.conflictingSlotIds.forEach((otherId) => {
        const otherSlot = scheduleCourses.find((c) => c.id === otherId);

        if (otherSlot && otherSlot.code !== slot.code) {
          names.add(otherSlot.name);
        }
      });

      result.set(slot.code, names);
    });

    return result;
  }, [conflicts, scheduleCourses]);

  const hasConflicts = conflictNamesByCourseCode.size > 0;

  const handleRemove = (course: MergedCourseItem) => {
    removeCourse(course);
  };

  const columns: DataTableColumn<MergedCourseItem>[] = useMemo(
    () => [
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
              <ExclamationTriangleIcon className="mt-0.5 shrink-0" width={16} />
              與 {Array.from(names).join("、")} 衝堂
            </span>
          );
        },
      },
    ],
    [conflictNamesByCourseCode],
  );

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description="在課程查詢頁勾選的課程會集中在這裡，可匯出成日曆或圖片。"
          title="我的課表"
        />

        {selectedCourses.length === 0 ? (
          <EmptyState
            action={
              <Link className="mt-2" href="/search">
                前往課程查詢 →
              </Link>
            }
            description="在課程查詢頁勾選想要的課程，就會集中顯示在這裡。"
            title="尚未選擇任何課程"
          />
        ) : (
          <div className="w-full max-w-5xl flex flex-col gap-6">
            {hasConflicts && (
              <div className="flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                <ExclamationTriangleIcon className="shrink-0" width={20} />
                <span>
                  已選課程中有時段衝突，請確認課表下方標示的衝堂課程。
                </span>
              </div>
            )}

            <Card className="w-full">
              <Card.Header className="flex items-center justify-between">
                <h3 className={cardTitle()}>
                  已選課程（{selectedCourses.length}）
                </h3>
                {/* 清空會直接抹掉 localStorage 且無法復原，先確認再執行。 */}
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => setConfirmClearOpen(true)}
                >
                  清空所有課程
                </Button>
              </Card.Header>
              <Card.Content>
                <DataTable
                  cardSubtitle={(course) => course.code}
                  cardTitle={(course) => course.name}
                  columns={columns}
                  leading={{
                    label: "移除",
                    render: (course) => (
                      <Button
                        isIconOnly
                        aria-label={`移除 ${course.name}`}
                        size="sm"
                        variant="tertiary"
                        onPress={() => handleRemove(course)}
                      >
                        <TrashIcon width={16} />
                      </Button>
                    ),
                  }}
                  rowKey={(course) => `${course.code}-${course.class}`}
                  rows={selectedCourses}
                />
              </Card.Content>
            </Card>

            <WeeklySchedule
              conflictCourseCodes={Array.from(conflictNamesByCourseCode.keys())}
              courses={scheduleCourses}
              scheduleTitle="我的課表"
            />

            <Modal>
              <Modal.Backdrop
                isOpen={confirmClearOpen}
                onOpenChange={setConfirmClearOpen}
              >
                <Modal.Container>
                  <Modal.Dialog>
                    <Modal.Header>
                      <Modal.Heading>清空所有課程？</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="text-muted">
                        將移除目前已選的 {selectedCourses.length}{" "}
                        門課程，且無法復原。
                      </p>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="tertiary"
                        onPress={() => setConfirmClearOpen(false)}
                      >
                        取消
                      </Button>
                      <Button
                        variant="danger"
                        onPress={() => {
                          clearAll();
                          setConfirmClearOpen(false);
                        }}
                      >
                        清空
                      </Button>
                    </Modal.Footer>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </div>
        )}
      </PageSection>
    </DefaultLayout>
  );
};

export default MySchedulePage;
