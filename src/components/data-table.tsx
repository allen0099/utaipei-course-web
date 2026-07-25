import type { ReactNode } from "react";

import clsx from "clsx";

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
  className?: string;
}

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
 */
export const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  leading,
  cardTitle,
  cardSubtitle,
  className,
}: DataTableProps<T>) => {
  const cardColumns = columns.filter((column) => !column.hideOnCard);

  return (
    <div className={className}>
      {/* Desktop table (md and up) */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            {leading && <col className={leading.width ?? "w-14"} />}
            {columns.map((column) => (
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
              {columns.map((column) => (
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
              >
                {leading && (
                  <td className="px-3 py-2.5 align-top">
                    {leading.render(item)}
                  </td>
                )}
                {columns.map((column) => (
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

      {/* Mobile cards (below md) — no horizontal scroll */}
      <div className="flex flex-col gap-3 md:hidden">
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
              {cardColumns.map((column) => (
                <div key={column.key} className="contents">
                  <dt className="whitespace-nowrap opacity-60">
                    {column.label}
                  </dt>
                  <dd className="break-words">{cellValue(column, item)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;
