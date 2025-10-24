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
  stake: number;
  availableStakes: number[];
  highestRow: number;
  blocksStacked: number;
  comboMultiplier: number;
  comboStreak: number;
  perfectAlignments: number;
  lastPlacedBlock: { row: number; columns: number[]; isPerfect: boolean } | null;
  
  setStake: (stake: number) => void;
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
    availableStakes: [0.5, 1, 2, 5, 10],
    highestRow: 0,
    blocksStacked: 0,
    comboMultiplier: 1,
    comboStreak: 0,
    perfectAlignments: 0,
    lastPlacedBlock: null,
    
    setStake: (stake: number) => {
      const state = get();
      if (state.phase === "ready" && stake <= state.credits) {
        console.log(`Stake set to: $${stake}`);
        set({ stake });
      }
    },
    
    calculatePrizeMultiplier: (row: number) => {
      if (row >= 15) return { multiplier: 100, type: 'cash' as const };
      if (row >= 12) return { multiplier: 10, type: 'cash' as const };
      if (row >= 9) return { multiplier: 5, type: 'cash' as const };
      if (row >= 6) return { multiplier: 2, type: 'cash' as const };
      if (row >= 3) return { multiplier: 1, type: 'cash' as const };
      if (row === 2) return { multiplier: 1000, type: 'points' as const };
      if (row === 1) return { multiplier: 500, type: 'points' as const };
      return { multiplier: 250, type: 'points' as const };
    },
    
    getPotentialPrize: () => {
      const state = get();
      const prizeInfo = state.calculatePrizeMultiplier(state.highestRow);
      
      if (prizeInfo.type === 'cash') {
        return { amount: state.stake * prizeInfo.multiplier, type: 'cash' as const };
      } else {
        return { amount: prizeInfo.multiplier, type: 'points' as const };
      }
    },
    
    start: () => {
      const state = get();
      
      if (state.stake > state.credits) {
        console.log("Insufficient credits!");
        return;
      }
      
      console.log(`Game started! Stake: $${state.stake}, Credits after deduction: $${state.credits - state.stake}`);
      
      set({
        phase: "playing",
        credits: state.credits - state.stake,
        blocks: [{
          row: 0,
          columns: Array(GRID_WIDTH).fill(true)
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
      if (prizeInfo.type === 'cash') {
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
        columns: lastBlock ? [...lastBlock.columns] : Array(GRID_WIDTH).fill(true)
      };
      
      console.log(`Spawning new block at row ${newRow}`);
      
      set({
        currentBlock: newBlock,
        currentBlockPosition: 0,
        movementDirection: 1,
        movementSpeed: BASE_SPEED + (newRow * SPEED_INCREMENT)
      });
    },
    
    updateBlockPosition: (delta: number) => {
      const state = get();
      if (!state.currentBlock || state.phase !== "playing") return;
      
      let newPosition = state.currentBlockPosition + (state.movementDirection * state.movementSpeed * delta);
      let newDirection = state.movementDirection;
      
      if (newPosition >= GRID_WIDTH - 1) {
        newPosition = GRID_WIDTH - 1;
        newDirection = -1;
      } else if (newPosition <= 0) {
        newPosition = 0;
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
          columns: Array(GRID_WIDTH).fill(true)
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
