import { Card, Link } from "@heroui/react";
import { ReactNode } from "react";

import { WipBadge } from "@/components/wip-badge.tsx";
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

interface Functions {
  title: string;
  href: string;
  icon: ReactNode;
  description: string;
  wip?: boolean;
}

// title 用各頁的正式名稱（與 config/site.ts 的導覽標籤、頁面 h1 一致）；
// 動作說明放在下方的 description，不要在標題再加一次「查詢」。
const functions: Array<Functions> = [
  {
    title: "校園行事曆",
    href: "/calendar",
    icon: <CalendarIcon className="text-4xl" size={48} />,
    description: "查看校園行事曆了解重要日期",
  },
  {
    title: "校園地圖",
    href: "/map",
    icon: <MapIcon className="text-4xl" size={48} />,
    description: "查詢校園內各建築物位置",
  },
  {
    title: "校園節次表",
    href: "/timetable",
    icon: <TimeIcon className="text-4xl" size={48} />,
    description: "了解校園內的課程節次安排",
  },
  {
    title: "課程查詢",
    href: "/search",
    icon: <CourseIcon className="text-4xl" size={48} />,
    description: "透過篩選器搜尋您想要的課程",
  },
  {
    title: "教師課表",
    href: "/schedules/teacher",
    icon: <ProfileIcon className="text-4xl" size={48} />,
    description: "查詢指定教師的開課時間",
  },
  {
    title: "地點課表",
    href: "/schedules/location",
    icon: <ClassroomIcon className="text-4xl" size={48} />,
    description: "查詢指定教室或場地的使用情況",
  },
  {
    title: "班級課表",
    href: "/schedules/class",
    icon: <GraduationIcon className="text-4xl" size={48} />,
    description: "查詢指定班級的課表",
  },
];

export const CourseFunctions = () => {
  return (
    <section className="w-full max-w-4xl mx-auto py-8 md:py-10">
      <h2 className={sectionTitle({ align: "center", class: "mb-6" })}>
        課程功能
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {functions.map((func) => (
          <Link key={func.title} className="w-full" href={func.href}>
            <Card className="h-full w-full border border-transparent hover:border-accent transition-colors duration-200">
              <Card.Header className="flex items-center gap-4">
                {func.icon}
                <h3 className={cardTitle()}>{func.title}</h3>
                {func.wip && <WipBadge />}
              </Card.Header>
              <Card.Content>
                <p className="text-muted text-center">{func.description}</p>
              </Card.Content>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
