import { Card, Link } from "@heroui/react";
import { ReactNode } from "react";

import {
  CalendarIcon,
  ClassroomIcon,
  CourseIcon,
  GraduationIcon,
  MapIcon,
  ProfileIcon,
  TimeIcon,
} from "@/components/svgIcon.tsx";
import { cardTitle, sectionTitle } from "@/components/primitives.ts";
import { useT } from "@/i18n/language.tsx";

interface Functions {
  title: string;
  titleEn: string;
  href: string;
  icon: ReactNode;
  description: string;
  descriptionEn: string;
}

// title 用各頁的正式名稱（與 config/site.ts 的導覽標籤、頁面 h1 一致）；
// 動作說明放在下方的 description，不要在標題再加一次「查詢」。
const functions: Array<Functions> = [
  {
    title: "校園行事曆",
    titleEn: "Academic Calendar",
    href: "/calendar",
    icon: <CalendarIcon className="text-4xl" size={48} />,
    description: "查看校園行事曆了解重要日期",
    descriptionEn: "Key dates of the academic year",
  },
  {
    title: "校園地圖",
    titleEn: "Campus Map",
    href: "/map",
    icon: <MapIcon className="text-4xl" size={48} />,
    description: "查詢校園內各建築物位置",
    descriptionEn: "Find buildings on both campuses",
  },
  {
    title: "校園節次表",
    titleEn: "Class Periods",
    href: "/timetable",
    icon: <TimeIcon className="text-4xl" size={48} />,
    description: "了解校園內的課程節次安排",
    descriptionEn: "When each class period starts and ends",
  },
  {
    title: "課程查詢",
    titleEn: "Course Search",
    href: "/search",
    icon: <CourseIcon className="text-4xl" size={48} />,
    description: "透過篩選器搜尋您想要的課程",
    descriptionEn: "Filter and search for the courses you want",
  },
  {
    title: "教師課表",
    titleEn: "Teacher Schedules",
    href: "/schedules/teacher",
    icon: <ProfileIcon className="text-4xl" size={48} />,
    description: "查詢指定教師的開課時間",
    descriptionEn: "See when an instructor teaches",
  },
  {
    title: "地點課表",
    titleEn: "Room Schedules",
    href: "/schedules/location",
    icon: <ClassroomIcon className="text-4xl" size={48} />,
    description: "查詢指定教室或場地的使用情況",
    descriptionEn: "See how a room or venue is used",
  },
  {
    title: "尋找空教室",
    titleEn: "Find Free Rooms",
    href: "/schedules/free-rooms",
    icon: <ClassroomIcon className="text-4xl" size={48} />,
    description: "找出某個時段沒有排課的教室",
    descriptionEn: "Rooms with no class in a given time slot",
  },
  {
    title: "班級課表",
    titleEn: "Class Schedules",
    href: "/schedules/class",
    icon: <GraduationIcon className="text-4xl" size={48} />,
    description: "查詢指定班級的課表",
    descriptionEn: "Timetable of a specific class",
  },
];

export const CourseFunctions = () => {
  const t = useT();

  return (
    <section className="w-full max-w-4xl mx-auto py-8 md:py-10">
      <h2 className={sectionTitle({ align: "center", class: "mb-6" })}>
        {t("課程功能", "Features")}
      </h2>
      {/* 8 張卡：3 欄會剩下孤零零的兩張，2／4 欄才排得滿。 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {functions.map((func) => (
          <Link key={func.title} className="w-full" href={func.href}>
            <Card className="h-full w-full border border-transparent hover:border-accent transition-colors duration-200">
              <Card.Header className="flex items-center gap-4">
                {func.icon}
                <h3 className={cardTitle()}>{t(func.title, func.titleEn)}</h3>
              </Card.Header>
              <Card.Content>
                <p className="text-muted text-center">
                  {t(func.description, func.descriptionEn)}
                </p>
              </Card.Content>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
