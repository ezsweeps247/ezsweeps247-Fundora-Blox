import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/lib/stores/useGame';
import { ParticleEffect } from './ParticleEffect';

const GRID_WIDTH = 7;
const GRID_HEIGHT = 16;
const CELL_SIZE = 0.5;
const GRID_SPACING = 0.05;

export function GameGrid() {
  const blocks = useGame(state => state.blocks);
  const currentBlock = useGame(state => state.currentBlock);
  const currentBlockPosition = useGame(state => state.currentBlockPosition);
  const lastPlacedBlock = useGame(state => state.lastPlacedBlock);
  const [particles, setParticles] = useState<Array<{ id: number; position: [number, number, number]; isPerfect: boolean }>>([]);
  
  useEffect(() => {
    if (lastPlacedBlock) {
      const newParticles = lastPlacedBlock.columns.map((col, idx) => ({
        id: Date.now() + idx,
        position: [
          col * (CELL_SIZE + GRID_SPACING),
          lastPlacedBlock.row * (CELL_SIZE + GRID_SPACING),
          0.2
        ] as [number, number, number],
        isPerfect: lastPlacedBlock.isPerfect
      }));
      
      setParticles(prev => [...prev, ...newParticles]);
      
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1600);
    }
  }, [lastPlacedBlock]);
  
  return (
    <group 
      position={[-(GRID_WIDTH * (CELL_SIZE + GRID_SPACING)) / 2 + CELL_SIZE / 2, 0, 0]}
      rotation={[-Math.PI / 12, 0, 0]}
    >
      <GridBackground />
      <PlacedBlocks blocks={blocks} />
      {currentBlock && (
        <MovingBlock 
          block={currentBlock} 
          position={currentBlockPosition} 
        />
      )}
      {particles.map(particle => (
        <ParticleEffect
          key={particle.id}
          position={particle.position}
          count={particle.isPerfect ? 18 : 12}
          isPerfect={particle.isPerfect}
        />
      ))}
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
              <AnimatedBlock
                key={`${blockIndex}-${colIndex}`}
                position={[
                  colIndex * (CELL_SIZE + GRID_SPACING),
                  block.row * (CELL_SIZE + GRID_SPACING),
                  0
                ]}
                blockIndex={blockIndex}
                totalBlocks={blocks.length}
              />
            );
          })}
        </group>
      ))}
    </group>
  );
}

function AnimatedBlock({ position, blockIndex, totalBlocks }: { 
  position: [number, number, number]; 
  blockIndex: number;
  totalBlocks: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const isLatest = blockIndex === totalBlocks - 1;
  
  useEffect(() => {
    if (isLatest) {
      setAnimationTime(0);
    }
  }, [isLatest, blockIndex]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (isLatest && animationTime < 0.5) {
      setAnimationTime(prev => prev + delta);
      
      const progress = Math.min(animationTime / 0.3, 1);
      const bounceScale = 1.0 + (1 - progress) * 0.15 * Math.sin(progress * Math.PI * 2);
      meshRef.current.scale.set(bounceScale, bounceScale, bounceScale);
      
      const emissiveIntensity = (1 - progress) * 0.8;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
    } else {
      meshRef.current.scale.set(1, 1, 1);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[CELL_SIZE, CELL_SIZE, 0.3]} />
      <meshStandardMaterial 
        color="#d64545"
        emissive="#ff3333"
        emissiveIntensity={0}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
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
