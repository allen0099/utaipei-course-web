import { ReactNode, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import clsx from "clsx";

import { WeeklyScheduleCourse } from "@/interfaces/globals.ts";
import { COURSE_COLORS } from "@/components/weekly-schedule.tsx";
import { loadCourseColors } from "@/utils/course-colors.ts";
import { useT } from "@/i18n/language.tsx";
import { dayName } from "@/i18n/terms.ts";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const PERIODS = Array.from({ length: 14 }, (_, index) => index + 1);

/** 時段篩選的鍵："<day>-<period>"，day 是 0=週一…6=週日。 */
export const slotKey = (day: number, period: number) => `${day}-${period}`;

export interface SchedulePreviewProps {
  /** 我的課表目前的時段。 */
  scheduled: WeeklyScheduleCourse[];
  /** 收藏清單的時段，畫成虛線框：看得到它想佔哪裡，但一眼就知道還沒排進去。 */
  wished?: WeeklyScheduleCourse[];
  /** 正在預覽（滑鼠停在／鍵盤聚焦在結果列上）的那門課的時段。 */
  preview?: WeeklyScheduleCourse[];
  /** 預覽中的課名，顯示在表格下方。 */
  previewName?: string;
  /** 時段篩選目前選了哪些格子。 */
  selectedSlots: Set<string>;
  onToggleSlot: (key: string) => void;
  onClearSlots: () => void;
  /**
   * 沒有預覽時顯示在格子下方的說明。預設是課程查詢的用法；尋找空教室沒有
   * 「滑過結果預覽」這回事，要換一句。
   */
  idleHint?: ReactNode;
  /**
   * 只看不點：格子不是按鈕，下方的說明與操作也不顯示。手機結果卡片裡展開的
   * 那一張用這個 —— 在一張只是要「看一眼排不排得進去」的小圖上誤觸到時段
   * 篩選，結果列表會整個換掉。
   */
  readOnly?: boolean;
  className?: string;
}

const occupies = (slot: WeeklyScheduleCourse, day: number, period: number) =>
  slot.day === day &&
  period >= slot.period &&
  period <= slot.period + (slot.duration || 1) - 1;

/**
 * 課程查詢旁邊那張迷你課表，一張格子做三件事：
 *
 * 1. 顯示我的課表目前佔了哪些時段；
 * 2. 滑過某一筆搜尋結果時，把那門課會落在哪裡疊上去（衝堂的格子轉紅）——
 *    不必先勾選、跳去我的課表才知道排不排得進去；
 * 3. 每一格都是按鈕，點下去就是「找這個時段的課」的篩選條件。
 *
 * 三件事共用一張格子而不是各做一個元件，因為它們回答的是同一個問題：「這個
 * 時段我有沒有空、有什麼課可以放」。
 */
export const SchedulePreview = ({
  scheduled,
  wished = [],
  preview = [],
  previewName,
  selectedSlots,
  onToggleSlot,
  onClearSlots,
  idleHint,
  readOnly = false,
  className,
}: SchedulePreviewProps) => {
  const t = useT();
  const [showWeekendPicked, setShowWeekend] = useState(false);

  // 週末平常收起來，但只要有任何東西落在週末（已選的課、預覽、篩選）就一定
  // 展開 —— 收著會讓那門課看起來像不見了。
  const weekendInUse =
    [...scheduled, ...preview].some((slot) => slot.day >= 5) ||
    [...selectedSlots].some((key) => Number(key.split("-")[0]) >= 5);
  const showWeekend = showWeekendPicked || weekendInUse;
  const days = showWeekend ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];

  const colorByCode = useMemo(() => {
    const map = new Map<string, string>();
    // 跟我的課表用同一份自訂顏色，兩邊看到的同一門課才會是同一個顏色。
    const overrides = loadCourseColors();

    scheduled.forEach((slot) => {
      if (!map.has(slot.code)) {
        map.set(
          slot.code,
          COURSE_COLORS[
            (overrides[slot.code] ?? map.size) % COURSE_COLORS.length
          ],
        );
      }
    });

    return map;
  }, [scheduled]);

  const previewConflicts = preview.some((candidate) =>
    scheduled.some(
      (slot) =>
        slot.code !== candidate.code &&
        slot.day === candidate.day &&
        slot.period <= candidate.period + (candidate.duration || 1) - 1 &&
        candidate.period <= slot.period + (slot.duration || 1) - 1,
    ),
  );

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      <div
        className="grid gap-px overflow-hidden rounded-lg border border-border bg-border text-xs"
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
            {t(DAY_LABELS[day], dayName(day, t))}
          </div>
        ))}

        {PERIODS.map((period) => (
          <div key={period} className="contents">
            <div className="flex items-center justify-center bg-surface-secondary text-muted tabular-nums">
              {period}
            </div>
            {days.map((day) => {
              const key = slotKey(day, period);
              const own = scheduled.filter((slot) =>
                occupies(slot, day, period),
              );
              const isPreview = preview.some((slot) =>
                occupies(slot, day, period),
              );
              const isPreviewClash =
                isPreview && own.some((slot) => slot.code !== preview[0]?.code);
              const isPicked = selectedSlots.has(key);
              const first = own[0];
              const wishedHere = wished.filter((slot) =>
                occupies(slot, day, period),
              );
              const label = [
                t(
                  `週${DAY_LABELS[day]}第 ${period} 節`,
                  `${dayName(day, t)}, period ${period}`,
                ),
                own.length > 0
                  ? t(
                      `已選：${own.map((slot) => slot.name).join("、")}`,
                      `Scheduled: ${own.map((slot) => slot.name).join(", ")}`,
                    )
                  : t("空堂", "free"),
                wishedHere.length > 0
                  ? t(
                      `收藏：${wishedHere.map((slot) => slot.name).join("、")}`,
                      `Saved: ${wishedHere.map((slot) => slot.name).join(", ")}`,
                    )
                  : "",
                isPicked
                  ? t("已設為時段篩選", "used as a time filter")
                  : t(
                      "點選以篩選這個時段的課",
                      "click to filter courses in this slot",
                    ),
              ]
                .filter(Boolean)
                .join(t("，", "; "));

              const Cell = readOnly ? "div" : "button";

              return (
                <Cell
                  key={key}
                  {...(readOnly
                    ? { "aria-hidden": true }
                    : {
                        "aria-label": label,
                        "aria-pressed": isPicked,
                        title: label,
                        type: "button" as const,
                        onClick: () => onToggleSlot(key),
                      })}
                  className={clsx(
                    "relative h-6 overflow-hidden px-0.5 text-left text-[10px] leading-6 transition-colors",
                    first
                      ? colorByCode.get(first.code)
                      : "bg-background hover:bg-surface-secondary",
                    // 已選的課原本的色塊 class 帶 border-*，這裡沒有邊框所以無害。
                    isPreview &&
                      !isPreviewClash &&
                      "!bg-blue-200 dark:!bg-blue-700/60",
                    isPreviewClash && "!bg-red-300 dark:!bg-red-700/70",
                    wishedHere.length > 0 &&
                      !isPicked &&
                      "outline-dashed outline-1 -outline-offset-1 outline-amber-500",
                    isPicked &&
                      "outline outline-2 -outline-offset-2 outline-accent",
                  )}
                >
                  {/* 只在這門課的第一節寫名字，連堂的後幾節留白就看得出是同一塊。 */}
                  {first && first.period === period && (
                    <span className="block truncate">{first.name}</span>
                  )}
                  {!first &&
                    wishedHere[0] &&
                    wishedHere[0].period === period && (
                      <span className="block truncate text-amber-700 dark:text-amber-400">
                        {wishedHere[0].name}
                      </span>
                    )}
                  {own.length > 1 && (
                    <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-bl-sm bg-red-500" />
                  )}
                </Cell>
              );
            })}
          </div>
        ))}
      </div>

      {/* 固定高度，預覽出現／消失時下面的內容才不會跟著跳。 */}
      <p aria-live="polite" className="min-h-5 text-xs">
        {preview.length > 0 ? (
          <span
            className={
              previewConflicts
                ? "text-danger"
                : "text-blue-700 dark:text-blue-300"
            }
          >
            {previewConflicts
              ? t("衝堂：", "Time conflict: ")
              : t("預覽：", "Preview: ")}
            {previewName}
          </span>
        ) : previewName ? (
          <span className="text-muted">
            {t(
              `${previewName} 沒有排定上課時間`,
              `${previewName} has no scheduled time`,
            )}
          </span>
        ) : idleHint ? (
          <span className="text-muted">{idleHint}</span>
        ) : (
          <span className="text-muted">
            {/* 觸控裝置沒有 hover，別提一個做不到的操作。 */}
            <span className="[@media(hover:none)]:hidden">
              {t(
                "滑過結果可預覽時段，",
                "Hover a result to preview its time. ",
              )}
            </span>
            {t(
              "點格子可篩選該時段的課。",
              "Click a cell to filter courses in that slot.",
            )}
          </span>
        )}
      </p>

      <div
        className={clsx("flex flex-wrap items-center gap-2", {
          hidden: readOnly,
        })}
      >
        {selectedSlots.size > 0 && (
          <Button size="sm" variant="tertiary" onPress={onClearSlots}>
            {t(
              `清除時段（${selectedSlots.size}）`,
              `Clear slots (${selectedSlots.size})`,
            )}
          </Button>
        )}
        {!weekendInUse && (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => setShowWeekend((value) => !value)}
          >
            {showWeekendPicked
              ? t("隱藏週末", "Hide weekend")
              : t("顯示週末", "Show weekend")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SchedulePreview;
