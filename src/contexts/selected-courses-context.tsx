import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PartialCourse } from "@/interfaces/globals.ts";
import { getCourseKey, SelectedCourseMap } from "@/utils/course-key.ts";

const STORAGE_KEY = "my-schedule-selected-courses";
// The 學年期 the whole schedule belongs to. Courses may only be added from the
// school's current 學年期, so one value covers every course rather than needing
// a field on each of them — but it still has to be stored, because the current
// 學年期 rolls over while a saved schedule stays behind in localStorage.
const YMS_STORAGE_KEY = "my-schedule-yms";

const loadSelectedCourses = (): SelectedCourseMap => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (parsed && typeof parsed === "object") {
        // Schedules saved before the course-format unification are keyed
        // `${code}-${class}`; the key is now just the 選課代碼. Re-index them
        // from each record's own code so an existing schedule survives the
        // change instead of silently reading back as empty.
        return Object.fromEntries(
          Object.entries(parsed as SelectedCourseMap)
            .filter(([, course]) => course?.code)
            .map(([, course]) => [getCourseKey(course), course]),
        );
      }
    }
  } catch {
    // Silently fall back to an empty selection if localStorage is unavailable
    // or contains malformed data.
  }

  return {};
};

const saveSelectedCourses = (courses: SelectedCourseMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    // Silently ignore storage failures (e.g. private browsing quota).
  }
};

const loadScheduleYms = (): string | null => {
  try {
    // Schedules saved before this key existed read back as null and get
    // stamped with the current 學年期 on the next add. That can mislabel a
    // stale schedule, but it beats locking existing users out of their own
    // courses behind an "unknown semester" wall.
    return localStorage.getItem(YMS_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const saveScheduleYms = (yms: string | null) => {
  try {
    if (yms) {
      localStorage.setItem(YMS_STORAGE_KEY, yms);
    } else {
      localStorage.removeItem(YMS_STORAGE_KEY);
    }
  } catch {
    // Silently ignore storage failures (e.g. private browsing quota).
  }
};

interface SelectedCoursesContextValue {
  selectedCourses: PartialCourse[];
  /** The 學年期 every course in the schedule belongs to; null when empty. */
  scheduleYms: string | null;
  isSelected: (course: { code: string }) => boolean;
  /** Returns false when `yms` doesn't match the schedule's existing 學年期. */
  toggleCourse: (course: PartialCourse, yms: string) => boolean;
  addCourse: (course: PartialCourse, yms: string) => boolean;
  /** Adds many courses at once; returns how many were actually new. */
  importCourses: (courses: PartialCourse[], yms: string) => number;
  removeCourse: (course: { code: string }) => void;
  clearAll: () => void;
}

const SelectedCoursesContext =
  createContext<SelectedCoursesContextValue | null>(null);

export const SelectedCoursesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // Lazily read the persisted selection on first render instead of an effect,
  // so there is no extra render pass just to hydrate from localStorage.
  const [selectedMap, setSelectedMap] =
    useState<SelectedCourseMap>(loadSelectedCourses);
  const [storedYms, setStoredYms] = useState<string | null>(loadScheduleYms);

  // An empty schedule belongs to no 學年期, so the user can start a fresh one
  // by removing courses rather than having to reach for 清空所有課程. Derived
  // instead of cleared in removeCourse: the two can then never drift apart, and
  // removeCourse stays a pure updater that survives several removals batched
  // into one render.
  const scheduleYms = Object.keys(selectedMap).length === 0 ? null : storedYms;

  // Persist to localStorage on every change, keeping other tabs/pages consistent.
  useEffect(() => {
    saveSelectedCourses(selectedMap);
  }, [selectedMap]);

  useEffect(() => {
    saveScheduleYms(scheduleYms);
  }, [scheduleYms]);

  const isSelected = useCallback(
    (course: { code: string }) =>
      Object.prototype.hasOwnProperty.call(selectedMap, getCourseKey(course)),
    [selectedMap],
  );

  // A schedule holds exactly one 學年期. Once it has one, courses from any
  // other 學年期 are rejected outright rather than silently mixed in — the
  // callers gate on this too, this is the invariant behind that gating.
  const canAcceptYms = useCallback(
    (yms: string) => !!yms && (scheduleYms === null || scheduleYms === yms),
    [scheduleYms],
  );

  const addCourse = useCallback(
    (course: PartialCourse, yms: string) => {
      if (!canAcceptYms(yms)) return false;

      setStoredYms(yms);
      setSelectedMap((prev) => ({
        ...prev,
        [getCourseKey(course)]: course,
      }));

      return true;
    },
    [canAcceptYms],
  );

  const importCourses = useCallback(
    (courses: PartialCourse[], yms: string) => {
      if (!canAcceptYms(yms) || courses.length === 0) return 0;

      // Counted against the current map rather than inside the updater below:
      // the caller needs the number synchronously, and StrictMode invokes
      // updaters twice, which would double a counter incremented in there.
      const added = courses.filter(
        (course) => !(getCourseKey(course) in selectedMap),
      ).length;

      setSelectedMap((prev) => {
        const next = { ...prev };

        courses.forEach((course) => {
          next[getCourseKey(course)] = course;
        });

        return next;
      });
      setStoredYms(yms);

      return added;
    },
    [canAcceptYms, selectedMap],
  );

  const removeCourse = useCallback((course: { code: string }) => {
    const key = getCourseKey(course);

    setSelectedMap((prev) => {
      if (!(key in prev)) return prev;

      const next = { ...prev };

      delete next[key];

      return next;
    });
  }, []);

  const toggleCourse = useCallback(
    (course: PartialCourse, yms: string) => {
      if (isSelected(course)) {
        removeCourse(course);

        return true;
      }

      return addCourse(course, yms);
    },
    [isSelected, addCourse, removeCourse],
  );

  const clearAll = useCallback(() => {
    setSelectedMap({});
    setStoredYms(null);
  }, []);

  const selectedCourses = useMemo(
    () => Object.values(selectedMap),
    [selectedMap],
  );

  const value = useMemo<SelectedCoursesContextValue>(
    () => ({
      selectedCourses,
      scheduleYms,
      isSelected,
      toggleCourse,
      addCourse,
      importCourses,
      removeCourse,
      clearAll,
    }),
    [
      selectedCourses,
      scheduleYms,
      isSelected,
      toggleCourse,
      addCourse,
      importCourses,
      removeCourse,
      clearAll,
    ],
  );

  return (
    <SelectedCoursesContext.Provider value={value}>
      {children}
    </SelectedCoursesContext.Provider>
  );
};

export const useSelectedCourses = (): SelectedCoursesContextValue => {
  const context = useContext(SelectedCoursesContext);

  if (!context) {
    throw new Error(
      "useSelectedCourses must be used within a SelectedCoursesProvider",
    );
  }

  return context;
};
