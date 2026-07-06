export interface AnnounceHrefItem {
  link: string;
  text: string;
}

export interface AnnouncementItem {
  text: string;
  href?: AnnounceHrefItem[];
  level: number;
}

export interface CalendarItem {
  year: number;
  semester: number;
  title: string;
  link: string;
}

export interface YearSemesterItem {
  code: string;
  displayName: string;
  default: boolean;
}

export interface YmsCache {
  lastUpdated: string;
  data: YearSemesterItem[];
}

export interface LocationItem {
  code: string;
  name: string;
  courses: CourseItem[];
}

export interface CourseItem {
  code: string;
  name: string;
  class: string;
  time: string;
  teacher: string;
}

export interface MergedCourseItem {
  code: string;
  name: string;
  class: string;
  time: string;
  teacher: string;
  // Single department, as attached while flattening one unit's course list
  // (see merge-courses.ts flattenTeacherUnits). A course cross-listed under
  // multiple units produces one MergedCourseItem per unit at this stage.
  departmentCode?: string;
  department?: string;
  // All departments a course is cross-listed under, collapsed onto one entry
  // by merge-courses.ts dedupeCourses. Populated only after deduping.
  departmentCodes?: string[];
  departments?: string[];
  locationCode?: string;
  classroom?: string;
}

export interface TeacherClasses {
  code: string;
  name: string;
  class: CourseItem[];
}

export interface Units {
  code: string;
  name: string;
  teachers: TeacherClasses[];
}

// Weekly Schedule Interfaces
export interface WeeklyScheduleCourse {
  id: string;
  code: string;
  name: string;
  teacher: string;
  class: string;
  day: number; // 0-6 (Monday-Sunday)
  period: number; // 1-14
  duration?: number; // Number of periods this course spans, default 1
  color?: string; // Optional color for the course display
}

export interface CampusTimeMapping {
  campus: "main" | "secondary";
  name: string;
  periods: {
    period: number;
    startTime: string;
    endTime: string;
    label: string;
  }[];
}

export interface WeeklyScheduleProps {
  scheduleTitle?: string;
  courses: WeeklyScheduleCourse[];
  campusTimeMappings?: CampusTimeMapping[];
  selectedCampus?: "main" | "secondary";
  onCampusChange?: (campus: "main" | "secondary") => void;
  className?: string;
  // Course codes that have a time conflict with another selected course.
  // When provided, matching slots are highlighted as conflicts in the grid.
  conflictCourseCodes?: string[];
}
