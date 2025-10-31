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
      
      // Check if mobile device
      const isMobile = vw <= 768 || 'ontouchstart' in window || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Game is designed for 2050px width and 1700px height at full scale
      // For mobile, we need to be much more aggressive with scaling
      const designWidth = 2050;
      const designHeight = 1700;
      
      // Calculate scale factors for width and height
      let scaleX = vw / designWidth;
      let scaleY = vh / designHeight;
      
      if (isMobile) {
        // On mobile, calculate based on what would fill 85% of the screen
        // This makes the game MUCH larger on phones
        const targetWidth = vw * 0.85;
        const targetHeight = vh * 0.85;
        
        scaleX = targetWidth / designWidth;
        scaleY = targetHeight / designHeight;
        
        // Use the smaller scale to ensure everything fits
        const mobileScale = Math.min(scaleX, scaleY);
        
        // On mobile, we want a minimum scale of 0.35 (which results in ~700px width on most phones)
        // This makes the game much more visible
        const newScale = Math.max(0.35, mobileScale);
        setScale(newScale);
      } else {
        // Desktop behavior - cap at 1 to prevent scaling larger than design
        const newScale = Math.min(scaleX, scaleY, 1);
        setScale(newScale);
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    
    // Trigger recalculation after a short delay to handle initial load
    setTimeout(calculateScale, 100);
    
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
