import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "playing" | "ended" | "demo";

export interface Block {
  row: number;
  columns: boolean[];
}

interface GameState {
  phase: GamePhase;
  blocks: Block[];
  currentBlock: Block | null;
  currentBlockPosition: number;
  movementDirection: number;
  movementSpeed: number;
  score: number;
  credits: number;
  bonusPoints: number;
  stake: number | 'FREE';
  availableStakes: (number | 'FREE')[];
  highestRow: number;
  blocksStacked: number;
  comboMultiplier: number;
  comboStreak: number;
  perfectAlignments: number;
  lastPlacedBlock: { row: number; columns: number[]; isPerfect: boolean } | null;
  demoAutoStopTimer: NodeJS.Timeout | null;
  
  setStake: (stake: number | 'FREE') => void;
  cycleStake: (direction: 'up' | 'down') => void;
  getPotentialPrize: () => { amount: number; type: 'cash' | 'points' };
  calculatePrizeMultiplier: (row: number, stake: number | 'FREE') => { multiplier: number; type: 'cash' | 'points' };
  start: () => void;
  startDemo: () => void;
  restart: () => void;
  end: () => void;
  stopBlock: () => void;
  updateBlockPosition: (delta: number) => void;
  spawnNewBlock: () => void;
}

const GRID_WIDTH = 7;
const BASE_SPEED = 2.5;
const MIN_SPEED_INCREMENT = 0.25;
const MAX_SPEED_INCREMENT = 0.45;

// Helper function to get point prize multiplier based on stake
const getPointMultiplier = (stake: number | 'FREE'): number => {
  if (stake === 'FREE') return 1;
  if (stake === 0.5) return 0.2;
  if (stake === 1) return 1;
  if (stake === 2) return 2;
  if (stake === 5) return 4;
  if (stake === 10) return 20;
  if (stake === 20) return 80;
  return 1;
};

// Helper function to get speed multiplier based on stake
// Higher stakes = faster blocks = more challenging
const getStakeSpeedMultiplier = (stake: number | 'FREE'): number => {
  if (stake === 'FREE') return 0.8;  // Easier
  if (stake === 0.5) return 0.9;     // Slightly easier
  if (stake === 1) return 1.2;       // Faster
  if (stake === 2) return 1.25;      // Slightly faster
  if (stake === 5) return 1.5;       // Quite challenging
  if (stake === 10) return 1.7;      // Really challenging
  if (stake === 20) return 2.0;      // Extremely challenging
  return 1.0;
};

