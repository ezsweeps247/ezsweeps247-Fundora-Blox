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
      
      // Base game dimensions - much smaller base to allow larger scaling
      const baseWidth = 400;
      const baseHeight = 300;
      
      // Calculate scale to fit both width and height
      const scaleX = width / baseWidth;
      const scaleY = height / baseHeight;
      
      // Use the smaller scale - allow much larger upscaling
      const newScale = Math.min(scaleX, scaleY, 5.0); // Allow upscaling up to 5x
      
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
        background: '#1a2332',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '400px',
          height: '300px',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  );
}
