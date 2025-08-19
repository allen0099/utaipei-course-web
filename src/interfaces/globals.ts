export interface AnnounceHrefItem {
  link: string;
  text: string;
}

export interface AnnouncementItem {
  text: string;
  href?: AnnounceHrefItem[];
  level: number;
}

export interface calendarItem {
  year: number;
  semester: number;
  title: string;
  link: string;
}
