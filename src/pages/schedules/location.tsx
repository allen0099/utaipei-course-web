import { useEffect, useState } from "react";
import { Divider } from "@heroui/divider";
import { Key } from "@react-types/shared";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";

import DefaultLayout from "@/layouts/default.tsx";
import { siteConfig } from "@/config/site.ts";
import { CourseItem, LocationItem } from "@/interfaces/globals.ts";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";

const LocationTable = ({ courses }: { courses: CourseItem[] }) => {
  const columns = [
    { key: "code", label: "課程代碼" },
    { key: "name", label: "課程名稱" },
    { key: "teacher", label: "教師" },
    { key: "class", label: "班級名稱" },
    { key: "time", label: "時間" },
  ];

  if (!courses || courses.length === 0) {
    return <div className="mt-4">尚未選擇地點或無資料</div>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <Table fullWidth isStriped aria-label="課程表" radius="md" shadow="sm">
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent="尚未選擇地點或無資料" items={courses}>
          {(item) => (
            <TableRow key={item.code}>
              {(columnKey) => (
                <TableCell>{item[columnKey as keyof typeof item]}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export const LocationSearchPage = () => {
  const [yms, setYms] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [year, semester] = yms.split("#");

  const scheduleTitle = `${year} 學年 (${semester}) ${locations.find((loc) => loc.code === location)?.name || ""} 的課表`;
  const selectedLocation = locations.find((loc) => loc.code === location);

  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
    setLocation("");
  };

  const onLocationChange = (id: Key | null) => {
    setLocation(id?.toString() || "");
  };

  useEffect(() => {
    if (!yms) {
      setLocations([]);

      return;
    }
    const [year, semester] = yms.split("#");

    fetch(`${siteConfig.links.github.api}/${year}/${semester}/locations.json`)
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
      });
  }, [yms]);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center py-8 md:py-10 w-full">
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center">
          <YmsSelector onChange={onYmsChange} />
          <ItemSelector
            items={locations}
            label="選擇地點"
            onChange={onLocationChange}
          />
        </div>
        <Divider className="my-6 max-w-5xl w-full" />
        <div className="w-full max-w-2xl">
          {selectedLocation ? (
            <>
              <h3 className="text-lg text-center mb-2">{scheduleTitle}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                學期：{semester}
              </p>
            </>
          ) : (
            <h3 className="text-lg text-center mb-2">尚未選擇地點</h3>
          )}
        </div>
        {selectedLocation && (
          <>
            <LocationTable courses={selectedLocation.courses} />
            <WeeklySchedule
              className="mt-5"
              courses={convertCourses(selectedLocation.courses)}
              scheduleTitle={scheduleTitle}
            />
          </>
        )}
      </section>
    </DefaultLayout>
  );
};

export default LocationSearchPage;
