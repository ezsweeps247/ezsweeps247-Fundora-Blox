import { useRef, useEffect, useState } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { Volume2, VolumeX, ChevronUp, ChevronDown, Menu, X, Home } from 'lucide-react';

const GRID_COLS = 7;
const GRID_ROWS = 14;

const PRIZE_TIERS = [
  { minRow: 13, color: '#cc0000', multiplier: 100, cashMultiplier: 100, freePoints: 1600 },
  { minRow: 12, color: '#ff8800', multiplier: 10, cashMultiplier: 10, freePoints: 800 },
  { minRow: 11, color: '#cccc00', multiplier: 5, cashMultiplier: 5, freePoints: 400 },
  { minRow: 10, color: '#00cc66', multiplier: 2, cashMultiplier: 2, freePoints: 200 },
  { minRow: 9, color: '#9966ff', multiplier: 1, cashMultiplier: 1, freePoints: 100 },
  { minRow: 8, color: '#0099cc', multiplier: 0 },
  { minRow: 7, color: '#666666', multiplier: 0 },
  { minRow: 6, color: '#ffffff', multiplier: 0 },
];

function getPrizeTier(row: number) {
  for (const tier of PRIZE_TIERS) {
    if (row >= tier.minRow) {
      return tier;
    }
  }
  return PRIZE_TIERS[PRIZE_TIERS.length - 1];
}

