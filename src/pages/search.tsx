import { DatePicker, DateField, Calendar, Label } from "@heroui/react";
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
            name="appointmentDate"
            value={value}
            onChange={(date) => {
              if (!date) setValue(parseDate("2025-05-14"));
              else setValue(date);
            }}
          >
            <Label>Date</Label>
            <DateField.Group fullWidth>
              <DateField.Input>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateField.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator />
                </DatePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DatePicker.Popover>
              <Calendar aria-label="Event date">
                <Calendar.Header>
                  <Calendar.YearPickerTrigger>
                    <Calendar.YearPickerTriggerHeading />
                    <Calendar.YearPickerTriggerIndicator />
                  </Calendar.YearPickerTrigger>
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => <Calendar.Cell date={date} />}
                  </Calendar.GridBody>
                </Calendar.Grid>
                <Calendar.YearPickerGrid>
                  <Calendar.YearPickerGridBody>
                    {({ year }) => <Calendar.YearPickerCell year={year} />}
                  </Calendar.YearPickerGridBody>
                </Calendar.YearPickerGrid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
          <p className="text-gray-500 text-sm">
            Selected date: {value.toString()}
          </p>
          <p className="text-gray-500 text-sm">
            Formatted date:{" "}
            {value ? formatter.format(value.toDate(getLocalTimeZone())) : "--"}
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
}
