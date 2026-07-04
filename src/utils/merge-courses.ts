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
