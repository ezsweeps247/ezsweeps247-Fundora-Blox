import { useEffect } from 'react';
import { useAudio } from '@/lib/stores/useAudio';
import { useGame } from '@/lib/stores/useGame';

export function SoundManager() {
  const setBackgroundMusic = useAudio(state => state.setBackgroundMusic);
  const setHitSound = useAudio(state => state.setHitSound);
  const setSuccessSound = useAudio(state => state.setSuccessSound);
  const playHit = useAudio(state => state.playHit);
  const playSuccess = useAudio(state => state.playSuccess);
  const isMuted = useAudio(state => state.isMuted);
  const backgroundMusic = useAudio(state => state.backgroundMusic);
  
  useEffect(() => {
    const bgMusic = new Audio('/sounds/background-music.wav');
    bgMusic.loop = true;
    bgMusic.volume = 0.2;
    setBackgroundMusic(bgMusic);
    
    const hitAudio = new Audio('/sounds/hit.mp3');
    hitAudio.volume = 0.3;
    setHitSound(hitAudio);
    
    const successAudio = new Audio('/sounds/success.mp3');
    successAudio.volume = 0.5;
    setSuccessSound(successAudio);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);
  
  useEffect(() => {
    if (backgroundMusic) {
      if (!isMuted) {
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Background music started playing');
            })
            .catch(err => {
              console.log('Background music play prevented:', err);
            });
        }
      } else {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
    }
  }, [isMuted, backgroundMusic]);
  
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
