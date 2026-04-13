import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { TrendingUp, Calendar, Award, Target, Clock, BookOpen, ChevronDown, ChevronRight } from "lucide-react-native";
import { useMeditation } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import {
  fetchMeditationHistory,
  fetchMeditationHistoryForUserIds,
  MeditationRecord,
  sanitizeUserId,
} from "@/lib/firebaseMeditations";
import { resolveMeditationUserId } from "@/lib/resolveMeditationUserId";
import { getFirebaseAuthUser, waitForFirebaseAuth } from "@/constants/firebase";
import { IS_DEV_FULL_MOCK, IS_LOCAL_DEV } from "@/constants/env";
import { POST_AWAKENING_ARCS } from "@/constants/postAwakeningJourney";
import { FREE_CORE_SHAPES } from "@/constants/vip";
import { CATEGORIES, getCategoryName } from "@/constants/meditations";

const { width } = Dimensions.get("window");
const SHAPE_LABELS: Record<string, { zh: string; en: string; es: string }> = {
  "grid-of-life": { zh: "生命之格", en: "Grid of Life", es: "Cuadrícula de la Vida" },
  "vortex-ring": { zh: "漩渦環", en: "Vortex Ring", es: "Anillo Vórtice" },
  "ring-torus": { zh: "環形托羅斯", en: "Ring Torus", es: "Toro Anular" },
  "seven-waves": { zh: "七重波", en: "Seven Waves", es: "Siete Ondas" },
  "lotus-galaxy": { zh: "蓮華星系", en: "Lotus Galaxy", es: "Galaxia de Loto" },
  "golden-spiral": { zh: "黃金螺旋", en: "Golden Spiral", es: "Espiral Dorada" },
  "seed-of-life": { zh: "生命之種", en: "Seed of Life", es: "Semilla de la Vida" },
  "vesica-piscis": { zh: "魚泡聖門", en: "Vesica Piscis", es: "Vesica Piscis" },
  "double-helix-dna": { zh: "雙螺旋 DNA", en: "Double Helix DNA", es: "ADN de Doble Hélice" },
  "wave-interference": { zh: "波干涉", en: "Wave Interference", es: "Interferencia de Ondas" },
  "sri-yantra": { zh: "斯里延陀羅", en: "Sri Yantra", es: "Sri Yantra" },
  "crown-chakra": { zh: "頂輪", en: "Crown Chakra", es: "Chakra Corona" },
  "akashic-galaxy": { zh: "阿卡西星系", en: "Akashic Galaxy", es: "Galaxia Akáshica" },
  "soul-nebula": { zh: "靈魂星雲", en: "Soul Nebula", es: "Nebulosa del Alma" },
  "lotus-mandala": { zh: "蓮華曼陀羅", en: "Lotus Mandala", es: "Mandala de Loto" },
  "metatrons-cube": { zh: "梅塔特隆立方", en: "Metatron's Cube", es: "Cubo de Metatrón" },
  "phoenix-spiral": { zh: "鳳凰螺旋", en: "Phoenix Spiral", es: "Espiral Fénix" },
  "vector-equilibrium": { zh: "向量平衡體", en: "Vector Equilibrium", es: "Equilibrio Vectorial" },
  "infinity-prayer": { zh: "無盡祈禱", en: "Infinity Prayer", es: "Oración Infinita" },
  "caduceus": { zh: "雙蛇杖", en: "Caduceus", es: "Caduceo" },
  "oracle-constellation": { zh: "神諭星群", en: "Oracle Constellation", es: "Constelación Oráculo" },
  "ascension-spiral": { zh: "揚升螺旋", en: "Ascension Spiral", es: "Espiral de Ascensión" },
  "fractal-tree": { zh: "分形之樹", en: "Fractal Tree", es: "Árbol Fractal" },
  "lattice-wave": { zh: "晶格波", en: "Lattice Wave", es: "Onda de Retícula" },
  "golden-circles": { zh: "黃金圓環", en: "Golden Circles", es: "Círculos Dorados" },
  "sphere-of-circles": { zh: "圓之球體", en: "Sphere of Circles", es: "Esfera de Círculos" },
};

