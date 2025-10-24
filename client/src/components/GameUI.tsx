import { useState, useEffect } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { StakeSelector } from './StakeSelector';
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
      top: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
      zIndex: 100
    }}>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: color,
        textShadow: `
          0 0 10px ${glowColor},
          0 0 20px ${glowColor},
          0 0 30px ${glowColor},
          0 0 40px ${glowColor},
          2px 2px 4px rgba(0, 0, 0, 0.8)
        `,
        fontFamily: "'Courier New', monospace",
        letterSpacing: '4px',
        textAlign: 'center',
        animation: animate ? 'comboPulse 0.5s ease-out' : 'comboFloat 2s ease-in-out infinite',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '15px 30px',
        borderRadius: '10px',
        border: `3px solid ${color}`,
        boxShadow: `
          0 0 20px ${glowColor},
          inset 0 0 20px rgba(0, 0, 0, 0.5)
        `
      }}>
        COMBO x{comboMultiplier.toFixed(1)}!
      </div>
      <div style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '0 0 5px rgba(0, 0, 0, 0.8)',
        fontFamily: "'Courier New', monospace",
        textAlign: 'center',
        marginTop: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '5px 15px',
        borderRadius: '5px'
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
          50% { transform: translateY(-10px); }
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
      fontFamily: "'Courier New', monospace"
    }}>
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '40px',
        display: 'flex',
        gap: '15px',
        alignItems: 'flex-start',
        pointerEvents: 'auto'
      }}>
        <button
          {...handleTouchButton(() => setShowLeaderboard(true))}
          style={{
            padding: '15px',
            minWidth: '60px',
            minHeight: '60px',
            backgroundColor: 'rgba(255, 215, 0, 0.9)',
            border: '2px solid #DAA520',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 215, 0, 0.9)'}
        >
          <Trophy size={28} color="#8B4513" />
        </button>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <DisplayBox label="CREDITS" value={credits.toFixed(2)} unit="$" />
          <DisplayBox label="BONUS POINTS" value={bonusPoints.toLocaleString()} unit="P" />
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <DisplayBox 
          label="STAKE" 
          value={stake === 'FREE' ? 'FREE' : stake.toFixed(2)} 
          unit={stake === 'FREE' ? '' : '$'} 
        />
        <StakeSelector />
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '40px',
        right: '40px',
        pointerEvents: 'auto',
        zIndex: 50
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            {...handleTouchButton(toggleMute)}
            style={{
              width: '70px',
              height: '70px',
              backgroundColor: 'rgba(200, 200, 200, 0.9)',
              border: '4px solid #333',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(220, 220, 220, 0.95)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(200, 200, 200, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isMuted ? (
              <VolumeX size={30} color="#333" strokeWidth={2.5} />
            ) : (
              <Volume2 size={30} color="#333" strokeWidth={2.5} />
            )}
          </button>
          <div style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#333',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            fontFamily: "'Courier New', monospace"
          }}>
            SOUND ON/OFF
          </div>
        </div>
      </div>
      
      <ComboIndicator comboMultiplier={comboMultiplier} comboStreak={comboStreak} phase={phase} />
      
      <div className="game-controls" style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto'
      }}>
        {phase === 'ready' && (
          <>
            <button
              {...handleTouchButton(start)}
              disabled={stake !== 'FREE' && stake > credits}
              style={{
                padding: '18px 80px',
                minHeight: '70px',
                fontSize: '28px',
                fontWeight: 'bold',
                background: (stake !== 'FREE' && stake > credits) 
                  ? 'linear-gradient(to bottom, #999 0%, #666 100%)' 
                  : 'linear-gradient(to bottom, #ff4444 0%, #cc0000 100%)',
                color: 'white',
                border: '4px solid #800000',
                borderRadius: '20px',
                cursor: (stake !== 'FREE' && stake > credits) ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace",
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                position: 'relative',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (stake === 'FREE' || stake <= credits) {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #ff5555 0%, #dd0000 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (stake === 'FREE' || stake <= credits) {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #ff4444 0%, #cc0000 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
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
                padding: '18px 80px',
                minHeight: '70px',
                fontSize: '28px',
                fontWeight: 'bold',
                background: 'linear-gradient(to bottom, #ff4444 0%, #cc0000 100%)',
                color: 'white',
                border: '4px solid #800000',
                borderRadius: '20px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                fontFamily: "'Courier New', monospace",
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                position: 'relative',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to bottom, #ff5555 0%, #dd0000 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to bottom, #ff4444 0%, #cc0000 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
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
        
        {phase === 'ended' && !showNameEntry && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: 0, fontSize: '32px', color: '#333' }}>Game Over!</h2>
            <div style={{ 
              textAlign: 'center',
              padding: '15px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              minWidth: '250px'
            }}>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>
                Final Score
              </div>
              <div style={{ fontSize: '32px', color: '#d64545', fontWeight: 'bold', marginBottom: '15px' }}>
                {score}
              </div>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '5px' }}>
                Prize Won
              </div>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 'bold',
                color: potentialPrize.type === 'cash' ? '#00aa00' : '#ff8800'
              }}>
                {potentialPrize.type === 'cash' 
                  ? `$${potentialPrize.amount.toFixed(2)}`
                  : `${potentialPrize.amount.toLocaleString()}P`
                }
              </div>
              <div style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>
                Reached Row {highestRow}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                {...handleTouchButton(handleGameEnd)}
                style={{
                  padding: '15px 40px',
                  minHeight: '60px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#66BB6A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
              >
                Save Score
              </button>
              <button
                {...handleTouchButton(restart)}
                style={{
                  padding: '15px 40px',
                  minHeight: '60px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  backgroundColor: '#d64545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff5555'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d64545'}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {showNameEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '4px solid #333',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontFamily: "'Courier New', monospace"
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '28px',
              color: '#d64545',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}>
              Save Your Score!
            </h2>
            
            <div style={{
              backgroundColor: '#f9f9f9',
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#666' }}>Score: </span>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#d64545' 
                }}>{score}</span>
              </div>
              <div>
                <span style={{ color: '#666' }}>Blocks Stacked: </span>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: '#d64545' 
                }}>{blocksStacked}</span>
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
                padding: '15px',
                fontSize: '18px',
                border: '2px solid #ccc',
                borderRadius: '8px',
                marginBottom: '20px',
                fontFamily: "'Courier New', monospace",
                boxSizing: 'border-box'
              }}
            />

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                {...handleTouchButton(handleSaveScore)}
                disabled={!playerName.trim() || isSaving}
                style={{
                  padding: '15px 30px',
                  minHeight: '60px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: playerName.trim() && !isSaving ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: playerName.trim() && !isSaving ? 'pointer' : 'not-allowed',
                  textTransform: 'uppercase',
                  fontFamily: "'Courier New', monospace"
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                {...handleTouchButton(handleSkipSave)}
                disabled={isSaving}
                style={{
                  padding: '15px 30px',
                  minHeight: '60px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: "'Courier New', monospace"
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
      border: '3px solid #333',
      borderRadius: '8px',
      padding: '10px 15px',
      minWidth: '180px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#666',
        marginBottom: '5px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#ff0000',
        backgroundColor: '#000',
        padding: '5px 10px',
        borderRadius: '4px',
        fontFamily: "'Courier New', monospace",
        letterSpacing: '2px'
      }}>
        {value} <span style={{ fontSize: '18px' }}>{unit}</span>
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
