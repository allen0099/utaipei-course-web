export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
}

export const defaultMeta: PageMeta = {
  title: "UTC 選課小幫手",
  description:
    "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
  keywords: "臺北市立大學,選課,課程查詢,教師課表,校園地圖,UTC",
  ogType: "website",
};

export const pageMeta: Record<string, PageMeta> = {
  "/": {
    title: "UTC 選課小幫手",
    description:
      "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
    keywords: "臺北市立大學,選課,課程查詢,教師課表,校園地圖,UTC",
    ogType: "website",
  },
  "/calendar": {
    title: "課程行事曆 - UTC 選課小幫手",
    description: "查看臺北市立大學課程行事曆，掌握重要學期日程與課程時間安排。",
    keywords: "臺北市立大學,行事曆,課程時間,學期,UTC",
    ogType: "website",
  },
  "/search": {
    title: "課程查詢 - UTC 選課小幫手",
    description:
      "搜尋臺北市立大學課程資訊，快速找到您需要的課程內容與修課資訊。",
    keywords: "臺北市立大學,課程查詢,課程搜尋,修課,UTC",
    ogType: "website",
  },
  "/schedules/teacher": {
    title: "教師課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學教師課表，了解教師授課時間與課程安排。",
    keywords: "臺北市立大學,教師課表,授課時間,教師查詢,UTC",
    ogType: "website",
  },
  "/schedules/class": {
    title: "系所課表 - UTC 選課小幫手",
    description: "查看臺北市立大學各系所課表，掌握科系課程時間與教室安排。",
    keywords: "臺北市立大學,系所課表,科系課程,教室,UTC",
    ogType: "website",
  },
  "/schedules/location": {
    title: "教室課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學教室使用狀況，了解各教室的課程安排與時間。",
    keywords: "臺北市立大學,教室課表,教室查詢,場地,UTC",
    ogType: "website",
  },
  "/map": {
    title: "校園地圖 - UTC 選課小幫手",
    description:
      "臺北市立大學校園地圖，提供建築物位置與樓層平面圖，幫助您快速找到目的地。",
    keywords: "臺北市立大學,校園地圖,建築物,樓層圖,導航,UTC",
    ogType: "website",
  },
  "/timetable": {
    title: "課程時刻表 - UTC 選課小幫手",
    description: "查看臺北市立大學課程時刻表，了解各節次時間與課程安排。",
    keywords: "臺北市立大學,時刻表,節次時間,課程安排,UTC",
    ogType: "website",
  },
};

export const getPageMeta = (pathname: string): PageMeta => {
  // If pathname ends with a "/", remove it for matching
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  return pageMeta[pathname] || defaultMeta;
};
