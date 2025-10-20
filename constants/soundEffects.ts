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
    url: "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
    icon: "☔",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    nameZh: "海浪",
    url: "https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3",
    icon: "🌊",
  },
  {
    id: "forest",
    name: "Forest Birds",
    nameZh: "森林鳥鳴",
    url: "https://assets.mixkit.co/active_storage/sfx/2462/2462-preview.mp3",
    icon: "🌲",
  },
  {
    id: "wind",
    name: "Wind",
    nameZh: "風聲",
    url: "https://assets.mixkit.co/active_storage/sfx/2391/2391-preview.mp3",
    icon: "💨",
  },
  {
    id: "fire",
    name: "Fireplace",
    nameZh: "壁爐",
    url: "https://assets.mixkit.co/active_storage/sfx/2494/2494-preview.mp3",
    icon: "🔥",
  },
  {
    id: "meditation",
    name: "Meditation Music",
    nameZh: "冥想音樂",
    url: "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3",
    icon: "🧘",
  },
  {
    id: "tibetan",
    name: "Tibetan Bowls",
    nameZh: "西藏頌缽",
    url: "https://assets.mixkit.co/active_storage/sfx/513/513-preview.mp3",
    icon: "🎵",
  },
  {
    id: "nature",
    name: "Nature Sounds",
    nameZh: "大自然",
    url: "https://assets.mixkit.co/active_storage/sfx/2465/2465-preview.mp3",
    icon: "🌿",
  },
];
