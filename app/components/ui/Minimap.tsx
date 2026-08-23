"use client";

import { useStore } from "@/app/lib/store";
import { ISLANDS } from "@/app/lib/types";
import { X } from "lucide-react";

export default function Minimap() {
  const { collectibles, toggleMinimap } = useStore();

  const mapSize = 160;
  const worldRange = 80;
  const center = { x: 0, z: -20 };

  const toMap = (wx: number, wz: number) => ({
    x: ((wx - center.x) / worldRange) * mapSize + mapSize / 2,
    y: ((wz - center.z) / worldRange) * mapSize + mapSize / 2,
  });

  return (
    <div className="absolute bottom-20 right-6 glass rounded-2xl p-4 pointer-events-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[0.3em] text-white/30">MAP</span>
        <button onClick={toggleMinimap} className="text-white/30 hover:text-white/60">
          <X size={12} />
        </button>
      </div>
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ width: mapSize, height: mapSize, background: "rgba(10,14,39,0.8)" }}
      >
        {ISLANDS.map((island) => {
          const pos = toMap(island.position[0], island.position[2]);
          return (
            <div
              key={island.id}
              className="absolute rounded-full"
              style={{
                left: pos.x - 4,
                top: pos.y - 4,
                width: 8,
                height: 8,
                backgroundColor: island.color,
                boxShadow: `0 0 6px ${island.color}60`,
              }}
            />
          );
        })}
        {collectibles
          .filter((c) => !c.collected)
          .map((c) => {
            const pos = toMap(c.position[0], c.position[2]);
            return (
              <div
                key={c.id}
                className="absolute rounded-full"
                style={{
                  left: pos.x - 1.5,
                  top: pos.y - 1.5,
                  width: 3,
                  height: 3,
                  backgroundColor: "#fbbf24",
                  opacity: 0.5,
                }}
              />
            );
          })}
        <div
          className="absolute w-2 h-2 rounded-full bg-white"
          style={{
            left: mapSize / 2 - 4,
            top: mapSize / 2 - 4,
            boxShadow: "0 0 8px rgba(255,255,255,0.5)",
          }}
        />
      </div>
    </div>
  );
}
