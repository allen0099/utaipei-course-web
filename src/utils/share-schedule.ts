import { CourseItem } from "@/interfaces/globals.ts";

/**
 * A schedule encoded into a shareable link.
 *
 * The site has no backend, so a shared schedule can't be stored anywhere and
 * handed out by id — the whole thing has to travel inside the URL. It rides in
 * the fragment (`/share#…`) rather than the query string precisely because the
 * fragment is never sent to the server, so it stays out of request logs,
 * Referer headers and CDN caches.
 *
 * v2 carries only 選課代碼, which is unique within a 學年期, and the viewer
 * looks the rest up in courses.json. That keeps links short and — more
 * importantly — makes a shared schedule show the same fields as everywhere
 * else, instead of the five that happened to fit in a URL.
 *
 * v1 links inlined those five fields. They are still decoded and rendered
 * without any network request, so every link handed out before the change
 * keeps working exactly as it did.
 */
export interface SharedScheduleV1 {
  v: 1;
  /** 學年期 code, e.g. "115#1". A schedule is always from a single one. */
  y: string;
  /** Optional user-supplied title. */
  t?: string;
  /** [code, name, class, time, teacher] */
  c: [string, string, string, string, string][];
}

export interface SharedScheduleV2 {
  v: 2;
  y: string;
  t?: string;
  /** 選課代碼 only; resolved against courses.json by the viewer. */
  c: string[];
}

export type SharedSchedulePayload = SharedScheduleV1 | SharedScheduleV2;

// Deliberately conservative limits. /share deserialises a string that any
// stranger can hand the user and then offers to write it into localStorage, so
// anything that doesn't look like one person's semester is rejected outright.
const MAX_ENCODED_LENGTH = 8000;
const MAX_DECOMPRESSED_BYTES = 64 * 1024;
const MAX_COURSES = 100;
const MAX_FIELD_LENGTH = 100;

export const MAX_SHARE_TITLE_LENGTH = 40;

const YMS_PATTERN = /^\d{2,3}#\d$/;
/** 選課代碼 is a short numeric string ("0089", "3128"). */
const COURSE_CODE_PATTERN = /^\d{3,5}$/;

// First character of the encoded string: which representation follows.
const FORMAT_PLAIN = "0";
const FORMAT_DEFLATE = "1";

/** Thrown for every rejected link; the page shows one generic message. */
export class ShareLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShareLinkError";
  }
}

const supportsCompression = () =>
  typeof CompressionStream !== "undefined" &&
  typeof DecompressionStream !== "undefined";

