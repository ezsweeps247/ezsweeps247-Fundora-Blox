import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "playing" | "ended";

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
  
  setStake: (stake: number | 'FREE') => void;
  cycleStake: (direction: 'up' | 'down') => void;
  getPotentialPrize: () => { amount: number; type: 'cash' | 'points' };
  calculatePrizeMultiplier: (row: number) => { multiplier: number; type: 'cash' | 'points' };
  start: () => void;
  restart: () => void;
  end: () => void;
  stopBlock: () => void;
  updateBlockPosition: (delta: number) => void;
  spawnNewBlock: () => void;
}

const GRID_WIDTH = 7;
const BASE_SPEED = 2.0;
const SPEED_INCREMENT = 0.15;

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
    
    calculatePrizeMultiplier: (row: number) => {
      if (row >= 13) return { multiplier: 100, type: 'cash' as const };
      if (row >= 12) return { multiplier: 10, type: 'cash' as const };
      if (row >= 11) return { multiplier: 5, type: 'cash' as const };
      if (row >= 10) return { multiplier: 2, type: 'cash' as const };
      if (row >= 9) return { multiplier: 1, type: 'cash' as const };
      if (row >= 8) return { multiplier: 1000, type: 'points' as const };
      if (row >= 7) return { multiplier: 500, type: 'points' as const };
      return { multiplier: 0, type: 'points' as const };
    },
    
    getPotentialPrize: () => {
      const state = get();
      const prizeInfo = state.calculatePrizeMultiplier(state.highestRow);
      
      // Free mode always gives points
      if (state.stake === 'FREE') {
        return { amount: prizeInfo.multiplier, type: 'points' as const };
      }
      
      const stakeAmount = typeof state.stake === 'number' ? state.stake : 0;
      
      if (prizeInfo.type === 'cash') {
        return { amount: stakeAmount * prizeInfo.multiplier, type: 'cash' as const };
      } else {
        return { amount: prizeInfo.multiplier, type: 'points' as const };
      }
    },
    
    start: () => {
      const state = get();
      
      if (state.stake !== 'FREE' && state.stake > state.credits) {
        console.log("Insufficient credits!");
        return;
      }
      
      const isFreeMode = state.stake === 'FREE';
      const stakeAmount = typeof state.stake === 'number' ? state.stake : 0;
      const newCredits = isFreeMode ? state.credits : state.credits - stakeAmount;
      
      console.log(`Game started! Stake: ${isFreeMode ? 'FREE MODE' : `$${state.stake}`}, Credits: $${newCredits}`);
      
      set({
        phase: "playing",
        credits: newCredits,
        blocks: [{
          row: 0,
          columns: Array(GRID_WIDTH).fill(false).map((_, i) => i >= 2 && i <= 4)
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
      if (prizeInfo.amount === 0) {
        console.log(`Game ended! No prize won (only reached row ${state.highestRow}). Credits: $${state.credits.toFixed(2)}`);
      } else if (prizeInfo.type === 'cash') {
        newCredits = state.credits + prizeInfo.amount;
        console.log(`Game ended! Prize won: $${prizeInfo.amount.toFixed(2)}, Total credits: $${newCredits.toFixed(2)}`);
      } else {
        console.log(`Game ended! Points won: ${prizeInfo.amount}P, Credits: $${state.credits.toFixed(2)}`);
      }
      
      set({ 
        phase: "ended",
        credits: newCredits
      });
    },
    
    spawnNewBlock: () => {
      const state = get();
      if (state.phase !== "playing") return;
      
      const lastBlock = state.blocks[state.blocks.length - 1];
      const newRow = lastBlock ? lastBlock.row + 1 : 1;
      
      const newBlock: Block = {
        row: newRow,
        columns: lastBlock ? [...lastBlock.columns] : Array(GRID_WIDTH).fill(false).map((_, i) => i >= 2 && i <= 4)
      };
      
      // Find the rightmost active column to calculate max position
      let rightmostCol = -1;
      for (let i = GRID_WIDTH - 1; i >= 0; i--) {
        if (newBlock.columns[i]) {
          rightmostCol = i;
          break;
        }
      }
      const maxPosition = rightmostCol >= 0 ? GRID_WIDTH - 1 - rightmostCol : GRID_WIDTH - 1;
      
      // Random starting position
      const randomPosition = Math.random() * maxPosition;
      
      // Alternate direction based on previous, or randomize if first block
      const newDirection = state.blocks.length === 0 
        ? (Math.random() > 0.5 ? 1 : -1)
        : -state.movementDirection;
      
      console.log(`Spawning new block at row ${newRow}, position ${randomPosition.toFixed(2)}, direction ${newDirection}`);
      
      set({
        currentBlock: newBlock,
        currentBlockPosition: randomPosition,
        movementDirection: newDirection,
        movementSpeed: BASE_SPEED + (newRow * SPEED_INCREMENT)
      });
    },
    
    updateBlockPosition: (delta: number) => {
      const state = get();
      if (!state.currentBlock || state.phase !== "playing") return;
      
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
      if (!state.currentBlock || state.phase !== "playing") {
        console.log("Cannot stop block - invalid state");
        return;
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
      
      // Apply combo multiplier to score
      const basePoints = activeBlockCount * 10;
      const multipliedPoints = Math.round(basePoints * newComboMultiplier);
      const newScore = state.score + multipliedPoints;
      const newBonusPoints = state.bonusPoints + (activeBlockCount * 50);
      const newHighestRow = Math.max(state.highestRow, state.currentBlock.row);
      const newBlocksStacked = state.blocksStacked + 1;
      
      console.log(`Block placed! Active columns: ${activeBlockCount}, Base points: ${basePoints}, Multiplier: ${newComboMultiplier.toFixed(1)}x, Score: +${multipliedPoints} = ${newScore}`);
      
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
      
      setTimeout(() => {
        get().spawnNewBlock();
      }, 300);
    }
  }))
);
