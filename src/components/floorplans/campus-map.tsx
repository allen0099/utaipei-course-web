import clsx from "clsx";

import { BuildingCode } from "@/config/buildings.ts";
import {
  BuildingShape,
  CampusLayout,
  FeatureShape,
} from "@/components/floorplans/layout.ts";
import { useLanguage } from "@/i18n/language.tsx";

/** 拉丁字母的平均字寬約是字級的 0.55 倍；只用來判斷「放不放得下」。 */
const LATIN_CHAR_WIDTH = 0.55;

const latinWidth = (text: string, size: number) =>
  text.length * size * LATIN_CHAR_WIDTH;

export interface CampusMapProps {
  layout: CampusLayout;
  buildings: BuildingCode[];
  activeBuilding: string | null;
  onActiveChange: (id: string | null) => void;
  className?: string;
}

const FEATURE_FILL: Record<FeatureShape["tone"], string> = {
  grass: "fill-emerald-300 dark:fill-emerald-800",
  court: "fill-sky-200 dark:fill-sky-900",
  track: "fill-orange-300 dark:fill-orange-900",
  parking: "fill-blue-700 dark:fill-blue-600",
};

/** 一個字一個 tspan 往下排。writing-mode 在 SVG <text> 上各家瀏覽器的基線算法
 * 不一致，直排幾個字不值得賭那個。 */
const VerticalText = ({
  text,
  x,
  centerY,
  size,
  className,
}: {
  text: string;
  x: number;
  centerY: number;
  size: number;
  className?: string;
}) => {
  const chars = [...text];
  const lineHeight = size * 1.2;
  const top = centerY - ((chars.length - 1) * lineHeight) / 2 + size * 0.35;

  return (
    <text className={className} fontSize={size} textAnchor="middle">
      {chars.map((char, index) => (
        <tspan key={index} x={x} y={top + index * lineHeight}>
          {char}
        </tspan>
      ))}
    </text>
  );
};

const Feature = ({
  feature,
  textSize,
}: {
  feature: FeatureShape;
  textSize: number;
}) => {
  const { language } = useLanguage();
  const isEnglish = language === "en";
  const label = (isEnglish && feature.labelEn) || feature.label;
  const { shape, inset = 0 } = feature;
  const center =
    shape.type === "ellipse"
      ? { x: shape.cx, y: shape.cy }
      : { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  const isParking = feature.tone === "parking";
  const labelClass = isParking
    ? "fill-yellow-300 font-bold"
    : "fill-emerald-950 dark:fill-emerald-100";

  return (
    <g>
      {shape.type === "ellipse" ? (
        <>
          <ellipse
            className={FEATURE_FILL[feature.tone]}
            cx={shape.cx}
            cy={shape.cy}
            rx={shape.rx}
            ry={shape.ry}
          />
          {inset > 0 && (
            <ellipse
              className={FEATURE_FILL.grass}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx - inset}
              ry={shape.ry - inset}
            />
          )}
        </>
      ) : (
        <rect
          className={FEATURE_FILL[feature.tone]}
          height={shape.height}
          rx={isParking ? 3 : 6}
          width={shape.width}
          x={shape.x}
          y={shape.y}
        />
      )}
      {feature.verticalLabel && !isEnglish ? (
        <VerticalText
          centerY={center.y}
          className={labelClass}
          size={textSize}
          text={label}
          x={center.x}
        />
      ) : (
        <text
          className={labelClass}
          fontSize={isParking ? textSize * 1.3 : textSize}
          textAnchor="middle"
          // 一字一行的直排對英文沒有意義：窄長的場地橫排放得下就橫排，放不下
          // 就整行轉 90 度。
          transform={
            feature.verticalLabel &&
            shape.type === "rect" &&
            latinWidth(label, textSize) > shape.width - 4
              ? `rotate(-90 ${center.x} ${center.y})`
              : undefined
          }
          x={center.x}
          y={center.y + textSize * 0.38}
        >
          {label}
        </text>
      )}
    </g>
  );
};

