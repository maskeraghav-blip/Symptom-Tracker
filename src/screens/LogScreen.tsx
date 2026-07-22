import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useHealth } from '../state/HealthContext';
import { BODY_REGIONS } from '../data/bodyParts';
import { getInterviewNode } from '../data/medicalKnowledge';
import { COLORS } from '../theme/theme';
import { BodySilhouette } from '../components/BodySilhouette';
import { GlassContainer } from '../components/GlassContainer';

// Import newly refactored standalone items
import { HealthHeader } from '../components/HealthHeader';
import { EntryModeSelector } from '../components/EntryModeSelector';
import { BodyControls } from '../components/BodyControls';
import { SystemSelector } from '../components/SystemSelector';
import { QuestionPanel } from '../components/QuestionPanel';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LogScreen: React.FC = () => {
  const {
    currentCheckIn,
    startCheckIn,
    updateCheckIn,
    cancelCheckIn,
    completeCheckIn,
    triggerHaptic,
    setVitalsOpen,
  } = useHealth();

  // Multi-select alert screen local states
  const [showMultiSelectPrompt, setShowMultiSelectPrompt] = useState(false);
  const [pendingRegions, setPendingRegions] = useState<string[]>([]);
  const [customMedName, setCustomMedName] = useState('');
  const [activeTab, setActiveTab] = useState<'body' | 'system'>('body');

  // Externalized Body Controls values
  const [isFront, setIsFront] = useState(true);
  const [manualZoom, setManualZoom] = useState(1.0);
  const [showHint, setShowHint] = useState(true);

  // Fade out interaction hint once user interacts
  const handleInteraction = () => {
    if (showHint) {
      setShowHint(false);
    }
  };

  const handleIsFrontChange = (val: boolean) => {
    triggerHaptic('light');
    setIsFront(val);
    handleInteraction();
  };

  const handleManualZoomChange = (zoom: number) => {
    setManualZoom(zoom);
    handleInteraction();
  };

  const symptomData = currentCheckIn
    ? getInterviewNode(
        currentCheckIn.regions[0],
        currentCheckIn.subRegions[0],
        currentCheckIn.symptom,
        currentCheckIn
      ).symptomData
    : {
        descriptors: [] as string[],
        associated: [] as string[],
        triggers: [] as string[],
        relievers: [] as string[],
        otc: [] as string[],
        followUps: [] as string[]
      };

  // Select body regions
  const handleSelectRegion = (regionId: string) => {
    triggerHaptic('light');
    handleInteraction();
    startCheckIn([regionId]);
  };

  // Drag multi-select body regions
  const handleSelectMultiple = (regions: string[]) => {
    triggerHaptic('medium');
    handleInteraction();
    setPendingRegions(regions);
    setShowMultiSelectPrompt(true);
  };

  const handleDescribeTogether = () => {
    setShowMultiSelectPrompt(false);
    startCheckIn(pendingRegions);
  };

  const handleDescribeSeparately = () => {
    setShowMultiSelectPrompt(false);
    startCheckIn([pendingRegions[0]]);
  };

  // Systems selector
  const handleSelectSystem = (systemName: string) => {
    triggerHaptic('medium');
    startCheckIn([], systemName);
  };

  const handleWorseTriggerClick = (trigger: string) => {
    triggerHaptic('light');
    if (!currentCheckIn) return;
    const list = currentCheckIn.worseTriggers || [];
    const updated = list.includes(trigger)
      ? list.filter((t: string) => t !== trigger)
      : [...list, trigger];
    updateCheckIn({ worseTriggers: updated });
  };

  const handleBetterTriggerClick = (reliever: string) => {
    triggerHaptic('light');
    if (!currentCheckIn) return;
    const list = currentCheckIn.betterTriggers || [];
    const updated = list.includes(reliever)
      ? list.filter((r: string) => r !== reliever)
      : [...list, reliever];
    updateCheckIn({ betterTriggers: updated });
  };

  const handleMedicationStatusChange = (status: boolean) => {
    triggerHaptic('light');
    if (!currentCheckIn) return;
    updateCheckIn({
      takenMedication: status,
      medicationName: undefined,
      medicationEffect: undefined,
    });
  };

  const handleMedNameChange = (name: string) => {
    if (!currentCheckIn) return;
    updateCheckIn({ medicationName: name });
  };

  const handleMedEffectChange = (effect: any) => {
    triggerHaptic('light');
    if (!currentCheckIn) return;
    updateCheckIn({ medicationEffect: effect });
  };

  // Progressive flow questions builder
  const getCurrentQuestionTitleAndOptions = () => {
    if (!currentCheckIn) return { title: '', options: [] };
    const node = getInterviewNode(
      currentCheckIn.regions[0],
      currentCheckIn.subRegions[0],
      currentCheckIn.symptom,
      currentCheckIn
    );
    return {
      title: node.title,
      options: node.options,
    };
  };

  const handleNextStep = () => {
    if (!currentCheckIn) return;
    const { step } = currentCheckIn;
    triggerHaptic('medium');

    if (step === 9) {
      completeCheckIn();
    } else {
      updateCheckIn({ step: step + 1 });
    }
  };

  const handlePrevStep = () => {
    if (!currentCheckIn) return;
    const { step } = currentCheckIn;
    triggerHaptic('light');

    if (step === 1 || (step === 2 && currentCheckIn.bodySystem)) {
      cancelCheckIn();
    } else {
      updateCheckIn({ step: step - 1 });
    }
  };

  const handleOptionSelect = (option: string) => {
    if (!currentCheckIn) return;
    const { step } = currentCheckIn;

    switch (step) {
      case 1:
        const isAdded = currentCheckIn.subRegions.includes(option);
        const subRegions = isAdded
          ? currentCheckIn.subRegions.filter((sr: string) => sr !== option)
          : [...currentCheckIn.subRegions, option];
        updateCheckIn({ subRegions });
        break;
      case 2:
        updateCheckIn({ symptom: option });
        updateCheckIn({ step: step + 1 });
        break;
      case 3:
        updateCheckIn({ descriptor: option });
        updateCheckIn({ step: step + 1 });
        break;
      case 4:
        updateCheckIn({ severity: parseInt(option) });
        updateCheckIn({ step: step + 1 });
        break;
      case 5:
        updateCheckIn({ began: option });
        updateCheckIn({ step: step + 1 });
        break;
      case 6:
        updateCheckIn({ frequency: option });
        updateCheckIn({ step: step + 1 });
        break;
      case 9:
        const currentAssoc = currentCheckIn.associatedSymptoms || [];
        const exists = currentAssoc.includes(option);
        const updatedAssoc = exists
          ? currentAssoc.filter((a: string) => a !== option)
          : [...currentAssoc, option];
        updateCheckIn({ associatedSymptoms: updatedAssoc });
        break;
    }
  };

  const { title, options } = getCurrentQuestionTitleAndOptions();

  return (
    <View style={styles.container}>
      {/* LANDING SCREEN COMPONENT STACK (Header + Mode Selector + Swappable Canvas) */}
      {!currentCheckIn && (
        <View style={styles.mainWrapper}>
          <HealthHeader
            onLogVitalsPress={() => setVitalsOpen(true)}
            showVitalsBtn={true}
          />
          <EntryModeSelector
            activeMode={activeTab}
            onModeChange={(mode) => {
              triggerHaptic('light');
              setActiveTab(mode);
            }}
          />

          <View style={styles.canvasContainer}>
            {activeTab === 'body' ? (
              <Animated.View
                key="body-panel"
                entering={FadeIn.duration(280)}
                exiting={FadeOut.duration(220)}
                style={styles.canvasWrapper}
              >
                <View style={styles.bodyWrap}>
                  <BodySilhouette
                    selectedRegions={[]}
                    onSelectRegion={handleSelectRegion}
                    onSelectMultiple={handleSelectMultiple}
                    zoomEnabled={false}
                    isFront={isFront}
                    onIsFrontChange={handleIsFrontChange}
                    manualZoom={manualZoom}
                    onManualZoomChange={handleManualZoomChange}
                    hideInternalControls={true}
                  />
                </View>
                <BodyControls
                  isFront={isFront}
                  onIsFrontChange={handleIsFrontChange}
                  manualZoom={manualZoom}
                  onManualZoomChange={handleManualZoomChange}
                  showHint={showHint}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="system-panel"
                entering={FadeIn.duration(280)}
                exiting={FadeOut.duration(220)}
                style={styles.canvasWrapper}
              >
                <SystemSelector onSelectSystem={handleSelectSystem} />
              </Animated.View>
            )}
          </View>

          {/* Reserved Spacer for Custom Glass Bottom Tab Bar */}
          <View style={styles.tabSpacing} />
        </View>
      )}

      {/* ACTIVE CHECK-IN FLOW COMPONENT STACK */}
      {currentCheckIn && (
        <View style={styles.mainWrapper}>
          {/* Active Canvas Header Focus Block */}
          {currentCheckIn.bodySystem ? (
            <View style={styles.systemBgContainer}>
              <GlassContainer style={styles.systemBgCard} intensity={20}>
                <Text style={styles.systemBgTitle}>{currentCheckIn.bodySystem}</Text>
                <Text style={styles.systemBgSubtitle}>Systemic Symptom Track</Text>
              </GlassContainer>
            </View>
          ) : (
            <View style={styles.activeCheckInBodyWrapper}>
              <BodySilhouette
                selectedRegions={currentCheckIn.regions || []}
                onSelectRegion={() => {}}
                zoomEnabled={true}
                hideInternalControls={true}
              />
            </View>
          )}

          {/* Setup progressive question panel overlay */}
          <QuestionPanel
            currentCheckIn={currentCheckIn}
            title={title}
            options={options}
            symptomData={symptomData}
            customMedName={customMedName}
            onCustomMedNameChange={(text) => {
              setCustomMedName(text);
              updateCheckIn({ medicationName: text });
            }}
            onOptionSelect={handleOptionSelect}
            onWorseTriggerClick={handleWorseTriggerClick}
            onBetterTriggerClick={handleBetterTriggerClick}
            onMedicationStatusChange={handleMedicationStatusChange}
            onMedNameChange={handleMedNameChange}
            onMedEffectChange={handleMedEffectChange}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onDiscard={cancelCheckIn}
            onEventDateTimeChange={(date) => {
              updateCheckIn({ eventDateTime: date });
            }}
          />
        </View>
      )}

      {/* 3. Adjacent multiselect confirmation overlay */}
      {showMultiSelectPrompt && (
        <View style={styles.modalBackdrop}>
          <GlassContainer style={styles.modalCard} intensity={80}>
            <Text style={styles.modalTitle}>Describe Adjacent Regions</Text>
            <Text style={styles.modalDesc}>
              You selected multiple connected body regions. Would you like to log symptoms for them together, or separately?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleDescribeTogether}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnText}>Log Together</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={handleDescribeSeparately}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </GlassContainer>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  canvasContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  canvasWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSpacing: {
    height: Platform.OS === 'web' ? 84 : 96,
  },
  activeCheckInBodyWrapper: {
    height: SCREEN_HEIGHT * 0.4,
    width: '100%',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemBgContainer: {
    height: SCREEN_HEIGHT * 0.38,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
  },
  systemBgCard: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  systemBgEmoji: {
    fontSize: 54,
    marginBottom: 12,
    textShadowColor: 'rgba(37, 99, 235, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  systemBgTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  systemBgSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 300,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 10,
  },
  modalBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9, 30, 66, 0.04)',
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBtnSecondaryText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
});

export default LogScreen;
