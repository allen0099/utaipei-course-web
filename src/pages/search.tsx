import { useEffect, useMemo, useState } from "react";
import { Separator, SearchField } from "@heroui/react";
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

const CourseTable = ({ courses }: { courses: MergedCourseItem[] }) => (
  <div className="mt-4 overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-300 dark:border-gray-700">
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

export const SearchPage = () => {
  const [yms, setYms] = useState<string>("");
  const [units, setUnits] = useState<Units[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [keyword, setKeyword] = useState<string>("");
  const [departmentCode, setDepartmentCode] = useState<string>("");

  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
    setDepartmentCode("");
    setUnits([]);
    setLocations([]);
  };

  const onDepartmentChange = (id: Key | null) => {
    setDepartmentCode(id?.toString() || "");
  };

  useEffect(() => {
    if (!yms) {
      return;
    }

    const [year, semester] = yms.split("#");
    const fetchJson = <T,>(url: string, fallback: T): Promise<T> =>
      fetch(url)
        .then((res) => (res.ok ? res.json() : fallback))
        .catch(() => fallback);

    Promise.all([
      fetchJson<Units[]>(
        `${siteConfig.links.github.api}/${year}/${semester}/teachers.json`,
        [],
      ),
      fetchJson<LocationItem[]>(
        `${siteConfig.links.github.api}/${year}/${semester}/locations.json`,
        [],
      ),
    ]).then(([teacherData, locationData]: [Units[], LocationItem[]]) => {
      setUnits(teacherData);
      setLocations(locationData);
    });
  }, [yms]);

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
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center">
          <YmsSelector onChange={onYmsChange} />
          <ItemSelector
            items={units}
            label="選擇系所"
            placeholder="不限系所"
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
