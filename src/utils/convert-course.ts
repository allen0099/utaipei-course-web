import { CourseItem, WeeklyScheduleCourse } from "@/interfaces/globals.ts";

const convertCourse = (course: CourseItem): WeeklyScheduleCourse[] => {
  // Example time format: "(二) 8-9", "(一) 8-10 (二) 8-10 (四) 8-10 (五) 8-10", "(二) 3-4"
  const timePattern = /\((\S)\)\s*(\d+)(-(\d+))?/g;
  const dayMap: { [key: string]: number } = {
    一: 0,
    二: 1,
    三: 2,
    四: 3,
    五: 4,
    六: 5,
    日: 6,
  };

  const courses: WeeklyScheduleCourse[] = [];
  let match;

  while ((match = timePattern.exec(course.time)) !== null) {
    const dayChar = match[1];
    const startPeriod = parseInt(match[2], 10);
    const endPeriod = match[4] ? parseInt(match[4], 10) : startPeriod;

    const day = dayMap[dayChar];
    const duration = endPeriod - startPeriod + 1;

    if (day === undefined) {
      continue; // Skip invalid day entries
    }

    courses.push({
      id: `${course.code}-${day}-${startPeriod}`,
      code: course.code,
      name: course.name,
      teacher: course.teacher,
      class: course.class,
      day,
      period: startPeriod,
      duration,
    });
  }

  return courses;
};

export const convertCourses = (
  courses: CourseItem[],
): WeeklyScheduleCourse[] => {
  return courses.flatMap(convertCourse);
};