const BuildingLabel = ({
  shape,
  codes,
  name,
  text,
}: {
  shape: BuildingShape;
  codes: string;
  /** null 表示不畫名稱那一行（英文名稱放不下時），只留代碼。 */
  name: string | null;
  text: CampusLayout["text"];
}) => {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;

  if (name === null) {
    const size = shape.verticalLabel ? text.code * 0.75 : text.code;

    return (
      <text
        className="fill-current font-bold"
        fontSize={size}
        textAnchor="middle"
        x={cx}
        y={cy + size * 0.35}
      >
        {codes}
      </text>
    );
  }

  if (shape.verticalLabel) {
    return (
      <>
        <text
          className="fill-current font-bold"
          fontSize={text.code * 0.75}
          textAnchor="middle"
          x={cx}
          y={shape.y + text.code}
        >
          {codes}
        </text>
        <VerticalText
          centerY={cy + text.code * 0.5}
          className="fill-current opacity-80"
          size={text.name}
          text={name}
          x={cx}
        />
      </>
    );
  }

  return (
    <>
      {/* 代碼比名稱大：學生是拿著「G313」來找的，要先對到的是那個字母。 */}
      <text
        className="fill-current font-bold"
        fontSize={text.code}
        textAnchor="middle"
        x={cx}
        y={cy + text.code * 0.1}
      >
        {codes}
      </text>
      <text
        className="fill-current opacity-80"
        fontSize={text.name}
        textAnchor="middle"
        x={cx}
        y={cy + text.code * 0.1 + text.name * 1.4}
      >
        {name}
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
 * - **幾何是資料**（layout.ts 的 CampusLayout），名稱與代碼來自
 *   config/buildings.ts，這裡只負責畫。一個校區就是一份 layout 檔。
 * - **顏色全部走 Tailwind class**，跟著主題切換；字用頁面的字型，不內嵌。
 * - 選取狀態用填色與外框表示。舊版是把被選到的建築「模糊掉」，那會讓你正要看
 *   的那一棟變得最難看清楚。
 */
export const CampusMap = ({
  layout,
  buildings,
  activeBuilding,
  onActiveChange,
  className,
}: CampusMapProps) => {
  const { language, t } = useLanguage();
  const isEnglish = language === "en";
  const byId = new Map(buildings.map((building) => [building.id, building]));

  return (
    <svg
      aria-label={t(
        `${layout.label}，上方為北`,
        `${layout.labelEn ?? layout.label}, north is up`,
      )}
      className={clsx("h-full w-full select-none", className)}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 馬路：先畫全部的路面，再畫全部的路名，路口才不會有一條路蓋住另一條的字。 */}
      {layout.roads.map((road) => (
        <path
          key={road.name}
          className="stroke-stone-200 dark:stroke-stone-800"
          d={road.path}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={road.width}
        />
      ))}
      {layout.roads.map((road) => (
        <text
          key={road.name}
          className="fill-stone-600 dark:fill-stone-400"
          fontSize={layout.text.road}
          // 拉開字距是給中文路名的；英文照樣拉會散成一個個字母。
          letterSpacing={isEnglish ? undefined : layout.text.road * 0.2}
          textAnchor="middle"
          transform={
            road.label.rotate
              ? `rotate(${road.label.rotate} ${road.label.x} ${road.label.y})`
              : undefined
          }
          x={road.label.x}
          y={road.label.y + layout.text.road * 0.35}
        >
          {(isEnglish && road.nameEn) || road.name}
        </text>
      ))}

      {/* 校地 */}
      <path
        className="fill-emerald-100 stroke-emerald-300 dark:fill-emerald-950 dark:stroke-emerald-800"
        d={layout.ground}
        strokeLinejoin="round"
        strokeWidth={layout.text.road * 0.1}
      />

      {layout.features.map((feature, index) => (
        <Feature
          key={`${feature.label}-${index}`}
          feature={feature}
          textSize={layout.text.feature}
        />
      ))}

      {/* 指北 */}
      <g
        className="fill-stone-600 dark:fill-stone-400"
        transform={`translate(${layout.north.x} ${layout.north.y}) scale(${layout.text.road / 30})`}
      >
        <path d="M0 -34 L14 10 L0 0 L-14 10 Z" />
        <text fontSize={26} fontWeight={700} textAnchor="middle" y={40}>
          N
        </text>
      </g>

      {layout.buildings.map((shape) => {
        const ids = [shape.id, ...(shape.aliases ?? [])];
        const matched = ids
          .map((id) => byId.get(id))
          .filter((item): item is BuildingCode => !!item);

        if (matched.length === 0) return null;

        const codes = matched
          .map((item) => item.code)
          .join(isEnglish ? "/" : "・");
        const name = isEnglish
          ? (shape.labelOverrideEn ?? matched[0].nameEn)
          : (shape.labelOverride ?? matched[0].name);
        // 英文名稱比中文長得多：直排的建築不畫、橫排的也只在放得下時才畫。
        // 完整名稱永遠在 <title> 與 aria-label 裡，旁邊的清單也有。
        const visibleName =
          isEnglish &&
          (shape.verticalLabel ||
            latinWidth(name, layout.text.name) > shape.width - 8)
            ? null
            : name;
        const isActive =
          activeBuilding !== null && ids.includes(activeBuilding);
        const isDimmed = activeBuilding !== null && !isActive;

        return (
          <g
            key={shape.id}
            aria-current={isActive || undefined}
            aria-label={t(
              `${name}，代碼 ${matched.map((item) => item.code).join("、")}`,
              `${name}, code ${matched.map((item) => item.code).join(", ")}`,
            )}
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
            <title>{t(`${name}（${codes}）`, `${name} (${codes})`)}</title>
            <rect
              className={clsx(
                "transition-colors",
                isActive
                  ? "fill-accent stroke-accent"
                  : "fill-white stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500",
              )}
              height={shape.height}
              rx={shape.rx ?? layout.text.code * 0.2}
              strokeWidth={layout.text.code * (isActive ? 0.1 : 0.05)}
              width={shape.width}
              x={shape.x}
              y={shape.y}
            />
            <BuildingLabel
              codes={codes}
              name={visibleName}
              shape={shape}
              text={layout.text}
            />
          </g>
        );
      })}
    </svg>
  );
};

export default CampusMap;
