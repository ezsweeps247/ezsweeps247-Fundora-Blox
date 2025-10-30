import { useState, useEffect } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { StakeSelector } from './StakeSelector';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

function ComboIndicator({ comboMultiplier, comboStreak, phase }: { comboMultiplier: number; comboStreak: number; phase: string }) {
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
      bottom: 'calc(50% - 420px)',
      right: 'calc(50% + 340px)',
      pointerEvents: 'none',
      zIndex: 100,
      width: '280px'
    }}>
      <div style={{
        fontSize: '40px',
        fontWeight: 'bold',
        color: color,
        textShadow: `
          0 0 12px ${glowColor},
          0 0 22px ${glowColor},
          3px 3px 6px rgba(0, 0, 0, 0.8)
        `,
        fontFamily: "'Roboto', sans-serif",
        letterSpacing: '1.5px',
        textAlign: 'center',
        animation: animate ? 'comboPulse 0.5s ease-out' : 'comboFloat 2s ease-in-out infinite',
        backgroundColor: 'transparent',
        padding: '8px 16px',
        borderRadius: '12px',
        border: `3px solid ${color}`,
        boxShadow: `
          0 0 20px ${glowColor},
          inset 0 0 20px rgba(0, 0, 0, 0.5)
        `
      }}>
        COMBO x{comboMultiplier.toFixed(1)}!
      </div>
      <div style={{
        fontSize: '26px',
        fontWeight: '900',
        color: '#ffffff',
        textShadow: `
          2px 2px 0 #000,
          -2px -2px 0 #000,
          2px -2px 0 #000,
          -2px 2px 0 #000,
          0 0 6px rgba(0, 0, 0, 0.8)
        `,
        fontFamily: "'Arial Black', 'Arial', sans-serif",
        textAlign: 'center',
        marginTop: '6px',
        backgroundColor: 'transparent',
        padding: '4px 12px',
        borderRadius: '6px',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        letterSpacing: '0.7px'
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
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

  // Detect mobile/small screens
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900 || window.innerHeight < 900);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

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
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Roboto', sans-serif"
    }}>
      <ComboIndicator comboMultiplier={comboMultiplier} comboStreak={comboStreak} phase={phase} />
      
      {phase === 'ended' && (
          <div style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.90) 0%, rgba(50, 55, 65, 0.92) 15%, rgba(60, 65, 75, 0.94) 35%, rgba(55, 60, 70, 0.95) 50%, rgba(60, 65, 75, 0.94) 65%, rgba(50, 55, 65, 0.92) 85%, rgba(40, 45, 55, 0.90) 100%)',
            padding: '34px 56px 40px 56px',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.1)',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'auto',
            zIndex: 100
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '6px',
              textShadow: '0 3px 6px rgba(0,0,0,0.5)'
            }}>
              Game Over
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '6px'
            }}>
              <div style={{
                display: 'flex',
                gap: '45px',
                alignItems: 'center'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '17px', 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    marginBottom: '6px',
                    fontWeight: 'bold',
                    letterSpacing: '0.7px'
                  }}>
                    SCORE
                  </div>
                  <div style={{ 
                    fontSize: '46px', 
                    color: '#ff6666', 
                    fontWeight: 'bold',
                    fontFamily: "'Digital-7 Mono', monospace",
                    textShadow: '0 0 14px rgba(255, 102, 102, 0.5)'
                  }}>
                    {score}
                  </div>
                </div>
                <div style={{
                  width: '3px',
                  height: '70px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '17px', 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    marginBottom: '6px',
                    fontWeight: 'bold',
                    letterSpacing: '0.7px'
                  }}>
                    PRIZE
                  </div>
                  <div style={{ 
                    fontSize: '46px', 
                    fontWeight: 'bold',
                    fontFamily: "'Digital-7 Mono', monospace",
                    color: potentialPrize.amount === 0 ? '#ffaa44' : (potentialPrize.type === 'cash' ? '#44ff44' : '#ffaa44'),
                    textShadow: potentialPrize.amount === 0 
                      ? '0 0 14px rgba(255, 170, 68, 0.5)' 
                      : (potentialPrize.type === 'cash' ? '0 0 14px rgba(68, 255, 68, 0.5)' : '0 0 14px rgba(255, 170, 68, 0.5)')
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
                  padding: '12px 22px',
                  background: 'rgba(255, 170, 68, 0.15)',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 170, 68, 0.3)'
                }}>
                  <div style={{
                    fontSize: '15px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '3px',
                    fontWeight: 'bold',
                    letterSpacing: '0.7px'
                  }}>
                    BONUS POINTS EARNED
                  </div>
                  <div style={{
                    fontSize: '34px',
                    color: '#ffaa44',
                    fontWeight: 'bold',
                    fontFamily: "'Digital-7 Mono', monospace",
                    textShadow: '0 0 12px rgba(255, 170, 68, 0.5)'
                  }}>
                    +{formatNumber(bonusPoints)}P
                  </div>
                </div>
              )}
            </div>
            <button
              {...handleTouchButton(() => { setUserInteracted(true); restart(); })}
              style={{
                padding: '16px 68px',
                fontSize: '26px',
                fontWeight: 'bold',
                marginTop: '6px',
                background: 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '42px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                boxShadow: '0 6px 12px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(255,255,255,0.2), inset 0 3px 6px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff9999 0%, #ff6666 30%, #ee3333 70%, #aa0000 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(255,255,255,0.25), inset 0 3px 6px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(255,255,255,0.2), inset 0 3px 6px rgba(0,0,0,0.3)';
              }}
            >
              Play Again
            </button>
          </div>
      )}

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
            background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.65) 0%, rgba(50, 55, 65, 0.70) 15%, rgba(60, 65, 75, 0.75) 35%, rgba(55, 60, 70, 0.75) 50%, rgba(60, 65, 75, 0.75) 65%, rgba(50, 55, 65, 0.70) 85%, rgba(40, 45, 55, 0.65) 100%)',
            backdropFilter: 'blur(12px)',
            border: '2px solid #333',
            borderRadius: '10px',
            padding: '12px 20px',
            minWidth: '240px',
            boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 3px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3)',
            fontFamily: "'Roboto', sans-serif"
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
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
                <div style={{ fontSize: '9px', color: '#bbb', marginBottom: '2px' }}>SCORE</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff5555' }}>{score}</div>
              </div>
              <div style={{
                width: '1px',
                height: '25px',
                backgroundColor: '#555'
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: '#bbb', marginBottom: '2px' }}>BLOCKS</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff5555' }}>{blocksStacked}</div>
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
