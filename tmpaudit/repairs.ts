import { buildCampaign } from "../src/game/levels/campaign";
import { applyBrickDifficulty } from "../src/game/levels/brickDifficulty";
import { polishLevels } from "../src/game/levels/polish";
import { ensureRoute } from "../src/game/levels/route";
const raw = polishLevels(buildCampaign().map(applyBrickDifficulty));
for (const l of raw) {
  const r = ensureRoute(l);
  console.log(l.id, "ledges added:", r.repaired, r.reachable ? "" : "STILL BLOCKED");
}
