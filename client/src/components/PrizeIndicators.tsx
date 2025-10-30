import { useGame } from '@/lib/stores/useGame';

const GRID_ROWS = 14;
const CELL_SIZE = 85;
const CELL_SPACING = 5;

const PRIZE_TIERS = [
  { minRow: 13, color: '#cc0000', multiplier: 100, cashMultiplier: 100, freePoints: 1600, textColor: '#fff' },
  { minRow: 12, color: '#ff8800', multiplier: 10, cashMultiplier: 10, freePoints: 800, textColor: '#fff' },
  { minRow: 11, color: '#cccc00', multiplier: 5, cashMultiplier: 5, freePoints: 400, textColor: '#000' },
  { minRow: 10, color: '#00cc66', multiplier: 2, cashMultiplier: 2, freePoints: 200, textColor: '#000' },
  { minRow: 9, color: '#9966ff', multiplier: 1, cashMultiplier: 1, freePoints: 100, textColor: '#fff' },
  { minRow: 8, color: '#0099cc', multiplier: 0, textColor: '#fff' },
  { minRow: 7, color: '#666666', multiplier: 0, textColor: '#fff' },
  { minRow: 6, color: '#ffffff', multiplier: 0, textColor: '#fff' },
];

// Get fixed point values for rows 6-8, scaled by stake
const getFixedPoints = (row: number, stake: number | 'FREE'): number => {
  const stakeMultiplier = (stake === 'FREE' || stake === 0) ? 1 : stake;
  
  if (row === 8) return 75 * stakeMultiplier;
  if (row === 7) return 50 * stakeMultiplier;
  if (row === 6) return 25 * stakeMultiplier;
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
  
  const displayedRows = [13, 12, 11, 10, 9, 8, 7, 6];
  
  // Detect mobile for responsive sizing
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 900 || window.innerHeight < 900);
  
  const containerHeight = displayedRows.length * (CELL_SIZE + CELL_SPACING);
  
  const CANVAS_OFFSET_Y = 20;
  const BORDER_ADJUSTMENT = -16;
  
  return (
    <div style={{
      position: 'absolute',
      right: 'calc(100% + 15px)',
      top: `${CANVAS_OFFSET_Y + BORDER_ADJUSTMENT}px`,
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(16px) saturate(180%)',
      border: '4px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '20px',
      padding: '20px 26px',
      boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.5)',
      width: isMobile ? '280px' : '340px',
      fontFamily: "'Arial Black', sans-serif",
      fontWeight: 'bold',
      fontSize: isMobile ? '20px' : '26px',
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
          
          // Rows 6-8 are always points
          if (row <= 8) {
            // For rows 6-8, use fixed points scaled by stake
            const points = getFixedPoints(row, stake);
            displayText = points % 1 === 0 ? `${points}P` : `${points.toFixed(1)}P`;
          } 
          // Row 9 for FREE mode
          else if (row === 9 && isFreeMode) {
            displayText = '100P';
          }
          // Rows 10-13 for FREE mode show points
          else if (row >= 10 && isFreeMode && 'freePoints' in tier) {
            displayText = `${tier.freePoints}P`;
          }
          // Paid games show cash
          else if ('cashMultiplier' in tier && tier.cashMultiplier !== undefined) {
            const prizeAmount = stakeAmount * tier.cashMultiplier;
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
                justifyContent: 'flex-end',
                gap: '6px',
                transition: 'all 0.3s ease',
                flexDirection: 'row-reverse',
              }}
            >
              <div style={{
                width: 0,
                height: 0,
                borderTop: '14px solid transparent',
                borderBottom: '14px solid transparent',
                borderRight: `22px solid ${tier.color}`,
                opacity: 1,
                flexShrink: 0,
              }} />
              <div style={{
                color: tier.color,
                padding: 0,
                margin: 0,
                textShadow: '2px 2px 3px rgba(0, 0, 0, 0.9)',
                minWidth: isMobile ? '100px' : '130px',
                textAlign: 'right',
                opacity: 1,
                fontSize: isMobile ? '32px' : '40px',
                letterSpacing: '0.5px',
                fontWeight: 'bold',
                WebkitTextStroke: (row >= 10 && !isFreeMode) ? '0.5px rgba(0, 0, 0, 0.4)' : 'none',
                lineHeight: '1',
                height: 'auto',
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
