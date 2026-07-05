import { Tabs } from "@heroui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import clsx from "clsx";

import DefaultLayout from "@/layouts/default.tsx";
import {
  boaiBuildings,
  BuildingCode,
  tianmuBuildings,
} from "@/config/buildings.ts";
import { CampusFloorPlan } from "@/components/floor-plan.tsx";
import { BoAiFloorPlan } from "@/components/floorplans/boai.tsx";
import { title as titleStyles } from "@/components/primitives.ts";

const BuildingCard = ({
  buildings,
  title,
  onBuildingHover,
  className,
}: {
  buildings: BuildingCode[];
  title: string;
  onBuildingHover: (id: string | null) => void;
  className?: string;
}) => (
  <div
    className={clsx(
      "rounded-lg border border-gray-200 dark:border-gray-800 p-6",
      className,
    )}
  >
    <div className="flex items-center gap-2 mb-4">
      <MapPinIcon className="h-5 w-5 text-blue-500" />
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <p className="text-default-500 hidden md:block">
      Hint: 移動滑鼠到大樓名稱上可查看該大樓位置
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
      {buildings.map((building) => (
        <div
          key={building.code + building.name}
          className="p-4 rounded-md bg-gray-50 dark:bg-gray-800/50"
          onMouseEnter={() => onBuildingHover(building.id)}
          onMouseLeave={() => onBuildingHover(null)}
        >
          <div className="font-medium">{building.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            代碼: {building.code}
            {building.number && ` (${building.number})`}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const MapPage = () => {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  return (
    <DefaultLayout>
      <div className="mb-6">
        <div className="text-center">
          <h1 className={titleStyles()}>大樓代碼說明</h1>
          <p className="text-default-500">臺北市立大學各校區大樓代碼對照表</p>
        </div>
        <Tabs>
          <Tabs.ListContainer>
            <Tabs.List aria-label="Options">
              <Tabs.Tab id="bo-ai">
                博愛校區
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="tian-mu">
                天母校區
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="bo-ai">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-y-3 md:gap-3 md:grid-cols-3">
                <BuildingCard
                  buildings={boaiBuildings}
                  className="col-span-1"
                  title="博愛校區"
                  onBuildingHover={setHoveredBuilding}
                />
                <CampusFloorPlan className="col-span-2" title="博愛校區平面圖">
                  <BoAiFloorPlan hoveredBuilding={hoveredBuilding} />
                </CampusFloorPlan>
              </div>
            </div>
          </Tabs.Panel>
          <Tabs.Panel id="tian-mu">
            <div className="space-y-6">
              <BuildingCard
                buildings={tianmuBuildings}
                title="天母校區"
                onBuildingHover={() => {}}
              />
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </DefaultLayout>
  );
};

export default MapPage;
