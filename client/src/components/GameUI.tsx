import { useState } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

export function GameUI() {
  const phase = useGame(state => state.phase);
  const score = useGame(state => state.score);
  const credits = useGame(state => state.credits);
  const bonusPoints = useGame(state => state.bonusPoints);
  const stake = useGame(state => state.stake);
  const blocksStacked = useGame(state => state.blocksStacked);
  const highestRow = useGame(state => state.highestRow);
  const start = useGame(state => state.start);
  const restart = useGame(state => state.restart);
  const stopBlock = useGame(state => state.stopBlock);
  const isMuted = useAudio(state => state.isMuted);
  const toggleMute = useAudio(state => state.toggleMute);
  
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

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
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Courier New', monospace"
    }}>
      <ScoreDisplays 
        credits={credits}
        bonusPoints={bonusPoints}
        stake={stake}
      />
      
      <PrizeMultipliers />
      
      <div style={{
        position: 'absolute',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        pointerEvents: 'auto'
      }}>
        {phase === 'ready' && (
          <button
            onClick={start}
            style={{
              padding: '20px 60px',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: '#d64545',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              textTransform: 'uppercase',
              fontFamily: "'Courier New', monospace"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff5555'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d64545'}
          >
            START
          </button>
        )}
        
        {phase === 'playing' && (
          <button
            onClick={stopBlock}
            style={{
              padding: '20px 60px',
              fontSize: '24px',
              fontWeight: 'bold',
              backgroundColor: '#d64545',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              textTransform: 'uppercase',
              fontFamily: "'Courier New', monospace"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff5555'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d64545'}
          >
            STOP BLOCKS
          </button>
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
            <p style={{ margin: 0, fontSize: '24px', color: '#666' }}>
              Final Score: <span style={{ color: '#d64545', fontWeight: 'bold' }}>{score}</span>
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleGameEnd}
                style={{
                  padding: '15px 40px',
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
                onClick={restart}
                style={{
                  padding: '15px 40px',
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
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => setShowLeaderboard(true)}
          style={{
            padding: '15px',
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
          <Trophy size={24} color="#8B4513" />
        </button>
        <button
          onClick={toggleMute}
          style={{
            padding: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #ccc',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
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
                onClick={handleSaveScore}
                disabled={!playerName.trim() || isSaving}
                style={{
                  padding: '15px 30px',
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
                onClick={handleSkipSave}
                disabled={isSaving}
                style={{
                  padding: '15px 30px',
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

function ScoreDisplays({ credits, bonusPoints, stake }: { credits: number; bonusPoints: number; stake: number }) {
  return (
    <div style={{
      position: 'absolute',
      top: '40px',
      left: '40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      <DisplayBox label="CREDITS" value={credits.toFixed(2)} unit="$" />
      <DisplayBox label="BONUS POINTS" value={bonusPoints.toLocaleString()} unit="P" />
      <DisplayBox label="STAKE" value={stake.toFixed(2)} unit="$" />
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
    <div style={{
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
