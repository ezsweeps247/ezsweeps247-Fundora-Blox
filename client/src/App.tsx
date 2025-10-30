import "@fontsource/roboto";
import { GameCanvas } from "./components/GameCanvas";
import { GameUI } from "./components/GameUI";
import { SoundManager } from "./components/SoundManager";
import { useEffect, useState } from "react";

function App() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Game is designed for 2050px width and 1700px height at full scale
      // This ensures all UI elements (left prize indicators, right stats, etc.) fit properly
      const designWidth = 2050;
      const designHeight = 1700;
      
      // Calculate scale factors for width and height
      const scaleX = vw / designWidth;
      const scaleY = vh / designHeight;
      
      // Use the smaller scale to ensure everything fits without overflow
      // Cap at 1 to prevent scaling larger than design size
      const newScale = Math.min(scaleX, scaleY, 1);
      
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('orientationchange', calculateScale);
    };
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '2050px',
        height: '1700px',
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}>
        <GameCanvas />
        <GameUI />
        <SoundManager />
      </div>
    </div>
  );
}

export default App;