const getFixedPoints = (row: number, stake: number | 'FREE'): number => {
  const stakeMultiplier = (stake === 'FREE' || stake === 0) ? 1 : stake;
  
  if (row === 8) return 75 * stakeMultiplier;
  if (row === 7) return 50 * stakeMultiplier;
  if (row === 6) return 25 * stakeMultiplier;
  return 0;
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function MobileGameLayout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef(Date.now());
  const [showStats, setShowStats] = useState(false);
  
  const phase = useGame(state => state.phase);
  const highestRow = useGame(state => state.highestRow);
  const stake = useGame(state => state.stake);
  const credits = useGame(state => state.credits);
  const bonusPoints = useGame(state => state.bonusPoints);
  const start = useGame(state => state.start);
  const stopBlock = useGame(state => state.stopBlock);
  const cycleStake = useGame(state => state.cycleStake);
  const restart = useGame(state => state.restart);
  const soundMode = useAudio(state => state.soundMode);
  const cycleSoundMode = useAudio(state => state.cycleSoundMode);
  
  // Calculate dimensions based on viewport
  const [dimensions, setDimensions] = useState({
    cellSize: 40,
    cellSpacing: 2,
    padding: 5,
    canvasWidth: 300,
    canvasHeight: 600,
  });

  useEffect(() => {
    const calculateDimensions = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Reserve space for top bar (60px) and bottom controls (120px)
      const availableHeight = vh - 180;
      const availableWidth = vw - 20; // 10px padding on each side
      
      // Calculate cell size to fit the game board
      const maxCellWidth = availableWidth / (GRID_COLS + (GRID_COLS - 1) * 0.05);
      const maxCellHeight = availableHeight / (GRID_ROWS + (GRID_ROWS - 1) * 0.05);
      
      const cellSize = Math.floor(Math.min(maxCellWidth, maxCellHeight, 60));
      const cellSpacing = Math.max(1, Math.floor(cellSize * 0.05));
      const padding = 5;
      
      const canvasWidth = GRID_COLS * cellSize + (GRID_COLS - 1) * cellSpacing + (padding * 2);
      const canvasHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellSpacing + (padding * 2);
      
      setDimensions({ cellSize, cellSpacing, padding, canvasWidth, canvasHeight });
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    window.addEventListener('orientationchange', calculateDimensions);
    
    return () => {
      window.removeEventListener('resize', calculateDimensions);
      window.removeEventListener('orientationchange', calculateDimensions);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const render = () => {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      
      const state = useGame.getState();
      const { phase, updateBlockPosition, blocks, currentBlock, currentBlockPosition } = state;
      
      if (phase === 'playing' || phase === 'demo') {
        updateBlockPosition(delta);
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawGrid(ctx, dimensions);
      drawPlacedBlocks(ctx, blocks, dimensions);
      
      if (currentBlock && (phase === 'playing' || phase === 'demo')) {
        drawMovingBlock(ctx, currentBlock, currentBlockPosition, dimensions);
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  // Get current prize display
  const getCurrentPrizeDisplay = () => {
    const row = Math.max(highestRow + 1, 6); // Show next row prize or minimum row 6
    const tier = getPrizeTier(row);
    const isFreeMode = stake === 'FREE';
    const stakeAmount = typeof stake === 'number' ? stake : 0;
    
    let displayText = '';
    
    if (row <= 8) {
      const points = getFixedPoints(row, stake);
      displayText = points % 1 === 0 ? `${points}P` : `${points.toFixed(1)}P`;
    } 
    else if (row === 9 && isFreeMode) {
      displayText = '100P';
    }
    else if (row >= 10 && isFreeMode && 'freePoints' in tier) {
      displayText = `${tier.freePoints}P`;
    }
    else if ('cashMultiplier' in tier && tier.cashMultiplier !== undefined) {
      const prizeAmount = stakeAmount * tier.cashMultiplier;
      displayText = `$${prizeAmount.toFixed(2)}`;
    }
    
    return { text: displayText, color: tier.color, row };
  };

  const currentPrize = getCurrentPrizeDisplay();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    }}>
      {/* Top Bar with Prize Indicator */}
      <div style={{
        height: '60px',
        background: 'linear-gradient(180deg, rgba(80,80,85,0.95) 0%, rgba(50,50,55,0.95) 45%, rgba(35,35,40,0.95) 55%, rgba(25,25,30,0.98) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 4px 30px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(0,0,0,0.3)',
        display: 'grid',
        gridTemplateColumns: '50px 1fr 50px',
        alignItems: 'center',
        padding: '0 10px',
        position: 'relative',
        gap: '8px',
      }}>
        {/* Home Button */}
        <button
          onClick={restart}
          style={{
            background: 'linear-gradient(145deg, rgba(60,60,65,0.8), rgba(40,40,45,0.8))',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: '#fff',
            width: '40px',
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Home size={20} />
        </button>
        
        {/* Center: Title and Prize */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}>
          {/* Title */}
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ff0000',
            fontFamily: "'Digital-7 Mono', monospace",
            letterSpacing: '1.5px',
            textShadow: '0 0 8px rgba(255, 0, 0, 0.5)',
            lineHeight: '1',
          }}>
            FUNDORA BLOX
          </div>
          
          {/* Current Prize Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 10px',
            borderRadius: '12px',
            border: `1px solid ${currentPrize.color}`,
          }}>
            <div style={{
              fontSize: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 'bold',
            }}>
              ROW {currentPrize.row}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: currentPrize.color,
              textShadow: `0 0 4px ${currentPrize.color}`,
            }}>
              {currentPrize.text}
            </div>
          </div>
        </div>
        
        {/* Stats Toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            padding: '5px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {showStats ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Stats Overlay */}
      {showStats && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          background: 'linear-gradient(135deg, rgba(70,70,75,0.98) 0%, rgba(45,45,50,0.98) 50%, rgba(30,30,35,0.98) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          padding: '15px',
          borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
          borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
          borderBottomLeftRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)',
          zIndex: 100,
          minWidth: '150px',
        }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: '#999' }}>CREDITS</div>
            <div style={{ fontSize: '20px', color: '#ff0000', fontWeight: 'bold' }}>
              ${credits.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#999' }}>BONUS POINTS</div>
            <div style={{ fontSize: '20px', color: '#ffaa00', fontWeight: 'bold' }}>
              {formatNumber(bonusPoints)}P
            </div>
          </div>
        </div>
      )}
      
      {/* Game Canvas Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10px',
        overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          width={dimensions.canvasWidth}
          height={dimensions.canvasHeight}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backgroundColor: '#b8bcc8',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            touchAction: 'none',
          }}
        />
      </div>
      
      {/* Bottom Control Panel */}
      <div style={{
        height: '120px',
        background: 'linear-gradient(0deg, rgba(80,80,85,0.95) 0%, rgba(50,50,55,0.95) 45%, rgba(35,35,40,0.95) 55%, rgba(25,25,30,0.98) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '2px solid rgba(255, 255, 255, 0.2)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(0,0,0,0.3)',
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: '10px',
        padding: '10px',
        alignItems: 'center',
      }}>
        {/* Sound Control */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
        }}>
          <button
            onClick={cycleSoundMode}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #2a2a3e, #1a1a2e)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            {soundMode === 'MUTE' ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <div style={{
            fontSize: '9px',
            color: '#999',
            textAlign: 'center',
          }}>
            {soundMode === 'MUTE' ? 'MUTED' : 'SOUND'}
          </div>
        </div>
        
        {/* Main Button */}
        <button
          onClick={phase === 'ready' ? start : (phase === 'playing' ? stopBlock : () => {})}
          disabled={phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits)}
          style={{
            height: '60px',
            fontSize: '20px',
            fontWeight: 'bold',
            background: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits))
              ? 'linear-gradient(145deg, #666, #444)'
              : phase === 'playing'
              ? 'linear-gradient(145deg, #ff6b6b, #ff4444)'
              : 'linear-gradient(145deg, #44ff44, #00cc00)',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            cursor: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits))
              ? 'not-allowed' 
              : 'pointer',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {phase === 'ended' || phase === 'demo' ? 'WAIT' : 
           phase === 'playing' ? 'STOP' :
           (stake !== 'FREE' && stake > credits) ? 'NO $$' : 'START'}
        </button>
        
        {/* Stake Control */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}>
          <button
            onClick={() => cycleStake('up')}
            disabled={phase !== 'ready'}
            style={{
              width: '50px',
              height: '25px',
              background: phase === 'ready' ? '#ff8800' : '#666',
              border: 'none',
              borderRadius: '5px 5px 0 0',
              color: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronUp size={16} />
          </button>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 8px',
            fontSize: '14px',
            color: stake === 'FREE' ? '#ffaa00' : '#00ff00',
            fontWeight: 'bold',
          }}>
            {stake === 'FREE' ? 'FREE' : `$${stake}`}
          </div>
          <button
            onClick={() => cycleStake('down')}
            disabled={phase !== 'ready'}
            style={{
              width: '50px',
              height: '25px',
              background: phase === 'ready' ? '#ff8800' : '#666',
              border: 'none',
              borderRadius: '0 0 5px 5px',
              color: '#fff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: phase === 'ready' ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Drawing functions
function drawGrid(ctx: CanvasRenderingContext2D, dimensions: any) {
  const { cellSize, cellSpacing, padding } = dimensions;
  const offsetX = padding;
  const offsetY = padding;
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = offsetX + col * (cellSize + cellSpacing);
      const y = offsetY + (GRID_ROWS - 1 - row) * (cellSize + cellSpacing);
      
      if (row === 9 || row === 13) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.globalAlpha = 1.0;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.globalAlpha = 0.8;
      }
      
      const radius = Math.min(8, cellSize * 0.2);
      drawRoundedRect(ctx, x, y, cellSize, cellSize, radius);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.globalAlpha = 1.0;
    }
  }
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPlacedBlocks(ctx: CanvasRenderingContext2D, blocks: any[], dimensions: any) {
  const { cellSize, cellSpacing, padding } = dimensions;
  const offsetX = padding;
  const offsetY = padding;
  
  blocks.forEach((block) => {
    block.columns.forEach((isActive: boolean, colIndex: number) => {
      if (!isActive) return;
      
      const x = offsetX + colIndex * (cellSize + cellSpacing);
      const y = offsetY + (GRID_ROWS - 1 - block.row) * (cellSize + cellSpacing);
      
      const gradient = ctx.createLinearGradient(x, y, x, y + cellSize);
      gradient.addColorStop(0, '#dd4444');
      gradient.addColorStop(1, '#aa2222');
      
      ctx.fillStyle = gradient;
      const radius = Math.min(8, cellSize * 0.2);
      drawRoundedRect(ctx, x, y, cellSize, cellSize, radius);
      ctx.fill();
    });
  });
}

function drawMovingBlock(ctx: CanvasRenderingContext2D, block: any, position: number, dimensions: any) {
  const { cellSize, cellSpacing, padding } = dimensions;
  const offsetX = padding;
  const offsetY = padding;
  
  block.columns.forEach((isActive: boolean, colIndex: number) => {
    if (!isActive) return;
    
    const blockColumnPosition = position + colIndex;
    const gridColumn = Math.round(blockColumnPosition);
    
    if (gridColumn < 0 || gridColumn >= GRID_COLS) return;
    
    const x = offsetX + gridColumn * (cellSize + cellSpacing);
    const y = offsetY + (GRID_ROWS - 1 - block.row) * (cellSize + cellSpacing);
    
    const gradient = ctx.createLinearGradient(x, y, x, y + cellSize);
    gradient.addColorStop(0, '#ff5555');
    gradient.addColorStop(1, '#ff0000');
    
    ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    
    ctx.fillStyle = gradient;
    const radius = Math.min(8, cellSize * 0.2);
    drawRoundedRect(ctx, x, y, cellSize, cellSize, radius);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  });
}