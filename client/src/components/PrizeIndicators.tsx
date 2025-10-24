import { useGame } from '@/lib/stores/useGame';

const GRID_ROWS = 14;
const CELL_SIZE = 38;
const CELL_SPACING = 2;

const PRIZE_TIERS = [
  { minRow: 13, color: '#cc0000', multiplier: 100, type: 'cash', textColor: '#fff' },
  { minRow: 12, color: '#ff8800', multiplier: 10, type: 'cash', textColor: '#fff' },
  { minRow: 11, color: '#cccc00', multiplier: 5, type: 'cash', textColor: '#000' },
  { minRow: 10, color: '#00cc66', multiplier: 2, type: 'cash', textColor: '#000' },
  { minRow: 9, color: '#0099cc', multiplier: 1, type: 'cash', textColor: '#fff' },
  { minRow: 8, color: '#333333', multiplier: 1000, type: 'points', textColor: '#fff' },
  { minRow: 7, color: '#666666', multiplier: 500, type: 'points', textColor: '#fff' },
  { minRow: 6, color: '#888888', multiplier: 250, type: 'points', textColor: '#fff' },
];

function getPrizeTier(row: number) {
  for (const tier of PRIZE_TIERS) {
    if (row >= tier.minRow) {
      return tier;
    }
  }
  return PRIZE_TIERS[PRIZE_TIERS.length - 1];
}

export function PrizeIndicators() {
  const stake = useGame(state => state.stake);
  const highestRow = useGame(state => state.highestRow);
  
  const isFreeMode = stake === 'FREE';
  const stakeAmount = typeof stake === 'number' ? stake : 0;
  
  const displayedRows = [13, 12, 11, 10, 9, 8, 7, 6];
  
  return (
    <div style={{
      position: 'absolute',
      left: 'calc(100% - 2px)',
      top: '10px',
      width: '200px',
      fontFamily: "'Arial Black', sans-serif",
      fontWeight: 'bold',
      fontSize: '18px',
    }}>
      {displayedRows.map((row) => {
        const tier = getPrizeTier(row);
        const yPosition = (GRID_ROWS - 1 - row) * (CELL_SIZE + CELL_SPACING);
        
        let displayText = '';
        
        if (isFreeMode) {
          displayText = `${tier.multiplier} P`;
        } else {
          if (tier.type === 'points') {
            displayText = `${tier.multiplier} P`;
          } else {
            const prizeAmount = stakeAmount * tier.multiplier;
            displayText = `${prizeAmount.toFixed(2)} $`;
          }
        }
        
        const isActive = highestRow >= row;
        
        return (
          <div
            key={row}
            style={{
              position: 'absolute',
              top: `${yPosition}px`,
              left: 0,
              height: `${CELL_SIZE}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: `12px solid ${tier.color}`,
              opacity: 1,
            }} />
            <div style={{
              color: tier.type === 'points' ? '#ffffff' : tier.color,
              padding: '6px 12px',
              textShadow: '2px 2px 3px rgba(0, 0, 0, 0.8)',
              minWidth: '110px',
              textAlign: 'left',
              opacity: 1,
              fontSize: '28px',
              letterSpacing: '0.5px',
              fontWeight: 'bold',
            }}>
              {displayText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
