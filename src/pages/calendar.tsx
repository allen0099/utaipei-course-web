import { Spinner } from "@heroui/spinner";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { calendarItem } from "@/interfaces/globals.ts";
import { title } from "@/components/primitives.ts";
import { PDFDocument } from "@/components/pdf.tsx";

export const CalendarPage = () => {
  const [calendarList, setCalendarList] = useState<calendarItem[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<calendarItem | null>(
    null,
  );

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/calendar.json`)
      .then((res) => res.json())
      .then((data: calendarItem[]) => {
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
            <DropdownTrigger>
              <Button className="ml-8" color="primary" variant="ghost">
                切換學年度
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="選擇學年度"
              className="max-h-60 overflow-y-auto"
              items={calendarList}
              onAction={handleYearChange}
            >
              {(item) => (
                <DropdownItem key={item.title}>{item.title}</DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
        <p className="text-default-500">點擊下方任一頁即可放大檢視</p>
        {selectedCalendar?.link ? (
          <PDFDocument link={selectedCalendar.link} />
        ) : (
          <Spinner label="載入中..." />
        )}
      </section>
    </DefaultLayout>
  );
};

export default CalendarPage;
