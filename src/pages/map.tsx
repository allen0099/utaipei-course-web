import { Tab, Tabs } from "@heroui/tabs";
import { Link } from "@heroui/link";
import { MapPinIcon } from "@heroicons/react/24/outline";

import DefaultLayout from "@/layouts/default.tsx";
import {
  boaiBuildings,
  BuildingCode,
  tianmuBuildings,
} from "@/config/buildings.ts";
import { CampusFloorPlan } from "@/components/floor-plan.tsx";
import { BoAiFloorPlan } from "@/components/floorplans/boai.tsx";

const BuildingCard = ({
  buildings,
  title,
}: {
  buildings: BuildingCode[];
  title: string;
}) => (
  <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6">
    <div className="flex items-center gap-2 mb-4">
      <MapPinIcon className="h-5 w-5 text-blue-500" />
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {buildings.map((building) => (
        <div
          key={building.code + building.name}
          className="p-4 rounded-md bg-gray-50 dark:bg-gray-800/50"
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
  return (
    <DefaultLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">大樓代碼說明</h1>
          <p className="text-default-500">臺北市立大學各校區大樓代碼對照表</p>
        </div>
        <Tabs aria-label="Options">
          <Tab key="bo-ai" title="博愛校區">
            <div className="space-y-6">
              <BuildingCard buildings={boaiBuildings} title="博愛校區" />
              <CampusFloorPlan title="博愛校區平面圖">
                <BoAiFloorPlan />
              </CampusFloorPlan>
            </div>
          </Tab>
          <Tab key="tian-mu" title="天母校區">
            <div className="space-y-6">
              <BuildingCard buildings={tianmuBuildings} title="天母校區" />
            </div>
          </Tab>
        </Tabs>

        <div className="text-center pb-8">
          <Link
            className="inline-flex items-center text-blue-500 hover:text-blue-600"
            href="/"
          >
            ← 返回首頁
          </Link>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MapPage;
