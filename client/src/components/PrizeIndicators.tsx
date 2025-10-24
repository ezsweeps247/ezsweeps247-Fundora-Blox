import { useGame } from '@/lib/stores/useGame';

const GRID_ROWS = 16;
const CELL_SIZE = 38;
const CELL_SPACING = 2;

const PRIZE_TIERS = [
  { minRow: 15, color: '#cc0000', multiplier: 100, type: 'cash', bgColor: 'rgba(204, 0, 0, 0.2)' },
  { minRow: 12, color: '#ff6600', multiplier: 10, type: 'cash', bgColor: 'rgba(255, 102, 0, 0.2)' },
  { minRow: 9, color: '#ffcc00', multiplier: 5, type: 'cash', bgColor: 'rgba(255, 204, 0, 0.2)' },
  { minRow: 6, color: '#00cc66', multiplier: 2, type: 'cash', bgColor: 'rgba(0, 204, 102, 0.2)' },
  { minRow: 3, color: '#0099cc', multiplier: 1, type: 'cash', bgColor: 'rgba(0, 153, 204, 0.2)' },
  { minRow: 2, color: '#666666', multiplier: 1000, type: 'points', bgColor: 'rgba(102, 102, 102, 0.1)' },
  { minRow: 1, color: '#666666', multiplier: 500, type: 'points', bgColor: 'rgba(102, 102, 102, 0.1)' },
  { minRow: 0, color: '#666666', multiplier: 250, type: 'points', bgColor: 'rgba(102, 102, 102, 0.1)' },
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
  
  const displayedRows = [15, 12, 9, 6, 3, 2, 1, 0];
  
  return (
    <div style={{
      position: 'absolute',
      right: '-160px',
      top: '20px',
      width: '140px',
      fontFamily: "'Arial', sans-serif",
      fontWeight: 'bold',
      fontSize: '16px',
    }}>
      {displayedRows.map((row) => {
        const tier = getPrizeTier(row);
        const yPosition = (GRID_ROWS - 1 - row) * (CELL_SIZE + CELL_SPACING);
        
        let displayText = '';
        let showArrow = false;
        
        if (isFreeMode) {
          displayText = `${tier.multiplier} P`;
          showArrow = true;
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
            {showArrow && (
              <div style={{
                width: 0,
                height: 0,
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent',
                borderLeft: `12px solid ${tier.color}`,
                opacity: isActive ? 1 : 0.5,
              }} />
            )}
            <div style={{
              backgroundColor: !isFreeMode && tier.type === 'cash' ? tier.bgColor : 'transparent',
              color: tier.color,
              padding: '4px 8px',
              borderRadius: '4px',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
              minWidth: '90px',
              textAlign: 'left',
              opacity: isActive ? 1 : 0.5,
              border: !isFreeMode && tier.type === 'cash' ? `2px solid ${tier.color}` : 'none',
            }}>
              {displayText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
