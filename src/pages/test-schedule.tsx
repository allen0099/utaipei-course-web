import React from "react";

import DefaultLayout from "@/layouts/default";
import WeeklySchedule from "@/components/weekly-schedule";
import { WeeklyScheduleCourse } from "@/interfaces/globals";

// Sample course data for testing
const sampleCourses: WeeklyScheduleCourse[] = [
  {
    id: "1",
    code: "CS101",
    name: "計算機科學導論",
    teacher: "王教授",
    class: "資工一A",
    day: 0, // Monday
    period: 1,
    duration: 2,
  },
  {
    id: "2",
    code: "MATH101",
    name: "微積分",
    teacher: "李教授",
    class: "資工一A",
    day: 1, // Tuesday
    period: 3,
    duration: 2,
  },
  {
    id: "3",
    code: "ENG101",
    name: "英文",
    teacher: "陳教授",
    class: "資工一A",
    day: 2, // Wednesday
    period: 1,
    duration: 1,
  },
  {
    id: "4",
    code: "PHY101",
    name: "物理學",
    teacher: "張教授",
    class: "資工一A",
    day: 3, // Thursday
    period: 6,
    duration: 2,
  },
  {
    id: "5",
    code: "CS201",
    name: "程式設計",
    teacher: "林教授",
    class: "資工一A",
    day: 4, // Friday
    period: 8,
    duration: 2,
  },
  {
    id: "6",
    code: "SPORT",
    name: "體育",
    teacher: "吳教授",
    class: "資工一A",
    day: 5, // Saturday
    period: 2,
    duration: 1,
  },
  {
    id: "7",
    code: "NIGHT101",
    name: "夜間課程",
    teacher: "周教授",
    class: "資工一A",
    day: 0, // Monday
    period: 11,
    duration: 2,
  },
];

const TestSchedulePage: React.FC = () => {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className="text-4xl font-bold leading-9 tracking-tight mb-4">
            測試週課表功能
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            這是一個用來測試週課表組件功能的頁面
          </p>
        </div>
        
        <WeeklySchedule
          scheduleTitle="測試課表"
          courses={sampleCourses}
          className="w-full"
        />
      </section>
    </DefaultLayout>
  );
};

export default TestSchedulePage;