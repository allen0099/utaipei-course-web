import { Link } from "@heroui/react";

import { PageHeader } from "@/components/page-header.tsx";
import DefaultLayout from "@/layouts/default.tsx";

export const ClassSearchPage = () => {
  return (
    <DefaultLayout>
      <section className="flex w-full flex-col items-center gap-6 py-6 md:py-8">
        <PageHeader
          description="依班級查詢整學期課表的功能還在開發中。"
          title="班級課表"
        />

        <div className="w-full max-w-xl rounded-lg border border-border p-6 text-center">
          <p className="text-muted">
            在此之前，你可以先用以下方式找到同樣的資訊：
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            <li>
              <Link href="/search">課程查詢</Link>
              ：選擇系所後，用班級名稱關鍵字篩選，勾選後即可組成課表。
            </li>
            <li>
              <Link href="/schedules/teacher">教師課表</Link>
              ：先選系級再選教師，直接看該教師在該班的開課時間。
            </li>
          </ul>
        </div>
      </section>
    </DefaultLayout>
  );
};

export default ClassSearchPage;
