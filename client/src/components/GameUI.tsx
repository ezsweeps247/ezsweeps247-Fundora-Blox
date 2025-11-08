import { useState, useEffect } from 'react';
import { useGame } from '@/lib/stores/useGame';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

interface GameUIProps {
  isMobile?: boolean;
}

export function GameUI({ isMobile = false }: GameUIProps) {
  const phase = useGame(state => state.phase);
  const score = useGame(state => state.score);
  const bonusPoints = useGame(state => state.bonusPoints);
  const getPotentialPrize = useGame(state => state.getPotentialPrize);
  const potentialPrize = getPotentialPrize();
  const comboMultiplier = useGame(state => state.comboMultiplier);
  const comboStreak = useGame(state => state.comboStreak);
  const restart = useGame(state => state.restart);
  const [userInteracted, setUserInteracted] = useState(false);
  
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
    <div className="game-ui" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Roboto', sans-serif"
    }}>
      {/* Combo Indicator */}
      {comboMultiplier > 1 && phase === 'playing' && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '8px 20px',
          borderRadius: '20px',
          border: `2px solid ${comboMultiplier >= 3 ? '#ff3300' : '#ffaa00'}`,
          boxShadow: `0 0 20px ${comboMultiplier >= 3 ? 'rgba(255, 51, 0, 0.8)' : 'rgba(255, 170, 0, 0.6)'}`,
          zIndex: 50,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: comboMultiplier >= 3 ? '#ff3300' : '#ffaa00',
            textShadow: `0 0 10px ${comboMultiplier >= 3 ? 'rgba(255, 51, 0, 0.8)' : 'rgba(255, 170, 0, 0.6)'}`,
          }}>
            COMBO x{comboMultiplier.toFixed(1)}!
          </div>
          <div style={{
            fontSize: '12px',
            color: '#fff',
            marginTop: '2px',
          }}>
            {comboStreak} Perfect!
          </div>
        </div>
      )}
      
      {/* End Game Popup */}
      {phase === 'ended' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            background: 'linear-gradient(135deg, rgba(55,55,60,0.98) 0%, rgba(45,45,50,0.98) 100%)',
            padding: '32px 40px',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px) saturate(180%)',
            pointerEvents: 'auto',
            zIndex: 100,
            maxWidth: '90vw',
          }}>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '0.5px',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)'
            }}>
              Game Over
            </div>
            
            {/* Stats Container */}
            <div style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              padding: '16px 24px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  marginBottom: '8px',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  Score
                </div>
                <div style={{ 
                  fontSize: '36px', 
                  color: '#ff3333', 
                  fontWeight: 'bold',
                  fontFamily: "'Digital-7 Mono', monospace",
                  letterSpacing: '1px',
                  textShadow: '0 0 16px rgba(255, 51, 51, 0.5)'
                }}>
                  {score}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #ff3333, transparent)',
                  opacity: 0.4,
                }}></div>
              </div>
              
              <div style={{
                width: '1px',
                height: '60px',
                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)',
              }}></div>
              
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  marginBottom: '8px',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  Prize
                </div>
                <div style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold',
                  fontFamily: "'Digital-7 Mono', monospace",
                  letterSpacing: '1px',
                  color: potentialPrize.amount === 0 ? '#ffaa00' : (potentialPrize.type === 'cash' ? '#44ff44' : '#ffaa00'),
                  textShadow: potentialPrize.amount === 0 
                    ? '0 0 16px rgba(255, 170, 0, 0.5)' 
                    : (potentialPrize.type === 'cash' ? '0 0 16px rgba(68, 255, 68, 0.5)' : '0 0 16px rgba(255, 170, 0, 0.5)')
                }}>
                  {potentialPrize.amount === 0 
                    ? '0P'
                    : potentialPrize.type === 'cash' 
                      ? `$${potentialPrize.amount.toFixed(2)}`
                      : `${potentialPrize.amount.toLocaleString()}P`
                  }
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                  height: '2px',
                  background: potentialPrize.amount === 0 
                    ? 'linear-gradient(90deg, transparent, #ffaa00, transparent)'
                    : (potentialPrize.type === 'cash' 
                      ? 'linear-gradient(90deg, transparent, #44ff44, transparent)' 
                      : 'linear-gradient(90deg, transparent, #ffaa00, transparent)'),
                  opacity: 0.4,
                }}></div>
              </div>
            </div>
            
            {bonusPoints > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '16px 24px',
                background: 'rgba(255, 170, 0, 0.08)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 170, 0, 0.2)',
                width: '100%',
              }}>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '8px',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  Bonus Points Earned
                </div>
                <div style={{
                  fontSize: '32px',
                  color: '#ffaa00',
                  fontWeight: 'bold',
                  fontFamily: "'Digital-7 Mono', monospace",
                  letterSpacing: '1px',
                  textShadow: '0 0 16px rgba(255, 170, 0, 0.5)'
                }}>
                  +{formatNumber(bonusPoints)}P
                </div>
              </div>
            )}
            
            <button
              {...handleTouchButton(() => { setUserInteracted(true); restart(); })}
              style={{
                padding: '14px 56px',
                fontSize: '22px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 24px rgba(255, 0, 0, 0.3), 0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff5555 0%, #dd0000 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 0, 0, 0.4), 0 4px 12px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 0, 0, 0.3), 0 2px 8px rgba(0,0,0,0.2)';
              }}
            >
              Play Again
            </button>
          </div>
      )}
    </div>
  );
}
