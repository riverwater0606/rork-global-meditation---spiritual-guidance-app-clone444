export interface SoundEffect {
  id: string;
  name: string;
  nameZh: string;
  url: string;
  icon: string;
}

export const SOUND_EFFECTS: SoundEffect[] = [
  {
    id: "rain",
    name: "Rain",
    nameZh: "雨聲",
    url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112ce3f.mp3",
    icon: "☔",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    nameZh: "海浪",
    url: "https://cdn.pixabay.com/audio/2022/06/07/audio_1426c6de6f.mp3",
    icon: "🌊",
  },
  {
    id: "forest",
    name: "Forest Birds",
    nameZh: "森林鳥鳴",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4e178b896e.mp3",
    icon: "🌲",
  },
  {
    id: "wind",
    name: "Wind",
    nameZh: "風聲",
    url: "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3",
    icon: "💨",
  },
  {
    id: "fire",
    name: "Fireplace",
    nameZh: "壁爐",
    url: "https://cdn.pixabay.com/audio/2022/03/12/audio_4dbc359e35.mp3",
    icon: "🔥",
  },
  {
    id: "night",
    name: "Night Sounds",
    nameZh: "夜晚",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_c610232532.mp3",
    icon: "🌙",
  },
  {
    id: "tibetan",
    name: "Tibetan Bowls",
    nameZh: "西藏頌缽",
    url: "https://cdn.pixabay.com/audio/2022/10/26/audio_b8766b29df.mp3",
    icon: "🎵",
  },
  {
    id: "stream",
    name: "Stream",
    nameZh: "溪流",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_f2b5951349.mp3",
    icon: "💧",
  },
];
