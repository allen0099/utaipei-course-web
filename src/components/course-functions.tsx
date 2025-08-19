import { Card, CardHeader, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";
import { SearchIcon } from "@/components/icons.tsx";
import { IconSvgProps } from "@/types";

// Placeholder Icons
const CalendarIcon = (props: IconSvgProps) => (
  <svg {...props} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const AdvancedSearchIcon = (props: IconSvgProps) => (
    <svg {...props} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v18H3zM21 9H3M21 15H3M9 3v18M15 3v18" />
    </svg>
);


const functions = [
  {
    title: "課程行事曆",
    href: "/calendar",
    icon: <CalendarIcon className="text-4xl" />,
    description: "查看校方提供的課程相關時程"
  },
  {
    title: "進階選課",
    href: "/search",
    icon: <AdvancedSearchIcon className="text-4xl" />,
    description: "透過篩選器搜尋您想要的課程"
  },
  {
    title: "教師課表查詢",
    href: "/teacher-schedule",
    icon: <SearchIcon className="text-4xl" />,
    description: "查詢指定教師的開課時間"
  },
  {
    title: "班級課表查詢",
    href: "/class-schedule",
    icon: <SearchIcon className="text-4xl" />,
    description: "查詢指定班級的課表"
  }
];

export const CourseFunctions = () => {
  return (
    <section className="w-full max-w-4xl mx-auto py-8 md:py-10">
      <h2 className="text-2xl font-bold text-center mb-6">課程功能</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {functions.map((func) => (
          <Link href={func.href} key={func.title} className="w-full">
            <Card className="h-full w-full hover:bg-default-100 transition-colors">
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
