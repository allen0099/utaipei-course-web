import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Separator,
  SearchField,
  Spinner,
  Checkbox,
  Chip,
  Link,
} from "@heroui/react";
import { Key } from "@react-types/shared";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { LocationItem, MergedCourseItem, Units } from "@/interfaces/globals.ts";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import {
  flattenLocations,
  flattenTeacherUnits,
  mergeCourseSources,
} from "@/utils/merge-courses.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";

const MAX_DISPLAYED_COURSES = 200;

const COLUMNS: { key: keyof MergedCourseItem; label: string }[] = [
  { key: "code", label: "課程代碼" },
  { key: "name", label: "課程名稱" },
  { key: "department", label: "系所" },
  { key: "class", label: "班級名稱" },
  { key: "teacher", label: "教師" },
  { key: "time", label: "時間" },
  { key: "classroom", label: "教室" },
];

const CourseTable = ({ courses }: { courses: MergedCourseItem[] }) => {
  const { isSelected, toggleCourse } = useSelectedCourses();

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-700">
            <th className="text-left p-2 whitespace-nowrap">加入課表</th>
            {COLUMNS.map((column) => (
              <th key={column.key} className="text-left p-2 whitespace-nowrap">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {courses.map((item, index) => (
            <tr
              key={`${item.code}-${item.class}-${index}`}
              className="border-b border-gray-200 dark:border-gray-800"
            >
              <td className="p-2 whitespace-nowrap">
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
              </td>
              {COLUMNS.map((column) => (
                <td key={column.key} className="p-2 whitespace-nowrap">
                  {item[column.key] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      setDepartmentCode("");
    }
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

  const loading = unitsLoading || locationsLoading;
  const error = unitsError || locationsError;
  const refetch = () => {
    refetchUnits();
    refetchLocations();
  };

  const allCourses = useMemo(
    () =>
      mergeCourseSources(
        flattenTeacherUnits(units),
        flattenLocations(locations),
      ),
    [units, locations],
  );

  const hasFilter = keyword.trim().length > 0 || departmentCode.length > 0;

  const filteredCourses = useMemo(() => {
    if (!hasFilter) {
      return [];
    }

    const normalizedKeyword = keyword.trim().toLowerCase();

    return allCourses.filter((course) => {
      if (departmentCode && course.departmentCode !== departmentCode) {
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
      return <h3 className="text-lg text-center">請先選擇學年期</h3>;
    }

    if (error) {
      return <FetchError message="課程資料載入失敗。" onRetry={refetch} />;
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2">
          <Spinner />
          <span>載入課程資料中...</span>
        </div>
      );
    }

    if (!hasFilter) {
      return (
        <h3 className="text-lg text-center">
          請輸入關鍵字或選擇系所以開始查詢課程
        </h3>
      );
    }

    if (filteredCourses.length === 0) {
      return <div className="mt-4 text-center">查無符合的課程</div>;
    }

    if (filteredCourses.length > MAX_DISPLAYED_COURSES) {
      return (
        <div className="mt-4 text-center">
          符合條件的課程共 {filteredCourses.length}{" "}
          筆，請輸入更精確的關鍵字以縮小範圍
        </div>
      );
    }

    return (
      <>
        <CourseTable courses={filteredCourses} />
        <WeeklySchedule
          className="mt-5"
          courses={convertCourses(filteredCourses)}
          scheduleTitle="搜尋結果課表"
        />
      </>
    );
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center py-8 md:py-10 w-full">
        <div className="inline-block max-w-lg text-center justify-center mb-4">
          <h1 className={title()}>課程查詢</h1>
        </div>
        {selectedCourses.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Chip color="accent" size="sm" variant="tertiary">
              已選 {selectedCourses.length} 門課程
            </Chip>
            <Link className="text-sm" href="/my-schedule">
              前往我的課表 →
            </Link>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center">
          <YmsSelector initialKey={yms || undefined} onChange={onYmsChange} />
          <ItemSelector
            items={units}
            label="選擇系所"
            placeholder="不限系所"
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
      </section>
    </DefaultLayout>
  );
};

export default SearchPage;
