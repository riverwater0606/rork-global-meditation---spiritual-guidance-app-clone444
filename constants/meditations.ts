import type { Language } from "@/providers/SettingsProvider";
import type { MeditationAccessTier } from "@/constants/vip";

export interface MeditationSession {
  id: string;
  title: string;
  description: string;
  titleZh?: string;
  titleEn?: string;
  titleEs?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  descriptionEs?: string;
  duration: number; // in minutes
  category: string;
  narrator: string;
  gradient: string[];
  featured: boolean;
  accessTier: MeditationAccessTier;
  isCoreJourney?: boolean;
}

export const getMeditationAccessTier = (_id: string): MeditationAccessTier => "free";

export const isFreeMeditationId = (_id: string) => true;

export const getMeditationTitle = (
  session: MeditationSession,
  language: Language
) => {
  if (language === "zh") {
    return session.titleZh || session.title;
  }
  if (language === "es") {
    return session.titleEs || session.titleEn || session.title;
  }
  return session.titleEn || session.title;
};

export const getMeditationDescription = (
  session: MeditationSession,
  language: Language
) => {
  if (language === "zh") {
    return session.descriptionZh || session.description;
  }
  if (language === "es") {
    return session.descriptionEs || session.descriptionEn || session.description;
  }
  return session.descriptionEn || session.description;
};

export const CATEGORIES = [
  { id: "all", name: "All", nameZh: "全部", nameEs: "Todo" },
  { id: "mindfulness", name: "Mindfulness", nameZh: "正念", nameEs: "Atención plena" },
  { id: "sleep", name: "Sleep", nameZh: "睡眠", nameEs: "Sueño" },
  { id: "anxiety", name: "Anxiety", nameZh: "焦慮", nameEs: "Ansiedad" },
  { id: "focus", name: "Focus", nameZh: "專注", nameEs: "Enfoque" },
  { id: "gratitude", name: "Gratitude", nameZh: "感恩", nameEs: "Gratitud" },
  { id: "spiritual", name: "Spiritual", nameZh: "靈性", nameEs: "Espiritual" },
] as const;

