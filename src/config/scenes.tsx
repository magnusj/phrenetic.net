import { Canvas } from "@react-three/fiber";
import { TitleScene } from "../components/effects/TitleScene";
import { DYCPScroller } from "../components/effects/DYCPScroller";
import { PlasmaEffect } from "../components/effects/PlasmaEffect";
import { CopperBars } from "../components/effects/CopperBars";
import { WireframeCube } from "../components/effects/WireframeCube";
import { MandelbrotZoom } from "../components/effects/MandelbrotZoom";
import { Starfield } from "../components/effects/Starfield";
import { TunnelEffect } from "../components/effects/TunnelEffect";
import { Rotozoomer } from "../components/effects/Rotozoomer";
import { DotBalls } from "../components/effects/DotBalls";
import { Metaballs } from "../components/effects/Metaballs";
import { FireEffect } from "../components/effects/FireEffect";
import { Shadebobs } from "../components/effects/Shadebobs";
import { VoxelLandscape } from "../components/effects/VoxelLandscape";
import { VectorBalls } from "../components/effects/VectorBalls";
import { Twister } from "../components/effects/Twister";
import { BumpMapping } from "../components/effects/BumpMapping";
import { GlenzVectors } from "../components/effects/GlenzVectors";
import { RasterBars } from "../components/effects/RasterBars";
import { PhongSphere } from "../components/effects/PhongSphere";
import { CheckerboardFloor } from "../components/effects/CheckerboardFloor";
import { MoirePatternsScene } from "../components/scenes/MoirePatternsScene";
import { SineScroll } from "../components/effects/SineScroll";
import { SceneInfo } from "../components/SceneInfo";
import type { Scene } from "../components/SceneManager";
import type { AudioAnalysisData } from "../types/audio";

