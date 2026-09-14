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

/**
 * Which already-scheduled courses each candidate would clash with.
 *
 * findScheduleConflicts answers "what clashes inside this one schedule",
 * which only helps once a course is already added. 課程查詢 needs the
 * question asked the other way round -- "would adding this clash with what I
 * already have" -- so the warning can be shown on the row *before* the user
 * commits to it.
 *
 * Returns course code → names of the existing courses it overlaps with.
 * Candidates already in the schedule are skipped: a course cannot clash with
 * itself, and it is the schedule's own conflict display that covers those.
 */
export const findConflictsAgainstSchedule = (
  candidates: WeeklyScheduleCourse[],
  scheduled: WeeklyScheduleCourse[],
): Map<string, Set<string>> => {
  const result = new Map<string, Set<string>>();

  if (scheduled.length === 0) return result;

  const scheduledCodes = new Set(scheduled.map((slot) => slot.code));

  for (const candidate of candidates) {
    if (scheduledCodes.has(candidate.code)) continue;

    for (const slot of scheduled) {
      if (!periodsOverlap(candidate, slot)) continue;

      const names = result.get(candidate.code) ?? new Set<string>();

      names.add(slot.name);
      result.set(candidate.code, names);
    }
  }

  return result;
};
