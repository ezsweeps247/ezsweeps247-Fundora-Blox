import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Background3D() {
  const gridRef = useRef<THREE.Group>(null);
  
  return (
    <group position={[0, 0, -10]}>
      <color attach="background" args={['#b8d4e8']} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      <group ref={gridRef}>
        <PerspectiveGrid side="left" />
        <PerspectiveGrid side="right" />
        <PerspectiveGrid side="bottom" />
      </group>
    </group>
  );
}

function PerspectiveGrid({ side }: { side: 'left' | 'right' | 'bottom' }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = new THREE.PlaneGeometry(20, 20, 20, 20);
  
  let position: [number, number, number] = [0, 0, 0];
  let rotation: [number, number, number] = [0, 0, 0];
  
  if (side === 'left') {
    position = [-12, 5, -5];
    rotation = [0, Math.PI / 2.5, 0];
  } else if (side === 'right') {
    position = [12, 5, -5];
    rotation = [0, -Math.PI / 2.5, 0];
  } else if (side === 'bottom') {
    position = [0, -5, -5];
    rotation = [-Math.PI / 3, 0, 0];
  }
  
  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <primitive object={geometry} />
      <meshBasicMaterial 
        color="#8fb5d1"
        wireframe={true}
        transparent={true}
        opacity={0.3}
      />
    </mesh>
  );
}
