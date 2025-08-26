import { Document, Page, PageProps } from "react-pdf";
import { useCallback, useEffect, useRef, useState } from "react";
import { useResizeObserver } from "@wojtekmaj/react-hooks";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { Button, ButtonGroup } from "@heroui/button";
import clsx from "clsx";

export const ResponsivePage = (props: PageProps) => {
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

export const PDFDocument = ({ link }: { link: string }) => {
  const [numPages, setNumPages] = useState<number>(1);
  const [activePage, setActivePage] = useState<number>(1);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const pdfCache = useRef<{ [key: string]: string }>({});

  // Effect for cleaning up the entire cache on unmount
  useEffect(() => {
    // The returned function runs only once when the component is destroyed.
    return () => {
      Object.values(pdfCache.current).forEach(URL.revokeObjectURL);
      pdfCache.current = {};
    };
  }, []);

  // Effect for fetching and setting the PDF from cache or network
  useEffect(() => {
    if (!link) {
      setPdfFile(null);

      return;
    }

    if (pdfCache.current[link]) {
      setPdfFile(pdfCache.current[link]);
    } else {
      setIsLoading(true);
      setPdfFile(null); // Clear previous PDF while loading new one
      fetch(link)
        .then((res) => res.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);

          pdfCache.current[link] = objectUrl;
          setPdfFile(objectUrl);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [link]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (pageNumber: number) => {
    setActivePage(pageNumber);
    setZoom(1.0);
    onOpen();
  };

  if (isLoading || !pdfFile) {
    return <Spinner label="讀取中..." />;
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        <Document
          className="flex flex-wrap justify-center gap-4"
          file={pdfFile}
          loading={<Spinner label="讀取中..." />}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div key={`page_wrapper_${index + 1}`} className="w-full">
              <ResponsivePage
                key={`page_${index + 1}`}
                className="dark:invert dark:hue-rotate-180 shadow-lg"
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
            <span>頁面 {activePage}</span>
          </ModalHeader>
          <ModalBody className="p-2 flex justify-start overflow-auto">
            <div
              className="transform-gpu transition-transform duration-200 ease-in-out"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              <Document file={pdfFile} loading={<Spinner />}>
                <ResponsivePage
                  className="dark:invert dark:hue-rotate-180"
                  pageNumber={activePage}
                />
              </Document>
            </div>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup size="sm" variant="ghost">
              <Button
                className={clsx({
                  "cursor-not-allowed": zoom <= 1.0,
                })}
                disabled={zoom <= 1.0}
                onPress={() => setZoom((prev) => Math.max(1.0, prev - 0.2))}
              >
                -
              </Button>
              <Button onPress={() => setZoom(1.0)}>
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                className={clsx({
                  "cursor-not-allowed": zoom >= 2.0,
                })}
                disabled={zoom >= 2.0}
                onPress={() => setZoom((prev) => Math.min(2.0, prev + 0.2))}
              >
                +
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
