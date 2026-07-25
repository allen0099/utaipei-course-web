import { Tabs } from "@heroui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import clsx from "clsx";

import { Panel, PageSection } from "@/components/panel.tsx";
import DefaultLayout from "@/layouts/default.tsx";
import {
  boaiBuildings,
  BuildingCode,
  tianmuBuildings,
} from "@/config/buildings.ts";
import { CampusFloorPlan } from "@/components/floor-plan.tsx";
import { BoAiFloorPlan } from "@/components/floorplans/boai.tsx";
import { PageHeader } from "@/components/page-header.tsx";
import { sectionTitle } from "@/components/primitives.ts";

const BuildingCard = ({
  buildings,
  title,
  activeBuilding,
  onBuildingChange,
  interactive = true,
  className,
}: {
  buildings: BuildingCode[];
  title: string;
  activeBuilding?: string | null;
  onBuildingChange?: (id: string | null) => void;
  /** 天母校區沒有平面圖，highlight 沒有對象，就不要給互動的假象。 */
  interactive?: boolean;
  className?: string;
}) => (
  <Panel className={className}>
    <div className="flex items-center gap-2 mb-4">
      <MapPinIcon className="h-5 w-5 text-accent" />
      <h2 className={sectionTitle({ size: "md" })}>{title}</h2>
    </div>
    {interactive && (
      <p className="text-muted text-sm mb-2">
        點選（或用鍵盤聚焦）大樓名稱即可在右側平面圖上標示位置。
      </p>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
      {buildings.map((building) => {
        const content = (
          <>
            <div className="font-medium">{building.name}</div>
            <div className="text-sm text-muted">
              代碼: {building.code}
              {building.number && ` (${building.number})`}
            </div>
          </>
        );

        if (!interactive) {
          return (
            <div
              key={building.code + building.name}
              className="rounded-md bg-background-secondary p-4"
            >
              {content}
            </div>
          );
        }

        const isActive = activeBuilding === building.id;

        return (
          // A real button: hover alone made the map unusable by keyboard and
          // on touch, where the hint text was even hidden to admit as much.
          <button
            key={building.code + building.name}
            aria-pressed={isActive}
            className={clsx(
              "rounded-md p-4 text-left transition-colors",
              isActive
                ? "bg-accent/15 ring-2 ring-accent"
                : "bg-background-secondary hover:bg-surface-secondary",
            )}
            type="button"
            onClick={() => onBuildingChange?.(isActive ? null : building.id)}
            onFocus={() => onBuildingChange?.(building.id)}
            onMouseEnter={() => onBuildingChange?.(building.id)}
            onMouseLeave={() => onBuildingChange?.(null)}
          >
            {content}
          </button>
        );
      })}
    </div>
  </Panel>
);

export const MapPage = () => {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  return (
    <DefaultLayout>
      <PageSection align="stretch" className="gap-6">
        <PageHeader
          description="臺北市立大學各校區大樓代碼對照表"
          title="大樓代碼說明"
        />
        <Tabs>
          <Tabs.ListContainer>
            <Tabs.List aria-label="選擇校區">
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
                  activeBuilding={hoveredBuilding}
                  buildings={boaiBuildings}
                  className="col-span-1"
                  title="博愛校區"
                  onBuildingChange={setHoveredBuilding}
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
                interactive={false}
                title="天母校區"
              />
            </div>
          </Tabs.Panel>
        </Tabs>
      </PageSection>
    </DefaultLayout>
  );
};

export default MapPage;
