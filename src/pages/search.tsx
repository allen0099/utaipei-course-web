import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router";
import { Button, Separator, SearchField, ToggleButton } from "@heroui/react";
import { Key } from "@react-types/shared";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/page-header.tsx";
import { SelectionBar } from "@/components/selection-bar.tsx";
import { SelectableCourseTable } from "@/components/selectable-course-table.tsx";
import {
  buildCourseColumns,
  CourseColumnKey,
} from "@/components/course-columns.tsx";
import { EmptyState, ListSkeleton, Notice } from "@/components/states.tsx";
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
import { SchedulePreview, slotKey } from "@/components/schedule-preview.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { findConflictsAgainstSchedule } from "@/utils/schedule-conflict.ts";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { useWishlist } from "@/contexts/wishlist-context.tsx";
import { useMediaQuery } from "@/hooks/useMediaQuery.ts";
import {
  buildCatalog,
  useCourseCatalog,
  useCourseIndex,
} from "@/hooks/useCourseCatalog.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { useCourseAddGate } from "@/hooks/useCourseAddGate.ts";
import { FetchError } from "@/components/fetch-error.tsx";
import { DataFreshness } from "@/components/data-freshness.tsx";

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
const PARAM_REQUIRED = "req";
const PARAM_CAMPUS = "campus";
const PARAM_TIME = "time";
const PARAM_STRICT = "strict";
const PARAM_FREE = "free";
const PARAM_SORT = "sort";

// 時段在網址裡寫成 "0-3.0-4"：用 "." 分隔是因為 "," 會被編成 %2C，貼出去的
// 連結會變得很難看。
const SLOT_PATTERN = /^[0-6]-([1-9]|1[0-4])$/;

const parseSlots = (value: string | null): Set<string> =>
  new Set((value ?? "").split(".").filter((key) => SLOT_PATTERN.test(key)));

const REQUIRED_OPTIONS = ["必修", "選修"];
const CAMPUS_OPTIONS = ["博愛", "天母"];

type SortKey = "" | "time" | "credits" | "name";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "", label: "預設順序" },
  { key: "time", label: "上課時間" },
  { key: "credits", label: "學分（多到少）" },
  { key: "name", label: "課程名稱" },
];

// 通識與體育不掛在任何系所底下，只能靠開課班級名稱找到，而那正是新生最常找
// 的兩類課。做成按鈕直接填關鍵字，而不是另一種隱形的篩選狀態 —— 使用者看得到
// 它做了什麼，也能自己改。
const QUICK_KEYWORDS = ["通識課程", "體育課程"];

const NO_SLOTS = new Set<string>();
const noop = () => {};

