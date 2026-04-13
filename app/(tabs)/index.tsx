import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Play, Clock, Heart, Moon, Brain, Zap, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { useMeditation } from "@/providers/MeditationProvider";
import { useUser } from "@/providers/UserProvider";
import { useSettings, type Language } from "@/providers/SettingsProvider";
import { DAILY_AFFIRMATIONS } from "@/constants/affirmations";
import { SPIRITUAL_QUOTES } from "@/constants/quotes";
import { CATEGORIES, MEDITATION_SESSIONS, getCategoryName, getMeditationTitle } from "@/constants/meditations";
import { Orb3DPreview } from "@/components/Orb3DPreview";
import { getPreferredIdentityLabel } from "@/lib/identity";
import { FREE_DAILY_AWAKENING_MINUTES, ORB_AWAKENING_DAYS_REQUIRED, VIP_DAILY_AWAKENING_MINUTES } from "@/constants/vip";
import { CHAKRA_JOURNEY } from "@/constants/chakras";
import { POST_AWAKENING_ARCS } from "@/constants/postAwakeningJourney";
import { FREE_CORE_SHAPES } from "@/constants/vip";
import { DAILY_RESONANCE_CAP, RESONANCE_ORB_AURA_COST } from "@/constants/resonance";
import { homeCopy, localize } from "@/lib/i18n";

