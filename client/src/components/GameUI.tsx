import { useState, useEffect } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { StakeSelector } from './StakeSelector';
import { GameFeed } from './GameFeed';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

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
      top: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 100
    }}>
      <div style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: color,
        textShadow: `
          0 0 8px ${glowColor},
          0 0 15px ${glowColor},
          2px 2px 4px rgba(0, 0, 0, 0.8)
        `,
        fontFamily: "'Roboto', sans-serif",
        letterSpacing: '2px',
        textAlign: 'center',
        animation: animate ? 'comboPulse 0.5s ease-out' : 'comboFloat 2s ease-in-out infinite',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: '8px 18px',
        borderRadius: '8px',
        border: `2px solid ${color}`,
        boxShadow: `
          0 0 15px ${glowColor},
          inset 0 0 15px rgba(0, 0, 0, 0.5)
        `
      }}>
        COMBO x{comboMultiplier.toFixed(1)}!
      </div>
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '0 0 5px rgba(0, 0, 0, 0.8)',
        fontFamily: "'Roboto', sans-serif",
        textAlign: 'center',
        marginTop: '6px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: '3px 10px',
        borderRadius: '4px'
      }}>
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
  const restart = useGame(state => state.restart);
  const stopBlock = useGame(state => state.stopBlock);
  const isMuted = useAudio(state => state.isMuted);
  const toggleMute = useAudio(state => state.toggleMute);
  
  const potentialPrize = getPotentialPrize();
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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
        top: 'calc(50% - 329px)',
        right: 'calc(50% + 170px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        <DisplayBox label="CREDITS" value={credits.toFixed(2)} unit="$" />
        <DisplayBox label="BONUS POINTS" value={bonusPoints.toLocaleString()} unit="P" />
      </div>
      
      <div style={{
        position: 'absolute',
        top: 'calc(50% - 189px)',
        right: 'calc(50% + 170px)',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <GameFeed />
      </div>

      <div style={{
        position: 'absolute',
        bottom: 'calc(50% - 289px + 40px)',
        right: 'calc(50% + 170px)',
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
        />
      </div>
      
      <ComboIndicator comboMultiplier={comboMultiplier} comboStreak={comboStreak} phase={phase} />
      
      <div style={{
        position: 'absolute',
        bottom: '50px',
        right: 'calc(50% + 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <StakeSelector />
        <div style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          textAlign: 'center',
          fontFamily: "'Roboto', sans-serif"
        }}>
          CHOOSE STAKE
        </div>
      </div>
      
      <div className="game-controls" style={{
        position: 'absolute',
        bottom: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        {phase === 'ready' && (
          <>
            <button
              {...handleTouchButton(start)}
              disabled={stake !== 'FREE' && stake > credits}
              style={{
                padding: '8px 60px',
                minHeight: '45px',
                fontSize: '20px',
                fontWeight: 'bold',
                background: (stake !== 'FREE' && stake > credits) 
                  ? 'linear-gradient(to top, #999 0%, #666 100%)' 
                  : 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: (stake !== 'FREE' && stake > credits) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)',
                textTransform: 'uppercase',
                fontFamily: "'Roboto', sans-serif",
                position: 'relative',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (stake === 'FREE' || stake <= credits) {
                  e.currentTarget.style.background = 'linear-gradient(to top, #ff9999 0%, #ff6666 30%, #ee3333 70%, #aa0000 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,255,255,0.25), inset 0 2px 4px rgba(0,0,0,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (stake === 'FREE' || stake <= credits) {
                  e.currentTarget.style.background = 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)';
                }
              }}
            >
              {(stake !== 'FREE' && stake > credits) ? 'INSUFFICIENT CREDITS' : 'START'}
            </button>
            <div style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#333',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              STOP BLOCKS
            </div>
          </>
        )}
        
        {phase === 'playing' && (
          <>
            <button
              {...handleTouchButton(stopBlock)}
              style={{
                padding: '8px 60px',
                minHeight: '45px',
                fontSize: '20px',
                fontWeight: 'bold',
                background: 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)',
                textTransform: 'uppercase',
                fontFamily: "'Roboto', sans-serif",
                position: 'relative',
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
              STOP
            </button>
            <div style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#333',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              STOP BLOCKS
            </div>
          </>
        )}
      </div>
      
      {phase === 'ended' && (
          <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            padding: '12px 20px 14px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            border: '2px solid #333',
            pointerEvents: 'auto',
            zIndex: 100
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '2px'
            }}>
              Game Over
            </div>
            <div style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              marginBottom: '2px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '8px', 
                  color: '#666', 
                  marginBottom: '2px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px'
                }}>
                  SCORE
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  color: '#d64545', 
                  fontWeight: 'bold',
                  fontFamily: "'Digital-7 Mono', monospace"
                }}>
                  {score}
                </div>
              </div>
              <div style={{
                width: '1px',
                height: '32px',
                backgroundColor: '#ddd'
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '8px', 
                  color: '#666', 
                  marginBottom: '2px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px'
                }}>
                  PRIZE
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  fontFamily: "'Digital-7 Mono', monospace",
                  color: potentialPrize.amount === 0 ? '#ff8800' : (potentialPrize.type === 'cash' ? '#00aa00' : '#ff8800')
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
            <button
              {...handleTouchButton(restart)}
              style={{
                padding: '8px 28px',
                fontSize: '13px',
                fontWeight: 'bold',
                marginTop: '2px',
                background: 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
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
        bottom: '50px',
        left: 'calc(50% + 200px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <button
          {...handleTouchButton(toggleMute)}
          style={{
            width: '45px',
            height: '70px',
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
            padding: '6px'
          }}
        >
          <div style={{
            width: '33px',
            height: '42px',
            background: isMuted 
              ? 'linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0 50%, #ffffff 100%)'
              : 'linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0 50%, #ffffff 100%)',
            borderRadius: '12px',
            boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: isMuted ? 'translateY(6px)' : 'translateY(-6px)',
            transition: 'transform 0.2s'
          }}>
            {isMuted ? (
              <VolumeX size={18} color="#666" strokeWidth={2} />
            ) : (
              <Volume2 size={18} color="#666" strokeWidth={2} />
            )}
          </div>
        </button>
        <div style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          textAlign: 'center',
          fontFamily: "'Roboto', sans-serif"
        }}>
          SOUND ON/OFF
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

function DisplayBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '2px solid #333',
      borderRadius: '12px',
      padding: '6px 10px',
      minWidth: '140px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: '900',
        color: '#333',
        marginBottom: '3px'
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#ff0000',
          backgroundColor: '#000',
          padding: '4px 8px',
          borderRadius: '8px',
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
            paddingRight: '4px',
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
