import { lazy, Suspense } from "react";
import { Spinner } from "@heroui/react";

import DefaultLayout from "@/layouts/default.tsx";
import { title } from "@/components/primitives.ts";
import { siteConfig } from "@/config/site.ts";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

export const TimetablePage = () => {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="flex max-sm:flex-col max-lg:w-full items-center">
          <h1 className={title()}>校園節次表</h1>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center gap-2">
              <Spinner />
              <span>載入中...</span>
            </div>
          }
        >
          <PDFDocument link={`${siteConfig.links.github.api}/timetable.pdf`} />
        </Suspense>
      </section>
    </DefaultLayout>
  );
};

export default TimetablePage;