export default function ProgressScreen() {
  const { currentTheme, settings } = useSettings();
  const { stats, achievements, missions, beginnerJourney, unlockedShapes, dailyAwakeningMinutesRequired, currentOrb, missionStats } = useMeditation();
  const { walletAddress, hasActiveVIP } = useUser();
  const lang = settings.language;
  const tr = (zh: string, en: string, es: string) => {
    if (lang === "zh") return zh;
    if (lang === "es") return es;
    return en;
  };

  const [meditationHistory, setMeditationHistory] = useState<MeditationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [beginnerExpanded, setBeginnerExpanded] = useState(false);
  const [missionsExpanded, setMissionsExpanded] = useState(false);
  const [awakenedExpanded, setAwakenedExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [achievementsExpanded, setAchievementsExpanded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"success" | "failed" | "missing">("missing");
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [userIdSource, setUserIdSource] = useState<"auth" | "wallet" | "none">("none");
  const [userIdSourcesUsed, setUserIdSourcesUsed] = useState<Array<"auth" | "wallet">>([]);
  const pollInFlightRef = useRef(false);

  const weekDays =
    lang === "zh"
      ? ["日", "一", "二", "三", "四", "五", "六"]
      : lang === "es"
        ? ["D", "L", "M", "X", "J", "V", "S"]
        : ["S", "M", "T", "W", "T", "F", "S"];
  const currentDay = new Date().getDay();

  const loadHistory = useCallback(async () => {
    if (!resolvedUserId || pollInFlightRef.current) return;
    
    pollInFlightRef.current = true;
    console.log("[ProgressScreen] Loading meditation history...");
    
    try {
      const sources: Array<"auth" | "wallet"> = [];
      const idsToFetch = new Set<string>([resolvedUserId]);

      if (userIdSource === "wallet") {
        sources.push("wallet");
        const authUser = getFirebaseAuthUser() ?? await waitForFirebaseAuth();
        if (authUser?.uid) {
          idsToFetch.add(authUser.uid);
          sources.push("auth");
        }
      }

      if (userIdSource === "auth") {
        sources.push("auth");
        const wallet = walletAddress?.trim();
        if (wallet) {
          idsToFetch.add(wallet);
          sources.push("wallet");
        }
      }

      const uniqueSources = Array.from(new Set(sources));
      setUserIdSourcesUsed(uniqueSources);

      const userIds = Array.from(idsToFetch);
      const history =
        userIds.length > 1
          ? await fetchMeditationHistoryForUserIds({ userIds, limit: 50 })
          : await fetchMeditationHistory({ userId: userIds[0]!, limit: 50 });
      setMeditationHistory(history);
      setSyncStatus("success");
      console.log("[ProgressScreen] Loaded history count:", history.length);
    } catch (e) {
      console.error("[ProgressScreen] Failed to load history:", e);
      setSyncStatus("failed");
    } finally {
      pollInFlightRef.current = false;
      setIsLoadingHistory(false);
    }
  }, [resolvedUserId, userIdSource, walletAddress]);

  useEffect(() => {
    let isActive = true;
    const resolveUser = async () => {
      const resolved = await resolveMeditationUserId({ walletAddress });
      if (isActive) {
        setResolvedUserId(resolved.userId ? sanitizeUserId(resolved.userId) : null);
        setUserIdSource(resolved.source);
        setUserIdSourcesUsed(
          resolved.source === "auth" || resolved.source === "wallet" ? [resolved.source] : []
        );
      }
    };

    void resolveUser();
    return () => {
      isActive = false;
    };
  }, [walletAddress]);

  useEffect(() => {
    if (!resolvedUserId) {
      setSyncStatus("missing");
    }

    if (resolvedUserId) {
      setIsLoadingHistory(true);
      loadHistory();

      const intervalId = setInterval(loadHistory, 30000);

      const subscription = AppState.addEventListener("change", (nextAppState) => {
        if (nextAppState === "active") {
          console.log("[ProgressScreen] App became active, refreshing history");
          loadHistory();
        }
      });

      return () => {
        clearInterval(intervalId);
        subscription.remove();
      };
    }
  }, [resolvedUserId, loadHistory]);

  const formattedUserId = resolvedUserId
    ? `${resolvedUserId.slice(0, 8)}...${resolvedUserId.slice(-6)}`
    : null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const sourceNames = userIdSourcesUsed.map((source) =>
    source === "auth" ? tr("Auth UID", "Auth UID", "UID de Auth") : tr("錢包", "Wallet", "Billetera")
  );
  const sourceLabel =
    sourceNames.length === 0
      ? tr("無", "None", "Ninguno")
      : sourceNames.length > 1
        ? `${tr("合併", "Merged", "Combinado")} (${sourceNames.join(" + ")})`
        : sourceNames[0];

  const getTaskAction = (taskId: string) => {
    switch (taskId) {
      case "journey-root":
      case "journey-sacral":
      case "journey-solar":
      case "journey-heart":
      case "journey-throat":
      case "journey-third-eye":
      case "journey-crown":
        return { label: tr("完成今日靜心", "Do Today's Practice", "Haz la práctica de hoy"), path: "/meditate" };
      default:
        return { label: tr("查看", "Open", "Abrir"), path: "/progress" };
    }
  };

  const getMissionAction = (metric: string) => {
    switch (metric) {
      case "totalSessions":
      case "totalMinutes":
      case "currentStreak":
        return { label: tr("去冥想", "Go Meditate", "Ir a meditar"), path: "/meditate" };
      case "uniqueCategories":
        return { label: tr("換主題冥想", "Try New Themes", "Probar temas nuevos"), path: "/meditate" };
      case "blessingsSent":
        return { label: tr("去花園送祝福", "Send Blessings", "Enviar bendiciones"), path: "/garden" };
      case "orbsStored":
        return { label: tr("去收藏光球", "Store an Orb", "Guardar una esfera"), path: "/garden" };
      case "shapeChanges":
        return { label: tr("去切換形態", "Change Form", "Cambiar forma"), path: "/garden" };
      case "highestOrbLevel":
        return { label: tr("去養成主光球", "Grow Your Main Orb", "Haz crecer tu esfera principal"), path: "/garden" };
      case "customMeditationsCreated":
        return { label: tr("去 AI 助手生成", "Generate with AI", "Generar con IA"), path: "/assistant" };
      case "customMeditationsCompleted":
        return { label: tr("去完成 AI 課程", "Finish an AI Session", "Completar una sesión de IA"), path: "/meditate" };
      default:
        return { label: tr("查看", "Open", "Abrir"), path: "/progress" };
    }
  };

  const getMissionHint = (metric: string) => {
    const remainingCategories = CATEGORIES
      .filter((category) => category.id !== "all" && !missionStats.uniqueCategories.includes(category.id))
      .map((category) => getCategoryName(category, lang));

    if (lang === "zh") {
      switch (metric) {
        case "totalSessions":
          return "完成任意冥想課程一次就會計算。";
        case "totalMinutes":
          return "只要完成冥想，累積分鐘就會增加。";
        case "currentStreak":
          return "連續每日完成冥想，斷一天就會重新計算。";
        case "blessingsSent":
          return "到花園送出祝福一次，就會增加 1 次。";
        case "uniqueCategories":
          return remainingCategories.length > 0
            ? `到冥想頁完成未試過的主題。你目前還未完成：${remainingCategories.join("、")} 。`
            : "你已經試過所有主題，之後完成不同分類的冥想仍會有助其他任務。";
        case "orbsStored":
          return "在花園把當前光球收藏起來，就會增加收藏數。";
        case "shapeChanges":
          return "在花園替覺醒球切換一次形態，就會增加 1 次。";
        case "highestOrbLevel":
          return `你目前主光球等級是 ${currentOrb.level}。每天完成 ${dailyAwakeningMinutesRequired} 分鐘養成冥想，主光球就會升 1 級。`;
        case "customMeditationsCreated":
          return "到 AI 助手生成一個專屬冥想並存入圖書館，就會增加 1 次。";
        case "customMeditationsCompleted":
          return "到冥想圖書館完成一個標示為 AI 生成的課程，就會增加 1 次。";
        default:
          return "完成對應行動後，進度會自動更新。";
      }
    }

    if (lang === "es") {
      switch (metric) {
        case "totalSessions":
          return "Cualquier sesión de meditación completada cuenta.";
        case "totalMinutes":
          return "Tus minutos totales de meditación aumentan después de cada sesión completada.";
        case "currentStreak":
          return "Completa una meditación cada día para mantener la racha.";
        case "blessingsSent":
          return "Cada bendición enviada desde el jardín cuenta una vez.";
        case "uniqueCategories":
          return remainingCategories.length > 0
            ? `Completa meditaciones en categorías nuevas. Aún te faltan: ${remainingCategories.join(", ")}.`
            : "Ya exploraste todas las categorías; repetirlas sigue ayudando a tu viaje.";
        case "orbsStored":
          return "Guarda tu esfera actual en el jardín para aumentar este conteo.";
        case "shapeChanges":
          return "Cambia tu esfera despierta a otra forma para contar un cambio.";
        case "highestOrbLevel":
          return `Tu esfera principal está ahora en nivel ${currentOrb.level}. Completa ${dailyAwakeningMinutesRequired} minutos diarios para subir un nivel.`;
        case "customMeditationsCreated":
          return "Genera una meditación personalizada en el asistente IA y guárdala en la biblioteca.";
        case "customMeditationsCompleted":
          return "Completa una sesión marcada como Generada por IA en la biblioteca.";
        default:
          return "Completa la acción relacionada y el progreso se actualizará automáticamente.";
      }
    }

    switch (metric) {
      case "totalSessions":
        return "Any completed meditation session counts.";
      case "totalMinutes":
        return "Your total meditation minutes increase after each completed session.";
      case "currentStreak":
        return "Finish a meditation each day to maintain the streak.";
      case "blessingsSent":
        return "Each blessing sent from the garden counts once.";
      case "uniqueCategories":
        return remainingCategories.length > 0
          ? `Complete meditations in new categories. You still have: ${remainingCategories.join(", ")}.`
          : "You have already explored every category; repeating them still helps your broader journey.";
      case "orbsStored":
        return "Store your current orb in the garden to increase this count.";
      case "shapeChanges":
        return "Switch your awakened orb into a different form to count one change.";
      case "highestOrbLevel":
        return `Your main orb is currently level ${currentOrb.level}. Finish ${dailyAwakeningMinutesRequired} minutes of orb growth practice each day to raise it by one level.`;
      case "customMeditationsCreated":
        return "Generate a personalized meditation in the AI assistant and save it to the library.";
      case "customMeditationsCompleted":
        return "Complete a session marked as AI Generated in the meditation library.";
      default:
        return "Complete the related action and progress will update automatically.";
    }
  };

  const getMissionHighlight = (metric: string) => {
    const remainingCategories = CATEGORIES
      .filter((category) => category.id !== "all" && !missionStats.uniqueCategories.includes(category.id))
      .map((category) => getCategoryName(category, lang));

    if (lang === "zh") {
      switch (metric) {
        case "uniqueCategories":
          return remainingCategories.length > 0
            ? `下一個最值得試：${remainingCategories.slice(0, 2).join("、")}`
            : "你已完成全部主題探索";
        case "highestOrbLevel":
          return `現時主光球等級 ${currentOrb.level} · 每日完成 ${dailyAwakeningMinutesRequired} 分鐘就會再升 1 級`;
        case "customMeditationsCreated":
          return "AI 助手生成後，課程會直接進入冥想圖書館";
        case "customMeditationsCompleted":
          return "到圖書館完成一個標示為 AI 生成的課程即可";
        default:
          return null;
      }
    }

    if (lang === "es") {
      switch (metric) {
        case "uniqueCategories":
          return remainingCategories.length > 0
            ? `Próximos mejores temas: ${remainingCategories.slice(0, 2).join(", ")}`
            : "Ya exploraste todos los temas";
        case "highestOrbLevel":
          return `Esfera principal nivel ${currentOrb.level} · Completa ${dailyAwakeningMinutesRequired} minutos al día para ganar el siguiente nivel`;
        case "customMeditationsCreated":
          return "Después de generarla, tu meditación IA entra directamente en la biblioteca";
        case "customMeditationsCompleted":
          return "Completa cualquier sesión etiquetada como Generada por IA en la biblioteca";
        default:
          return null;
      }
    }

    switch (metric) {
      case "uniqueCategories":
        return remainingCategories.length > 0
          ? `Best next themes: ${remainingCategories.slice(0, 2).join(", ")}`
          : "You have explored every theme";
      case "highestOrbLevel":
        return `Main orb level ${currentOrb.level} · Complete ${dailyAwakeningMinutesRequired} minutes per day to gain the next level`;
      case "customMeditationsCreated":
        return "After generation, your AI meditation goes straight into the library";
      case "customMeditationsCompleted":
        return "Complete any session labeled AI Generated in the library";
      default:
        return null;
    }
  };

  const getMetricProgressLabel = (metric: string, progressValue: number, targetValue: number) => {
    if (lang === "zh") {
      switch (metric) {
        case "currentStreak":
          return `連續天數 ${progressValue}/${targetValue}`;
        case "totalMinutes":
          return `總冥想分鐘 ${progressValue}/${targetValue}`;
        case "totalSessions":
          return `完成次數 ${progressValue}/${targetValue}`;
        case "blessingsSent":
          return `送出祝福 ${progressValue}/${targetValue}`;
        case "uniqueCategories":
          return `探索主題 ${progressValue}/${targetValue}`;
        case "orbsStored":
          return `收藏光球 ${progressValue}/${targetValue}`;
        case "shapeChanges":
          return `切換形態 ${progressValue}/${targetValue}`;
        case "highestOrbLevel":
          return `最高光球等級 ${progressValue}/${targetValue}`;
        case "customMeditationsCreated":
          return `AI 課程生成 ${progressValue}/${targetValue}`;
        case "customMeditationsCompleted":
          return `AI 課程完成 ${progressValue}/${targetValue}`;
        default:
          return `進度 ${progressValue}/${targetValue}`;
      }
    }

    if (lang === "es") {
      switch (metric) {
        case "currentStreak":
          return `Días de racha ${progressValue}/${targetValue}`;
        case "totalMinutes":
          return `Minutos totales ${progressValue}/${targetValue}`;
        case "totalSessions":
          return `Sesiones completadas ${progressValue}/${targetValue}`;
        case "blessingsSent":
          return `Bendiciones enviadas ${progressValue}/${targetValue}`;
        case "uniqueCategories":
          return `Temas explorados ${progressValue}/${targetValue}`;
        case "orbsStored":
          return `Esferas guardadas ${progressValue}/${targetValue}`;
        case "shapeChanges":
          return `Cambios de forma ${progressValue}/${targetValue}`;
        case "highestOrbLevel":
          return `Nivel más alto de esfera ${progressValue}/${targetValue}`;
        case "customMeditationsCreated":
          return `Meditaciones IA creadas ${progressValue}/${targetValue}`;
        case "customMeditationsCompleted":
          return `Meditaciones IA completadas ${progressValue}/${targetValue}`;
        default:
          return `Progreso ${progressValue}/${targetValue}`;
      }
    }

    switch (metric) {
      case "currentStreak":
        return `Streak days ${progressValue}/${targetValue}`;
      case "totalMinutes":
        return `Total meditation minutes ${progressValue}/${targetValue}`;
      case "totalSessions":
        return `Completed sessions ${progressValue}/${targetValue}`;
      case "blessingsSent":
        return `Blessings sent ${progressValue}/${targetValue}`;
      case "uniqueCategories":
        return `Themes explored ${progressValue}/${targetValue}`;
      case "orbsStored":
        return `Orbs stored ${progressValue}/${targetValue}`;
      case "shapeChanges":
        return `Form changes ${progressValue}/${targetValue}`;
      case "highestOrbLevel":
        return `Highest orb level ${progressValue}/${targetValue}`;
      case "customMeditationsCreated":
        return `AI meditations created ${progressValue}/${targetValue}`;
      case "customMeditationsCompleted":
        return `AI meditations completed ${progressValue}/${targetValue}`;
      default:
        return `Progress ${progressValue}/${targetValue}`;
    }
  };

  const getShapeLabel = (shapeId?: string) => {
    if (!shapeId) return tr("神聖形態", "Sacred Form", "Forma sagrada");
    if (lang === "zh") return SHAPE_LABELS[shapeId]?.zh ?? shapeId;
    if (lang === "es") return SHAPE_LABELS[shapeId]?.es ?? SHAPE_LABELS[shapeId]?.en ?? shapeId;
    return SHAPE_LABELS[shapeId]?.en ?? shapeId;
  };

  const earnedUnlockedShapeCount = Math.max(
    0,
    unlockedShapes.filter((shape) => !(FREE_CORE_SHAPES as readonly string[]).includes(shape)).length
      - missionStats.starterShapesGranted
  );

  const progressPathways = [
    {
      id: "orb-growth",
      icon: Target,
      color: "#8B5CF6",
      title: tr("主光球養成", "Main Orb Growth", "Crecimiento de la esfera principal"),
      body: currentOrb.isAwakened
        ? tr(
            `主光球目前 ${currentOrb.level} 級，繼續每日完成 ${dailyAwakeningMinutesRequired} 分鐘冥想就會再升級。`,
            `Your main orb is level ${currentOrb.level}. Keep finishing ${dailyAwakeningMinutesRequired} minutes each day to level it up again.`,
            `Tu esfera principal está en nivel ${currentOrb.level}. Sigue completando ${dailyAwakeningMinutesRequired} minutos al día para volver a subirla de nivel.`
          )
        : tr(
            `還差 ${Math.max(0, 7 - currentOrb.layers.length)} 層就會誕生覺醒核心。`,
            `${Math.max(0, 7 - currentOrb.layers.length)} layers remain before your awakened core appears.`,
            `Faltan ${Math.max(0, 7 - currentOrb.layers.length)} capas para que aparezca tu núcleo despierto.`
          ),
      progress: currentOrb.isAwakened
        ? tr(`等級 ${currentOrb.level}`, `Level ${currentOrb.level}`, `Nivel ${currentOrb.level}`)
        : tr(`7 脈輪 ${currentOrb.layers.length}/7`, `7 chakras ${currentOrb.layers.length}/7`, `7 chakras ${currentOrb.layers.length}/7`),
      actionLabel: tr("去冥想", "Go Meditate", "Ir a meditar"),
      path: "/meditate",
    },
    {
      id: "blessing-path",
      icon: Award,
      color: "#F59E0B",
      title: tr("祝福與花園", "Blessings & Garden", "Bendiciones y jardín"),
      body: tr(
        "送出祝福會推進第二章，也會讓你的花園互動變得更有存在感。",
        "Sending blessings advances chapter two and makes your garden journey feel more alive.",
        "Enviar bendiciones impulsa el segundo capítulo y hace que tu recorrido por el jardín se sienta más vivo."
      ),
      progress: tr(`已送出 ${missionStats.blessingsSent} 次`, `${missionStats.blessingsSent} blessings sent`, `${missionStats.blessingsSent} bendiciones enviadas`),
      actionLabel: tr("去花園", "Go Garden", "Ir al jardín"),
      path: "/garden",
    },
    {
      id: "ai-path",
      icon: BookOpen,
      color: "#10B981",
      title: tr("AI 冥想課程", "AI Meditation Path", "Ruta de meditación AI"),
      body: missionStats.customMeditationsCreated === 0
        ? tr(
            "先生成第一個專屬冥想，之後它會直接進入圖書館。",
            "Your AI course journey has not started. Generate your first personalized meditation and it will enter the library.",
            "Tu ruta de sesiones AI aún no ha empezado. Genera tu primera meditación personalizada y entrará en la biblioteca."
          )
        : missionStats.customMeditationsCompleted === 0
          ? tr(
              "你已生成 AI 課程，下一步只要去冥想館完成一次。",
              "Your AI meditation has been created. The next step is to complete it in the library.",
              "Tu meditación AI ya fue creada. El siguiente paso es completarla en la biblioteca."
            )
          : tr(
              "AI 課程線已啟動，繼續生成與完成更多課程。",
              "Your AI practice is taking shape. Keep creating and completing more sessions.",
              "Tu práctica AI ya está tomando forma. Sigue creando y completando más sesiones."
            ),
      progress: tr(
        `已生成 ${missionStats.customMeditationsCreated} · 已完成 ${missionStats.customMeditationsCompleted}`,
        `${missionStats.customMeditationsCreated} created · ${missionStats.customMeditationsCompleted} completed`,
        `${missionStats.customMeditationsCreated} creadas · ${missionStats.customMeditationsCompleted} completadas`
      ),
      actionLabel: missionStats.customMeditationsCreated === 0
        ? tr("去 AI 助手", "Open AI Assistant", "Abrir asistente AI")
        : missionStats.customMeditationsCompleted === 0
          ? tr("打開最新 AI 課程", "Open Latest AI Session", "Abrir la última sesión AI")
          : tr("去冥想館", "Open Library", "Abrir biblioteca"),
      path: missionStats.customMeditationsCreated === 0 ? "/assistant" : "/meditate",
    },
  ];

  const awakenedJourney = POST_AWAKENING_ARCS.map((arc) => {
    const target = hasActiveVIP ? arc.vipTarget : arc.freeTarget;
    const rawValue =
      arc.metric === "blessingsSent"
        ? missionStats.blessingsSent
        : arc.metric === "ritualDepth"
          ? stats.totalMinutes
          : earnedUnlockedShapeCount;
    return {
      ...arc,
      target,
      value: Math.min(rawValue, target),
      completed: rawValue >= target,
    };
  });

  const focusMissionPriority: string[] = currentOrb.isAwakened
    ? ["blessingsSent", "customMeditationsCompleted", "uniqueCategories", "highestOrbLevel", "shapeChanges", "orbsStored", "totalMinutes", "totalSessions"]
    : ["highestOrbLevel", "currentStreak", "totalMinutes", "uniqueCategories", "customMeditationsCreated", "totalSessions", "blessingsSent"];
  const focusMissions = missions
    .filter((mission) => !mission.completed)
    .sort((a, b) => {
      const aIndex = focusMissionPriority.indexOf(a.metric);
      const bIndex = focusMissionPriority.indexOf(b.metric);
      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;
      if (safeA !== safeB) return safeA - safeB;
      const aRatio = a.targetValue > 0 ? a.progressValue / a.targetValue : 0;
      const bRatio = b.targetValue > 0 ? b.progressValue / b.targetValue : 0;
      return bRatio - aRatio;
    })
    .slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <Text style={styles.title}>{tr("你的進展", "Your Progress", "Tu progreso")}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pathwaysContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {tr("今天可推進的三條路線", "Three Paths You Can Advance Today", "Tres caminos que puedes avanzar hoy")}
          </Text>
          {progressPathways.map((pathway) => {
            const Icon = pathway.icon;
            return (
              <TouchableOpacity
                key={pathway.id}
                style={[styles.pathwayCard, { backgroundColor: currentTheme.surface }]}
                onPress={() => router.push(pathway.path as never)}
                activeOpacity={0.88}
              >
                <View style={[styles.pathwayIcon, { backgroundColor: `${pathway.color}20` }]}>
                  <Icon size={20} color={pathway.color} />
                </View>
                <View style={styles.pathwayCopy}>
                  <Text style={[styles.pathwayTitle, { color: currentTheme.text }]}>
                    {pathway.title}
                  </Text>
                  <Text style={[styles.pathwayBody, { color: currentTheme.textSecondary }]}>
                    {pathway.body}
                  </Text>
                  <View style={styles.pathwayFooter}>
                    <Text style={[styles.pathwayProgress, { color: currentTheme.primary }]}>
                      {pathway.progress}
                    </Text>
                    <Text style={[styles.pathwayAction, { color: pathway.color }]}>
                      {pathway.actionLabel}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats Overview */}
        {(IS_LOCAL_DEV || IS_DEV_FULL_MOCK) ? (
          <View style={[styles.syncBanner, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.syncBannerText, { color: currentTheme.textSecondary }]}>
              {tr("Firebase 同步", "Firebase Sync", "Sincronización Firebase")}: {syncStatus === "success" ? tr("成功", "Success", "Correcta") : syncStatus === "failed" ? tr("失敗", "Failed", "Falló") : tr("缺少 userId", "Missing userId", "Falta userId")}
            </Text>
            <Text style={[styles.syncBannerText, { color: currentTheme.textSecondary }]}>
              {tr("使用者來源", "User source", "Origen del usuario")}: {sourceLabel}
              {formattedUserId ? ` (${formattedUserId})` : ""}
            </Text>
          </View>
        ) : null}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{stats.currentStreak}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{tr("連續天數", "Day Streak", "Racha")}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <Calendar size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{stats.totalSessions}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{tr("總課程", "Total Sessions", "Sesiones totales")}</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <Target size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{Math.floor(stats.totalMinutes / 60)}h</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{tr("總時間", "Total Time", "Tiempo total")}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: currentTheme.surface }]}>
              <View style={styles.statIcon}>
                <Award size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: currentTheme.text }]}>{achievements.filter(a => a.unlocked).length}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>{tr("成就", "Achievements", "Logros")}</Text>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        {!currentOrb.isAwakened ? (
        <View style={styles.weeklyContainer}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{tr("本週", "This Week", "Esta semana")}</Text>
          <View style={[styles.weekGrid, { backgroundColor: currentTheme.surface }]}>
            {weekDays.map((day, index) => {
              const isToday = index === currentDay;
              const isCompleted = stats.weekProgress[index];
              
              return (
                <View key={`day-${index}`} style={styles.dayContainer}>
                  <Text style={[styles.dayLabel, { color: currentTheme.textSecondary }, isToday && { color: currentTheme.primary, fontWeight: "bold" as const }]}>
                    {day}
                  </Text>
                  <View
                    style={[
                      styles.dayCircle,
                      { borderColor: currentTheme.border },
                      isCompleted && styles.dayCircleCompleted,
                      isToday && { borderColor: currentTheme.primary },
                    ]}
                  >
                    {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        ) : null}

        {currentOrb.isAwakened && (
          <View style={styles.weeklyContainer}>
            <TouchableOpacity
              style={[styles.sectionHeaderRow, { backgroundColor: currentTheme.surface }]}
              onPress={() => setAwakenedExpanded((prev) => !prev)}
              activeOpacity={0.85}
            >
              <View style={styles.sectionHeaderTextBlock}>
              <Text style={[styles.sectionTitleCompact, { color: currentTheme.text }]}>
                {tr("第二章：覺醒後旅程", "Chapter Two: Post-Awakening Journey", "Capítulo dos: viaje tras el despertar")}
              </Text>
                <Text style={[styles.sectionCaption, { color: currentTheme.textSecondary }]}>
                  {tr("祝福、儀式、聖形收藏會成為你的下一章", "Blessing, ritual, and sacred form collection become your next chapter", "Las bendiciones, rituales y la colección de formas sagradas se convierten en tu siguiente capítulo")}
                </Text>
              </View>
              {awakenedExpanded ? (
                <ChevronDown size={18} color={currentTheme.textSecondary} />
              ) : (
                <ChevronRight size={18} color={currentTheme.textSecondary} />
              )}
            </TouchableOpacity>
            {awakenedExpanded && awakenedJourney.map((arc) => (
              <View key={arc.id} style={[styles.historyItem, { backgroundColor: currentTheme.surface, marginBottom: 10 }]}>
                <View style={styles.historyTopRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.historyCourseName, { color: currentTheme.text }]}>
                      {lang === "zh" ? arc.zhTitle : arc.enTitle}
                    </Text>
                    <Text style={[styles.historyCourseMeta, { color: currentTheme.textSecondary }]}>
                      {lang === "zh" ? arc.zhTheme : arc.enTheme}
                    </Text>
                    <Text style={[styles.historyCourseMeta, { color: currentTheme.primary, marginTop: 6 }]}>
                      {tr(`進度 ${arc.value}/${arc.target}`, `Progress ${arc.value}/${arc.target}`, `Progreso ${arc.value}/${arc.target}`)}
                    </Text>
                    <Text style={[styles.historyCourseMeta, { color: currentTheme.textSecondary, marginTop: 4, fontWeight: "700" }]}>
                      {tr(`獎勵：${arc.zhReward}`, `Reward: ${arc.enReward}`, `Recompensa: ${arc.enReward}`)}
                    </Text>
                  </View>
                  <View style={styles.taskActionColumn}>
                    <Text style={{ color: arc.completed ? "#10B981" : currentTheme.textSecondary, fontWeight: "700" }}>
                      {arc.completed ? tr("完成", "Done", "Hecho") : tr("進行中", "In Progress", "En progreso")}
                    </Text>
                    <TouchableOpacity
                      style={[styles.taskActionButton, { borderColor: currentTheme.primary }]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (arc.metric === "blessingsSent") {
                          router.push("/garden");
                          return;
                        }
                        if (arc.metric === "ritualDepth") {
                          router.push("/meditate");
                          return;
                        }
                        router.push("/garden");
                      }}
                    >
                      <Text style={[styles.taskActionText, { color: currentTheme.primary }]}>
                        {arc.metric === "blessingsSent"
                          ? tr("去送祝福", "Send Blessing", "Enviar bendición")
                          : arc.metric === "ritualDepth"
                            ? tr("去冥想", "Go Meditate", "Ir a meditar")
                            : tr("去花園", "Go Garden", "Ir al jardín")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!currentOrb.isAwakened && (
        <View style={styles.weeklyContainer}>
          <TouchableOpacity
            style={[styles.sectionHeaderRow, { backgroundColor: currentTheme.surface }]}
            onPress={() => setBeginnerExpanded((prev) => !prev)}
            activeOpacity={0.85}
          >
            <View style={styles.sectionHeaderTextBlock}>
              <Text style={[styles.sectionTitleCompact, { color: currentTheme.text }]}>
                {tr("第一章：七脈輪起點", "Chapter One: 7-Chakra Beginning", "Capítulo uno: inicio de los 7 chakras")}
              </Text>
              <Text style={[styles.sectionCaption, { color: currentTheme.textSecondary }]}>
                {tr("完成後即進入第二章，不會長期停留在新手期", "Once complete, you move into chapter two instead of staying in beginner mode", "Cuando lo completes pasarás al capítulo dos en vez de quedarte en modo principiante")}
              </Text>
            </View>
            {beginnerExpanded ? (
              <ChevronDown size={18} color={currentTheme.textSecondary} />
            ) : (
              <ChevronRight size={18} color={currentTheme.textSecondary} />
            )}
          </TouchableOpacity>
          {beginnerExpanded && (
            <>
          <Text style={[styles.historySubtitle, { color: currentTheme.textSecondary, marginBottom: 12 }]}>
            {tr("七日內依次點亮七脈輪能量層，最後在中心誕生白色覺醒核心。", "Light the seven chakra layers across seven days, then awaken the white core at the center.", "Enciende las siete capas de chakras a lo largo de siete días y al final despierta el núcleo blanco en el centro.")}
          </Text>
          {beginnerJourney.map((task) => {
            const action = getTaskAction(task.id);
            return (
            <TouchableOpacity
              key={task.id}
              style={[styles.historyItem, { backgroundColor: currentTheme.surface }]}
              onPress={() => router.push(action.path as never)}
              activeOpacity={0.85}
            >
              <View style={styles.historyTopRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.historyCourseName, { color: currentTheme.text }]}>
                    {task.title[lang] ?? task.title.en}
                  </Text>
                  <Text style={[styles.historyCourseMeta, { color: currentTheme.textSecondary }]}>
                    {task.description[lang] ?? task.description.en}
                  </Text>
                  <Text style={[styles.historyCourseMeta, { color: currentTheme.primary, marginTop: 6 }]}>
                    {getMetricProgressLabel(task.metric, task.progressValue, task.targetValue)}
                  </Text>
                  {task.reward && (
                    <Text style={[styles.historyCourseMeta, { color: currentTheme.textSecondary, marginTop: 4, fontWeight: "700" }]}>
                      {task.reward[lang] ?? task.reward.en}
                    </Text>
                  )}
                </View>
                <View style={styles.taskActionColumn}>
                  <Text style={{ color: task.completed ? "#10B981" : currentTheme.textSecondary, fontWeight: "700" }}>
                    {task.completed ? tr("完成", "Done", "Hecho") : tr("進行中", "In Progress", "En progreso")}
                  </Text>
                  <View style={[styles.taskActionButton, { borderColor: currentTheme.primary }]}>
                    <Text style={[styles.taskActionText, { color: currentTheme.primary }]}>
                      {action.label}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )})}
            </>
          )}
        </View>
        )}

        <View style={styles.weeklyContainer}>
          <TouchableOpacity
            style={[styles.sectionHeaderRow, { backgroundColor: currentTheme.surface }]}
            onPress={() => setMissionsExpanded((prev) => !prev)}
            activeOpacity={0.85}
          >
            <View style={styles.sectionHeaderTextBlock}>
              <Text style={[styles.sectionTitleCompact, { color: currentTheme.text }]}>
                {tr("光球任務", "Orb Missions", "Misiones de esfera")}
              </Text>
              <Text style={[styles.sectionCaption, { color: currentTheme.textSecondary }]}>
                {tr("想解鎖更多形態時再展開", "Expand when you want more form unlocks", "Ábrelo cuando quieras desbloquear más formas")}
              </Text>
            </View>
            {missionsExpanded ? (
              <ChevronDown size={18} color={currentTheme.textSecondary} />
            ) : (
              <ChevronRight size={18} color={currentTheme.textSecondary} />
            )}
          </TouchableOpacity>
          {missionsExpanded && (
            <>
          {focusMissions.length > 0 && (
            <View style={styles.focusMissionGroup}>
              <Text style={[styles.historySubtitle, { color: currentTheme.textSecondary, marginBottom: 10 }]}>
                {tr("今天最值得先推進這幾條，做完再看下面其他解鎖。", "These are the best missions to push today before the rest of the unlock list.", "Estas son las misiones más valiosas para empujar hoy antes de revisar el resto de desbloqueos.")}
              </Text>
              {focusMissions.map((mission) => {
                const action = getMissionAction(mission.metric);
                return (
                  <TouchableOpacity
                    key={`focus-${mission.id}`}
                    style={[styles.focusMissionCard, { backgroundColor: currentTheme.surface }]}
                    onPress={() => router.push(action.path as never)}
                    activeOpacity={0.88}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={[styles.focusMissionTitle, { color: currentTheme.text }]}>
                        {mission.title[lang] ?? mission.title.en}
                      </Text>
                      <Text style={[styles.focusMissionBody, { color: currentTheme.textSecondary }]}>
                        {getMissionHint(mission.metric)}
                      </Text>
                      <Text style={[styles.focusMissionProgress, { color: currentTheme.primary }]}>
                        {getMetricProgressLabel(mission.metric, mission.progressValue, mission.targetValue)}
                      </Text>
                    </View>
                    <View style={styles.taskActionColumn}>
                      <Text style={{ color: currentTheme.textSecondary, fontWeight: "700" }}>
                        {tr("優先", "Focus", "En foco")}
                      </Text>
                      <View style={[styles.taskActionButton, { borderColor: currentTheme.primary }]}>
                        <Text style={[styles.taskActionText, { color: currentTheme.primary }]}>
                          {action.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <Text style={[styles.historySubtitle, { color: currentTheme.textSecondary, marginBottom: 12 }]}>
            {tr(`下面是完整解鎖列表。養成規則：連續 7 日，每日 ${dailyAwakeningMinutesRequired} 分鐘`, `Below is the full unlock list. Awakening rule: 7 straight days, ${dailyAwakeningMinutesRequired} minutes per day`, `Abajo está la lista completa de desbloqueos. Regla de despertar: 7 días seguidos, ${dailyAwakeningMinutesRequired} minutos por día`)}
          </Text>
          {missions.map((mission) => {
            const action = getMissionAction(mission.metric);
            return (
            <TouchableOpacity
              key={mission.id}
              style={[styles.historyItem, { backgroundColor: currentTheme.surface }]}
              onPress={() => router.push(action.path as never)}
              activeOpacity={0.85}
            >
              <View style={styles.historyTopRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.historyCourseName, { color: currentTheme.text }]}>
                    {mission.title[lang] ?? mission.title.en}
                  </Text>
                  <Text style={[styles.historyCourseMeta, { color: currentTheme.textSecondary }]}>
                    {mission.description[lang] ?? mission.description.en}
                  </Text>
                  <Text style={[styles.historyCourseMeta, { color: currentTheme.textSecondary, marginTop: 4 }]}>
                    {getMissionHint(mission.metric)}
                  </Text>
                  {getMissionHighlight(mission.metric) ? (
                    <View style={[styles.missionHighlight, { backgroundColor: currentTheme.background }]}>
                      <Text style={[styles.missionHighlightText, { color: currentTheme.primary }]}>
                        {getMissionHighlight(mission.metric)}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={[styles.historyCourseMeta, { color: currentTheme.primary, marginTop: 6 }]}>
                    {`${getMetricProgressLabel(mission.metric, mission.progressValue, mission.targetValue)} · ${
                      lang === "zh" ? `解鎖 ${getShapeLabel(mission.unlockShape)}` : lang === "es" ? `Desbloquea ${getShapeLabel(mission.unlockShape)}` : `Unlock ${getShapeLabel(mission.unlockShape)}`
                    }`}
                  </Text>
                </View>
                <View style={styles.taskActionColumn}>
                  <Text style={{ color: mission.completed ? "#10B981" : currentTheme.textSecondary, fontWeight: "700" }}>
                    {mission.completed ? tr("已解鎖", "Unlocked", "Desbloqueado") : tr("進行中", "In Progress", "En progreso")}
                  </Text>
                  {!mission.completed && (
                    <View style={[styles.taskActionButton, { borderColor: currentTheme.primary }]}>
                      <Text style={[styles.taskActionText, { color: currentTheme.primary }]}>
                        {action.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )})}
          <View style={[styles.syncBanner, { backgroundColor: currentTheme.surface }]}>
            <Text style={[styles.syncBannerText, { color: currentTheme.textSecondary }]}>
              {tr(`高階形態進度：${earnedUnlockedShapeCount}`, `Advanced form progress: ${earnedUnlockedShapeCount}`, `Progreso de formas avanzadas: ${earnedUnlockedShapeCount}`)}
            </Text>
            <Text style={[styles.syncBannerText, { color: currentTheme.textSecondary }]}>
              {tr(`免費核心與 VIP 贈送不計入第二章進度`, `Free core and VIP starter forms do not count toward chapter-two progress`, `Las formas básicas gratis y las formas iniciales VIP no cuentan para el progreso del capítulo dos`)}
            </Text>
          </View>
            </>
          )}
        </View>

        {/* Meditation History */}
        {resolvedUserId && (
          <View style={styles.historyContainer}>
            <TouchableOpacity
              style={[styles.sectionHeaderRow, { backgroundColor: currentTheme.surface }]}
              onPress={() => setHistoryExpanded((prev) => !prev)}
              activeOpacity={0.85}
            >
              <View style={styles.sectionHeaderTextBlock}>
                <Text style={[styles.sectionTitleCompact, { color: currentTheme.text }]}>
                  {tr("冥想記錄", "Meditation History", "Historial de meditación")}
                </Text>
                <Text style={[styles.sectionCaption, { color: currentTheme.textSecondary }]}>
                  {tr("需要時再展開查看細節", "Open only when you want the detailed log", "Ábrelo solo cuando quieras ver el registro detallado")}
                </Text>
              </View>
              <View style={styles.sectionHeaderRight}>
                {isLoadingHistory && <ActivityIndicator size="small" color="#8b5cf6" />}
                {historyExpanded ? (
                  <ChevronDown size={18} color={currentTheme.textSecondary} />
                ) : (
                  <ChevronRight size={18} color={currentTheme.textSecondary} />
                )}
              </View>
            </TouchableOpacity>
            
            {historyExpanded && meditationHistory.length === 0 && !isLoadingHistory ? (
              <View style={[styles.emptyHistory, { backgroundColor: currentTheme.surface }]}>
                <BookOpen size={32} color={currentTheme.textSecondary} />
                <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
                  {tr("尚無冥想記錄", "No meditation records yet", "Aún no hay registros de meditación")}
                </Text>
              </View>
            ) : historyExpanded ? (
              <View style={styles.historyList}>
                {meditationHistory.slice(0, 20).map((record) => (
                  <View 
                    key={record.id} 
                    style={[styles.historyItem, { backgroundColor: currentTheme.surface }]}
                  >
                    <View style={styles.historyLeft}>
                      <View style={styles.historyIconContainer}>
                        <Clock size={18} color="#8b5cf6" />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={[styles.historyCourseName, { color: currentTheme.text }]} numberOfLines={1}>
                          {record.courseName}
                        </Text>
                        <Text style={[styles.historyDate, { color: currentTheme.textSecondary }]}>
                          {formatDate(record.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[styles.historyDuration, { color: currentTheme.text }]}>
                        {record.duration} {tr("分鐘", "min", "min")}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* Achievements */}
        <View style={styles.achievementsContainer}>
          <TouchableOpacity
            style={[styles.sectionHeaderRow, { backgroundColor: currentTheme.surface }]}
            onPress={() => setAchievementsExpanded((prev) => !prev)}
            activeOpacity={0.85}
          >
            <View style={styles.sectionHeaderTextBlock}>
              <Text style={[styles.sectionTitleCompact, { color: currentTheme.text }]}>
                {tr("成就", "Achievements", "Logros")}
              </Text>
              <Text style={[styles.sectionCaption, { color: currentTheme.textSecondary }]}>
                {tr("里程碑與長期習慣紀錄", "Milestones and long-term habit markers", "Hitos y marcas de hábito a largo plazo")}
              </Text>
            </View>
            {achievementsExpanded ? (
              <ChevronDown size={18} color={currentTheme.textSecondary} />
            ) : (
              <ChevronRight size={18} color={currentTheme.textSecondary} />
            )}
          </TouchableOpacity>
          {achievementsExpanded && (
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  { backgroundColor: currentTheme.surface },
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[styles.achievementTitle, { color: currentTheme.text }]}>{achievement.title}</Text>
                <Text style={[styles.achievementDescription, { color: currentTheme.textSecondary }]}>
                  {achievement.description}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementBadgeText}>{tr("已解鎖", "Unlocked", "Desbloqueado")}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          )}
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: "#e0e0ff",
    paddingHorizontal: 20,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  syncBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#8b5cf6",
    backgroundColor: "rgba(20,20,40,0.4)",
  },
  syncBannerText: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  missionHighlight: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  missionHighlightText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  focusMissionGroup: {
    marginBottom: 14,
  },
  focusMissionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#8b5cf6",
    backgroundColor: "rgba(20,20,40,0.4)",
  },
  focusMissionTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    marginBottom: 4,
  },
  focusMissionBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  focusMissionProgress: {
    fontSize: 12,
    fontWeight: "800" as const,
    marginTop: 8,
  },
  pathwaysContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  pathwayCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#8b5cf6",
    backgroundColor: "rgba(20,20,40,0.4)",
  },
  pathwayIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  pathwayCopy: {
    flex: 1,
  },
  pathwayTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
    marginBottom: 4,
  },
  pathwayBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  pathwayFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  pathwayProgress: {
    fontSize: 12,
    fontWeight: "800" as const,
    flex: 1,
  },
  pathwayAction: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  weeklyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#8b5cf6",
    backgroundColor: "rgba(20,20,40,0.4)",
  },
  sectionHeaderTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitleCompact: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
  },
  sectionCaption: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900" as const,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  weekGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  dayContainer: {
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500" as const,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleCompleted: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold" as const,
  },
  historyContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  emptyHistory: {
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  historyList: {
    gap: 10,
  },
  historySubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flex: 1,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyCourseName: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  historyCourseMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  historyDate: {
    fontSize: 12,
  },
  historyRight: {
    marginLeft: 12,
  },
  taskActionColumn: {
    alignItems: "flex-end",
    gap: 8,
    marginLeft: 12,
  },
  taskActionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  taskActionText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  historyDuration: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#8b5cf6",
  },
  achievementsContainer: {
    paddingHorizontal: 20,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementCard: {
    width: (width - 50) / 2,
    padding: 16,
    borderRadius: 24,
    marginBottom: 15,
    alignItems: "center",
    backgroundColor: 'rgba(20,20,40,0.4)',
    borderWidth: 0.5,
    borderColor: '#8b5cf6',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    marginBottom: 4,
    textAlign: "center",
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: "center",
  },
  achievementBadge: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  achievementBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
});
