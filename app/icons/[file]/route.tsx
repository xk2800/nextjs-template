import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// PWA icons for app/manifest.ts, drawn from app/favicon.ico at build time,
// so changing the favicon (and rebuilding) updates them.
const SIZES = [192, 512];

export const dynamicParams = false;

export function generateStaticParams() {
  return SIZES.map((size) => ({ file: `icon-${size}.png` }));
}

// The largest PNG-encoded image inside an .ico. Older BMP-only icons aren't
// supported; re-export the favicon with a PNG layer (most tools do by default).
function largestPng(ico: Buffer) {
  let best: { size: number; data: Buffer } | undefined;
  for (let i = 0; i < ico.readUInt16LE(4); i++) {
    const entry = 6 + i * 16;
    const size = ico[entry] || 256;
    const data = ico.subarray(
      ico.readUInt32LE(entry + 12),
      ico.readUInt32LE(entry + 12) + ico.readUInt32LE(entry + 8)
    );
    const isPng = data.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (isPng && size > (best?.size ?? 0)) best = { size, data };
  }
  if (!best) throw new Error("app/favicon.ico has no PNG image to build PWA icons from");
  return best.data;
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const size = Number((await params).file.match(/\d+/)![0]);
  const png = largestPng(await readFile(path.join(process.cwd(), "app/favicon.ico")));
  const src = `data:image/png;base64,${png.toString("base64")}`;

  // eslint-disable-next-line @next/next/no-img-element
  return new ImageResponse(<img src={src} width={size} height={size} alt="" />, {
    width: size,
    height: size,
  });
}
