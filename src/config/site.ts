export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "UTC 選課小幫手",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/",
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
