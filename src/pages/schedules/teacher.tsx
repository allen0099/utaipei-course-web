import { Separator } from "@heroui/react";
import { useMemo, useState } from "react";
import { Key } from "@react-types/shared";

import DefaultLayout from "@/layouts/default.tsx";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import {
  FILTER_FIELD_CLASS,
  ItemSelector,
} from "@/components/selectors/itemSelector.tsx";
import { PartialCourse, TeacherUnit } from "@/interfaces/globals.ts";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { SelectableCourseTable } from "@/components/selectable-course-table.tsx";
import { BulkAddCourses } from "@/components/bulk-add-courses.tsx";
import {
  buildCourseColumns,
  CourseColumnKey,
} from "@/components/course-columns.tsx";
import {
  buildCatalog,
  resolveCourses,
  useCourseCatalog,
  useCourseIndex,
} from "@/hooks/useCourseCatalog.ts";
import { useCourseAddGate } from "@/hooks/useCourseAddGate.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { PageHeader } from "@/components/page-header.tsx";
import { sectionTitle } from "@/components/primitives.ts";
import { EmptyState, LoadingState, Notice } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";

const COLUMN_KEYS: CourseColumnKey[] = [
  "code",
  "name",
  "class",
  "credits",
  "required",
  "category",
  "genderLimit",
  "time",
  "classroom",
  "capacity",
  "syllabus",
];

export const TeacherSchedulePage = () => {
  const [yms, setYms] = useState<string>("");
  const [unitCode, setUnitCode] = useState<string>("");
  const [teacherCode, setTeacherCode] = useState<string>("");

  const [year, semester] = yms.split("#");

  const {
    data: index,
    loading: indexLoading,
    error: indexError,
    refetch: refetchIndex,
  } = useCourseIndex<TeacherUnit>(yms, "teachers.json");

  const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourseCatalog(yms);

  // Data input is reversed to show latest first
  const units = useMemo(
    () => (index?.entries ? [...index.entries].reverse() : []),
    [index],
  );

  const teachers = useMemo(
    () => units.find((unit) => unit.code === unitCode)?.teachers ?? [],
    [units, unitCode],
  );

  const teacher = useMemo(
    () => teachers.find((item) => item.code === teacherCode),
    [teachers, teacherCode],
  );

  const catalog = useMemo(
    () => buildCatalog(courses, index?.extraCourses),
    [courses, index],
  );

  const { courses: teacherCourses, missing } = useMemo(
    () => resolveCourses(catalog, teacher?.courseCodes),
    [catalog, teacher],
  );

  const { canAdd, blockedReason } = useCourseAddGate(yms);

  // Each selector feeds the next, so changing one clears everything downstream.
  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
    setUnitCode("");
    setTeacherCode("");
  };

  const onUnitChange = (id: Key | null) => {
    setUnitCode(id?.toString() || "");
    setTeacherCode("");
  };

  const columns = useMemo(
    () => buildCourseColumns<PartialCourse>(COLUMN_KEYS, { yms }),
    [yms],
  );

  const scheduleTitle = teacher
    ? `${year} 學年 (${semester}) ${teacher.name} 教師的課表`
    : "";

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description="查詢個別教師在該學期的授課課表。"
          title="教師課表"
        />
        {/* 與標題、分隔線、課表共用同一個量測寬度並靠左，整頁才有一條連續左緣；
            選擇器平分該寬度，右側才不會空出一整條。 */}
        <div className="flex w-full max-w-5xl flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <YmsSelector
              className={FILTER_FIELD_CLASS}
              onChange={onYmsChange}
            />
            <ItemSelector
              className={FILTER_FIELD_CLASS}
              items={units}
              label="請選擇系級"
              selectedKey={unitCode || null}
              onChange={onUnitChange}
            />
            <ItemSelector
              className={FILTER_FIELD_CLASS}
              items={teachers}
              label="請選擇教師"
              selectedKey={teacherCode || null}
              onChange={(id) => setTeacherCode(id?.toString() || "")}
            />
          </div>
          {(indexLoading || (!!teacherCode && coursesLoading)) && (
            <LoadingState label="課程資料" />
          )}
          {(indexError || (!!teacherCode && coursesError)) && (
            <FetchError
              message="這個學年期尚未收錄教師課表，請改選其他學年期。"
              onRetry={() => {
                refetchIndex();
                refetchCourses();
              }}
            />
          )}
        </div>
        <Separator className="my-6 max-w-5xl w-full" />
        <div className="w-full max-w-5xl">
          {teacher ? (
            teacherCourses.length === 0 ? (
              <EmptyState
                description="該教師在此學年期沒有開課紀錄，可以換一個學年期再試。"
                title={`${teacher.name} 教師查無課程`}
              />
            ) : (
              <>
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
                <BulkAddCourses
                  blockedReason={blockedReason}
                  canAdd={canAdd}
                  className="mt-4"
                  courses={teacherCourses}
                  yms={yms}
                />
                <SelectableCourseTable
                  canAdd={canAdd}
                  className="mt-4"
                  columns={columns}
                  courses={teacherCourses}
                  yms={yms}
                />
                <WeeklySchedule
                  courses={convertCourses(teacherCourses)}
                  scheduleTitle={scheduleTitle}
                />
              </>
            )
          ) : (
            <EmptyState
              description="依序選擇學年期、系級與教師，就會顯示該教師整學期的課表。"
              title="請選擇系級與教師以查看課程"
            />
          )}
        </div>
      </PageSection>
    </DefaultLayout>
  );
};

export default TeacherSchedulePage;
