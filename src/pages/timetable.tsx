import { lazy, Suspense } from "react";

import DefaultLayout from "@/layouts/default.tsx";
import { PageHeader } from "@/components/page-header.tsx";
import { siteConfig } from "@/config/site.ts";
import { LoadingState } from "@/components/states.tsx";
import { PageSection } from "@/components/panel.tsx";

const PDFDocument = lazy(() => import("@/components/pdf.tsx"));

export const TimetablePage = () => {
  return (
    <DefaultLayout>
      <PageSection className="gap-6">
        <PageHeader
          className="max-w-5xl"
          description="各節次的上下課時間對照。"
          title="校園節次表"
        />
        <Suspense fallback={<LoadingState />}>
          <PDFDocument link={`${siteConfig.links.github.api}/timetable.pdf`} />
        </Suspense>
      </PageSection>
    </DefaultLayout>
  );
};

export default TimetablePage;
