import { useMemo, useState } from "react";
import { Chip, Separator } from "@heroui/react";
import { Key } from "@react-types/shared";

import { DataTable, DataTableColumn } from "@/components/data-table.tsx";
import { EmptyState, LoadingState } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import { sectionTitle } from "@/components/primitives.ts";
import DefaultLayout from "@/layouts/default.tsx";
import { siteConfig } from "@/config/site.ts";
import {
  ClassCollege,
  ClassCourseItem,
  ClassSchedule,
} from "@/interfaces/globals.ts";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import {
  FILTER_FIELD_CLASS,
  ItemSelector,
} from "@/components/selectors/itemSelector.tsx";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { PageHeader } from "@/components/page-header.tsx";

/**
 * 科目名稱，他班開課的課再加一個標記。
 *
 * 桌機的「科目」欄與手機卡片標題共用同一個函式：科目欄是 hideOnCard，手機只會
 * 看到卡片標題，各寫一份的話標記就只有桌機看得到。
 *
 * 他班開課指這門課掛在別的班級底下（例如資科系一的體育課其實是 19071411
 * 開的），不標的話使用者會以為課表跑錯班級。
 */
const courseTitle = (item: ClassCourseItem, classCode: string) => (
  <span className="inline-flex flex-wrap items-center gap-1.5">
    {item.name}
    {item.hostClass && item.hostClass !== classCode && (
      <Chip size="sm" variant="soft">
        他班開課
      </Chip>
    )}
  </span>
);

const buildColumns = (
  classCode: string,
): DataTableColumn<ClassCourseItem>[] => [
  {
    key: "code",
    label: "選課代碼",
    headerLabel: "代碼",
    width: "w-[9%]",
    cellClassName: "tabular-nums text-muted",
    hideOnCard: true,
  },
  {
    key: "name",
    label: "科目",
    width: "w-[20%]",
    cellClassName: "font-medium text-foreground",
    // Promoted to the card title on mobile.
    hideOnCard: true,
    render: (item) => courseTitle(item, classCode),
  },
  // 7% rather than 6%: at 6% the two-character headers wrapped onto two lines.
  {
    key: "group",
    label: "分組",
    width: "w-[7%]",
    cellClassName: "tabular-nums",
  },
  {
    key: "credits",
    label: "學分",
    width: "w-[7%]",
    cellClassName: "tabular-nums",
  },
  {
    key: "required",
    label: "必選修",
    width: "w-[10%]",
    // 開課別併進同一格而不另開一欄；絕大多數是「學期」，每列都印只會讓這欄
    // 換行，所以只在是「學年」等其他值時才標出來。
    render: (item) =>
      [item.required, item.courseType !== "學期" ? item.courseType : ""]
        .filter(Boolean)
        .join("・") || "-",
  },
  {
    key: "category",
    label: "領域類",
    width: "w-[11%]",
    // 限制性別絕大多數是「不限」，只有實際有限制時才值得佔版面。
    render: (item) =>
      [item.category, item.genderLimit !== "不限" ? item.genderLimit : ""]
        .filter(Boolean)
        .join("・") || "-",
  },
  { key: "teacher", label: "教師", width: "w-[12%]" },
  {
    key: "time",
    label: "時間",
    width: "w-[10%]",
    cellClassName: "tabular-nums text-foreground/80",
  },
  // classroom 已含校區前綴（「博愛 G313」），所以不另開校區欄。
  { key: "classroom", label: "教室", width: "w-[14%]" },
];

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

  const columns = useMemo(() => buildColumns(classCode), [classCode]);

  const scheduleTitle = selectedClass
    ? `${year} 學年 (${semester}) ${selectedClass.name} 的課表`
    : "";

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
          {scheduleLoading && <LoadingState label="班級課表" />}
          {scheduleError && (
            <FetchError
              message="班級課表載入失敗。"
              onRetry={refetchSchedule}
            />
          )}
          {!scheduleLoading && !scheduleError && schedule ? (
            schedule.courses.length === 0 ? (
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
                <DataTable
                  cardSubtitle={(item) => item.code}
                  cardTitle={(item) => courseTitle(item, classCode)}
                  className="mt-4"
                  columns={columns}
                  rowKey={(item, index) =>
                    `${item.code}-${item.group}-${index}`
                  }
                  rows={schedule.courses}
                />
                <WeeklySchedule
                  courses={convertCourses(schedule.courses)}
                  scheduleTitle={scheduleTitle}
                />
              </>
            )
          ) : (
            !scheduleLoading &&
            !scheduleError && (
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
