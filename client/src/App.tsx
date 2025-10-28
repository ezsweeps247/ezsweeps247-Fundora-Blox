import "@fontsource/roboto";
import { GameCanvas } from "./components/GameCanvas";
import { GameUI } from "./components/GameUI";
import { SoundManager } from "./components/SoundManager";
import { ResponsiveGameWrapper } from "./components/ResponsiveGameWrapper";

function App() {
  return (
    <ResponsiveGameWrapper>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative'
      }}>
        <GameCanvas />
        <GameUI />
        <SoundManager />
      </div>
    </ResponsiveGameWrapper>
  );
}

export default App;
