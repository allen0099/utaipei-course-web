import { Card, CardHeader, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";

import {
  CalendarIcon,
  ClassroomIcon,
  CourseIcon,
  GraduationIcon,
  MapIcon,
  ProfileIcon,
  TimeIcon,
} from "@/components/svgIcon.tsx";

const functions = [
  {
    title: "課程行事曆",
    href: "/calendar",
    icon: <CalendarIcon className="text-4xl" size={48} />,
    description: "查看校方提供的課程相關時程",
  },
  {
    title: "校園地圖",
    href: "/map",
    icon: <MapIcon className="text-4xl" size={48} />,
    description: "查詢校園內各建築物位置",
  },
  {
    title: "校園節次說明",
    href: "/timetable",
    icon: <TimeIcon className="text-4xl" size={48} />,
    description: "了解校園內的課程節次安排",
  },
  {
    title: "科目課程查詢",
    href: "/search",
    icon: <CourseIcon className="text-4xl" size={48} />,
    description: "透過篩選器搜尋您想要的課程",
  },
  {
    title: "教師課表查詢",
    href: "/schedules/teacher",
    icon: <ProfileIcon className="text-4xl" size={48} />,
    description: "查詢指定教師的開課時間",
  },
  {
    title: "場地課表查詢",
    href: "/schedules/location",
    icon: <ClassroomIcon className="text-4xl" size={48} />,
    description: "查詢指定教室或場地的使用情況",
  },
  {
    title: "系所班級課表查詢",
    href: "/schedules/class",
    icon: <GraduationIcon className="text-4xl" size={48} />,
    description: "查詢指定系所班級的課表",
  },
];

export const CourseFunctions = () => {
  return (
    <section className="w-full max-w-4xl mx-auto py-8 md:py-10">
      <h2 className="text-2xl font-bold text-center mb-6">課程功能</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {functions.map((func) => (
          <Link key={func.title} className="w-full" href={func.href}>
            <Card className="h-full w-full hover:bg-default-100 transform transition-transform duration-200 hover:scale-105">
              <CardHeader className="flex items-center gap-4">
                {func.icon}
                <h3 className="text-lg font-semibold">{func.title}</h3>
              </CardHeader>
              <CardBody>
                <p className="text-default-600">{func.description}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
