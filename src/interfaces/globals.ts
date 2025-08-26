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
}

export interface LocationItem {
  code: string;
  name: string;
}
