export type MissionMetric =
  | "totalSessions"
  | "totalMinutes"
  | "currentStreak"
  | "blessingsSent"
  | "uniqueCategories"
  | "orbsStored"
  | "shapeChanges"
  | "highestOrbLevel"
  | "customMeditationsCreated"
  | "customMeditationsCompleted";

export interface MissionDefinition {
  id: string;
  unlockShape?: string;
  metric: MissionMetric;
  reward?: {
    zh: string;
    en: string;
    es?: string;
  };
  target: {
    free: number;
    vip: number;
  };
  title: {
    zh: string;
    en: string;
    es?: string;
  };
  description: {
    zh: string;
    en: string;
    es?: string;
  };
}

export const SHAPE_MISSION_DEFINITIONS: MissionDefinition[] = [
  {
    id: "first-light",
    unlockShape: "grid-of-life",
    metric: "totalSessions",
    target: { free: 1, vip: 1 },
    title: {
      zh: "初光啟動",
      en: "First Light",
      es: "Primera luz",
    },
    description: {
      zh: "完成第一次冥想，啟動生命之格。",
      en: "Complete your first meditation to unlock Grid of Life.",
      es: "Completa tu primera meditación para desbloquear la Cuadrícula de la Vida.",
    },
  },
  {
    id: "breath-channel",
    unlockShape: "vortex-ring",
    metric: "totalMinutes",
    target: { free: 21, vip: 15 },
    title: {
      zh: "呼吸通道",
      en: "Breath Channel",
      es: "Canal de respiración",
    },
    description: {
      zh: "累積足夠靜心分鐘數，喚醒漩渦環。",
      en: "Accumulate enough meditation minutes to unlock Vortex Ring.",
      es: "Acumula suficientes minutos de meditación para desbloquear el Anillo Vórtice.",
    },
  },
  {
    id: "blessing-bridge",
    unlockShape: "ring-torus",
    metric: "blessingsSent",
    target: { free: 1, vip: 1 },
    title: {
      zh: "祝福橋樑",
      en: "Blessing Bridge",
      es: "Puente de bendición",
    },
    description: {
      zh: "送出第一顆光球，打開環形托羅斯。",
      en: "Send your first orb blessing to unlock Ring Torus.",
      es: "Envía tu primera bendición de esfera para desbloquear el Toro Anular.",
    },
  },
  {
    id: "steady-waves",
    unlockShape: "seven-waves",
    metric: "currentStreak",
    target: { free: 3, vip: 2 },
    title: {
      zh: "穩定波頻",
      en: "Steady Waves",
      es: "Ondas estables",
    },
    description: {
      zh: "連續完成 3 天冥想（VIP 為 2 天），即可解鎖七重波。",
      en: "Complete a 3-day meditation streak (2 days for VIP) to unlock Seven Waves.",
      es: "Completa una racha de 3 días de meditación (2 días para VIP) para desbloquear Siete Ondas.",
    },
  },
  {
    id: "sacred-explorer",
    unlockShape: "lotus-galaxy",
    metric: "uniqueCategories",
    target: { free: 3, vip: 2 },
    title: {
      zh: "神聖探索者",
      en: "Sacred Explorer",
      es: "Explorador sagrado",
    },
    description: {
      zh: "完成 3 個不同冥想主題（VIP 為 2 個），即可解鎖蓮華星系。",
      en: "Complete 3 different meditation categories (2 for VIP) to unlock Lotus Galaxy.",
      es: "Completa 3 categorías de meditación distintas (2 para VIP) para desbloquear la Galaxia de Loto.",
    },
  },
  {
    id: "orb-keeper",
    unlockShape: "fractal-tree",
    metric: "orbsStored",
    target: { free: 1, vip: 1 },
    title: { zh: "光球守護者", en: "Orb Keeper", es: "Guardiana de la esfera" },
    description: {
      zh: "首次把光球收入收藏，讓分形之樹在你的花園扎根。",
      en: "Store your first orb and let the Fractal Tree take root in your garden.",
      es: "Guarda tu primera esfera y deja que el Árbol Fractal eche raíces en tu jardín.",
    },
  },
  {
    id: "inner-orbit",
    unlockShape: "lattice-wave",
    metric: "totalMinutes",
    target: { free: 28, vip: 20 },
    title: { zh: "內在軌道", en: "Inner Orbit", es: "Órbita interior" },
    description: {
      zh: "累積完成 28 分鐘冥想（VIP 為 20 分鐘），即可解鎖晶格波。",
      en: "Accumulate 28 total meditation minutes (20 for VIP) to unlock Lattice Wave.",
      es: "Acumula 28 minutos totales de meditación (20 para VIP) para desbloquear la Onda de Retícula.",
    },
  },
  {
    id: "shape-initiation",
    unlockShape: "golden-spiral",
    metric: "shapeChanges",
    target: { free: 1, vip: 1 },
    title: { zh: "形態啟蒙", en: "Form Initiation", es: "Iniciación de forma" },
    description: {
      zh: "第一次切換光球形態，進入黃金螺旋的流動。",
      en: "Change your orb form once to unlock the Golden Spiral current.",
      es: "Cambia la forma de tu esfera una vez para desbloquear la corriente de la Espiral Dorada.",
    },
  },
  {
    id: "third-session-gate",
    unlockShape: "seed-of-life",
    metric: "totalSessions",
    target: { free: 3, vip: 2 },
    title: { zh: "種子之門", en: "Seed Gate", es: "Puerta semilla" },
    description: {
      zh: "完成 3 次冥想（VIP 為 2 次），即可解鎖生命之種。",
      en: "Complete 3 meditation sessions (2 for VIP) to unlock Seed of Life.",
      es: "Completa 3 sesiones de meditación (2 para VIP) para desbloquear la Semilla de la Vida.",
    },
  },
  {
    id: "ritual-depth",
    unlockShape: "vesica-piscis",
    metric: "totalMinutes",
    target: { free: 45, vip: 32 },
    title: { zh: "靈性深潛", en: "Ritual Depth", es: "Profundidad ritual" },
    description: {
      zh: "累積完成 45 分鐘冥想（VIP 為 32 分鐘），即可解鎖魚泡聖門。",
      en: "Accumulate 45 total meditation minutes (32 for VIP) to unlock Vesica Piscis.",
      es: "Acumula 45 minutos totales de meditación (32 para VIP) para desbloquear la Vesica Piscis.",
    },
  },
  {
    id: "sacred-bridge",
    unlockShape: "double-helix-dna",
    metric: "blessingsSent",
    target: { free: 2, vip: 1 },
    title: { zh: "神聖橋樑", en: "Sacred Bridge", es: "Puente sagrado" },
    description: {
      zh: "送出 2 次祝福（VIP 為 1 次），即可解鎖雙螺旋 DNA。",
      en: "Send 2 blessings (1 for VIP) to unlock Double Helix DNA.",
      es: "Envía 2 bendiciones (1 para VIP) para desbloquear el ADN de Doble Hélice.",
    },
  },
  {
    id: "calm-discipline",
    unlockShape: "golden-circles",
    metric: "currentStreak",
    target: { free: 3, vip: 2 },
    title: { zh: "黃金節律", en: "Golden Rhythm", es: "Ritmo dorado" },
    description: {
      zh: "連續完成 3 天冥想（VIP 為 2 天），即可解鎖黃金圓環。",
      en: "Complete a 3-day meditation streak (2 days for VIP) to unlock Golden Circles.",
      es: "Completa una racha de 3 días de meditación (2 días para VIP) para desbloquear los Círculos Dorados.",
    },
  },
  {
    id: "harmonic-pulse",
    unlockShape: "wave-interference",
    metric: "totalMinutes",
    target: { free: 60, vip: 45 },
    title: { zh: "共振脈衝", en: "Harmonic Pulse", es: "Pulso armónico" },
    description: {
      zh: "累積完成 60 分鐘冥想（VIP 為 45 分鐘），即可解鎖波干涉。",
      en: "Accumulate 60 total meditation minutes (45 for VIP) to unlock Wave Interference.",
      es: "Acumula 60 minutos totales de meditación (45 para VIP) para desbloquear la Interferencia de Ondas.",
    },
  },
  {
    id: "soul-mapping",
    unlockShape: "sri-yantra",
    metric: "uniqueCategories",
    target: { free: 4, vip: 3 },
    title: { zh: "靈魂地圖", en: "Soul Mapping", es: "Mapa del alma" },
    description: {
      zh: "完成 4 個不同冥想主題（VIP 為 3 個），即可解鎖斯里延陀羅。",
      en: "Complete 4 different meditation categories (3 for VIP) to unlock Sri Yantra.",
      es: "Completa 4 categorías de meditación distintas (3 para VIP) para desbloquear el Sri Yantra.",
    },
  },
  {
    id: "orb-rise",
    unlockShape: "crown-chakra",
    metric: "highestOrbLevel",
    target: { free: 3, vip: 2 },
    title: { zh: "升頻之冠", en: "Crown Rising", es: "Corona ascendente" },
    description: {
      zh: "把主光球升到 3 級（VIP 為 2 級），即可解鎖頂輪。",
      en: "Raise your main orb to level 3 (2 for VIP) to unlock Crown Chakra.",
      es: "Lleva tu esfera principal al nivel 3 (2 para VIP) para desbloquear el Chakra Corona.",
    },
  },
  {
    id: "awakened-path",
    unlockShape: "akashic-galaxy",
    metric: "highestOrbLevel",
    target: { free: 7, vip: 7 },
    title: { zh: "覺醒之路", en: "Awakened Path", es: "Camino del despertar" },
    description: {
      zh: "完成 7 日養成，讓主光球升到 7 級，即可解鎖阿卡西星系。",
      en: "Complete the full 7-day awakening and raise your main orb to level 7 to unlock Akashic Galaxy.",
      es: "Completa el despertar de 7 días y lleva tu esfera principal al nivel 7 para desbloquear la Galaxia Akáshica.",
    },
  },
  {
    id: "compassion-field",
    unlockShape: "soul-nebula",
    metric: "blessingsSent",
    target: { free: 3, vip: 2 },
    title: { zh: "慈心星雲", en: "Compassion Field", es: "Campo de compasión" },
    description: {
      zh: "送出 3 次祝福（VIP 為 2 次），即可解鎖靈魂星雲。",
      en: "Send 3 blessings (2 for VIP) to unlock Soul Nebula.",
      es: "Envía 3 bendiciones (2 para VIP) para desbloquear la Nebulosa del Alma.",
    },
  },
  {
    id: "radiant-bloom",
    unlockShape: "lotus-mandala",
    metric: "totalSessions",
    target: { free: 7, vip: 5 },
    title: { zh: "蓮華綻放", en: "Radiant Bloom", es: "Floración radiante" },
    description: {
      zh: "完成 7 次冥想（VIP 為 5 次），即可解鎖蓮華曼陀羅。",
      en: "Complete 7 meditation sessions (5 for VIP) to unlock Lotus Mandala.",
      es: "Completa 7 sesiones de meditación (5 para VIP) para desbloquear el Mandala de Loto.",
    },
  },
  {
    id: "structure-of-light",
    unlockShape: "metatrons-cube",
    metric: "uniqueCategories",
    target: { free: 5, vip: 4 },
    title: { zh: "光之結構", en: "Structure of Light", es: "Estructura de luz" },
    description: {
      zh: "完成 5 個不同冥想主題（VIP 為 4 個），即可解鎖梅塔特隆立方。",
      en: "Complete 5 different meditation categories (4 for VIP) to unlock Metatron's Cube.",
      es: "Completa 5 categorías de meditación distintas (4 para VIP) para desbloquear el Cubo de Metatrón.",
    },
  },
  {
    id: "inner-fire",
    unlockShape: "phoenix-spiral",
    metric: "currentStreak",
    target: { free: 5, vip: 4 },
    title: { zh: "鳳凰之火", en: "Phoenix Fire", es: "Fuego del fénix" },
    description: {
      zh: "連續完成 5 天冥想（VIP 為 4 天），即可解鎖鳳凰螺旋。",
      en: "Complete a 5-day meditation streak (4 days for VIP) to unlock Phoenix Spiral.",
      es: "Completa una racha de 5 días de meditación (4 días para VIP) para desbloquear la Espiral Fénix.",
    },
  },
  {
    id: "living-grid",
    unlockShape: "vector-equilibrium",
    metric: "orbsStored",
    target: { free: 2, vip: 1 },
    title: { zh: "活性能量格", en: "Living Grid", es: "Retícula viva" },
    description: {
      zh: "收藏 2 顆光球（VIP 為 1 顆），即可解鎖向量平衡體。",
      en: "Store 2 orbs (1 for VIP) to unlock Vector Equilibrium.",
      es: "Guarda 2 esferas (1 para VIP) para desbloquear el Equilibrio Vectorial.",
    },
  },
  {
    id: "prayer-loop",
    unlockShape: "infinity-prayer",
    metric: "blessingsSent",
    target: { free: 4, vip: 3 },
    title: { zh: "無盡祈禱", en: "Prayer Loop", es: "Bucle de oración" },
    description: {
      zh: "送出 4 次祝福（VIP 為 3 次），即可解鎖無盡祈禱。",
      en: "Send 4 blessings (3 for VIP) to unlock Infinity Prayer.",
      es: "Envía 4 bendiciones (3 para VIP) para desbloquear la Oración Infinita.",
    },
  },
  {
    id: "dragon-current",
    unlockShape: "caduceus",
    metric: "shapeChanges",
    target: { free: 3, vip: 2 },
    title: { zh: "雙流之杖", en: "Dragon Current", es: "Corriente del dragón" },
    description: {
      zh: "切換 3 次光球形態（VIP 為 2 次），即可解鎖雙蛇杖。",
      en: "Change orb forms 3 times (2 for VIP) to unlock the Caduceus.",
      es: "Cambia la forma de la esfera 3 veces (2 para VIP) para desbloquear el Caduceo.",
    },
  },
  {
    id: "star-memory",
    unlockShape: "oracle-constellation",
    metric: "totalSessions",
    target: { free: 10, vip: 7 },
    title: { zh: "星圖記憶", en: "Star Memory", es: "Memoria estelar" },
    description: {
      zh: "完成 10 次冥想（VIP 為 7 次），即可解鎖神諭星群。",
      en: "Complete 10 meditation sessions (7 for VIP) to unlock Oracle Constellation.",
      es: "Completa 10 sesiones de meditación (7 para VIP) para desbloquear la Constelación Oráculo.",
    },
  },
  {
    id: "ascension-cycle",
    unlockShape: "ascension-spiral",
    metric: "totalMinutes",
    target: { free: 90, vip: 70 },
    title: { zh: "揚升循環", en: "Ascension Cycle", es: "Ciclo de ascensión" },
    description: {
      zh: "累積完成 90 分鐘冥想（VIP 為 70 分鐘），即可解鎖揚升螺旋。",
      en: "Accumulate 90 total meditation minutes (70 for VIP) to unlock Ascension Spiral.",
      es: "Acumula 90 minutos totales de meditación (70 para VIP) para desbloquear la Espiral de Ascensión.",
    },
  },
  {
    id: "cosmic-bloom",
    unlockShape: "sphere-of-circles",
    metric: "uniqueCategories",
    target: { free: 6, vip: 4 },
    title: { zh: "蓮華星河", en: "Cosmic Bloom", es: "Flor cósmica" },
    description: {
      zh: "完成 6 個不同冥想主題（VIP 為 4 個），即可解鎖圓之球體。",
      en: "Complete 6 different meditation categories (4 for VIP) to unlock Sphere of Circles.",
      es: "Completa 6 categorías de meditación distintas (4 para VIP) para desbloquear la Esfera de Círculos.",
    },
  },
  {
    id: "ai-scribe",
    unlockShape: "prism-field",
    metric: "customMeditationsCreated",
    target: { free: 1, vip: 1 },
    title: { zh: "靈感編織", en: "Insight Weaver", es: "Tejedor de intuición" },
    description: {
      zh: "在 AI 助手中生成 1 個專屬冥想課程，即可解鎖稜鏡結界。",
      en: "Generate 1 personalized meditation with the AI assistant to unlock Prism Field.",
      es: "Genera 1 meditación personalizada con el asistente AI para desbloquear el Campo Prisma.",
    },
  },
  {
    id: "ai-echo",
    unlockShape: "octagram-star",
    metric: "customMeditationsCompleted",
    target: { free: 1, vip: 1 },
    title: { zh: "回聲實修", en: "Echo Practice", es: "Práctica eco" },
    description: {
      zh: "完成 1 個 AI 生成的冥想課程，即可解鎖八芒星陣。",
      en: "Complete 1 AI-generated meditation session to unlock Octagram Star.",
      es: "Completa 1 sesión de meditación generada por AI para desbloquear la Estrella Octagrama.",
    },
  },
] as const;

