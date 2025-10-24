import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/stores/useGame';

const GRID_WIDTH = 7;
const GRID_HEIGHT = 16;
const CELL_SIZE = 0.5;
const GRID_SPACING = 0.05;

export function GameGrid() {
  const blocks = useGame(state => state.blocks);
  const currentBlock = useGame(state => state.currentBlock);
  const currentBlockPosition = useGame(state => state.currentBlockPosition);
  
  return (
    <group position={[-(GRID_WIDTH * (CELL_SIZE + GRID_SPACING)) / 2 + CELL_SIZE / 2, 0, 0]}>
      <GridBackground />
      <PlacedBlocks blocks={blocks} />
      {currentBlock && (
        <MovingBlock 
          block={currentBlock} 
          position={currentBlockPosition} 
        />
      )}
    </group>
  );
}

function GridBackground() {
  const cells = useMemo(() => {
    const result = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        result.push({ row, col });
      }
    }
    return result;
  }, []);
  
  return (
    <group>
      {cells.map(({ row, col }) => (
        <mesh
          key={`${row}-${col}`}
          position={[
            col * (CELL_SIZE + GRID_SPACING),
            row * (CELL_SIZE + GRID_SPACING),
            -0.1
          ]}
        >
          <boxGeometry args={[CELL_SIZE, CELL_SIZE, 0.05]} />
          <meshStandardMaterial 
            color="#6b7c8f"
            transparent={true}
            opacity={0.4}
          />
        </mesh>
      ))}
      
      <mesh position={[
        (GRID_WIDTH * (CELL_SIZE + GRID_SPACING)) / 2 - CELL_SIZE / 2,
        (GRID_HEIGHT * (CELL_SIZE + GRID_SPACING)) / 2 - CELL_SIZE / 2,
        -0.2
      ]}>
        <planeGeometry args={[
          GRID_WIDTH * (CELL_SIZE + GRID_SPACING) + 0.2,
          GRID_HEIGHT * (CELL_SIZE + GRID_SPACING) + 0.2
        ]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function PlacedBlocks({ blocks }: { blocks: any[] }) {
  return (
    <group>
      {blocks.map((block, blockIndex) => (
        <group key={blockIndex}>
          {block.columns.map((isActive: boolean, colIndex: number) => {
            if (!isActive) return null;
            return (
              <mesh
                key={`${blockIndex}-${colIndex}`}
                position={[
                  colIndex * (CELL_SIZE + GRID_SPACING),
                  block.row * (CELL_SIZE + GRID_SPACING),
                  0
                ]}
              >
                <boxGeometry args={[CELL_SIZE, CELL_SIZE, 0.3]} />
                <meshStandardMaterial 
                  color="#d64545"
                  metalness={0.3}
                  roughness={0.4}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function MovingBlock({ block, position }: { block: any; position: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = position * (CELL_SIZE + GRID_SPACING);
      groupRef.current.position.y = block.row * (CELL_SIZE + GRID_SPACING) + Math.sin(state.clock.elapsedTime * 3) * 0.02;
    }
  });
  
  return (
    <group ref={groupRef}>
      {block.columns.map((isActive: boolean, colIndex: number) => {
        if (!isActive) return null;
        return (
          <mesh
            key={colIndex}
            position={[
              colIndex * (CELL_SIZE + GRID_SPACING),
              0,
              0.1
            ]}
          >
            <boxGeometry args={[CELL_SIZE, CELL_SIZE, 0.3]} />
            <meshStandardMaterial 
              color="#ff5555"
              emissive="#ff0000"
              emissiveIntensity={0.2}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}
