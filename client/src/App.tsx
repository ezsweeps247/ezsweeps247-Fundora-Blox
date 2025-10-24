import "@fontsource/roboto";
import { GameCanvas } from "./components/GameCanvas";
import { GameUI } from "./components/GameUI";
import { SoundManager } from "./components/SoundManager";

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      background: 'linear-gradient(to bottom, #b8d4e8 0%, #d4e8f8 100%)'
    }}>
      <GameCanvas />
      <GameUI />
      <SoundManager />
    </div>
  );
}

export default App;
