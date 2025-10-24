import { useGame } from '@/lib/stores/useGame';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function StakeSelector() {
  const stake = useGame(state => state.stake);
  const cycleStake = useGame(state => state.cycleStake);
  const phase = useGame(state => state.phase);

  const handleTouchButton = (callback: () => void) => {
    return {
      onClick: callback,
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        callback();
      }
    };
  };
  
  const displayStake = stake === 'FREE' ? 'FREE' : `${stake.toFixed(2)} $`;
  
  return (
    <div style={{
      backgroundColor: 'white',
      border: '4px solid #333',
      borderRadius: '12px',
      padding: '15px',
      minWidth: '180px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: "'Courier New', monospace"
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#666',
        marginBottom: '8px',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        STAKE
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px'
      }}>
        <button
          {...handleTouchButton(() => cycleStake('up'))}
          disabled={phase !== 'ready'}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: phase === 'ready' ? '#4CAF50' : '#ccc',
            border: '2px solid #333',
            borderRadius: '6px',
            cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ChevronUp size={20} color={phase === 'ready' ? '#fff' : '#999'} />
        </button>
        
        <div style={{
          width: '100%',
          backgroundColor: '#000',
          padding: '12px 10px',
          borderRadius: '6px',
          textAlign: 'center',
          border: '2px solid #333'
        }}>
          <div style={{
            fontSize: stake === 'FREE' ? '18px' : '20px',
            fontWeight: 'bold',
            color: stake === 'FREE' ? '#00ff00' : '#ff0000',
            letterSpacing: '1px',
            fontFamily: "'Courier New', monospace"
          }}>
            {displayStake}
          </div>
        </div>
        
        <button
          {...handleTouchButton(() => cycleStake('down'))}
          disabled={phase !== 'ready'}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: phase === 'ready' ? '#4CAF50' : '#ccc',
            border: '2px solid #333',
            borderRadius: '6px',
            cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ChevronDown size={20} color={phase === 'ready' ? '#fff' : '#999'} />
        </button>
      </div>
    </div>
  );
}