// 與 Tailwind 的 xl 同寬：夠放下「結果表格 + 迷你課表」兩欄的最小寬度。
const SIDE_BY_SIDE_QUERY = "(min-width: 1280px)";

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
  const [required, setRequired] = useState<string>(
    () => searchParams.get(PARAM_REQUIRED) || "",
  );
  const [campus, setCampus] = useState<string>(
    () => searchParams.get(PARAM_CAMPUS) || "",
  );
  const [slots, setSlots] = useState<Set<string>>(() =>
    parseSlots(searchParams.get(PARAM_TIME)),
  );
  // 寬鬆（預設）：課程只要有任何一節落在所選時段就算；嚴格：每一節都要落在
  // 所選時段內，也就是「我只有這些時間有空」。
  const [strictTime, setStrictTime] = useState<boolean>(
    () => searchParams.get(PARAM_STRICT) === "1",
  );
  const [freeOnly, setFreeOnly] = useState<boolean>(
    () => searchParams.get(PARAM_FREE) === "1",
  );
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const value = searchParams.get(PARAM_SORT);

    return SORT_OPTIONS.some((option) => option.key === value)
      ? (value as SortKey)
      : "";
  });
  // 迷你課表上正在預覽的那一筆結果。
  const [previewCourse, setPreviewCourse] = useState<PartialCourse | null>(
    null,
  );
  // 手機上展開了哪一張結果卡片的時段預覽。觸控沒有 hover，所以桌機「滑過就
  // 預覽」在手機上改成卡片裡的一顆按鈕；一次只開一張，列表才不會被撐得很長。
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  // 逐鍵輸入時輸入框要立刻跟上，但對三千門課重新篩選＋重繪兩百列可以慢半拍。
  const deferredKeyword = useDeferredValue(keyword);
  const isSideBySide = useMediaQuery(SIDE_BY_SIDE_QUERY);
  const { selectedCourses, scheduleYms } = useSelectedCourses();
  const { wishlist, wishlistYms } = useWishlist();
  const [year, semester] = yms.split("#");

  // Skip clearing the restored department filter the first time YmsSelector
  // reports back its (possibly URL-restored) initial value on mount.
  const isInitialYmsChange = useRef(true);
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
    if (required) params.set(PARAM_REQUIRED, required);
    if (campus) params.set(PARAM_CAMPUS, campus);
    if (slots.size > 0) params.set(PARAM_TIME, [...slots].sort().join("."));
    if (strictTime) params.set(PARAM_STRICT, "1");
    if (freeOnly) params.set(PARAM_FREE, "1");
    if (sortKey) params.set(PARAM_SORT, sortKey);

    setSearchParams(params, { replace: true });
    // setSearchParams is stable across renders (identity may change but
    // behavior doesn't); omitting it avoids re-running this effect from its
    // own updates while still reacting to filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    yms,
    departmentCode,
    keyword,
    required,
    campus,
    slots,
    strictTime,
    freeOnly,
    sortKey,
  ]);

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

  // 每門課佔哪些格子。時段篩選、不衝堂篩選、依時間排序和迷你課表預覽都要用，
  // 所以整學期算一次，而不是每次篩選各自再解析一遍時間字串。
  const slotsByCode = useMemo(() => {
    const map = new Map<string, ReturnType<typeof convertCourses>>();

    allCourses.forEach((course) => {
      map.set(course.code, convertCourses([course]));
    });

    return map;
  }, [allCourses]);

  // 我的課表只屬於一個學年期；看別的學年期時，拿它來比衝堂沒有意義。
  const scheduleApplies = scheduleYms !== null && scheduleYms === yms;
  const scheduledSlots = useMemo(
    () => (scheduleApplies ? convertCourses(selectedCourses) : []),
    [scheduleApplies, selectedCourses],
  );

  const wishedSlots = useMemo(
    () => (wishlistYms === yms ? convertCourses(wishlist) : []),
    [wishlist, wishlistYms, yms],
  );

  const conflictingCodes = useMemo(() => {
    if (scheduledSlots.length === 0) return new Set<string>();

    return new Set(
      findConflictsAgainstSchedule(
        [...slotsByCode.values()].flat(),
        scheduledSlots,
      ).keys(),
    );
  }, [slotsByCode, scheduledSlots]);

  const hasFilter =
    deferredKeyword.trim().length > 0 ||
    departmentCode.length > 0 ||
    required.length > 0 ||
    campus.length > 0 ||
    slots.size > 0;

  // 除了 `skip` 指定的那一個面向以外，這門課符不符合目前所有條件。每個面向的
  // 筆數要用「其他條件都套用、唯獨自己不套用」來算 —— 否則選了必修之後，選修
  // 旁邊的數字就會變成 0，看不出切過去會有幾筆。
  const matches = useCallback(
    (course: PartialCourse, skip?: "required" | "campus") => {
      if (departmentCode && !course.departmentCodes?.includes(departmentCode)) {
        return false;
      }

      if (skip !== "required" && required && course.required !== required) {
        return false;
      }

      if (skip !== "campus" && campus && course.campus !== campus) {
        return false;
      }

      if (slots.size > 0) {
        const keys = (slotsByCode.get(course.code) ?? []).flatMap((slot) =>
          Array.from({ length: slot.duration || 1 }, (_, index) =>
            slotKey(slot.day, slot.period + index),
          ),
        );

        // 沒有排定時間的課（論文、專題）不屬於任何時段。
        if (keys.length === 0) return false;

        const hit = strictTime
          ? keys.every((key) => slots.has(key))
          : keys.some((key) => slots.has(key));

        if (!hit) return false;
      }

      if (freeOnly && scheduleApplies && conflictingCodes.has(course.code)) {
        return false;
      }

      const normalizedKeyword = deferredKeyword.trim().toLowerCase();

      if (!normalizedKeyword) return true;

      return [
        course.name,
        course.nameEn,
        course.code,
        course.teacher,
        course.class,
        course.classroom,
      ].some((field) => field?.toLowerCase().includes(normalizedKeyword));
    },
    [
      departmentCode,
      required,
      campus,
      slots,
      strictTime,
      freeOnly,
      scheduleApplies,
      conflictingCodes,
      slotsByCode,
      deferredKeyword,
    ],
  );

  const filteredCourses = useMemo(() => {
    if (!hasFilter) {
      return [];
    }

    const result = allCourses.filter((course) => matches(course));

    if (!sortKey) return result;

    const firstSlot = (course: PartialCourse) => {
      const first = slotsByCode.get(course.code)?.[0];

      // 沒有時間的課排最後。
      return first ? first.day * 100 + first.period : Number.MAX_SAFE_INTEGER;
    };

    // 排序要在截斷成前 200 筆之前做：只排畫面上那 200 筆的話，「學分最多」
    // 排出來的會是「前 200 筆裡學分最多」。
    return [...result].sort((x, y) => {
      if (sortKey === "time") return firstSlot(x) - firstSlot(y);
      if (sortKey === "credits") {
        return (
          (Number.parseFloat(y.credits ?? "") || 0) -
          (Number.parseFloat(x.credits ?? "") || 0)
        );
      }

      return x.name.localeCompare(y.name, "zh-Hant");
    });
  }, [allCourses, hasFilter, matches, sortKey, slotsByCode]);

  const facetCounts = useMemo(() => {
    const count = (
      facet: "required" | "campus",
      options: string[],
    ): Record<string, number> =>
      Object.fromEntries(
        options.map((option) => [
          option,
          allCourses.filter(
            (course) => course[facet] === option && matches(course, facet),
          ).length,
        ]),
      );

    return {
      required: count("required", REQUIRED_OPTIONS),
      campus: count("campus", CAMPUS_OPTIONS),
    };
  }, [allCourses, matches]);

  const toggleSlot = (key: string) => {
    setSlots((current) => {
      const next = new Set(current);

      if (!next.delete(key)) next.add(key);

      return next;
    });
  };

  const clearFilters = () => {
    setKeyword("");
    setRequired("");
    setCampus("");
    setSlots(new Set());
    setStrictTime(false);
    setFreeOnly(false);
  };

  const activeFilterCount =
    (keyword ? 1 : 0) +
    (required ? 1 : 0) +
    (campus ? 1 : 0) +
    (slots.size > 0 ? 1 : 0) +
    (freeOnly ? 1 : 0);

  const schedulePreview = (
    <SchedulePreview
      preview={
        previewCourse ? (slotsByCode.get(previewCourse.code) ?? []) : undefined
      }
      previewName={previewCourse?.name}
      scheduled={scheduledSlots}
      selectedSlots={slots}
      wished={wishedSlots}
      onClearSlots={() => setSlots(new Set())}
      onToggleSlot={toggleSlot}
    />
  );

  const renderResults = () => {
    if (!yms) {
      return <EmptyState title="請先選擇學年期" />;
    }

    if (error) {
      return <FetchError message="課程資料載入失敗。" onRetry={refetch} />;
    }

    if (loading) {
      return <ListSkeleton className="mt-4" label="課程資料" />;
    }

    if (!hasFilter) {
      return (
        <EmptyState
          description="也可以只輸入教師姓名、教室或課程代碼，或在課表上點選想找課的時段。"
          title="請輸入關鍵字或選擇系所以開始查詢課程"
        />
      );
    }

    if (filteredCourses.length === 0) {
      return (
        <EmptyState
          action={
            activeFilterCount > 0 ? (
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onPress={clearFilters}
              >
                清除篩選條件
              </Button>
            ) : undefined
          }
          description="試試放寬系所或時段條件，或改用更短的關鍵字。"
          title="查無符合的課程"
        />
      );
    }

    // Over the cap we still show the first ${MAX_DISPLAYED_COURSES}: rendering
    // nothing made "too many matches" look identical to "no matches", and the
    // advice it gave ("加上系所條件以縮小範圍") is impossible to follow once a
    // 系所 is already picked -- that is the narrowest filter this page has.
    // 音樂學系 (320 courses) and 進修推廣處 (274) are past the cap on their own,
    // so their students could never browse their own department at all.
    const isTruncated = filteredCourses.length > MAX_DISPLAYED_COURSES;
    const displayedCourses = isTruncated
      ? filteredCourses.slice(0, MAX_DISPLAYED_COURSES)
      : filteredCourses;

    return (
      <>
        {addBlockedReason && (
          <Notice icon={<InformationCircleIcon width={18} />} tone="info">
            {addBlockedReason}
          </Notice>
        )}
        {isTruncated && (
          <Notice
            className="mt-4"
            icon={<InformationCircleIcon width={18} />}
            tone="info"
          >
            共 {filteredCourses.length} 筆符合，先顯示前 {MAX_DISPLAYED_COURSES}{" "}
            筆。輸入關鍵字可以縮小範圍，找到其餘{" "}
            {filteredCourses.length - MAX_DISPLAYED_COURSES} 筆課程。
          </Notice>
        )}
        <SelectableCourseTable
          canAdd={canAdd}
          cardFooter={(course) => {
            const courseSlots = slotsByCode.get(course.code) ?? [];

            // 沒有排定時間的課沒有東西可以畫。
            if (courseSlots.length === 0) return null;

            const isExpanded = expandedCode === course.code;

            return (
              <div className="mt-3">
                <Button
                  aria-expanded={isExpanded}
                  size="sm"
                  variant="tertiary"
                  onPress={() =>
                    setExpandedCode(isExpanded ? null : course.code)
                  }
                >
                  {isExpanded ? "收起時段" : "在課表上看時段"}
                </Button>
                {isExpanded && (
                  <SchedulePreview
                    readOnly
                    className="mt-2"
                    preview={courseSlots}
                    previewName={course.name}
                    scheduled={scheduledSlots}
                    selectedSlots={NO_SLOTS}
                    wished={wishedSlots}
                    onClearSlots={noop}
                    onToggleSlot={noop}
                  />
                )}
              </div>
            );
          }}
          className="mt-4"
          columns={columns}
          courses={displayedCourses}
          yms={yms}
          onRowHover={setPreviewCourse}
        />
      </>
    );
  };

  return (
    <DefaultLayout wide>
      <PageSection align="stretch">
        <PageHeader
          className="mb-6"
          description="依學年度、系所或關鍵字查詢開課資料。"
          title="課程查詢"
        />
        {/* 篩選條件與標題、分隔線、結果共用同一個量測寬度並靠左，整頁才有
            一條連續的左緣。篩選列本身是靠左排列而不是置中：頁面其餘內容
            （標題、結果表格）都是靠左的，置中的篩選列看起來會像是沒對齊。 */}
        <div className="flex w-full flex-col gap-4">
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
              <SearchField.Input placeholder="輸入課程名稱、代碼、教師或教室搜尋" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted">快速查詢</span>
              {QUICK_KEYWORDS.map((quick) => (
                <Button
                  key={quick}
                  size="sm"
                  variant="secondary"
                  onPress={() => setKeyword(quick)}
                >
                  {quick.replace("課程", "")}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted">必選修</span>
              {REQUIRED_OPTIONS.map((option) => (
                <ToggleButton
                  key={option}
                  isSelected={required === option}
                  size="sm"
                  onChange={(selected) => setRequired(selected ? option : "")}
                >
                  {option}
                  {hasFilter && (
                    <span className="text-xs opacity-70 tabular-nums">
                      {facetCounts.required[option]}
                    </span>
                  )}
                </ToggleButton>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted">校區</span>
              {CAMPUS_OPTIONS.map((option) => (
                <ToggleButton
                  key={option}
                  isSelected={campus === option}
                  size="sm"
                  onChange={(selected) => setCampus(selected ? option : "")}
                >
                  {option}
                  {hasFilter && (
                    <span className="text-xs opacity-70 tabular-nums">
                      {facetCounts.campus[option]}
                    </span>
                  )}
                </ToggleButton>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ToggleButton
                // 沒有可比對的課表時這個條件什麼都不會濾掉，與其讓它看起來
                // 有作用，不如直接停用。
                isDisabled={!scheduleApplies}
                isSelected={freeOnly && scheduleApplies}
                size="sm"
                onChange={setFreeOnly}
              >
                只顯示不衝堂
              </ToggleButton>
              {slots.size > 0 && (
                <ToggleButton
                  isSelected={strictTime}
                  size="sm"
                  onChange={setStrictTime}
                >
                  每一節都在所選時段內
                </ToggleButton>
              )}
            </div>

            <label className="flex items-center gap-2">
              <span className="text-muted">排序</span>
              <select
                className="rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {activeFilterCount > 0 && (
              <Button size="sm" variant="ghost" onPress={clearFilters}>
                清除全部條件
              </Button>
            )}
          </div>
        </div>
        <Separator className="my-6 w-full" />

        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start xl:gap-6">
          <div className="min-w-0">
            {/* 窄螢幕放不下並排的兩欄，迷你課表收進可展開的區塊；有時段條件時
                預設展開，否則使用者看不到是什麼在限制結果。只渲染其中一份
                （見 useMediaQuery），兩份同時存在的話 aria-live 會念兩次。 */}
            {!isSideBySide && yms && (
              <details
                className="mb-4 rounded-lg border border-border"
                open={slots.size > 0}
              >
                <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">
                  我的課表與時段篩選
                  {slots.size > 0 && (
                    <span className="ml-2 text-xs text-muted">
                      已選 {slots.size} 個時段
                    </span>
                  )}
                </summary>
                <div className="px-4 pb-4">{schedulePreview}</div>
              </details>
            )}
            {filteredCourses.length > 0 && (
              <div className="flex w-full flex-wrap items-baseline justify-between gap-x-4 text-sm">
                <DataFreshness className="text-xs text-muted" yms={yms} />
                <span aria-live="polite" className="ml-auto">
                  共計：{filteredCourses.length} 筆資料
                </span>
              </div>
            )}
            {renderResults()}
          </div>
          {isSideBySide && yms && (
            // top-20：避開 sticky 的 navbar。
            <aside className="sticky top-20 rounded-lg border border-border p-4">
              <h2 className="mb-3 text-sm font-semibold">
                我的課表
                {scheduleApplies && (
                  <span className="ml-2 font-normal text-muted">
                    已選 {selectedCourses.length} 門
                  </span>
                )}
              </h2>
              {schedulePreview}
            </aside>
          )}
        </div>
      </PageSection>
      <SelectionBar />
    </DefaultLayout>
  );
};

export default SearchPage;
