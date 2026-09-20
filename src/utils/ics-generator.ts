import {
  CalendarEvent,
  CampusTimeMapping,
  WeeklyScheduleCourse,
} from "@/interfaces/globals";
import { downloadBlob } from "@/utils/download.ts";

// Helper to format ICS date-time
export const formatICSDateTime = (date: Date): string => {
  return date.toLocaleString("sv").replace(/[-:]/g, "").replace(/\W/g, "T");
};

// RRULE 的 UNTIL 在 DTSTART 帶 TZID 時必須是 UTC (RFC 5545 §3.3.10)。
const formatICSUtc = (date: Date): string =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

// Helper to wrap long lines as per ICS specification
export const wrapICSLine = (line: string): string => {
  if (line.length <= 75) return line;

  let result = line.slice(0, 75);
  let remaining = line.slice(75);

  while (remaining.length > 0) {
    result += "\r\n " + remaining.slice(0, 74);
    remaining = remaining.slice(74);
  }

  return result;
};

/** Trigger a browser download for generated iCalendar text. */
export const downloadICS = (icsContent: string, fileName: string): void => {
  downloadBlob(
    new Blob([icsContent], { type: "text/calendar;charset=utf-8" }),
    fileName,
  );
};

/**
 * 一個學期實際上課的起訖。從校園行事曆推得：開學日到期末考那一週的週日，外加
 * 期間內的放假日。
 */
export interface TermRange {
  /** 開學日 (開始上課) */
  start: Date;
  /** 最後一個上課日（含） */
  end: Date;
  /** 放假日，"YYYY-MM-DD" */
  holidays: Set<string>;
}

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * 從行事曆事件找出學期起訖。104–115 學年度的行事曆都用同樣的字眼：
 * 「…開學日(開始上課)」與「…期末考試」。找不到任何一個就回傳 null，呼叫端
 * 會退回舊的「下週一起 18 週」—— 寧可粗略也不要匯出一份空的行事曆。
 */
