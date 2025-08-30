import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { WeeklySchedule } from "@/components/weekly-schedule";
import { WeeklyScheduleCourse } from "@/interfaces/globals";

// Sample course data for demonstration
const SAMPLE_COURSES: WeeklyScheduleCourse[] = [
  {
    id: "1",
    code: "CS101",
    name: "計算機概論",
    teacher: "王老師",
    class: "資工一甲",
    day: 0, // Monday
    period: 1,
  },
  {
    id: "2",
    code: "CS101",
    name: "計算機概論",
    teacher: "王老師",
    class: "資工一甲",
    day: 0, // Monday
    period: 2,
  },
  {
    id: "3",
    code: "MATH201",
    name: "線性代數",
    teacher: "李教授",
    class: "資工一甲",
    day: 1, // Tuesday
    period: 3,
  },
  {
    id: "4",
    code: "MATH201",
    name: "線性代數",
    teacher: "李教授",
    class: "資工一甲",
    day: 1, // Tuesday
    period: 4,
  },
  {
    id: "5",
    code: "ENG101",
    name: "英文",
    teacher: "張老師",
    class: "資工一甲",
    day: 2, // Wednesday
    period: 6,
  },
  {
    id: "6",
    code: "CS102",
    name: "程式設計",
    teacher: "陳教授",
    class: "資工一甲",
    day: 3, // Thursday
    period: 7,
  },
  {
    id: "7",
    code: "CS102",
    name: "程式設計",
    teacher: "陳教授",
    class: "資工一甲",
    day: 3, // Thursday
    period: 8,
  },
  {
    id: "8",
    code: "CS102",
    name: "程式設計",
    teacher: "陳教授",
    class: "資工一甲",
    day: 3, // Thursday
    period: 9,
  },
  {
    id: "9",
    code: "PHYS101",
    name: "普通物理",
    teacher: "劉教授",
    class: "資工一甲",
    day: 4, // Friday
    period: 11,
  },
  {
    id: "10",
    code: "PHYS101",
    name: "普通物理",
    teacher: "劉教授",
    class: "資工一甲",
    day: 4, // Friday
    period: 12,
  },
];

export const WeeklyScheduleDemo = () => {
  const [courses, setCourses] = useState<WeeklyScheduleCourse[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<"main" | "secondary">(
    "main",
  );

  const handleLoadSampleData = () => {
    setCourses(SAMPLE_COURSES);
  };

  const handleClearData = () => {
    setCourses([]);
  };

  const handleCampusChange = (campus: "main" | "secondary") => {
    setSelectedCampus(campus);
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10">
        <div className="text-center">
          <h1 className={title()}>週課表組件展示</h1>
          <p className="text-lg text-default-500 mt-4">
            這是一個可以顯示週課表的 HeroUI 組件展示頁面
          </p>
        </div>

        {/* Control Panel */}
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <h3 className="text-lg font-semibold">控制面板</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                color="primary"
                disabled={courses.length > 0}
                onClick={handleLoadSampleData}
              >
                載入範例課程
              </Button>
              <Button
                color="danger"
                disabled={courses.length === 0}
                variant="flat"
                onClick={handleClearData}
              >
                清除課程
              </Button>
              <div className="text-sm text-default-500">
                目前有 {courses.length} 門課程
              </div>
            </div>
          </CardBody>
        </Card>

        <Divider className="max-w-4xl w-full" />

        {/* Component Features */}
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <h3 className="text-lg font-semibold">組件功能特色</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">基本功能：</h4>
                <ul className="list-disc list-inside space-y-1 text-default-600">
                  <li>支援一週七天顯示</li>
                  <li>每天 14 個時段</li>
                  <li>上午/中午/晚上時段區分</li>
                  <li>響應式設計，支援手機/桌面</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">進階功能：</h4>
                <ul className="list-disc list-inside space-y-1 text-default-600">
                  <li>校本部/博愛校區時間切換</li>
                  <li>課程自動配色</li>
                  <li>課程資訊完整顯示</li>
                  <li>空課堂視覺提示</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        <Divider className="max-w-4xl w-full" />

        {/* Weekly Schedule Component */}
        <WeeklySchedule
          className="w-full max-w-7xl"
          courses={courses}
          selectedCampus={selectedCampus}
          onCampusChange={handleCampusChange}
        />
      </section>
    </DefaultLayout>
  );
};

export default WeeklyScheduleDemo;
