import { useState, useEffect } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { StakeSelector } from './StakeSelector';
import { GameFeed } from './GameFeed';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/useIsMobile';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

function ComboIndicator({ comboMultiplier, comboStreak, phase, isMobile }: { comboMultiplier: number; comboStreak: number; phase: string; isMobile: boolean }) {
  const [animate, setAnimate] = useState(false);
  const [prevStreak, setPrevStreak] = useState(0);
  
  useEffect(() => {
    if (comboStreak > prevStreak && comboStreak > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevStreak(comboStreak);
  }, [comboStreak, prevStreak]);
  
  if (phase !== 'playing' || comboMultiplier <= 1) {
    return null;
  }
  
  const isHighCombo = comboMultiplier >= 3;
  const color = isHighCombo ? '#ff3300' : '#ffaa00';
  const glowColor = isHighCombo ? 'rgba(255, 51, 0, 0.8)' : 'rgba(255, 170, 0, 0.6)';
  
  return (
    <div style={{
      position: 'absolute',
      bottom: isMobile ? '50%' : 'calc(50% - 230px)',
      left: isMobile ? '50%' : 'calc(50% + 173px)',
      transform: isMobile ? 'translateX(-50%)' : 'none',
      pointerEvents: 'none',
      zIndex: 100,
      width: isMobile ? '150px' : '200px'
    }}>
      <div style={{
        fontSize: isMobile ? '20px' : '28px',
        fontWeight: 'bold',
        color: color,
        textShadow: `
          0 0 8px ${glowColor},
          0 0 15px ${glowColor},
          2px 2px 4px rgba(0, 0, 0, 0.8)
        `,
        fontFamily: "'Roboto', sans-serif",
        letterSpacing: isMobile ? '0.5px' : '1px',
        textAlign: 'center',
        animation: animate ? 'comboPulse 0.5s ease-out' : 'comboFloat 2s ease-in-out infinite',
        backgroundColor: 'transparent',
        padding: isMobile ? '4px 8px' : '6px 12px',
        borderRadius: isMobile ? '6px' : '8px',
        border: `${isMobile ? '1.5px' : '2px'} solid ${color}`,
        boxShadow: `
          0 0 15px ${glowColor},
          inset 0 0 15px rgba(0, 0, 0, 0.5)
        `
      }}>
        COMBO x{comboMultiplier.toFixed(1)}!
      </div>
      <div style={{
        fontSize: isMobile ? '14px' : '18px',
        fontWeight: '900',
        color: '#ffffff',
        textShadow: `
          2px 2px 0 #000,
          -2px -2px 0 #000,
          2px -2px 0 #000,
          -2px 2px 0 #000,
          0 0 4px rgba(0, 0, 0, 0.8)
        `,
        fontFamily: "'Arial Black', 'Arial', sans-serif",
        textAlign: 'center',
        marginTop: isMobile ? '3px' : '4px',
        backgroundColor: 'transparent',
        padding: isMobile ? '2px 6px' : '3px 8px',
        borderRadius: isMobile ? '3px' : '4px',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        letterSpacing: isMobile ? '0.3px' : '0.5px'
      } as React.CSSProperties}>
        {comboStreak} Perfect Alignment{comboStreak !== 1 ? 's' : ''}!
      </div>
      <style>{`
        @keyframes comboPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes comboFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

export function GameUI() {
  const isMobile = useIsMobile();
  const phase = useGame(state => state.phase);
  const score = useGame(state => state.score);
  const credits = useGame(state => state.credits);
  const bonusPoints = useGame(state => state.bonusPoints);
  const stake = useGame(state => state.stake);
  const blocksStacked = useGame(state => state.blocksStacked);
  const highestRow = useGame(state => state.highestRow);
  const comboMultiplier = useGame(state => state.comboMultiplier);
  const comboStreak = useGame(state => state.comboStreak);
  const getPotentialPrize = useGame(state => state.getPotentialPrize);
  const start = useGame(state => state.start);
  const startDemo = useGame(state => state.startDemo);
  const restart = useGame(state => state.restart);
  const stopBlock = useGame(state => state.stopBlock);
  const soundMode = useAudio(state => state.soundMode);
  const cycleSoundMode = useAudio(state => state.cycleSoundMode);
  
  const potentialPrize = getPotentialPrize();
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'playing') {
        e.preventDefault();
        stopBlock();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, stopBlock]);

  // Auto-start demo on first load immediately, or after 3 seconds on subsequent ready states
  useEffect(() => {
    if (phase === 'ready' && !userInteracted) {
      // On first load, start demo immediately
      const delay = isFirstLoad ? 0 : 3000;
      
      const demoTimer = setTimeout(() => {
        startDemo();
        setIsFirstLoad(false); // Mark that demo has started
      }, delay);
      
      return () => clearTimeout(demoTimer);
    }
  }, [phase, startDemo, userInteracted, isFirstLoad]);

  const handleGameEnd = () => {
    setShowNameEntry(true);
  };

  const handleSaveScore = async () => {
    if (!playerName.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await apiRequest('POST', '/api/scores', {
        playerName: playerName.trim(),
        score,
        blocksStacked,
        highestRow
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/scores'] });
      
      setShowNameEntry(false);
      setPlayerName('');
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Failed to save score:', error);
      alert('Failed to save score. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipSave = () => {
    setShowNameEntry(false);
    setPlayerName('');
  };
  
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
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Roboto', sans-serif"
    }}>
      <div style={{
        position: 'absolute',
        top: isMobile ? '10px' : 'calc(50% - 448px)',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isMobile ? '8px' : '15px'
      }}>
        <div style={{
          fontSize: isMobile ? '28px' : '48px',
          fontWeight: 'bold',
          color: '#ffffff',
          fontFamily: "'Digital-7 Mono', 'Digital-7', monospace",
          textShadow: `
            0 0 10px rgba(255, 0, 0, 0.8),
            0 0 20px rgba(255, 0, 0, 0.6),
            0 0 30px rgba(255, 0, 0, 0.4),
            3px 3px 6px rgba(0, 0, 0, 0.9)
          `,
          letterSpacing: isMobile ? '3px' : '8px',
          textAlign: 'center'
        }}>
          FUNDORA BLOX
        </div>
        
        {/* Back to Casino Button */}
        <button
          {...handleTouchButton(() => {
            // Navigate back to host platform
            window.history.back();
          })}
          style={{
            pointerEvents: 'auto',
            padding: isMobile ? '8px 20px' : '12px 40px',
            fontSize: isMobile ? '13px' : '16px',
            fontWeight: 'bold',
            fontFamily: "'Roboto', sans-serif",
            color: '#ffffff',
            background: '#3a4149',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            letterSpacing: '1.5px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#484f58';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3a4149';
          }}
        >
          ← BACK TO CASINO
        </button>
      </div>

      <div style={{
        position: 'absolute',
        top: isMobile ? '85px' : 'calc(50% - 329px)',
        left: isMobile ? '10px' : 'auto',
        right: isMobile ? 'auto' : 'calc(50% + 196px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        <DisplayBox label="CREDITS" value={credits.toFixed(2)} unit="$" isMobile={isMobile} />
        <DisplayBox label="BONUS POINTS" value={formatNumber(bonusPoints)} unit="P" isMobile={isMobile} />
        <GameFeed />
      </div>

      {!isMobile && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(50% - 289px + 40px)',
          right: 'calc(50% + 196px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'auto',
          zIndex: 50
        }}>
          <DisplayBox 
            label="STAKE" 
            value={stake === 'FREE' ? 'FREE' : stake.toFixed(2)} 
            unit={stake === 'FREE' ? '' : '$'}
            isMobile={isMobile}
          />
        </div>
      )}
      
      <ComboIndicator comboMultiplier={comboMultiplier} comboStreak={comboStreak} phase={phase} isMobile={isMobile} />
      
      {!isMobile && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(50% - 390px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '119px',
          background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.65) 0%, rgba(50, 55, 65, 0.70) 15%, rgba(60, 65, 75, 0.75) 35%, rgba(55, 60, 70, 0.75) 50%, rgba(60, 65, 75, 0.75) 65%, rgba(50, 55, 65, 0.70) 85%, rgba(40, 45, 55, 0.65) 100%)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 3px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          zIndex: 35,
          transition: 'all 0.3s ease-in-out'
        }} />
      )}
      
      {!isMobile && (
        <>
          <div style={{
            position: 'absolute',
            bottom: 'calc(50% - 390px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
            zIndex: 40
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: 'calc(50% - 271px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
            zIndex: 40
          }} />
        </>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '10px' : 'calc(50% - 380px)',
        left: isMobile ? '10px' : 'auto',
        right: isMobile ? 'auto' : 'calc(50% + 231px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <StakeSelector />
        <div style={{
          fontSize: isMobile ? '8px' : '9px',
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          textAlign: 'center',
          fontFamily: "'Roboto', sans-serif",
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}>
          CHOOSE STAKE
        </div>
      </div>
      
      <div className="game-controls" style={{
        position: 'absolute',
        bottom: isMobile ? '10px' : 'calc(50% - 380px)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <button
          {...handleTouchButton(phase === 'ready' ? () => { setUserInteracted(true); start(); } : (phase === 'playing' ? stopBlock : () => {}))}
          disabled={phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits)}
          style={{
            padding: isMobile ? '6px 30px' : '8px 60px',
            minHeight: isMobile ? '38px' : '45px',
            fontSize: isMobile ? '16px' : '20px',
            fontWeight: 'bold',
            background: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits))
              ? 'linear-gradient(to top, #999 0%, #666 100%)' 
              : 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits)) ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)',
            textTransform: 'uppercase',
            fontFamily: "'Roboto', sans-serif",
            position: 'relative',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (phase !== 'ended' && phase !== 'demo' && (phase !== 'ready' || stake === 'FREE' || stake <= credits)) {
              e.currentTarget.style.background = 'linear-gradient(to top, #ff9999 0%, #ff6666 30%, #ee3333 70%, #aa0000 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,255,255,0.25), inset 0 2px 4px rgba(0,0,0,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (phase !== 'ended' && phase !== 'demo' && (phase !== 'ready' || stake === 'FREE' || stake <= credits)) {
              e.currentTarget.style.background = 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)';
            }
          }}
        >
          {phase === 'ended' || phase === 'demo' ? 'PLEASE WAIT' : 
           phase === 'playing' ? 'STOP' :
           (stake !== 'FREE' && stake > credits) ? 'INSUFFICIENT CREDITS' : 'START'}
        </button>
        <div style={{
          fontSize: isMobile ? '8px' : '11px',
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}>
          STOP BLOCKS
        </div>
      </div>
      
      {phase === 'ended' && (
          <div style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.90) 0%, rgba(50, 55, 65, 0.92) 15%, rgba(60, 65, 75, 0.94) 35%, rgba(55, 60, 70, 0.95) 50%, rgba(60, 65, 75, 0.94) 65%, rgba(50, 55, 65, 0.92) 85%, rgba(40, 45, 55, 0.90) 100%)',
            padding: isMobile ? '16px 24px 20px 24px' : '24px 40px 28px 40px',
            borderRadius: isMobile ? '12px' : '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto',
            zIndex: 100,
            maxWidth: isMobile ? '90%' : 'none'
          }}>
            <div style={{ 
              fontSize: isMobile ? '18px' : '22px', 
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: isMobile ? '2px' : '4px',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              Game Over
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '8px' : '12px',
              marginBottom: isMobile ? '2px' : '4px'
            }}>
              <div style={{
                display: 'flex',
                gap: isMobile ? '16px' : '32px',
                alignItems: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: isMobile ? '10px' : '12px', 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    marginBottom: isMobile ? '2px' : '4px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    SCORE
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '24px' : '32px', 
                    color: '#ff6666', 
                    fontWeight: 'bold',
                    fontFamily: "'Digital-7 Mono', monospace",
                    textShadow: '0 0 10px rgba(255, 102, 102, 0.5)'
                  }}>
                    {score}
                  </div>
                </div>
                <div style={{
                  width: isMobile ? '1px' : '2px',
                  height: isMobile ? '35px' : '50px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: isMobile ? '10px' : '12px', 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    marginBottom: isMobile ? '2px' : '4px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    PRIZE
                  </div>
                  <div style={{ 
                    fontSize: isMobile ? '24px' : '32px', 
                    fontWeight: 'bold',
                    fontFamily: "'Digital-7 Mono', monospace",
                    color: potentialPrize.amount === 0 ? '#ffaa44' : (potentialPrize.type === 'cash' ? '#44ff44' : '#ffaa44'),
                    textShadow: potentialPrize.amount === 0 
                      ? '0 0 10px rgba(255, 170, 68, 0.5)' 
                      : (potentialPrize.type === 'cash' ? '0 0 10px rgba(68, 255, 68, 0.5)' : '0 0 10px rgba(255, 170, 68, 0.5)')
                  }}>
                    {potentialPrize.amount === 0 
                      ? '0P'
                      : potentialPrize.type === 'cash' 
                        ? `$${potentialPrize.amount.toFixed(2)}`
                        : `${potentialPrize.amount.toLocaleString()}P`
                    }
                  </div>
                </div>
              </div>
              {bonusPoints > 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  background: 'rgba(255, 170, 68, 0.15)',
                  borderRadius: isMobile ? '6px' : '8px',
                  border: '1px solid rgba(255, 170, 68, 0.3)'
                }}>
                  <div style={{
                    fontSize: isMobile ? '9px' : '11px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: isMobile ? '1px' : '2px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}>
                    BONUS POINTS EARNED
                  </div>
                  <div style={{
                    fontSize: isMobile ? '18px' : '24px',
                    color: '#ffaa44',
                    fontWeight: 'bold',
                    fontFamily: "'Digital-7 Mono', monospace",
                    textShadow: '0 0 8px rgba(255, 170, 68, 0.5)'
                  }}>
                    +{formatNumber(bonusPoints)}P
                  </div>
                </div>
              )}
            </div>
            <button
              {...handleTouchButton(() => { setUserInteracted(true); restart(); })}
              style={{
                padding: isMobile ? '10px 32px' : '12px 48px',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 'bold',
                marginTop: isMobile ? '2px' : '4px',
                background: 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff9999 0%, #ff6666 30%, #ee3333 70%, #aa0000 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,255,255,0.25), inset 0 2px 4px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)';
              }}
            >
              Play Again
            </button>
          </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '10px' : 'calc(50% - 380px)',
        right: isMobile ? '10px' : 'auto',
        left: isMobile ? 'auto' : 'calc(50% + 211px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <button
          {...handleTouchButton(cycleSoundMode)}
          style={{
            width: isMobile ? '38px' : '45px',
            height: isMobile ? '58px' : '70px',
            background: 'linear-gradient(to bottom, #e8e8e8 0%, #c0c0c0 50%, #a0a0a0 100%)',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s',
            position: 'relative',
            padding: isMobile ? '5px' : '6px'
          }}
        >
          <div style={{
            width: isMobile ? '28px' : '33px',
            height: isMobile ? '35px' : '42px',
            background: 'linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0 50%, #ffffff 100%)',
            borderRadius: '12px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: soundMode === 'MUTE' ? (isMobile ? 'translateY(5px)' : 'translateY(6px)') : (isMobile ? 'translateY(-5px)' : 'translateY(-6px)'),
            transition: 'transform 0.2s'
          }}>
            {soundMode === 'MUTE' ? (
              <VolumeX size={isMobile ? 16 : 18} color="#666" strokeWidth={2} />
            ) : (
              <Volume2 size={isMobile ? 16 : 18} color="#666" strokeWidth={2} />
            )}
          </div>
        </button>
        <div style={{
          fontSize: isMobile ? '7px' : '8px',
          fontWeight: 'bold',
          color: 'rgba(255, 255, 255, 0.9)',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          textAlign: 'center',
          fontFamily: "'Roboto', sans-serif",
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          lineHeight: '1.2'
        }}>
          {soundMode === 'MUTE' && 'MUTE'}
          {soundMode === 'ALL_ON' && <>ALL ON</>}
          {soundMode === 'SE_OFF' && <>SE OFF<br/>BG ON</>}
          {soundMode === 'BG_OFF' && <>BG OFF<br/>SE ON</>}
        </div>
      </div>

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {showNameEntry && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '2px solid #333',
            borderRadius: '10px',
            padding: '12px 20px',
            minWidth: '240px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            fontFamily: "'Roboto', sans-serif"
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#333',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              Save Score
            </h2>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>SCORE</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d64545' }}>{score}</div>
              </div>
              <div style={{
                width: '1px',
                height: '25px',
                backgroundColor: '#ddd'
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#666', marginBottom: '2px' }}>BLOCKS</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d64545' }}>{blocksStacked}</div>
              </div>
            </div>

            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveScore()}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '12px',
                border: '2px solid #ccc',
                borderRadius: '6px',
                marginBottom: '10px',
                fontFamily: "'Roboto', sans-serif",
                boxSizing: 'border-box'
              }}
            />

            <div style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'center'
            }}>
              <button
                {...handleTouchButton(handleSaveScore)}
                disabled={!playerName.trim() || isSaving}
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: playerName.trim() && !isSaving ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: playerName.trim() && !isSaving ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase',
                  fontFamily: "'Roboto', sans-serif"
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                {...handleTouchButton(handleSkipSave)}
                disabled={isSaving}
                style={{
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: "'Roboto', sans-serif"
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisplayBox({ label, value, unit, isMobile }: { label: string; value: string; unit: string; isMobile?: boolean }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: isMobile ? '1.5px solid #333' : '2px solid #333',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '4px 8px' : '6px 12px',
      minWidth: isMobile ? '130px' : '170px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        fontSize: isMobile ? '9px' : '11px',
        fontWeight: '900',
        color: '#333',
        marginBottom: isMobile ? '2px' : '3px'
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '4px' : '6px'
      }}>
        <div style={{
          fontSize: isMobile ? '22px' : '28px',
          fontWeight: 'bold',
          color: '#ff0000',
          backgroundColor: '#000',
          padding: isMobile ? '3px 8px' : '4px 10px',
          borderRadius: isMobile ? '6px' : '8px',
          fontFamily: "'Digital-7 Mono', 'Digital-7', monospace",
          letterSpacing: isMobile ? '0.5px' : '1px',
          flex: '1',
          textShadow: '0 0 1px #ff0000'
        }}>
          {value}
        </div>
        {unit && (
          <div style={{
            fontSize: isMobile ? '13px' : '16px',
            fontWeight: 'bold',
            color: '#fff',
            fontFamily: "'Roboto', sans-serif",
            paddingRight: isMobile ? '2px' : '4px',
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
          }}>
            {unit}
          </div>
        )}
      </div>
    </div>
  );
}

function PrizeMultipliers() {
  const multipliers = [
    { value: '100.00', color: '#ff0000' },
    { value: '10.00', color: '#ff8800' },
    { value: '5.00', color: '#ffff00' },
    { value: '2.00', color: '#00ff00' },
    { value: '1.00', color: '#00ffff' },
    { value: '1.000', color: '#000000', unit: 'P' },
    { value: '500', color: '#000000', unit: 'P' },
    { value: '250', color: '#000000', unit: 'P' },
  ];
  
  return (
    <div className="prize-multipliers" style={{
      position: 'absolute',
      top: '40px',
      right: '40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'flex-end'
    }}>
      {multipliers.map((mult, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: mult.color,
            border: '2px solid #333'
          }} />
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: mult.color === '#ffff00' ? '#666' : mult.color,
            textShadow: mult.color === '#ffff00' ? '0 0 2px rgba(0,0,0,0.5)' : 'none',
            fontFamily: "'Arial Black', sans-serif"
          }}>
            {mult.unit ? `${mult.value} ${mult.unit}` : `x ${mult.value}`}
          </div>
        </div>
      ))}
    </div>
  );
}
