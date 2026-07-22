import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ScrollView, View } from 'react-native';
import { COLORS } from '../theme/theme';
import { GlassContainer } from './GlassContainer';

interface SystemSelectorProps {
  onSelectSystem: (systemName: string) => void;
}

const SYSTEMS_LIST = [
  { name: 'Respiratory', desc: 'Breathing, cough, congestion' },
  { name: 'Cardiovascular', desc: 'Heart rate, palpitations, chest pressure' },
  { name: 'Neurological', desc: 'Dizziness, headache, numbness' },
  { name: 'Digestive', desc: 'Stomach pain, nausea, vomiting' },
  { name: 'Musculoskeletal', desc: 'Joint soreness, muscle stiffness' },
  { name: 'General / Whole Body', desc: 'Fever, fatigue, generalized weakness' },
  { name: 'Eyes', desc: 'Vision shifts, irritation, eye pain' },
  { name: 'ENT', desc: 'Earache, sore throat, sinus issues' },
  { name: 'Mental Health', desc: 'Anxiety, mood changes, sleep quality' },
  { name: 'Urinary', desc: 'Irritation, frequency, output changes' },
  { name: 'Skin', desc: 'Rashes, swelling, dryness, hives' },
];

export const SystemSelector: React.FC<SystemSelectorProps> = ({
  onSelectSystem,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {SYSTEMS_LIST.map((sys) => (
          <TouchableOpacity
            key={sys.name}
            style={styles.cardWrapper}
            onPress={() => onSelectSystem(sys.name)}
            activeOpacity={0.7}
          >
            <GlassContainer style={styles.cardInner} intensity={30}>
              <Text style={styles.titleText}>{sys.name}</Text>
              <Text style={styles.descText}>{sys.desc}</Text>
            </GlassContainer>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 2,
  },
  cardInner: {
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleText: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  descText: {
    color: COLORS.textSecondary,
    fontSize: 8.5,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 11,
  },
});
