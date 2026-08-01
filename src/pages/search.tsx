import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Separator, SearchField, Chip, Link } from "@heroui/react";
import { Key } from "@react-types/shared";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/page-header.tsx";
import { SelectableCourseTable } from "@/components/selectable-course-table.tsx";
import {
  buildCourseColumns,
  CourseColumnKey,
} from "@/components/course-columns.tsx";
import { EmptyState, LoadingState, Notice } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import {
  CollegeItem,
  LocationEntry,
  PartialCourse,
  TeacherUnit,
} from "@/interfaces/globals.ts";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import {
  FILTER_FIELD_CLASS,
  ItemSelector,
} from "@/components/selectors/itemSelector.tsx";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import {
  buildCatalog,
  useCourseCatalog,
  useCourseIndex,
} from "@/hooks/useCourseCatalog.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { useCourseAddGate } from "@/hooks/useCourseAddGate.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";

const MAX_DISPLAYED_COURSES = 200;

// 系所欄拿掉了：共同課會關聯十幾個系所，那一欄佔掉的寬度遠大於它的價值，而
// 系所本來就是上方的篩選條件，看結果時不必再重複一次。
const COLUMN_KEYS: CourseColumnKey[] = [
  "code",
  "name",
  "class",
  "credits",
  "required",
  "genderLimit",
  "teacher",
  "time",
  "classroom",
  "capacity",
  "syllabus",
];

