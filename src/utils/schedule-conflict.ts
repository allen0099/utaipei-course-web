import { WeeklyScheduleCourse } from "@/interfaces/globals.ts";

// Two schedule slots conflict when they land on the same day and their
// period ranges overlap.
const periodsOverlap = (
  a: WeeklyScheduleCourse,
  b: WeeklyScheduleCourse,
): boolean => {
  if (a.day !== b.day) return false;

  const aStart = a.period;
  const aEnd = a.period + (a.duration || 1) - 1;
  const bStart = b.period;
  const bEnd = b.period + (b.duration || 1) - 1;

  return aStart <= bEnd && bStart <= aEnd;
};

export interface CourseConflict {
  // Slot ids (WeeklyScheduleCourse.id) that conflict with each other.
  slotId: string;
  conflictingSlotIds: string[];
  // Course codes (distinct from slotId's own course) this slot conflicts with.
  conflictingCourseCodes: string[];
}

// Build a conflict map keyed by WeeklyScheduleCourse.id for every slot that
// overlaps with a slot belonging to a *different* course. Overlapping slots
// that belong to the same course (e.g. a class meeting twice a week) are not
// considered conflicts.
export const findScheduleConflicts = (
  courses: WeeklyScheduleCourse[],
): Map<string, CourseConflict> => {
  const conflicts = new Map<string, CourseConflict>();

  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i];
      const b = courses[j];

      if (a.code === b.code) continue;
      if (!periodsOverlap(a, b)) continue;

      const addConflict = (
        self: WeeklyScheduleCourse,
        other: WeeklyScheduleCourse,
      ) => {
        const existing = conflicts.get(self.id);

        if (existing) {
          if (!existing.conflictingSlotIds.includes(other.id)) {
            existing.conflictingSlotIds.push(other.id);
          }
          if (!existing.conflictingCourseCodes.includes(other.code)) {
            existing.conflictingCourseCodes.push(other.code);
          }
        } else {
          conflicts.set(self.id, {
            slotId: self.id,
            conflictingSlotIds: [other.id],
            conflictingCourseCodes: [other.code],
          });
        }
      };

      addConflict(a, b);
      addConflict(b, a);
    }
  }

  return conflicts;
};
