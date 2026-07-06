import { useMemo } from "react";
import { Button, Card } from "@heroui/react";
import {
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { findScheduleConflicts } from "@/utils/schedule-conflict.ts";
import { MergedCourseItem } from "@/interfaces/globals.ts";

export const MySchedulePage = () => {
  const { selectedCourses, removeCourse, clearAll } = useSelectedCourses();

  const scheduleCourses = useMemo(
    () => convertCourses(selectedCourses),
    [selectedCourses],
  );

  const conflicts = useMemo(
    () => findScheduleConflicts(scheduleCourses),
    [scheduleCourses],
  );

  // Map each course code to the names of the other courses it conflicts with.
  const conflictNamesByCourseCode = useMemo(() => {
    const result = new Map<string, Set<string>>();

    conflicts.forEach((conflict) => {
      const slot = scheduleCourses.find((c) => c.id === conflict.slotId);

      if (!slot) return;

      const names = result.get(slot.code) || new Set<string>();

      conflict.conflictingSlotIds.forEach((otherId) => {
        const otherSlot = scheduleCourses.find((c) => c.id === otherId);

        if (otherSlot && otherSlot.code !== slot.code) {
          names.add(otherSlot.name);
        }
      });

      result.set(slot.code, names);
    });

    return result;
  }, [conflicts, scheduleCourses]);

  const hasConflicts = conflictNamesByCourseCode.size > 0;

  const handleRemove = (course: MergedCourseItem) => {
    removeCourse(course);
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center py-8 md:py-10 w-full">
        <div className="inline-block max-w-lg text-center justify-center mb-4">
          <h1 className={title()}>我的課表</h1>
        </div>

        {selectedCourses.length === 0 ? (
          <div className="text-center mt-4">
            <p className="text-gray-500 dark:text-gray-400">
              尚未選擇任何課程，請先至
              <a className="text-accent underline mx-1" href="/search">
                課程查詢
              </a>
              頁面勾選想要加入課表的課程。
            </p>
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col gap-6">
            {hasConflicts && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
                <ExclamationTriangleIcon className="shrink-0" width={20} />
                <span>
                  已選課程中有時段衝突，請確認課表下方標示的衝堂課程。
                </span>
              </div>
            )}

            <Card className="w-full">
              <Card.Header className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  已選課程（{selectedCourses.length}）
                </h3>
                <Button size="sm" variant="tertiary" onPress={() => clearAll()}>
                  清空所有課程
                </Button>
              </Card.Header>
              <Card.Content>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-700">
                        <th className="text-left p-2 whitespace-nowrap">
                          課程代碼
                        </th>
                        <th className="text-left p-2 whitespace-nowrap">
                          課程名稱
                        </th>
                        <th className="text-left p-2 whitespace-nowrap">
                          班級名稱
                        </th>
                        <th className="text-left p-2 whitespace-nowrap">
                          教師
                        </th>
                        <th className="text-left p-2 whitespace-nowrap">
                          時間
                        </th>
                        <th className="text-left p-2 whitespace-nowrap">
                          衝堂提示
                        </th>
                        <th className="text-left p-2 whitespace-nowrap">
                          移除
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCourses.map((course) => {
                        const conflictNames = conflictNamesByCourseCode.get(
                          course.code,
                        );

                        return (
                          <tr
                            key={`${course.code}-${course.class}`}
                            className="border-b border-gray-200 dark:border-gray-800"
                          >
                            <td className="p-2 whitespace-nowrap">
                              {course.code}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {course.name}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {course.class}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {course.teacher}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {course.time}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              {conflictNames && conflictNames.size > 0 ? (
                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <ExclamationTriangleIcon width={16} />與{" "}
                                  {Array.from(conflictNames).join("、")} 衝堂
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <Button
                                isIconOnly
                                aria-label={`移除 ${course.name}`}
                                size="sm"
                                variant="tertiary"
                                onPress={() => handleRemove(course)}
                              >
                                <TrashIcon width={16} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card.Content>
            </Card>

            <WeeklySchedule
              conflictCourseCodes={Array.from(conflictNamesByCourseCode.keys())}
              courses={scheduleCourses}
              scheduleTitle="我的課表"
            />
          </div>
        )}
      </section>
    </DefaultLayout>
  );
};

export default MySchedulePage;