export const BEGINNER_TASK_DEFINITIONS: MissionDefinition[] = [
  {
    id: "journey-root",
    metric: "highestOrbLevel",
    target: { free: 1, vip: 1 },
    title: { zh: "第一日：海底輪", en: "Day 1: Root Chakra", es: "Día 1: Chakra raíz" },
    description: {
      zh: "以穩定與安全為主題完成第一日冥想，點亮第一層紅色能量。",
      en: "Complete day one with grounding and safety to light your first red layer.",
      es: "Completa el primer día con estabilidad y seguridad para encender tu primera capa roja.",
    },
    reward: {
      zh: "獎勵：海底輪紅色能量層",
      en: "Reward: Root chakra red layer",
      es: "Recompensa: capa roja del chakra raíz",
    },
  },
  {
    id: "journey-sacral",
    metric: "highestOrbLevel",
    target: { free: 2, vip: 2 },
    title: { zh: "第二日：臍輪", en: "Day 2: Sacral Chakra", es: "Día 2: Chakra sacro" },
    description: {
      zh: "讓情感與創造流動，將第二層橙色能量加入你的光球。",
      en: "Invite flow and creativity to add the second orange layer to your orb.",
      es: "Invita al flujo y la creatividad para añadir la segunda capa naranja a tu esfera.",
    },
    reward: {
      zh: "獎勵：臍輪橙色能量層",
      en: "Reward: Sacral chakra orange layer",
      es: "Recompensa: capa naranja del chakra sacro",
    },
  },
  {
    id: "journey-solar",
    metric: "highestOrbLevel",
    target: { free: 3, vip: 3 },
    title: { zh: "第三日：太陽神經叢", en: "Day 3: Solar Plexus", es: "Día 3: Plexo solar" },
    description: {
      zh: "把意志與自信帶進靜心，點亮第三層金黃色能量。",
      en: "Bring will and confidence into practice to awaken the third golden layer.",
      es: "Lleva voluntad y confianza a la práctica para despertar la tercera capa dorada.",
    },
    reward: {
      zh: "獎勵：太陽神經叢金色能量層",
      en: "Reward: Solar Plexus golden layer",
      es: "Recompensa: capa dorada del plexo solar",
    },
  },
  {
    id: "journey-heart",
    metric: "highestOrbLevel",
    target: { free: 4, vip: 4 },
    title: { zh: "第四日：心輪", en: "Day 4: Heart Chakra", es: "Día 4: Chakra del corazón" },
    description: {
      zh: "讓慈悲與連結成為核心，展開第四層綠色心輪能量。",
      en: "Lead with compassion and connection to unfold the fourth green heart layer.",
      es: "Deja que la compasión y la conexión guíen la apertura de la cuarta capa verde del corazón.",
    },
    reward: {
      zh: "獎勵：心輪綠色能量層",
      en: "Reward: Heart chakra green layer",
      es: "Recompensa: capa verde del chakra del corazón",
    },
  },
  {
    id: "journey-throat",
    metric: "highestOrbLevel",
    target: { free: 5, vip: 5 },
    title: { zh: "第五日：喉輪", en: "Day 5: Throat Chakra", es: "Día 5: Chakra de la garganta" },
    description: {
      zh: "以真實與表達共鳴，點亮第五層藍色喉輪能量。",
      en: "Resonate with truth and expression to light the fifth blue throat layer.",
      es: "Resuena con la verdad y la expresión para encender la quinta capa azul de la garganta.",
    },
    reward: {
      zh: "獎勵：喉輪藍色能量層",
      en: "Reward: Throat chakra blue layer",
      es: "Recompensa: capa azul del chakra de la garganta",
    },
  },
  {
    id: "journey-third-eye",
    metric: "highestOrbLevel",
    target: { free: 6, vip: 6 },
    title: { zh: "第六日：眉心輪", en: "Day 6: Third Eye", es: "Día 6: Tercer ojo" },
    description: {
      zh: "透過直覺與洞察向內觀看，完成第六層靛藍能量。",
      en: "Turn inward with intuition and insight to complete the sixth indigo layer.",
      es: "Mira hacia dentro con intuición y claridad para completar la sexta capa índigo.",
    },
    reward: {
      zh: "獎勵：眉心輪靛藍能量層",
      en: "Reward: Third Eye indigo layer",
      es: "Recompensa: capa índigo del tercer ojo",
    },
  },
  {
    id: "journey-crown",
    metric: "highestOrbLevel",
    target: { free: 7, vip: 7 },
    title: { zh: "第七日：頂輪覺醒", en: "Day 7: Crown Awakening", es: "Día 7: Despertar corona" },
    description: {
      zh: "七層脈輪整合完成後，白色覺醒核心將在光球中心誕生。",
      en: "When all seven chakra layers align, the awakened white core is born at the center of your orb.",
      es: "Cuando las siete capas de chakra se alinean, el núcleo blanco despierto nace en el centro de tu esfera.",
    },
    reward: {
      zh: "獎勵：白色覺醒核心",
      en: "Reward: Awakened white core",
      es: "Recompensa: núcleo blanco despierto",
    },
  },
] as const;
