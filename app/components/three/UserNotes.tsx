"use client";

import { useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useAppStore, type WorldNote } from "@/app/lib/store";

function Note3D({ note }: { note: WorldNote }) {
  const ref = useRef<THREE.Mesh>(null);
  const removeNote = useAppStore((s) => s.removeNote);
  const editingNoteId = useAppStore((s) => s.editingNoteId);
  const setEditingNoteId = useAppStore((s) => s.setEditingNoteId);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y =
        note.position[1] + Math.sin(state.clock.elapsedTime * 0.8 + note.position[0]) * 0.08;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + note.position[2]) * 0.05;
    }
  });

  const isEditing = editingNoteId === note.id;

  return (
    <group position={note.position}>
      <mesh
        ref={ref}
        rotation={note.rotation}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing) setEditingNoteId(note.id);
        }}
      >
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial
          color={note.color}
          side={THREE.DoubleSide}
          roughness={0.8}
          emissive={note.color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </mesh>

      {isEditing ? (
        <Html center distanceFactor={8} style={{ pointerEvents: "auto" }}>
          <div
            className="rounded-lg p-2 shadow-xl"
            style={{ backgroundColor: note.color, minWidth: 140 }}
          >
            <input
              autoFocus
              defaultValue={note.text}
              className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none placeholder:text-gray-500"
              placeholder="Type a note..."
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val) {
                  useAppStore.getState().addNote({ ...note, text: val });
                  useAppStore.getState().removeNote(note.id);
                }
                setEditingNoteId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingNoteId(null);
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeNote(note.id);
                setEditingNoteId(null);
              }}
              className="mt-1 text-[9px] text-red-600/60 hover:text-red-600"
            >
              delete
            </button>
          </div>
        </Html>
      ) : (
        <Html center distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div
            className="max-w-[120px] rounded px-2 py-1 text-center text-[10px] font-bold text-gray-800 leading-tight"
            style={{ backgroundColor: `${note.color}dd` }}
          >
            {note.text}
          </div>
        </Html>
      )}

      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={note.color} emissive={note.color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

export default function UserNotes() {
  const notes = useAppStore((s) => s.notes);

  return (
    <>
      {notes.map((note) => (
        <Note3D key={note.id} note={note} />
      ))}
    </>
  );
}
