import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/lib/stores/useGame';
import * as THREE from 'three';

const GRID_COLS = 7;
const GRID_ROWS = 16;
const BLOCK_SIZE = 0.95;
const BASE_SPEED = 1.2;
const SPEED_INCREMENT = 0.15;
const DEMO_CYCLE_DURATION = 15000;

interface DemoBlock {
  row: number;
  position: number;
  direction: number;
  targetPosition: number;
  stopping: boolean;
  stopped: boolean;
}

export function DemoMode() {
  const phase = useGame(state => state.phase);
  const [demoBlocks, setDemoBlocks] = useState<DemoBlock[]>([]);
  const [stackedPositions, setStackedPositions] = useState<number[]>([]);
  const timeRef = useRef(0);
  const cycleTimeRef = useRef(0);
  
  useEffect(() => {
    if (phase === 'ready') {
      timeRef.current = 0;
      cycleTimeRef.current = 0;
      setDemoBlocks([]);
      setStackedPositions([]);
    }
  }, [phase]);
  
  useFrame((state, delta) => {
    if (phase !== 'ready') return;
    
    cycleTimeRef.current += delta * 1000;
    
    if (cycleTimeRef.current > DEMO_CYCLE_DURATION) {
      cycleTimeRef.current = 0;
      timeRef.current = 0;
      setDemoBlocks([]);
      setStackedPositions([]);
      return;
    }
    
    timeRef.current += delta;
    
    const currentRow = stackedPositions.length + 1;
    
    if (currentRow <= GRID_ROWS && demoBlocks.length === 0) {
      const startPos = Math.random() > 0.5 ? -GRID_COLS / 2 : GRID_COLS / 2;
      const direction = startPos < 0 ? 1 : -1;
      const targetCol = Math.floor(Math.random() * 3) + 2;
      const targetPos = targetCol - GRID_COLS / 2;
      
      setDemoBlocks([{
        row: currentRow,
        position: startPos,
        direction: direction,
        targetPosition: targetPos,
        stopping: false,
        stopped: false
      }]);
    }
    
    setDemoBlocks(prevBlocks => {
      return prevBlocks.map(block => {
        if (block.stopped) return block;
        
        const speed = (BASE_SPEED + SPEED_INCREMENT * (block.row - 1)) * delta;
        let newPosition = block.position + (block.direction * speed);
        
        const distanceToTarget = Math.abs(newPosition - block.targetPosition);
        
        if (distanceToTarget < 0.3 && !block.stopping) {
          setStackedPositions(prev => [...prev, block.targetPosition]);
          return { ...block, position: block.targetPosition, stopping: true, stopped: true };
        }
        
        if (block.direction > 0 && newPosition > GRID_COLS / 2) {
          newPosition = GRID_COLS / 2;
          return { ...block, position: newPosition, direction: -1 };
        } else if (block.direction < 0 && newPosition < -GRID_COLS / 2) {
          newPosition = -GRID_COLS / 2;
          return { ...block, position: newPosition, direction: 1 };
        }
        
        return { ...block, position: newPosition };
      });
    });
    
    setDemoBlocks(prevBlocks => prevBlocks.filter(block => !block.stopped || timeRef.current < 0.5));
  });
  
  if (phase !== 'ready') return null;
  
  return (
    <group>
      {stackedPositions.map((position, index) => {
        const row = index + 1;
        const yPos = row * BLOCK_SIZE;
        
        return (
          <mesh
            key={`stacked-${index}`}
            position={[position, yPos, 0]}
            castShadow
          >
            <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
            <meshStandardMaterial 
              color="#cc3333"
              roughness={0.3}
              metalness={0.1}
              opacity={0.7}
              transparent
            />
          </mesh>
        );
      })}
      
      {demoBlocks.map((block, index) => {
        const yPos = block.row * BLOCK_SIZE;
        
        return (
          <mesh
            key={`demo-${index}-${block.row}`}
            position={[block.position, yPos, 0]}
            castShadow
          >
            <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
            <meshStandardMaterial 
              color="#ff4444"
              roughness={0.2}
              metalness={0.2}
              emissive="#ff2222"
              emissiveIntensity={0.3}
              opacity={0.8}
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}
