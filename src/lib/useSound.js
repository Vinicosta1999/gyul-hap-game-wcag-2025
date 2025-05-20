import { Howl, Howler } from "howler";
import { useState, useCallback, useRef, useEffect } from "react";

// Sounds - make sure these paths are correct relative to the public folder
const soundFiles = {
  select: "/sounds/select.wav",
  correct: "/sounds/correct.wav",
  incorrect: "/sounds/incorrect.wav",
  gyul_win: "/sounds/gyul_win.wav",
  timer_alarm: "/sounds/timer_alarm.wav", // Dedicated timer alarm sound
  // timer_tick: "/sounds/select.wav" // Placeholder, can be a more subtle tick
};

const musicFiles = {
  background_1: "/sounds/background_music_1.mp3",
};

const sounds = {};
const musicTracks = {};

// Preload sounds and music
if (typeof window !== "undefined") {
  for (const key in soundFiles) {
    sounds[key] = new Howl({
      src: [soundFiles[key]],
      volume: 0.7,
    });
  }
  for (const key in musicFiles) {
    musicTracks[key] = new Howl({
      src: [musicFiles[key]],
      volume: 0.3, // Music usually softer
      loop: true,
      html5: true, // Recommended for longer audio like music
    });
  }
}

export const useSound = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const currentMusicRef = useRef(null); // To keep track of the currently playing music track

  const playSound = useCallback(
    (soundKey) => {
      if (!isMuted && sounds[soundKey]) {
        sounds[soundKey].play();
      }
    },
    [isMuted]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prevMuted) => {
      const newMutedState = !prevMuted;
      // Mute/unmute all sound effects
      for (const key in sounds) {
        sounds[key].mute(newMutedState);
      }
      // If unmuting effects, and music is supposed to be playing but was globally muted, ensure it plays
      // If muting effects, music should also be controlled by its own state or global Howler mute
      // For simplicity here, we let music be controlled by its own toggle and global Howler.mute if needed
      return newMutedState;
    });
  }, []);

  const playMusic = useCallback((musicKey = "background_1") => {
    if (currentMusicRef.current && currentMusicRef.current.playing()) {
      currentMusicRef.current.stop(); // Stop any currently playing music
    }
    if (musicTracks[musicKey]) {
      musicTracks[musicKey].play();
      currentMusicRef.current = musicTracks[musicKey];
      setIsMusicPlaying(true);
    }
  }, []);

  const stopMusic = useCallback(() => {
    if (currentMusicRef.current && currentMusicRef.current.playing()) {
      currentMusicRef.current.stop();
    }
    setIsMusicPlaying(false);
  }, []);

  const toggleMusic = useCallback((musicKey = "background_1") => {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      playMusic(musicKey);
    }
  }, [isMusicPlaying, playMusic, stopMusic]);
  
  // Effect to handle global mute for music as well
  useEffect(() => {
    if (currentMusicRef.current) {
        currentMusicRef.current.mute(isMuted);
    }
  }, [isMuted]);

  return { playSound, toggleMute, isMuted, playMusic, stopMusic, isMusicPlaying, toggleMusic, musicTracks: (typeof window !== "undefined" ? musicTracks : null) };
};

