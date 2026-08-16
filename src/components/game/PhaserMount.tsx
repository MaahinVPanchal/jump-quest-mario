import { useEffect, useRef } from "react";
import type { SaveData } from "@/game/types";

interface Props {
  slot: number;
  save: SaveData;
  onExit: () => void;
  characterId: string;
  levelId: string;
}

/** Owns the Phaser canvas lifecycle. Phaser is imported only in the browser. */
export default function PhaserMount({ slot, save, onExit, characterId, levelId }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    let destroyed = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;

    void (async () => {
      const { createGame } = await import("@/game/createGame");
      if (destroyed || !hostRef.current) return;
      game = createGame({
        parent: hostRef.current,
        slot,
        save,
        characterId,
        levelId,
        onExit: () => exitRef.current(),
      });
    })();

    return () => {
      destroyed = true;
      game?.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, characterId, levelId]);

  return <div ref={hostRef} className="h-full w-full" aria-label="Game canvas" />;
}