export const useGame = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: "ready",
    blocks: [],
    currentBlock: null,
    currentBlockPosition: 0,
    movementDirection: 1,
    movementSpeed: BASE_SPEED,
    score: 0,
    credits: 100,
    bonusPoints: 0,
    stake: 1,
    availableStakes: ['FREE', 0.5, 1, 2, 5, 10, 20],
    highestRow: 0,
    blocksStacked: 0,
    comboMultiplier: 1,
    comboStreak: 0,
    perfectAlignments: 0,
    lastPlacedBlock: null,
    demoAutoStopTimer: null,
    
    setStake: (stake: number | 'FREE') => {
      const state = get();
      if (state.phase === "ready") {
        if (stake === 'FREE' || stake <= state.credits) {
          console.log(`Stake set to: ${stake === 'FREE' ? 'FREE MODE' : `$${stake}`}`);
          set({ stake });
        }
      }
    },
    
    cycleStake: (direction: 'up' | 'down') => {
      const state = get();
      if (state.phase !== "ready") return;
      
      const currentIndex = state.availableStakes.indexOf(state.stake);
      let newIndex;
      
      if (direction === 'up') {
        newIndex = currentIndex < state.availableStakes.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : state.availableStakes.length - 1;
      }
      
      const newStake = state.availableStakes[newIndex];
      if (newStake === 'FREE' || newStake <= state.credits) {
        set({ stake: newStake });
      }
    },
    
    calculatePrizeMultiplier: (row: number, stake: number | 'FREE') => {
      // Rows 10+ are cash prizes (unchanged)
      if (row >= 13) return { multiplier: 100, type: 'cash' as const };
      if (row >= 12) return { multiplier: 10, type: 'cash' as const };
      if (row >= 11) return { multiplier: 5, type: 'cash' as const };
      if (row >= 10) return { multiplier: 2, type: 'cash' as const };
      
      // Rows 7-9: Custom points based on stake
      const stakeAmount = typeof stake === 'number' ? stake : 0;
      
      if (row >= 9) {
        // Row 9 points by stake
        if (stakeAmount >= 20) return { multiplier: 700, type: 'points' as const };
        if (stakeAmount >= 10) return { multiplier: 500, type: 'points' as const };
        if (stakeAmount >= 5) return { multiplier: 350, type: 'points' as const };
        if (stakeAmount >= 2) return { multiplier: 200, type: 'points' as const };
        if (stakeAmount >= 1) return { multiplier: 150, type: 'points' as const };
        return { multiplier: 150, type: 'points' as const }; // FREE mode gets same as $1
      }
      
      if (row >= 8) {
        // Row 8 points by stake
        if (stakeAmount >= 20) return { multiplier: 650, type: 'points' as const };
        if (stakeAmount >= 10) return { multiplier: 450, type: 'points' as const };
        if (stakeAmount >= 5) return { multiplier: 300, type: 'points' as const };
        if (stakeAmount >= 2) return { multiplier: 150, type: 'points' as const };
        if (stakeAmount >= 1) return { multiplier: 100, type: 'points' as const };
        return { multiplier: 100, type: 'points' as const }; // FREE mode gets same as $1
      }
      
      if (row >= 7) {
        // Row 7 points by stake
        if (stakeAmount >= 20) return { multiplier: 600, type: 'points' as const };
        if (stakeAmount >= 10) return { multiplier: 400, type: 'points' as const };
        if (stakeAmount >= 5) return { multiplier: 250, type: 'points' as const };
        if (stakeAmount >= 2) return { multiplier: 100, type: 'points' as const };
        if (stakeAmount >= 1) return { multiplier: 25, type: 'points' as const };
        return { multiplier: 25, type: 'points' as const }; // FREE mode gets same as $1
      }
      
      return { multiplier: 0, type: 'points' as const };
    },
    
    getPotentialPrize: () => {
      const state = get();
      const prizeInfo = state.calculatePrizeMultiplier(state.highestRow, state.stake);
      
      const stakeAmount = typeof state.stake === 'number' ? state.stake : 0;
      
      if (prizeInfo.type === 'cash') {
        return { amount: stakeAmount * prizeInfo.multiplier, type: 'cash' as const };
      } else {
        // For rows 7-9, the multiplier IS the point amount (no additional multiplication)
        return { amount: prizeInfo.multiplier, type: 'points' as const };
      }
    },
    
    start: () => {
      const state = get();
      
      // Clear any demo auto-stop timer
      if (state.demoAutoStopTimer) {
        clearTimeout(state.demoAutoStopTimer);
      }
      
      if (state.stake !== 'FREE' && state.stake > state.credits) {
        console.log("Insufficient credits!");
        return;
      }
      
      const isFreeMode = state.stake === 'FREE';
      const stakeAmount = typeof state.stake === 'number' ? state.stake : 0;
      const newCredits = isFreeMode ? state.credits : state.credits - stakeAmount;
      
      // Randomize first block starting position (columns 0-4 as start, 3-wide block)
      const randomStart = Math.floor(Math.random() * 5); // 0, 1, 2, 3, or 4
      const startCol = randomStart;
      const endCol = randomStart + 2; // 3-column wide block
      
      console.log(`Game started! Stake: ${isFreeMode ? 'FREE MODE' : `$${state.stake}`}, Credits: $${newCredits}, First block: columns ${startCol}-${endCol}`);
      
      set({
        phase: "playing",
        credits: newCredits,
        blocks: [{
          row: 0,
          columns: Array(GRID_WIDTH).fill(false).map((_, i) => i >= startCol && i <= endCol)
        }],
        currentBlock: null,
        currentBlockPosition: 0,
        movementDirection: 1,
        movementSpeed: BASE_SPEED,
        score: 0,
        bonusPoints: 0,
        highestRow: 0,
        blocksStacked: 0,
        comboMultiplier: 1,
        comboStreak: 0,
        perfectAlignments: 0,
        lastPlacedBlock: null,
        demoAutoStopTimer: null,
      });
      
      setTimeout(() => {
        get().spawnNewBlock();
      }, 500);
    },
    
    startDemo: () => {
      console.log("🎮 Starting demo mode...");
      
      // Randomize first block starting position (columns 0-4 as start, 3-wide block)
      const randomStart = Math.floor(Math.random() * 5); // 0, 1, 2, 3, or 4
      const startCol = randomStart;
      const endCol = randomStart + 2; // 3-column wide block
      
      set({
        phase: "demo",
        blocks: [{
          row: 0,
          columns: Array(GRID_WIDTH).fill(false).map((_, i) => i >= startCol && i <= endCol)
        }],
        currentBlock: null,
        currentBlockPosition: 0,
        movementDirection: 1,
        movementSpeed: BASE_SPEED,
        score: 0,
        bonusPoints: 0,
        highestRow: 0,
        blocksStacked: 0,
        comboMultiplier: 1,
        comboStreak: 0,
        perfectAlignments: 0,
        lastPlacedBlock: null,
        demoAutoStopTimer: null,
      });
      
      setTimeout(() => {
        get().spawnNewBlock();
      }, 500);
    },
    
    restart: () => {
      console.log("Game restarted!");
      set({
        phase: "ready",
        blocks: [],
        currentBlock: null,
        currentBlockPosition: 0,
        movementDirection: 1,
        movementSpeed: BASE_SPEED,
        score: 0,
        bonusPoints: 0,
        highestRow: 0,
        blocksStacked: 0,
        comboMultiplier: 1,
        comboStreak: 0,
        perfectAlignments: 0,
        lastPlacedBlock: null,
      });
    },
    
    end: () => {
      const state = get();
      const prizeInfo = state.getPotentialPrize();
      
      let newCredits = state.credits;
      
      // Always log bonus points earned
      console.log(`Game ended! Bonus points earned: ${state.bonusPoints}P`);
      
      if (prizeInfo.amount === 0) {
        console.log(`No prize won (only reached row ${state.highestRow}). Credits: $${state.credits.toFixed(2)}`);
      } else if (prizeInfo.type === 'cash') {
        newCredits = state.credits + prizeInfo.amount;
        console.log(`Prize won: $${prizeInfo.amount.toFixed(2)}, Total credits: $${newCredits.toFixed(2)}`);
      } else {
        console.log(`Prize won: ${prizeInfo.amount}P, Credits: $${state.credits.toFixed(2)}`);
      }
      
      set({ 
        phase: "ended",
        credits: newCredits
      });

      // Save game result to backend for real-time feed
      const stakeValue = state.stake === 'FREE' ? 'FREE' : state.stake.toString();
      fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: 'Player',
          score: state.score,
          stake: stakeValue,
          prize: prizeInfo.amount > 0 ? prizeInfo.amount.toString() : null,
          prizeType: prizeInfo.amount > 0 ? prizeInfo.type : null,
          blocksStacked: state.blocksStacked,
          highestRow: state.highestRow,
          bonusPoints: state.bonusPoints, // Include bonus points
        }),
      }).catch(err => console.error('Failed to save game history:', err));
    },
    
    spawnNewBlock: () => {
      const state = get();
      if (state.phase !== "playing" && state.phase !== "demo") return;
      
      const lastBlock = state.blocks[state.blocks.length - 1];
      const newRow = lastBlock ? lastBlock.row + 1 : 1;
      
      // For the first block, randomize starting position for paid games
      let initialColumns: boolean[];
      if (lastBlock) {
        // Use previous block's columns
        initialColumns = [...lastBlock.columns];
      } else {
        // First block - randomize for paid games, center for FREE
        if (state.stake === 'FREE') {
          // FREE mode: always start in the middle (columns 2, 3, 4)
          initialColumns = Array(GRID_WIDTH).fill(false).map((_, i) => i >= 2 && i <= 4);
          console.log('🆓 FREE mode: Starting blocks in middle (columns 2-4)');
        } else {
          // Paid games: randomize starting position
          const startCol = Math.floor(Math.random() * (GRID_WIDTH - 2)); // 0 to 4 (ensures 3 blocks fit)
          initialColumns = Array(GRID_WIDTH).fill(false).map((_, i) => i >= startCol && i <= startCol + 2);
          console.log(`💰 Paid game ($${state.stake}): Starting blocks in columns ${startCol}-${startCol + 2}`);
        }
      }
      
      const newBlock: Block = {
        row: newRow,
        columns: initialColumns
      };
      
      // Find the leftmost and rightmost active columns to calculate position range
      let leftmostCol = -1;
      let rightmostCol = -1;
      for (let i = 0; i < GRID_WIDTH; i++) {
        if (newBlock.columns[i]) {
          if (leftmostCol === -1) leftmostCol = i;
          rightmostCol = i;
        }
      }
      
      // Calculate min/max positions for random starting point
      const minPosition = leftmostCol >= 0 ? -leftmostCol : 0;
      const maxPosition = rightmostCol >= 0 ? GRID_WIDTH - 1 - rightmostCol : GRID_WIDTH - 1;
      
      // Fully random starting position within valid range
      const randomPosition = minPosition + (Math.random() * (maxPosition - minPosition));
      
      // Randomly choose direction, with slight bias to alternate from previous
      const newDirection = state.blocks.length === 0 
        ? (Math.random() > 0.5 ? 1 : -1)
        : (Math.random() > 0.3 ? -state.movementDirection : state.movementDirection);
      
      // Calculate speed with increasing randomness for rows 7-13
      let rowSpeed: number;
      
      if (newRow < 7) {
        // Rows 1-6: Progressive but moderate speed increase
        const randomIncrement = MIN_SPEED_INCREMENT + (Math.random() * (MAX_SPEED_INCREMENT - MIN_SPEED_INCREMENT));
        rowSpeed = BASE_SPEED + ((newRow - 1) * randomIncrement);
      } else if (newRow === 13) {
        // Row 14 (index 13): THE FASTEST - guaranteed maximum speed
        rowSpeed = BASE_SPEED + (newRow * 0.8); // Much higher multiplier for row 14
        console.log(`🔥 ROW 14 - MAXIMUM SPEED! Speed: ${rowSpeed.toFixed(2)}`);
      } else {
        // Rows 7-13: HIGH randomness to make it unpredictable and challenging
        // Random speed increment ranges from 0.3 to 0.7 (much wider range)
        const minIncrement = 0.3;
        const maxIncrement = 0.7;
        const randomIncrement = minIncrement + (Math.random() * (maxIncrement - minIncrement));
        rowSpeed = BASE_SPEED + ((newRow - 1) * randomIncrement);
        console.log(`⚡ Row ${newRow} random speed: increment ${randomIncrement.toFixed(2)}, speed: ${rowSpeed.toFixed(2)}`);
      }
      
      // Apply stake multiplier - higher stakes = faster blocks
      const stakeMultiplier = getStakeSpeedMultiplier(state.stake);
      let finalSpeed = rowSpeed * stakeMultiplier;
      
      console.log(`Spawning new block at row ${newRow}, position ${randomPosition.toFixed(2)}, direction ${newDirection}, speed: ${finalSpeed.toFixed(2)} (stake multiplier: ${stakeMultiplier}x)`);
      
      // In demo mode, set up auto-stop timer
      let autoStopTimer: NodeJS.Timeout | null = null;
      if (state.phase === "demo") {
        // Calculate a target position for demo (slightly random but reasonable)
        const targetOffset = (Math.random() - 0.5) * 0.4; // Small offset for variety
        const travelDistance = Math.abs(targetOffset - randomPosition);
        const timeToTarget = (travelDistance / finalSpeed) * 1000 + 300 + (Math.random() * 400);
        
        autoStopTimer = setTimeout(() => {
          const currentState = get();
          if (currentState.phase === "demo" && currentState.currentBlock) {
            get().stopBlock();
          }
        }, timeToTarget);
      }
      
      set({
        currentBlock: newBlock,
        currentBlockPosition: randomPosition,
        movementDirection: newDirection,
        movementSpeed: finalSpeed,
        demoAutoStopTimer: autoStopTimer
      });
    },
    
    updateBlockPosition: (delta: number) => {
      const state = get();
      if (!state.currentBlock || (state.phase !== "playing" && state.phase !== "demo")) return;
      
      // Find the leftmost and rightmost active columns in the block
      let leftmostCol = -1;
      let rightmostCol = -1;
      
      for (let i = 0; i < GRID_WIDTH; i++) {
        if (state.currentBlock.columns[i]) {
          if (leftmostCol === -1) leftmostCol = i;
          rightmostCol = i;
        }
      }
      
      // Calculate min/max positions so the block stays within grid bounds
      const minPosition = leftmostCol >= 0 ? -leftmostCol : 0;
      const maxPosition = rightmostCol >= 0 ? GRID_WIDTH - 1 - rightmostCol : GRID_WIDTH - 1;
      
      let newPosition = state.currentBlockPosition + (state.movementDirection * state.movementSpeed * delta);
      let newDirection = state.movementDirection;
      
      if (newPosition >= maxPosition) {
        newPosition = maxPosition;
        newDirection = -1;
      } else if (newPosition <= minPosition) {
        newPosition = minPosition;
        newDirection = 1;
      }
      
      set({
        currentBlockPosition: newPosition,
        movementDirection: newDirection
      });
    },
    
    stopBlock: () => {
      const state = get();
      if (!state.currentBlock || (state.phase !== "playing" && state.phase !== "demo")) {
        console.log("Cannot stop block - invalid state");
        return;
      }
      
      // Clear demo auto-stop timer if exists
      if (state.demoAutoStopTimer) {
        clearTimeout(state.demoAutoStopTimer);
      }
      
      console.log(`Stopping block at position ${state.currentBlockPosition}`);
      
      const stoppedPosition = state.currentBlockPosition;
      
      if (state.blocks.length === 0) {
        const newBlock: Block = {
          row: 0,
          columns: Array(GRID_WIDTH).fill(false).map((_, i) => i >= 2 && i <= 4)
        };
        set({
          blocks: [newBlock],
          currentBlock: null
        });
        setTimeout(() => get().spawnNewBlock(), 500);
        return;
      }
      
      const previousBlock = state.blocks[state.blocks.length - 1];
      const newColumns = Array(GRID_WIDTH).fill(false);
      
      let hasOverlap = false;
      for (let i = 0; i < GRID_WIDTH; i++) {
        if (!state.currentBlock.columns[i]) continue;
        
        const blockColumnPosition = stoppedPosition + i;
        const gridColumn = Math.round(blockColumnPosition);
        
        if (gridColumn >= 0 && gridColumn < GRID_WIDTH && previousBlock.columns[gridColumn]) {
          newColumns[gridColumn] = true;
          hasOverlap = true;
        }
      }
      
      if (!hasOverlap) {
        console.log("Game Over - No overlap with previous block!");
        set({
          currentBlock: null
        });
        get().end();
        return;
      }
      
      const activeBlockCount = newColumns.filter(col => col).length;
      const previousActiveCount = previousBlock.columns.filter(col => col).length;
      
      // Check for perfect alignment: all active columns from current block overlap
      const isPerfect = activeBlockCount === previousActiveCount && activeBlockCount > 0;
      
      // Update combo streak and multiplier
      let newComboStreak = state.comboStreak;
      let newComboMultiplier = state.comboMultiplier;
      let newPerfectAlignments = state.perfectAlignments;
      
      if (isPerfect) {
        newComboStreak = state.comboStreak + 1;
        newComboMultiplier = Math.min(1 + (newComboStreak * 0.5), 5);
        newPerfectAlignments = state.perfectAlignments + 1;
        console.log(`🎯 PERFECT ALIGNMENT! Combo streak: ${newComboStreak}, Multiplier: ${newComboMultiplier.toFixed(1)}x`);
      } else {
        if (state.comboStreak > 0) {
          console.log(`❌ Combo broken! Previous streak: ${state.comboStreak}`);
        }
        newComboStreak = 0;
        newComboMultiplier = 1;
      }
      
      // Apply combo multiplier to score - only count score AND bonus points if row >= 7 (first points row)
      const basePoints = activeBlockCount * 10;
      const multipliedPoints = Math.round(basePoints * newComboMultiplier);
      const shouldCountScore = state.currentBlock.row >= 7;
      const bonusPointsToAdd = activeBlockCount * 50;
      const newScore = shouldCountScore ? state.score + multipliedPoints : state.score;
      const newBonusPoints = shouldCountScore ? state.bonusPoints + bonusPointsToAdd : state.bonusPoints;
      const newHighestRow = Math.max(state.highestRow, state.currentBlock.row);
      const newBlocksStacked = state.blocksStacked + 1;
      
      console.log(`Block placed! Active columns: ${activeBlockCount}, Row: ${state.currentBlock.row}, ${shouldCountScore ? `✅ COUNTED - Score: +${multipliedPoints} = ${newScore}, Bonus: +${bonusPointsToAdd} = ${newBonusPoints}` : `❌ NOT counted (rows 1-6 don't count) - Score: ${newScore}, Bonus: ${newBonusPoints}`}`);
      
      const finalBlock: Block = {
        row: state.currentBlock.row,
        columns: newColumns
      };
      
      const placedColumns: number[] = [];
      newColumns.forEach((isActive, idx) => {
        if (isActive) placedColumns.push(idx);
      });
      
      set({
        blocks: [...state.blocks, finalBlock],
        currentBlock: null,
        score: newScore,
        bonusPoints: newBonusPoints,
        highestRow: newHighestRow,
        blocksStacked: newBlocksStacked,
        comboMultiplier: newComboMultiplier,
        comboStreak: newComboStreak,
        perfectAlignments: newPerfectAlignments,
        lastPlacedBlock: {
          row: state.currentBlock.row,
          columns: placedColumns,
          isPerfect
        }
      });
      
      // Check if we've reached row 13 (the 14th row) - game should end
      // In demo mode, end at row 7-10 for variety
      const endRow = state.phase === "demo" ? (7 + Math.floor(Math.random() * 4)) : 13;
      
      if (newHighestRow >= endRow) {
        if (state.phase === "demo") {
          console.log("🎮 Demo complete! Restarting...");
          setTimeout(() => {
            get().startDemo();
          }, 1500);
        } else {
          console.log("🎉 Game complete! Reached the top (row 13)!");
          setTimeout(() => {
            get().end();
          }, 500);
        }
      } else {
        setTimeout(() => {
          get().spawnNewBlock();
        }, 300);
      }
    }
  }))
);
