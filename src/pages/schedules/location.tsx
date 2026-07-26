import { useMemo, useState } from "react";
import { Separator } from "@heroui/react";
import { Key } from "@react-types/shared";

import { DataTable } from "@/components/data-table.tsx";
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

export const LocationSearchPage = () => {
  const [yms, setYms] = useState<string>("");
  const [location, setLocation] = useState<string>("");
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
    () => buildCourseColumns<PartialCourse>(COLUMN_KEYS, { yms }),
    [yms],
  );

  const scheduleTitle = `${year} 學年 (${semester}) ${selectedLocation?.name || ""} 的課表`;

  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
    setLocation("");
  };

  const onLocationChange = (id: Key | null) => {
    setLocation(id?.toString() || "");
  };

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description="查詢某間教室或場地在該學期的使用課表。"
          title="地點課表"
        />
        {/* 與標題、分隔線、內容共用同一個量測寬度並靠左；選擇器平分該寬度，
            右側才不會空出一整條。 */}
        <div className="flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-center">
          <YmsSelector className={FILTER_FIELD_CLASS} onChange={onYmsChange} />
          <ItemSelector
            className={FILTER_FIELD_CLASS}
            items={locations}
            label="選擇地點"
            selectedKey={location || null}
            onChange={onLocationChange}
          />
        </div>
        {(indexLoading || (!!location && coursesLoading)) && (
          <LoadingState className="mt-4" label="課程資料" />
        )}
        {(indexError || (!!location && coursesError)) && (
          <FetchError
            className="mt-4"
            message="這個學年期尚未收錄地點課表，請改選其他學年期。"
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
                description="這個地點在本學期沒有排課紀錄。"
                title="查無課程"
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
                    有 {missing} 筆課程的資料尚未更新，暫時無法顯示。
                  </Notice>
                )}
                <DataTable
                  cardSubtitle={(item) => item.code}
                  cardTitle={(item) => item.name}
                  className="mt-4"
                  columns={columns}
                  rowKey={(item) => item.code}
                  rows={locationCourses}
                />
                <WeeklySchedule
                  courses={convertCourses(locationCourses)}
                  scheduleTitle={scheduleTitle}
                />
              </>
            )
          ) : (
            <EmptyState
              description="選擇學年期與地點後，會顯示該教室或場地整學期的使用課表。"
              title="尚未選擇地點"
            />
          )}
        </div>
      </PageSection>
    </DefaultLayout>
  );
};

export default LocationSearchPage;
