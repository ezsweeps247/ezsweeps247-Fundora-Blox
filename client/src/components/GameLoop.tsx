import { useFrame } from '@react-three/fiber';
import { useGame } from '@/lib/stores/useGame';

export function GameLoop() {
  const updateBlockPosition = useGame(state => state.updateBlockPosition);
  const phase = useGame(state => state.phase);
  
  useFrame((state, delta) => {
    if (phase === 'playing') {
      updateBlockPosition(delta);
    }
  });
  
  return null;
}
