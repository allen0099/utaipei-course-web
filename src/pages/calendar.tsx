import { Spinner } from "@heroui/spinner";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Document, Page, PageProps } from "react-pdf";
import { pdfjs } from "react-pdf";
import { useResizeObserver } from "@wojtekmaj/react-hooks";

import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site.ts";
import { calendarItem } from "@/interfaces/globals.ts";
import { title } from "@/components/primitives.ts";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ResponsivePage = (props: PageProps) => {
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  const onResize = useCallback(() => {
    if (containerRef) {
      setContainerWidth(containerRef.clientWidth);
    }
  }, [containerRef]);

  useResizeObserver(containerRef, {}, onResize);

  return (
    <div ref={setContainerRef}>
      <Page {...props} width={containerWidth} />
    </div>
  );
};

export const CalendarViewer = ({ link }: { link: string }) => {
  const [numPages, setNumPages] = useState<number>(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        <Document
          className="flex flex-wrap justify-center gap-4"
          file={link}
          loading={<Spinner />}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_wrapper_${index + 1}`}
              className="w-full xl:w-[48%]"
            >
              <ResponsivePage
                key={`page_${index + 1}`}
                className="dark:invert dark:hue-rotate-180 shadow-lg"
                pageNumber={index + 1}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
};

export const CalendarPage = () => {
  const [calendar, setCalendar] = useState<calendarItem[]>([]);

  const lastItem = calendar[calendar.length - 1];

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/calendar.json`)
      .then((res) => res.json())
      .then((data) => {
        data.forEach((item: calendarItem) => {
          item.link = `${siteConfig.links.github.api}/calendar/${item.year}/${item.title}.pdf`;
        });
        setCalendar(data);
      });
  }, []);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="flex max-sm:flex-col max-lg:w-full items-center">
          <h1 className={title()}>{lastItem?.title || "校園行事曆"}</h1>
          <Button className="ml-8" color="primary" variant="ghost">
            切換年分
          </Button>
        </div>

        <CalendarViewer link={lastItem?.link} />
      </section>
    </DefaultLayout>
  );
};

export default CalendarPage;
