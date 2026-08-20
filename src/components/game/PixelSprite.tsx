import { useEffect, useRef } from "react";

/** Shared NES-ish palette for the React-side roster art. */
const PALETTE: Record<string, string> = {
  R: "#d82800",
  r: "#a01000",
  H: "#883000",
  S: "#fca044",
  K: "#000000",
  W: "#ffffff",
  Y: "#fcd83c",
  y: "#c88000",
  B: "#d84000",
  b: "#a02800",
  G: "#00a800",
  g: "#007800",
  O: "#f8b800",
  P: "#e03c28",
  p: "#a01810",
  C: "#5c94fc",
  M: "#f8b8f8",
  V: "#7c3cfc",
  v: "#4c18b0",
  c: "#0058f8",
};

export type SpriteId =
  | "riko"
  | "rikoBig"
  | "rikoFire"
  | "mira"
  | "princess"
  | "banana"
  | "catBell"
  | "walker"
  | "shell"
  | "flyer"
  | "piranha"
  | "spiker"
  | "coin"
  | "star"
  | "growthOrb"
  | "fireCrystal"
  | "oneUp"
  | "relic";

const HERO_HEAD = [
  "....RRRRR.......",
  "...RRRRRRRRRR...",
  "...HHHSSKS......",
  "..HSHSSSKSSS....",
  "..HSHHSSSKSSS...",
  "..HHSSSSSKKKK...",
  "....SSSSSSSS....",
  "...HHRRHRRH.....",
];

const HERO_BODY = [
  "..HHHRRHRRHHH...",
  ".HHHHRRRRRRHHHH.",
  "SSHHRYRRRRYRHHSS",
  "SSHRRRRRRRRRRHSS",
  "..RRRRRRRRRRRR..",
  "..RRRR....RRRR..",
  "..HHH......HHH..",
  ".HHHH......HHHH.",
];

/** Rig heads mirror the in-game silhouettes so UI art matches gameplay art. */
export const RIG_HEADS: Record<string, readonly string[]> = {
  runner: HERO_HEAD,
  tech: [
    ".......Y........",
    "....RRRYRRR.....",
    "...RRRRRRRRR....",
    "..RKKWWKKWWKKR..",
    "..RKKWWKKWWKKR..",
    "...RSSSSSSSSR...",
    "....SSSKKSSS....",
    "....HHHRRHHH....",
  ],
  rogue: [
    "....RRRRRR......",
    "...RRRRRRRRR....",
    "..RRRRRRRRRRR...",
    "..RRSSSSSSSRR...",
    "..RRSKSSSKSRR...",
    "...RKKKKKKKR....",
    "....KKKKKKK.....",
    "....HHRRRHH.....",
  ],
  armored: [
    "...RRRRRRRRR....",
    "..RRRRYRRRRRR...",
    ".RRRRRYRRRRRRR..",
    ".RRKKKKKKKKKRR..",
    ".RRKWWKKKWWKRR..",
    ".RRRRRRRRRRRRR..",
    "..RRRRRRRRRRR...",
    "...HHHRRRHHH....",
  ],
  ninja: [
    "................",
    "....RRRRRRR.....",
    "..YRRRRRRRRRYY..",
    "..YYRSSSSSRR.Y..",
    "....RSKSSKSR....",
    "....RRRRRRRR....",
    ".....RRRRRR.....",
    "....HHHRRHHH....",
  ],
  flame: [
    "....Y..Y..Y.....",
    "...YY.YYY.YY....",
    "...RYRRRRRYR....",
    "..RRRSSSSSRR....",
    "..RRSKSSSKSR....",
    "...RSSSSSSSR....",
    "....SSSSSSS.....",
    "....HHHRRHHH....",
  ],
  explorer: [
    "...HHHHHHHHH....",
    "..HRRRRRRRRRH...",
    "..HRSSSSSSSRH...",
    "..HRSKSSSKSRH...",
    "..HRSSSSSSSRH...",
    "..HHRSSSSSRHH...",
    "...HHHHHHHHH....",
    "....HHRRRHH.....",
  ],
  winged: [
    "..W..RRRRR..W...",
    ".WW.RRRRRRR.WW..",
    "WWW.RSSSSSR.WWW.",
    ".WW.RSKSKSR.WW..",
    "..W.RSSSSSR.W...",
    "....RSSSSSR.....",
    ".....SSSSS......",
    "....HHRRRHH.....",
  ],
  heavy: [
    "..Y..........Y..",
    "..YY.RRRRR..YY..",
    "..RYRRRRRRRRYR..",
    ".RRRRKKKKKRRRR..",
    ".RRRKWWKWWKRRR..",
    ".RRRRRRRRRRRRR..",
    "..RRRRRRRRRRR...",
    "..HHHHRRRHHHH...",
  ],
};

export const HERO_TORSO = HERO_BODY;

const recolor = (rows: readonly string[], from: string, to: string): string[] =>
  rows.map((r) => r.split(from).join(to));

