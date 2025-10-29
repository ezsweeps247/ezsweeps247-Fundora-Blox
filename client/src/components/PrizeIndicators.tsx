import { useGame } from '@/lib/stores/useGame';

const GRID_ROWS = 14;
const CELL_SIZE = 48;
const CELL_SPACING = 2;

const PRIZE_TIERS = [
  { minRow: 13, color: '#cc0000', multiplier: 100, type: 'cash', textColor: '#fff' },
  { minRow: 12, color: '#ff8800', multiplier: 10, type: 'cash', textColor: '#fff' },
  { minRow: 11, color: '#cccc00', multiplier: 5, type: 'cash', textColor: '#000' },
  { minRow: 10, color: '#00cc66', multiplier: 2, type: 'cash', textColor: '#000' },
  { minRow: 9, color: '#0099cc', multiplier: 0, type: 'points', textColor: '#fff' },
  { minRow: 8, color: '#333333', multiplier: 0, type: 'points', textColor: '#fff' },
  { minRow: 7, color: '#666666', multiplier: 0, type: 'points', textColor: '#fff' },
];

// Get stake-dependent point values for rows 7-9
const getStakeDependentPoints = (row: number, stake: number | 'FREE'): number => {
  const stakeAmount = typeof stake === 'number' ? stake : 0;
  
  if (row >= 9) {
    // Row 9
    if (stakeAmount >= 20) return 700;
    if (stakeAmount >= 10) return 500;
    if (stakeAmount >= 5) return 350;
    if (stakeAmount >= 2) return 200;
    return 150; // $1 or FREE
  }
  
  if (row >= 8) {
    // Row 8
    if (stakeAmount >= 20) return 650;
    if (stakeAmount >= 10) return 450;
    if (stakeAmount >= 5) return 300;
    if (stakeAmount >= 2) return 150;
    return 100; // $1 or FREE
  }
  
  if (row >= 7) {
    // Row 7
    if (stakeAmount >= 20) return 600;
    if (stakeAmount >= 10) return 400;
    if (stakeAmount >= 5) return 250;
    if (stakeAmount >= 2) return 100;
    return 25; // $1 or FREE
  }
  
  return 0;
};

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
  
  const displayedRows = [13, 12, 11, 10, 9, 8, 7]; // Removed row 6 - it no longer gives prizes
  
  // Detect mobile for responsive sizing
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 900 || window.innerHeight < 900);
  
  const containerHeight = displayedRows.length * (CELL_SIZE + CELL_SPACING);
  
  return (
    <div style={{
      position: 'absolute',
      right: 'calc(100% + 10px)',
      top: '10px',
      background: 'linear-gradient(to bottom, rgba(245, 245, 245, 0.95) 0%, rgba(235, 235, 235, 0.95) 100%)',
      backdropFilter: 'blur(10px)',
      border: '3px solid #333',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      width: isMobile ? '180px' : '230px',
      fontFamily: "'Arial Black', sans-serif",
      fontWeight: 'bold',
      fontSize: isMobile ? '14px' : '18px',
      transform: isMobile ? 'scale(0.8)' : 'none',
      transformOrigin: 'right top'
    }}>
      <div style={{
        position: 'relative',
        height: `${containerHeight}px`
      }}>
        {displayedRows.map((row) => {
          const tier = getPrizeTier(row);
          const yPosition = (GRID_ROWS - 1 - row) * (CELL_SIZE + CELL_SPACING);
          
          let displayText = '';
          
          if (tier.type === 'points') {
            // For rows 7-9, use stake-dependent points
            const points = getStakeDependentPoints(row, stake);
            displayText = `${points.toLocaleString()} P`;
          } else {
            const prizeAmount = stakeAmount * tier.multiplier;
            displayText = `$${prizeAmount.toFixed(2)}`;
          }
          
          const isActive = highestRow >= row;
          
          return (
            <div
              key={row}
              style={{
                position: 'absolute',
                top: `${yPosition}px`,
                right: 0,
                height: `${CELL_SIZE}px`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                flexDirection: 'row-reverse',
              }}
            >
              <div style={{
                width: 0,
                height: 0,
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: `12px solid ${tier.color}`,
                opacity: 1,
              }} />
              <div style={{
                color: tier.color,
                padding: isMobile ? '4px 8px' : '6px 12px',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.9)',
                minWidth: isMobile ? '80px' : '110px',
                textAlign: 'right',
                opacity: 1,
                fontSize: isMobile ? '28px' : '36px',
                letterSpacing: '0.5px',
                fontWeight: 'bold',
                WebkitTextStroke: tier.type === 'cash' ? '0.5px rgba(0, 0, 0, 0.4)' : 'none',
              }}>
                {displayText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
