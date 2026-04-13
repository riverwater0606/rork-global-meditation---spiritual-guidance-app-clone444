import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Clock, MoreHorizontal, Trash2, Palette, X, ChevronDown, ChevronUp } from "lucide-react-native";
import { router } from "expo-router";
import { MEDITATION_SESSIONS, CATEGORIES, getCategoryName, getMeditationDescription, getMeditationTitle } from "@/constants/meditations";
import { useSettings } from "@/providers/SettingsProvider";
import { useMeditation } from "@/providers/MeditationProvider";
import { useUser } from "@/providers/UserProvider";
import CustomModal from "@/components/CustomModal";
import { localize, meditateCopy } from "@/lib/i18n";

const { width } = Dimensions.get("window");

const COLOR_OPTIONS = [
  { id: 'purple', colors: ['#8B5CF6', '#6366F1'], name: 'Purple' },
  { id: 'blue', colors: ['#3B82F6', '#2563EB'], name: 'Blue' },
  { id: 'green', colors: ['#10B981', '#059669'], name: 'Green' },
  { id: 'orange', colors: ['#F59E0B', '#D97706'], name: 'Orange' },
  { id: 'pink', colors: ['#EC4899', '#DB2777'], name: 'Pink' },
  { id: 'teal', colors: ['#14B8A6', '#0D9488'], name: 'Teal' },
  { id: 'indigo', colors: ['#6366F1', '#4F46E5'], name: 'Indigo' },
  { id: 'rose', colors: ['#F43F5E', '#E11D48'], name: 'Rose' },
];

