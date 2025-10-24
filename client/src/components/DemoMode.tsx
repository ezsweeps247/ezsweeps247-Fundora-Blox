import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/lib/stores/useGame';

const GRID_COLS = 7;
const BLOCK_SIZE = 0.95;
const BASE_SPEED = 1.2;
const SPEED_INCREMENT = 0.15;

interface DemoBlock {
  row: number;
  targetColumn: number;
  stopTime: number;
}

const DEMO_SEQUENCE: DemoBlock[] = [
  { row: 1, targetColumn: 3, stopTime: 1.5 },
  { row: 2, targetColumn: 3, stopTime: 3.0 },
  { row: 3, targetColumn: 3, stopTime: 4.5 },
  { row: 4, targetColumn: 4, stopTime: 6.0 },
  { row: 5, targetColumn: 3, stopTime: 7.5 },
  { row: 6, targetColumn: 3, stopTime: 9.0 },
  { row: 7, targetColumn: 2, stopTime: 10.5 },
  { row: 8, targetColumn: 3, stopTime: 12.0 },
];

const DEMO_DURATION = 15;

export function DemoMode() {
  const phase = useGame(state => state.phase);
  const timeRef = useRef(0);
  
  const initialPositions = useMemo(() => {
    return DEMO_SEQUENCE.map((block, index) => ({
      startPos: index % 2 === 0 ? -3.5 : 3.5,
      direction: index % 2 === 0 ? 1 : -1
    }));
  }, []);
  
  useFrame((state, delta) => {
    if (phase !== 'ready') {
      timeRef.current = 0;
      return;
    }
    
    timeRef.current += delta;
    
    if (timeRef.current > DEMO_DURATION) {
      timeRef.current = 0;
    }
  });
  
  if (phase !== 'ready') return null;
  
  const currentTime = timeRef.current;
  
  return (
    <group rotation={[-Math.PI / 12, 0, 0]}>
      {DEMO_SEQUENCE.map((block, index) => {
        const hasStarted = currentTime >= (block.stopTime - 1.5);
        const hasStopped = currentTime >= block.stopTime;
        
        if (!hasStarted) return null;
        
        const targetPos = block.targetColumn - GRID_COLS / 2;
        const yPos = block.row * BLOCK_SIZE;
        
        if (hasStopped) {
          return (
            <mesh
              key={`demo-stacked-${index}`}
              position={[targetPos, yPos, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
              <meshStandardMaterial 
                color="#cc3333"
                roughness={0.4}
                metalness={0.1}
              />
            </mesh>
          );
        }
        
        const elapsedTime = currentTime - (block.stopTime - 1.5);
        const speed = BASE_SPEED + SPEED_INCREMENT * (block.row - 1);
        const distance = speed * elapsedTime;
        
        const startInfo = initialPositions[index];
        let currentPos = startInfo.startPos + (startInfo.direction * distance);
        let currentDirection = startInfo.direction;
        
        const bounces = Math.floor(Math.abs(currentPos - startInfo.startPos) / 7);
        if (bounces > 0) {
          currentDirection = startInfo.direction * (bounces % 2 === 0 ? 1 : -1);
        }
        
        if (currentDirection > 0) {
          currentPos = ((currentPos + 3.5) % 7) - 3.5;
        } else {
          currentPos = 3.5 - ((3.5 - currentPos) % 7);
        }
        
        const timeUntilStop = block.stopTime - currentTime;
        if (timeUntilStop < 0.3) {
          const interpolation = 1 - (timeUntilStop / 0.3);
          currentPos = currentPos + (targetPos - currentPos) * interpolation;
        }
        
        return (
          <mesh
            key={`demo-moving-${index}`}
            position={[currentPos, yPos, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
            <meshStandardMaterial 
              color="#ff4444"
              roughness={0.3}
              metalness={0.2}
              emissive="#ff0000"
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
