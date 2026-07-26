import { useMemo } from "react";

import { Course, CourseIndex, PartialCourse } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";
import { useFetchJson, UseFetchJsonResult } from "@/hooks/useFetchJson.ts";

const dataUrl = (yms: string, file: string): string | null => {
  if (!yms) return null;

  const [year, semester] = yms.split("#");

  return `${siteConfig.links.github.api}/${year}/${semester}/${file}`;
};

export interface CourseCatalog {
  /** 選課代碼 → 課程。索引檔與 /share 都靠這張表把代碼換回課程內容。 */
  byCode: Map<string, PartialCourse>;
}

/**
 * courses.json，全站唯一的課程來源。
 *
 * 用共用快取抓：同一個學年期在一次瀏覽中只會下載一次，所以「課程查詢」與三個
 * 課表頁之間切換不會重複付這份流量。
 */
export const useCourseCatalog = (yms: string): UseFetchJsonResult<Course[]> =>
  useFetchJson<Course[]>(dataUrl(yms, "courses.json"), { cache: true });

/**
 * 教師／地點／班級索引檔，形狀都是 { entries, extraCourses }。
 *
 * 統一格式前的 teachers.json / locations.json 頂層是陣列，而爬蟲只會重抓當前
 * 學年度 —— 舊學年期的檔案會一直是舊格式，當前學年度也有「courses.json 已更新、
 * 索引檔還沒」的空窗。直接讀會得到 undefined 的 entries，畫面就是一個沒有任何
 * 說明的空下拉選單。這裡把舊格式當成「尚未收錄」，讓頁面顯示既有的提示訊息。
 */
export const useCourseIndex = <T>(
  yms: string,
  file: string,
): UseFetchJsonResult<CourseIndex<T>> => {
  const result = useFetchJson<CourseIndex<T>>(dataUrl(yms, file), {
    cache: true,
  });

  const isLegacy = Array.isArray(result.data);

  return {
    ...result,
    data: isLegacy ? undefined : result.data,
    error: isLegacy
      ? new Error(`${file} is in the pre-unification format`)
      : result.error,
  };
};

/**
 * 把 courses.json 與各索引檔的 extraCourses 併成一張查表。
 *
 * extraCourses 是該來源看得到、但 courses.json 沒有的課（ag300 約 213 筆、
 * ag302 約 208 筆）。courses.json 的版本永遠優先，因為它欄位最完整。
 */
export const buildCatalog = (
  courses: Course[] | undefined,
  ...extras: (PartialCourse[] | undefined)[]
): CourseCatalog => {
  const byCode = new Map<string, PartialCourse>();

  extras.forEach((list) =>
    list?.forEach((course) => {
      if (course.code) byCode.set(course.code, course);
    }),
  );
  // Written last so the fuller record wins on collision.
  courses?.forEach((course) => byCode.set(course.code, course));

  return { byCode };
};

export interface ResolvedCourses {
  courses: PartialCourse[];
  /**
   * 索引裡有、但查不到課程內容的代碼數。爬蟲各自有排程，索引檔可能比
   * courses.json 新，所以這不是錯誤 —— 但要讓使用者知道有東西沒顯示，
   * 不能靜默少掉。
   */
  missing: number;
}

export const resolveCourses = (
  catalog: CourseCatalog,
  codes: string[] | undefined,
): ResolvedCourses => {
  const courses: PartialCourse[] = [];
  let missing = 0;

  codes?.forEach((code) => {
    const course = catalog.byCode.get(code);

    if (course) courses.push(course);
    else missing += 1;
  });

  return { courses, missing };
};

/** resolveCourses 的 memo 版本，給頁面直接用。 */
export const useResolvedCourses = (
  catalog: CourseCatalog,
  codes: string[] | undefined,
): ResolvedCourses =>
  useMemo(() => resolveCourses(catalog, codes), [catalog, codes]);
