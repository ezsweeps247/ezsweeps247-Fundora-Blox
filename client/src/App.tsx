import "@fontsource/roboto";
import { GameCanvas } from "./components/GameCanvas";
import { GameUI } from "./components/GameUI";
import { SoundManager } from "./components/SoundManager";
import { useEffect, useState } from "react";

export interface MobileContext {
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
}

function App() {
  const [scale, setScale] = useState(1);
  const [mobileContext, setMobileContext] = useState<MobileContext>({
    isMobile: false,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });

  useEffect(() => {
    const calculateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Always use responsive layout that adapts to any screen size
      setMobileContext({
        isMobile: true, // Use responsive layout for all screen sizes
        screenWidth: vw,
        screenHeight: vh,
      });
      
      setScale(1); // Responsive layout handles its own scaling
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

  // Responsive layout - adapts to any screen size
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #3a3a3f 0%, #2d2d32 50%, #1f1f24 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <GameCanvas isMobile={true} />
      <GameUI isMobile={true} />
      <SoundManager />
    </div>
  );
}

export default App;
