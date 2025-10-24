import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import "@fontsource/inter";
import { Background3D } from "./components/Background3D";
import { GameGrid } from "./components/GameGrid";
import { GameLoop } from "./components/GameLoop";
import { GameUI } from "./components/GameUI";
import { SoundManager } from "./components/SoundManager";

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: '#b8d4e8'
    }}>
      <Canvas
        shadows
        camera={{
          position: [0, 4, 12],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <Background3D />
          <GameGrid />
          <GameLoop />
        </Suspense>
      </Canvas>
      
      <GameUI />
      <SoundManager />
    </div>
  );
}

export default App;
