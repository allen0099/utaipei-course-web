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

export interface LocationItem {
  code: string;
  name: string;
  courses: CourseItem[];
}

interface CourseItem {
  code: string;
  name: string;
  class: string;
  time: string;
  teacher: string;
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
  courses: WeeklyScheduleCourse[];
  campusTimeMappings?: CampusTimeMapping[];
  selectedCampus?: "main" | "secondary";
  onCampusChange?: (campus: "main" | "secondary") => void;
  className?: string;
}