export const resolveTermRange = (events: CalendarEvent[]): TermRange | null => {
  const startEvent = events.find((event) =>
    /開學日|開始上課/.test(event.title),
  );
  const finalsEvent = events.find((event) => /期末考/.test(event.title));

  if (!startEvent || !finalsEvent) return null;

  const start = parseLocalDate(startEvent.date);
  const end = parseLocalDate(finalsEvent.endDate ?? finalsEvent.date);

  // 延到期末考那一週的週日：考試訖日不一定是週五（115-1 是週四，週五放假），
  // 用整週才不會因為訖日落在哪一天而少排某幾天的最後一堂。
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));

  if (end <= start) return null;

  const holidays = new Set<string>();

  events
    .filter((event) => event.isHoliday)
    .forEach((event) => {
      const cursor = parseLocalDate(event.date);
      const last = parseLocalDate(event.endDate ?? event.date);

      while (cursor <= last) {
        holidays.add(toDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });

  return { start, end, holidays };
};

/** ICS 的 TEXT 值要跳脫這四種字元 (RFC 5545 §3.3.11)。 */
const escapeICSText = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// Generate ICS content for the course schedule
export const generateICSContent = (
  courses: WeeklyScheduleCourse[],
  campusTimeMapping: CampusTimeMapping,
  scheduleTitle: string = "課程表",
  term: TermRange | null = null,
): string => {
  const lines: string[] = [];

  // ICS Header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//UTC Course Helper//Weekly Schedule//ZH-TW");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(wrapICSLine(`X-WR-CALNAME:${escapeICSText(scheduleTitle)}`));
  lines.push("X-WR-TIMEZONE:Asia/Taipei");

  // ICS VTIMEZONE Component
  lines.push("BEGIN:VTIMEZONE");
  lines.push("TZID:Asia/Taipei");
  lines.push("X-LIC-LOCATION:Asia/Taipei");
  lines.push("BEGIN:STANDARD");
  lines.push("TZOFFSETFROM:+0800");
  lines.push("TZOFFSETTO:+0800");
  lines.push("TZNAME:GMT+8");
  lines.push("DTSTART:19700101T000000");
  lines.push("END:STANDARD");
  lines.push("END:VTIMEZONE");

  // 沒有學期資料時的退路：從下週一開始排 18 週。
  const now = new Date();
  const nextMonday = new Date(now);

  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);

  // 這門課在 anchor 當天或之後的第一個上課日。course.day 是 0=週一…6=週日。
  const firstOccurrence = (anchor: Date, courseDay: number): Date => {
    const date = new Date(anchor);
    const anchorDay = (anchor.getDay() + 6) % 7;

    date.setDate(anchor.getDate() + ((courseDay - anchorDay + 7) % 7));

    return date;
  };

  // Generate events for each course
  courses.forEach((course) => {
    const period = campusTimeMapping.periods.find(
      (p) => p.period === course.period,
    );

    if (!period) return;

    // Calculate event start time
    const eventDate = firstOccurrence(term?.start ?? nextMonday, course.day);

    const [startHour, startMinute] = period.startTime.split(":").map(Number);

    eventDate.setHours(startHour, startMinute, 0, 0);

    // Calculate end time based on duration
    const duration = course.duration || 1;
    const endPeriod = course.period + duration - 1;
    const endPeriodInfo = campusTimeMapping.periods.find(
      (p) => p.period === endPeriod,
    );

    const eventEndDate = new Date(eventDate);

    if (endPeriodInfo) {
      const [endHour, endMinute] = endPeriodInfo.endTime.split(":").map(Number);

      eventEndDate.setHours(endHour, endMinute, 0, 0);
    } else {
      // Fallback: add 50 minutes per period
      eventEndDate.setTime(eventDate.getTime() + duration * 50 * 60 * 1000);
    }

    // UID 必須是決定性的：隨機 UID 讓每次重新匯入都多出一整份重複的課，而同一個
    // UID 再匯入一次只會更新原本那一筆。
    const uid = `course-${course.code}-${course.day}-${course.period}@utaipei-course-helper`;

    // Create event
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART;TZID=Asia/Taipei:${formatICSDateTime(eventDate)}`);
    lines.push(`DTEND;TZID=Asia/Taipei:${formatICSDateTime(eventEndDate)}`);
    lines.push(wrapICSLine(`SUMMARY:${escapeICSText(course.name)}`));

    // Add description with course details
    const description = [
      `課程代碼: ${course.code}`,
      `授課教師: ${course.teacher}`,
      `班級: ${course.class}`,
      duration > 1 ? `課程時長: ${duration}節課` : "",
    ]
      .filter(Boolean)
      .map(escapeICSText)
      .join("\\n");

    lines.push(wrapICSLine(`DESCRIPTION:${description}`));

    // 地點是教室。這裡原本寫的是班級名稱，匯進行事曆後「地點」欄就變成
    // 「資科一」這種東西。沒有教室資料（分享來的課表）就整行不寫。
    if (course.classroom) {
      lines.push(wrapICSLine(`LOCATION:${escapeICSText(course.classroom)}`));
    }

    if (term) {
      const until = new Date(term.end);

      until.setHours(23, 59, 59, 0);
      lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${formatICSUtc(until)}`);

      // 放假日不上課。EXDATE 的時間必須跟 DTSTART 一模一樣才會被認得。
      const exDates: string[] = [];
      const cursor = new Date(eventDate);

      while (cursor <= until) {
        if (term.holidays.has(toDateKey(cursor))) {
          exDates.push(formatICSDateTime(cursor));
        }
        cursor.setDate(cursor.getDate() + 7);
      }

      if (exDates.length > 0) {
        lines.push(wrapICSLine(`EXDATE;TZID=Asia/Taipei:${exDates.join(",")}`));
      }
    } else {
      // Make it a weekly recurring event (for a semester, approximately 18 weeks)
      lines.push("RRULE:FREQ=WEEKLY;COUNT=18");
    }

    // Add creation and modification timestamps
    const timestamp = formatICSDateTime(new Date());

    lines.push(`CREATED:${timestamp}`);
    lines.push(`LAST-MODIFIED:${timestamp}`);
    lines.push(`DTSTAMP:${timestamp}`);

    lines.push("END:VEVENT");
  });

  // ICS Footer
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
};

// Download ICS file
export const downloadICSFile = (
  courses: WeeklyScheduleCourse[],
  campusTimeMapping: CampusTimeMapping,
  scheduleTitle: string = "課程表",
  term: TermRange | null = null,
): void => {
  downloadICS(
    generateICSContent(courses, campusTimeMapping, scheduleTitle, term),
    `${scheduleTitle}.ics`,
  );
};
