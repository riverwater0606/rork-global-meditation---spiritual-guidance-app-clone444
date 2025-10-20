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
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
    icon: "☔",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    nameZh: "海浪",
    url: "https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e0.mp3",
    icon: "🌊",
  },
  {
    id: "forest",
    name: "Forest Birds",
    nameZh: "森林鳥鳴",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_c610232532.mp3",
    icon: "🌲",
  },
  {
    id: "wind",
    name: "Wind",
    nameZh: "風聲",
    url: "https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3",
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
    id: "meditation",
    name: "Meditation Music",
    nameZh: "冥想音樂",
    url: "https://cdn.pixabay.com/audio/2023/10/05/audio_bb630cc098.mp3",
    icon: "🧘",
  },
  {
    id: "tibetan",
    name: "Tibetan Bowls",
    nameZh: "西藏頌缽",
    url: "https://cdn.pixabay.com/audio/2022/03/24/audio_98fdbb2f54.mp3",
    icon: "🎵",
  },
  {
    id: "nature",
    name: "Nature Sounds",
    nameZh: "大自然",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_26b302eb70.mp3",
    icon: "🌿",
  },
];
