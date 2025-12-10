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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Clock, MoreHorizontal, Trash2, Palette, X } from "lucide-react-native";
import { router } from "expo-router";
import { MEDITATION_SESSIONS, CATEGORIES } from "@/constants/meditations";
import { useSettings } from "@/providers/SettingsProvider";
import { useMeditation } from "@/providers/MeditationProvider";
import CustomModal from "@/components/CustomModal";

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
  const { customMeditations, deleteCustomMeditation, updateCustomMeditation } = useMeditation();
  const lang = settings.language;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Modal states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const customSessionsFormatted = customMeditations.map(m => ({
    id: m.id,
    title: m.title,
    description: m.script.substring(0, 50) + '...',
    duration: m.duration,
    narrator: lang === 'zh' ? 'AI 生成' : 'AI Generated',
    category: 'custom',
    gradient: m.gradient || ['#8B5CF6', '#6366F1'],
  }));

  const allSessions = [...customSessionsFormatted, ...MEDITATION_SESSIONS];

  const handleLongPress = (id: string) => {
    // Only allow editing custom sessions
    if (id.startsWith('custom-')) {
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

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient
        colors={currentTheme.gradient as [string, string]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <Text style={styles.title}>{lang === "zh" ? "冥想圖書館" : "Meditation Library"}</Text>
          
          <View style={[styles.searchContainer, { backgroundColor: currentTheme.surface }]}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={[styles.searchInput, { color: currentTheme.text }]}
              placeholder={lang === "zh" ? "搜尋冥想..." : "Search meditations..."}
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
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sessions Grid */}
        <View style={styles.sessionsGrid}>
          {filteredSessions.map((session, index) => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.sessionCard,
                index % 2 === 0 ? styles.sessionCardLeft : styles.sessionCardRight,
              ]}
              onPress={() => router.push(`/meditation/${session.id}`)}
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
                    <Text style={styles.sessionCardTitle} numberOfLines={2}>{session.title}</Text>
                    {session.id.startsWith('custom-') && (
                       <TouchableOpacity 
                         onPress={() => handleLongPress(session.id)}
                         style={styles.moreButton}
                       >
                         <MoreHorizontal size={16} color="rgba(255,255,255,0.7)" />
                       </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.sessionCardDescription} numberOfLines={2}>
                    {session.description}
                  </Text>
                  
                  <View style={styles.sessionCardMeta}>
                    <View style={styles.sessionCardMetaItem}>
                      <Clock size={14} color="#E0E7FF" />
                      <Text style={styles.sessionCardMetaText}>{session.duration} min</Text>
                    </View>

                  </View>
                </View>
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
                    {lang === 'zh' ? '管理冥想' : 'Manage Meditation'}
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
                    {lang === 'zh' ? '更換顏色' : 'Change Color'}
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
                    {lang === 'zh' ? '刪除冥想' : 'Delete Meditation'}
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
                    {lang === 'zh' ? '選擇顏色主題' : 'Select Theme'}
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
        title={lang === 'zh' ? '刪除冥想' : 'Delete Meditation'}
        message={lang === 'zh' ? '確定要刪除這個專屬冥想嗎？此操作無法撤銷。' : 'Are you sure you want to delete this meditation? This action cannot be undone.'}
        cancelText={lang === 'zh' ? '取消' : 'Cancel'}
        confirmText={lang === 'zh' ? '刪除' : 'Delete'}
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
    marginTop: 20,
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
  },
  sessionCardLeft: {
    marginRight: 10,
  },
  sessionCardRight: {
    marginLeft: 0,
  },
  sessionCardGradient: {
    padding: 16,
    minHeight: 160,
  },
  sessionCardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  sessionCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
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
    lineHeight: 18,
    marginBottom: 12,
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