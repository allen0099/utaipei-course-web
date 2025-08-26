import { Key, useEffect, useState } from "react";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

import DefaultLayout from "@/layouts/default.tsx";
import { siteConfig } from "@/config/site.ts";
import { LocationItem, YearSemesterItem } from "@/interfaces/globals.ts";

const YmsSelector = ({ onChange }: { onChange: (id: Key | null) => void }) => {
  const [data, setData] = useState<YearSemesterItem[]>([]);

  useEffect(() => {
    fetch(`${siteConfig.links.github.api}/yms.json`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      });
  }, []);

  return (
    <Autocomplete
      isRequired
      className="max-w-xs"
      label="選擇學年度"
      placeholder="請選擇..."
      variant="bordered"
      onSelectionChange={onChange}
    >
      {data.map((yms) => (
        <AutocompleteItem key={yms.code}>{yms.displayName}</AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

const LocationSelector = ({
  yms,
  onChange,
}: {
  yms: string;
  onChange: (id: Key | null) => void;
}) => {
  const [disabled, setDisabled] = useState(true);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [year, semester] = yms.split("#");

  useEffect(() => {
    if (!yms) {
      setDisabled(true);
      setLocations([]);
      onChange("");

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
    <Autocomplete
      isRequired
      className="max-w-xs"
      isDisabled={disabled}
      label="選擇地點"
      placeholder="請選擇..."
      variant="bordered"
      onSelectionChange={onChange}
    >
      {locations.map((location) => (
        <AutocompleteItem key={location.code}>{location.name}</AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

export const LocationSearchPage = () => {
  const [yms, setYms] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const onYmsChange = (id: Key | null) => {
    setYms(id?.toString() || "");
    setLocation("");
  };

  const onLocationChange = (id: Key | null) => {
    setLocation(id?.toString() || "");
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center py-8 md:py-10 w-full">
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center">
          <YmsSelector onChange={onYmsChange} />
          <LocationSelector yms={yms} onChange={onLocationChange} />
          <Button>查詢</Button>
        </div>
        <Divider className="my-6 max-w-5xl w-full" />
        <div className="w-full max-w-2xl">
          <p>
            目前選擇 {yms} {location}
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
};

export default LocationSearchPage;
