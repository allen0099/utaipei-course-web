import { useMemo } from "react";

import { PartialCourse, WeeklyScheduleCourse } from "@/interfaces/globals.ts";
import { useT } from "@/i18n/language.tsx";
import { dayName } from "@/i18n/terms.ts";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export interface ScheduleSummaryProps {
  courses: PartialCourse[];
  /** convertCourses(courses)，呼叫端本來就算過了，不必在這裡再算一次。 */
  slots: WeeklyScheduleCourse[];
}

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="flex flex-col rounded-lg border border-border px-4 py-3">
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    {hint && <span className="text-xs text-muted">{hint}</span>}
  </div>
);

/**
 * 我的課表的學分／時數／每日節數總覽。
 *
 * 分享連結匯入的課只有五個欄位、沒有學分，所以加總時把「缺學分資料」的門數
 * 另外講出來 —— 靜靜當成 0 會讓總學分看起來比實際少，而使用者是拿這個數字去
 * 對學分上下限的。
 */
export const ScheduleSummary = ({ courses, slots }: ScheduleSummaryProps) => {
  const t = useT();
  const { credits, hours, missingCredits } = useMemo(() => {
    let credits = 0;
    let hours = 0;
    let missingCredits = 0;

    courses.forEach((course) => {
      const credit = Number.parseFloat(course.credits ?? "");

      if (Number.isFinite(credit)) {
        credits += credit;
      } else {
        missingCredits += 1;
      }

      const hour = Number.parseFloat(course.hours ?? "");

      if (Number.isFinite(hour)) hours += hour;
    });

    return { credits, hours, missingCredits };
  }, [courses]);

  // 每天佔用幾節。衝堂的兩門課疊在同一節只算一次，所以用 Set 而不是加總。
  const periodsByDay = useMemo(() => {
    const occupied = DAY_LABELS.map(() => new Set<number>());

    slots.forEach((slot) => {
      for (let i = 0; i < (slot.duration || 1); i++) {
        occupied[slot.day]?.add(slot.period + i);
      }
    });

    return occupied.map((set) => set.size);
  }, [slots]);

  const busiest = Math.max(...periodsByDay, 1);
  const unscheduled = courses.filter(
    (course) => !slots.some((slot) => slot.code === course.code),
  ).length;

  const formatNumber = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-3 gap-3">
        <Stat label={t("課程", "Courses")} value={String(courses.length)} />
        <Stat
          hint={
            missingCredits > 0
              ? t(
                  `${missingCredits} 門無學分資料`,
                  `${missingCredits} without credit data`,
                )
              : undefined
          }
          label={t("總學分", "Total credits")}
          value={formatNumber(credits)}
        />
        <Stat
          label={t("每週時數", "Hours per week")}
          value={formatNumber(hours)}
        />
      </dl>

      <div
        aria-label={t("每日節數", "Periods per day")}
        className="grid grid-cols-7 gap-1 rounded-lg border border-border px-4 py-3"
        role="group"
      >
        {periodsByDay.map((count, day) => (
          <div key={day} className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-full items-end justify-center">
              <div
                className={
                  count > 0
                    ? "w-full max-w-8 rounded-sm bg-accent"
                    : "w-full max-w-8 rounded-sm bg-surface-secondary"
                }
                style={{
                  height: count > 0 ? `${(count / busiest) * 100}%` : "2px",
                }}
              />
            </div>
            <span className="text-xs text-muted">
              {t(DAY_LABELS[day], dayName(day, t))}
            </span>
            <span className="text-xs font-medium tabular-nums">
              {/* 七欄很窄，英文只放數字；單位由這一組的 aria-label 交代。 */}
              {count > 0 ? t(`${count} 節`, String(count)) : "—"}
            </span>
          </div>
        ))}
      </div>

      {unscheduled > 0 && (
        <p className="text-xs text-muted">
          {t(
            `另有 ${unscheduled} 門課沒有排定上課時間，不會出現在課表上。`,
            unscheduled === 1
              ? "1 more course has no scheduled time and won't appear on the timetable."
              : `${unscheduled} more courses have no scheduled time and won't appear on the timetable.`,
          )}
        </p>
      )}
    </div>
  );
};

export default ScheduleSummary;
