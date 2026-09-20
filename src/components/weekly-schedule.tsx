import React, { useState, useMemo } from "react";
import {
  Card,
  Switch,
  Separator,
  Button,
  Tooltip,
  Dropdown,
  Label,
  Modal,
} from "@heroui/react";
import clsx from "clsx";
import {
  Cog6ToothIcon,
  CalendarDaysIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

import {
  WeeklyScheduleProps,
  WeeklyScheduleCourse,
  CampusTimeMapping,
  CalendarEvent,
} from "@/interfaces/globals";
import { siteConfig } from "@/config/site.ts";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport.ts";
import { downloadICSFile, resolveTermRange } from "@/utils/ics-generator";
import {
  downloadScheduleImage,
  generateScheduleImageBlob,
} from "@/utils/image-generator";
import ImagePreviewModal from "@/components/image-preview-modal";
import { sectionTitle } from "@/components/primitives.ts";
import { downloadBlob } from "@/utils/download.ts";

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

  // No stored preference yet: on small screens start in a compact layout
  // (hide the weekend and the start/end times) so the mobile day view isn't
  // crowded. This only applies to first-time mobile users and is persisted
  // once they interact with the settings dropdown.
  const isMobile =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 767px)").matches;

  if (isMobile) {
    return { hideWeekend: true, hideNight: false, hideTimeLabel: true };
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

// 12 well-separated hues, plus 4 darker repeats of the most distinct of them.
// The previous 45-entry list padded itself out with slate/gray/zinc/neutral/
// stone at the same lightness (indistinguishable) and with -50 variants that
// were near-identical to their -100 siblings, so the colour stopped carrying
// any grouping information once a schedule had more than a handful of courses.
export const COURSE_COLORS = [
  "bg-red-100 border-red-400 text-red-900 dark:bg-red-900/40 dark:border-red-500 dark:text-red-100",
  "bg-orange-100 border-orange-400 text-orange-900 dark:bg-orange-900/40 dark:border-orange-500 dark:text-orange-100",
  "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-100",
  "bg-lime-100 border-lime-400 text-lime-900 dark:bg-lime-900/40 dark:border-lime-500 dark:text-lime-100",
  "bg-green-100 border-green-400 text-green-900 dark:bg-green-900/40 dark:border-green-500 dark:text-green-100",
  "bg-teal-100 border-teal-400 text-teal-900 dark:bg-teal-900/40 dark:border-teal-500 dark:text-teal-100",
  "bg-cyan-100 border-cyan-400 text-cyan-900 dark:bg-cyan-900/40 dark:border-cyan-500 dark:text-cyan-100",
  "bg-blue-100 border-blue-400 text-blue-900 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-100",
  "bg-indigo-100 border-indigo-400 text-indigo-900 dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-100",
  "bg-violet-100 border-violet-400 text-violet-900 dark:bg-violet-900/40 dark:border-violet-500 dark:text-violet-100",
  "bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900 dark:bg-fuchsia-900/40 dark:border-fuchsia-500 dark:text-fuchsia-100",
  "bg-rose-100 border-rose-400 text-rose-900 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-100",
  "bg-red-200 border-red-600 text-red-950 dark:bg-red-700/40 dark:border-red-300 dark:text-red-50",
  "bg-green-200 border-green-600 text-green-950 dark:bg-green-700/40 dark:border-green-300 dark:text-green-50",
  "bg-blue-200 border-blue-600 text-blue-950 dark:bg-blue-700/40 dark:border-blue-300 dark:text-blue-50",
  "bg-violet-200 border-violet-600 text-violet-950 dark:bg-violet-700/40 dark:border-violet-300 dark:text-violet-50",
];

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  scheduleTitle = "週課表",
  courses = [],
  campusTimeMappings = DEFAULT_CAMPUS_MAPPINGS,
  selectedCampus = "main",
  onCampusChange,
  className,
  conflictCourseCodes = [],
  yms,
  renderCourseActions,
  onEmptySlotPress,
}) => {
  const conflictCourseCodeSet = useMemo(
    () => new Set(conflictCourseCodes),
    [conflictCourseCodes],
  );
  const [currentCampus, setCurrentCampus] = useState<"main" | "secondary">(
    selectedCampus,
  );
  const [hoveredCourseCode, setHoveredCourseCode] = useState<string | null>(
    null,
  );
  // 點開哪一門課的詳情。存代碼而不是整筆 slot：一門課一週可能上好幾次，詳情
  // 要把每個時段都列出來。
  const [detailCourseCode, setDetailCourseCode] = useState<string | null>(null);
  // Selected day for the mobile single-day/list view. Defaults to today
  // (converted from JS 0=Sun..6=Sat to our 0=Mon..6=Sun indexing).
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(
    () => (new Date().getDay() + 6) % 7,
  );

  // Settings state, read synchronously from localStorage on first render
  // instead of via a mount effect (this is a client-only SPA, so
  // localStorage is always available when this component renders).
  const [settings, setSettings] = useState<ScheduleSettings>(loadSettings);
  // Image preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewImageBlob, setPreviewImageBlob] = useState<Blob | null>(null);

  // Tracks the same breakpoint as the `md:` classes below, so the clipped
  // desktop grid can be taken out of the accessibility tree on phones. The
  // CSS classes stay the source of truth for layout; this only mirrors them
  // for the attributes CSS can't set.
  const isMobileViewport = useIsMobileViewport();

  // Save settings whenever they change
  const updateSetting = (key: keyof ScheduleSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };

    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const currentMapping = useMemo(() => {
    return (
      campusTimeMappings.find((mapping) => mapping.campus === currentCampus) ||
      campusTimeMappings[0]
    );
  }, [campusTimeMappings, currentCampus]);

  // Handle ICS file download
  const handleICSDownload = async () => {
    // 學期起訖來自行事曆。抓不到（舊學年期沒有結構化行事曆、離線、尚未公布）
    // 都不該擋住匯出，generateICSContent 會退回「下週一起 18 週」。
    let term = null;

    if (yms) {
      const [year, semester] = yms.split("#");

      try {
        const res = await fetch(
          `${siteConfig.links.github.api}/calendar/${year}/${semester}.json`,
        );

        if (res.ok) {
          term = resolveTermRange((await res.json()) as CalendarEvent[]);
        }
      } catch {
        // fall through to the 18-week fallback
      }
    }

    downloadICSFile(courses, currentMapping, scheduleTitle, term);
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
      downloadBlob(previewImageBlob, `${scheduleTitle}.png`);
    }
  };

  // Handle closing preview modal
  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
    setPreviewImageBlob(null);
  };

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

  // A display setting must never hide one of the user's own courses: a hidden
  // course reads as a lost course, and nothing in the grid says anything is
  // missing. So the compact settings below only ever drop *empty* days and
  // periods -- whatever the user actually enrolled in always stays visible.
  const occupiedDays = useMemo(
    () => new Set(courses.map((course) => course.day)),
    [courses],
  );

  const lastOccupiedPeriod = useMemo(
    () =>
      courses.reduce(
        (latest, course) =>
          Math.max(latest, course.period + (course.duration || 1) - 1),
        0,
      ),
    [courses],
  );

  // Filter days based on settings
  const getVisibleDayIndices = () => {
    const all = [0, 1, 2, 3, 4, 5, 6];

    if (settings.hideWeekend) {
      return all.filter((day) => day < 5 || occupiedDays.has(day));
    }

    return all;
  };

  const getVisibleDays = () =>
    getVisibleDayIndices().map((day) => DAY_NAMES[day]);

  // Filter periods based on settings
  const getVisiblePeriods = () => {
    if (settings.hideNight) {
      // Hide evening periods (typically 11-14 based on the time mappings)
      return currentMapping.periods.filter(
        (period) => period.period <= 10 || period.period <= lastOccupiedPeriod,
      );
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
          "min-h-[60px] p-1 border border-border relative",
          TIME_OF_DAY_COLORS[timeOfDay],
          {
            "hover:bg-surface-secondary": isEmpty,
            // Highlight slot if it contains the hovered course
            "ring-2 ring-blue-400 dark:ring-blue-500": hasHoveredCourse,
          },
        )}
      >
        {isEmpty && onEmptySlotPress && (
          <button
            aria-label={`${DAY_NAMES[day]}第 ${period} 節是空堂，查詢這個時段的課`}
            className="absolute inset-0 flex items-center justify-center text-xs text-muted opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
            type="button"
            onClick={() => onEmptySlotPress(day, period)}
          >
            找課
          </button>
        )}
        {coursesInSlot.length > 0 && (
          <div className="h-full w-full flex flex-col gap-1">
            {coursesInSlot.map((course, index) => {
              const isHovered = hoveredCourseCode === course.code;
              const isDimmed =
                hoveredCourseCode && hoveredCourseCode !== course.code;
              const isConflicting = conflictCourseCodeSet.has(course.code);

              return (
                <button
                  key={course.id}
                  aria-label={`${course.name}，${course.teacher}，查看課程詳情`}
                  className={clsx(
                    "flex-1 w-full rounded-md p-2 border-2 text-left text-xs transition-all duration-200 cursor-pointer relative",
                    courseColorMap[course.code] || COURSE_COLORS[0],
                    {
                      "mb-1": index < coursesInSlot.length - 1, // Add margin between multiple courses
                      // Highlight the hovered course
                      "ring-2 ring-blue-500 scale-105 shadow-lg": isHovered,
                      // Dim other courses when something is hovered
                      "opacity-30 blur-[1px]": isDimmed,
                      // Flag conflicting courses with a warning ring
                      "ring-2 ring-red-500 dark:ring-red-400 border-red-500 dark:border-red-400":
                        isConflicting,
                    },
                  )}
                  type="button"
                  onBlur={handleCourseMouseLeave}
                  onClick={() => setDetailCourseCode(course.code)}
                  onFocus={() => handleCourseMouseEnter(course.code)}
                  onMouseEnter={() => handleCourseMouseEnter(course.code)}
                  onMouseLeave={handleCourseMouseLeave}
                >
                  {isConflicting && (
                    <ExclamationTriangleIcon
                      className="absolute top-1 right-1 text-danger"
                      width={14}
                    />
                  )}
                  <div className="font-semibold text-xs leading-tight mb-1">
                    {course.name}
                  </div>
                  <div className="text-xs opacity-80">{course.teacher}</div>
                  <div className="text-xs opacity-70">
                    {course.classroom ?? course.class}
                  </div>
                </button>
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
        aria-label={scheduleTitle}
        className={`grid gap-0 border border-border rounded-lg overflow-hidden`}
        id="weekly-schedule-grid"
        role="grid"
        style={{
          gridTemplateColumns: `auto repeat(${visibleDays.length}, 1fr)`,
        }}
      >
        {/* Headers */}
        <div
          className="bg-surface-secondary p-2 border-r border-border"
          role="columnheader"
        >
          <div className="text-xs font-semibold text-center">時間</div>
        </div>
        {visibleDays.map((dayName, visibleIndex) => (
          <div
            key={visibleIndex}
            className="bg-surface-secondary p-2 border-r border-border last:border-r-0"
            role="columnheader"
          >
            <div className="text-xs font-semibold text-center">{dayName}</div>
          </div>
        ))}

        {/* Time slots for visible periods */}
        {visiblePeriods.map((timeInfo) => (
          <React.Fragment key={`period-${timeInfo.period}`}>
            <div
              className="bg-background-secondary p-2 border-r border-border border-t"
              role="rowheader"
            >
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

  // --- Mobile single-day / list view -------------------------------------

  // Distinct courses on a given day (one entry per course, sorted by period),
  // filtered by the current period-visibility setting (hideNight).
  const getCoursesForDay = (dayIndex: number): WeeklyScheduleCourse[] => {
    const maxPeriod = getVisiblePeriods().reduce(
      (max, p) => Math.max(max, p.period),
      0,
    );

    return courses
      .filter((course) => course.day === dayIndex && course.period <= maxPeriod)
      .sort((a, b) => a.period - b.period);
  };

  // Build the "第 N〜M 節 · 08:10–10:00" label for a course span.
  const getCourseTimeLabel = (course: WeeklyScheduleCourse): string => {
    const duration = course.duration || 1;
    const endPeriod = course.period + duration - 1;
    const startInfo = currentMapping.periods.find(
      (p) => p.period === course.period,
    );
    const endInfo = currentMapping.periods.find((p) => p.period === endPeriod);

    const startLabel = startInfo?.label ?? `第 ${course.period} 節`;
    const periodText =
      duration > 1
        ? `${startLabel} ～ ${endInfo?.label ?? `第 ${endPeriod} 節`}`
        : startLabel;

    if (settings.hideTimeLabel || !startInfo || !endInfo) {
      return periodText;
    }

    return `${periodText} · ${startInfo.startTime}–${endInfo.endTime}`;
  };

  const renderMobileSchedule = () => {
    const visibleDays = getVisibleDays();
    const visibleDayIndices = getVisibleDayIndices();

    // Keep the selection within the currently visible days (e.g. when the
    // weekend is hidden and today is a weekend, fall back to the first day).
    const activeDay = visibleDayIndices.includes(selectedMobileDay)
      ? selectedMobileDay
      : visibleDayIndices[0];

    const dayCourses = getCoursesForDay(activeDay);

    return (
      <div className="flex flex-col gap-4">
        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleDayIndices.map((dayIndex, i) => {
            const isActive = dayIndex === activeDay;

            return (
              <button
                key={dayIndex}
                className={clsx(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-white shadow"
                    : "bg-surface-secondary text-foreground hover:bg-surface-tertiary",
                )}
                type="button"
                onClick={() => setSelectedMobileDay(dayIndex)}
              >
                {visibleDays[i]}
              </button>
            );
          })}
        </div>

        {/* Course list for the selected day */}
        {dayCourses.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <p className="text-sm">這天沒有課程</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dayCourses.map((course) => {
              const isConflicting = conflictCourseCodeSet.has(course.code);

              return (
                <button
                  key={course.id}
                  className={clsx(
                    "w-full rounded-lg border-2 p-3 text-left",
                    courseColorMap[course.code] || COURSE_COLORS[0],
                    {
                      "ring-2 ring-red-500 dark:ring-red-400 border-red-500 dark:border-red-400":
                        isConflicting,
                    },
                  )}
                  type="button"
                  onClick={() => setDetailCourseCode(course.code)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold leading-snug">
                      {course.name}
                    </div>
                    {isConflicting && (
                      <ExclamationTriangleIcon
                        className="shrink-0 text-danger"
                        width={18}
                      />
                    )}
                  </div>
                  <div className="mt-1 text-xs font-medium opacity-80">
                    {getCourseTimeLabel(course)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs opacity-70">
                    {course.teacher && <span>{course.teacher}</span>}
                    {course.class && <span>{course.class}</span>}
                    {course.classroom && <span>{course.classroom}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCourseDetail = () => {
    const slots = courses
      .filter((course) => course.code === detailCourseCode)
      .sort((a, b) => a.day - b.day || a.period - b.period);
    const course = slots[0];
    const close = () => setDetailCourseCode(null);

    return (
      <Modal>
        <Modal.Backdrop
          isOpen={!!course}
          onOpenChange={(open) => !open && close()}
        >
          <Modal.Container>
            <Modal.Dialog>
              {course && (
                <>
                  <Modal.Header>
                    <Modal.Heading>{course.name}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <dt className="text-muted">選課代碼</dt>
                      <dd>{course.code}</dd>
                      {course.teacher && (
                        <>
                          <dt className="text-muted">教師</dt>
                          <dd>{course.teacher}</dd>
                        </>
                      )}
                      {course.class && (
                        <>
                          <dt className="text-muted">班級</dt>
                          <dd>{course.class}</dd>
                        </>
                      )}
                      {course.classroom && (
                        <>
                          <dt className="text-muted">教室</dt>
                          <dd>{course.classroom}</dd>
                        </>
                      )}
                      <dt className="text-muted">時間</dt>
                      <dd className="flex flex-col gap-0.5">
                        {slots.map((slot) => (
                          <span key={slot.id}>
                            {DAY_NAMES[slot.day]} {getCourseTimeLabel(slot)}
                          </span>
                        ))}
                      </dd>
                    </dl>
                    {conflictCourseCodeSet.has(course.code) && (
                      <p className="mt-3 flex items-center gap-1 text-sm text-danger">
                        <ExclamationTriangleIcon width={16} />
                        這門課與其他已選課程衝堂
                      </p>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    {renderCourseActions?.(course.code, close)}
                    <Button variant="tertiary" onPress={close}>
                      關閉
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    );
  };

  return (
    // mt-5 was repeated at all three call sites; it belongs to the component.
    <Card className={clsx("mt-5 w-full max-w-7xl", className)}>
      <Card.Header className="flex flex-col space-y-4">
        <div className="relative flex-row items-center w-full">
          <h3
            className={sectionTitle({
              size: "md",
              // Only absolutely position it once it can actually be centred;
              // between md and lg it used to sit at left:auto over the toolbar.
              class: "static lg:absolute lg:left-1/2 lg:-translate-x-1/2",
            })}
          >
            {scheduleTitle}
          </h3>

          <div
            className="flex flex-wrap items-center justify-end gap-2 pt-2 md:pt-0"
            id="calendar-toolbox"
          >
            {/* Both campus names are spelled out either side of the switch.
                It used to be a Chip naming only the *current* campus next to
                a bare toggle: nothing said what the other state was, nor that
                this changes which 節次 time table the grid is read against.
                The Switch also carried no accessible name at all, so screen
                readers announced an unlabelled switch. */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">節次時間</span>
              <span
                className={clsx(
                  "text-sm",
                  currentCampus === "main"
                    ? "font-medium text-foreground"
                    : "text-muted",
                )}
              >
                {campusTimeMappings[0]?.name ?? "博愛校區"}
              </span>
              <Switch
                aria-label={`切換節次時間對應的校區，目前為${currentMapping.name}`}
                isSelected={currentCampus === "secondary"}
                size="md"
                onChange={(checked) => handleCampusChange(checked)}
              >
                <Switch.Content>
                  <Switch.Control className="data-[selected=true]:bg-accent">
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
              <span
                className={clsx(
                  "text-sm",
                  currentCampus === "secondary"
                    ? "font-medium text-foreground"
                    : "text-muted",
                )}
              >
                {campusTimeMappings[1]?.name ?? "天母校區"}
              </span>
            </div>

            {/* Tooltips never fire on touch, so on phones these three were
                unlabelled squares -- and the two exports used the *same*
                download icon, so they were not even distinguishable from each
                other. Icons now differ by what they produce (calendar / photo)
                and carry a visible label on mobile, where there is no hover to
                fall back on. */}
            <div className="flex items-center space-x-2">
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    aria-label="下載 ICS 行事曆檔案"
                    className="shadow-lg"
                    isIconOnly={!isMobileViewport}
                    size="sm"
                    variant="primary"
                    onPress={handleICSDownload}
                  >
                    <CalendarDaysIcon width="20" />
                    {isMobileViewport && <span>行事曆</span>}
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>下載 ICS 檔案</Tooltip.Content>
              </Tooltip>
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    aria-label="將課表另存為圖片"
                    className="shadow-lg"
                    isIconOnly={!isMobileViewport}
                    size="sm"
                    variant="secondary"
                    onPress={handleImageDownload}
                  >
                    <PhotoIcon width="20" />
                    {isMobileViewport && <span>圖片</span>}
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>另存圖片</Tooltip.Content>
              </Tooltip>

              <Dropdown>
                {/* HeroUI's Button is itself the RAC menu trigger (wired via
                    Dropdown's context), so it's used directly — wrapping it in
                    Dropdown.Trigger would render a <button> inside a <button>. */}
                <Tooltip>
                  <Tooltip.Trigger>
                    <Button
                      aria-label="課表顯示設定"
                      isIconOnly={!isMobileViewport}
                      size="sm"
                      variant="secondary"
                    >
                      <Cog6ToothIcon width="20" />
                      {isMobileViewport && <span>設定</span>}
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>設定</Tooltip.Content>
                </Tooltip>
                <Dropdown.Popover>
                  <Dropdown.Menu
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
                    <Dropdown.Item id="hide-weekend" textValue="隱藏周末">
                      {settings.hideWeekend ? (
                        <CheckCircleIcon width="20" />
                      ) : (
                        <XCircleIcon width="20" />
                      )}
                      <Label>隱藏周末</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="hide-night" textValue="隱藏晚上">
                      {settings.hideNight ? (
                        <CheckCircleIcon width="20" />
                      ) : (
                        <XCircleIcon width="20" />
                      )}
                      <Label>隱藏晚上</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="hide-time-label" textValue="隱藏時間">
                      {settings.hideTimeLabel ? (
                        <CheckCircleIcon width="20" />
                      ) : (
                        <XCircleIcon width="20" />
                      )}
                      <Label>隱藏時間</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </div>
          </div>
        </div>

        <Separator />
      </Card.Header>

      <Card.Content>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <p>沒有課程資料</p>
            <p className="text-sm">請重新查詢</p>
          </div>
        ) : (
          <>
            {/* Desktop table. Also the source for the "另存圖片" export, so it
                must stay in the DOM at full size on every screen. On mobile we
                clip it with h-0/overflow-hidden (NOT display:none) — html-to-image
                renders #weekly-schedule-grid as a standalone node, so parent
                clipping doesn't shrink its scrollWidth/scrollHeight and the
                export keeps working. */}
            {/* aria-hidden + inert: h-0/overflow-hidden keeps the node
                measurable for the export but does NOT remove it from the
                accessibility tree, so on mobile a screen reader would read the
                whole 7x14 grid and then the day list again. */}
            <div
              aria-hidden={isMobileViewport ? "true" : undefined}
              className="h-0 overflow-hidden md:h-auto md:overflow-x-auto"
              inert={isMobileViewport}
            >
              <div className="min-w-[800px]">{renderUnifiedSchedule()}</div>
            </div>

            {/* Mobile single-day / list view */}
            <div className="md:hidden">{renderMobileSchedule()}</div>
          </>
        )}
      </Card.Content>

      {renderCourseDetail()}

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
