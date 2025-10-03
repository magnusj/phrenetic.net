import { Canvas } from "@react-three/fiber";
import { AmigaBall, AmigaBallOverlay } from "./AmigaBall";
import type { AudioData } from "../../types/audio";

interface TitleSceneProps {
  audioData: AudioData | null;
  onStartDemo?: () => void;
}

export const TitleScene = ({ audioData, onStartDemo }: TitleSceneProps) => {
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: false, alpha: true }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <color attach="background" args={["#000000"]} />
        <AmigaBall audioData={audioData} />
      </Canvas>
      <AmigaBallOverlay onStartDemo={onStartDemo} />
    </>
  );
};
