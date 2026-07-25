import { useMemo } from "react";

import { CourseItem, WeeklyScheduleCourse } from "@/interfaces/globals.ts";
import { convertCourses } from "@/utils/convert-course.ts";
import { findScheduleConflicts } from "@/utils/schedule-conflict.ts";

export interface UseScheduleSlotsResult {
  /** One entry per weekly time slot, ready for <WeeklySchedule courses={…}>. */
  scheduleCourses: WeeklyScheduleCourse[];
  /** Course code → names of the other courses it overlaps with. */
  conflictNamesByCourseCode: Map<string, Set<string>>;
  /** Just the keys, for <WeeklySchedule conflictCourseCodes={…}>. */
  conflictCourseCodes: string[];
  hasConflicts: boolean;
}

/**
 * Turns a flat course list into the weekly grid plus its 衝堂 annotations.
 *
 * 我的課表 and the shared read-only schedule render the exact same thing from
 * the exact same inputs, so the whole pipeline lives here rather than being
 * copied into both pages.
 */
export const useScheduleSlots = (
  courses: CourseItem[],
): UseScheduleSlotsResult => {
  const scheduleCourses = useMemo(() => convertCourses(courses), [courses]);

  const conflicts = useMemo(
    () => findScheduleConflicts(scheduleCourses),
    [scheduleCourses],
  );

  const conflictNamesByCourseCode = useMemo(() => {
    const result = new Map<string, Set<string>>();

    conflicts.forEach((conflict) => {
      const slot = scheduleCourses.find((c) => c.id === conflict.slotId);

      if (!slot) return;

      const names = result.get(slot.code) || new Set<string>();

      conflict.conflictingSlotIds.forEach((otherId) => {
        const otherSlot = scheduleCourses.find((c) => c.id === otherId);

        if (otherSlot && otherSlot.code !== slot.code) {
          names.add(otherSlot.name);
        }
      });

      result.set(slot.code, names);
    });

    return result;
  }, [conflicts, scheduleCourses]);

  const conflictCourseCodes = useMemo(
    () => Array.from(conflictNamesByCourseCode.keys()),
    [conflictNamesByCourseCode],
  );

  return {
    scheduleCourses,
    conflictNamesByCourseCode,
    conflictCourseCodes,
    hasConflicts: conflictNamesByCourseCode.size > 0,
  };
};
