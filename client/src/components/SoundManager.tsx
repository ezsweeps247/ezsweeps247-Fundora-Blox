import { useEffect } from 'react';
import { useAudio } from '@/lib/stores/useAudio';
import { useGame } from '@/lib/stores/useGame';

export function SoundManager() {
  const setHitSound = useAudio(state => state.setHitSound);
  const setSuccessSound = useAudio(state => state.setSuccessSound);
  const playHit = useAudio(state => state.playHit);
  const playSuccess = useAudio(state => state.playSuccess);
  
  useEffect(() => {
    const hitAudio = new Audio('/sounds/hit.mp3');
    hitAudio.volume = 0.3;
    setHitSound(hitAudio);
    
    const successAudio = new Audio('/sounds/success.mp3');
    successAudio.volume = 0.5;
    setSuccessSound(successAudio);
  }, [setHitSound, setSuccessSound]);
  
  useEffect(() => {
    const unsubscribe = useGame.subscribe(
      (state) => state.blocks.length,
      (blocksLength, prevBlocksLength) => {
        if (blocksLength > prevBlocksLength) {
          playSuccess();
        }
      }
    );
    
    return unsubscribe;
  }, [playSuccess]);
  
  useEffect(() => {
    const unsubscribe = useGame.subscribe(
      (state) => state.phase,
      (phase, prevPhase) => {
        if (phase === 'ended' && prevPhase === 'playing') {
          playHit();
        }
      }
    );
    
    return unsubscribe;
  }, [playHit]);
  
  return null;
}
