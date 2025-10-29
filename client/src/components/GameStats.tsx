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
      backgroundColor: 'white',
      border: '2px solid #333',
      borderRadius: '12px',
      padding: '6px 12px',
      minWidth: '170px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '900',
        color: '#333',
        marginBottom: '2px',
        textAlign: 'left',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#000',
        fontFamily: "'Arial Black', sans-serif",
        textAlign: 'left',
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px'
      }}>
        {unit && <span style={{ fontSize: '18px', opacity: 0.7 }}>{unit}</span>}
        <span>{value}</span>
      </div>
    </div>
  );
}

export function GameStats() {
  const credits = useGame(state => state.credits);
  const bonusPoints = useGame(state => state.bonusPoints);
  const stake = useGame(state => state.stake);
  
  return (
    <>
      <div style={{
        position: 'absolute',
        left: 'calc(100% + 10px)',
        top: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'auto'
      }}>
        <DisplayBox label="CREDITS" value={credits.toFixed(2)} unit="$" />
        <DisplayBox label="BONUS POINTS" value={formatNumber(bonusPoints)} unit="P" />
        <GameFeed />
      </div>

      <div style={{
        position: 'absolute',
        left: 'calc(100% + 10px)',
        bottom: '10px',
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
    </>
  );
}
