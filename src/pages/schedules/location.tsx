import { useMemo } from "react";
import { Separator } from "@heroui/react";

import { SelectionBar } from "@/components/selection-bar.tsx";
import { SelectableCourseTable } from "@/components/selectable-course-table.tsx";
import { BulkAddCourses } from "@/components/bulk-add-courses.tsx";
import { useCourseAddGate } from "@/hooks/useCourseAddGate.ts";
import { useSelectionParams } from "@/hooks/useSelectionParams.ts";
import {
  buildCourseColumns,
  CourseColumnKey,
} from "@/components/course-columns.tsx";
import { EmptyState, LoadingState, Notice } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import { sectionTitle } from "@/components/primitives.ts";
import DefaultLayout from "@/layouts/default.tsx";
import { LocationEntry, PartialCourse } from "@/interfaces/globals.ts";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import {
  FILTER_FIELD_CLASS,
  ItemSelector,
} from "@/components/selectors/itemSelector.tsx";
import {
  buildCatalog,
  resolveCourses,
  useCourseCatalog,
  useCourseIndex,
} from "@/hooks/useCourseCatalog.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { PageHeader } from "@/components/page-header.tsx";
import { useT } from "@/i18n/language.tsx";

const COLUMN_KEYS: CourseColumnKey[] = [
  "code",
  "name",
  "class",
  "credits",
  "required",
  "genderLimit",
  "teacher",
  "time",
  "capacity",
  "syllabus",
];

const PARAM_KEYS = ["location"] as const;

export const LocationSearchPage = () => {
  const t = useT();
  const { yms, initialYms, values, onYmsChange, select } =
    useSelectionParams(PARAM_KEYS);
  const { location } = values;
  const [year, semester] = yms.split("#");

  const {
    data: index,
    loading: indexLoading,
    error: indexError,
    refetch: refetchIndex,
  } = useCourseIndex<LocationEntry>(yms, "locations.json");

  const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourseCatalog(yms);

  const locations = useMemo(() => index?.entries ?? [], [index]);

  const selectedLocation = locations.find((loc) => loc.code === location);

  const catalog = useMemo(
    () => buildCatalog(courses, index?.extraCourses),
    [courses, index],
  );

  const { courses: locationCourses, missing } = useMemo(
    () => resolveCourses(catalog, selectedLocation?.courseCodes),
    [catalog, selectedLocation],
  );

  const columns = useMemo(
    () => buildCourseColumns<PartialCourse>(COLUMN_KEYS, { yms, t }),
    [yms, t],
  );

  const scheduleTitle = t(
    `${year} 學年 (${semester}) ${selectedLocation?.name || ""} 的課表`,
    `AY ${year} S${semester} – ${selectedLocation?.name || ""}`,
  );

  const { canAdd, blockedReason } = useCourseAddGate(yms);

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description={t(
            "查詢某間教室或場地在該學期的使用課表。",
            "See when a room or venue is in use during a semester.",
          )}
          title={t("地點課表", "Room Schedules")}
        />
        {/* 與標題、分隔線、內容共用同一個量測寬度並靠左；選擇器平分該寬度，
            右側才不會空出一整條。 */}
        <div className="flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-center">
          <YmsSelector
            className={FILTER_FIELD_CLASS}
            initialKey={initialYms || undefined}
            onChange={onYmsChange}
          />
          <ItemSelector
            className={FILTER_FIELD_CLASS}
            items={locations}
            label={t("選擇地點", "Location")}
            selectedKey={location || null}
            onChange={(id) => select("location", id)}
          />
        </div>
        {(indexLoading || (!!location && coursesLoading)) && (
          <LoadingState className="mt-4" label={t("課程資料", "course data")} />
        )}
        {(indexError || (!!location && coursesError)) && (
          <FetchError
            className="mt-4"
            message={t(
              "這個學年期尚未收錄地點課表，請改選其他學年期。",
              "Room schedules are not available for this semester yet. Try another one.",
            )}
            onRetry={() => {
              refetchIndex();
              refetchCourses();
            }}
          />
        )}
        <Separator className="my-6 max-w-5xl w-full" />
        <div className="w-full max-w-5xl">
          {selectedLocation ? (
            locationCourses.length === 0 ? (
              <EmptyState
                description={t(
                  "這個地點在本學期沒有排課紀錄。",
                  "Nothing is scheduled at this location this semester.",
                )}
                title={t("查無課程", "No courses found")}
              />
            ) : (
              <>
                {/* scheduleTitle 已含學年期，不再另外重複一行「學期：」 */}
                <h2 className={sectionTitle({ size: "sm", align: "center" })}>
                  {scheduleTitle}
                </h2>
                {/* 索引檔與 courses.json 各有排程，索引可能比課程資料新。
                    這不是錯誤，但少掉的課要講出來，不能靜默不顯示。 */}
                {missing > 0 && (
                  <Notice className="mt-4">
                    {t(
                      `有 ${missing} 筆課程的資料尚未更新，暫時無法顯示。`,
                      `${missing} course(s) have no data yet and cannot be shown for now.`,
                    )}
                  </Notice>
                )}
                {/* 這一頁原本是唯讀的，教師與班級課表卻都能勾選 —— 在這裡看到
                    想修的課，還得記下代碼去課程查詢再找一次。 */}
                <BulkAddCourses
                  blockedReason={blockedReason}
                  canAdd={canAdd}
                  className="mt-4"
                  courses={locationCourses}
                  yms={yms}
                />
                <SelectableCourseTable
                  canAdd={canAdd}
                  className="mt-4"
                  columns={columns}
                  courses={locationCourses}
                  yms={yms}
                />
                <WeeklySchedule
                  courses={convertCourses(locationCourses)}
                  scheduleTitle={scheduleTitle}
                  yms={yms || undefined}
                />
              </>
            )
          ) : (
            <EmptyState
              description={t(
                "選擇學年期與地點後，會顯示該教室或場地整學期的使用課表。",
                "Pick a semester and a location to see how it is used.",
              )}
              title={t("尚未選擇地點", "No location selected")}
            />
          )}
        </div>
      </PageSection>
      <SelectionBar />
    </DefaultLayout>
  );
};

export default LocationSearchPage;
