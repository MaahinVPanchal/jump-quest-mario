import { createFileRoute } from "@tanstack/react-router";
import GameShell from "@/components/game/GameShell";

const title = "Riko & the Emberleaf Meadow — Original 2D Platformer";
const description =
  "Play Riko & the Emberleaf Meadow, an original browser platformer: precision jumping, hidden blocks, power-ups, secret tunnels and three Golden Relics to find.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <GameShell />;
}
