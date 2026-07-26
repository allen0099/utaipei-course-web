import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Button, Card, Link } from "@heroui/react";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/page-header.tsx";
import { PageSection } from "@/components/panel.tsx";
import DefaultLayout from "@/layouts/default";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { DataTable } from "@/components/data-table.tsx";
import { buildCourseColumns } from "@/components/course-columns.tsx";
import {
  buildCatalog,
  resolveCourses,
  useCourseCatalog,
} from "@/hooks/useCourseCatalog.ts";
import { EmptyState, LoadingState, Notice } from "@/components/states.tsx";
import { cardTitle } from "@/components/primitives.ts";
import { CourseItem, PartialCourse } from "@/interfaces/globals.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { useScheduleSlots } from "@/hooks/useScheduleSlots.ts";
import { useYms } from "@/hooks/useYms.ts";
import {
  decodeSchedule,
  payloadToCourses,
  SharedSchedulePayload,
} from "@/utils/share-schedule.ts";

type DecodeState =
  | { status: "loading" }
  | { status: "ok"; payload: SharedSchedulePayload }
  | { status: "invalid" };

const EMPTY_COURSES: CourseItem[] = [];

export const SharedSchedulePage = () => {
  const location = useLocation();
  // The payload rides in the fragment so it never reaches a server; react-router
  // hands it back with the leading "#" still attached.
  const raw = location.hash.replace(/^#/, "");

  const [state, setState] = useState<DecodeState>({ status: "loading" });
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const { scheduleYms, importCourses } = useSelectedCourses();
  const { defaultCode, displayNameOf, loading: ymsLoading } = useYms();

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    setImportedCount(null);

    decodeSchedule(raw)
      .then((payload) => {
        if (!cancelled) setState({ status: "ok", payload });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "invalid" });
      });

    return () => {
      cancelled = true;
    };
  }, [raw]);

  const payload = state.status === "ok" ? state.payload : null;

  // v2 links carry only 選課代碼, so they need courses.json to show anything.
  // v1 links inline their five fields and must keep rendering with no request
  // at all — that zero-fetch property is why old links still work offline.
  const needsCatalog = payload?.v === 2;
  const {
    data: catalogCourses,
    loading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useCourseCatalog(needsCatalog ? payload.y : "");

  const catalog = useMemo(() => buildCatalog(catalogCourses), [catalogCourses]);

  const { courses, missing } = useMemo(() => {
    if (!payload) return { courses: EMPTY_COURSES, missing: 0 };

    if (payload.v === 1) {
      return { courses: payloadToCourses(payload), missing: 0 };
    }

    return resolveCourses(catalog, payload.c);
  }, [payload, catalog]);

  const {
    scheduleCourses,
    conflictNamesByCourseCode,
    conflictCourseCodes,
    hasConflicts,
  } = useScheduleSlots(courses);

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
        { conflictNamesByCourseCode, yms: payload?.y },
      ),
    [conflictNamesByCourseCode, payload],
  );

  const semesterName = payload ? displayNameOf(payload.y) : "";
  const scheduleTitle =
    payload?.t || (semesterName ? `${semesterName}課表` : "分享的課表");

  // Importing writes into the viewer's own schedule, which holds exactly one
  // 學年期 — so a link from another semester stays viewable but not importable.
  const importBlockedReason = (() => {
    if (!payload || ymsLoading) return null;

    if (defaultCode === null) {
      return "目前無法確認學校的當前學期，暫時無法匯入這份課表。";
    }

    if (payload.y !== defaultCode) {
      return `這份課表是 ${displayNameOf(payload.y)}的課程，並非目前學期（${displayNameOf(defaultCode)}），僅供檢視。`;
    }

    if (scheduleYms !== null && scheduleYms !== payload.y) {
      return `你的課表屬於 ${displayNameOf(scheduleYms)}，請先到「我的課表」清空後再匯入。`;
    }

    return null;
  })();

  const canImport =
    !!payload &&
    !ymsLoading &&
    importBlockedReason === null &&
    importedCount === null;

  const handleImport = () => {
    if (!payload) return;

    setImportedCount(importCourses(courses, payload.y));
  };

  const renderContent = () => {
    if (state.status === "loading") {
      return <LoadingState label="分享的課表" />;
    }

    if (state.status === "invalid" || !payload) {
      return (
        <EmptyState
          action={
            <Link className="mt-2" href="/search">
              前往課程查詢 →
            </Link>
          }
          description="連結可能被截斷或修改過，請向分享者索取完整的連結。"
          title="分享連結無效或已損毀"
        />
      );
    }

    // Only v2 links get here without their courses already in hand.
    if (needsCatalog && catalogLoading) {
      return <LoadingState label="課程資料" />;
    }

    if (needsCatalog && catalogError) {
      return (
        <FetchError
          message="無法載入這份課表的課程資料，請稍後再試。"
          onRetry={refetchCatalog}
        />
      );
    }

    if (courses.length === 0) {
      return (
        <EmptyState
          action={
            <Link className="mt-2" href="/search">
              前往課程查詢 →
            </Link>
          }
          description="這份課表的課程可能已從該學年期下架，或該學年期尚未收錄。"
          title="這份課表沒有可顯示的課程"
        />
      );
    }

    return (
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* 分享者的課表裡有、但這個學年期的課程資料查不到的課。可能是課程已
            下架，或資料還沒更新 —— 不論哪種，少掉的課要講出來。 */}
        {missing > 0 && (
          <Notice icon={<InformationCircleIcon width={18} />}>
            這份課表有 {missing} 門課查不到最新資料，未顯示在下方。
          </Notice>
        )}

        {hasConflicts && (
          <Notice icon={<ExclamationTriangleIcon width={20} />} tone="danger">
            這份課表中有時段衝突，請確認課表下方標示的衝堂課程。
          </Notice>
        )}

        <Card className="w-full">
          <Card.Header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className={cardTitle()}>課程列表（{courses.length}）</h3>
            {semesterName && (
              <span className="text-sm text-muted">{semesterName}</span>
            )}
          </Card.Header>
          <Card.Content>
            <DataTable
              cardSubtitle={(course) => course.code}
              cardTitle={(course) => course.name}
              columns={columns}
              rowKey={(course, index) =>
                `${course.code}-${course.class}-${index}`
              }
              rows={courses}
            />
          </Card.Content>
        </Card>

        <WeeklySchedule
          conflictCourseCodes={conflictCourseCodes}
          courses={scheduleCourses}
          scheduleTitle={scheduleTitle}
        />

        <Card className="w-full">
          <Card.Content className="flex flex-col gap-3">
            {importedCount === null ? (
              <>
                {importBlockedReason && (
                  <Notice icon={<InformationCircleIcon width={18} />}>
                    {importBlockedReason}
                  </Notice>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    isDisabled={!canImport}
                    variant="primary"
                    onPress={handleImport}
                  >
                    加入我的課表
                  </Button>
                  <Link className="text-sm" href="/search">
                    自己做一份 →
                  </Link>
                </div>
                <p className="text-sm text-muted">
                  匯入會把這些課程合併進你原本的課表，不會蓋掉既有的課程。
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground">
                  {importedCount > 0
                    ? `已加入 ${importedCount} 門課程到你的課表。`
                    : "這些課程你的課表裡都已經有了。"}
                </p>
                <Link className="text-sm" href="/my-schedule">
                  前往我的課表 →
                </Link>
              </>
            )}
          </Card.Content>
        </Card>
      </div>
    );
  };

  return (
    <DefaultLayout noIndex>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description={
            payload
              ? `別人分享的課表，唯讀檢視。${semesterName ? `學年期：${semesterName}。` : ""}`
              : "別人分享的課表，唯讀檢視。"
          }
          title={payload?.t || "分享的課表"}
        />
        {renderContent()}
      </PageSection>
    </DefaultLayout>
  );
};

export default SharedSchedulePage;
