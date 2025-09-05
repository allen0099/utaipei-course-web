export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "UTC 選課小幫手",
  description:
    "臺北市立大學選課輔助工具，提供課程查詢、教師課表、校園地圖等功能，讓選課更便利！",
  navItems: [
    {
      label: "首頁",
      href: "/",
    },
    {
      label: "校園行事曆",
      href: "/calendar",
    },
    {
      label: "課程查詢",
      href: "/search",
    },
    {
      label: "教師課表",
      href: "/schedules/teacher",
    },
    {
      label: "系所課表",
      href: "/schedules/class",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    utaipei: {
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
