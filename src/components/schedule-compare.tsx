import { useMemo } from "react";
import clsx from "clsx";

import { WeeklyScheduleCourse } from "@/interfaces/globals.ts";
import { useT } from "@/i18n/language.tsx";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const DAY_LABELS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const PERIODS = Array.from({ length: 14 }, (_, index) => index + 1);
// 「共同空堂」只算白天的平日：晚上十點兩個人都沒課不是什麼有用的資訊。
const DAYTIME_LAST_PERIOD = 10;

type CellState = "free" | "mine" | "theirs" | "both" | "together";

const CELL_CLASS: Record<CellState, string> = {
  free: "bg-green-100 dark:bg-green-900/40",
  mine: "bg-blue-200 dark:bg-blue-800/60",
  theirs: "bg-amber-200 dark:bg-amber-700/60",
  both: "bg-surface-tertiary",
  together: "bg-violet-300 dark:bg-violet-700/70",
};

// 顏色之外每種狀態還有一個字：色覺辨識有困難時，藍／紫／灰這幾格光靠顏色分不出來。
const CELL_MARK: Record<CellState, string> = {
  free: "",
  mine: "我",
  theirs: "他",
  both: "×",
  together: "同",
};

const CELL_MARK_EN: Record<CellState, string> = {
  free: "",
  mine: "Me",
  theirs: "Th",
  both: "×",
  together: "=",
};

const LEGEND: { state: CellState; label: string; labelEn: string }[] = [
  { state: "free", label: "都沒課", labelEn: "Both free" },
  { state: "mine", label: "只有我有課", labelEn: "Only I have class" },
  { state: "theirs", label: "只有對方有課", labelEn: "Only they have class" },
  {
    state: "both",
    label: "都有課（不同課）",
    labelEn: "Both busy (different courses)",
  },
  { state: "together", label: "同一門課", labelEn: "Same course" },
];

const occupancy = (slots: WeeklyScheduleCourse[]) => {
  const map = new Map<string, Set<string>>();

  slots.forEach((slot) => {
    for (let i = 0; i < (slot.duration || 1); i++) {
      const key = `${slot.day}-${slot.period + i}`;
      const codes = map.get(key) ?? new Set<string>();

      codes.add(slot.code);
      map.set(key, codes);
    }
  });

  return map;
};

export interface ScheduleCompareProps {
  mine: WeeklyScheduleCourse[];
  theirs: WeeklyScheduleCourse[];
}

/**
 * 把分享來的課表跟我的課表疊在一起看：哪些時段兩個人都沒課、哪些課是一起上的。
 *
 * 分享連結最常見的用途就是「我們什麼時候都有空」，原本得兩個視窗對著看。兩份
 * 課表都已經在瀏覽器裡（一份在網址、一份在 localStorage），疊起來不需要任何
 * 後端。
 */
export const ScheduleCompare = ({ mine, theirs }: ScheduleCompareProps) => {
  const t = useT();
  const { cells, days, sharedFree, together } = useMemo(() => {
    const mineMap = occupancy(mine);
    const theirsMap = occupancy(theirs);
    const usesWeekend = [...mine, ...theirs].some((slot) => slot.day >= 5);
    const days = usesWeekend ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
    const cells = new Map<string, CellState>();
    let sharedFree = 0;

    days.forEach((day) => {
      PERIODS.forEach((period) => {
        const key = `${day}-${period}`;
        const a = mineMap.get(key);
        const b = theirsMap.get(key);
        let state: CellState = "free";

        if (a && b) {
          state = [...a].some((code) => b.has(code)) ? "together" : "both";
        } else if (a) {
          state = "mine";
        } else if (b) {
          state = "theirs";
        }

        if (state === "free" && day < 5 && period <= DAYTIME_LAST_PERIOD) {
          sharedFree += 1;
        }

        cells.set(key, state);
      });
    });

    const theirCodes = new Set(theirs.map((slot) => slot.code));
    const together = [
      ...new Map(
        mine
          .filter((slot) => theirCodes.has(slot.code))
          .map((slot) => [slot.code, slot.name]),
      ).values(),
    ];

    return { cells, days, sharedFree, together };
  }, [mine, theirs]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {t(
          `平日白天（第 1–${DAYTIME_LAST_PERIOD} 節）有 `,
          `On weekdays (periods 1–${DAYTIME_LAST_PERIOD}) you are both free for `,
        )}
        <span className="font-semibold">{sharedFree}</span>
        {t(" 節兩個人都沒課", " period(s)")}
        {together.length > 0
          ? t(
              `，一起上的課有 ${together.length} 門：${together.join("、")}。`,
              `, and you share ${together.length} course(s): ${together.join(", ")}.`,
            )
          : t("，沒有一起上的課。", ", with no courses in common.")}
      </p>

      <div
        aria-hidden
        className="grid max-w-md gap-px overflow-hidden rounded-lg border border-border bg-border text-xs"
        style={{
          gridTemplateColumns: `1.75rem repeat(${days.length}, minmax(0, 1fr))`,
        }}
      >
        <div className="bg-surface-secondary" />
        {days.map((day) => (
          <div
            key={day}
            className="bg-surface-secondary py-1 text-center font-medium"
          >
            {t(DAY_LABELS[day], DAY_LABELS_EN[day])}
          </div>
        ))}
        {PERIODS.map((period) => (
          <div key={period} className="contents">
            <div className="flex items-center justify-center bg-surface-secondary text-muted tabular-nums">
              {period}
            </div>
            {days.map((day) => {
              const state = cells.get(`${day}-${period}`) ?? "free";

              return (
                <div
                  key={day}
                  className={clsx(
                    "flex h-6 items-center justify-center text-[10px]",
                    CELL_CLASS[state],
                  )}
                >
                  {t(CELL_MARK[state], CELL_MARK_EN[state])}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {LEGEND.map(({ state, label, labelEn }) => (
          <li key={state} className="flex items-center gap-1.5">
            <span
              className={clsx(
                "flex size-4 items-center justify-center rounded-sm text-[10px] text-foreground",
                CELL_CLASS[state],
              )}
            >
              {t(CELL_MARK[state], CELL_MARK_EN[state])}
            </span>
            {t(label, labelEn)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScheduleCompare;
