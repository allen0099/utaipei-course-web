import type { ReactNode } from "react";

import clsx from "clsx";

import { useIsMobileViewport } from "@/hooks/useIsMobileViewport.ts";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  /**
   * Shorter header used only in the desktop table (narrow columns); the mobile
   * card layout keeps the full `label` as its field name.
   */
  headerLabel?: string;
  /** Custom cell content. Falls back to `item[key]` when omitted. */
  render?: (item: T) => ReactNode;
  /**
   * Fixed column width (Tailwind class) for the desktop `table-fixed` layout.
   * Explicit widths are required because CJK content has ~1-char min-content,
   * so an auto table would otherwise collapse wrapping columns into thin
   * ribbons.
   */
  width?: string;
  /** Extra text styling for the desktop body cell (emphasis / muting). */
  cellClassName?: string;
  /** Hide this column from the mobile card body (e.g. promoted to the header). */
  hideOnCard?: boolean;
  /**
   * Whether this row has no value for this column, so the table can drop the
   * column when *every* row is empty and each card can drop the field for its
   * own row. Needed because `render` returns a ReactNode there is no way to
   * inspect; default is the raw `item[key]`, which is right for any column
   * that renders straight from its own field.
   */
  isEmpty?: (item: T) => boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Stable key per row. */
  rowKey: (item: T, index: number) => string;
  /**
   * Optional leading control column (a checkbox, a remove button…). Rendered
   * as the first table cell on desktop and beside the card title on mobile.
   */
  leading?: {
    label: string;
    width?: string;
    render: (item: T) => ReactNode;
  };
  /**
   * Card heading on mobile. Without it the card falls back to a plain field
   * list, which reads poorly — pass the row's most identifying value.
   */
  cardTitle?: (item: T) => ReactNode;
  cardSubtitle?: (item: T) => ReactNode;
  /** Extra content under a mobile card's field list (never shown in the table). */
  cardFooter?: (item: T) => ReactNode;
  /**
   * 滑鼠停在某一列、或鍵盤焦點進到那一列裡的控制項時回報那一列；離開時回報
   * null。課程查詢用它在迷你課表上預覽時段。
   */
  onRowHover?: (item: T | null) => void;
  className?: string;
}

const isCellEmpty = <T,>(column: DataTableColumn<T>, item: T): boolean => {
  if (column.isEmpty) return column.isEmpty(item);

  const raw = (item as Record<string, unknown>)[column.key];

  return raw === undefined || raw === null || raw === "";
};

const cellValue = <T,>(column: DataTableColumn<T>, item: T): ReactNode => {
  if (column.render) return column.render(item);

  const raw = (item as Record<string, unknown>)[column.key];

  return raw === undefined || raw === null || raw === "" ? "-" : String(raw);
};

/**
 * Responsive table shared by every list in the app.
 *
 * Below `md` the table is replaced by a card list rather than left to scroll
 * horizontally: rows here are wide (7 columns of CJK text, several of them
 * `whitespace-nowrap`), so a single row easily exceeds 900px and horizontal
 * scrolling inside a vertically-scrolling page is a poor trade on a phone.
 *
 * Only one of the two ever renders. Emitting both and hiding one with CSS
 * doubled every row: a 56-result search built 112 rows and ~4,900 DOM nodes,
 * half of them invisible, and at the 200-row cap that is 400 rows. The `md:`
 * branches deliberately carry no `md:` hiding classes any more: with both the
 * hook and CSS gating the same choice, any disagreement between them renders
 * nothing at all. The hook alone decides, so the worst case is a table on a
 * narrow screen rather than an empty list.
 */
export const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  leading,
  cardTitle,
  cardSubtitle,
  cardFooter,
  onRowHover,
  className,
}: DataTableProps<T>) => {
  const isMobile = useIsMobileViewport();

  // A column every row is blank for carries no information, only width. The
  // 通識課程 rows have no 學分/必選修/性別/教室/上限/綱要 at all, so a search
  // that returns only those was 6 of 12 columns wide in em dashes.
  const populatedColumns = columns.filter((column) =>
    rows.some((item) => !isCellEmpty(column, item)),
  );
  const cardColumns = populatedColumns.filter((column) => !column.hideOnCard);

  return (
    <div className={className}>
      {/* Desktop table (md and up) */}
      {!isMobile && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              {leading && <col className={leading.width ?? "w-14"} />}
              {populatedColumns.map((column) => (
                <col key={column.key} className={column.width} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-background-secondary text-left text-xs font-medium tracking-wide text-muted">
                {leading && (
                  <th className="px-3 py-2.5 font-medium" scope="col">
                    {leading.label}
                  </th>
                )}
                {populatedColumns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 py-2.5 font-medium"
                    scope="col"
                  >
                    {column.headerLabel ?? column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => (
                <tr
                  key={rowKey(item, index)}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-background-secondary"
                  onBlur={onRowHover && (() => onRowHover(null))}
                  onFocus={onRowHover && (() => onRowHover(item))}
                  onMouseEnter={onRowHover && (() => onRowHover(item))}
                  onMouseLeave={onRowHover && (() => onRowHover(null))}
                >
                  {leading && (
                    <td className="px-3 py-2.5 align-top">
                      {leading.render(item)}
                    </td>
                  )}
                  {populatedColumns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        "px-3 py-2.5 align-top leading-relaxed break-words",
                        column.cellClassName,
                      )}
                    >
                      {cellValue(column, item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards (below md) — no horizontal scroll */}
      {isMobile && (
        <div className="flex flex-col gap-3">
          {rows.map((item, index) => (
            <div
              key={rowKey(item, index)}
              className="rounded-lg border border-border p-3"
            >
              {(leading || cardTitle) && (
                <div className="flex items-start gap-2">
                  {leading && (
                    <div className="pt-0.5">{leading.render(item)}</div>
                  )}
                  {cardTitle && (
                    <div className="min-w-0">
                      <div className="font-semibold break-words">
                        {cardTitle(item)}
                      </div>
                      {cardSubtitle && (
                        <div className="text-xs opacity-70">
                          {cardSubtitle(item)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <dl
                className={clsx(
                  "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm",
                  (leading || cardTitle) && "mt-2",
                )}
              >
                {/* Per row, not per column: a card stacks its fields
                    vertically, so every blank one costs a whole line. A 通識
                    course card was 9 rows of which 6 read "—". */}
                {cardColumns
                  .filter((column) => !isCellEmpty(column, item))
                  .map((column) => (
                    <div key={column.key} className="contents">
                      <dt className="whitespace-nowrap opacity-60">
                        {column.label}
                      </dt>
                      <dd className="break-words">{cellValue(column, item)}</dd>
                    </div>
                  ))}
              </dl>
              {cardFooter?.(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataTable;
