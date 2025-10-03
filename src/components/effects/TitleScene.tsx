import { Canvas } from "@react-three/fiber";
import { AmigaBall, AmigaBallOverlay } from "./AmigaBall";
import type { AudioAnalysisData } from "../../types/audio";

interface TitleSceneProps {
  audioData: AudioAnalysisData | null;
  onStartDemo?: () => void;
}

export const TitleScene = ({ audioData: _audioData, onStartDemo }: TitleSceneProps) => {
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
        <AmigaBall audioData={_audioData} />
      </Canvas>
      <AmigaBallOverlay onStartDemo={onStartDemo} />
    </>
  );
};
