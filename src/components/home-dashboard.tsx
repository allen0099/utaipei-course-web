import { useMemo } from "react";
import { Link } from "@heroui/react";

import { CalendarEvent, CalendarItem } from "@/interfaces/globals.ts";
import { siteConfig } from "@/config/site.ts";
import { useFetchJson } from "@/hooks/useFetchJson.ts";
import { useYms } from "@/hooks/useYms.ts";
import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { resolveTermRange } from "@/utils/ics-generator.ts";
import { useT } from "@/i18n/language.tsx";
import { dayName, semesterName } from "@/i18n/terms.ts";

const UPCOMING_LIMIT = 4;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatEventDate = (event: CalendarEvent): string => {
  const short = (value: string) => {
    const [, month, day] = value.split("-").map(Number);

    return `${month}/${day}`;
  };

  return event.endDate
    ? `${short(event.date)}–${short(event.endDate)}`
    : short(event.date);
};

const DashboardCard = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
    <div className="flex items-baseline justify-between gap-2">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      {action && (
        <Link className="text-xs whitespace-nowrap" href={action.href}>
          {action.label} →
        </Link>
      )}
    </div>
    {children}
  </section>
);

/**
 * 首頁的「現在」區塊：本學期第幾週、接下來的行事曆、我今天的課。
 *
 * 首頁原本只有功能入口，每次來都長得一樣。這三張卡回答的是回訪的人真正想知道
 * 的事，而且資料全部是現成的 —— yms.json、行事曆 JSON 與 localStorage 裡的
 * 課表，不需要爬蟲多產任何東西。
 *
 * 每張卡各自容錯：行事曆抓不到、或該學期沒有結構化資料時，那兩張卡整個不出現，
 * 而不是顯示錯誤 —— 這一區是錦上添花，不該在首頁正中央擺一個紅色的重試按鈕。
 */
export const HomeDashboard = () => {
  const { defaultCode, displayNameOf } = useYms();
  const { selectedCourses, scheduleYms } = useSelectedCourses();
  const [year, semester] = (defaultCode ?? "").split("#");
  const t = useT();

  const { data: calendars } = useFetchJson<CalendarItem[]>(
    `${siteConfig.links.github.api}/calendar.json`,
    { cache: true },
  );

  // 只有 parsed === true 才有 <year>/<semester>.json；undefined 代表爬蟲還沒
  // 重新發佈，當成有的話每次進首頁都會打一個 404（見 CLAUDE.md /calendar 一節）。
  const hasStructuredCalendar =
    !!defaultCode &&
    !!calendars?.some(
      (item) =>
        String(item.year) === year &&
        String(item.semester) === semester &&
        item.parsed === true,
    );

  const { data: events } = useFetchJson<CalendarEvent[]>(
    hasStructuredCalendar
      ? `${siteConfig.links.github.api}/calendar/${year}/${semester}.json`
      : null,
    { cache: true },
  );

  // 日期只取到「天」，整個元件的生命週期內當成不變。
  const today = useMemo(() => {
    const now = new Date();

    now.setHours(0, 0, 0, 0);

    return now;
  }, []);

  const termStatus = useMemo(() => {
    const term = events ? resolveTermRange(events) : null;

    if (!term) return null;

    if (today < term.start) {
      const days = Math.round(
        (term.start.getTime() - today.getTime()) / MS_PER_DAY,
      );

      return {
        headline: t(
          `距開學 ${days} 天`,
          days === 1
            ? "1 day until term starts"
            : `${days} days until term starts`,
        ),
        detail: "",
      };
    }

    if (today > term.end) return null;

    // 第 1 週是開學日所在的那一週（週一起算），不是開學日起的七天。
    const weekStart = new Date(term.start);

    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    const week =
      Math.floor((today.getTime() - weekStart.getTime()) / (7 * MS_PER_DAY)) +
      1;

    return {
      headline: t(`第 ${week} 週`, `Week ${week}`),
      detail: term.holidays.has(toDateKey(today))
        ? t("今天放假", "Holiday today")
        : "",
    };
  }, [events, today, t]);

  const upcoming = useMemo(() => {
    const todayKey = toDateKey(today);

    return (events ?? [])
      .filter((event) => (event.endDate ?? event.date) >= todayKey)
      .slice(0, UPCOMING_LIMIT);
  }, [events, today]);

  const todayIndex = (today.getDay() + 6) % 7;
  const scheduleIsCurrent = scheduleYms !== null && scheduleYms === defaultCode;
  const todayCourses = useMemo(
    () =>
      scheduleIsCurrent
        ? convertCourses(selectedCourses)
            .filter((slot) => slot.day === todayIndex)
            .sort((a, b) => a.period - b.period)
        : [],
    [scheduleIsCurrent, selectedCourses, todayIndex],
  );

  if (!defaultCode) return null;

  return (
    <div className="grid w-full max-w-4xl gap-3 md:grid-cols-3">
      <DashboardCard
        action={{ label: t("行事曆", "Calendar"), href: "/calendar" }}
        title={t("本學期", "This semester")}
      >
        <p className="text-sm">{semesterName(displayNameOf(defaultCode), t)}</p>
        {termStatus && (
          <p className="text-2xl font-semibold">
            {termStatus.headline}
            {termStatus.detail && (
              <span className="ml-2 text-sm font-normal text-danger">
                {termStatus.detail}
              </span>
            )}
          </p>
        )}
      </DashboardCard>

      <DashboardCard
        action={{ label: t("我的課表", "My Schedule"), href: "/my-schedule" }}
        title={t(
          `今天的課（${dayName(todayIndex, t)}）`,
          `Today's classes (${dayName(todayIndex, t)})`,
        )}
      >
        {!scheduleIsCurrent ? (
          <p className="text-sm text-muted">
            {t("還沒有本學期的課表。", "No schedule for this semester yet. ")}
            <Link className="text-sm" href="/search">
              {t("去查課程", "Search courses")}
            </Link>
          </p>
        ) : todayCourses.length === 0 ? (
          <p className="text-sm text-muted">
            {t("今天沒有課。", "No classes today.")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {todayCourses.map((slot) => {
              const end = slot.period + (slot.duration || 1) - 1;

              return (
                <li key={slot.id} className="flex gap-2">
                  <span className="shrink-0 text-muted tabular-nums">
                    {end > slot.period
                      ? t(`${slot.period}–${end} 節`, `P${slot.period}–${end}`)
                      : t(`${slot.period} 節`, `P${slot.period}`)}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{slot.name}</span>
                    {slot.classroom && (
                      <span className="ml-1 text-xs text-muted">
                        {slot.classroom}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardCard>

      {upcoming.length > 0 && (
        <DashboardCard
          action={{ label: t("全部", "All"), href: "/calendar" }}
          title={t("接下來", "Coming up")}
        >
          <ul className="flex flex-col gap-1.5 text-sm">
            {upcoming.map((event, index) => (
              <li key={`${event.date}-${index}`} className="flex gap-2">
                <span
                  className={
                    event.isHoliday
                      ? "shrink-0 font-medium text-danger tabular-nums"
                      : "shrink-0 text-muted tabular-nums"
                  }
                >
                  {formatEventDate(event)}
                </span>
                <span className="line-clamp-2 min-w-0">{event.title}</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}
    </div>
  );
};

export default HomeDashboard;
