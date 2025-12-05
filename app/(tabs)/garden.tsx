import React, { useRef, useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Platform, TextInput } from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMeditation, CHAKRA_COLORS } from "@/providers/MeditationProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useUser } from "@/providers/UserProvider";
import { Send, Plus, Zap, Star, Gift, RotateCcw, X } from "lucide-react-native";
import { MiniKit } from "@/constants/minikit";
import Modal from "react-native-modal";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { Gyroscope } from 'expo-sensors';
import { BlurView } from 'expo-blur';

// New Components
import { GardenScene } from "@/components/garden/GardenScene";

const DEV_WALLET = "0xf683cbce6d42918907df66040015fcbdad411d9d";
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function GardenScreen() {
  const { currentTheme, settings } = useSettings();
  const { currentOrb, sendOrb, orbHistory, updateOrbState, updateOrbHistory, mergeOrb } = useMeditation();
  const { walletAddress } = useUser();
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [interactionMode, setInteractionMode] = useState<'idle' | 'gather' | 'charge'>('idle');
  
  // Gyroscope data for parallax
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  
  useEffect(() => {
    Gyroscope.setUpdateInterval(16);
    const subscription = Gyroscope.addListener((data: { x: number, y: number, z: number }) => {
      setGyroData(data);
    });
    return () => subscription.remove();
  }, []);

  const handleDevAction = async (action: string) => {
    setShowDevMenu(false);
    
    switch (action) {
      case "add_10_min": {
          const mins = (currentOrb.accumulatedMinutes || 0) + 10;
          let status = currentOrb.status;
          if (mins >= 108) status = 'eternal';
          else if (mins >= 49) status = 'legendary';
          else if (mins >= 21) status = 'awakened';
          
          const newLayers = [...currentOrb.layers];
          if (newLayers.length < 7 && mins % 10 === 0) { // Rough check
              newLayers.push(CHAKRA_COLORS[newLayers.length % 7]);
          }

          const updated = { ...currentOrb, accumulatedMinutes: mins, status: status as any, layers: newLayers };
          await updateOrbState(updated);
          break;
      }
      case "instant_awakened": {
        const updatedOrb = {
          ...currentOrb,
          level: 3,
          accumulatedMinutes: 21,
          status: 'awakened' as const,
          layers: CHAKRA_COLORS.slice(0, 3),
          isAwakened: true,
        };
        await updateOrbState(updatedOrb);
        break;
      }
      case "instant_legendary": {
        const updatedOrb = {
          ...currentOrb,
          level: 5,
          accumulatedMinutes: 49,
          status: 'legendary' as const,
          layers: CHAKRA_COLORS.slice(0, 5),
          isAwakened: true,
        };
        await updateOrbState(updatedOrb);
        break;
      }
      case "instant_eternal": {
        const updatedOrb = {
          ...currentOrb,
          level: 7,
          accumulatedMinutes: 108,
          status: 'eternal' as const,
          layers: CHAKRA_COLORS,
          isAwakened: true,
        };
        await updateOrbState(updatedOrb);
        break;
      }
      case "send_self": {
        const mockOrb = {
          ...currentOrb,
          id: `orb-mock-${Date.now()}`,
          sender: "Me (Dev)",
          message: "From the void.",
          createdAt: new Date().toISOString(),
          accumulatedMinutes: 30,
          status: 'awakened' as const
        };
        await updateOrbHistory([mockOrb, ...orbHistory]);
        break;
      }
      case "reset": {
        const newOrb = {
          id: `orb-${Date.now()}`,
          level: 0,
          accumulatedMinutes: 0,
          status: 'seed' as const,
          layers: [],
          isAwakened: false,
          createdAt: new Date().toISOString(),
        };
        await updateOrbState(newOrb);
        break;
      }
    }
  };

  const handleSendOrb = async () => {
    if ((currentOrb.accumulatedMinutes || 0) < 21) {
      Alert.alert(
          settings.language === 'zh' ? "能量不足" : "Not Enough Energy", 
          settings.language === 'zh' ? "需積累 21 分鐘能量才能喚醒光球。" : "Need 21 minutes of accumulated energy to awaken the orb."
      );
      return;
    }
    setShowSendModal(true);
  };
  
  // Gesture for "Hold" (Long Press) to show Dev Menu or Gather Energy
  const longPressGesture = Gesture.LongPress()
    .minDuration(5000)
    .onStart(() => {
        if (walletAddress === DEV_WALLET) {
            runOnJS(setShowDevMenu)(true);
        }
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
         runOnJS(setInteractionMode)('gather');
    })
    .onFinalize(() => {
         runOnJS(setInteractionMode)('idle');
    });

  const composedGestures = Gesture.Simultaneous(longPressGesture, tapGesture);

  // Helper function to run on JS thread if needed (mimicking Reanimated behavior safely)
  // Since we removed Reanimated, we can just call setters directly in callbacks if not using worklets
  // But gesture handler callbacks might need care. Wrapper:
  function runOnJS(fn: any) {
      return (args: any) => fn(args);
  }

  const handleSendConfirm = async () => {
       setShowSendModal(false);
       if (MiniKit && MiniKit.isInstalled()) {
        try {
            // Real MiniKit logic would go here
            await MiniKit.commands.transferNft({
                collectionAddress: "0x1234567890123456789012345678901234567890", 
                tokenId: "1", 
                recipient: recipient || "0x000", 
            });
        } catch (e) {
            console.log("Minikit mocked");
        }
       }
       await sendOrb(recipient || "friend", "May light guide you.");
       Alert.alert("Sent!", "Your orb is on its way.");
       setRecipient("");
  };

  // Progress calculations
  const mins = currentOrb.accumulatedMinutes || 0;
  let nextMilestone = 21;
  let prevMilestone = 0;
  let statusLabel = "Seed";
  
  if (mins >= 108) {
      nextMilestone = 9999;
      prevMilestone = 108;
      statusLabel = "Eternal";
  } else if (mins >= 49) {
      nextMilestone = 108;
      prevMilestone = 49;
      statusLabel = "Legendary";
  } else if (mins >= 21) {
      nextMilestone = 49;
      prevMilestone = 21;
      statusLabel = "Awakened";
  }
  
  const progressPercent = Math.min(100, Math.max(0, ((mins - prevMilestone) / (nextMilestone - prevMilestone)) * 100));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: '#000' }]}>
          
          {/* Background Scene */}
          <View style={StyleSheet.absoluteFill}>
             <Canvas style={{ flex: 1 }}>
                 <GardenScene 
                    orb={currentOrb} 
                    collectedOrbs={orbHistory} 
                    gyro={gyroData}
                    interactionMode={interactionMode}
                    onMerge={mergeOrb}
                 />
             </Canvas>
          </View>

          {/* Overlay UI */}
          <GestureDetector gesture={composedGestures}>
             <View style={styles.touchLayer} />
          </GestureDetector>

          <View style={styles.header}>
            <BlurView intensity={20} style={styles.blurHeader}>
                <Text style={[styles.title, { color: '#FFF' }]}>
                {settings.language === 'zh' ? "光球花園" : "Light Orb Garden"}
                </Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                </View>
            </BlurView>
          </View>

          {/* Bottom Controls */}
          <View style={styles.footer}>
             <View style={styles.progressContainer}>
                 <Text style={styles.progressText}>
                    {mins} / {nextMilestone === 9999 ? "∞" : nextMilestone} min
                 </Text>
                 <View style={styles.progressBarBg}>
                     <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: CHAKRA_COLORS[currentOrb.level % 7] || '#FFF' }]} />
                 </View>
                 <Text style={styles.progressSub}>
                    {settings.language === 'zh' ? "距離下一階段" : "To next evolution"}
                 </Text>
             </View>
             
             <View style={styles.controls}>
                <TouchableOpacity style={styles.sendButton} onPress={handleSendOrb}>
                    <Send color="#000" size={24} />
                    <Text style={styles.sendButtonText}>
                        {settings.language === 'zh' ? "贈送" : "Gift"}
                    </Text>
                </TouchableOpacity>
             </View>
          </View>
          
          {/* Collection Scroll (Horizontal at bottom) */}
          <View style={styles.collectionContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionContent}>
                   {orbHistory.map((orb, i) => (
                       <TouchableOpacity key={i} style={styles.miniOrb}>
                           <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: orb.layers[orb.layers.length-1] || '#FFF', opacity: 0.8 }} />
                       </TouchableOpacity>
                   ))}
              </ScrollView>
          </View>

          {/* Dev Menu Modal */}
          <Modal isVisible={showDevMenu} onBackdropPress={() => setShowDevMenu(false)}>
            <View style={[styles.devMenu, { backgroundColor: currentTheme.surface }]}>
              <Text style={[styles.devTitle, { color: currentTheme.text }]}>Dev Access</Text>
              <ScrollView>
                <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('add_10_min')}>
                  <Plus size={20} color={currentTheme.text} />
                  <Text style={[styles.devOptionText, { color: currentTheme.text }]}>+10 Minutes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_awakened')}>
                  <Zap size={20} color="#F59E0B" />
                  <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Instant Awakened</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_legendary')}>
                  <Star size={20} color="#8B5CF6" />
                  <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Instant Legendary</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('instant_eternal')}>
                  <Star size={20} color="#EC4899" />
                  <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Instant Eternal</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('send_self')}>
                  <Gift size={20} color={currentTheme.text} />
                  <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Send Mock Orb to Me</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={styles.devOption} onPress={() => handleDevAction('reset')}>
                  <RotateCcw size={20} color={currentTheme.text} />
                  <Text style={[styles.devOptionText, { color: currentTheme.text }]}>Reset</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </Modal>

          {/* Send Modal */}
          <Modal isVisible={showSendModal} onBackdropPress={() => setShowSendModal(false)}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.surface }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
                        {settings.language === 'zh' ? "贈送光球" : "Send Orb"}
                    </Text>
                    <TouchableOpacity onPress={() => setShowSendModal(false)}>
                        <X color={currentTheme.text} size={24} />
                    </TouchableOpacity>
                </View>
                
                <Text style={[styles.modalSubtitle, { color: currentTheme.textSecondary }]}>
                    {settings.language === 'zh' ? "輸入朋友的 World ID 或名字" : "Enter friend's World ID or name"}
                </Text>

                <TextInput 
                    style={[styles.input, { color: currentTheme.text, borderColor: currentTheme.border }]}
                    placeholder="0x..."
                    placeholderTextColor={currentTheme.textSecondary}
                    value={recipient}
                    onChangeText={setRecipient}
                />

                <TouchableOpacity style={[styles.confirmButton, { backgroundColor: currentTheme.primary }]} onPress={handleSendConfirm}>
                    <Text style={styles.confirmButtonText}>
                        {settings.language === 'zh' ? "確認發送" : "Send Now"}
                    </Text>
                </TouchableOpacity>
            </View>
          </Modal>

        </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  touchLayer: {
      flex: 1,
      zIndex: 10, // Catch gestures
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurHeader: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(20,20,30,0.4)',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
  },
  statusText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
  },
  footer: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      right: 20,
      zIndex: 20,
      alignItems: 'center',
  },
  progressContainer: {
      width: '100%',
      marginBottom: 20,
      alignItems: 'center',
  },
  progressText: {
      color: '#FFF',
      fontSize: 14,
      marginBottom: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      opacity: 0.8,
  },
  progressBarBg: {
      width: '100%',
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 2,
  },
  progressBarFill: {
      height: '100%',
      borderRadius: 2,
  },
  progressSub: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 10,
      marginTop: 4,
  },
  controls: {
      flexDirection: 'row',
      gap: 20,
  },
  sendButton: {
      backgroundColor: '#FFF',
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      shadowColor: "#FFF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
  },
  sendButtonText: {
      color: '#000',
      fontSize: 16,
      fontWeight: 'bold',
  },
  collectionContainer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      height: 50,
      zIndex: 20,
  },
  collectionContent: {
      paddingHorizontal: 20,
      alignItems: 'center',
      gap: 10,
  },
  miniOrb: {
      padding: 5,
  },
  devMenu: {
      padding: 20,
      borderRadius: 16,
  },
  devTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
  },
  devOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#333',
  },
  devOptionText: {
      fontSize: 16,
  },
  modalContent: {
      padding: 24,
      borderRadius: 24,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
  },
  modalSubtitle: {
      fontSize: 14,
      marginBottom: 20,
  },
  input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      marginBottom: 24,
  },
  confirmButton: {
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
  },
  confirmButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
  },
});
