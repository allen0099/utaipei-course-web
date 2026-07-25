import { Button, Card, Chip, ToggleButton } from "@heroui/react";
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";

import { CalendarEvent } from "@/interfaces/globals";

export interface AcademicCalendarProps {
  events: CalendarEvent[];
}

/** 學校用單字縮寫標示主辦單位，展開成全名才看得懂。 */
const UNIT_NAMES: Record<string, string> = {
  教: "教務處",
  學: "學務處",
  秘: "秘書室",
  體: "體育處",
  研: "研發處",
  研發: "研發處",
  通: "通識中心",
  教育: "教育學院",
  人文: "人文藝術學院",
  理: "理學院",
  市政: "市政管理學院",
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const unitLabel = (unit: string) => UNIT_NAMES[unit] ?? unit;

/** "YYYY-MM-DD" → 當地時區的 Date。用 new Date(iso) 會被當成 UTC 而在台灣時區差一天。 */
const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

/** 事件涵蓋的每一天（含跨日區間的中間日）。 */
const datesCovered = (event: CalendarEvent): string[] => {
  if (!event.endDate) return [event.date];

  const dates: string[] = [];
  const cursor = parseISODate(event.date);
  const end = parseISODate(event.endDate);

  while (cursor <= end) {
    dates.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

interface MonthGrid {
  key: string;
  label: string;
  /** 開頭補空格，讓當月 1 號落在正確的星期欄位。 */
  cells: (string | null)[];
}

/** 依事件涵蓋範圍產生連續月份，每月補成完整的週列。 */
const buildMonths = (events: CalendarEvent[]): MonthGrid[] => {
  if (events.length === 0) return [];

  const all = events.flatMap((e) => [e.date, e.endDate ?? e.date]).sort();
  const first = parseISODate(all[0]);
  const last = parseISODate(all[all.length - 1]);

  const months: MonthGrid[] = [];
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);

  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(
      new Date(year, month, 1).getDay(),
    ).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(toISODate(new Date(year, month, day)));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    months.push({
      key: `${year}-${month}`,
      // 民國年更貼近校內慣用說法，西元年另外附註
      label: `民國 ${year - 1911} 年 ${month + 1} 月（${year}）`,
      cells,
    });
    cursor.setMonth(month + 1);
  }

  return months;
};

const formatDateLabel = (event: CalendarEvent): string => {
  const start = parseISODate(event.date);
  const startLabel = `${start.getMonth() + 1}/${start.getDate()}（${WEEKDAYS[start.getDay()]}）`;

  if (!event.endDate) return startLabel;

  const end = parseISODate(event.endDate);

  return `${startLabel} – ${end.getMonth() + 1}/${end.getDate()}（${WEEKDAYS[end.getDay()]}）`;
};

interface MonthCarouselProps {
  months: MonthGrid[];
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

/**
 * 桌機把整學期的月份並排成格狀；手機一次只放得下一個月，改用 scroll-snap 輪播，
 * 直接沿用原生觸控左右滑動。
 *
 * 換學期時要回到第一個月，作法是由父層以 key 讓本元件重新掛載，捲動位置與
 * activeMonth 都會自然歸零，不必在 effect 裡 setState。
 */
const MonthCarousel = ({
  months,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: MonthCarouselProps) => {
  const [activeMonth, setActiveMonth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  /**
   * 由捲動位置回推目前停在第幾個月。每張卡片剛好等於容器寬度且無間距，
   * 所以四捨五入即是索引；桌機是格狀排列不會觸發水平捲動。
   */
  const handleScroll = () => {
    const carousel = carouselRef.current;

    if (!carousel || carousel.clientWidth === 0) return;

    setActiveMonth(Math.round(carousel.scrollLeft / carousel.clientWidth));
  };

  const goToMonth = (index: number) => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    carousel.scrollTo({
      left: index * carousel.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <div>
      {/* 手機：一次一個月的 scroll-snap 輪播。sm 以上回到並排格狀並關掉水平捲動。 */}
      <div
        ref={carouselRef}
        aria-label="每月行事曆"
        className="flex snap-x snap-mandatory overflow-x-auto sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-x-visible xl:grid-cols-3"
        role="group"
        onScroll={handleScroll}
      >
        {months.map((month) => (
          <Card
            key={month.key}
            className="w-full shrink-0 snap-center p-3 sm:w-auto"
          >
            <h3 className="mb-2 text-center text-sm font-semibold">
              {month.label}
            </h3>
            <div className="grid grid-cols-7 gap-px text-center text-xs">
              {WEEKDAYS.map((weekday, index) => (
                <div
                  key={weekday}
                  className={clsx(
                    "py-1 font-medium",
                    index === 0 || index === 6
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500",
                  )}
                >
                  {weekday}
                </div>
              ))}
              {month.cells.map((date, index) => {
                if (!date) return <div key={`blank-${index}`} />;

                const dayEvents = eventsByDate.get(date) ?? [];
                const holiday = dayEvents.some((e) => e.isHoliday);
                const selected = selectedDate === date;

                return (
                  <button
                    key={date}
                    aria-label={`${date}${dayEvents.length > 0 ? `，${dayEvents.length} 個事件` : ""}`}
                    aria-pressed={selected}
                    className={clsx(
                      "aspect-square rounded-sm p-1 leading-tight transition-colors",
                      selected && "ring-2 ring-blue-500 dark:ring-blue-400",
                      dayEvents.length === 0 &&
                        "text-gray-400 dark:text-gray-600",
                      dayEvents.length > 0 &&
                        !holiday &&
                        "bg-blue-100 font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200",
                      holiday &&
                        "bg-red-100 font-medium text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200",
                    )}
                    disabled={dayEvents.length === 0}
                    type="button"
                    onClick={() => onSelectDate(selected ? null : date)}
                  >
                    {parseISODate(date).getDate()}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* 輪播沒有捲軸，用圓點交代總共幾個月、目前在哪一個，也提供不靠滑動的切換方式 */}
      {months.length > 1 && (
        <div className="mt-3 flex justify-center gap-2 sm:hidden">
          {months.map((month, index) => (
            <button
              key={month.key}
              aria-current={index === activeMonth}
              aria-label={`跳至 ${month.label}`}
              className={clsx(
                "size-2 rounded-full transition-colors",
                index === activeMonth
                  ? "bg-blue-500 dark:bg-blue-400"
                  : "bg-gray-300 dark:bg-gray-600",
              )}
              type="button"
              onClick={() => goToMonth(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 學期行事曆：上方月曆標出有事件的日期，下方依時間順序列出事件。
 * 資料來自 crawler 解析 PDF 後發布的 calendar/<year>/<semester>.json。
 *
 * 手機把單位篩選移到月曆下方，讓一進畫面就看得到月曆。
 */
export const AcademicCalendar = ({ events }: AcademicCalendarProps) => {
  const [activeUnits, setActiveUnits] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const units = useMemo(() => {
    const seen = new Map<string, number>();

    for (const event of events) {
      if (event.unit) seen.set(event.unit, (seen.get(event.unit) ?? 0) + 1);
    }

    return [...seen.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([unit]) => unit);
  }, [events]);

  const visibleEvents = useMemo(
    () =>
      activeUnits.length === 0
        ? events
        : events.filter((e) => e.unit && activeUnits.includes(e.unit)),
    [events, activeUnits],
  );

  const months = useMemo(() => buildMonths(events), [events]);

  /** 每個日期對應到當天的事件，供月曆格標記與點選日期後篩選使用。 */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    for (const event of visibleEvents) {
      for (const date of datesCovered(event)) {
        const list = map.get(date);

        if (list) list.push(event);
        else map.set(date, [event]);
      }
    }

    return map;
  }, [visibleEvents]);

  const listedEvents = selectedDate
    ? (eventsByDate.get(selectedDate) ?? [])
    : visibleEvents;

  // 改變單位篩選時一併取消已選日期：原本選的那天在新篩選下可能一件事都沒有，
  // 留著只會顯示空清單，看不出來是被日期還是被單位篩掉的。
  const toggleUnit = (unit: string) => {
    setActiveUnits((current) =>
      current.includes(unit)
        ? current.filter((u) => u !== unit)
        : [...current, unit],
    );
    setSelectedDate(null);
  };

  const clearUnits = () => {
    setActiveUnits([]);
    setSelectedDate(null);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {units.length > 0 && (
        <div className="order-2 flex flex-wrap items-center justify-center gap-2 sm:order-1">
          <span className="text-sm text-gray-500">篩選單位：</span>
          {units.map((unit) => (
            <ToggleButton
              key={unit}
              isSelected={activeUnits.includes(unit)}
              size="sm"
              onChange={() => toggleUnit(unit)}
            >
              {unitLabel(unit)}
            </ToggleButton>
          ))}
          {activeUnits.length > 0 && (
            <Button size="sm" variant="ghost" onPress={clearUnits}>
              清除篩選
            </Button>
          )}
        </div>
      )}

      <div className="order-1 sm:order-2">
        {/* key 讓換學期時整個輪播重新掛載，捲動位置與目前月份自然歸零 */}
        <MonthCarousel
          key={months[0]?.key ?? "empty"}
          eventsByDate={eventsByDate}
          months={months}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      <div className="order-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">
            {selectedDate ? `${selectedDate} 的事件` : "本學期事件"}
          </h2>
          <span className="text-sm text-gray-500">
            共 {listedEvents.length} 筆
          </span>
          {selectedDate && (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setSelectedDate(null)}
            >
              顯示全部
            </Button>
          )}
        </div>

        {listedEvents.length === 0 ? (
          <p className="py-6 text-center text-gray-500">沒有符合條件的事件。</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {listedEvents.map((event, index) => (
              <li
                key={`${event.date}-${index}-${event.title}`}
                className={clsx(
                  "flex flex-col gap-1 rounded-md border-l-4 px-3 py-2 sm:flex-row sm:items-center sm:gap-3",
                  event.isHoliday
                    ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
                    : "border-blue-500 bg-gray-50 dark:border-blue-400 dark:bg-gray-800/40",
                )}
              >
                <span className="shrink-0 font-mono text-sm text-gray-600 dark:text-gray-400 sm:w-48">
                  {formatDateLabel(event)}
                </span>
                {event.unit && (
                  <Chip className="shrink-0" size="sm" variant="soft">
                    {unitLabel(event.unit)}
                  </Chip>
                )}
                <span className="grow">{event.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AcademicCalendar;
