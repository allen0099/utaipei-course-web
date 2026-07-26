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

// 科系 (unt_id) — the same code system as teachers.json units[].code, which is
// what Course.departmentCodes carries, so it drives course filtering.
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
 * 一門課的完整資料，來自 courses.json —— 全站唯一的課程來源。
 *
 * `code`（選課代碼）在一個學年期內唯一，所以它是 teachers / locations /
 * classes 三個索引檔與 /share 連結共用的 join key。
 *
 * 沒有任何單一端點涵蓋全部課程，爬蟲端已做完聯集：ag304 是基底、ag203 補
 * 英文課名與人數等欄位、ag300 與 ag302 各再補約 200 筆前兩者沒有的課
 * （放在各自索引檔的 extraCourses）。
 *
 * 繼承 CourseItem，所以能原封不動餵給 convertCourses() 與 WeeklySchedule。
 */
export interface Course extends CourseItem {
  /**
   * 開課班級代碼。與檢視中的班級不同時代表是他班開的課（例如資科系一的體育課
   * 由 19071411 開），班級課表會據此標示。
   */
  classCode: string;
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
  /** 教學綱要鍵值 "19071411,05430.20" = 開課班級,科目代碼.分組 */
  syllabusKey: string;
  /** 此課程關聯到哪些系所 (unt_id)；/search 的系所篩選吃這個。 */
  departmentCodes: string[];
  departments: string[];

  // —— 以下依來源而定，缺就是缺；UI 要顯示「—」而不是假裝有值。——
  /** 英文課名 */
  nameEn?: string;
  /**
   * 修課人數上下限。刻意沒有「已選」人數 —— 它每天變而爬蟲是週排程，
   * 發佈出去會過期並誤導選課決定。
   */
  capacity?: { max: string; min: string };
  /** 合班班級 */
  mixedClass?: string;
  /** 備註 */
  note?: string;
  /**
   * 這門課有沒有擋修條件（限修年級／科系／班級／科目／身份）。
   *
   * 只有有沒有，內容要連到學校的 ag203_limit.jsp 看 —— 那是四個初選階段 × 五類
   * 條件的一整頁，塞進課程列表會把表格撐爆。未定義不代表沒有限修，只代表爬到
   * 這門課的來源看不到（ag304 沒有這個欄位）。
   */
  hasRestriction?: boolean;
  locationCode?: string;
  teacherCodes?: string[];
}

/**
 * courses.json 以外的來源只看得到 CourseItem 那五欄。索引檔的 extraCourses
 * 就是這種殘缺資料，畫面上要能分辨「沒抓到」與「本來就空」。
 */
export type PartialCourse = CourseItem &
  Partial<Omit<Course, keyof CourseItem>>;

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

/**
 * 單一班級的整學期排課，來自 classes/<班級代碼>.json。
 *
 * 只有選課代碼，課程內容一律由 courses.json 查表 —— 同一門課不會在 286 個
 * 班級檔裡各存一份，欄位也不會因為讀到哪個檔而不一致。
 */
export interface ClassSchedule extends ClassItem {
  courseCodes: string[];
}

/**
 * 索引檔的共同形狀：某個維度 → 選課代碼，外加該來源看得到、但 courses.json
 * 沒有的課。courses.json 只由 fetchCourses 產生，每個檔案剛好一個 owner。
 */
export interface CourseIndex<T> {
  entries: T[];
  extraCourses: PartialCourse[];
}

/** teachers.json：系級 → 教師 → 選課代碼 */
export interface TeacherEntry extends ClassItem {
  courseCodes: string[];
}

export interface TeacherUnit extends ClassItem {
  teachers: TeacherEntry[];
}

/** locations.json：場地 → 選課代碼 */
export interface LocationEntry extends ClassItem {
  courseCodes: string[];
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
