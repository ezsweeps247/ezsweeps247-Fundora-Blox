import "@fontsource/roboto";
import { GameCanvas } from "./components/GameCanvas";
import { GameUI } from "./components/GameUI";
import { SoundManager } from "./components/SoundManager";

function App() {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      background: '#f8f8f8'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        height: '100%',
        position: 'relative',
        background: '#f8f8f8',
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.15)'
      }}>
        <GameCanvas />
        <GameUI />
        <SoundManager />
      </div>
    </div>
  );
}

export default App;
