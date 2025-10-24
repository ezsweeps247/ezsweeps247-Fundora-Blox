import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

interface ParticleEffectProps {
  position: [number, number, number];
  count?: number;
  isPerfect?: boolean;
}

export function ParticleEffect({ position, count = 12, isPerfect = false }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    const newParticles: Particle[] = [];
    const maxLife = isPerfect ? 1.5 : 1.0;
    const particleCount = isPerfect ? count * 1.5 : count;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 1.5 + Math.random() * 1.5;
      const elevation = isPerfect ? Math.random() * 0.5 + 0.3 : Math.random() * 0.3;
      
      newParticles.push({
        id: i,
        position: new THREE.Vector3(position[0], position[1], position[2]),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          elevation * speed,
          Math.sin(angle) * speed * 0.3
        ),
        life: maxLife,
        maxLife,
        scale: isPerfect ? 0.12 + Math.random() * 0.08 : 0.08 + Math.random() * 0.06
      });
    }
    
    setParticles(newParticles);
  }, [position, count, isPerfect]);
  
  useFrame((state, delta) => {
    setParticles(prevParticles => {
      return prevParticles
        .map(particle => {
          const newLife = particle.life - delta;
          if (newLife <= 0) return null;
          
          const newPosition = particle.position.clone();
          newPosition.add(particle.velocity.clone().multiplyScalar(delta));
          
          const newVelocity = particle.velocity.clone();
          newVelocity.y -= 2.0 * delta;
          
          return {
            ...particle,
            position: newPosition,
            velocity: newVelocity,
            life: newLife
          };
        })
        .filter((p): p is Particle => p !== null);
    });
  });
  
  if (particles.length === 0) return null;
  
  return (
    <group>
      {particles.map(particle => {
        const opacity = particle.life / particle.maxLife;
        const scale = particle.scale * (0.5 + opacity * 0.5);
        
        return (
          <mesh
            key={particle.id}
            position={[particle.position.x, particle.position.y, particle.position.z]}
            scale={[scale, scale, scale]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={isPerfect ? "#ffaa00" : "#ff5555"}
              emissive={isPerfect ? "#ffaa00" : "#ff3333"}
              emissiveIntensity={isPerfect ? 2.0 : 1.5}
              transparent
              opacity={opacity}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}