export const createScenes = (audioData: AudioAnalysisData | null, moireAudioDataRef: React.RefObject<AudioAnalysisData | null> = { current: null }): Scene[] => [
  // Title Screen with bouncing Amiga ball
  {
    id: "title",
    duration: 9999, // Effectively infinite - only advances when button is clicked
    component: <TitleScene audioData={audioData} />,
  },
  {
    id: "intro",
    duration: 13,
    component: (
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
          <WireframeCube audioData={audioData} />
        </Canvas>
        <DYCPScroller
          text="    HEY! FEELING NOSTALGIC AND DECIDED TO COOK UP AN ICONIC AMIGA STYLE DEMO    *    "
          audioData={audioData}
          speed={6}
          amplitude={120}
        />
        <SceneInfo
          name="WIREFRAME CUBE"
          stats={[
            { label: "VERTICES", value: 8 },
            { label: "EDGES", value: 12 },
          ]}
        />
      </>
    ),
  },
  {
    id: "metaballs",
    duration: 15,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <Metaballs audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="METABALLS"
          stats={[
            { label: "BLOBS", value: 6 },
            { label: "THRESHOLD", value: "0.5" },
          ]}
        />
      </>
    ),
  },
  {
    id: "starfield",
    duration: 15,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <Starfield audioData={audioData} />
        </Canvas>
        <DYCPScroller
          text="    ANYONE ELSE MISS THE GOOD OLD TIMES?    *    THE ERA OF COMMODORE 64 AND THE AMIGA 500    *    "
          audioData={audioData}
          speed={6}
          amplitude={120}
        />
        <SceneInfo
          name="STARFIELD"
          stats={[
            { label: "STARS", value: 1000 },
            { label: "LAYERS", value: 3 },
          ]}
        />
      </>
    ),
  },
  {
    id: "mandelbrot",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <MandelbrotZoom audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="MANDELBROT ZOOM"
          stats={[
            { label: "MAX ITER", value: 100 },
            { label: "ZOOM SPD", value: "0.5x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "plasma",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <PlasmaEffect audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="PLASMA EFFECT"
          stats={[
            { label: "WAVES", value: 4 },
            { label: "COLORS", value: 3 },
          ]}
        />
      </>
    ),
  },
  {
    id: "fire",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <FireEffect audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="FIRE EFFECT"
          stats={[
            { label: "OCTAVES", value: 5 },
            { label: "SPEED", value: "0.3x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "shadebobs",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <Shadebobs audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="SHADEBOBS"
          stats={[
            { label: "BOBS", value: 8 },
            { label: "GLOW", value: "1.5x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "tunnel",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <TunnelEffect audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="TUNNEL EFFECT"
          stats={[
            { label: "SPEED", value: "0.3x" },
            { label: "ROTATION", value: "0.2x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "voxel",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <VoxelLandscape audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="VOXEL LANDSCAPE"
          stats={[
            { label: "OCTAVES", value: 4 },
            { label: "SPEED", value: "0.5x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "copper",
    duration: 13,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <CopperBars audioData={audioData} />
        </Canvas>
        <DYCPScroller
          text="    COMMODRE MADE ME WHO I AM TODAY <3!    *    GREETZ TO ALL OLD FELLOW SCENERS OUT THERE...    *   "
          audioData={audioData}
          speed={6}
          amplitude={120}
        />
        <SceneInfo
          name="COPPER BARS"
          stats={[
            { label: "BARS", value: 32 },
            { label: "COLORS", value: 360 },
          ]}
        />
      </>
    ),
  },
  {
    id: "rotozoomer",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <Rotozoomer audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="ROTOZOOMER"
          stats={[
            { label: "ZOOM", value: "1.0-1.5x" },
            { label: "ROTATION", value: "0.3x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "dotballs",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <DotBalls audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="DOT BALLS"
          stats={[
            { label: "PARTICLES", value: 500 },
            { label: "RADIUS", value: "2.0" },
          ]}
        />
      </>
    ),
  },
  {
    id: "vectorballs",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <VectorBalls audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="VECTOR BALLS"
          stats={[
            { label: "POINTS", value: 40 },
            { label: "ROTATION", value: "0.3x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "twister",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <Twister audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="TWISTER"
          stats={[
            { label: "BARS", value: 20 },
            { label: "TWIST SPD", value: "1.5x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "bumpmapping",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <BumpMapping audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="BUMP MAPPING"
          stats={[
            { label: "OCTAVES", value: 5 },
            { label: "LIGHT SPD", value: "0.5x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "glenzvectors",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <GlenzVectors audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="GLENZ VECTORS"
          stats={[
            { label: "SHAPES", value: 3 },
            { label: "FACES", value: 36 },
          ]}
        />
      </>
    ),
  },
  {
    id: "rasterbars",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <RasterBars audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="RASTER BARS"
          stats={[
            { label: "BARS", value: 12 },
            { label: "SCROLL SPD", value: "0.15x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "phongsphere",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <PhongSphere audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="PHONG SPHERE"
          stats={[
            { label: "LIGHTING", value: "3-WAY" },
            { label: "SHINE", value: 64 },
          ]}
        />
      </>
    ),
  },
  {
    id: "checkerboard",
    duration: 20,
    component: (
      <>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ antialias: false, alpha: false }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#000000"]} />
          <CheckerboardFloor audioData={audioData} />
        </Canvas>
        <SceneInfo
          name="CHECKERBOARD"
          stats={[
            { label: "TILES", value: "∞" },
            { label: "SPEED", value: "0.5x" },
          ]}
        />
      </>
    ),
  },
  {
    id: "sinescroll",
    duration: 50,
    component: (
      <>
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            background: "#000",
          }}
        />
        <SineScroll
          text={[
            "A PRODUCTION BY PHRENETIC.NET",
            "",
            "CODE, GFX & MUSIC",
            "SUPREMO",
            "",
            "SPECIAL THANKS TO",
            "CHOCK OF MANIAX",
            "1XN",
            "",
            "GREETZ TO",
            "ALL THE DEMOSCENE LEGENDS",
            "FAIRLIGHT * KEFRENS * MELON DEZIGN",
            "SILENTS * RAZOR 1911 * CRUSADERS",
            "BOOZE DESIGN * CENSOR DESIGN * MANIAX",
            "",
            "THIS IS WHERE THE MAGIC HAPPENED",
            "COMMODORE 64 & AMIGA 500",
            "1985 - 1995",
            "",
            "KEEP THE SCENE ALIVE!",
            "",
            "VISIT PHRENETIC.NET",
            "FOR MORE RETRO GOODNESS",
            "",
            "SEE YOU AT THE NEXT DEMOPARTY!",
          ]}
          audioData={audioData}
          speed={50}
          amplitude={120}
        />
      </>
    ),
  },
  {
    id: "moirepatterns",
    duration: 60,
    component: <MoirePatternsScene audioDataRef={moireAudioDataRef} />,
  },
];
