import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives";
import { WeeklySchedule } from "@/components/weekly-schedule";
import { WeeklyScheduleCourse, CourseItem } from "@/interfaces/globals";
import { convertCourses } from "@/utils/convert-course";

// Issue sample data from the problem statement
const ISSUE_SAMPLE_DATA: CourseItem[] = [
  {
    code: "3445",
    name: "特技舞蹈",
    class: "動藝一",
    time: "(一) 8-10 (二) 8-10 (四) 8-10 (五) 8-10",
    teacher: "張國韋, 曾惠敏, 范宜善",
  },
  {
    code: "0381",
    name: "特技舞蹈",
    class: "動藝三",
    time: "(一) 8-10 (二) 8-10 (四) 8-10 (五) 8-10",
    teacher: "張國韋, 曾惠敏, 范宜善",
  },
  {
    code: "0375",
    name: "特技舞蹈",
    class: "動藝二",
    time: "(一) 8-10 (二) 8-10 (四) 8-10 (五) 8-10",
    teacher: "張國韋, 曾惠敏, 范宜善",
  },
  {
    code: "0389",
    name: "特技舞蹈",
    class: "動藝四",
    time: "(一) 8-10 (二) 8-10 (四) 8-10 (五) 8-10",
    teacher: "張國韋, 曾惠敏, 范宜善",
  },
  {
    code: "3211",
    name: "鐵人三項",
    class: "水上一",
    time: "(一) 8-10 (二) 8-10 (四) 8-10 (五) 8-10",
    teacher: "各教師, 魏振展",
  },
];

export const IssueDemo = () => {
  const [courses, setCourses] = useState<WeeklyScheduleCourse[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<"main" | "secondary">(
    "main",
  );

  const handleLoadIssueData = () => {
    const convertedCourses = convertCourses(ISSUE_SAMPLE_DATA);

    setCourses(convertedCourses);
    // eslint-disable-next-line no-console
    console.log("Loaded issue data:", convertedCourses);
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
          <h1 className={title()}>週課表問題展示</h1>
          <p className="text-lg text-default-500 mt-4">
            展示 Duration 和 多課程重疊 的問題
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
                onClick={handleLoadIssueData}
              >
                載入問題資料
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

        {/* Issue Description */}
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <h3 className="text-lg font-semibold">問題說明</h3>
          </CardHeader>
          <CardBody>
            <div className="text-sm space-y-2">
              <p>
                <strong>問題 1:</strong> Duration
                設定時長永遠只顯示一個時段，例如 &ldquo;(一) 8-10&rdquo;
                應該顯示在第8、9、10節，但目前只顯示在第8節。
              </p>
              <p>
                <strong>問題 2:</strong>{" "}
                多個課程在相同時間段時，只有第一個會被顯示，其他的會被忽略。
              </p>
              <p>
                <strong>測試資料:</strong> 5門課程都在相同時間 &ldquo;(一)
                8-10&rdquo;
                等，應該看到多個課程重疊，且每個課程應該跨越3個時段。
              </p>
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

export default IssueDemo;
