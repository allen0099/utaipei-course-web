import { Spinner } from "@heroui/spinner";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { pdfjs } from "react-pdf";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { calendarItem } from "@/interfaces/globals.ts";
import { title } from "@/components/primitives.ts";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const CalendarPage = () => {
  const [calendar, setCalendar] = useState<calendarItem[]>([]);
  const [loading, setLoading] = useState(true);

  const lastItem = calendar[calendar.length - 1];

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/calendar.json`)
      .then((res) => res.json())
      .then((data) => {
        data.forEach((item: calendarItem) => {
          item.link = `${siteConfig.links.github.api}/calendar/${item.year}/${item.title}.pdf`;
        });
        setCalendar(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <h1 className={title()}>{lastItem?.title || "校園行事曆"}</h1>
        <Button color="primary" variant="ghost">
          切換年分
        </Button>
        {loading ? <Spinner /> : <></>}
      </section>
    </DefaultLayout>
  );
};

export default CalendarPage;