const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function HomeScreen() {
  const { stats, currentOrb, orbDisplayMode, missionStats, unlockedShapes, resonanceState, aiUsageSnapshot, hasClaimedDailyCheckIn, claimDailyCheckIn, isOrbAuraActive, unlockOrbAura } = useMeditation();
  const { profile, hasActiveVIP } = useUser();
  const { currentTheme, settings } = useSettings();
  const [affirmation, setAffirmation] = useState(DAILY_AFFIRMATIONS[0]);
  const [dailyQuote, setDailyQuote] = useState(SPIRITUAL_QUOTES[0]);
  const [claimingResonance, setClaimingResonance] = useState(false);
  const [lightingAura, setLightingAura] = useState(false);
  const todayKey = getTodayKey();
  const webNoPreviewStyle =
    Platform.OS === "web"
      ? ({
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
          WebkitUserDrag: "none",
          touchAction: "manipulation",
        } as any)
      : null;
  const preventMobileLinkPreview = (event: any) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  };

  const lang = settings.language;
  const tr = (zh: string, en: string, es: string) => {
    if (lang === "zh") return zh;
    if (lang === "es") return es;
    return en;
  };
  const identityLabel = getPreferredIdentityLabel({
    profile,
    walletAddress: null,
    lang,
    fallbackZh: "探索者",
    fallbackEn: "Seeker",
  });

  useEffect(() => {
    const today = new Date().getDay();
    setAffirmation(DAILY_AFFIRMATIONS[today % DAILY_AFFIRMATIONS.length]);
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setDailyQuote(SPIRITUAL_QUOTES[dayOfYear % SPIRITUAL_QUOTES.length]);
  }, []);

  const quickActions = [
    { id: "breathing", title: tr("呼吸", "Breathing", "Respiración"), icon: Heart, color: "#EC4899" },
    { id: "timer", title: tr("計時器", "Timer", "Temporizador"), icon: Clock, color: "#3B82F6" },
    { id: "sleep", title: tr("睡眠", "Sleep", "Sueño"), icon: Moon, color: "#8B5CF6" },
    { id: "focus", title: tr("專注", "Focus", "Enfoque"), icon: Brain, color: "#10B981" },
  ];

  const featuredSessions = MEDITATION_SESSIONS.filter(s => s.featured).slice(0, 3);
  const remainingCategoryNames = CATEGORIES
    .filter((category) => category.id !== "all" && !missionStats.uniqueCategories.includes(category.id))
    .map((category) => getCategoryName(category, lang));
  const chakraJourneyDay = Math.min(currentOrb.layers.length + 1, ORB_AWAKENING_DAYS_REQUIRED);
  const chakraDay = CHAKRA_JOURNEY[Math.max(0, chakraJourneyDay - 1)];
  const dailyMinutesRequired = hasActiveVIP ? VIP_DAILY_AWAKENING_MINUTES : FREE_DAILY_AWAKENING_MINUTES;
  const awakeningProgress = `${currentOrb.layers.length}/${ORB_AWAKENING_DAYS_REQUIRED}`;
  const earnedUnlockedShapeCount = Math.max(
    0,
    unlockedShapes.filter((shape) => !(FREE_CORE_SHAPES as readonly string[]).includes(shape)).length
      - missionStats.starterShapesGranted
  );
  const postAwakeningProgress = POST_AWAKENING_ARCS.map((arc) => {
    const target = hasActiveVIP ? arc.vipTarget : arc.freeTarget;
    const value =
      arc.metric === "blessingsSent"
        ? missionStats.blessingsSent
        : arc.metric === "ritualDepth"
          ? stats.totalMinutes
          : earnedUnlockedShapeCount;
    return {
      ...arc,
      target,
      value: Math.min(value, target),
      completed: value >= target,
    };
  });
  const nextAwakenedArc = postAwakeningProgress.find((arc) => !arc.completed) ?? postAwakeningProgress[0];
  const nextStepRoute = currentOrb.isAwakened
    ? nextAwakenedArc.metric === "blessingsSent"
      ? "/garden"
      : nextAwakenedArc.metric === "ritualDepth"
        ? "/meditate"
        : "/garden"
    : "/meditate";
  const nextStepCTA = currentOrb.isAwakened
    ? nextAwakenedArc.metric === "blessingsSent"
      ? tr("去送祝福", "Send a Blessing", "Enviar una bendición")
      : nextAwakenedArc.metric === "ritualDepth"
        ? tr("去完成冥想", "Start a Meditation", "Empezar una meditación")
        : tr("去解鎖形態", "Unlock a Form", "Desbloquear una forma")
    : tr("去完成今日冥想", "Do Today's Practice", "Haz la práctica de hoy");
  const nextStepLabel = currentOrb.isAwakened
    ? nextAwakenedArc.metric === "blessingsSent"
      ? tr(
          "先到花園送出 1 次祝福，讓第二章真正開始流動。",
          "Head to the garden and send 1 blessing to start chapter two in motion.",
          "Ve al jardín y envía 1 bendición para poner en movimiento el segundo capítulo."
        )
      : nextAwakenedArc.metric === "ritualDepth"
        ? tr(
            "先完成一節冥想，繼續累積更深的靜心分鐘。",
            "Complete one meditation session to keep building ritual depth.",
            "Completa una meditación para seguir profundizando tu práctica."
          )
        : tr(
            "先完成一條光球任務，解鎖下一個高階聖形。",
            "Complete one orb mission to unlock your next sacred form.",
            "Completa una misión del orbe para desbloquear tu siguiente forma sagrada."
          )
    : tr(
        `先到冥想頁完成 ${dailyMinutesRequired} 分鐘靜心，今晚回花園點亮第 ${chakraJourneyDay} 層能量。`,
        `Go to Meditate and complete ${dailyMinutesRequired} minutes today, then return to the garden to light layer ${chakraJourneyDay}.`,
        `Ve a Meditar y completa ${dailyMinutesRequired} minutos hoy; después vuelve al jardín para encender la capa ${chakraJourneyDay}.`
      );
  const assistantJourneyPrompt =
    missionStats.customMeditationsCreated === 0
      ? tr(
          "AI 助手還未開始。生成 1 個專屬冥想，之後它會出現在圖書館。",
          "Your AI journey has not started yet. Generate 1 personalized meditation and it will appear in the library.",
          "Tu viaje con IA aún no ha comenzado. Genera 1 meditación personalizada y aparecerá en la biblioteca."
        )
      : missionStats.customMeditationsCompleted === 0
        ? tr(
            "你已生成 AI 課程。下一步去冥想圖書館完成它。",
            "Your AI meditation is ready. Next, complete it from the library.",
            "Tu meditación con IA ya está lista. El siguiente paso es completarla desde la biblioteca."
          )
        : null;
  const assistantJourneyNeedsCreation = missionStats.customMeditationsCreated === 0;
  const assistantJourneyNeedsCompletion =
    missionStats.customMeditationsCreated > 0 && missionStats.customMeditationsCompleted === 0;
  const categoryPrompt = remainingCategoryNames.length > 0
    ? tr(
        `你還未試過：${remainingCategoryNames.slice(0, 3).join("、")}${remainingCategoryNames.length > 3 ? "…" : ""}`,
        `You still have: ${remainingCategoryNames.slice(0, 3).join(", ")}${remainingCategoryNames.length > 3 ? "…" : ""}`,
        `Aún te quedan: ${remainingCategoryNames.slice(0, 3).join(", ")}${remainingCategoryNames.length > 3 ? "…" : ""}`
      )
    : tr("你已經試過所有主題。", "You have explored every theme.", "Ya exploraste todos los temas.");
  const todayResonanceEarned = resonanceState.dailyBucket.dayKey === todayKey
    ? resonanceState.dailyBucket.amount
    : 0;
  const resonancePrompt = hasClaimedDailyCheckIn
    ? tr(
        `今天已簽到，還可再獲得 ${Math.max(0, DAILY_RESONANCE_CAP - todayResonanceEarned)} 點 Resonance。`,
        `Today's check-in is claimed. You can still earn ${Math.max(0, DAILY_RESONANCE_CAP - todayResonanceEarned)} more Resonance today.`,
        `El registro de hoy ya está hecho. Aún puedes ganar ${Math.max(0, DAILY_RESONANCE_CAP - todayResonanceEarned)} Resonance más hoy.`
      )
    : tr(
        "先完成今日簽到，拿到最輕的一筆能量回報。",
        "Start with today's check-in to collect your first pulse of Resonance.",
        "Empieza con el check-in de hoy para recoger tu primer impulso de Resonance."
      );
  const resonanceBoostPrompt = resonanceState.blessingBoostCharges > 0
    ? tr(
        `你有 ${resonanceState.blessingBoostCharges} 次加持待使用。下次送祝福時會更顯眼。`,
        `You have ${resonanceState.blessingBoostCharges} blessing boost charge ready. Your next blessing will stand out more.`,
        `Tienes ${resonanceState.blessingBoostCharges} mejora de bendición lista. Tu próxima bendición destacará más.`
      )
    : resonanceState.balance >= 5
      ? tr(
          "你已足夠換 1 次祝福加持。去花園用 5 點強化下一次祝福。",
          "You have enough for 1 blessing boost. Spend 5 in the garden to enhance your next blessing.",
          "Ya tienes suficiente para 1 mejora de bendición. Gasta 5 en el jardín para potenciar tu próxima bendición."
        )
      : tr(
          "累積到 5 點 Resonance 後，可在花園換 1 次祝福加持。",
          "Save 5 Resonance to unlock 1 blessing boost in the garden.",
          "Ahorra 5 Resonance para desbloquear 1 mejora de bendición en el jardín."
        );
  const resonanceActionReady = resonanceState.blessingBoostCharges > 0 || resonanceState.balance >= 5;
  const auraActionReady = isOrbAuraActive || resonanceState.balance >= RESONANCE_ORB_AURA_COST;
  const aiGuidancePrompt = aiUsageSnapshot.remaining > 0
    ? tr(
        `今日靈感尚餘 ${aiUsageSnapshot.remaining} 次，可請 AI 幫你生成指引或專屬冥想。`,
        `${aiUsageSnapshot.remaining} AI guidance credits remain today for prompts or personalized sessions.`,
        `Quedan ${aiUsageSnapshot.remaining} créditos de guía IA hoy para indicaciones o sesiones personalizadas.`
      )
    : tr(
        "今日免費靈感已用完，可用 Resonance 補充或開啟 VIP。",
        "Today's free AI guidance is used up. Top up with Resonance or unlock VIP.",
        "La guía IA gratuita de hoy ya se agotó. Recarga con Resonance o activa VIP."
      );
  const orbPrimaryStatus = currentOrb.isAwakened
    ? tr("已覺醒", "Awakened", "Despierto")
    : tr("成長中", "Growing", "Creciendo");
  const orbSecondaryHint = currentOrb.isAwakened
    ? (isOrbAuraActive
      ? tr("7 脈輪已完成，今日光場已開啟", "7 chakra layers complete, field active today", "Las 7 capas de chakras están completas y el campo está activo hoy")
      : tr("7 脈輪已完成，回花園繼續旅程", "7 chakra layers complete, continue in Garden", "Las 7 capas de chakras están completas; vuelve al jardín para continuar"))
    : tr(`第 ${chakraJourneyDay} 日，還差 ${dailyMinutesRequired} 分鐘`, `Day ${chakraJourneyDay}, ${dailyMinutesRequired} minutes to go`, `Día ${chakraJourneyDay}, faltan ${dailyMinutesRequired} minutos`);
  const primaryJourneyTitle = currentOrb.isAwakened
    ? tr("今天先推進第二章", "Advance chapter two today", "Avanza hoy el segundo capítulo")
    : tr(`今天先完成第 ${chakraJourneyDay} 日`, `Complete day ${chakraJourneyDay} first today`, `Completa primero el día ${chakraJourneyDay} de hoy`);
  const primaryJourneyBody = currentOrb.isAwakened
    ? nextStepLabel
    : tr(
        `先完成 ${dailyMinutesRequired} 分鐘靜心，再回花園點亮 ${chakraDay.zhTitle}。`,
        `Complete ${dailyMinutesRequired} minutes first, then return to Garden to light ${chakraDay.enTitle}.`,
        `Completa primero ${dailyMinutesRequired} minutos y luego vuelve al jardín para encender ${chakraDay.esTitle ?? chakraDay.enTitle}.`
      );
  const primaryJourneyProgress = currentOrb.isAwakened
    ? tr(
        `當前進度 ${nextAwakenedArc.value}/${nextAwakenedArc.target}`,
        `Current progress ${nextAwakenedArc.value}/${nextAwakenedArc.target}`,
        `Progreso actual ${nextAwakenedArc.value}/${nextAwakenedArc.target}`
      )
    : tr(`當前進度 ${awakeningProgress}`, `Current progress ${awakeningProgress}`, `Progreso actual ${awakeningProgress}`);
  const secondaryJourneyPrompt = assistantJourneyPrompt ?? categoryPrompt;
  const secondaryJourneyTitle = assistantJourneyNeedsCreation
    ? tr("AI 助手還未開始", "Your AI Journey Has Not Started", "Tu viaje con IA aún no ha empezado")
    : assistantJourneyNeedsCompletion
      ? tr("最新 AI 課程待完成", "Your Latest AI Session Is Waiting", "Tu última sesión de IA está esperando")
      : tr("下一個可嘗試", "Another path to explore", "Otro camino por explorar");
  const secondaryJourneyCta = assistantJourneyNeedsCreation
    ? tr("去 AI 助手", "Open AI Assistant", "Abrir asistente IA")
    : assistantJourneyNeedsCompletion
      ? tr("去冥想館完成", "Finish It in Library", "Termínala en la biblioteca")
      : tr("去試新主題", "Try a New Theme", "Probar un tema nuevo");
  const secondaryJourneyRoute = assistantJourneyNeedsCreation ? "/assistant" : "/meditate";

  const handleQuickAction = (actionId: string) => {
    if (actionId === "breathing") {
      router.push("/breathing");
    } else if (actionId === "timer") {
      router.push("/timer");
    } else {
      router.push("/meditate");
    }
  };

  const handleClaimDailyCheckIn = async () => {
    if (claimingResonance) return;
    setClaimingResonance(true);
    try {
      const result = await claimDailyCheckIn();
      if (result.granted) {
        Alert.alert(
          tr("已領取 Resonance", "Resonance claimed", "Resonance obtenido"),
          tr(
            `你今天的簽到已完成，獲得 ${result.amount} 點 Resonance。`,
            `Your daily check-in is complete. You earned ${result.amount} Resonance.`,
            `Tu check-in de hoy se completó. Has obtenido ${result.amount} Resonance.`
          )
        );
      } else {
        Alert.alert(
          tr("今日已完成", "Already done today", "Ya está hecho hoy"),
          result.reason === "daily-cap"
            ? tr("你今天的 Resonance 已達上限。", "You have reached today's Resonance cap.", "Ya alcanzaste el límite de Resonance de hoy.")
            : tr("今日簽到已領取。", "Today's check-in has already been claimed.", "El check-in de hoy ya fue reclamado.")
        );
      }
    } finally {
      setClaimingResonance(false);
    }
  };

  const handleUnlockOrbAura = async () => {
    if (lightingAura) return;
    setLightingAura(true);
    try {
      const result = await unlockOrbAura();
      if (result.granted) {
        Alert.alert(
          tr("今日光暈已點亮", "Today's aura is lit", "El aura de hoy ya está encendida"),
          tr(
            `你花費了 ${RESONANCE_ORB_AURA_COST} 點 Resonance。今日首頁與花園會顯示柔光光暈。`,
            `You spent ${RESONANCE_ORB_AURA_COST} Resonance. Your orb will glow with a soft aura across Home and Garden today.`,
            `Has gastado ${RESONANCE_ORB_AURA_COST} Resonance. Tu esfera brillará con un aura suave en Inicio y Jardín hoy.`
          )
        );
      } else {
        Alert.alert(
          tr("暫時不能點亮", "Cannot light aura yet", "Todavía no se puede encender el aura"),
          result.reason === "already-active"
            ? tr("今日光暈已經啟動。", "Your orb aura is already active today.", "El aura de tu esfera ya está activa hoy.")
            : tr("Resonance 不足，先去完成今日冥想或簽到。", "You need more Resonance first. Try today's check-in or meditation.", "Necesitas más Resonance primero. Prueba el check-in de hoy o una meditación.")
        );
      }
    } finally {
      setLightingAura(false);
    }
  };







  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting(lang)}, {identityLabel}
              </Text>
              <Text style={styles.subtitle}>
                {localize(lang, homeCopy.journeyContinues)}
              </Text>
              <Text style={styles.quoteText}>
                {lang === "zh" ? dailyQuote.zh : lang === "es" ? (dailyQuote.es ?? dailyQuote.en) : dailyQuote.en}
              </Text>
              <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
            </View>
            <View style={styles.streakContainer}>
              <Zap size={20} color="#FCD34D" />
              <Text style={styles.streakText}>{stats.currentStreak}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Light Orb 3D Preview */}
        <TouchableOpacity
          style={[
            styles.orbSection,
            {
              backgroundColor: currentTheme.card,
              borderColor: isOrbAuraActive ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.06)",
              shadowColor: isOrbAuraActive ? "#f59e0b" : "#000",
              shadowOpacity: isOrbAuraActive ? 0.22 : 0.08,
              shadowRadius: isOrbAuraActive ? 16 : 8,
            },
            webNoPreviewStyle,
          ]}
          onPress={() => router.push('/garden')}
          activeOpacity={0.9}
          onLongPress={preventMobileLinkPreview}
          onContextMenu={preventMobileLinkPreview}
        >
          <View style={styles.orbHeader}>
            <View style={styles.orbTitleRow}>
              <Sparkles size={20} color={currentTheme.primary} />
              <Text style={[styles.orbTitle, { color: currentTheme.text }]}>
                {localize(lang, homeCopy.yourLightOrb)}
              </Text>
            </View>
            <View style={styles.orbBadge}>
              <Text style={[styles.orbBadgeText, { color: currentTheme.primary }]}>
                {currentOrb.layers.length}/7
              </Text>
            </View>
          </View>
          <Orb3DPreview orb={currentOrb} size={180} displayMode={orbDisplayMode} />
          <View style={styles.orbFooter}>
            <View style={styles.orbFooterText}>
              <Text style={[styles.orbStatus, { color: currentTheme.text }]}>
                {orbPrimaryStatus}
              </Text>
              <Text style={[styles.orbAuraStatus, { color: isOrbAuraActive ? "#f59e0b" : currentTheme.textSecondary }]}>
                {orbSecondaryHint}
              </Text>
            </View>
            <Text style={[styles.orbCTA, { color: currentTheme.primary }]}>
              {localize(lang, homeCopy.enterGarden)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Daily Affirmation */}
        <View style={[styles.affirmationCard, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.affirmationLabel, { color: currentTheme.primary }]}>
            {localize(lang, homeCopy.todaysAffirmation)}
          </Text>
          <Text style={[styles.affirmationText, { color: currentTheme.text }]}>
            {lang === "zh" ? affirmation.zh : lang === "es" ? (affirmation.es ?? affirmation.en) : affirmation.en}
          </Text>
          <Text style={[styles.affirmationAuthor, { color: currentTheme.textSecondary }]}>
            - {lang === "zh" ? affirmation.authorZh : lang === "es" ? (affirmation.authorEs ?? affirmation.author) : affirmation.author}
          </Text>
        </View>

        <View style={[styles.resonanceCard, { backgroundColor: currentTheme.card }]}>
          <View style={styles.resonanceHeader}>
            <View>
              <Text style={[styles.resonanceEyebrow, { color: currentTheme.primary }]}>
                {localize(lang, homeCopy.resonanceEnergy)}
              </Text>
              <Text style={[styles.resonanceBalance, { color: currentTheme.text }]}>
                {resonanceState.balance}
              </Text>
            </View>
            <View style={[styles.resonanceTodayPill, { backgroundColor: `${currentTheme.primary}20` }]}>
              <Text style={[styles.resonanceTodayText, { color: currentTheme.primary }]}>
                {lang === "zh"
                  ? `今日 ${todayResonanceEarned}/${DAILY_RESONANCE_CAP}`
                  : lang === "es"
                    ? `Hoy ${todayResonanceEarned}/${DAILY_RESONANCE_CAP}`
                    : `Today ${todayResonanceEarned}/${DAILY_RESONANCE_CAP}`}
              </Text>
            </View>
          </View>
              <Text style={[styles.resonanceBody, { color: currentTheme.textSecondary }]}>
                {resonancePrompt}
              </Text>
              <View style={styles.resonanceMetaRow}>
                <View style={[styles.resonanceHintPill, styles.aiGuidancePill, { borderColor: currentTheme.border, backgroundColor: `${currentTheme.primary}10` }]}>
                  <Text style={[styles.resonanceHintText, { color: currentTheme.textSecondary }]}>
                    {lang === "zh"
                      ? `AI 靈感 ${aiUsageSnapshot.remaining} / ${aiUsageSnapshot.totalAvailable}`
                      : lang === "es"
                        ? `Guía IA ${aiUsageSnapshot.remaining} / ${aiUsageSnapshot.totalAvailable}`
                        : `AI guidance ${aiUsageSnapshot.remaining} / ${aiUsageSnapshot.totalAvailable}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.resonanceHintPill, { borderColor: currentTheme.border, backgroundColor: `${currentTheme.primary}10` }]}
                onPress={() => router.push("/garden")}
                activeOpacity={0.85}
          >
            <Text style={[styles.resonanceHintText, { color: currentTheme.textSecondary }]}>
                {resonanceBoostPrompt}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resonanceHintPill, { borderColor: currentTheme.border, backgroundColor: "rgba(255,255,255,0.04)" }]}
              onPress={() => router.push("/assistant")}
              activeOpacity={0.85}
            >
              <Text style={[styles.resonanceHintText, { color: currentTheme.textSecondary }]}>
                {aiGuidancePrompt}
              </Text>
            </TouchableOpacity>
          <View style={styles.resonanceActionsRow}>
            <TouchableOpacity
              style={[
                styles.resonanceButton,
                {
                  borderColor: hasClaimedDailyCheckIn ? currentTheme.border : currentTheme.primary,
                  backgroundColor: hasClaimedDailyCheckIn ? "transparent" : `${currentTheme.primary}12`,
                },
              ]}
              onPress={handleClaimDailyCheckIn}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.resonanceButtonText,
                  { color: hasClaimedDailyCheckIn ? currentTheme.textSecondary : currentTheme.primary },
                ]}
              >
                {hasClaimedDailyCheckIn
                  ? tr("今日已簽到", "Checked in today", "Check-in hecho hoy")
                  : claimingResonance
                    ? tr("領取中...", "Claiming...", "Reclamando...")
                    : tr("每日簽到 +1", "Daily check-in +1", "Check-in diario +1")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resonanceButton,
                {
                  borderColor: auraActionReady ? "#f59e0b" : currentTheme.border,
                  backgroundColor: auraActionReady ? "rgba(245,158,11,0.12)" : "transparent",
                },
              ]}
              onPress={handleUnlockOrbAura}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.resonanceButtonText,
                  { color: auraActionReady ? "#f59e0b" : currentTheme.textSecondary },
                ]}
              >
                {isOrbAuraActive
                  ? tr("今日光暈已亮起", "Aura active today", "Aura activa hoy")
                  : lightingAura
                    ? tr("點亮中...", "Lighting...", "Encendiendo...")
                    : tr(`點亮今日光暈 · ${RESONANCE_ORB_AURA_COST}`, `Light today's aura · ${RESONANCE_ORB_AURA_COST}`, `Encender el aura de hoy · ${RESONANCE_ORB_AURA_COST}`)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resonanceButton,
                {
                  borderColor: resonanceActionReady ? currentTheme.primary : currentTheme.border,
                  backgroundColor: resonanceActionReady ? `${currentTheme.primary}12` : "transparent",
                },
              ]}
              onPress={() => router.push("/garden")}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.resonanceButtonText,
                  { color: resonanceActionReady ? currentTheme.primary : currentTheme.textSecondary },
                ]}
              >
                {resonanceState.blessingBoostCharges > 0
                  ? tr("去送加持祝福", "Use blessing boost", "Usar mejora de bendición")
                  : tr("去花 5 點", "Spend 5 in garden", "Gastar 5 en el jardín")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAction}
                onPress={() => handleQuickAction(action.id)}
                testID={`quick-action-${action.id}`}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + "20" }]}>
                  <Icon size={24} color={action.color} />
                </View>
                <Text style={[styles.quickActionText, { color: currentTheme.textSecondary }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!currentOrb.isAwakened ? (
          <TouchableOpacity
            style={[styles.nextStepCard, { backgroundColor: currentTheme.card }]}
            onPress={() => router.push(nextStepRoute as never)}
            activeOpacity={0.88}
            onLongPress={preventMobileLinkPreview}
            onContextMenu={preventMobileLinkPreview}
          >
            <View style={styles.nextStepHeader}>
              <View style={[styles.chakraDot, { backgroundColor: chakraDay.color }]} />
              <Text style={[styles.nextStepEyebrow, { color: currentTheme.primary }]}>
                {tr(`第一章 · 今天的能量下一步 · 第 ${chakraJourneyDay} 日`, `Chapter One · Today's Energy Step · Day ${chakraJourneyDay}`, `Capítulo uno · Paso de energía de hoy · Día ${chakraJourneyDay}`)}
              </Text>
            </View>
            <View style={styles.nextStepMainRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nextStepTitle, { color: currentTheme.text }]}>
                  {primaryJourneyTitle}
                </Text>
                <Text style={[styles.nextStepTheme, { color: currentTheme.textSecondary }]}>
                  {lang === "zh" ? chakraDay.zhTitle : lang === "es" ? (chakraDay.esTitle ?? chakraDay.enTitle) : chakraDay.enTitle}
                </Text>
              </View>
              <Text style={[styles.nextStepMeta, { color: currentTheme.primary }]}>
                  {localize(lang, homeCopy.today)}
              </Text>
            </View>
            <View style={styles.nextStepFooter}>
              <Text style={[styles.nextStepBody, { color: currentTheme.textSecondary }]}>
                {primaryJourneyBody}
              </Text>
              <View>
                <Text style={[styles.nextStepMiniCTA, { color: currentTheme.primary }]}>
                  {nextStepCTA}
                </Text>
                <Text style={[styles.nextStepMiniCTA, { color: currentTheme.textSecondary, marginTop: 4 }]}>
                  {primaryJourneyProgress}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextStepCard, { backgroundColor: currentTheme.card }]}
            onPress={() => router.push(nextStepRoute as never)}
            activeOpacity={0.88}
            onLongPress={preventMobileLinkPreview}
            onContextMenu={preventMobileLinkPreview}
          >
            <View style={styles.nextStepHeader}>
              <View style={[styles.chakraDot, { backgroundColor: currentTheme.primary }]} />
              <Text style={[styles.nextStepEyebrow, { color: currentTheme.primary }]}>
                {tr("第二章 · 今天的能量下一步", "Chapter Two · Today's Energy Step", "Capítulo dos · Paso de energía de hoy")}
              </Text>
            </View>
            <View style={styles.nextStepMainRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nextStepTitle, { color: currentTheme.text }]}>
                  {primaryJourneyTitle}
                </Text>
                <Text style={[styles.nextStepTheme, { color: currentTheme.textSecondary }]}>
                  {lang === "zh" ? nextAwakenedArc.zhTitle : lang === "es" ? (nextAwakenedArc.esTitle ?? nextAwakenedArc.enTitle) : nextAwakenedArc.enTitle}
                </Text>
              </View>
              <Text style={[styles.nextStepMeta, { color: currentTheme.primary }]}>
                  {localize(lang, homeCopy.next)}
              </Text>
            </View>
            <View style={styles.nextStepFooter}>
              <Text style={[styles.nextStepBody, { color: currentTheme.textSecondary }]}>
                {primaryJourneyBody}
              </Text>
              <View>
                <Text style={[styles.nextStepMiniCTA, { color: currentTheme.primary }]}>
                  {nextStepCTA}
                </Text>
                <Text style={[styles.nextStepMiniCTA, { color: currentTheme.textSecondary, marginTop: 4 }]}>
                  {primaryJourneyProgress}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <View style={[styles.journeySupportCard, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.journeySupportTitle, { color: currentTheme.text }]}>
            {secondaryJourneyTitle}
          </Text>
          <Text style={[styles.journeySupportBody, { color: currentTheme.textSecondary }]}>
            {secondaryJourneyPrompt}
          </Text>
          <TouchableOpacity
            style={[styles.journeySupportButton, { borderColor: currentTheme.primary }]}
            onPress={() => router.push(secondaryJourneyRoute as never)}
            activeOpacity={0.85}
          >
            <Text style={[styles.journeySupportButtonText, { color: currentTheme.primary }]}>
              {secondaryJourneyCta}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Featured Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              {localize(lang, homeCopy.featuredSessions)}
            </Text>
            <TouchableOpacity onPress={() => router.push("/meditate")}>
              <Text style={[styles.seeAll, { color: currentTheme.primary }]}>
                {localize(lang, homeCopy.seeAll)}
              </Text>
            </TouchableOpacity>
          </View>

          {featuredSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => router.push(`/meditation/${session.id}`)}
              testID={`session-${session.id}`}
            >
              <LinearGradient
                colors={session.gradient as any}
                style={styles.sessionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.sessionContent}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{getMeditationTitle(session, lang)}</Text>
                    <Text style={styles.sessionDuration}>{session.duration} min</Text>
                  </View>
                  <Play size={20} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>
              {stats.totalSessions}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {localize(lang, homeCopy.sessions)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>
              {Math.floor(stats.totalMinutes / 60)}h
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {localize(lang, homeCopy.totalTime)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.statValue, { color: currentTheme.primary }]}>
              {stats.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
              {localize(lang, homeCopy.dayStreak)}
            </Text>
          </View>
        </View>


      </ScrollView>
    </View>
  );
}

