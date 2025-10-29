import { useEffect, useRef } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { PrizeIndicators } from './PrizeIndicators';
import { GameStats } from './GameStats';
import { StakeSelector } from './StakeSelector';
import { Volume2, VolumeX } from 'lucide-react';

const GRID_COLS = 7;
const GRID_ROWS = 14;
const CELL_SIZE = 60;
const CELL_SPACING = 3;
const GRID_WIDTH = GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_SPACING;
const GRID_HEIGHT = GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * CELL_SPACING;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const lastTimeRef = useRef(Date.now());
  
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
      
      drawGrid(ctx);
      drawPlacedBlocks(ctx, blocks);
      
      if (currentBlock && (phase === 'playing' || phase === 'demo')) {
        drawMovingBlock(ctx, currentBlock, currentBlockPosition);
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  const soundMode = useAudio(state => state.soundMode);
  const cycleSoundMode = useAudio(state => state.cycleSoundMode);
  const stake = useGame(state => state.stake);
  const credits = useGame(state => state.credits);
  const start = useGame(state => state.start);
  const stopBlock = useGame(state => state.stopBlock);
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
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      marginTop: '-80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      {/* Title Container */}
      <div style={{
        background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.65) 0%, rgba(50, 55, 65, 0.70) 15%, rgba(60, 65, 75, 0.75) 35%, rgba(55, 60, 70, 0.75) 50%, rgba(60, 65, 75, 0.75) 65%, rgba(50, 55, 65, 0.70) 85%, rgba(40, 45, 55, 0.65) 100%)',
        backdropFilter: 'blur(12px)',
        border: '3px solid #333',
        borderRadius: '12px',
        padding: '8px 16px',
        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 3px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3)',
        width: `${GRID_WIDTH + 80}px`,
        boxSizing: 'border-box'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ff0000',
          fontFamily: "'Digital-7 Mono', 'Digital-7', monospace",
          textShadow: `
            0 0 10px rgba(255, 0, 0, 0.6),
            0 0 20px rgba(255, 0, 0, 0.4),
            2px 2px 4px rgba(0, 0, 0, 0.8)
          `,
          letterSpacing: '12px',
          textAlign: 'center',
          lineHeight: '1',
          whiteSpace: 'nowrap'
        }}>
          FUNDORA BLOX
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={GRID_WIDTH + 140}
          height={GRID_HEIGHT + 20}
          style={{
            border: '4px solid #333',
            borderRadius: '20px',
            backgroundColor: '#373c48',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}
        />
        <PrizeIndicators />
        <GameStats />
      </div>
      
      {/* Footer bar docked underneath canvas */}
      <div style={{
        width: `${GRID_WIDTH + 80}px`,
        position: 'relative',
        background: 'linear-gradient(to bottom, rgba(40, 45, 55, 0.65) 0%, rgba(50, 55, 65, 0.70) 15%, rgba(60, 65, 75, 0.75) 35%, rgba(55, 60, 70, 0.75) 50%, rgba(60, 65, 75, 0.75) 65%, rgba(50, 55, 65, 0.70) 85%, rgba(40, 45, 55, 0.65) 100%)',
        backdropFilter: 'blur(12px)',
        border: '4px solid #333',
        borderRadius: '20px',
        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.1), inset 0 -1px 3px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3)',
        padding: '20px 15px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Sound toggle */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          flex: '0 0 auto'
        }}>
          <button
            {...handleTouchButton(cycleSoundMode)}
            style={{
              width: '45px',
              height: '70px',
              background: 'linear-gradient(to bottom, #e8e8e8 0%, #c0c0c0 50%, #a0a0a0 100%)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
              position: 'relative',
              padding: '6px'
            }}
          >
            <div style={{
              width: '33px',
              height: '42px',
              background: 'linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0 50%, #ffffff 100%)',
              borderRadius: '12px',
              boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: soundMode === 'MUTE' ? 'translateY(6px)' : 'translateY(-6px)',
              transition: 'transform 0.2s'
            }}>
              {soundMode === 'MUTE' ? (
                <VolumeX size={18} color="#666" strokeWidth={2} />
              ) : (
                <Volume2 size={18} color="#666" strokeWidth={2} />
              )}
            </div>
          </button>
          <div style={{
            fontSize: '8px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            textAlign: 'center',
            fontFamily: "'Roboto', sans-serif",
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            lineHeight: '1.2'
          }}>
            {soundMode === 'MUTE' && 'MUTE'}
            {soundMode === 'ALL_ON' && <>ALL ON</>}
            {soundMode === 'SE_OFF' && <>SE OFF<br/>BG ON</>}
            {soundMode === 'BG_OFF' && <>BG OFF<br/>SE ON</>}
          </div>
        </div>

        {/* Game button */}
        <div className="game-controls" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          flex: '1 1 auto',
          minWidth: 0
        }}>
          <button
            {...handleTouchButton(phase === 'ready' ? () => { start(); } : (phase === 'playing' ? stopBlock : () => {}))}
            disabled={phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits)}
            style={{
              padding: '8px 32px',
              minHeight: '50px',
              minWidth: '300px',
              fontSize: '22px',
              fontWeight: 'bold',
              background: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits))
                ? 'linear-gradient(to top, #999 0%, #666 100%)' 
                : 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits)) ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)',
              textTransform: 'uppercase',
              fontFamily: "'Roboto', sans-serif",
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (phase !== 'ended' && phase !== 'demo' && (phase !== 'ready' || stake === 'FREE' || stake <= credits)) {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff9999 0%, #ff6666 30%, #ee3333 70%, #aa0000 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,255,255,0.25), inset 0 2px 4px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (phase !== 'ended' && phase !== 'demo' && (phase !== 'ready' || stake === 'FREE' || stake <= credits)) {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.2), inset 0 2px 4px rgba(0,0,0,0.3)';
              }
            }}
          >
            {phase === 'ended' || phase === 'demo' ? 'PLEASE WAIT' : 
             phase === 'playing' ? 'STOP' :
             (stake !== 'FREE' && stake > credits) ? 'INSUFFICIENT CREDITS' : 'START'}
          </button>
          <div style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            STOP BLOCKS
          </div>
        </div>

        {/* Stake selector */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          flex: '0 0 auto'
        }}>
          <StakeSelector />
          <div style={{
            fontSize: '9px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            fontFamily: "'Roboto', sans-serif",
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>
            CHOOSE STAKE
          </div>
        </div>
      </div>
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  const offsetX = 70;
  const offsetY = 10;
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = offsetX + col * (CELL_SIZE + CELL_SPACING);
      const y = offsetY + (GRID_ROWS - 1 - row) * (CELL_SIZE + CELL_SPACING);
      
      if (row === 9 || row === 13) {
        ctx.fillStyle = '#4a5560';
        ctx.globalAlpha = 0.7;
      } else {
        ctx.fillStyle = '#6b7c8f';
        ctx.globalAlpha = 0.4;
      }
      
      drawRoundedRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.fill();
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

function drawPlacedBlocks(ctx: CanvasRenderingContext2D, blocks: any[]) {
  const offsetX = 70;
  const offsetY = 10;
  
  blocks.forEach((block) => {
    block.columns.forEach((isActive: boolean, colIndex: number) => {
      if (!isActive) return;
      
      const x = offsetX + colIndex * (CELL_SIZE + CELL_SPACING);
      const y = offsetY + (GRID_ROWS - 1 - block.row) * (CELL_SIZE + CELL_SPACING);
      
      const gradient = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
      gradient.addColorStop(0, '#dd4444');
      gradient.addColorStop(1, '#aa2222');
      
      ctx.fillStyle = gradient;
      drawRoundedRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.fill();
    });
  });
}

function drawMovingBlock(ctx: CanvasRenderingContext2D, block: any, position: number) {
  const offsetX = 70;
  const offsetY = 10;
  
  block.columns.forEach((isActive: boolean, colIndex: number) => {
    if (!isActive) return;
    
    const blockColumnPosition = position + colIndex;
    const gridColumn = Math.round(blockColumnPosition);
    
    if (gridColumn < 0 || gridColumn >= GRID_COLS) return;
    
    const x = offsetX + gridColumn * (CELL_SIZE + CELL_SPACING);
    const y = offsetY + (GRID_ROWS - 1 - block.row) * (CELL_SIZE + CELL_SPACING);
    
    const gradient = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
    gradient.addColorStop(0, '#ff5555');
    gradient.addColorStop(1, '#ff0000');
    
    ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  });
}

let demoTime = 0;
const DEMO_DURATION = 15;

const DEMO_SEQUENCE = [
  { row: 1, targetColumn: 3, stopTime: 1.5 },
  { row: 2, targetColumn: 3, stopTime: 3.0 },
  { row: 3, targetColumn: 3, stopTime: 4.5 },
  { row: 4, targetColumn: 4, stopTime: 6.0 },
  { row: 5, targetColumn: 3, stopTime: 7.5 },
  { row: 6, targetColumn: 3, stopTime: 9.0 },
  { row: 7, targetColumn: 2, stopTime: 10.5 },
  { row: 8, targetColumn: 3, stopTime: 12.0 },
];

function drawDemoMode(ctx: CanvasRenderingContext2D, delta: number) {
  const offsetX = 10;
  const offsetY = 10;
  
  demoTime += delta;
  if (demoTime > DEMO_DURATION) {
    demoTime = 0;
  }
  
  DEMO_SEQUENCE.forEach((block, index) => {
    const hasStarted = demoTime >= (block.stopTime - 1.5);
    const hasStopped = demoTime >= block.stopTime;
    
    if (!hasStarted) return;
    
    const x = offsetX + block.targetColumn * (CELL_SIZE + CELL_SPACING);
    const y = offsetY + (GRID_ROWS - 1 - block.row) * (CELL_SIZE + CELL_SPACING);
    
    if (hasStopped) {
      const gradient = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
      gradient.addColorStop(0, '#dd4444');
      gradient.addColorStop(1, '#aa2222');
      
      ctx.fillStyle = gradient;
      drawRoundedRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.fill();
    } else {
      const elapsedTime = demoTime - (block.stopTime - 1.5);
      const speed = 3;
      const distance = speed * elapsedTime;
      
      const startX = index % 2 === 0 ? 0 : GRID_COLS - 1;
      const direction = index % 2 === 0 ? 1 : -1;
      
      let currentCol = startX + direction * distance;
      
      while (currentCol < 0 || currentCol >= GRID_COLS) {
        if (currentCol < 0) currentCol = -currentCol;
        if (currentCol >= GRID_COLS) currentCol = 2 * (GRID_COLS - 1) - currentCol;
      }
      
      const timeUntilStop = block.stopTime - demoTime;
      if (timeUntilStop < 0.3) {
        const interpolation = 1 - (timeUntilStop / 0.3);
        currentCol = currentCol + (block.targetColumn - currentCol) * interpolation;
      }
      
      const animX = offsetX + currentCol * (CELL_SIZE + CELL_SPACING);
      
      const gradient = ctx.createLinearGradient(animX, y, animX, y + CELL_SIZE);
      gradient.addColorStop(0, '#ff5555');
      gradient.addColorStop(1, '#ff0000');
      
      ctx.fillStyle = gradient;
      drawRoundedRect(ctx, animX, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.fill();
    }
  });
}
