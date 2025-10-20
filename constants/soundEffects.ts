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
    url: "https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3",
    icon: "☔",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    nameZh: "海浪",
    url: "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
    icon: "🌊",
  },
  {
    id: "forest",
    name: "Forest Birds",
    nameZh: "森林鳥鳴",
    url: "https://assets.mixkit.co/active_storage/sfx/1209/1209-preview.mp3",
    icon: "🌲",
  },
  {
    id: "wind",
    name: "Wind",
    nameZh: "風聲",
    url: "https://assets.mixkit.co/active_storage/sfx/1234/1234-preview.mp3",
    icon: "💨",
  },
  {
    id: "fire",
    name: "Fireplace",
    nameZh: "壁爐",
    url: "https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3",
    icon: "🔥",
  },
  {
    id: "night",
    name: "Night Sounds",
    nameZh: "夜晚",
    url: "https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3",
    icon: "🌙",
  },
];
