import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { MergedCourseItem } from "@/interfaces/globals.ts";
import { getCourseKey, SelectedCourseMap } from "@/utils/course-key.ts";

const STORAGE_KEY = "my-schedule-selected-courses";

const loadSelectedCourses = (): SelectedCourseMap => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (parsed && typeof parsed === "object") {
        return parsed as SelectedCourseMap;
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

interface SelectedCoursesContextValue {
  selectedCourses: MergedCourseItem[];
  isSelected: (course: { code: string; class: string }) => boolean;
  toggleCourse: (course: MergedCourseItem) => void;
  addCourse: (course: MergedCourseItem) => void;
  removeCourse: (course: { code: string; class: string }) => void;
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

  // Persist to localStorage on every change, keeping other tabs/pages consistent.
  useEffect(() => {
    saveSelectedCourses(selectedMap);
  }, [selectedMap]);

  const isSelected = useCallback(
    (course: { code: string; class: string }) =>
      Object.prototype.hasOwnProperty.call(selectedMap, getCourseKey(course)),
    [selectedMap],
  );

  const addCourse = useCallback((course: MergedCourseItem) => {
    setSelectedMap((prev) => ({
      ...prev,
      [getCourseKey(course)]: course,
    }));
  }, []);

  const removeCourse = useCallback(
    (course: { code: string; class: string }) => {
      setSelectedMap((prev) => {
        const key = getCourseKey(course);

        if (!(key in prev)) return prev;

        const next = { ...prev };

        delete next[key];

        return next;
      });
    },
    [],
  );

  const toggleCourse = useCallback(
    (course: MergedCourseItem) => {
      if (isSelected(course)) {
        removeCourse(course);
      } else {
        addCourse(course);
      }
    },
    [isSelected, addCourse, removeCourse],
  );

  const clearAll = useCallback(() => {
    setSelectedMap({});
  }, []);

  const selectedCourses = useMemo(
    () => Object.values(selectedMap),
    [selectedMap],
  );

  const value = useMemo<SelectedCoursesContextValue>(
    () => ({
      selectedCourses,
      isSelected,
      toggleCourse,
      addCourse,
      removeCourse,
      clearAll,
    }),
    [
      selectedCourses,
      isSelected,
      toggleCourse,
      addCourse,
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
