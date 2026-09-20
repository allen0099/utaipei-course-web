import { Tabs } from "@heroui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useSearchParams } from "react-router";
import clsx from "clsx";

import { Panel, PageSection } from "@/components/panel.tsx";
import DefaultLayout from "@/layouts/default.tsx";
import {
  boaiBuildings,
  BuildingCode,
  tianmuBuildings,
} from "@/config/buildings.ts";
import { CampusFloorPlan } from "@/components/floor-plan.tsx";
import { CampusMap } from "@/components/floorplans/campus-map.tsx";
import { CampusLayout } from "@/components/floorplans/layout.ts";
import { BOAI_LAYOUT } from "@/components/floorplans/boai-layout.ts";
import { TIANMU_LAYOUT } from "@/components/floorplans/tianmu-layout.ts";
import { PageHeader } from "@/components/page-header.tsx";
import { sectionTitle } from "@/components/primitives.ts";
import { useT } from "@/i18n/language.tsx";
import { campusName } from "@/i18n/terms.ts";

const BuildingCard = ({
  buildings,
  title,
  activeBuilding,
  onBuildingChange,
  layout,
  className,
}: {
  buildings: BuildingCode[];
  title: string;
  activeBuilding?: string | null;
  onBuildingChange?: (id: string | null) => void;
  /**
   * 用來判斷哪些項目畫在圖上。「校外場地」「其它」這類沒有位置的代碼留在清單裡
   * 但不可點 —— highlight 沒有對象，就不要給互動的假象。
   */
  layout: CampusLayout;
  className?: string;
}) => {
  const t = useT();

  return (
    <Panel className={className}>
      <div className="flex items-center gap-2 mb-4">
        <MapPinIcon className="h-5 w-5 text-accent" />
        <h2 className={sectionTitle({ size: "md" })}>{title}</h2>
      </div>
      {
        <p className="text-muted text-sm mb-2">
          {t(
            "點選大樓名稱或平面圖上的建築，兩邊會互相標示。教室代碼的第一個字母就是大樓代碼，例如 G313 在公誠樓（G）3 樓。",
            "Pick a building here or on the plan and the other side highlights it. The first letter of a room code is the building code — G313 is on the 3rd floor of the Gongcheng Building (G).",
          )}
        </p>
      }
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
        {buildings.map((building) => {
          const content = (
            <>
              <div className="font-medium">
                {t(building.name, building.nameEn)}
              </div>
              <div className="text-sm text-muted">
                {t("代碼", "Code")}: {building.code}
                {building.number && ` (${building.number})`}
              </div>
            </>
          );

          const isOnMap = layout.buildings.some(
            (shape) =>
              shape.id === building.id || shape.aliases?.includes(building.id),
          );

          if (!isOnMap) {
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
};

const CAMPUSES = [
  {
    key: "bo-ai",
    name: "博愛校區",
    buildings: boaiBuildings,
    layout: BOAI_LAYOUT,
    aspect: "aspect-[1.22/1]",
  },
  {
    key: "tian-mu",
    name: "天母校區",
    buildings: tianmuBuildings,
    layout: TIANMU_LAYOUT,
    aspect: "aspect-[1.32/1]",
  },
] as const;

export const MapPage = () => {
  const t = useT();
  const [searchParams] = useSearchParams();

  // 課程列表的教室欄會連到 /map?campus=bo-ai&b=G：進來就停在那個校區、那棟樓
  // 已經標好。只在掛載時讀一次，之後以使用者的操作為準。
  const [initial] = useState(() => {
    const campus =
      CAMPUSES.find((item) => item.key === searchParams.get("campus")) ??
      CAMPUSES[0];
    const code = searchParams.get("b")?.toUpperCase();

    return {
      campusKey: campus.key,
      buildingId:
        campus.buildings.find((building) => building.code === code)?.id ?? null,
    };
  });
  // 滑過／聚焦是暫時的，從連結帶進來的那一棟是釘住的：滑鼠移開之後要回到它，
  // 而不是變成什麼都沒選。
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [pinnedBuilding, setPinnedBuilding] = useState(initial.buildingId);
  const activeBuilding = hoveredBuilding ?? pinnedBuilding;

  return (
    <DefaultLayout>
      <PageSection align="stretch" className="gap-6">
        <PageHeader
          description={t(
            "各校區大樓代碼對照與互動平面圖",
            "Building codes for each campus, with an interactive plan",
          )}
          title={t("校園地圖", "Campus Map")}
        />
        <Tabs
          defaultSelectedKey={initial.campusKey}
          // 換校區就放掉釘住的那一棟，它不在另一張圖上。
          onSelectionChange={() => setPinnedBuilding(null)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label={t("選擇校區", "Campus")}>
              {CAMPUSES.map((campus) => (
                <Tabs.Tab key={campus.key} id={campus.key}>
                  {campusName(campus.name, t)}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          {CAMPUSES.map((campus) => (
            <Tabs.Panel key={campus.key} id={campus.key}>
              <div className="grid grid-cols-1 gap-y-3 md:grid-cols-3 md:gap-3">
                <BuildingCard
                  activeBuilding={activeBuilding}
                  buildings={[...campus.buildings]}
                  className="col-span-1"
                  layout={campus.layout}
                  title={campusName(campus.name, t)}
                  onBuildingChange={setHoveredBuilding}
                />
                <CampusFloorPlan
                  aspect={campus.aspect}
                  // 手機上地圖排在清單前面：清單有九項，地圖排後面要捲三個螢幕才看得到。
                  className="order-first col-span-2 md:order-none"
                  title={t(
                    `${campus.name}平面圖`,
                    `${campusName(campus.name, t)} plan`,
                  )}
                >
                  <CampusMap
                    activeBuilding={activeBuilding}
                    buildings={[...campus.buildings]}
                    layout={campus.layout}
                    onActiveChange={setHoveredBuilding}
                  />
                </CampusFloorPlan>
              </div>
            </Tabs.Panel>
          ))}
        </Tabs>
      </PageSection>
    </DefaultLayout>
  );
};

export default MapPage;
