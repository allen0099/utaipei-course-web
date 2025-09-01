import { WeeklyScheduleCourse, CampusTimeMapping } from "@/interfaces/globals";

// Helper to format ICS date-time
const formatICSDateTime = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};

// Helper to wrap long lines as per ICS specification
const wrapICSLine = (line: string): string => {
  if (line.length <= 75) return line;
  
  let result = line.slice(0, 75);
  let remaining = line.slice(75);
  
  while (remaining.length > 0) {
    result += "\r\n " + remaining.slice(0, 74);
    remaining = remaining.slice(74);
  }
  
  return result;
};

// Generate ICS content for the course schedule
export const generateICSContent = (
  courses: WeeklyScheduleCourse[],
  campusTimeMapping: CampusTimeMapping,
  scheduleTitle: string = "課程表"
): string => {
  const lines: string[] = [];
  
  // ICS Header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//UTC Course Helper//Weekly Schedule//ZH-TW");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");
  lines.push(`X-WR-CALNAME:${scheduleTitle}`);
  lines.push("X-WR-TIMEZONE:Asia/Taipei");
  
  // Get current date for scheduling (start from next Monday)
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
  nextMonday.setHours(0, 0, 0, 0);
  
  // Generate events for each course
  courses.forEach((course) => {
    const period = campusTimeMapping.periods.find(p => p.period === course.period);
    if (!period) return;
    
    // Calculate event start time
    const eventDate = new Date(nextMonday);
    eventDate.setDate(nextMonday.getDate() + course.day); // Add days for the specific weekday
    
    const [startHour, startMinute] = period.startTime.split(":").map(Number);
    eventDate.setHours(startHour, startMinute, 0, 0);
    
    // Calculate end time based on duration
    const duration = course.duration || 1;
    const endPeriod = course.period + duration - 1;
    const endPeriodInfo = campusTimeMapping.periods.find(p => p.period === endPeriod);
    
    const eventEndDate = new Date(eventDate);
    if (endPeriodInfo) {
      const [endHour, endMinute] = endPeriodInfo.endTime.split(":").map(Number);
      eventEndDate.setHours(endHour, endMinute, 0, 0);
    } else {
      // Fallback: add 50 minutes per period
      eventEndDate.setTime(eventDate.getTime() + (duration * 50 * 60 * 1000));
    }
    
    // Generate unique ID
    const uid = `course-${course.code}-${course.day}-${course.period}-${Date.now()}@utaipei-course-helper`;
    
    // Create event
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART;TZID=Asia/Taipei:${formatICSDateTime(eventDate).slice(0, -1)}`);
    lines.push(`DTEND;TZID=Asia/Taipei:${formatICSDateTime(eventEndDate).slice(0, -1)}`);
    lines.push(wrapICSLine(`SUMMARY:${course.name}`));
    
    // Add description with course details
    const description = [
      `課程代碼: ${course.code}`,
      `授課教師: ${course.teacher}`,
      `班級: ${course.class}`,
      duration > 1 ? `課程時長: ${duration}節課` : "",
    ].filter(Boolean).join("\\n");
    
    lines.push(wrapICSLine(`DESCRIPTION:${description}`));
    lines.push(wrapICSLine(`LOCATION:${course.class}`));
    
    // Make it a weekly recurring event (for a semester, approximately 18 weeks)
    lines.push("RRULE:FREQ=WEEKLY;COUNT=18");
    
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
  scheduleTitle: string = "課程表"
): void => {
  const icsContent = generateICSContent(courses, campusTimeMapping, scheduleTitle);
  
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${scheduleTitle.replace(/[^\w\s-]/g, "")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};