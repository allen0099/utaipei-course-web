import { Document, Page, PageProps, pdfjs } from "react-pdf";
import { useCallback, useEffect, useRef, useState } from "react";
import { useResizeObserver } from "@wojtekmaj/react-hooks";
import { Modal, Button, ButtonGroup } from "@heroui/react";
import clsx from "clsx";

import { FetchError } from "@/components/fetch-error.tsx";
import { LoadingState } from "@/components/states.tsx";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  // The object URL to display for the current `link`. Refs must not be read
  // during render, so the cache (a ref, below) is only ever consulted inside
  // effects/callbacks; this state is what render actually uses.
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isOpen, setIsOpen] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const pdfCache = useRef<{ [key: string]: string }>({});

  // Effect for cleaning up the entire cache on unmount
  useEffect(() => {
    // The returned function runs only once when the component is destroyed.
    return () => {
      Object.values(pdfCache.current).forEach(URL.revokeObjectURL);
      pdfCache.current = {};
    };
  }, []);

  // Effect for resolving the PDF for the current link: synchronously from
  // the cache when available, otherwise via a network fetch. When there's no
  // link, `pdfFile` simply stays at its initial `null` value below — no
  // effect needed to represent "nothing to show".
  useEffect(() => {
    if (!link) return;

    const cached = pdfCache.current[link];

    if (cached) {
      setPdfFile(cached);
      setError(false);

      return;
    }

    let cancelled = false;

    setError(false);

    fetch(link)
      .then((res) => {
        // Without this check a 404 resolves to a blob of the error page, which
        // react-pdf then fails to parse with no user-visible explanation.
        if (!res.ok) throw new Error(`請求失敗（HTTP ${res.status}）：${link}`);

        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;

        const objectUrl = URL.createObjectURL(blob);

        pdfCache.current[link] = objectUrl;
        setPdfFile(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;

        setPdfFile(null);
        setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [link, retryToken]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (pageNumber: number) => {
    setActivePage(pageNumber);
    setZoom(1.0);
    setIsOpen(true);
  };

  if (error) {
    return (
      <FetchError
        message="PDF 載入失敗，請稍後再試。"
        onRetry={() => setRetryToken((prev) => prev + 1)}
      />
    );
  }

  if (!link || !pdfFile) {
    return <LoadingState />;
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        <Document
          className="flex flex-wrap justify-center gap-4"
          file={pdfFile}
          loading={<LoadingState />}
          onLoadError={() => setError(true)}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div key={`page_wrapper_${index + 1}`} className="w-full">
              {/* The canvas click was the only way to zoom; a real button
                  wrapper gives keyboard users the same affordance. */}
              <button
                aria-label={`放大檢視第 ${index + 1} 頁`}
                // The PDF keeps its own (light) colours instead of the previous
                // `dark:invert dark:hue-rotate-180`, which shifted every colour
                // in the document. A white sheet with a border reads as a
                // document rather than as a broken theme.
                className="block w-full cursor-pointer rounded-md border border-border bg-white p-1"
                type="button"
                onClick={() => handlePageClick(index + 1)}
              >
                <ResponsivePage
                  key={`page_${index + 1}`}
                  className="shadow-lg"
                  pageNumber={index + 1}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </button>
            </div>
          ))}
        </Document>
      </div>
      <Modal>
        <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
          <Modal.Container scroll="inside" size="full">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>頁面 {activePage}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="p-2 flex flex-col items-center overflow-auto">
                <div
                  className="w-full transform-gpu transition-transform duration-200 ease-in-out"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                  }}
                >
                  <Document file={pdfFile} loading={<LoadingState />}>
                    <div className="rounded-md bg-white p-1">
                      <ResponsivePage pageNumber={activePage} />
                    </div>
                  </Document>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <ButtonGroup size="sm" variant="ghost">
                  <Button
                    className={clsx({
                      "cursor-not-allowed": zoom <= 1.0,
                    })}
                    isDisabled={zoom <= 1.0}
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
                    isDisabled={zoom >= 2.0}
                    onPress={() => setZoom((prev) => Math.min(2.0, prev + 0.2))}
                  >
                    +
                  </Button>
                </ButtonGroup>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
};

export default PDFDocument;
