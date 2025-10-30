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
      background: '#f5f5f0',
      backdropFilter: 'blur(12px)',
      border: '3px solid #666',
      borderRadius: '16px',
      padding: '10px 14px',
      minWidth: '300px',
      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), inset 0 -1px 3px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        fontSize: '17px',
        fontWeight: '900',
        color: '#333',
        marginBottom: '5px'
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          fontSize: '40px',
          fontWeight: 'bold',
          color: '#ff0000',
          backgroundColor: '#000',
          padding: '6px 12px',
          borderRadius: '8px',
          fontFamily: "'Digital-7 Mono', 'Digital-7', monospace",
          letterSpacing: '1.5px',
          flex: '1',
          textShadow: '0 0 2px #ff0000'
        }}>
          {value}
        </div>
        {unit && (
          <div style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#333',
            fontFamily: "'Roboto', sans-serif",
            paddingRight: '4px'
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
      left: 'calc(100% + 15px)',
      top: '-8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      pointerEvents: 'auto',
      background: '#f5f5f0',
      backdropFilter: 'blur(12px)',
      border: '4px solid #666',
      borderRadius: '20px',
      padding: '20px',
      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3), inset 0 -1px 3px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.3)',
      width: '340px'
    }}>
      <button
        {...handleTouchButton(() => {
          window.history.back();
        })}
        style={{
          padding: '10px 14px',
          fontSize: '15px',
          fontWeight: 'bold',
          fontFamily: "'Roboto', sans-serif",
          color: '#ffffff',
          background: 'linear-gradient(to bottom, #555 0%, #333 100%)',
          border: '2px solid #444',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
          letterSpacing: '1px',
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
