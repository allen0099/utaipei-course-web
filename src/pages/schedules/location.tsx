import { Select, SelectItem } from "@heroui/select";
import { ChangeEventHandler, useEffect, useState } from "react";

import DefaultLayout from "@/layouts/default.tsx";
import { siteConfig } from "@/config/site.ts";
import { LocationItem, YearSemesterItem } from "@/interfaces/globals.ts";

const YmsSelector = ({
  onChangeYms,
}: {
  onChangeYms: ChangeEventHandler<HTMLSelectElement>;
}) => {
  const [data, setData] = useState<YearSemesterItem[]>([]);

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/yms.json`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      });
  }, []);

  return (
    <Select
      isRequired
      isVirtualized
      className="max-w-xs"
      items={data}
      label="選擇學年度"
      placeholder="請選擇..."
      onChange={onChangeYms}
    >
      {(yms) => <SelectItem key={yms.code}>{yms.displayName}</SelectItem>}
    </Select>
  );
};

const LocationSelector = ({ yms }: { yms: string }) => {
  const [disabled, setDisabled] = useState(true);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [year, semester] = yms.split("#");

  useEffect(() => {
    if (!yms) {
      setDisabled(true);
      setLocations([]);

      return;
    }

    fetch(`${siteConfig.links.github.api}/${year}/${semester}/locations.json`)
      .then((res) => res.json())
      .then((data) => {
        setDisabled(false);
        setLocations(data);
      });
  }, [yms]);

  return (
    <Select
      isRequired
      isVirtualized
      className="max-w-xs"
      isDisabled={disabled}
      items={locations}
      label="選擇地點"
      placeholder="請選擇..."
    >
      {(location) => (
        <SelectItem key={location.code}>{location.name}</SelectItem>
      )}
    </Select>
  );
};

export const LocationSearchPage = () => {
  const [yms, setYms] = useState<string>("");

  const handleSelectionChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setYms(e.target.value);
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <YmsSelector onChangeYms={handleSelectionChange} />
        <LocationSelector yms={yms} />
      </section>
    </DefaultLayout>
  );
};

export default LocationSearchPage;