// Query string keys used to sync search filters to the URL so results can
// be bookmarked/shared.
const PARAM_YMS = "yms";
const PARAM_DEPARTMENT = "dept";
const PARAM_KEYWORD = "q";

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read the initial filter values once from the URL; subsequent user
  // interaction is the source of truth and is written back to the URL below.
  const [yms, setYms] = useState<string>(
    () => searchParams.get(PARAM_YMS) || "",
  );
  const [keyword, setKeyword] = useState<string>(
    () => searchParams.get(PARAM_KEYWORD) || "",
  );
  const [departmentCode, setDepartmentCode] = useState<string>(
    () => searchParams.get(PARAM_DEPARTMENT) || "",
  );
  // 學院 (dpt_id) — narrows the 科系 (unt_id) list below. Not persisted in the
  // URL; on restore it's derived from the department (unt_id) instead.
  //
  // Only the user's *explicit* choice lives in state: `null` means "hasn't
  // picked one", `""` means they deliberately picked 不限學院. The effective
  // value is computed during render further down, so a URL-restored department
  // doesn't need an effect to write the college back into state.
  const [pickedCollegeCode, setPickedCollegeCode] = useState<string | null>(
    null,
  );
  const [year, semester] = yms.split("#");

  // Skip clearing the restored department filter the first time YmsSelector
  // reports back its (possibly URL-restored) initial value on mount.
  const isInitialYmsChange = useRef(true);
  const { selectedCourses } = useSelectedCourses();
  const { canAdd, blockedReason: addBlockedReason } = useCourseAddGate(yms);

  // 教學綱要連結要帶學年期，所以欄位定義得跟著 yms 走。
  const columns = useMemo(
    () => buildCourseColumns<PartialCourse>(COLUMN_KEYS, { yms }),
    [yms],
  );

  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");

    if (isInitialYmsChange.current) {
      isInitialYmsChange.current = false;
    } else {
      // Back to "hasn't picked one" — a new 學年期 has its own 學院 list.
      setPickedCollegeCode(null);
      setDepartmentCode("");
    }
  };

  const onCollegeChange = (id: Key | null) => {
    setPickedCollegeCode(id?.toString() || "");
    // A new 學院 invalidates any previously chosen 科系.
    setDepartmentCode("");
  };

  const onDepartmentChange = (id: Key | null) => {
    setDepartmentCode(id?.toString() || "");
  };

  // Keep the URL query string in sync with the current filters so the page
  // can be bookmarked or shared with the same search results restored.
  useEffect(() => {
    const params = new URLSearchParams();

    if (yms) params.set(PARAM_YMS, yms);
    if (departmentCode) params.set(PARAM_DEPARTMENT, departmentCode);
    if (keyword) params.set(PARAM_KEYWORD, keyword);

    setSearchParams(params, { replace: true });
    // setSearchParams is stable across renders (identity may change but
    // behavior doesn't); omitting it avoids re-running this effect from its
    // own updates while still reacting to filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yms, departmentCode, keyword]);

  // courses.json is the whole catalogue. The two index files are still fetched
  // because each carries ~200 courses courses.json does not have (ones no class
  // takes); without them those courses would silently stop being searchable.
  const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourseCatalog(yms);

  const { data: teacherIndex } = useCourseIndex<TeacherUnit>(
    yms,
    "teachers.json",
  );
  const { data: locationIndex } = useCourseIndex<LocationEntry>(
    yms,
    "locations.json",
  );

  const units = teacherIndex?.entries ?? [];

  // 學院→科系 master data. Failures/absence (e.g. an old year without a
  // backfilled file) are non-fatal: the department selector falls back to the
  // flat teacher units below, so course search keeps working.
  const { data: colleges = [] } = useFetchJson<CollegeItem[]>(
    yms
      ? `${siteConfig.links.github.api}/${year}/${semester}/departments.json`
      : null,
  );

  const loading = coursesLoading;
  const error = coursesError;
  const refetch = refetchCourses;

  const allCourses = useMemo(
    () => [
      ...buildCatalog(
        courses,
        teacherIndex?.extraCourses,
        locationIndex?.extraCourses,
      ).byCode.values(),
    ],
    [courses, teacherIndex, locationIndex],
  );

  // Use the 學院→科系 cascade when departments.json is available; otherwise
  // fall back to the flat teacher units so old years still filter by 科系.
  const useCascade = colleges.length > 0;

  // Reverse lookup 科系 (unt_id) -> 學院 (dpt_id), used to restore the college
  // selection from a URL that only carries the department (dept) param.
  const collegeByDepartment = useMemo(() => {
    const map = new Map<string, string>();

    colleges.forEach((college) => {
      college.departments.forEach((dept) => map.set(dept.code, college.code));
    });

    return map;
  }, [colleges]);

  // The 學院 actually in effect. The user's own pick always wins; otherwise it
  // is derived from a URL-restored department once colleges.json has loaded,
  // so the dependent 科系 selector has something to list.
  //
  // Computed here rather than written back into state from an effect: the
  // effect version re-rendered the whole page a second time on every
  // colleges.json load, purely to store a value that is a pure function of
  // state we already have.
  const collegeCode =
    pickedCollegeCode ??
    (departmentCode ? (collegeByDepartment.get(departmentCode) ?? "") : "");

  // 科系 options: the selected 學院's departments in cascade mode, or the flat
  // teacher units as a fallback when departments.json is unavailable.
  const departmentItems = useCascade
    ? (colleges.find((college) => college.code === collegeCode)?.departments ??
      [])
    : units;

  const hasFilter = keyword.trim().length > 0 || departmentCode.length > 0;

  const filteredCourses = useMemo(() => {
    if (!hasFilter) {
      return [];
    }

    const normalizedKeyword = keyword.trim().toLowerCase();

    return allCourses.filter((course) => {
      if (departmentCode && !course.departmentCodes?.includes(departmentCode)) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return (
        course.name.toLowerCase().includes(normalizedKeyword) ||
        course.code.toLowerCase().includes(normalizedKeyword) ||
        course.teacher.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [allCourses, keyword, departmentCode, hasFilter]);

  const renderResults = () => {
    if (!yms) {
      return <EmptyState title="請先選擇學年期" />;
    }

    if (error) {
      return <FetchError message="課程資料載入失敗。" onRetry={refetch} />;
    }

    if (loading) {
      return <LoadingState label="課程資料" />;
    }

    if (!hasFilter) {
      return (
        <EmptyState
          description="也可以只輸入教師姓名或課程代碼。"
          title="請輸入關鍵字或選擇系所以開始查詢課程"
        />
      );
    }

    if (filteredCourses.length === 0) {
      return (
        <EmptyState
          description="試試放寬系所條件，或改用更短的關鍵字。"
          title="查無符合的課程"
        />
      );
    }

    if (filteredCourses.length > MAX_DISPLAYED_COURSES) {
      return (
        <EmptyState
          description="請輸入更精確的關鍵字，或加上系所條件以縮小範圍。"
          title={`符合條件的課程共 ${filteredCourses.length} 筆，超過一次可顯示的上限`}
        />
      );
    }

    return (
      <>
        {addBlockedReason && (
          <Notice icon={<InformationCircleIcon width={18} />}>
            {addBlockedReason}
          </Notice>
        )}
        <SelectableCourseTable
          canAdd={canAdd}
          className="mt-4"
          columns={columns}
          courses={filteredCourses}
          yms={yms}
        />
        <WeeklySchedule
          courses={convertCourses(filteredCourses)}
          scheduleTitle="搜尋結果課表"
        />
      </>
    );
  };

  return (
    <DefaultLayout>
      <PageSection>
        <PageHeader
          actions={
            selectedCourses.length > 0 && (
              <>
                <Chip color="accent" size="sm" variant="tertiary">
                  已選 {selectedCourses.length} 門課程
                </Chip>
                <Link className="text-sm" href="/my-schedule">
                  前往我的課表 →
                </Link>
              </>
            )
          }
          className="mb-6 max-w-5xl"
          description="依學年度、系所或關鍵字查詢開課資料。"
          title="課程查詢"
        />
        {/* 篩選條件與標題、分隔線、結果共用同一個量測寬度並靠左，整頁才有
            一條連續的左緣。篩選列本身是靠左排列而不是置中：頁面其餘內容
            （標題、結果表格）都是靠左的，置中的篩選列看起來會像是沒對齊。 */}
        <div className="flex w-full max-w-5xl flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <YmsSelector
              className={FILTER_FIELD_CLASS}
              initialKey={yms || undefined}
              onChange={onYmsChange}
            />
            {useCascade && (
              <ItemSelector
                className={FILTER_FIELD_CLASS}
                items={colleges}
                label="選擇學院"
                placeholder="不限學院"
                selectedKey={collegeCode || null}
                onChange={onCollegeChange}
              />
            )}
            <ItemSelector
              className={FILTER_FIELD_CLASS}
              items={departmentItems}
              label="選擇系所"
              placeholder={
                useCascade && !collegeCode ? "請先選擇學院" : "不限系所"
              }
              selectedKey={departmentCode || null}
              onChange={onDepartmentChange}
            />
          </div>
          <SearchField className="w-full" value={keyword} onChange={setKeyword}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="輸入課程名稱、代碼或教師姓名搜尋" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <Separator className="my-6 max-w-5xl w-full" />
        {filteredCourses.length > 0 && (
          <div className="w-full max-w-5xl mx-auto text-right">
            共計：{filteredCourses.length} 筆資料
          </div>
        )}
        <div className="w-full max-w-5xl">{renderResults()}</div>
      </PageSection>
    </DefaultLayout>
  );
};

export default SearchPage;
