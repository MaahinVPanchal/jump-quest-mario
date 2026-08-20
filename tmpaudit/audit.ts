import { LEVELS } from "../src/game/levels";
import { CHARACTERS } from "../src/game/data/characters";
import { WORLDS } from "../src/game/levels/worlds";
import { buildMovementProfile } from "../src/game/systems/movementProfile";
import { traverse } from "../src/game/levels/traverse";
const heroes = Object.values(CHARACTERS);
for (const l of LEVELS) {
  const w = WORLDS.find(w=>w.world===l.world);
  const bad: string[] = [];
  for (const h of heroes) {
    const p = buildMovementProfile(h as any, w?.physics);
    const r = traverse(l, p);
    if (!r.reachable) bad.push(`${h.name}: ${r.reason}`);
  }
  console.log(l.id.padEnd(5), l.name.padEnd(24), bad.length? "BLOCKED " + bad[0] + (bad.length>1?` (+${bad.length-1})`:"") : "ok");
}
