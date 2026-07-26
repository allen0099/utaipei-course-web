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
  // Whether the crawler could extract structured events from the PDF. False for
  // 105 學年度, whose PDF stores every Chinese glyph as a bitmap image, so only
  // the PDF viewer can show it. Older calendar.json files predate this field.
  parsed?: boolean;
}

// One dated entry of the academic calendar, parsed from the PDF by the crawler
// (crawler/utils/pdfCalendar.ts). Published as calendar/<year>/<semester>.json.
export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  endDate?: string; // Only present for events spanning multiple days
  unit: string | null; // Owning unit as tagged in 【】, e.g. 教 / 秘 / 體
  title: string;
  isHoliday: boolean;
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

// 科系 (unt_id) — the same code system as teachers.json units[].code, which is
// what MergedCourseItem.departmentCodes carries, so it drives course filtering.
export interface DepartmentItem {
  code: string;
  name: string;
}

// 學院 (dpt_id) grouping its 科系 (unt_id) list; from departments.json.
export interface CollegeItem {
  code: string;
  name: string;
  departments: DepartmentItem[];
}

export interface CourseItem {
  code: string;
  name: string;
  class: string;
  time: string;
  teacher: string;
}

/**
 * One row of a class's 【班級排課清單】, from classes/<班級代碼>.json.
 *
 * Extends CourseItem — `class` carries the 班級 name just as it does in
 * teachers.json and locations.json — so it can be handed to convertCourses()
 * and WeeklySchedule unchanged.
 */
export interface ClassCourseItem extends CourseItem {
  /** 分組，如 "01" */
  group: string;
  /** 學分，如 "3.0"。體育等零學分課為 "0" */
  credits: string;
  /** 時數，如 "3.0" */
  hours: string;
  /** 必選修，如 "必修" */
  required: string;
  /** 開課別，如 "學期" */
  courseType: string;
  /** 校區，如 "博愛" */
  campus: string;
  /** 教室，如 "博愛 G313"、"博愛教室未定" */
  classroom: string;
  /** 領域類，如 "系定必修"、"體育類" */
  category: string;
  /** 限制性別，如 "不限" */
  genderLimit: string;
  /**
   * 實際開課的班級代碼。與所查詢的班級不同時代表是他班開的課（例如資科系一的
   * 體育課由 19071411 開），課程卡片會據此標示。
   */
  hostClass: string;
}

/** 代碼 + 名稱；班級索引 classes.json 的三層共用。 */
export interface ClassItem {
  code: string;
  name: string;
}

/** 系所 (unt_id) 及其班級。 */
export interface ClassDepartment extends ClassItem {
  classes: ClassItem[];
}

/** 學院／開課單位 (dpt_id) 及其系所；classes.json 的頂層。 */
export interface ClassCollege extends ClassItem {
  departments: ClassDepartment[];
}

/** 單一班級的整學期排課，來自 classes/<班級代碼>.json。 */
export interface ClassSchedule extends ClassItem {
  courses: ClassCourseItem[];
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
