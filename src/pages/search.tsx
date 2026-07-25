import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Separator, SearchField, Checkbox, Chip, Link } from "@heroui/react";
import { Key } from "@react-types/shared";

import { PageHeader } from "@/components/page-header.tsx";
import { DataTable, DataTableColumn } from "@/components/data-table.tsx";
import { EmptyState, LoadingState } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";
import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import {
  CollegeItem,
  LocationItem,
  MergedCourseItem,
  Units,
} from "@/interfaces/globals.ts";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import {
  dedupeCourses,
  flattenLocations,
  flattenTeacherUnits,
  mergeCourseSources,
} from "@/utils/merge-courses.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";

const MAX_DISPLAYED_COURSES = 200;

// Percentages sum to ~92% (the checkbox column takes the rest).
const COLUMNS: DataTableColumn<MergedCourseItem>[] = [
  {
    key: "code",
    label: "課程代碼",
    headerLabel: "代碼",
    width: "w-[9%]",
    cellClassName: "tabular-nums text-muted",
    // Promoted to the mobile card header.
    hideOnCard: true,
  },
  {
    key: "name",
    label: "課程名稱",
    width: "w-[16%]",
    cellClassName: "font-medium text-foreground",
    hideOnCard: true,
  },
  {
    key: "departments",
    label: "系所",
    render: (item) => item.departments?.join("、") || "-",
    width: "w-[26%]",
    cellClassName: "text-muted",
  },
  { key: "class", label: "班級名稱", headerLabel: "班級", width: "w-[9%]" },
  { key: "teacher", label: "教師", width: "w-[12%]" },
  {
    key: "time",
    label: "時間",
    width: "w-[12%]",
    cellClassName: "tabular-nums text-foreground/80",
  },
  {
    key: "classroom",
    label: "教室",
    width: "w-[12%]",
    cellClassName: "text-foreground/80",
  },
];

const CourseTable = ({ courses }: { courses: MergedCourseItem[] }) => {
  const { isSelected, toggleCourse } = useSelectedCourses();

  return (
    <DataTable
      cardSubtitle={(item) => item.code}
      cardTitle={(item) => item.name}
      className="mt-4"
      columns={COLUMNS}
      leading={{
        label: "加入",
        render: (item) => (
          <Checkbox
            aria-label={`將 ${item.name} (${item.class}) 加入我的課表`}
            isSelected={isSelected(item)}
            onChange={() => toggleCourse(item)}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>
        ),
      }}
      rowKey={(item, index) => `${item.code}-${item.class}-${index}`}
      rows={courses}
    />
  );
};

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

  // Fetched in parallel: teachers.json and locations.json are independent
  // sources merged below into a single course list.
  const {
    data: units = [],
    loading: unitsLoading,
    error: unitsError,
    refetch: refetchUnits,
  } = useFetchJson<Units[]>(
    yms
      ? `${siteConfig.links.github.api}/${year}/${semester}/teachers.json`
      : null,
  );

  const {
    data: locations = [],
    loading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useFetchJson<LocationItem[]>(
    yms
      ? `${siteConfig.links.github.api}/${year}/${semester}/locations.json`
      : null,
  );

  // 學院→科系 master data. Failures/absence (e.g. an old year without a
  // backfilled file) are non-fatal: the department selector falls back to the
  // flat teacher units below, so course search keeps working.
  const { data: colleges = [] } = useFetchJson<CollegeItem[]>(
    yms
      ? `${siteConfig.links.github.api}/${year}/${semester}/departments.json`
      : null,
  );

  const loading = unitsLoading || locationsLoading;
  const error = unitsError || locationsError;
  const refetch = () => {
    refetchUnits();
    refetchLocations();
  };

  const allCourses = useMemo(
    () =>
      dedupeCourses(
        mergeCourseSources(
          flattenTeacherUnits(units),
          flattenLocations(locations),
        ),
      ),
    [units, locations],
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
        <CourseTable courses={filteredCourses} />
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
          className="mb-6"
          description="依學年度、系所或關鍵字查詢開課資料。"
          title="課程查詢"
        />
        <div className="flex flex-col md:flex-row flex-wrap justify-center gap-4 w-full max-w-4xl items-center">
          <YmsSelector initialKey={yms || undefined} onChange={onYmsChange} />
          {useCascade && (
            <ItemSelector
              items={colleges}
              label="選擇學院"
              placeholder="不限學院"
              selectedKey={collegeCode || null}
              onChange={onCollegeChange}
            />
          )}
          <ItemSelector
            items={departmentItems}
            label="選擇系所"
            placeholder={
              useCascade && !collegeCode ? "請先選擇學院" : "不限系所"
            }
            selectedKey={departmentCode || null}
            onChange={onDepartmentChange}
          />
        </div>
        <SearchField
          className="max-w-2xl w-full mt-4"
          value={keyword}
          onChange={setKeyword}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="輸入課程名稱、代碼或教師姓名搜尋" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Separator className="my-6 max-w-5xl w-full" />
        <div className="w-full max-w-5xl">{renderResults()}</div>
      </PageSection>
    </DefaultLayout>
  );
};

export default SearchPage;
