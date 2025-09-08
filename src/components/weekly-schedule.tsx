import React, { useState, useMemo, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import clsx from "clsx";
import { Cog6ToothIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { XCircleIcon } from "@heroicons/react/24/outline";

import {
  WeeklyScheduleProps,
  WeeklyScheduleCourse,
  CampusTimeMapping,
} from "@/interfaces/globals";
import { downloadICSFile } from "@/utils/ics-generator";
import {
  downloadScheduleImage,
  generateScheduleImageBlob,
} from "@/utils/image-generator";
import ImagePreviewModal from "@/components/image-preview-modal";

// Default campus time mappings
const DEFAULT_CAMPUS_MAPPINGS: CampusTimeMapping[] = [
  {
    campus: "main",
    name: "博愛校區",
    periods: [
      {
        period: 1,
        startTime: "08:10",
        endTime: "09:00",
        label: "第 1 節",
      },
      {
        period: 2,
        startTime: "09:10",
        endTime: "10:00",
        label: "第 2 節",
      },
      {
        period: 3,
        startTime: "10:10",
        endTime: "11:00",
        label: "第 3 節",
      },
      {
        period: 4,
        startTime: "11:10",
        endTime: "12:00",
        label: "第 4 節",
      },
      {
        period: 5,
        startTime: "12:10",
        endTime: "13:00",
        label: "第 5 節",
      },
      {
        period: 6,
        startTime: "13:10",
        endTime: "14:00",
        label: "第 6 節",
      },
      {
        period: 7,
        startTime: "14:10",
        endTime: "15:00",
        label: "第 7 節",
      },
      {
        period: 8,
        startTime: "15:10",
        endTime: "16:00",
        label: "第 8 節",
      },
      {
        period: 9,
        startTime: "16:10",
        endTime: "17:00",
        label: "第 9 節",
      },
      {
        period: 10,
        startTime: "17:10",
        endTime: "18:00",
        label: "第 10 節",
      },
      {
        period: 11,
        startTime: "18:10",
        endTime: "19:00",
        label: "第 11 節",
      },
      {
        period: 12,
        startTime: "19:10",
        endTime: "20:00",
        label: "第 12 節",
      },
      {
        period: 13,
        startTime: "20:10",
        endTime: "21:00",
        label: "第 13 節",
      },
      {
        period: 14,
        startTime: "21:10",
        endTime: "22:00",
        label: "第 14 節",
      },
    ],
  },
  {
    campus: "secondary",
    name: "天母校區",
    periods: [
      {
        period: 1,
        startTime: "08:10",
        endTime: "09:00",
        label: "第 1 節",
      },
      {
        period: 2,
        startTime: "09:10",
        endTime: "10:00",
        label: "第 2 節",
      },
      {
        period: 3,
        startTime: "10:10",
        endTime: "11:00",
        label: "第 3 節",
      },
      {
        period: 4,
        startTime: "11:10",
        endTime: "12:00",
        label: "第 4 節",
      },
      {
        period: 5,
        startTime: "12:10",
        endTime: "13:00",
        label: "第 5 節",
      },
      {
        period: 6,
        startTime: "13:10",
        endTime: "14:00",
        label: "第 6 節",
      },
      {
        period: 7,
        startTime: "14:10",
        endTime: "15:00",
        label: "第 7 節",
      },
      {
        period: 8,
        startTime: "15:10",
        endTime: "16:00",
        label: "第 8 節",
      },
      {
        period: 9,
        startTime: "16:10",
        endTime: "17:00",
        label: "第 9 節",
      },
      {
        period: 10,
        startTime: "17:10",
        endTime: "18:00",
        label: "第 10 節",
      },
      {
        period: 11,
        startTime: "18:30",
        endTime: "19:15",
        label: "第 A 節",
      },
      {
        period: 12,
        startTime: "19:15",
        endTime: "20:00",
        label: "第 B 節",
      },
      {
        period: 13,
        startTime: "20:20",
        endTime: "21:05",
        label: "第 C 節",
      },
      {
        period: 14,
        startTime: "21:05",
        endTime: "21:50",
        label: "第 D 節",
      },
    ],
  },
];

const DAY_NAMES = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

// Schedule settings interface
interface ScheduleSettings {
  hideWeekend: boolean;
  hideNight: boolean;
  hideTimeLabel: boolean;
}

// Default settings
const DEFAULT_SETTINGS: ScheduleSettings = {
  hideWeekend: false,
  hideNight: false,
  hideTimeLabel: false,
};

// localStorage key for settings
const SETTINGS_STORAGE_KEY = "weekly-schedule-settings";

// Utility functions for localStorage
const loadSettings = (): ScheduleSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // Silently fall back to default settings if localStorage fails
  }

  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: ScheduleSettings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Silently ignore storage failures
  }
};

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
  scheduleTitle = "週課表",
  courses = [],
  campusTimeMappings = DEFAULT_CAMPUS_MAPPINGS,
  selectedCampus = "main",
  onCampusChange,
  className,
}) => {
  const [currentCampus, setCurrentCampus] = useState<"main" | "secondary">(
    selectedCampus,
  );
  const [hoveredCourseCode, setHoveredCourseCode] = useState<string | null>(
    null,
  );

  // Settings state
  const [settings, setSettings] = useState<ScheduleSettings>(DEFAULT_SETTINGS);
  // Image preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewImageBlob, setPreviewImageBlob] = useState<Blob | null>(null);

  // Load settings on component mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Save settings whenever they change
  const updateSetting = (key: keyof ScheduleSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };

    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Handle ICS file download
  const handleICSDownload = () => {
    downloadICSFile(courses, currentMapping, scheduleTitle);
  };

  // Handle image download with preview
  const handleImageDownload = async () => {
    try {
      const blob = await generateScheduleImageBlob(scheduleTitle);

      setPreviewImageBlob(blob);
      setIsPreviewModalOpen(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to generate preview image:", error);
      // Fallback to direct download if preview fails
      await downloadScheduleImage(scheduleTitle);
    }
  };

  // Handle confirmed download from preview modal
  const handleConfirmDownload = () => {
    if (previewImageBlob) {
      const url = URL.createObjectURL(previewImageBlob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${scheduleTitle}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    }
  };

  // Handle closing preview modal
  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setPreviewImageBlob(null);
  };

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

  // Get courses for specific day and period (each course appears in every period it spans)
  const getCoursesForSlot = (
    day: number,
    period: number,
  ): WeeklyScheduleCourse[] => {
    return courses.filter((course) => {
      // Check if this period falls within the course's duration
      const courseDuration = course.duration || 1;
      const courseEndPeriod = course.period + courseDuration - 1;

      return (
        course.day === day &&
        period >= course.period &&
        period <= courseEndPeriod
      );
    });
  };

  // Handle course hover events
  const handleCourseMouseEnter = (courseCode: string) => {
    setHoveredCourseCode(courseCode);
  };

  const handleCourseMouseLeave = () => {
    setHoveredCourseCode(null);
  };

  // Helper function to determine time of day based on period number
  const getTimeOfDay = (period: number): "morning" | "noon" | "evening" => {
    if (period <= 5) return "morning";
    if (period <= 10) return "noon";

    return "evening";
  };

  // Filter days based on settings
  const getVisibleDays = () => {
    if (settings.hideWeekend) {
      return DAY_NAMES.slice(0, 5); // Only Monday to Friday
    }

    return DAY_NAMES;
  };

  const getVisibleDayIndices = () => {
    if (settings.hideWeekend) {
      return [0, 1, 2, 3, 4]; // Only Monday to Friday indices
    }

    return [0, 1, 2, 3, 4, 5, 6]; // All days
  };

  // Filter periods based on settings
  const getVisiblePeriods = () => {
    if (settings.hideNight) {
      // Hide evening periods (typically 11-14 based on the time mappings)
      return currentMapping.periods.filter((period) => period.period <= 10);
    }

    return currentMapping.periods;
  };

  const renderTimeSlot = (day: number, period: number) => {
    const coursesInSlot = getCoursesForSlot(day, period);
    const isEmpty = coursesInSlot.length === 0;
    const timeOfDay = getTimeOfDay(period);

    // Check if any course in this slot is being hovered
    const hasHoveredCourse =
      hoveredCourseCode &&
      coursesInSlot.some((course) => course.code === hoveredCourseCode);

    return (
      <div
        key={`${day}-${period}`}
        className={clsx(
          "min-h-[60px] p-1 border border-gray-200 dark:border-gray-700 relative",
          TIME_OF_DAY_COLORS[timeOfDay],
          {
            "hover:bg-gray-100 dark:hover:bg-gray-800": isEmpty,
            // Highlight slot if it contains the hovered course
            "ring-2 ring-blue-400 dark:ring-blue-500": hasHoveredCourse,
          },
        )}
      >
        {coursesInSlot.length > 0 && (
          <div className="h-full w-full flex flex-col gap-1">
            {coursesInSlot.map((course, index) => {
              const isHovered = hoveredCourseCode === course.code;
              const isDimmed =
                hoveredCourseCode && hoveredCourseCode !== course.code;

              return (
                <div
                  key={course.id}
                  className={clsx(
                    "flex-1 rounded-md p-2 border-2 text-xs transition-all duration-200 cursor-pointer",
                    courseColorMap[course.code] || COURSE_COLORS[0],
                    {
                      "mb-1": index < coursesInSlot.length - 1, // Add margin between multiple courses
                      // Highlight the hovered course
                      "ring-2 ring-blue-500 scale-105 shadow-lg": isHovered,
                      // Dim other courses when something is hovered
                      "opacity-30 blur-[1px]": isDimmed,
                    },
                  )}
                  onMouseEnter={() => handleCourseMouseEnter(course.code)}
                  onMouseLeave={handleCourseMouseLeave}
                >
                  <div className="font-semibold text-xs leading-tight mb-1">
                    {course.name}
                  </div>
                  <div className="text-xs opacity-80">{course.teacher}</div>
                  <div className="text-xs opacity-70">{course.class}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderUnifiedSchedule = () => {
    const visibleDays = getVisibleDays();
    const visibleDayIndices = getVisibleDayIndices();
    const visiblePeriods = getVisiblePeriods();

    return (
      <div
        className={`grid gap-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden`}
        id="weekly-schedule-grid"
        style={{
          gridTemplateColumns: `auto repeat(${visibleDays.length}, 1fr)`,
        }}
      >
        {/* Headers */}
        <div className="bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-600">
          <div className="text-xs font-semibold text-center">時間</div>
        </div>
        {visibleDays.map((dayName, visibleIndex) => (
          <div
            key={visibleIndex}
            className="bg-gray-100 dark:bg-gray-800 p-2 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
          >
            <div className="text-xs font-semibold text-center">{dayName}</div>
          </div>
        ))}

        {/* Time slots for visible periods */}
        {visiblePeriods.map((timeInfo) => (
          <React.Fragment key={`period-${timeInfo.period}`}>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 border-r border-gray-300 dark:border-gray-600 border-t">
              <div className="text-xs text-center">
                <div className="font-medium">{timeInfo.label}</div>
                {!settings.hideTimeLabel && (
                  <>
                    <div className="text-xs opacity-70">
                      {timeInfo.startTime}
                    </div>
                    <div className="text-xs opacity-70">{timeInfo.endTime}</div>
                  </>
                )}
              </div>
            </div>
            {visibleDayIndices.map((dayIndex) => {
              return renderTimeSlot(dayIndex, timeInfo.period);
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <Card className={clsx("w-full max-w-7xl", className)}>
      <CardHeader className="flex flex-col space-y-4">
        <div className="relative flex-row items-center w-full">
          <h3 className="static md:absolute lg:left-1/2 lg:-translate-x-1/2 text-xl font-bold">
            {scheduleTitle}
          </h3>

          <div
            className="flex items-center space-x-3 justify-end pt-2 md:pt-0"
            id="calendar-toolbox"
          >
            <div className="flex items-center space-x-2">
              <Chip color="primary" size="sm" variant="flat">
                {currentMapping.name}
              </Chip>
              <Switch
                color="primary"
                isSelected={currentCampus === "secondary"}
                size="lg"
                onValueChange={handleCampusChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Tooltip content="下載 ICS 檔案">
                <Button
                  isIconOnly
                  className="bg-gradient-to-tl from-cyan-500 to-blue-600 text-white shadow-lg"
                  size="sm"
                  variant="solid"
                  onPress={handleICSDownload}
                >
                  <ArrowDownTrayIcon width="20" />
                </Button>
              </Tooltip>
              <Tooltip content="另存圖片">
                <Button
                  isIconOnly
                  className="bg-green-700 dark:bg-green-900 text-white shadow-lg"
                  size="sm"
                  variant="solid"
                  onPress={handleImageDownload}
                >
                  <ArrowDownTrayIcon width="20" />
                </Button>
              </Tooltip>

              <Dropdown>
                <Tooltip color="default" content="設定">
                  <div>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="bordered">
                        <Cog6ToothIcon width="20" />
                      </Button>
                    </DropdownTrigger>
                  </div>
                </Tooltip>
                <DropdownMenu
                  onAction={(key) => {
                    const stringKey = key as string;

                    if (stringKey === "hide-weekend") {
                      updateSetting("hideWeekend", !settings.hideWeekend);
                    } else if (stringKey === "hide-night") {
                      updateSetting("hideNight", !settings.hideNight);
                    } else if (stringKey === "hide-time-label") {
                      updateSetting("hideTimeLabel", !settings.hideTimeLabel);
                    }
                  }}
                >
                  <DropdownItem
                    key="hide-weekend"
                    startContent={
                      settings.hideWeekend ? (
                        <CheckCircleIcon width="20" />
                      ) : (
                        <XCircleIcon width="20" />
                      )
                    }
                  >
                    隱藏周末
                  </DropdownItem>
                  <DropdownItem
                    key="hide-night"
                    startContent={
                      settings.hideNight ? (
                        <CheckCircleIcon width="20" />
                      ) : (
                        <XCircleIcon width="20" />
                      )
                    }
                  >
                    隱藏晚上
                  </DropdownItem>
                  <DropdownItem
                    key="hide-time-label"
                    startContent={
                      settings.hideTimeLabel ? (
                        <CheckCircleIcon width="20" />
                      ) : (
                        <XCircleIcon width="20" />
                      )
                    }
                  >
                    隱藏時間
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>

        <Divider />
      </CardHeader>

      <CardBody className="overflow-x-auto">
        {courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>沒有課程資料</p>
            <p className="text-sm">請重新查詢</p>
          </div>
        ) : (
          <div className="min-w-[800px]">{renderUnifiedSchedule()}</div>
        )}
      </CardBody>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageBlob={previewImageBlob}
        isOpen={isPreviewModalOpen}
        title={scheduleTitle}
        onClose={handleClosePreview}
        onConfirmDownload={handleConfirmDownload}
      />
    </Card>
  );
};

export default WeeklySchedule;
