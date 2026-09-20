import { useSelectedCourses } from "@/contexts/selected-courses-context.tsx";
import { useYms } from "@/hooks/useYms.ts";
import { useT } from "@/i18n/language.tsx";
import { semesterName } from "@/i18n/terms.ts";

export interface CourseAddGate {
  /** 現在能不能把這個學年期的課寫進我的課表。 */
  canAdd: boolean;
  /** 不能的原因（給使用者看的、已依介面語言翻好）；可以加入或還在載入時為 null。 */
  blockedReason: string | null;
}

/**
 * 「這個學年期的課現在能不能加進我的課表」的單一判定處。
 *
 * 課程查詢、班級課表、教師課表都要問同一件事，而規則本身是會出事的那種 ——
 * 尤其 `defaultCode === null`（yms.json 沒載到）必須當成「不確定」而不是
 * 「哪個學期都行」，這種 fail-closed 只能有一份，複製到各頁遲早會漏掉一處。
 */
export const useCourseAddGate = (yms: string): CourseAddGate => {
  const t = useT();
  const { scheduleYms } = useSelectedCourses();
  const { defaultCode, displayNameOf, loading } = useYms();

  // 我的課表 only ever holds one 學年期, and only the one the school is
  // currently enrolling for: everything else is historical or not yet open, so
  // it stays queryable but not selectable. `defaultCode === null` means
  // yms.json hasn't loaded (or failed) — fail closed rather than guess.
  const isCurrentYms = defaultCode !== null && yms === defaultCode;
  // A schedule saved before the 學年期 rolled over blocks additions until it's
  // cleared, otherwise two semesters would end up mixed in one schedule.
  const hasStaleSchedule = scheduleYms !== null && scheduleYms !== yms;
  const canAdd = !loading && isCurrentYms && !hasStaleSchedule;

  const blockedReason = (() => {
    // 還在載入 yms.json 時不能加，但也還不知道原因 —— 這時候跳「無法確認當前
    // 學期」只會閃一下就消失，比不講更吵。
    if (canAdd || loading) return null;

    if (defaultCode === null) {
      return t(
        "目前無法確認學校的當前學期，暫時不能將課程加入我的課表。",
        "The school's current semester can't be confirmed right now, so courses can't be added to My Schedule for the moment.",
      );
    }

    const current = semesterName(displayNameOf(defaultCode), t);

    if (!isCurrentYms) {
      return t(
        `僅能將目前學期（${current}）的課程加入我的課表；其他學年期為歷史／未來資料，僅供查詢。`,
        `Only courses from the current semester (${current}) can be added to My Schedule; other semesters are past or future data and are view-only.`,
      );
    }

    const saved = semesterName(displayNameOf(scheduleYms), t);

    return t(
      `你的課表屬於 ${saved}，目前學期已是 ${current}。請先到「我的課表」清空後再重新選課。`,
      `Your schedule is for ${saved}, but the current semester is now ${current}. Clear it in My Schedule before picking courses again.`,
    );
  })();

  return { canAdd, blockedReason };
};
