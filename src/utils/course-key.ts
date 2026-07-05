import { MergedCourseItem } from "@/interfaces/globals.ts";

// Unique identifier for a course offering, matching the key used in
// utils/merge-courses.ts so selections line up with freshly-fetched course data.
export const getCourseKey = (course: { code: string; class: string }): string =>
  `${course.code}-${course.class}`;

export type SelectedCourseMap = Record<string, MergedCourseItem>;
