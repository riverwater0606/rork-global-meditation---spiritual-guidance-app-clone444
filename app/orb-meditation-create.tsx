import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Wand2, Clock, Sparkles } from 'lucide-react-native';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useMeditation, CHAKRA_COLORS } from '@/providers/MeditationProvider';
import { useSettings } from '@/providers/SettingsProvider';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

const RotatingOrb = ({ layers, rotationSpeed, shape }: { layers: string[], rotationSpeed: number, shape: string }) => {
  const pointsRef = React.useRef<THREE.Points>(null!);
  
  const { positions, colors } = React.useMemo(() => {
    const particleCount = 10000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorObjects = layers.length > 0 
      ? layers.map(c => new THREE.Color(c)) 
      : [new THREE.Color("#8B5CF6")];
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.0 + Math.random() * 0.2;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      const layerIndex = Math.floor(Math.random() * colorObjects.length);
      const c = colorObjects[layerIndex];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    
    return { positions, colors };
  }, [layers]);
  
  React.useEffect(() => {
    let animationId: number;
    const animate = () => {
      if (pointsRef.current) {
        pointsRef.current.rotation.y += 0.001 + (rotationSpeed / 100) * 0.05;
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [rotationSpeed]);
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};

export default function OrbMeditationCreate() {
  const { currentOrb, addCustomMeditation } = useMeditation();
  const { currentTheme, settings } = useSettings();
  const router = useRouter();
  
  const [theme, setTheme] = useState('');
  const [duration, setDuration] = useState(15);
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScript, setShowScript] = useState(false);
  
  const rotationSpeed = currentOrb.rotationSpeed || 50;
  const orbShape = currentOrb.shape || 'default';
  
  const generateScript = async () => {
    if (!theme.trim()) {
      Alert.alert(
        settings.language === 'zh' ? '請輸入主題' : 'Enter Theme',
        settings.language === 'zh' ? '請輸入冥想主題' : 'Please enter a meditation theme'
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    
    try {
      const orbType = currentOrb.isAwakened ? 'Awakened' : `Level ${currentOrb.level}`;
      const shapeText = orbShape === 'default' ? 'Sphere' : orbShape.replace('-', ' ');
      
      const prompt = `Create a ${duration}-minute guided meditation script in ${settings.language === 'zh' ? 'Traditional Chinese' : 'English'}.
      
Theme: ${theme}
Orb Type: ${orbType} ${shapeText}
Orb Colors: ${currentOrb.layers.length > 0 ? currentOrb.layers.join(', ') : 'Purple light'}

Structure:
1. Opening (1 min): Welcome and intention setting
2. Breathwork (2 min): Deep breathing to center
3. Visualization (${duration - 5} min): Journey with the orb, focusing on ${theme}
4. Integration (1 min): Bringing insights back
5. Closing (1 min): Gratitude and gentle return

Make it poetic, mystical, and deeply personal. Reference the orb's colors and shape. Use sensory language.`;

      setTimeout(() => {
        const mockScript = settings.language === 'zh' 
          ? `【開始】\n歡迎來到這次專屬於你的光球冥想。\n\n【呼吸】\n深呼吸，讓${currentOrb.layers[0] ? '紅色能量' : '紫色光芒'}進入你的身體...\n\n【旅程】\n想像你的光球在面前緩慢旋轉，它承載著關於「${theme}」的智慧...\n\n【整合】\n將這份能量帶回你的心中。\n\n【結束】\n感謝你的光球，感謝這次旅程。` 
          : `[Opening]\nWelcome to your personal orb meditation.\n\n[Breathwork]\nBreathe deeply, allowing ${currentOrb.layers[0] ? 'red energy' : 'purple light'} to fill you...\n\n[Journey]\nVisualize your orb rotating before you, carrying wisdom about "${theme}"...\n\n[Integration]\nBring this energy into your heart.\n\n[Closing]\nThank your orb for this journey.`;
        
        setScript(mockScript);
        setShowScript(true);
        setIsGenerating(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
      
    } catch (error) {
      console.error('Error generating script:', error);
      setIsGenerating(false);
      Alert.alert(
        settings.language === 'zh' ? '生成失敗' : 'Generation Failed',
        settings.language === 'zh' ? '請稍後再試' : 'Please try again later'
      );
    }
  };
  
  const startMeditation = async () => {
    if (!script) return;
    
    try {
      await addCustomMeditation({
        title: theme || (settings.language === 'zh' ? '光球冥想' : 'Orb Meditation'),
        script,
        duration,
        language: settings.language as 'en' | 'zh'
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      router.push('/guided-session');
    } catch (error) {
      console.error('Error starting meditation:', error);
      Alert.alert(
        settings.language === 'zh' ? '錯誤' : 'Error',
        settings.language === 'zh' ? '無法開始冥想' : 'Cannot start meditation'
      );
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTransparent: true,
          headerTitle: settings.language === 'zh' ? '創建光球冥想' : 'Create Orb Meditation',
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: 'transparent' }
        }} 
      />
      
      <LinearGradient
        colors={currentTheme.gradient as any}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!showScript ? (
            <>
              <View style={styles.orbContainer}>
                <Canvas camera={{ position: [0, 0, 4] }}>
                  <ambientLight intensity={0.6} />
                  <pointLight position={[5, 5, 5]} />
                  <RotatingOrb 
                    layers={currentOrb.layers.length > 0 ? currentOrb.layers : ['#8B5CF6']} 
                    rotationSpeed={rotationSpeed}
                    shape={orbShape}
                  />
                </Canvas>
              </View>
              
              <View style={[styles.formContainer, { backgroundColor: currentTheme.surface }]}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: currentTheme.text }]}>
                    <Wand2 size={16} color={currentTheme.primary} />
                    {' '}{settings.language === 'zh' ? '冥想主題' : 'Meditation Theme'}
                  </Text>
                  <TextInput
                    style={[styles.input, { 
                      color: currentTheme.text,
                      borderColor: currentTheme.primary,
                      backgroundColor: `${currentTheme.primary}10`
                    }]}
                    placeholder={settings.language === 'zh' ? '例如：世界和平、財富顯化、星際旅程' : 'e.g., World Peace, Abundance, Cosmic Journey'}
                    placeholderTextColor={currentTheme.textSecondary}
                    value={theme}
                    onChangeText={setTheme}
                    multiline
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: currentTheme.text }]}>
                    <Clock size={16} color={currentTheme.primary} />
                    {' '}{settings.language === 'zh' ? '時長' : 'Duration'}: {duration} {settings.language === 'zh' ? '分鐘' : 'min'}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={60}
                    step={5}
                    value={duration}
                    onValueChange={setDuration}
                    minimumTrackTintColor={currentTheme.primary}
                    maximumTrackTintColor={`${currentTheme.primary}30`}
                    thumbTintColor={currentTheme.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={[styles.sliderLabel, { color: currentTheme.textSecondary }]}>5{settings.language === 'zh' ? '分' : 'min'}</Text>
                    <Text style={[styles.sliderLabel, { color: currentTheme.textSecondary }]}>60{settings.language === 'zh' ? '分' : 'min'}</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.generateButton, { backgroundColor: currentTheme.primary }]}
                  onPress={generateScript}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Sparkles size={20} color="#fff" />
                      <Text style={styles.generateButtonText}>
                        {settings.language === 'zh' ? '生成引導詞' : 'Generate Script'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.orbContainerSmall}>
                <Canvas camera={{ position: [0, 0, 4] }}>
                  <ambientLight intensity={0.6} />
                  <pointLight position={[5, 5, 5]} />
                  <RotatingOrb 
                    layers={currentOrb.layers.length > 0 ? currentOrb.layers : ['#8B5CF6']} 
                    rotationSpeed={rotationSpeed}
                    shape={orbShape}
                  />
                </Canvas>
              </View>
              
              <View style={[styles.scriptContainer, { backgroundColor: currentTheme.surface }]}>
                <Text style={[styles.scriptTitle, { color: currentTheme.primary }]}>
                  {settings.language === 'zh' ? '引導詞' : 'Guided Script'}
                </Text>
                <ScrollView style={styles.scriptScroll}>
                  <Text style={[styles.scriptText, { color: currentTheme.text }]}>
                    {script}
                  </Text>
                </ScrollView>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: currentTheme.primary }]}
                    onPress={() => setShowScript(false)}
                  >
                    <Text style={[styles.secondaryButtonText, { color: currentTheme.primary }]}>
                      {settings.language === 'zh' ? '重新生成' : 'Regenerate'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: currentTheme.primary }]}
                    onPress={startMeditation}
                  >
                    <Text style={styles.startButtonText}>
                      {settings.language === 'zh' ? '開始冥想' : 'Start Meditation'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  orbContainer: {
    height: 300,
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  orbContainerSmall: {
    height: 200,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  sliderLabel: {
    fontSize: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scriptContainer: {
    borderRadius: 24,
    padding: 24,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scriptTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  scriptScroll: {
    flex: 1,
    marginBottom: 20,
    maxHeight: 300,
  },
  scriptText: {
    fontSize: 15,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  startButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
