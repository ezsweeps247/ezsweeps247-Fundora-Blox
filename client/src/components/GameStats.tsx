import React from 'react';
import { useGame } from '@/lib/stores/useGame';
import { GameFeed } from './GameFeed';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function DisplayBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{
      background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.65) 0%, rgba(50, 55, 65, 0.70) 15%, rgba(60, 65, 75, 0.75) 35%, rgba(55, 60, 70, 0.75) 50%, rgba(60, 65, 75, 0.75) 65%, rgba(50, 55, 65, 0.70) 85%, rgba(40, 45, 55, 0.65) 100%)',
      backdropFilter: 'blur(12px)',
      border: '2px solid #333',
      borderRadius: '12px',
      padding: '6px 10px',
      minWidth: '208px',
      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 3px rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '900',
        color: '#fff',
        marginBottom: '3px',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#ff0000',
          backgroundColor: '#000',
          padding: '4px 8px',
          borderRadius: '6px',
          fontFamily: "'Digital-7 Mono', 'Digital-7', monospace",
          letterSpacing: '1px',
          flex: '1',
          textShadow: '0 0 1px #ff0000'
        }}>
          {value}
        </div>
        {unit && (
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff',
            fontFamily: "'Roboto', sans-serif",
            paddingRight: '3px',
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
          }}>
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

export function GameStats() {
  const credits = useGame(state => state.credits);
  const bonusPoints = useGame(state => state.bonusPoints);
  const stake = useGame(state => state.stake);
  
  const handleTouchButton = (callback: () => void) => {
    return {
      onClick: callback,
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        callback();
      }
    };
  };
  
  return (
    <div style={{
      position: 'absolute',
      left: 'calc(100% + 10px)',
      top: '-6px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'auto',
      background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.65) 0%, rgba(50, 55, 65, 0.70) 15%, rgba(60, 65, 75, 0.75) 35%, rgba(55, 60, 70, 0.75) 50%, rgba(60, 65, 75, 0.75) 65%, rgba(50, 55, 65, 0.70) 85%, rgba(40, 45, 55, 0.65) 100%)',
      backdropFilter: 'blur(12px)',
      border: '3px solid #333',
      borderRadius: '16px',
      padding: '14px',
      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 3px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3)',
      width: '240px'
    }}>
      <button
        {...handleTouchButton(() => {
          window.history.back();
        })}
        style={{
          padding: '6px 10px',
          fontSize: '11px',
          fontWeight: 'bold',
          fontFamily: "'Roboto', sans-serif",
          color: '#ffffff',
          background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.85) 0%, rgba(60, 65, 75, 0.90) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '6px',
          cursor: 'pointer',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
          letterSpacing: '0.8px',
          width: '100%'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        }}
      >
        BACK TO CASINO
      </button>
      <DisplayBox label="CREDITS" value={credits.toFixed(2)} unit="$" />
      <DisplayBox label="BONUS POINTS" value={formatNumber(bonusPoints)} unit="P" />
      <GameFeed />
      <DisplayBox 
        label="STAKE" 
        value={stake === 'FREE' ? 'FREE' : stake.toFixed(2)} 
        unit={stake === 'FREE' ? '' : '$'} 
      />
    </div>
  );
}
