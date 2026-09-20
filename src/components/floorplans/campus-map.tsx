import clsx from "clsx";

import { BuildingCode } from "@/config/buildings.ts";
import {
  BOAI_BUILDINGS,
  BOAI_FIELD,
  BOAI_GROUND,
  BOAI_ROADS,
  BOAI_VIEWBOX,
  BuildingShape,
} from "@/components/floorplans/boai-layout.ts";

export interface CampusMapProps {
  buildings: BuildingCode[];
  activeBuilding: string | null;
  onActiveChange: (id: string | null) => void;
  className?: string;
}

const CODE_SIZE = 60;
const NAME_SIZE = 28;

const BuildingLabel = ({
  shape,
  building,
}: {
  shape: BuildingShape;
  building: BuildingCode;
}) => {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;

  if (shape.verticalLabel) {
    // 一個字一個 tspan 往下排。writing-mode 在 SVG <text> 上各家瀏覽器的基線
    // 算法不一致，直排三個字不值得賭那個。
    const chars = [...building.name];
    const lineHeight = NAME_SIZE + 6;
    const top = cy - ((chars.length - 1) * lineHeight) / 2 + 30;

    return (
      <>
        <text
          className="fill-current font-bold"
          fontSize={44}
          textAnchor="middle"
          x={cx}
          y={shape.y + 56}
        >
          {building.code}
        </text>
        <text
          className="fill-current opacity-80"
          fontSize={NAME_SIZE}
          textAnchor="middle"
        >
          {chars.map((char, index) => (
            <tspan key={index} x={cx} y={top + index * lineHeight}>
              {char}
            </tspan>
          ))}
        </text>
      </>
    );
  }

  return (
    <>
      {/* 代碼比名稱大：學生是拿著「G313」來找的，要先對到的是那個字母。 */}
      <text
        className="fill-current font-bold"
        fontSize={CODE_SIZE}
        textAnchor="middle"
        x={cx}
        y={cy + 6}
      >
        {building.code}
      </text>
      <text
        className="fill-current opacity-80"
        fontSize={NAME_SIZE}
        textAnchor="middle"
        x={cx}
        y={cy + 6 + NAME_SIZE + 10}
      >
        {building.name}
      </text>
    </>
  );
};

/**
 * 校區平面圖。
 *
 * 前一版是 Excalidraw 匯出的手繪路徑（98KB，內嵌一份 base64 字型），每棟建築
 * 外面包一個 HeroUI 的 <Tooltip.Trigger>。HeroUI v3 的 Trigger 會渲染一個
 * <div>，而 <svg> 裡的 <div> 是未知元素、裡面的東西一律不繪製 —— 升級之後整張
 * 圖只剩底色和浮在上面的字。
 *
 * 這一版的原則：
 * - **SVG 裡只放 SVG 元素。** 互動（hover／focus／click）直接掛在 <g> 上，
 *   提示用原生 <title>，不再把 HTML 元件塞進來。
 * - **幾何是資料**（boai-layout.ts），名稱與代碼來自 config/buildings.ts，
 *   這裡只負責畫。要補天母校區只需要另一份 layout。
 * - **顏色全部走 Tailwind class**，跟著主題切換；字用頁面的字型，不內嵌。
 * - 選取狀態用填色與外框表示。舊版是把被選到的建築「模糊掉」，那會讓你正要看
 *   的那一棟變得最難看清楚。
 */
export const CampusMap = ({
  buildings,
  activeBuilding,
  onActiveChange,
  className,
}: CampusMapProps) => {
  const byId = new Map(buildings.map((building) => [building.id, building]));

  return (
    <svg
      aria-label="博愛校區平面圖，上方為北"
      className={clsx("h-full w-full select-none", className)}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      viewBox={`0 0 ${BOAI_VIEWBOX.width} ${BOAI_VIEWBOX.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 外圈：馬路 */}
      <rect
        className="fill-stone-200 dark:fill-stone-800"
        height={BOAI_VIEWBOX.height - 16}
        rx={28}
        width={BOAI_VIEWBOX.width - 16}
        x={8}
        y={8}
      />
      {BOAI_ROADS.map((road) => (
        <text
          key={road.name}
          className="fill-stone-600 dark:fill-stone-400"
          fontSize={30}
          letterSpacing={6}
          textAnchor="middle"
          transform={
            road.vertical ? `rotate(-90 ${road.x} ${road.y})` : undefined
          }
          x={road.x}
          y={road.y + 10}
        >
          {road.name}
        </text>
      ))}

      {/* 校地 */}
      <rect
        className="fill-emerald-100 stroke-emerald-300 dark:fill-emerald-950 dark:stroke-emerald-800"
        height={BOAI_GROUND.height}
        rx={16}
        strokeWidth={3}
        width={BOAI_GROUND.width}
        x={BOAI_GROUND.x}
        y={BOAI_GROUND.y}
      />

      {/* 操場：外圈跑道、內圈草地 */}
      <ellipse
        className="fill-orange-300 dark:fill-orange-900"
        cx={BOAI_FIELD.cx}
        cy={BOAI_FIELD.cy}
        rx={BOAI_FIELD.rx}
        ry={BOAI_FIELD.ry}
      />
      <ellipse
        className="fill-emerald-300 dark:fill-emerald-800"
        cx={BOAI_FIELD.cx}
        cy={BOAI_FIELD.cy}
        rx={BOAI_FIELD.rx - 34}
        ry={BOAI_FIELD.ry - 34}
      />
      <text
        className="fill-emerald-900 dark:fill-emerald-200"
        fontSize={32}
        textAnchor="middle"
        x={BOAI_FIELD.cx}
        y={BOAI_FIELD.cy + 11}
      >
        操場
      </text>

      {/* 指北 */}
      <g
        className="fill-stone-600 dark:fill-stone-400"
        transform="translate(1204 70)"
      >
        <path d="M0 -34 L14 10 L0 0 L-14 10 Z" />
        <text fontSize={26} fontWeight={700} textAnchor="middle" y={40}>
          N
        </text>
      </g>

      {BOAI_BUILDINGS.map((shape) => {
        const building = byId.get(shape.id);

        if (!building) return null;

        const isActive = activeBuilding === shape.id;
        const isDimmed = activeBuilding !== null && !isActive;

        return (
          <g
            key={shape.id}
            aria-current={isActive || undefined}
            aria-label={`${building.name}，代碼 ${building.code}`}
            className={clsx(
              "cursor-pointer outline-none transition-opacity",
              isActive ? "text-white" : "text-slate-800 dark:text-slate-100",
              isDimmed && "opacity-45",
            )}
            // group 而不是 button：聚焦／滑過就是全部的互動，沒有「按下去」會
            // 發生的事，宣告成按鈕是騙人。點一下只是讓觸控也能選到（觸控沒有
            // hover，而 <g> 被點到時會拿到焦點）。
            role="group"
            tabIndex={0}
            onBlur={() => onActiveChange(null)}
            onClick={() => onActiveChange(shape.id)}
            onFocus={() => onActiveChange(shape.id)}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") onActiveChange(shape.id);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") onActiveChange(null);
            }}
          >
            <title>{`${building.name}（${building.code}）`}</title>
            <rect
              className={clsx(
                "transition-colors",
                isActive
                  ? "fill-accent stroke-accent"
                  : "fill-white stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500",
              )}
              height={shape.height}
              rx={12}
              strokeWidth={isActive ? 6 : 3}
              width={shape.width}
              x={shape.x}
              y={shape.y}
            />
            <BuildingLabel building={building} shape={shape} />
          </g>
        );
      })}
    </svg>
  );
};

export default CampusMap;
