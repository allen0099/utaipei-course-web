import { Spinner } from "@heroui/spinner";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Document, Page, PageProps } from "react-pdf";
import { pdfjs } from "react-pdf";
import { useResizeObserver } from "@wojtekmaj/react-hooks";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";

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
  const [activePage, setActivePage] = useState<number>(1);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pdfCache = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    if (link && !pdfCache.current[link]) {
      setIsLoading(true);
      fetch(link)
        .then((res) => res.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);

          pdfCache.current[link] = objectUrl;
          setPdfFile(objectUrl);
          setIsLoading(false);
        });
    } else if (link && pdfCache.current[link]) {
      setPdfFile(pdfCache.current[link]);
    }

    // Cleanup function to revoke object URLs on component unmount
    return () => {
      Object.values(pdfCache.current).forEach(URL.revokeObjectURL);
    };
  }, [link]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (pageNumber: number) => {
    setActivePage(pageNumber);
    onOpen();
  };

  if (isLoading || !pdfFile) {
    return <Spinner label="讀取行事曆中..." />;
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        <Document
          className="flex flex-wrap justify-center gap-4"
          file={pdfFile}
          loading={<Spinner />}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div key={`page_wrapper_${index + 1}`} className="w-full">
              <ResponsivePage
                key={`page_${index + 1}`}
                className="dark:invert dark:hue-rotate-180 shadow-lg cursor-pointer"
                pageNumber={index + 1}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onClick={() => handlePageClick(index + 1)}
              />
            </div>
          ))}
        </Document>
      </div>
      <Modal
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            頁面 {activePage}
          </ModalHeader>
          <ModalBody className="p-2">
            <Document file={pdfFile} loading={<Spinner />}>
              <ResponsivePage
                className="dark:invert dark:hue-rotate-180"
                pageNumber={activePage}
              />
            </Document>
          </ModalBody>
        </ModalContent>
      </Modal>
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
            切換學年度
          </Button>
        </div>
        <p className="text-default-500">點擊下方任一頁即可放大檢視</p>
        {lastItem?.link ? (
          <CalendarViewer link={lastItem.link} />
        ) : (
          <Spinner label="載入中..." />
        )}
      </section>
    </DefaultLayout>
  );
};

export default CalendarPage;
