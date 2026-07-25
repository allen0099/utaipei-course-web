export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
}

// Shared Open Graph / Twitter Card preview image (site mascot), used across
// all routes since we don't yet have per-route illustrations.
const DEFAULT_OG_IMAGE = "/CatMeow.png";

export const defaultMeta: PageMeta = {
  title: "UTC 選課小幫手",
  description:
    "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
  keywords: "臺北市立大學,選課,課程查詢,教師課表,校園地圖,UTC",
  ogType: "website",
  ogImage: DEFAULT_OG_IMAGE,
};

/**
 * 每條路由的標題／描述。頁面上的 <h1>（<PageHeader> 的 title）、導覽列標籤
 * （config/site.ts）與這裡的 title 必須是同一個名字。
 *
 * scripts/generate-static-pages.js 有一份一模一樣的表，供 build 後產生給爬蟲看的
 * 靜態 HTML 與 sitemap 使用。那支腳本是 build 完才用 node 直接跑的純 .js，沒有辦法
 * import 這個 .ts 檔，只能兩邊各留一份——改這裡就要一併改那邊。
 */
export const pageMeta: Record<string, PageMeta> = {
  "/": {
    title: "UTC 選課小幫手",
    description:
      "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
    keywords: "臺北市立大學,選課,課程查詢,教師課表,校園地圖,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/calendar": {
    title: "校園行事曆 - UTC 選課小幫手",
    description:
      "查看臺北市立大學各學年度校園行事曆，掌握學期重要日程，並可下載或訂閱到個人日曆。",
    keywords: "臺北市立大學,行事曆,學期日程,行事曆訂閱,ics,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/search": {
    title: "課程查詢 - UTC 選課小幫手",
    description:
      "依學年度、系所或關鍵字查詢臺北市立大學開課資料，快速找到需要的課程。",
    keywords: "臺北市立大學,課程查詢,課程搜尋,開課資料,選課,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/my-schedule": {
    title: "我的課表 - UTC 選課小幫手",
    description:
      "集中檢視在課程查詢頁勾選的臺北市立大學課程，自動偵測衝堂，並可匯出成日曆或圖片。",
    keywords: "臺北市立大學,我的課表,選課,衝堂偵測,課表匯出,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/schedules/teacher": {
    title: "教師課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學個別教師在該學期的授課課表與上課時間。",
    keywords: "臺北市立大學,教師課表,授課時間,教師查詢,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/schedules/class": {
    title: "班級課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學各班級在該學期的課表。此功能正在建置中。",
    keywords: "臺北市立大學,班級課表,班級查詢,課表,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/schedules/location": {
    // 資料裡不只教室，還有攀岩場地、田徑場、網球場等場地，所以是「地點」不是「教室」。
    title: "地點課表 - UTC 選課小幫手",
    description: "查詢臺北市立大學教室、球場等場地在該學期的使用課表。",
    keywords: "臺北市立大學,地點課表,教室課表,場地查詢,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/map": {
    title: "校園地圖 - UTC 選課小幫手",
    description:
      "臺北市立大學校園地圖，提供各校區大樓代碼對照與樓層平面圖，幫助您快速找到目的地。",
    keywords: "臺北市立大學,校園地圖,大樓代碼,樓層圖,博愛校區,天母校區,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
  "/timetable": {
    title: "校園節次表 - UTC 選課小幫手",
    description:
      "臺北市立大學二校區上課節次與時間對照表，了解各節次的上下課時間。",
    keywords: "臺北市立大學,校園節次表,上課節次,上課時間,UTC",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE,
  },
};

export const getPageMeta = (pathname: string): PageMeta => {
  // If pathname ends with a "/", remove it for matching
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  return pageMeta[pathname] || defaultMeta;
};
