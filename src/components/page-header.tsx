import { ReactNode } from "react";

import { title as titleStyles } from "@/components/primitives.ts";

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** 右側操作區：切換用的下拉選單、匯出按鈕等。 */
  actions?: ReactNode;
  className?: string;
}

/**
 * 各頁共用的標題列：標題靠左、操作區靠右，手機則上下堆疊。
 *
 * 標題用 `title()` 的 sm 尺寸而非預設的 md；頁面標題後面接的是整頁內容，
 * 48px 的字會把內容擠出第一屏，中文標題稍長一點在手機上還會斷成兩行。
 */
export const PageHeader = ({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) => (
  <div
    className={`flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
  >
    <div className="flex flex-col gap-1">
      <h1 className={titleStyles({ size: "sm" })}>{title}</h1>
      {description && <p className="text-muted text-sm">{description}</p>}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    )}
  </div>
);

export default PageHeader;
