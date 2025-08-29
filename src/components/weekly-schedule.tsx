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
        timeOfDay: "morning",
      },
      {
        period: 2,
        startTime: "09:10",
        endTime: "10:00",
        label: "第2節",
        timeOfDay: "morning",
      },
      {
        period: 3,
        startTime: "10:10",
        endTime: "11:00",
        label: "第3節",
        timeOfDay: "morning",
      },
      {
        period: 4,
        startTime: "11:10",
        endTime: "12:00",
        label: "第4節",
        timeOfDay: "morning",
      },
      {
        period: 5,
        startTime: "12:10",
        endTime: "13:00",
        label: "第5節",
        timeOfDay: "noon",
      },
      {
        period: 6,
        startTime: "13:10",
        endTime: "14:00",
        label: "第6節",
        timeOfDay: "noon",
      },
      {
        period: 7,
        startTime: "14:10",
        endTime: "15:00",
        label: "第7節",
        timeOfDay: "noon",
      },
      {
        period: 8,
        startTime: "15:10",
        endTime: "16:00",
        label: "第8節",
        timeOfDay: "noon",
      },
      {
        period: 9,
        startTime: "16:10",
        endTime: "17:00",
        label: "第9節",
        timeOfDay: "noon",
      },
      {
        period: 10,
        startTime: "17:10",
        endTime: "18:00",
        label: "第10節",
        timeOfDay: "evening",
      },
      {
        period: 11,
        startTime: "18:20",
        endTime: "19:10",
        label: "第11節",
        timeOfDay: "evening",
      },
      {
        period: 12,
        startTime: "19:15",
        endTime: "20:05",
        label: "第12節",
        timeOfDay: "evening",
      },
      {
        period: 13,
        startTime: "20:10",
        endTime: "21:00",
        label: "第13節",
        timeOfDay: "evening",
      },
      {
        period: 14,
        startTime: "21:05",
        endTime: "21:55",
        label: "第14節",
        timeOfDay: "evening",
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
        timeOfDay: "morning",
      },
      {
        period: 2,
        startTime: "09:00",
        endTime: "09:50",
        label: "第2節",
        timeOfDay: "morning",
      },
      {
        period: 3,
        startTime: "10:00",
        endTime: "10:50",
        label: "第3節",
        timeOfDay: "morning",
      },
      {
        period: 4,
        startTime: "11:00",
        endTime: "11:50",
        label: "第4節",
        timeOfDay: "morning",
      },
      {
        period: 5,
        startTime: "12:00",
        endTime: "12:50",
        label: "第5節",
        timeOfDay: "noon",
      },
      {
        period: 6,
        startTime: "13:00",
        endTime: "13:50",
        label: "第6節",
        timeOfDay: "noon",
      },
      {
        period: 7,
        startTime: "14:00",
        endTime: "14:50",
        label: "第7節",
        timeOfDay: "noon",
      },
      {
        period: 8,
        startTime: "15:00",
        endTime: "15:50",
        label: "第8節",
        timeOfDay: "noon",
      },
      {
        period: 9,
        startTime: "16:00",
        endTime: "16:50",
        label: "第9節",
        timeOfDay: "noon",
      },
      {
        period: 10,
        startTime: "17:00",
        endTime: "17:50",
        label: "第10節",
        timeOfDay: "evening",
      },
      {
        period: 11,
        startTime: "18:10",
        endTime: "19:00",
        label: "第11節",
        timeOfDay: "evening",
      },
      {
        period: 12,
        startTime: "19:05",
        endTime: "19:55",
        label: "第12節",
        timeOfDay: "evening",
      },
      {
        period: 13,
        startTime: "20:00",
        endTime: "20:50",
        label: "第13節",
        timeOfDay: "evening",
      },
      {
        period: 14,
        startTime: "20:55",
        endTime: "21:45",
        label: "第14節",
        timeOfDay: "evening",
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

  // Group periods by time of day for visual separation
  const periodsByTimeOfDay = useMemo(() => {
    const groups: Record<string, typeof currentMapping.periods> = {
      morning: [],
      noon: [],
      evening: [],
    };

    currentMapping.periods.forEach((period) => {
      groups[period.timeOfDay].push(period);
    });

    return groups;
  }, [currentMapping]);

  const renderTimeSlot = (
    day: number,
    period: number,
    timeInfo: (typeof currentMapping.periods)[0],
  ) => {
    const course = getCourseForSlot(day, period);
    const isEmpty = !course;

    return (
      <div
        key={`${day}-${period}`}
        className={clsx(
          "min-h-[60px] p-1 border border-gray-200 dark:border-gray-700 relative",
          TIME_OF_DAY_COLORS[timeInfo.timeOfDay],
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

  const renderTimeOfDaySection = (
    timeOfDay: "morning" | "noon" | "evening",
    periods: typeof currentMapping.periods,
  ) => {
    const labels = {
      morning: "上午",
      noon: "中午",
      evening: "晚上",
    };

    return (
      <div key={timeOfDay} className="mb-6">
        <div className="flex items-center mb-2">
          <Chip
            className={clsx({
              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200":
                timeOfDay === "morning",
              "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200":
                timeOfDay === "noon",
              "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200":
                timeOfDay === "evening",
            })}
            size="sm"
            variant="flat"
          >
            {labels[timeOfDay]}
          </Chip>
        </div>

        <div className="grid grid-cols-8 gap-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          {/* Time period headers */}
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

          {/* Time slots */}
          {periods.map((timeInfo) => (
            <React.Fragment key={`period-${timeOfDay}-${timeInfo.period}`}>
              <div className="bg-gray-50 dark:bg-gray-700 p-2 border-r border-gray-300 dark:border-gray-600 border-t">
                <div className="text-xs text-center">
                  <div className="font-medium">{timeInfo.label}</div>
                  <div className="text-xs opacity-70">{timeInfo.startTime}</div>
                  <div className="text-xs opacity-70">{timeInfo.endTime}</div>
                </div>
              </div>
              {DAY_NAMES.map((_, dayIndex) => (
                <React.Fragment key={`${timeOfDay}-${timeInfo.period}-day-${dayIndex}`}>
                  {renderTimeSlot(dayIndex, timeInfo.period, timeInfo)}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
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
        <div className="min-w-[800px]">
          {Object.entries(periodsByTimeOfDay).map(
            ([timeOfDay, periods]) =>
              periods.length > 0 &&
              renderTimeOfDaySection(timeOfDay as any, periods),
          )}
        </div>

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
