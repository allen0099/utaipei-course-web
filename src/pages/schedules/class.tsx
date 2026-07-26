import { useMemo, useState } from "react";
import { Separator } from "@heroui/react";
import { Key } from "@react-types/shared";

import { DataTable } from "@/components/data-table.tsx";
import { buildCourseColumns } from "@/components/course-columns.tsx";
import { EmptyState, LoadingState, Notice } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import { sectionTitle } from "@/components/primitives.ts";
import DefaultLayout from "@/layouts/default.tsx";
import { siteConfig } from "@/config/site.ts";
import {
  ClassCollege,
  ClassSchedule,
  PartialCourse,
} from "@/interfaces/globals.ts";
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
} from "@/hooks/useCourseCatalog.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { PageHeader } from "@/components/page-header.tsx";

export const ClassSearchPage = () => {
  const [yms, setYms] = useState<string>("");
  const [collegeCode, setCollegeCode] = useState<string>("");
  const [departmentCode, setDepartmentCode] = useState<string>("");
  const [classCode, setClassCode] = useState<string>("");

  const [year, semester] = yms.split("#");

  const {
    data: colleges = [],
    loading: indexLoading,
    error: indexError,
    refetch: refetchIndex,
  } = useFetchJson<ClassCollege[]>(
    yms
      ? `${siteConfig.links.github.api}/${year}/${semester}/classes.json`
      : null,
    { cache: true },
  );

  const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourseCatalog(yms);

  const departments = useMemo(
    () =>
      colleges.find((college) => college.code === collegeCode)?.departments ??
      [],
    [colleges, collegeCode],
  );

  const classes = useMemo(
    () =>
      departments.find((department) => department.code === departmentCode)
        ?.classes ?? [],
    [departments, departmentCode],
  );

  const selectedClass = useMemo(
    () => classes.find((item) => item.code === classCode),
    [classes, classCode],
  );

  const {
    data: schedule,
    loading: scheduleLoading,
    error: scheduleError,
    refetch: refetchSchedule,
  } = useFetchJson<ClassSchedule>(
    classCode
      ? `${siteConfig.links.github.api}/${year}/${semester}/classes/${classCode}.json`
      : null,
  );

  const catalog = useMemo(() => buildCatalog(courses), [courses]);

  const { courses: classCourses, missing } = useMemo(
    () => resolveCourses(catalog, schedule?.courseCodes),
    [catalog, schedule],
  );

  // Each selector feeds the next, so changing one has to clear everything
  // downstream — otherwise a stale 系所 or 班級 stays selected and the page
  // shows the previous class's timetable.
  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
    setCollegeCode("");
    setDepartmentCode("");
    setClassCode("");
  };

  const onCollegeChange = (id: Key | null) => {
    setCollegeCode(id?.toString() || "");
    setDepartmentCode("");
    setClassCode("");
  };

  const onDepartmentChange = (id: Key | null) => {
    setDepartmentCode(id?.toString() || "");
    setClassCode("");
  };

  // viewingClassCode drives the「他班開課」marker, so it has to be rebuilt when
  // the selected class changes.
  const columns = useMemo(
    () =>
      buildCourseColumns<PartialCourse>(
        [
          "code",
          "name",
          "group",
          "credits",
          "required",
          "category",
          "teacher",
          "time",
          "classroom",
          "capacity",
        ],
        { viewingClassCode: classCode },
      ),
    [classCode],
  );

  const scheduleTitle = selectedClass
    ? `${year} 學年 (${semester}) ${selectedClass.name} 的課表`
    : "";

  // Gated on a selection: courses.json is fetched as soon as a 學年期 is picked,
  // so without this an uncrawled semester reports "載入失敗" down here as well
  // as the 「尚未收錄」 notice above, before the user has chosen anything.
  const loading = !!classCode && (scheduleLoading || coursesLoading);
  const failed = !!classCode && (scheduleError || coursesError);

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          className="mb-6 max-w-5xl"
          description="依學年期、學院、系所選擇班級，查看該班整學期的排課清單與週課表。"
          title="班級課表"
        />
        {/* 四個選擇器一列會太擠，改為兩欄網格；與標題、分隔線共用同一量測寬度。 */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          <YmsSelector className={FILTER_FIELD_CLASS} onChange={onYmsChange} />
          <ItemSelector
            className={FILTER_FIELD_CLASS}
            items={colleges}
            label="請選擇學院"
            selectedKey={collegeCode || null}
            onChange={onCollegeChange}
          />
          <ItemSelector
            className={FILTER_FIELD_CLASS}
            items={departments}
            label="請選擇系所"
            selectedKey={departmentCode || null}
            onChange={onDepartmentChange}
          />
          <ItemSelector
            className={FILTER_FIELD_CLASS}
            items={classes}
            label="請選擇班級"
            selectedKey={classCode || null}
            onChange={(id) => setClassCode(id?.toString() || "")}
          />
        </div>
        {indexLoading && <LoadingState className="mt-4" label="班級資料" />}
        {indexError && (
          <FetchError
            className="mt-4"
            // 舊學年期是逐次回填的，尚未輪到的學年期沒有 classes.json，
            // 這跟「載入失敗」是兩回事，訊息要講清楚。
            message="這個學年期尚未收錄班級課表，請改選其他學年期。"
            onRetry={refetchIndex}
          />
        )}
        <Separator className="my-6 max-w-5xl w-full" />
        <div className="w-full max-w-5xl">
          {loading && <LoadingState label="班級課表" />}
          {failed && (
            <FetchError
              message="班級課表載入失敗。"
              onRetry={() => {
                refetchSchedule();
                refetchCourses();
              }}
            />
          )}
          {!loading && !failed && schedule ? (
            classCourses.length === 0 ? (
              <EmptyState
                description="該班級在此學年期沒有排課紀錄，可以換一個學年期再試。"
                title={`${schedule.name} 查無課程`}
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
                  rows={classCourses}
                />
                <WeeklySchedule
                  courses={convertCourses(classCourses)}
                  scheduleTitle={scheduleTitle}
                />
              </>
            )
          ) : (
            !loading &&
            !failed && (
              <EmptyState
                description="依序選擇學年期、學院、系所與班級，就會顯示該班整學期的課表。"
                title="尚未選擇班級"
              />
            )
          )}
        </div>
      </PageSection>
    </DefaultLayout>
  );
};

export default ClassSearchPage;
