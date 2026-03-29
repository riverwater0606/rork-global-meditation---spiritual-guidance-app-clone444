import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Orb } from '@/providers/MeditationProvider';
import { Sparkles } from 'lucide-react-native';

interface OrbPreviewProps {
  orb: Orb;
  size?: number;
  showInfo?: boolean;
  onPress?: () => void;
  theme: any;
  language: 'en' | 'zh';
}

export const OrbPreview: React.FC<OrbPreviewProps> = ({
  orb,
  size = 120,
  showInfo = true,
  onPress,
  theme,
  language,
}) => {
  const isEmpty = orb.layers.length === 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.orbContainer, { width: size, height: size }]}>
        {isEmpty ? (
          <View
            style={[
              styles.emptyOrb,
              {
                width: size * 0.4,
                height: size * 0.4,
                backgroundColor: 'rgba(200, 200, 200, 0.3)',
                borderColor: theme.textSecondary,
              },
            ]}
          />
        ) : (
          <>
            {orb.layers.map((color, i) => {
              const layerSize = (size * 0.3) + (i * (size * 0.08));
              return (
                <View
                  key={i}
                  style={[
                    styles.orbLayer,
                    {
                      backgroundColor: color,
                      width: layerSize,
                      height: layerSize,
                      opacity: 0.7 + (i * 0.03),
                    },
                  ]}
                />
              );
            })}
          </>
        )}
        
        {orb.isAwakened && (
          <View style={styles.awakenedBadge}>
            <Sparkles size={16} color="#FFD700" />
          </View>
        )}
      </View>

      {showInfo && (
        <View style={styles.infoContainer}>
          <Text style={[styles.layerCount, { color: theme.text }]}>
            {orb.layers.length}/7 {language === 'zh' ? '層' : 'Layers'}
          </Text>
          <Text style={[styles.status, { color: theme.textSecondary }]}>
            {orb.isAwakened
              ? language === 'zh' ? '已覺醒' : 'Awakened'
              : language === 'zh' ? '成長中' : 'Growing'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbLayer: {
    position: 'absolute',
    borderRadius: 999,
  },
  emptyOrb: {
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  awakenedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  infoContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  layerCount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
});
