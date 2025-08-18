export interface AnnouncementItem {
  text: string;
  href?: {
    link: string;
    text: string;
  }[];
  level: number;
}
