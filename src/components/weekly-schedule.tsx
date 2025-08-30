import React, { useState, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import clsx from "clsx";

import {
  WeeklyScheduleProps,
  WeeklyScheduleCourse,
  CampusTimeMapping,
} from "@/interfaces/globals";

// Default campus time mappings
const DEFAULT_CAMPUS_MAPPINGS: CampusTimeMapping[] = [
  {
    campus: "main",
    name: "校本部",
    periods: [
      {
        period: 1,
        startTime: "08:10",
        endTime: "09:00",
        label: "第1節",
      },
      {
        period: 2,
        startTime: "09:10",
        endTime: "10:00",
        label: "第2節",
      },
      {
        period: 3,
        startTime: "10:10",
        endTime: "11:00",
        label: "第3節",
      },
      {
        period: 4,
        startTime: "11:10",
        endTime: "12:00",
        label: "第4節",
      },
      {
        period: 5,
        startTime: "12:10",
        endTime: "13:00",
        label: "第5節",
      },
      {
        period: 6,
        startTime: "13:10",
        endTime: "14:00",
        label: "第6節",
      },
      {
        period: 7,
        startTime: "14:10",
        endTime: "15:00",
        label: "第7節",
      },
      {
        period: 8,
        startTime: "15:10",
        endTime: "16:00",
        label: "第8節",
      },
      {
        period: 9,
        startTime: "16:10",
        endTime: "17:00",
        label: "第9節",
      },
      {
        period: 10,
        startTime: "17:10",
        endTime: "18:00",
        label: "第10節",
      },
      {
        period: 11,
        startTime: "18:20",
        endTime: "19:10",
        label: "第11節",
      },
      {
        period: 12,
        startTime: "19:15",
        endTime: "20:05",
        label: "第12節",
      },
      {
        period: 13,
        startTime: "20:10",
        endTime: "21:00",
        label: "第13節",
      },
      {
        period: 14,
        startTime: "21:05",
        endTime: "21:55",
        label: "第14節",
      },
    ],
  },
  {
    campus: "secondary",
    name: "博愛校區",
    periods: [
      {
        period: 1,
        startTime: "08:00",
        endTime: "08:50",
        label: "第1節",
      },
      {
        period: 2,
        startTime: "09:00",
        endTime: "09:50",
        label: "第2節",
      },
      {
        period: 3,
        startTime: "10:00",
        endTime: "10:50",
        label: "第3節",
      },
      {
        period: 4,
        startTime: "11:00",
        endTime: "11:50",
        label: "第4節",
      },
      {
        period: 5,
        startTime: "12:00",
        endTime: "12:50",
        label: "第5節",
      },
      {
        period: 6,
        startTime: "13:00",
        endTime: "13:50",
        label: "第6節",
      },
      {
        period: 7,
        startTime: "14:00",
        endTime: "14:50",
        label: "第7節",
      },
      {
        period: 8,
        startTime: "15:00",
        endTime: "15:50",
        label: "第8節",
      },
      {
        period: 9,
        startTime: "16:00",
        endTime: "16:50",
        label: "第9節",
      },
      {
        period: 10,
        startTime: "17:00",
        endTime: "17:50",
        label: "第10節",
      },
      {
        period: 11,
        startTime: "18:10",
        endTime: "19:00",
        label: "第11節",
      },
      {
        period: 12,
        startTime: "19:05",
        endTime: "19:55",
        label: "第12節",
      },
      {
        period: 13,
        startTime: "20:00",
        endTime: "20:50",
        label: "第13節",
      },
      {
        period: 14,
        startTime: "20:55",
        endTime: "21:45",
        label: "第14節",
      },
    ],
  },
];

const DAY_NAMES = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

const TIME_OF_DAY_COLORS = {
  morning: "bg-blue-50 dark:bg-blue-900/20",
  noon: "bg-orange-50 dark:bg-orange-900/20",
  evening: "bg-purple-50 dark:bg-purple-900/20",
};

const COURSE_COLORS = [
  "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-200",
  "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-200",
  "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-200",
  "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-200",
  "bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-600 dark:text-pink-200",
  "bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-200",
  "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-200",
  "bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/30 dark:border-teal-600 dark:text-teal-200",
  "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-600 dark:text-orange-200",
  "bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-600 dark:text-cyan-200",
  "bg-lime-100 border-lime-300 text-lime-800 dark:bg-lime-900/30 dark:border-lime-600 dark:text-lime-200",
  "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-200",
  "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-200",
  "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:border-fuchsia-600 dark:text-fuchsia-200",
  "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/30 dark:border-rose-600 dark:text-rose-200",
  "bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/30 dark:border-sky-600 dark:text-sky-200",
  "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-200",
  "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-900/30 dark:border-slate-600 dark:text-slate-200",
  "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/30 dark:border-gray-600 dark:text-gray-200",
  "bg-zinc-100 border-zinc-300 text-zinc-800 dark:bg-zinc-900/30 dark:border-zinc-600 dark:text-zinc-200",
  "bg-neutral-100 border-neutral-300 text-neutral-800 dark:bg-neutral-900/30 dark:border-neutral-600 dark:text-neutral-200",
  "bg-stone-100 border-stone-300 text-stone-800 dark:bg-stone-900/30 dark:border-stone-600 dark:text-stone-200",
  "bg-red-50 border-red-200 text-red-700 dark:bg-red-800/20 dark:border-red-500 dark:text-red-300",
  "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-800/20 dark:border-blue-500 dark:text-blue-300",
  "bg-green-50 border-green-200 text-green-700 dark:bg-green-800/20 dark:border-green-500 dark:text-green-300",
  "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-800/20 dark:border-yellow-500 dark:text-yellow-300",
  "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-800/20 dark:border-pink-500 dark:text-pink-300",
  "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-800/20 dark:border-indigo-500 dark:text-indigo-300",
  "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-800/20 dark:border-purple-500 dark:text-purple-300",
  "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-800/20 dark:border-teal-500 dark:text-teal-300",
  "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-800/20 dark:border-orange-500 dark:text-orange-300",
  "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-800/20 dark:border-cyan-500 dark:text-cyan-300",
  "bg-lime-50 border-lime-200 text-lime-700 dark:bg-lime-800/20 dark:border-lime-500 dark:text-lime-300",
  "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-800/20 dark:border-emerald-500 dark:text-emerald-300",
  "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-800/20 dark:border-violet-500 dark:text-violet-300",
  "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-800/20 dark:border-fuchsia-500 dark:text-fuchsia-300",
  "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-800/20 dark:border-rose-500 dark:text-rose-300",
  "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-800/20 dark:border-sky-500 dark:text-sky-300",
  "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-800/20 dark:border-amber-500 dark:text-amber-300",
  "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/20 dark:border-slate-500 dark:text-slate-300",
  "bg-red-200 border-red-400 text-red-900 dark:bg-red-700/30 dark:border-red-400 dark:text-red-100",
  "bg-blue-200 border-blue-400 text-blue-900 dark:bg-blue-700/30 dark:border-blue-400 dark:text-blue-100",
  "bg-green-200 border-green-400 text-green-900 dark:bg-green-700/30 dark:border-green-400 dark:text-green-100",
  "bg-yellow-200 border-yellow-400 text-yellow-900 dark:bg-yellow-700/30 dark:border-yellow-400 dark:text-yellow-100",
  "bg-pink-200 border-pink-400 text-pink-900 dark:bg-pink-700/30 dark:border-pink-400 dark:text-pink-100",
];

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  courses = [],
  campusTimeMappings = DEFAULT_CAMPUS_MAPPINGS,
  selectedCampus = "main",
  onCampusChange,
  className,
}) => {
  const [currentCampus, setCurrentCampus] = useState<"main" | "secondary">(
    selectedCampus,
  );

  const currentMapping = useMemo(() => {
    return (
      campusTimeMappings.find((mapping) => mapping.campus === currentCampus) ||
      campusTimeMappings[0]
    );
  }, [campusTimeMappings, currentCampus]);

  const handleCampusChange = (isSelected: boolean) => {
    const newCampus = isSelected ? "secondary" : "main";

    setCurrentCampus(newCampus);
    onCampusChange?.(newCampus);
  };

  // Group courses by unique course code to assign consistent colors
  const courseColorMap = useMemo(() => {
    const uniqueCourses = Array.from(
      new Set(courses.map((course) => course.code)),
    );
    const colorMap: Record<string, string> = {};

    uniqueCourses.forEach((courseCode, index) => {
      colorMap[courseCode] = COURSE_COLORS[index % COURSE_COLORS.length];
    });

    return colorMap;
  }, [courses]);

  // Get course for specific day and period
  const getCourseForSlot = (
    day: number,
    period: number,
  ): WeeklyScheduleCourse | undefined => {
    return courses.find(
      (course) => course.day === day && course.period === period,
    );
  };

  // Helper function to determine time of day based on period number
  const getTimeOfDay = (period: number): "morning" | "noon" | "evening" => {
    if (period <= 4) return "morning";
    if (period <= 9) return "noon";

    return "evening";
  };

  const renderTimeSlot = (day: number, period: number) => {
    const course = getCourseForSlot(day, period);
    const isEmpty = !course;
    const timeOfDay = getTimeOfDay(period);

    return (
      <div
        key={`${day}-${period}`}
        className={clsx(
          "min-h-[60px] p-1 border border-gray-200 dark:border-gray-700 relative",
          TIME_OF_DAY_COLORS[timeOfDay],
          {
            "hover:bg-gray-100 dark:hover:bg-gray-800": isEmpty,
          },
        )}
      >
        {course && (
          <div
            className={clsx(
              "h-full w-full rounded-md p-2 border-2 text-xs",
              courseColorMap[course.code] || COURSE_COLORS[0],
            )}
          >
            <div className="font-semibold text-xs leading-tight mb-1">
              {course.name}
            </div>
            <div className="text-xs opacity-80">{course.teacher}</div>
            <div className="text-xs opacity-70">{course.class}</div>
          </div>
        )}
      </div>
    );
  };

  const renderUnifiedSchedule = () => {
    return (
      <div className="grid grid-cols-8 gap-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Headers */}
        <div className="bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-600">
          <div className="text-xs font-semibold text-center">時間</div>
        </div>
        {DAY_NAMES.map((dayName, dayIndex) => (
          <div
            key={dayIndex}
            className="bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
          >
            <div className="text-xs font-semibold text-center">{dayName}</div>
          </div>
        ))}

        {/* Time slots for all periods */}
        {currentMapping.periods.map((timeInfo) => (
          <React.Fragment key={`period-${timeInfo.period}`}>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 border-r border-gray-300 dark:border-gray-600 border-t">
              <div className="text-xs text-center">
                <div className="font-medium">{timeInfo.label}</div>
                <div className="text-xs opacity-70">{timeInfo.startTime}</div>
                <div className="text-xs opacity-70">{timeInfo.endTime}</div>
              </div>
            </div>
            {DAY_NAMES.map((_, dayIndex) => (
              <React.Fragment key={`${timeInfo.period}-day-${dayIndex}`}>
                {renderTimeSlot(dayIndex, timeInfo.period)}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <Card className={clsx("w-full max-w-7xl", className)}>
      <CardHeader className="flex flex-col space-y-4">
        <div className="flex justify-between items-center w-full">
          <h3 className="text-xl font-bold">週課表</h3>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              校本部
            </span>
            <Switch
              color="primary"
              isSelected={currentCampus === "secondary"}
              size="lg"
              onValueChange={handleCampusChange}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              博愛校區
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">目前選擇：</span>
          <Chip color="primary" size="sm" variant="flat">
            {currentMapping.name}
          </Chip>
        </div>

        <Divider />
      </CardHeader>

      <CardBody className="overflow-x-auto">
        <div className="min-w-[800px]">{renderUnifiedSchedule()}</div>

        {courses.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>目前沒有課程資料</p>
            <p className="text-sm">請傳入課程陣列以顯示課表</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default WeeklySchedule;
