import { CalendarEvent } from "@/interfaces/globals";
import { wrapICSLine } from "@/utils/ics-generator";

/** YYYY-MM-DD → YYYYMMDD */
const toICSDate = (isoDate: string): string => isoDate.replace(/-/g, "");

/** All-day events use an exclusive DTEND, so the last day must be advanced by one. */
const nextDay = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + 1);

  return date.toISOString().slice(0, 10);
};

/** Escape the characters that act as delimiters in iCalendar TEXT values. */
const escapeICSText = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

/**
 * Build an iCalendar document of all-day events for one semester's academic
 * calendar. Mirrors crawler/utils/calendarIcs.ts so the locally generated file
 * and the published subscription URL describe the same events.
 */
export const generateAcademicCalendarICS = (
  events: CalendarEvent[],
  calendarName: string,
): string => {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UTC Course Helper//Academic Calendar//ZH-TW",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    wrapICSLine(`X-WR-CALNAME:${escapeICSText(calendarName)}`),
    "X-WR-TIMEZONE:Asia/Taipei",
  ];

  const stamp = `${toICSDate(new Date().toISOString().slice(0, 10))}T000000Z`;

  events.forEach((event, index) => {
    const summary = event.unit
      ? `【${event.unit}】${event.title}`
      : event.title;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.date}-${index}-${calendarName}@utaipei-course-helper`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toICSDate(event.date)}`,
      `DTEND;VALUE=DATE:${toICSDate(nextDay(event.endDate ?? event.date))}`,
      wrapICSLine(`SUMMARY:${escapeICSText(summary)}`),
      "TRANSP:TRANSPARENT",
    );

    if (event.isHoliday) lines.push("CATEGORIES:放假");

    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
};