export const getCategoryName = (
  category: (typeof CATEGORIES)[number],
  language: Language
) => {
  if (language === "zh") return category.nameZh || category.name;
  if (language === "es") return category.nameEs || category.name;
  return category.name;
};

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: "core-return-to-breath",
    title: "Return to Breath",
    titleZh: "回到呼吸",
    titleEn: "Return to Breath",
    titleEs: "Volver a la respiración",
    description: "Let the breath become the first quiet place you can return to.",
    descriptionZh: "讓呼吸先成為你可以回來的第一個安靜地方。",
    descriptionEn: "Let the breath become the first quiet place you can return to.",
    descriptionEs: "Deja que la respiración sea el primer lugar de quietud al que puedas volver.",
    duration: 8,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#7C3AED", "#4F46E5"],
    featured: true,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-return-to-body",
    title: "Return to Body",
    titleZh: "回到身體",
    titleEn: "Return to Body",
    titleEs: "Volver al cuerpo",
    description: "Soften back into the body and let sensation become a steady anchor.",
    descriptionZh: "慢慢回到身體，讓感受成為穩定的錨點。",
    descriptionEn: "Soften back into the body and let sensation become a steady anchor.",
    descriptionEs: "Vuelve suavemente al cuerpo y deja que la sensación se convierta en un ancla estable.",
    duration: 10,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#7C3AED", "#4338CA"],
    featured: true,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-sit-in-the-present",
    title: "Sit in the Present",
    titleZh: "在當下坐穩",
    titleEn: "Sit in the Present",
    titleEs: "Sentarse en el presente",
    description: "Learn to stay here without rushing toward the next thought.",
    descriptionZh: "學會停留在這裡，而不是急著追下一個念頭。",
    descriptionEn: "Learn to stay here without rushing toward the next thought.",
    descriptionEs: "Aprende a permanecer aquí sin correr hacia el siguiente pensamiento.",
    duration: 10,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#6D28D9", "#4338CA"],
    featured: true,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-loosen-control",
    title: "Loosen Control",
    titleZh: "放下控制",
    titleEn: "Loosen Control",
    titleEs: "Soltar el control",
    description: "Release the habit of gripping every moment so the mind can soften.",
    descriptionZh: "放下每一刻都要抓住的習慣，讓心慢慢鬆開。",
    descriptionEn: "Release the habit of gripping every moment so the mind can soften.",
    descriptionEs: "Suelta el hábito de aferrarte a cada momento para que la mente pueda suavizarse.",
    duration: 10,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#5B21B6", "#4338CA"],
    featured: false,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-let-feelings-flow",
    title: "Let Feelings Flow",
    titleZh: "讓感受流動",
    titleEn: "Let Feelings Flow",
    titleEs: "Dejar fluir las emociones",
    description: "Meet what is moving through you without freezing it into identity.",
    descriptionZh: "與正在流動的感受同在，而不把它凝固成自己。",
    descriptionEn: "Meet what is moving through you without freezing it into identity.",
    descriptionEs: "Encuentra lo que se mueve a través de ti sin convertirlo en identidad.",
    duration: 12,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#4C1D95", "#4338CA"],
    featured: false,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-dont-follow-thoughts",
    title: "Don't Follow Every Thought",
    titleZh: "不跟念頭走",
    titleEn: "Don't Follow Every Thought",
    titleEs: "No seguir cada pensamiento",
    description: "Notice thoughts arising and learn not to hand them your whole attention.",
    descriptionZh: "看見念頭升起，學會不把整個注意力都交出去。",
    descriptionEn: "Notice thoughts arising and learn not to hand them your whole attention.",
    descriptionEs: "Observa cómo surgen los pensamientos y aprende a no entregarles toda tu atención.",
    duration: 12,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#4C1D95", "#3730A3"],
    featured: false,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-return-to-the-witness",
    title: "Return to the Witness",
    titleZh: "回到觀看者",
    titleEn: "Return to the Witness",
    titleEs: "Volver al testigo",
    description: "Shift gently from the story itself to the awareness that notices it.",
    descriptionZh: "輕輕由故事本身，轉回那個正在看見故事的覺知。",
    descriptionEn: "Shift gently from the story itself to the awareness that notices it.",
    descriptionEs: "Desplázate suavemente de la historia misma a la conciencia que la observa.",
    duration: 12,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#312E81", "#3730A3"],
    featured: false,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-awareness-is-wider",
    title: "Awareness Is Wider",
    titleZh: "覺知比內容更大",
    titleEn: "Awareness Is Wider",
    titleEs: "La conciencia es más amplia",
    description: "Rest in the sense that awareness can hold more than any single state.",
    descriptionZh: "安住於一種感覺：覺知能容納的，比任何單一狀態都更大。",
    descriptionEn: "Rest in the sense that awareness can hold more than any single state.",
    descriptionEs: "Descansa en la sensación de que la conciencia puede sostener más que cualquier estado individual.",
    duration: 14,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#312E81", "#1D4ED8"],
    featured: false,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-rest-in-spaciousness",
    title: "Rest in Spaciousness",
    titleZh: "安住於寬廣",
    titleEn: "Rest in Spaciousness",
    titleEs: "Descansar en la amplitud",
    description: "A closing practice in spaciousness, softness, and non-grasping presence.",
    descriptionZh: "一節收束式練習，回到寬廣、柔軟與不抓取的在場。",
    descriptionEn: "A closing practice in spaciousness, softness, and non-grasping presence.",
    descriptionEs: "Una práctica de cierre en amplitud, suavidad y presencia sin aferrarse.",
    duration: 15,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#1E1B4B", "#1D4ED8"],
    featured: false,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "core-untitled",
    title: "Untitled",
    titleZh: "無題",
    titleEn: "Untitled",
    titleEs: "Sin título",
    description: "A final, lighter sit with almost nothing to hold and nowhere else to go.",
    descriptionZh: "最後一節更輕的靜坐，幾乎沒有什麼要抓住，也沒有哪裡需要趕去。",
    descriptionEn: "A final, lighter sit with almost nothing to hold and nowhere else to go.",
    descriptionEs: "Una última quietud más ligera, con casi nada que sostener y ningún otro lugar adonde ir.",
    duration: 8,
    category: "spiritual",
    narrator: "PSI-G Core",
    gradient: ["#111827", "#312E81"],
    featured: false,
    accessTier: "free",
    isCoreJourney: true,
  },
  {
    id: "morning-mindfulness",
    title: "Morning Mindfulness",
    description: "Start your day with clarity and intention through gentle awareness practices.",
    duration: 10,
    category: "mindfulness",
    narrator: "Sarah Chen",
    gradient: ["#FF6B6B", "#FF8E53"],
    featured: true,
    accessTier: getMeditationAccessTier("morning-mindfulness"),
  },
  {
    id: "deep-sleep",
    title: "Deep Sleep Journey",
    description: "Drift into peaceful slumber with calming visualizations and body relaxation.",
    duration: 20,
    category: "sleep",
    narrator: "Michael Rivers",
    gradient: ["#667EEA", "#764BA2"],
    featured: true,
    accessTier: getMeditationAccessTier("deep-sleep"),
  },
  {
    id: "anxiety-relief",
    title: "Anxiety Relief",
    description: "Release tension and find calm through breathing techniques and grounding exercises.",
    duration: 15,
    category: "anxiety",
    narrator: "Emma Thompson",
    gradient: ["#4FACFE", "#00F2FE"],
    featured: true,
    accessTier: getMeditationAccessTier("anxiety-relief"),
  },
  {
    id: "focus-flow",
    title: "Focus & Flow",
    description: "Enhance concentration and enter a state of productive flow.",
    duration: 12,
    category: "focus",
    narrator: "David Kim",
    gradient: ["#43E97B", "#38F9D7"],
    featured: false,
    accessTier: getMeditationAccessTier("focus-flow"),
  },
  {
    id: "gratitude-practice",
    title: "Gratitude Practice",
    description: "Cultivate appreciation and joy through guided gratitude meditation.",
    duration: 8,
    category: "gratitude",
    narrator: "Lisa Martinez",
    gradient: ["#FA709A", "#FEE140"],
    featured: false,
    accessTier: getMeditationAccessTier("gratitude-practice"),
  },
  {
    id: "spiritual-awakening",
    title: "Spiritual Awakening",
    description: "Connect with your higher self and explore spiritual dimensions.",
    duration: 25,
    category: "spiritual",
    narrator: "Raj Patel",
    gradient: ["#A8EDEA", "#FED6E3"],
    featured: false,
    accessTier: getMeditationAccessTier("spiritual-awakening"),
  },
  {
    id: "body-scan",
    title: "Body Scan Relaxation",
    description: "Progressive relaxation through mindful body awareness.",
    duration: 18,
    category: "mindfulness",
    narrator: "Sarah Chen",
    gradient: ["#FBC2EB", "#A6C1EE"],
    featured: false,
    accessTier: getMeditationAccessTier("body-scan"),
  },
  {
    id: "loving-kindness",
    title: "Loving Kindness",
    description: "Cultivate compassion for yourself and others through metta meditation.",
    duration: 15,
    category: "spiritual",
    narrator: "Emma Thompson",
    gradient: ["#F093FB", "#F5576C"],
    featured: false,
    accessTier: getMeditationAccessTier("loving-kindness"),
  },
];
