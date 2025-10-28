import { ReactNode, useEffect, useState } from 'react';

interface ResponsiveGameWrapperProps {
  children: ReactNode;
}

export function ResponsiveGameWrapper({ children }: ResponsiveGameWrapperProps) {
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const calculateScale = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Base game dimensions (approximate total area needed)
      const baseWidth = 1200; // Enough space for game + UI elements on sides
      const baseHeight = 900; // Enough vertical space
      
      // Calculate scale to fit both width and height
      const scaleX = width / baseWidth;
      const scaleY = height / baseHeight;
      
      // Use the smaller scale to ensure everything fits
      const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 to avoid upscaling on large screens
      
      setScale(newScale);
      setDimensions({ width, height });
      
      console.log(`Screen: ${width}x${height}, Scale: ${newScale.toFixed(2)}`);
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
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#f8f8f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '1200px',
          height: '900px',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  );
}
