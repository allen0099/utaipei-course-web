import { DatePicker } from "@heroui/date-picker";
import { useDateFormatter } from "@react-aria/i18n";
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
} from "@internationalized/date";
import React from "react";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function SearchPage() {
  const [value, setValue] = React.useState<CalendarDate>(
    parseDate("2025-05-14"),
  );

  let formatter = useDateFormatter({ dateStyle: "full" });

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>課程查詢</h1>
          <p>此頁面正在建置中。</p>
          <DatePicker
            showMonthAndYearPickers
            className="max-w-[284px]"
            label="Date (controlled)"
            value={value}
            onChange={(date) => {
              if (!date) setValue(parseDate("2025-05-14"));
              else setValue(date);
            }}
          />
          <p className="text-default-500 text-sm">
            Selected date: {value.toString()}
          </p>
          <p className="text-default-500 text-sm">
            Formatted date:{" "}
            {value ? formatter.format(value.toDate(getLocalTimeZone())) : "--"}
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
}
