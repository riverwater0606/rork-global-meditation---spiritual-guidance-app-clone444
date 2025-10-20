export interface MeditationSession {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  duration: number;
  category: string;
  narrator: string;
  narratorZh: string;
  gradient: string[];
  featured: boolean;
}

export const CATEGORIES = [
  { id: "all", name: "All", nameZh: "全部" },
  { id: "mindfulness", name: "Mindfulness", nameZh: "正念" },
  { id: "sleep", name: "Sleep", nameZh: "睡眠" },
  { id: "anxiety", name: "Anxiety", nameZh: "放鬆" },
  { id: "focus", name: "Focus", nameZh: "專注" },
  { id: "gratitude", name: "Gratitude", nameZh: "感恩" },
  { id: "spiritual", name: "Spiritual", nameZh: "靈性" },
];

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: "morning-mindfulness",
    title: "Morning Mindfulness",
    titleZh: "晨間正念",
    description: "Start your day with clarity and intention through gentle awareness practices.",
    descriptionZh: "以輕柔的覺知練習，帶著清晰和意圖開始新的一天。",
    duration: 10,
    category: "mindfulness",
    narrator: "Sarah Chen",
    narratorZh: "陳莎拉",
    gradient: ["#FF6B6B", "#FF8E53"],
    featured: true,
  },
  {
    id: "deep-sleep",
    title: "Deep Sleep Journey",
    titleZh: "深度睡眠之旅",
    description: "Drift into peaceful slumber with calming visualizations and body relaxation.",
    descriptionZh: "透過平靜的視覺化和身體放鬆，進入安詳的睡眠狀態。",
    duration: 20,
    category: "sleep",
    narrator: "Michael Rivers",
    narratorZh: "麥克·里弗斯",
    gradient: ["#667EEA", "#764BA2"],
    featured: true,
  },
  {
    id: "anxiety-relief",
    title: "Anxiety Relief",
    titleZh: "焦慮釋放",
    description: "Release tension and find calm through breathing techniques and grounding exercises.",
    descriptionZh: "透過呼吸技巧和扎根練習，釋放緊張並找到平靜。",
    duration: 15,
    category: "anxiety",
    narrator: "Emma Thompson",
    narratorZh: "艾瑪·湯普森",
    gradient: ["#4FACFE", "#00F2FE"],
    featured: true,
  },
  {
    id: "focus-flow",
    title: "Focus & Flow",
    titleZh: "專注心流",
    description: "Enhance concentration and enter a state of productive flow.",
    descriptionZh: "增強專注力，進入高效的心流狀態。",
    duration: 12,
    category: "focus",
    narrator: "David Kim",
    narratorZh: "金大衛",
    gradient: ["#43E97B", "#38F9D7"],
    featured: false,
  },
  {
    id: "gratitude-practice",
    title: "Gratitude Practice",
    titleZh: "感恩練習",
    description: "Cultivate appreciation and joy through guided gratitude meditation.",
    descriptionZh: "透過引導式感恩冥想，培養欣賞和喜悅之心。",
    duration: 8,
    category: "gratitude",
    narrator: "Lisa Martinez",
    narratorZh: "莉莎·馬汀尼茲",
    gradient: ["#FA709A", "#FEE140"],
    featured: false,
  },
  {
    id: "spiritual-awakening",
    title: "Spiritual Awakening",
    titleZh: "靈性覺醒",
    description: "Connect with your higher self and explore spiritual dimensions.",
    descriptionZh: "與你的高我連結，探索靈性的維度。",
    duration: 25,
    category: "spiritual",
    narrator: "Raj Patel",
    narratorZh: "拉吉·帕特爾",
    gradient: ["#A8EDEA", "#FED6E3"],
    featured: false,
  },
  {
    id: "body-scan",
    title: "Body Scan Relaxation",
    titleZh: "身體掃描放鬆",
    description: "Progressive relaxation through mindful body awareness.",
    descriptionZh: "透過正念的身體覺知，進行漸進式放鬆。",
    duration: 18,
    category: "mindfulness",
    narrator: "Sarah Chen",
    narratorZh: "陳莎拉",
    gradient: ["#FBC2EB", "#A6C1EE"],
    featured: false,
  },
  {
    id: "loving-kindness",
    title: "Loving Kindness",
    titleZh: "慈愛冥想",
    description: "Cultivate compassion for yourself and others through metta meditation.",
    descriptionZh: "透過慈心冥想，培養對自己和他人的慈悲心。",
    duration: 15,
    category: "spiritual",
    narrator: "Emma Thompson",
    narratorZh: "艾瑪·湯普森",
    gradient: ["#F093FB", "#F5576C"],
    featured: false,
  },
];