export default function MeditateScreen() {
  const { currentTheme, settings } = useSettings();
  const {
    customMeditations,
    deleteCustomMeditation,
    updateCustomMeditation,
    missionStats,
  } = useMeditation();
  const { hasActiveVIP } = useUser();
  const lang = settings.language;
  const tr = (zh: string, en: string, es: string) => {
    if (lang === "zh") return zh;
    if (lang === "es") return es;
    return en;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Modal states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCoreJourneyExpanded, setIsCoreJourneyExpanded] = useState(false);

  const customSessionsFormatted = customMeditations.map(m => ({
    id: m.id,
    isCustom: m.isCustom ?? true,
    title: m.title,
    description: m.script.substring(0, 50) + '...',
    duration: m.duration,
    narrator: tr('AI 生成', 'AI Generated', 'Generado por IA'),
    category: 'custom',
    gradient: m.gradient || ['#8B5CF6', '#6366F1'],
    featured: false,
    accessTier: 'free' as const,
  }));

  const allSessions = [...customSessionsFormatted, ...MEDITATION_SESSIONS];
  const customSessionIds = new Set(customMeditations.filter((m) => m.isCustom ?? true).map((m) => m.id));
  const latestCustomMeditation = customMeditations[customMeditations.length - 1];

  const handleLongPress = (id: string) => {
    if (customSessionIds.has(id)) {
      setSelectedSessionId(id);
      setShowActionModal(true);
    }
  };

  const handleDelete = () => {
    if (selectedSessionId) {
      deleteCustomMeditation(selectedSessionId);
      setShowDeleteConfirm(false);
      setShowActionModal(false);
      setSelectedSessionId(null);
    }
  };

  const handleColorUpdate = (colors: [string, string]) => {
    if (selectedSessionId) {
      updateCustomMeditation(selectedSessionId, { gradient: colors });
      setShowColorModal(false);
      setShowActionModal(false);
      setSelectedSessionId(null);
    }
  };

  const filteredSessions = allSessions.filter((session) => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || session.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const coreJourneySessions = filteredSessions.filter((session) => session.isCoreJourney);
  const standardSessions = filteredSessions.filter((session) => !session.isCoreJourney);

  const remainingCategories = CATEGORIES
    .filter((category) => category.id !== "all" && !missionStats.uniqueCategories.includes(category.id))
    .map((category) => getCategoryName(category, lang));
  const recommendedCategory = remainingCategories[0] ?? null;
  const aiCreationPending = missionStats.customMeditationsCreated === 0;
  const aiCompletionPending = missionStats.customMeditationsCreated > 0 && missionStats.customMeditationsCompleted === 0;

  const handleOpenSession = (session: (typeof filteredSessions)[number]) => {
    if (session.accessTier === "vip" && !hasActiveVIP) {
      Alert.alert(
        tr("VIP 專屬內容", "VIP Content", "Contenido VIP"),
        tr(
          "升級 VIP 後可解鎖全部音頻與進階靈性內容。",
          "Upgrade to VIP to unlock all audio content and premium spiritual sessions.",
          "Hazte VIP para desbloquear todo el audio y las sesiones espirituales premium."
        ),
        [
          { text: tr("稍後", "Later", "Más tarde"), style: "cancel" },
          { text: tr("前往升級", "Go VIP", "Ir a VIP"), onPress: () => router.push("/profile") },
        ]
      );
      return;
    }

    router.push(`/meditation/${session.id}`);
  };

  const getSessionTitle = (session: (typeof filteredSessions)[number]) =>
    customSessionIds.has(session.id) ? session.title : getMeditationTitle(session, lang);
  const getSessionDescription = (session: (typeof filteredSessions)[number]) =>
    customSessionIds.has(session.id) ? session.description : getMeditationDescription(session, lang);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <Text style={styles.title}>{localize(lang, meditateCopy.title)}</Text>
          
          <View style={[styles.searchContainer, { backgroundColor: currentTheme.surface }]}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, { color: currentTheme.text }]}
              placeholder={localize(lang, meditateCopy.searchPlaceholder)}
              placeholderTextColor={currentTheme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
                selectedCategory === category.id && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary },
              ]}
              onPress={() => setSelectedCategory(category.id)}
              testID={`category-${category.id}`}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: currentTheme.textSecondary },
                  selectedCategory === category.id && { color: "#FFFFFF" },
                ]}
              >
                {getCategoryName(category, lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {(recommendedCategory || aiCreationPending || aiCompletionPending) && (
          <View style={[styles.guidanceCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.guidanceTitle, { color: currentTheme.text }]}>
              {localize(lang, meditateCopy.suggestedNextStep)}
            </Text>
            {recommendedCategory ? (
              <TouchableOpacity
                style={[styles.guidanceAction, { borderColor: currentTheme.primary }]}
                onPress={() => setSelectedCategory(CATEGORIES.find((category) => getCategoryName(category, lang) === recommendedCategory)?.id ?? "all")}
                activeOpacity={0.85}
              >
                <Text style={[styles.guidanceActionTitle, { color: currentTheme.primary }]}>
                  {tr(`試試 ${recommendedCategory}`, `Try ${recommendedCategory}`, `Prueba ${recommendedCategory}`)}
                </Text>
                <Text style={[styles.guidanceActionBody, { color: currentTheme.textSecondary }]}>
                  {tr("探索未試過的主題，任務進度會直接增加。", "Explore a new category and your mission progress will move immediately.", "Explora una categoría nueva y el progreso de tu misión avanzará enseguida.")}
                </Text>
              </TouchableOpacity>
            ) : null}
            {aiCreationPending ? (
              <TouchableOpacity
                style={[styles.guidanceAction, { borderColor: currentTheme.primary }]}
                onPress={() => router.push("/assistant")}
                activeOpacity={0.85}
              >
                <Text style={[styles.guidanceActionTitle, { color: currentTheme.primary }]}>
                  {tr("生成第一個 AI 冥想", "Generate Your First AI Meditation", "Genera tu primera meditación IA")}
                </Text>
                <Text style={[styles.guidanceActionBody, { color: currentTheme.textSecondary }]}>
                  {tr("生成後它會直接出現在圖書館，並解鎖新的光球任務。", "It will appear in your library right away and unlock a new orb mission.", "Aparecerá enseguida en tu biblioteca y desbloqueará una nueva misión del orbe.")}
                </Text>
              </TouchableOpacity>
            ) : null}
            {aiCompletionPending ? (
              <TouchableOpacity
                style={[styles.guidanceAction, { borderColor: currentTheme.primary }]}
                onPress={() => {
                  if (latestCustomMeditation) {
                    router.push(`/meditation/${latestCustomMeditation.id}`);
                    return;
                  }
                  setSelectedCategory("custom");
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.guidanceActionTitle, { color: currentTheme.primary }]}>
                  {tr("完成 1 個 AI 課程", "Complete 1 AI Session", "Completa 1 sesión de IA")}
                </Text>
                <Text style={[styles.guidanceActionBody, { color: currentTheme.textSecondary }]}>
                  {tr(
                    "直接打開最新 AI 課程完成一次；如果還未選好，就先切到 AI 類別。",
                    "Open your latest AI session and finish it once; if not, jump into the AI category first.",
                    "Abre tu última sesión de IA y complétala una vez; si no, entra primero en la categoría IA."
                  )}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        {coreJourneySessions.length > 0 && (
          <View style={[styles.coreJourneyCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <TouchableOpacity
              style={styles.coreJourneyHeader}
              activeOpacity={0.85}
              onPress={() => setIsCoreJourneyExpanded((prev) => !prev)}
            >
              <View style={styles.coreJourneyHeaderCopy}>
                <Text style={[styles.coreJourneyEyebrow, { color: currentTheme.primary }]}>
                  {localize(lang, meditateCopy.coreJourneyEyebrow)}
                </Text>
                <Text style={[styles.coreJourneyTitle, { color: currentTheme.text }]}>
                  {localize(lang, meditateCopy.coreJourneyTitle)}
                </Text>
                <Text style={[styles.coreJourneyBody, { color: currentTheme.textSecondary }]}>
                  {localize(lang, meditateCopy.coreJourneyBody)}
                </Text>
              </View>
              <View style={[styles.coreJourneyCountPill, { backgroundColor: currentTheme.primary }]}>
                <Text style={styles.coreJourneyCountText}>{coreJourneySessions.length}/10</Text>
              </View>
              <View style={[styles.coreJourneyChevron, { borderColor: currentTheme.border }]}>
                {isCoreJourneyExpanded ? (
                  <ChevronUp size={18} color={currentTheme.text} />
                ) : (
                  <ChevronDown size={18} color={currentTheme.text} />
                )}
              </View>
            </TouchableOpacity>

            {isCoreJourneyExpanded ? (
              <View style={styles.coreJourneyList}>
                {coreJourneySessions.map((session, index) => (
                  <TouchableOpacity
                    key={session.id}
                    style={[styles.coreJourneyItem, { borderColor: currentTheme.border }]}
                    activeOpacity={0.88}
                    onPress={() => handleOpenSession(session)}
                    testID={`core-journey-${session.id}`}
                  >
                    <LinearGradient
                      colors={session.gradient as [string, string]}
                      style={styles.coreJourneyStepBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.coreJourneyStepText}>{index + 1}</Text>
                    </LinearGradient>
                    <View style={styles.coreJourneyItemCopy}>
                      <Text style={[styles.coreJourneyItemTitle, { color: currentTheme.text }]} numberOfLines={1}>
                        {getSessionTitle(session)}
                      </Text>
                      <Text style={[styles.coreJourneyItemBody, { color: currentTheme.textSecondary }]} numberOfLines={2}>
                        {getSessionDescription(session)}
                      </Text>
                    </View>
                    <View style={styles.coreJourneyMeta}>
                      <View style={styles.coreJourneyMetaRow}>
                        <Clock size={13} color={currentTheme.textSecondary} />
                        <Text style={[styles.coreJourneyMetaText, { color: currentTheme.textSecondary }]}>
                          {session.duration} min
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* Sessions Grid */}
        <View style={styles.sessionsGrid}>
          {standardSessions.map((session, index) => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.sessionCard,
                index % 2 === 0 ? styles.sessionCardLeft : styles.sessionCardRight,
                session.accessTier === "vip" && !hasActiveVIP && styles.sessionCardLocked,
              ]}
              onPress={() => handleOpenSession(session)}
              onLongPress={() => handleLongPress(session.id)}
              delayLongPress={500}
              testID={`meditation-${session.id}`}
            >
              <LinearGradient
                colors={session.gradient as [string, string]}
                style={styles.sessionCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sessionCardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.sessionCardTitle} numberOfLines={2}>{getSessionTitle(session)}</Text>
                    {session.accessTier === "vip" && (
                      <View style={styles.vipChip}>
                        <Text style={styles.vipChipText}>VIP</Text>
                      </View>
                    )}
                    {customSessionIds.has(session.id) && (
                       <TouchableOpacity 
                         onPress={() => handleLongPress(session.id)}
                         style={styles.moreButton}
                       >
                         <MoreHorizontal size={16} color="rgba(255,255,255,0.7)" />
                       </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.sessionCardDescription} numberOfLines={2}>
                    {getSessionDescription(session)}
                  </Text>
                  {session.accessTier === "vip" && !hasActiveVIP && (
                    <Text style={styles.lockHint}>
                      {localize(lang, meditateCopy.vipUnlockHint)}
                    </Text>
                  )}
                  
                  <View style={styles.sessionCardMeta}>
                    <View style={styles.sessionCardMetaItem}>
                      <Clock size={14} color="#E0E7FF" />
                      <Text style={styles.sessionCardMetaText}>{session.duration} min</Text>
                    </View>

                  </View>
                </View>
                {session.accessTier === "vip" && !hasActiveVIP && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockOverlayText}>
                      {localize(lang, meditateCopy.vipLocked)}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>


      </ScrollView>

      {/* Action Sheet Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowActionModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.actionSheet}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionTitle}>
                    {localize(lang, meditateCopy.manageMeditation)}
                  </Text>
                  <TouchableOpacity onPress={() => setShowActionModal(false)}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.actionItem} 
                  onPress={() => {
                    setShowActionModal(false);
                    setTimeout(() => setShowColorModal(true), 100);
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Palette size={20} color="#6366F1" />
                  </View>
                  <Text style={styles.actionText}>
                    {localize(lang, meditateCopy.changeColor)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionItem, styles.actionItemDestructive]} 
                  onPress={() => {
                    setShowActionModal(false);
                    setTimeout(() => setShowDeleteConfirm(true), 100);
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Trash2 size={20} color="#EF4444" />
                  </View>
                  <Text style={[styles.actionText, styles.actionTextDestructive]}>
                    {localize(lang, meditateCopy.deleteMeditation)}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowColorModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.colorSheet}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionTitle}>
                    {localize(lang, meditateCopy.selectTheme)}
                  </Text>
                  <TouchableOpacity onPress={() => setShowColorModal(false)}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.colorOption}
                      onPress={() => handleColorUpdate(option.colors as [string, string])}
                    >
                      <LinearGradient
                        colors={option.colors as [string, string]}
                        style={styles.colorCircle}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isVisible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={localize(lang, meditateCopy.deleteMeditation)}
        message={localize(lang, meditateCopy.deleteMeditationBody)}
        cancelText={localize(lang, meditateCopy.cancel)}
        confirmText={localize(lang, meditateCopy.delete)}
        onConfirm={handleDelete}
        confirmDestructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  categoriesContainer: {
    marginTop: 18,
    marginBottom: 18,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  guidanceCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 18,
    borderRadius: 22,
    borderWidth: 0.5,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
    marginBottom: 10,
  },
  guidanceAction: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
  },
  guidanceActionTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    marginBottom: 4,
  },
  guidanceActionBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  coreJourneyCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    padding: 18,
    borderRadius: 22,
    borderWidth: 0.5,
  },
  coreJourneyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  coreJourneyHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  coreJourneyEyebrow: {
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  coreJourneyTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  coreJourneyBody: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: "95%",
  },
  coreJourneyCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    alignSelf: "flex-start",
  },
  coreJourneyCountText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  coreJourneyChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  coreJourneyList: {
    marginTop: 14,
  },
  coreJourneyItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
  },
  coreJourneyStepBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  coreJourneyStepText: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: "#FFFFFF",
  },
  coreJourneyItemCopy: {
    flex: 1,
    paddingRight: 8,
  },
  coreJourneyItemTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    marginBottom: 4,
  },
  coreJourneyItemBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  coreJourneyMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  coreJourneyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coreJourneyMetaText: {
    fontSize: 11,
    fontWeight: "700" as const,
    marginLeft: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sessionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  sessionCard: {
    width: (width - 50) / 2,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  sessionCardLocked: {
    opacity: 0.92,
  },
  sessionCardLeft: {
    marginRight: 10,
  },
  sessionCardRight: {
    marginLeft: 0,
  },
  sessionCardGradient: {
    padding: 18,
    minHeight: 172,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlayText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "rgba(17,24,39,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: "hidden",
  },
  sessionCardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  sessionCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    flex: 1,
    marginRight: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  moreButton: {
    padding: 4,
    marginRight: -4,
    marginTop: -4,
  },
  sessionCardDescription: {
    fontSize: 12,
    color: "#E0E7FF",
    lineHeight: 17,
    marginBottom: 14,
  },
  vipChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.32)",
  },
  vipChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  lockHint: {
    fontSize: 11,
    color: "#FEF3C7",
    marginBottom: 10,
    lineHeight: 16,
  },
  sessionCardMeta: {
    marginTop: "auto",
  },
  sessionCardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sessionCardMetaText: {
    fontSize: 11,
    color: "#E0E7FF",
    marginLeft: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  colorSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionItemDestructive: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  actionTextDestructive: {
    color: '#EF4444',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircle: {
    flex: 1,
    borderRadius: 30,
  },
});
