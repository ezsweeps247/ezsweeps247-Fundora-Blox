import "@fontsource/roboto";
import { GameCanvas } from "./components/GameCanvas";
import { GameUI } from "./components/GameUI";
import { SoundManager } from "./components/SoundManager";
import { useEffect, useRef } from "react";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Design dimensions
      const designWidth = 1400;
      const designHeight = 900; // Fixed design height for consistent aspect ratio
      
      // Calculate scale to fit viewport while maintaining aspect ratio
      const scaleX = viewportWidth / designWidth;
      const scaleY = viewportHeight / designHeight;
      const scale = Math.min(scaleX, scaleY);
      
      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'top center';
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
  
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
      <div 
        ref={containerRef}
        style={{
          width: '1400px',
          height: '900px',
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
