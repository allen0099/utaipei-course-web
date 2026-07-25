export type SiteConfig = typeof siteConfig;

export interface NavItem {
  label: string;
  href: string;
  /** 尚未實作，導覽上標示「開發中」，避免使用者以為功能壞掉。 */
  wip?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * 導覽的單一事實來源。桌機與手機以前各維護一份清單，結果桌機看不到
 * 地點課表／校園地圖／校園節次表，手機則沒有任何分組。
 */
const navGroups: NavGroup[] = [
  {
    label: "課表查詢",
    items: [
      { label: "課程查詢", href: "/search" },
      { label: "我的課表", href: "/my-schedule" },
      { label: "教師課表", href: "/schedules/teacher" },
      { label: "地點課表", href: "/schedules/location" },
      { label: "班級課表", href: "/schedules/class", wip: true },
    ],
  },
  {
    label: "校園資訊",
    items: [
      { label: "校園行事曆", href: "/calendar" },
      { label: "校園地圖", href: "/map" },
      { label: "校園節次表", href: "/timetable" },
    ],
  },
];

export const siteConfig = {
  name: "UTC 選課小幫手",
  description:
    "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
  navGroups,
  /** 首頁連結單獨放，兩種導覽都排在最前面且不屬於任何分組。 */
  homeItem: { label: "首頁", href: "/" } as NavItem,
  /** 攤平後的完整清單，供 sitemap／搜尋等不需要分組的地方使用。 */
  navMenuItems: [
    { label: "首頁", href: "/" },
    ...navGroups.flatMap((group) => group.items),
  ] as NavItem[],
  links: {
    utaipei: {
      official: "https://www.utaipei.edu.tw/",
      sky: "https://my.utaipei.edu.tw/utaipei/index_sky.html",
    },
    hero_ui: {
      github: "https://github.com/frontio-ai/heroui",
      docs: "https://heroui.com",
    },
    github: {
      api: "https://allen0099.github.io/utaipei-course-crawler",
      web: "https://github.com/allen0099/utaipei-course-web",
      crawler: "https://github.com/allen0099/utaipei-course-crawler",
    },
  },
};