const toBase64Url = (bytes: Uint8Array): string => {
  // Built one character at a time rather than via String.fromCharCode(...bytes),
  // which overflows the argument limit on larger schedules.
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const fromBase64Url = (text: string): Uint8Array<ArrayBuffer> => {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  // atob is specified to tolerate missing padding, but not every engine agrees,
  // so restore it explicitly.
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  let binary: string;

  try {
    binary = atob(padded);
  } catch {
    throw new ShareLinkError("分享連結的內容不是有效的編碼");
  }

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const deflate = async (
  bytes: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> => {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));

  return new Uint8Array(await new Response(stream).arrayBuffer());
};

/**
 * Inflate while counting output bytes, aborting the moment the cap is passed.
 *
 * A few hundred bytes of crafted deflate stream can expand to gigabytes, so the
 * limit has to be enforced during decompression — checking the length after
 * `new Response(stream).arrayBuffer()` resolves would already be too late.
 */
const inflateWithLimit = async (
  bytes: Uint8Array<ArrayBuffer>,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> => {
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > limit) {
        await reader.cancel();
        throw new ShareLinkError("分享連結的內容過大");
      }

      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ShareLinkError) throw error;
    throw new ShareLinkError("分享連結的內容無法解壓縮");
  }

  const result = new Uint8Array(total);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return result;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const validate = (raw: unknown): SharedSchedulePayload => {
  if (!raw || typeof raw !== "object") {
    throw new ShareLinkError("分享連結的內容格式不正確");
  }

  const data = raw as Record<string, unknown>;

  if (data.v !== 1 && data.v !== 2) {
    throw new ShareLinkError("分享連結的版本不支援");
  }

  if (!isNonEmptyString(data.y) || !YMS_PATTERN.test(data.y)) {
    throw new ShareLinkError("分享連結缺少有效的學年期");
  }

  if (!Array.isArray(data.c) || data.c.length === 0) {
    throw new ShareLinkError("分享連結沒有任何課程");
  }

  if (data.c.length > MAX_COURSES) {
    throw new ShareLinkError("分享連結的課程數量超過上限");
  }

  const title =
    typeof data.t === "string"
      ? data.t.slice(0, MAX_SHARE_TITLE_LENGTH).trim()
      : "";

  if (data.v === 2) {
    const codes = data.c.map((entry) => {
      if (typeof entry !== "string" || !COURSE_CODE_PATTERN.test(entry)) {
        throw new ShareLinkError("分享連結的課程代碼不正確");
      }

      return entry;
    });

    return { v: 2, y: data.y, ...(title ? { t: title } : {}), c: codes };
  }

  const courses = data.c.map((entry) => {
    if (!Array.isArray(entry) || entry.length !== 5) {
      throw new ShareLinkError("分享連結的課程格式不正確");
    }

    return entry.map((field) => {
      if (typeof field !== "string" || field.length > MAX_FIELD_LENGTH) {
        throw new ShareLinkError("分享連結的課程欄位不正確");
      }

      return field;
    }) as [string, string, string, string, string];
  });

  return {
    v: 1,
    y: data.y,
    ...(title ? { t: title } : {}),
    c: courses,
  };
};

export const encodeSchedule = async (
  courses: CourseItem[],
  yms: string,
  title?: string,
): Promise<string> => {
  const trimmed = title?.slice(0, MAX_SHARE_TITLE_LENGTH).trim();
  const payload: SharedSchedulePayload = {
    v: 2,
    y: yms,
    ...(trimmed ? { t: trimmed } : {}),
    c: courses.map((course) => course.code),
  };

  const bytes = new TextEncoder().encode(JSON.stringify(payload));

  if (!supportsCompression()) {
    return FORMAT_PLAIN + toBase64Url(bytes);
  }

  return FORMAT_DEFLATE + toBase64Url(await deflate(bytes));
};

export const decodeSchedule = async (
  raw: string,
): Promise<SharedSchedulePayload> => {
  const text = raw.trim();

  if (!text) {
    throw new ShareLinkError("分享連結沒有內容");
  }

  if (text.length > MAX_ENCODED_LENGTH) {
    throw new ShareLinkError("分享連結過長");
  }

  const format = text[0];
  const body = fromBase64Url(text.slice(1));

  let bytes: Uint8Array<ArrayBuffer>;

  if (format === FORMAT_PLAIN) {
    if (body.byteLength > MAX_DECOMPRESSED_BYTES) {
      throw new ShareLinkError("分享連結的內容過大");
    }
    bytes = body;
  } else if (format === FORMAT_DEFLATE) {
    if (!supportsCompression()) {
      throw new ShareLinkError("此瀏覽器無法解讀壓縮過的分享連結");
    }
    bytes = await inflateWithLimit(body, MAX_DECOMPRESSED_BYTES);
  } else {
    throw new ShareLinkError("分享連結的格式無法辨識");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ShareLinkError("分享連結的內容無法解析");
  }

  return validate(parsed);
};

/** Turns the payload from `encodeSchedule` into the full link to hand out. */
export const buildShareUrl = (payload: string): string =>
  `${window.location.origin}/share#${payload}`;

/**
 * A v1 payload's inlined courses, in the shape the rest of the app renders.
 *
 * v2 has no inlined courses — the viewer resolves its codes against
 * courses.json instead — so this returns nothing for it.
 */
export const payloadToCourses = (
  payload: SharedSchedulePayload,
): CourseItem[] =>
  payload.v === 1
    ? payload.c.map(([code, name, className, time, teacher]) => ({
        code,
        name,
        class: className,
        time,
        teacher,
      }))
    : [];
