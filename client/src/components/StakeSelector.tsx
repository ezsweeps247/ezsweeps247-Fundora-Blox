import { useGame } from '@/lib/stores/useGame';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function StakeSelector() {
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
  
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      fontFamily: "'Courier New', monospace"
    }}>
      <button
        {...handleTouchButton(() => cycleStake('down'))}
        disabled={phase !== 'ready'}
        style={{
          width: '85px',
          height: '85px',
          backgroundColor: phase === 'ready' ? '#FFA500' : '#ccc',
          border: '4px solid #333',
          borderRadius: '50%',
          cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (phase === 'ready') {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#FFB84D';
          }
        }}
        onMouseLeave={(e) => {
          if (phase === 'ready') {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#FFA500';
          }
        }}
      >
        <ChevronDown size={40} color={phase === 'ready' ? '#fff' : '#999'} strokeWidth={3} />
      </button>
      
      <button
        {...handleTouchButton(() => cycleStake('up'))}
        disabled={phase !== 'ready'}
        style={{
          width: '85px',
          height: '85px',
          backgroundColor: phase === 'ready' ? '#FF8C00' : '#ccc',
          border: '4px solid #333',
          borderRadius: '50%',
          cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (phase === 'ready') {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#FFA533';
          }
        }}
        onMouseLeave={(e) => {
          if (phase === 'ready') {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#FF8C00';
          }
        }}
      >
        <ChevronUp size={40} color={phase === 'ready' ? '#fff' : '#999'} strokeWidth={3} />
      </button>
    </div>
  );
}
