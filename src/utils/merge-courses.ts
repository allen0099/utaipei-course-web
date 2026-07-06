import { LocationItem, MergedCourseItem, Units } from "@/interfaces/globals.ts";

export const flattenTeacherUnits = (units: Units[]): MergedCourseItem[] => {
  return units.flatMap((unit) =>
    unit.teachers.flatMap((teacher) =>
      teacher.class.map((course) => ({
        ...course,
        departmentCode: unit.code,
        department: unit.name,
      })),
    ),
  );
};

export const flattenLocations = (
  locations: LocationItem[],
): MergedCourseItem[] => {
  return locations.flatMap((location) =>
    location.courses.map((course) => ({
      ...course,
      locationCode: location.code,
      classroom: location.name,
    })),
  );
};

const courseKey = (course: { code: string; class: string }) =>
  `${course.code}-${course.class}`;

const dedupeKey = (course: {
  code: string;
  class: string;
  teacher: string;
  time: string;
}) => `${course.code}-${course.class}-${course.teacher}-${course.time}`;

// Collapses courses cross-listed under multiple departments (same
// code/class/teacher/time appearing once per unit in teachers.json) into a
// single entry, merging their departments into departmentCodes/departments
// so department-based filtering and display still work downstream.
export const dedupeCourses = (
  courses: MergedCourseItem[],
): MergedCourseItem[] => {
  const merged = new Map<string, MergedCourseItem>();

  courses.forEach((course) => {
    const key = dedupeKey(course);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...course,
        departmentCodes: course.departmentCode ? [course.departmentCode] : [],
        departments: course.department ? [course.department] : [],
      });

      return;
    }

    if (
      course.departmentCode &&
      !existing.departmentCodes?.includes(course.departmentCode)
    ) {
      existing.departmentCodes?.push(course.departmentCode);
    }

    if (
      course.department &&
      !existing.departments?.includes(course.department)
    ) {
      existing.departments?.push(course.department);
    }
  });

  return Array.from(merged.values());
};

export const mergeCourseSources = (
  teacherCourses: MergedCourseItem[],
  locationCourses: MergedCourseItem[],
): MergedCourseItem[] => {
  const locationsByKey = new Map<string, MergedCourseItem>();

  locationCourses.forEach((course) => {
    locationsByKey.set(courseKey(course), course);
  });

  const merged: MergedCourseItem[] = [];
  const usedLocationKeys = new Set<string>();

  teacherCourses.forEach((course) => {
    const key = courseKey(course);
    const matchedLocation = locationsByKey.get(key);

    if (matchedLocation) {
      usedLocationKeys.add(key);
      merged.push({
        ...course,
        locationCode: matchedLocation.locationCode,
        classroom: matchedLocation.classroom,
      });
    } else {
      merged.push(course);
    }
  });

  locationCourses.forEach((course) => {
    if (!usedLocationKeys.has(courseKey(course))) {
      merged.push(course);
    }
  });

  return merged;
};
