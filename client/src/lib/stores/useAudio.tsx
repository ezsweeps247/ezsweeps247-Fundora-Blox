import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  hitBuffer: AudioBuffer | null;
  audioContext: AudioContext | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setHitBuffer: (buffer: AudioBuffer) => void;
  setAudioContext: (context: AudioContext) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  hitBuffer: null,
  audioContext: null,
  isMuted: true, // Start muted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setHitBuffer: (buffer) => set({ hitBuffer: buffer }),
  setAudioContext: (context) => set({ audioContext: context }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitBuffer, audioContext, isMuted } = get();
    if (!hitBuffer || !audioContext || isMuted) {
      return;
    }
    
    try {
      // Resume audio context if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Create a new buffer source for each play (allows overlapping)
      const source = audioContext.createBufferSource();
      source.buffer = hitBuffer;
      
      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.3;
      
      // Connect and play
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(0);
      
      // Clean up after the sound finishes
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.log("Hit sound play error:", error);
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  }
}));
