import { Spinner, Button, Dropdown, Label } from "@heroui/react";
import { lazy, Suspense, useEffect, useState } from "react";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { CalendarItem } from "@/interfaces/globals.ts";
import { title } from "@/components/primitives.ts";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

export const CalendarPage = () => {
  const [calendarList, setCalendarList] = useState<CalendarItem[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarItem | null>(
    null,
  );

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/calendar.json`)
      .then((res) => res.json())
      .then((data: CalendarItem[]) => {
        const processedData = data.map((item) => ({
          ...item,
          link: `${siteConfig.links.github.api}/calendar/${item.year}/${item.title}.pdf`,
        }));
        const reversedData = [...processedData].reverse();

        setCalendarList(reversedData);
        if (reversedData.length > 0) {
          setSelectedCalendar(reversedData[0]);
        }
      });
  }, []);

  const handleYearChange = (key: unknown) => {
    const selected = calendarList.find((item) => item.title === key);

    if (selected) {
      setSelectedCalendar(selected);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="flex max-sm:flex-col max-lg:w-full items-center">
          <h1 className={title()}>{selectedCalendar?.title || "校園行事曆"}</h1>
          <Dropdown>
            <Dropdown.Trigger>
              <Button className="ml-8" variant="ghost">
                切換學年度
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="選擇學年度"
                className="max-h-60 overflow-y-auto"
                onAction={handleYearChange}
              >
                {calendarList.map((item) => (
                  <Dropdown.Item
                    key={item.title}
                    id={item.title}
                    textValue={item.title}
                  >
                    <Label>{item.title}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
        <p className="text-gray-500">點擊下方任一頁即可放大檢視</p>
        {selectedCalendar?.link ? (
          <Suspense
            fallback={
              <div className="flex items-center gap-2">
                <Spinner />
                <span>載入中...</span>
              </div>
            }
          >
            <PDFDocument link={selectedCalendar.link} />
          </Suspense>
        ) : (
          <div className="flex items-center gap-2">
            <Spinner />
            <span>載入中...</span>
          </div>
        )}
      </section>
    </DefaultLayout>
  );
};

export default CalendarPage;
