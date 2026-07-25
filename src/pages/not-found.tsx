import { Link } from "@heroui/react";

import DefaultLayout from "@/layouts/default";
import { title } from "@/components/primitives.ts";
import { PageSection } from "@/components/panel.tsx";

export default function NotFoundPage() {
  return (
    <DefaultLayout>
      <PageSection className="justify-center gap-4">
        <div className="flex flex-col items-center text-center">
          <h1 className={title()}>404</h1>
          <p className="mt-2 text-xl">找不到這個頁面</p>
          <p className="mt-2 text-muted">歐歐，你似乎發現了蟲洞。</p>
          {/* Styled as a button — as a bare inline <Link> the `mt-6` produced
              no visible spacing and the link had no affordance. */}
          <Link className="button button--primary button--md mt-6" href="/">
            返回首頁
          </Link>
        </div>
      </PageSection>
    </DefaultLayout>
  );
}
