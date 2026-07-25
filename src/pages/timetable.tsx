import { lazy, Suspense } from "react";
import { Spinner } from "@heroui/react";

import DefaultLayout from "@/layouts/default.tsx";
import { PageHeader } from "@/components/page-header.tsx";
import { siteConfig } from "@/config/site.ts";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

export const TimetablePage = () => {
  return (
    <DefaultLayout>
      <section className="flex w-full flex-col items-center gap-6 py-6 md:py-8">
        <PageHeader description="各節次的上下課時間對照。" title="校園節次表" />
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
