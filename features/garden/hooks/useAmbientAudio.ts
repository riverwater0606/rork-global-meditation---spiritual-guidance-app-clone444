import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";

interface AmbientSound {
  id: string;
  name: { zh: string; en: string };
  url: string;
}

interface SoundCategory {
  id: string;
  name: { zh: string; en: string };
  sounds: AmbientSound[];
}

export function useAmbientAudio(categories: SoundCategory[]) {
  const GIFT_SEND_SOUND_URI =
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b6a66f4db.mp3?filename=magic-2-16764.mp3";
  const giftSoundRef = useRef<Audio.Sound | null>(null);
  const ambientSoundRef = useRef<Audio.Sound | null>(null);
  const [selectedAmbientSound, setSelectedAmbientSound] = useState<string | null>(null);
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (giftSoundRef.current) await giftSoundRef.current.unloadAsync();
        if (ambientSoundRef.current) await ambientSoundRef.current.unloadAsync();
      };
      void cleanup();
    };
  }, []);

  useEffect(() => {
    const loadAmbientSound = async () => {
      if (ambientSoundRef.current) {
        await ambientSoundRef.current.unloadAsync();
        ambientSoundRef.current = null;
      }
      if (!selectedAmbientSound) return;
      let soundUrl: string | null = null;
      for (const category of categories) {
        const sound = category.sounds.find((s) => s.id === selectedAmbientSound);
        if (sound) {
          soundUrl = sound.url;
          break;
        }
      }
      if (!soundUrl) return;
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true, isLooping: true, volume: ambientVolume }
      );
      ambientSoundRef.current = sound;
    };
    void loadAmbientSound();
  }, [ambientVolume, categories, selectedAmbientSound]);

  const syncMeditatingState = useCallback(async (isMeditating: boolean) => {
    if (!ambientSoundRef.current) return;
    if (isMeditating) {
      await ambientSoundRef.current.playAsync();
    }
  }, []);

  const playGiftSendSound = useCallback(async () => {
    if (giftSoundRef.current) {
      await giftSoundRef.current.unloadAsync();
      giftSoundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: GIFT_SEND_SOUND_URI });
    giftSoundRef.current = sound;
    await sound.playAsync();
  }, []);

  return {
    selectedAmbientSound,
    setSelectedAmbientSound,
    ambientVolume,
    setAmbientVolume,
    showSoundPicker,
    setShowSoundPicker,
    syncMeditatingState,
    playGiftSendSound,
  };
}
