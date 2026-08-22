"use client";

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#c4b5fd" />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.2}
        color="#fde68a"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[0, 8, 0]} intensity={2} color="#4ecdc4" distance={40} decay={2} />
      <pointLight position={[35, 3, -20]} intensity={1.5} color="#a78bfa" distance={35} decay={2} />
      <pointLight position={[-30, 0, -35]} intensity={1.5} color="#fbbf24" distance={35} decay={2} />
      <pointLight position={[15, -5, -50]} intensity={1.5} color="#f472b6" distance={35} decay={2} />
    </>
  );
}