const SPRITES: Record<SpriteId, readonly string[]> = {
  riko: [...HERO_HEAD, ...HERO_BODY],
  banana: [
    "................",
    "..........yy....",
    ".........yYYy...",
    "........yYYYy...",
    ".......yYYYy....",
    "......yYYYy.....",
    ".....yYYYy......",
    "....yYYYy.......",
    "...yYYYy........",
    "..yYYYy.........",
    "..yYYy..........",
    "..yYYy..........",
    "...yYy..........",
    "....yy..........",
    "................",
    "................",
  ],
  catBell: [
    "................",
    "......KKKK......",
    ".....KYYYYK.....",
    "....KYYYYYYK....",
    "...KYYWWYYYYK...",
    "..KYYWWYYYYYYK..",
    "..KYYYYYYYYYYK..",
    ".KYYYYYYYYYYYYK.",
    ".KYYYYYYYYYYYYK.",
    ".KKKKKKKKKKKKKK.",
    "....KYYYYYYK....",
    "....KYKKKKYK....",
    ".....KKYYKK.....",
    "......KKKK......",
    "................",
    "................",
  ],
  princess: [
    "...Y.Y.Y.Y.Y....",
    "...YYYYYYYY.....",
    "..HHHHHHHHHH....",
    "..HHSSSSSSSH....",
    "..HSSKSSKSSS....",
    "..HSSSSSSSSS....",
    "...SSSKKKSS.....",
    "...HHRRRRHH.....",
    "..RRRRRRRRRR....",
    ".RRRRYRRYRRRR...",
    "SRRRRRRRRRRRRS..",
    "SRRRRRRRRRRRRS..",
    "..RRRRRRRRRRR...",
    ".RRRRRRRRRRRRR..",
    ".HHH......HHH...",
    "HHHH......HHHH..",
  ],
  rikoBig: [...HERO_HEAD, ...HERO_BODY],
  rikoFire: [...recolor(HERO_HEAD, "R", "W"), ...recolor(HERO_BODY, "R", "W")],
  mira: [
    ...recolor(recolor(HERO_HEAD, "R", "C"), "H", "c"),
    ...recolor(recolor(HERO_BODY, "R", "C"), "H", "c"),
  ],
  spiker: [
    "....K..K..K..K..",
    "...KKK.KK.KKK...",
    "..KKVVVVVVVVKK..",
    ".KVVVVVVVVVVVVK.",
    "KVVWWVVVVVVWWVVK",
    "KVVWKVVVVVVKWVVK",
    "KVVVVVVVVVVVVVVK",
    "KVvvvvvvvvvvvvVK",
    "KVvvvvvvvvvvvvVK",
    ".KVvvvvvvvvvvVK.",
    "..KKvvvvvvvvKK..",
    "...KKK.KK.KKK...",
    "....K..K..K..K..",
    "...OO......OO...",
    "...OO......OO...",
    "................",
  ],
  walker: [
    "................",
    "................",
    ".....BBBBBB.....",
    "....BBBBBBBB....",
    "...BBBBBBBBBB...",
    "..BBWWBBBBWWBB..",
    "..BBWKBBBBKWBB..",
    ".BBBWKBBBBKWBBB.",
    ".BBBBBBBBBBBBBB.",
    "bbbbbbbbbbbbbbbb",
    "bbbbbbbbbbbbbbbb",
    "bbbbWWWWWWWWbbbb",
    ".bbWWWWWWWWWWbb.",
    "..KKKK....KKKK..",
    ".KKKKKK..KKKKKK.",
    "................",
  ],
  shell: [
    "................",
    "......GGGG......",
    ".....GGGGGG.....",
    "....GGggggGG....",
    "...GGgGGGGgGG...",
    "..GGgGGGGGGgGG..",
    "..GGGGGGGGGGGG..",
    "..OGGGGGGGGGGO..",
    "..OOGGGGGGGGOO..",
    ".OOOOGGGGGGOOOO.",
    ".OOWKOOOOOOKWOO.",
    "..OOOOOOOOOOOO..",
    "...OOOOOOOOOO...",
    "....OO....OO....",
    "...WWW....WWW...",
    "................",
  ],
  flyer: [
    "................",
    "................",
    "...MM....MM.....",
    "..MMMM..MMMM....",
    ".MMMMMMMMMMMM...",
    "MMMMWKMMKWMMMM..",
    "MMMMWKMMKWMMMM..",
    ".MMMMMMMMMMMM...",
    "..MMMMMMMMMM....",
    "...MMMMMMMM.....",
    "....MMMMMM......",
    "..WW.MMMM.WW....",
    ".WWWW.MM.WWWW...",
    "................",
    "................",
    "................",
  ],
  piranha: [
    "................",
    "....PPPPPPPP....",
    "...PPPPPPPPPP...",
    "..PPWWPPPPWWPP..",
    "..PPWWPPPPWWPP..",
    "..PPPPPPPPPPPP..",
    "..WWWWWWWWWWWW..",
    "..pppppppppppp..",
    "..WWWWWWWWWWWW..",
    "...PPPPPPPPPP...",
    "....PPPPPPPP....",
    ".....GGGGGG.....",
    ".....GGGGGG.....",
    "....GGgggggG....",
    "....GGGGGGGG....",
    "................",
  ],
  coin: [
    "................",
    ".....YYYYYY.....",
    "....YYYYYYYY....",
    "...YYYyyyyYYY...",
    "...YYy....yYY...",
    "...YYy.YY.yYY...",
    "...YYy.YY.yYY...",
    "...YYy.YY.yYY...",
    "...YYy.YY.yYY...",
    "...YYy.YY.yYY...",
    "...YYy....yYY...",
    "...YYYyyyyYYY...",
    "....YYYYYYYY....",
    ".....YYYYYY.....",
    "................",
    "................",
  ],
  star: [
    ".......YY.......",
    "......YYYY......",
    "......YYYY......",
    ".....YYYYYY.....",
    "YYYYYYYYYYYYYYYY",
    ".YYYYYYYYYYYYYY.",
    "..YYYYYYYYYYYY..",
    "...YYYYYYYYYY...",
    "...YYYKYYKYYY...",
    "...YYYYYYYYYY...",
    "..YYYYY..YYYYY..",
    "..YYYY....YYYY..",
    ".YYY........YYY.",
    ".YY..........YY.",
    "................",
    "................",
  ],
  growthOrb: [
    "................",
    "....RRRRRRRR....",
    "..RRWWRRRRWWRR..",
    ".RRWWWWRRWWWWRR.",
    ".RWWWWWRRWWWWWR.",
    "RRRWWWRRRRWWWRRR",
    "RRRRRRRRRRRRRRRR",
    ".RRRRRRRRRRRRRR.",
    "..SSSSSSSSSSSS..",
    "..SSKKSSSSKKSS..",
    "..SSKKSSSSKKSS..",
    "..SSSSSSSSSSSS..",
    "...SSSSSSSSSS...",
    "....SSSSSSSS....",
    "................",
    "................",
  ],
  fireCrystal: [
    "................",
    "....WWWWWWWW....",
    "..WWRRRRRRRRWW..",
    ".WWRRRRRRRRRRWW.",
    ".WRRRWWWWWWRRRW.",
    "WWRRWWWWWWWWRRWW",
    "WWRRWWWWWWWWRRWW",
    ".WRRRWWWWWWRRRW.",
    ".WWRRRRRRRRRRWW.",
    "..WWRRRRRRRRWW..",
    "...WWWWWWWWWW...",
    "....WWWWWWWW....",
    "................",
    "................",
    "................",
    "................",
  ],
  oneUp: [
    "................",
    "....GGGGGGGG....",
    "..GGWWGGGGWWGG..",
    ".GGWWWWGGWWWWGG.",
    ".GWWWWWGGWWWWWG.",
    "GGGWWWGGGGWWWGGG",
    "GGGGGGGGGGGGGGGG",
    ".GGGGGGGGGGGGGG.",
    "..SSSSSSSSSSSS..",
    "..SSKKSSSSKKSS..",
    "..SSKKSSSSKKSS..",
    "..SSSSSSSSSSSS..",
    "...SSSSSSSSSS...",
    "....SSSSSSSS....",
    "................",
    "................",
  ],
  relic: [
    "................",
    ".......YY.......",
    "......YYYY......",
    ".....YYYYYY.....",
    "....YYYYYYYY....",
    "...YYYYWWYYYY...",
    "..YYYYWWWWYYYY..",
    "..YYYYWWWWYYYY..",
    "...YYYYWWYYYY...",
    "....YYYYYYYY....",
    ".....YYYYYY.....",
    "......YYYY......",
    ".......YY.......",
    "................",
    "................",
    "................",
  ],
};

/** Draws one of the game's pixel grids into a crisp canvas. */
export default function PixelSprite({
  id,
  px = 4,
  className,
  tint,
  rig,
}: {
  id: SpriteId;
  px?: number;
  className?: string;
  /** Palette overrides (same keys as the shared palette), used to skin heroes. */
  tint?: Record<string, string> | undefined;
  /** Hero silhouette rig; swaps the head art for hero sprites. */
  rig?: string | undefined;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rigHead = rig ? RIG_HEADS[rig] : undefined;
  const rows =
    rigHead && (id === "riko" || id === "rikoBig" || id === "rikoFire")
      ? [...rigHead, ...HERO_BODY]
      : SPRITES[id];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const palette = tint ? { ...PALETTE, ...tint } : PALETTE;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const fill = palette[row[x] as string];
        if (!fill) continue;
        ctx.fillStyle = fill;
        ctx.fillRect(x * px, y * px, px, px);
      }
    });
  }, [rows, px, tint]);

  const w = (rows[0]?.length ?? 16) * px;
  const h = rows.length * px;
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className={className}
      style={{ imageRendering: "pixelated", width: w, height: h }}
      aria-hidden
    />
  );
}
