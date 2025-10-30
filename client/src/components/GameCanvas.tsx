import { useEffect, useRef } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { useAudio } from '@/lib/stores/useAudio';
import { PrizeIndicators } from './PrizeIndicators';
import { GameStats } from './GameStats';
import { StakeSelector } from './StakeSelector';
import { Volume2, VolumeX } from 'lucide-react';

const GRID_COLS = 7;
const GRID_ROWS = 14;
const CELL_SIZE = 85;
const CELL_SPACING = 5;
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
      marginTop: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      {/* Title Container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '4px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '10px 20px',
        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.5)',
        width: `${GRID_WIDTH + 60}px`,
        boxSizing: 'border-box'
      }}>
        <div style={{
          fontSize: '62px',
          fontWeight: 'bold',
          color: '#ff0000',
          fontFamily: "'Digital-7 Mono', 'Digital-7', monospace",
          textShadow: `
            0 0 14px rgba(255, 0, 0, 0.6),
            0 0 28px rgba(255, 0, 0, 0.4),
            3px 3px 6px rgba(0, 0, 0, 0.8)
          `,
          letterSpacing: '16px',
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
          width={GRID_WIDTH + 60}
          height={GRID_HEIGHT + 40}
          style={{
            border: '4px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.05)'
          }}
        />
        <PrizeIndicators />
        <GameStats />
      </div>
      
      {/* Footer bar docked underneath canvas */}
      <div style={{
        width: `${GRID_WIDTH + 60}px`,
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '4px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.5)',
        padding: '20px 15px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
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
              width: '64px',
              height: '100px',
              background: 'linear-gradient(to bottom, #e8e8e8 0%, #c0c0c0 50%, #a0a0a0 100%)',
              border: 'none',
              borderRadius: '22px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.3), inset 0 -3px 6px rgba(255,255,255,0.5), 0 6px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
              position: 'relative',
              padding: '8px'
            }}
          >
            <div style={{
              width: '48px',
              height: '60px',
              background: 'linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0 50%, #ffffff 100%)',
              borderRadius: '16px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 2px 3px rgba(255,255,255,0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: soundMode === 'MUTE' ? 'translateY(8px)' : 'translateY(-8px)',
              transition: 'transform 0.2s'
            }}>
              {soundMode === 'MUTE' ? (
                <VolumeX size={26} color="#666" strokeWidth={2} />
              ) : (
                <Volume2 size={26} color="#666" strokeWidth={2} />
              )}
            </div>
          </button>
          <div style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            textAlign: 'center',
            fontFamily: "'Roboto', sans-serif",
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            lineHeight: '1.3'
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
          flex: '0 0 auto'
        }}>
          <button
            {...handleTouchButton(phase === 'ready' ? () => { start(); } : (phase === 'playing' ? stopBlock : () => {}))}
            disabled={phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits)}
            style={{
              padding: '10px 34px',
              minHeight: '62px',
              minWidth: '370px',
              fontSize: '28px',
              fontWeight: 'bold',
              background: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits))
                ? 'linear-gradient(to top, #999 0%, #666 100%)' 
                : 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '35px',
              cursor: (phase === 'ended' || phase === 'demo' || (phase === 'ready' && stake !== 'FREE' && stake > credits)) ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 12px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(255,255,255,0.2), inset 0 3px 6px rgba(0,0,0,0.3)',
              textTransform: 'uppercase',
              fontFamily: "'Roboto', sans-serif",
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (phase !== 'ended' && phase !== 'demo' && (phase !== 'ready' || stake === 'FREE' || stake <= credits)) {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff9999 0%, #ff6666 30%, #ee3333 70%, #aa0000 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(255,255,255,0.25), inset 0 3px 6px rgba(0,0,0,0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (phase !== 'ended' && phase !== 'demo' && (phase !== 'ready' || stake === 'FREE' || stake <= credits)) {
                e.currentTarget.style.background = 'linear-gradient(to top, #ff8888 0%, #ff5555 30%, #dd2222 70%, #990000 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(255,255,255,0.2), inset 0 3px 6px rgba(0,0,0,0.3)';
              }
            }}
          >
            {phase === 'ended' || phase === 'demo' ? 'PLEASE WAIT' : 
             phase === 'playing' ? 'STOP' :
             (stake !== 'FREE' && stake > credits) ? 'INSUFFICIENT CREDITS' : 'START'}
          </button>
          <div style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.7px',
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
            fontSize: '13px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.8)',
            textTransform: 'uppercase',
            letterSpacing: '0.7px',
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
  const offsetX = 30;
  const offsetY = 20;
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = offsetX + col * (CELL_SIZE + CELL_SPACING);
      const y = offsetY + (GRID_ROWS - 1 - row) * (CELL_SIZE + CELL_SPACING);
      
      if (row === 9 || row === 13) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.globalAlpha = 0.9;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.globalAlpha = 0.7;
      }
      
      drawRoundedRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
      ctx.fill();
      
      // Add subtle border for glass effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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

function drawPlacedBlocks(ctx: CanvasRenderingContext2D, blocks: any[]) {
  const offsetX = 30;
  const offsetY = 20;
  
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
  const offsetX = 30;
  const offsetY = 20;
  
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
