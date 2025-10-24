import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { HighScore } from '@shared/schema';

export function Leaderboard({ onClose }: { onClose: () => void }) {
  const { data: scores, isLoading, error } = useQuery<HighScore[]>({
    queryKey: ['/api/scores'],
    refetchInterval: 5000,
  });

  return (
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
    }}>
      <div style={{
        backgroundColor: 'white',
        border: '4px solid #333',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: "'Courier New', monospace"
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '32px',
            color: '#d64545',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Leaderboard
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: '#d64545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff5555'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d64545'}
          >
            CLOSE
          </button>
        </div>

        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            fontSize: '18px',
            color: '#666'
          }}>
            Loading scores...
          </div>
        )}

        {error && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            fontSize: '18px',
            color: '#d64545'
          }}>
            Failed to load scores
          </div>
        )}

        {scores && scores.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            fontSize: '18px',
            color: '#666'
          }}>
            No scores yet. Be the first!
          </div>
        )}

        {scores && scores.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {scores.map((score, index) => (
              <div
                key={score.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 1fr 120px 120px',
                  gap: '15px',
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: index < 3 ? '#fff9e6' : '#f9f9f9',
                  border: `2px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#ddd'}`,
                  borderRadius: '8px',
                }}
              >
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#666',
                  textAlign: 'center'
                }}>
                  #{index + 1}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {score.playerName}
                </div>
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    marginBottom: '3px'
                  }}>
                    SCORE
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#ff0000',
                    backgroundColor: '#000',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '1px'
                  }}>
                    {score.score}
                  </div>
                </div>
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    marginBottom: '3px'
                  }}>
                    BLOCKS
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#ff0000',
                    backgroundColor: '#000',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '1px'
                  }}>
                    {score.blocksStacked}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
