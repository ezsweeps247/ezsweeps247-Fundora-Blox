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
      
      // Detect mobile/embedded views - use responsive layout for better sizing
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isEmbedded = vw < 1024 || vh < 800; // Likely embedded in iframe or mobile
      const isMobile = isMobileDevice || isEmbedded;
      
      setMobileContext({
        isMobile,
        screenWidth: vw,
        screenHeight: vh,
      });
      
      if (isMobile) {
        // For mobile/embedded, use responsive layout that fits perfectly
        setScale(1);
      } else {
        // Desktop - full desktop layout
        const designWidth = 2050;
        const designHeight = 1700;
        
        let scaleX = vw / designWidth;
        let scaleY = vh / designHeight;
        
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

  // Mobile layout - completely different structure
  if (mobileContext.isMobile) {
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

  // Desktop layout - original structure
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
        <GameCanvas isMobile={false} />
        <GameUI isMobile={false} />
        <SoundManager />
      </div>
    </div>
  );
}

export default App;
