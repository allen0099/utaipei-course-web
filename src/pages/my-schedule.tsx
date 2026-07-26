import { useMemo, useState } from "react";
import { Button, Card, Link, Modal } from "@heroui/react";
import {
  TrashIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/page-header.tsx";
import DefaultLayout from "@/layouts/default";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { useScheduleSlots } from "@/hooks/useScheduleSlots.ts";
import { useYms } from "@/hooks/useYms.ts";
import { PartialCourse } from "@/interfaces/globals.ts";
import { cardTitle } from "@/components/primitives.ts";
import { DataTable } from "@/components/data-table.tsx";
import { buildCourseColumns } from "@/components/course-columns.tsx";
import { EmptyState, Notice } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import { ShareScheduleModal } from "@/components/share-schedule-modal.tsx";

export const MySchedulePage = () => {
  const { selectedCourses, scheduleYms, removeCourse, clearAll } =
    useSelectedCourses();
  const { defaultCode, displayNameOf } = useYms();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const {
    scheduleCourses,
    conflictNamesByCourseCode,
    conflictCourseCodes,
    hasConflicts,
  } = useScheduleSlots(selectedCourses);

  const semesterName = displayNameOf(scheduleYms);
  // The current 學年期 rolls over while a saved schedule stays put, and a
  // schedule only ever holds one — so once they diverge, nothing new can be
  // added until this one is cleared.
  const isStaleSemester =
    scheduleYms !== null && defaultCode !== null && scheduleYms !== defaultCode;

  const handleRemove = (course: PartialCourse) => {
    removeCourse(course);
  };

  const columns = useMemo(
    () =>
      buildCourseColumns<PartialCourse>(
        [
          "code",
          "name",
          "class",
          "credits",
          "required",
          "teacher",
          "time",
          "classroom",
          "conflict",
        ],
        { conflictNamesByCourseCode },
      ),
    [conflictNamesByCourseCode],
  );

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description="在課程查詢頁勾選的課程會集中在這裡，可分享給別人或匯出成日曆、圖片。"
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
            {isStaleSemester && (
              <Notice icon={<InformationCircleIcon width={20} />}>
                此課表為 {semesterName}，目前學期已是{" "}
                {displayNameOf(defaultCode)}
                。一份課表只能有一個學年期，要選新學期的課請先清空這份課表。
              </Notice>
            )}

            {hasConflicts && (
              <Notice
                icon={<ExclamationTriangleIcon width={20} />}
                tone="danger"
              >
                已選課程中有時段衝突，請確認課表下方標示的衝堂課程。
              </Notice>
            )}

            <Card className="w-full">
              <Card.Header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <h3 className={cardTitle()}>
                    已選課程（{selectedCourses.length}）
                  </h3>
                  {semesterName && (
                    <span className="text-sm text-muted">{semesterName}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    // scheduleYms is only null for an empty schedule, which
                    // renders the empty state above — but the link has to carry
                    // a 學年期, so guard rather than encode an empty one.
                    isDisabled={!scheduleYms}
                    size="sm"
                    variant="ghost"
                    onPress={() => setShareOpen(true)}
                  >
                    <ShareIcon className="size-4" />
                    分享課表
                  </Button>
                  {/* 清空會直接抹掉 localStorage 且無法復原，先確認再執行。 */}
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={() => setConfirmClearOpen(true)}
                  >
                    清空所有課程
                  </Button>
                </div>
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
              conflictCourseCodes={conflictCourseCodes}
              courses={scheduleCourses}
              scheduleTitle="我的課表"
            />

            {scheduleYms && (
              <ShareScheduleModal
                courses={selectedCourses}
                defaultTitle={semesterName ? `${semesterName}課表` : "我的課表"}
                isOpen={shareOpen}
                yms={scheduleYms}
                onOpenChange={setShareOpen}
              />
            )}

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
