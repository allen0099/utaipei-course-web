import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import { ScheduleSummary } from "@/components/schedule-summary.tsx";
import { WishlistCard } from "@/components/wishlist-card.tsx";
import { useT } from "@/i18n/language.tsx";
import { semesterName as toSemesterName } from "@/i18n/terms.ts";

export const MySchedulePage = () => {
  const { selectedCourses, scheduleYms, removeCourse, clearAll } =
    useSelectedCourses();
  const { defaultCode, displayNameOf } = useYms();
  const navigate = useNavigate();
  const t = useT();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const {
    scheduleCourses,
    conflictNamesByCourseCode,
    conflictCourseCodes,
    hasConflicts,
  } = useScheduleSlots(selectedCourses);

  const semesterName = toSemesterName(displayNameOf(scheduleYms), t);
  const nameOf = (course: PartialCourse) =>
    t(course.name, course.nameEn || course.name);
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
          "syllabus",
          "conflict",
        ],
        // scheduleYms 是這份課表所屬的學年期，教學綱要連結要靠它。
        { conflictNamesByCourseCode, yms: scheduleYms ?? undefined, t },
      ),
    [conflictNamesByCourseCode, scheduleYms, t],
  );

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description={t(
            "在課程查詢或班級／教師課表勾選的課程會集中在這裡，可分享給別人或匯出成日曆、圖片。",
            "Courses you tick in Course Search or the class / instructor schedules are collected here. You can share them or export them as a calendar or an image.",
          )}
          title={t("我的課表", "My Schedule")}
        />

        {selectedCourses.length === 0 ? (
          <div className="flex w-full max-w-5xl flex-col gap-6">
            <EmptyState
              action={
                <Link
                  className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white no-underline"
                  href="/search"
                >
                  {t("前往課程查詢", "Go to Course Search")}
                </Link>
              }
              description={t(
                "在課程查詢或班級／教師課表勾選想要的課程，就會集中顯示在這裡。",
                "Tick the courses you want in Course Search or the class / instructor schedules and they will show up here.",
              )}
              title={t("尚未選擇任何課程", "No courses selected yet")}
            />
            {/* 課表是空的不代表沒有收藏：只收藏、還沒排課是最常見的起點。 */}
            <WishlistCard className="w-full" />
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col gap-6">
            {isStaleSemester && (
              <Notice icon={<InformationCircleIcon width={20} />}>
                {t(
                  `此課表為 ${semesterName}，目前學期已是 ${displayNameOf(defaultCode)}。一份課表只能有一個學年期，要選新學期的課請先清空這份課表。`,
                  `This schedule is for ${semesterName}, but the current semester is now ${toSemesterName(displayNameOf(defaultCode), t)}. A schedule can hold only one semester, so clear this one before picking courses for the new semester.`,
                )}
              </Notice>
            )}

            {hasConflicts && (
              <Notice
                icon={<ExclamationTriangleIcon width={20} />}
                tone="danger"
              >
                {t(
                  "已選課程中有時段衝突，請確認課表下方標示的衝堂課程。",
                  "Some of your selected courses have time conflicts. Check the courses flagged below.",
                )}
              </Notice>
            )}

            <ScheduleSummary
              courses={selectedCourses}
              slots={scheduleCourses}
            />

            <Card className="w-full">
              <Card.Header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <h3 className={cardTitle()}>
                    {t(
                      `已選課程（${selectedCourses.length}）`,
                      `Selected courses (${selectedCourses.length})`,
                    )}
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
                    {t("分享課表", "Share schedule")}
                  </Button>
                  {/* 清空會直接抹掉 localStorage 且無法復原，先確認再執行。 */}
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={() => setConfirmClearOpen(true)}
                  >
                    {t("清空所有課程", "Clear all courses")}
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <DataTable
                  cardSubtitle={(course) => course.code}
                  cardTitle={nameOf}
                  columns={columns}
                  leading={{
                    label: t("移除", "Remove"),
                    render: (course) => (
                      <Button
                        isIconOnly
                        aria-label={t(
                          `移除 ${course.name}`,
                          `Remove ${nameOf(course)}`,
                        )}
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

            <WishlistCard className="w-full" />

            <WeeklySchedule
              customizableColors
              conflictCourseCodes={conflictCourseCodes}
              courses={scheduleCourses}
              renderCourseActions={(code, close) => (
                <Button
                  variant="danger"
                  onPress={() => {
                    const course = selectedCourses.find(
                      (item) => item.code === code,
                    );

                    if (course) removeCourse(course);
                    close();
                  }}
                >
                  <TrashIcon width={16} />
                  {t("從課表移除", "Remove from schedule")}
                </Button>
              )}
              scheduleTitle={t("我的課表", "My Schedule")}
              yms={scheduleYms ?? undefined}
              onEmptySlotPress={(day, period) => {
                // 帶著學年期、時段與「只顯示不衝堂」過去：從空堂出發找課，要的
                // 就是排得進去的課。
                const params = new URLSearchParams({
                  time: `${day}-${period}`,
                  free: "1",
                });

                if (scheduleYms) params.set("yms", scheduleYms);
                navigate(`/search?${params.toString()}`);
              }}
            />

            {scheduleYms && (
              <ShareScheduleModal
                courses={selectedCourses}
                defaultTitle={
                  semesterName
                    ? t(`${semesterName}課表`, `${semesterName} schedule`)
                    : t("我的課表", "My Schedule")
                }
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
                      <Modal.Heading>
                        {t("清空所有課程？", "Clear all courses?")}
                      </Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="text-muted">
                        {t(
                          `將移除目前已選的 ${selectedCourses.length} 門課程，且無法復原。`,
                          selectedCourses.length === 1
                            ? "This removes the 1 course you have selected and cannot be undone."
                            : `This removes all ${selectedCourses.length} courses you have selected and cannot be undone.`,
                        )}
                      </p>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="tertiary"
                        onPress={() => setConfirmClearOpen(false)}
                      >
                        {t("取消", "Cancel")}
                      </Button>
                      <Button
                        variant="danger"
                        onPress={() => {
                          clearAll();
                          setConfirmClearOpen(false);
                        }}
                      >
                        {t("清空", "Clear")}
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
