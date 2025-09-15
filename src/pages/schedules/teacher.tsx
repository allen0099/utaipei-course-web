import { Divider } from "@heroui/divider";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Key } from "@react-types/shared";

import DefaultLayout from "@/layouts/default.tsx";
import { YmsSelector } from "@/components/selectors/ymsSelector.tsx";
import { ItemSelector } from "@/components/selectors/itemSelector.tsx";
import { siteConfig } from "@/config/site.ts";
import { TeacherClasses, Units } from "@/interfaces/globals.ts";
import WeeklySchedule from "@/components/weekly-schedule.tsx";
import { convertCourses } from "@/utils/convert-course.ts";

type SelectorProps = {
  setTeacher: Dispatch<SetStateAction<TeacherClasses | undefined>>;
};

const Selector = (prop: SelectorProps) => {
  const [yms, setYms] = useState<string>("");
  const [unit, setUnit] = useState<Units | undefined>(undefined);

  const [units, setUnits] = useState<Units[]>([]);

  const teachers = useMemo(() => unit?.teachers || [], [unit]);

  useEffect(() => {
    if (!yms) {
      setUnits([]);

      return;
    }

    const [year, semester] = yms.split("#");

    fetch(`${siteConfig.links.github.api}/${year}/${semester}/teachers.json`)
      .then((res) => res.json())
      .then((data: Units[]) => {
        // Data input is reversed to show latest first
        data.reverse();
        setUnits(data);
      });
  }, [yms]);

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center">
      <YmsSelector
        onChange={(id: Key | null) => {
          setYms(id?.toString() || "");
        }}
      />
      <ItemSelector
        items={units}
        label="請選擇系級"
        onChange={(id) => {
          setUnit(units.find((u) => u.code === id) || undefined);
        }}
      />
      <ItemSelector
        items={teachers}
        label="請選擇教師"
        onChange={(id) => {
          const teacher = teachers.find((t) => t.code === id);

          if (teacher) {
            prop.setTeacher(teacher);
          }
        }}
      />
    </div>
  );
};

export const TeacherSchedulePage = () => {
  const [teacher, setTeacher] = useState<TeacherClasses>();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center py-8 md:py-10 w-full">
        <Selector setTeacher={setTeacher} />
        <Divider className="my-6 max-w-5xl w-full" />
        {teacher ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {teacher.class.map((c) => (
                <div
                  key={c.code}
                  className="w-full max-w-2xl p-4 border rounded-lg shadow-sm mb-4"
                >
                  <h2 className="text-xl font-semibold mb-2">
                    {c.name} ({c.code})
                  </h2>
                  <p className="mb-1">
                    <strong>班級：</strong>
                    {c.class}
                  </p>
                  <p className="mb-1">
                    <strong>時間：</strong>
                    {c.time || "時間未定"}
                  </p>
                  <p className="mb-1">
                    <strong>教師：</strong>
                    {c.teacher}
                  </p>
                </div>
              ))}
            </div>
            <WeeklySchedule
              className="mt-5"
              courses={convertCourses(teacher.class)}
              scheduleTitle={`${teacher.name} 教師的課表`}
            />
          </>
        ) : (
          <p className="text-gray-500">請選擇系級與教師以查看課程。</p>
        )}
      </section>
    </DefaultLayout>
  );
};

export default TeacherSchedulePage;
