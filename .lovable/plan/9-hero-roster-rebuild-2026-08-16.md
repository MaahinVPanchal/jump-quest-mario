# 9-Hero Roster Rebuild

Cut the roster from 42 lookalike heroes to 9 unmistakable ones: 5 platform-classic archetypes (original names) and 4 fully original heroes. Every hero gets its own silhouette, palette, outfit, accessory, weapon and special — no recolors.

## The 9 heroes

| Hero | Archetype | Primary / Secondary / Accent | Build | Attack | Special |
|---|---|---|---|---|---|
| Marco | Balanced Hero | Red / Blue / White | Standard, cap + overalls + gloves | Fireball | FIRE BURST |
| Gino | High Jumper | Green / Dark blue / White | Taller, thinner, longer legs | Green energy bolt | SUPER JUMP |
| Rosella | Air Glide | Pink / White / Gold | Gown skirt, crown, long hair | Heart projectile | ROYAL GLIDE |
| Krogar | Heavy Power | Orange / Dark green / Yellow | ~30% larger, shell, horns, spikes | Fire-breath cone | FLAME GROUND POUND |
| Shroomy | Speed Runner | Blue / White / Red | Short body, huge spotted cap head | Rapid pellets | TURBO DASH |
| Riko | Green Knight | Emerald / Brown / Gold | Hood, tunic, sword, back shield | Sword slash arc | BLADE DASH |
| Vex | Space Warrior | Orange / Dark teal / Neon green | Helmet + visor, backpack, blaster | Plasma shot | ENERGY BURST |
| Bronn | Barbarian | Brown / Tan / Yellow | Widest torso, blonde mane, axe | Heavy swing | GROUND SMASH |
| Kage | Blue Ninja | Deep blue / Navy / Red | Narrow, masked, red scarf, kunai | Kunai throw | SHADOW DASH |

Stats (speed / jump / HP / air control) follow the values in the request. Krogar reads clearly largest, Shroomy clearly smallest, Kage clearly narrowest.

## Sprites

Each hero gets its own hand-authored pixel layout — not a shared rig with a tint swap. Per hero: `idle`, `idle2`, `walk_0..3`, `jump`, `fall`, `land`, `skid`, `attack_0..2`, `hurt`. Chunky 16-bit look, dark outline on every hero so nobody sinks into the sky or cave backgrounds, no muddy fills.

Each hero also gets its own projectile sprite: fireball, green bolt, heart, flame cone, pellet, slash arc, plasma bolt, axe arc, kunai.

## Character select

Compact card layout, one per hero, no paragraphs:

```text
+--------------------+
|   [big sprite]     |
|  MARCO             |
|  BALANCED HERO     |
|  SPD #######...    |
|  JMP ########..    |
|  HP  <3 <3         |
|  x FIREBALL        |
|  * FIRE BURST      |
+--------------------+
```

Selected card gets a thick highlight border and inverted header. Sprites render nearest-neighbour at integer scale.

## Rendering sanity check (dev only)

New scene toggled with F9 during play (and a link from the title screen). Six labelled panels on a fixed grid — Characters, Projectiles, Powerups, Environment, UI components, Effects — every asset drawn at once over a checkerboard so transparency, outlines and scaling problems are obvious. A side column lists the depth order (background → environment → pickups → characters → projectiles → particles → UI) with a swatch drawn at each depth so mis-layered art is visible. Toggling it never mutates gameplay state.

## Technical notes

- `src/game/data/characters.ts` is rewritten to 9 entries; `CharacterData` in `types.ts` grows `role`, `colors {primary,secondary,accent}`, `attackName`, `attackVisual`, `stats {speed,jump,health,airControl}`, `size`, `rig`. Adding hero #10 later = one entry + one sprite layout + one ability config.
- `src/game/systems/textures.ts`: replace the shared-rig/tint system with a per-hero layout registry keyed by rig id, generating the full frame set per hero.
- `src/game/entities/player/Player.ts` reads size/scale and animation set from `CharacterData` instead of hardcoded constants.
- `LevelScene` projectile spawn switches on `attackVisual`; specials (glide, ground pound, dash, double jump) are driven by the `specialAbility` field already routed through `MovementController`.
- `PixelSprite.tsx` shares the same layout registry so select-screen art matches in-game art exactly.
- `GameShell.tsx` roster grid rebuilt as compact cards; unlock gating drops since all 9 are selectable.
- Phaser already runs `pixelArt: true`, `antialias: false`, `roundPixels: true` with integer zoom — kept as is.
- Levels referencing removed hero ids fall back to the default hero; save files with an unknown `characterId` reset to Marco.