function getGreeting(lang: Language = "en") {
  const hour = new Date().getHours();
  const greetings = {
    morning: { en: "Good morning", zh: "早安", es: "Buenos días" },
    afternoon: { en: "Good afternoon", zh: "午安", es: "Buenas tardes" },
    evening: { en: "Good evening", zh: "晚安", es: "Buenas noches" },
  };
  
  if (hour < 12) return greetings.morning[lang];
  if (hour < 18) return greetings.afternoon[lang];
  return greetings.evening[lang];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#e0e0ff",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#b0b0ff",
    marginTop: 6,
  },
  quoteText: {
    fontSize: 14,
    color: "#E0E7FF",
    marginTop: 14,
    fontStyle: "italic" as const,
    lineHeight: 21,
    maxWidth: 240,
  },
  quoteAuthor: {
    fontSize: 12,
    color: "rgba(224, 231, 255, 0.8)",
    marginTop: 6,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  streakText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    marginTop: -14,
  },
  nextStepCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: "rgba(139,92,246,0.18)",
  },
  nextStepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  chakraDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  nextStepEyebrow: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  nextStepTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    marginBottom: 2,
  },
  nextStepTheme: {
    fontSize: 13,
  },
  nextStepMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  nextStepBody: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  nextStepFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nextStepMeta: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  nextStepMiniCTA: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  journeySupportCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: "rgba(139,92,246,0.14)",
  },
  journeySupportTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  journeySupportBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  journeySupportButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  journeySupportButtonText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  orbSection: {
    backgroundColor: 'rgba(20,20,40,0.4)',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 18,
    padding: 18,
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(167,139,250,0.22)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  orbHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orbTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orbTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  orbBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  orbBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  orbFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  orbFooterText: {
    flex: 1,
    paddingRight: 12,
  },
  orbStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  orbAuraStatus: {
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 4,
    lineHeight: 17,
  },
  orbCTA: {
    fontSize: 14,
    fontWeight: '700',
  },
  orbSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  affirmationCard: {
    backgroundColor: 'rgba(20,20,40,0.4)',
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 18,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(167,139,250,0.22)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 2,
  },
  affirmationLabel: {
    fontSize: 14,
    color: "#a78bfa",
    fontWeight: "700" as const,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  affirmationText: {
    fontSize: 17,
    color: "#e0e0ff",
    lineHeight: 26,
    fontStyle: "italic" as const,
    fontWeight: "500" as const,
  },
  affirmationAuthor: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },
  resonanceCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: "rgba(139,92,246,0.18)",
  },
  resonanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  resonanceEyebrow: {
    fontSize: 12,
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resonanceBalance: {
    fontSize: 28,
    fontWeight: "900" as const,
  },
  resonanceTodayPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resonanceTodayText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  resonanceBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  resonanceMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  resonanceHintPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  aiGuidancePill: {
    marginBottom: 0,
    paddingVertical: 8,
  },
  resonanceHintText: {
    fontSize: 12,
    lineHeight: 18,
  },
  resonanceButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resonanceActionsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  resonanceButtonText: {
    fontSize: 12,
    fontWeight: "800" as const,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 26,
  },
  quickAction: {
    alignItems: "center",
    width: "23%",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.18)',
  },
  quickActionText: {
    fontSize: 13,
    color: "#b0b0ff",
    fontWeight: "600" as const,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900" as const,
    color: "#e0e0ff",
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 15,
    color: "#a78bfa",
    fontWeight: "700" as const,
  },
  sessionCard: {
    marginBottom: 10,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: 'rgba(167,139,250,0.24)',
  },
  sessionGradient: {
    padding: 18,
  },
  sessionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: "#E0E7FF",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(20,20,40,0.4)',
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 22,
    alignItems: "center",
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(167,139,250,0.2)',
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: "#a78bfa",
  },
  statLabel: {
    fontSize: 13,
    color: "#b0b0ff",
    marginTop: 4,
    fontWeight: "500" as const,
  },
  worldBanner: {
    backgroundColor: "#111827",
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  worldBannerTitle: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "700",
  },
  worldBannerError: {
    color: "#FCA5A5",
    marginTop: 6,
    fontSize: 12,
  },
  verifyingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  verifyingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  verifyingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  verifyingDebug: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
