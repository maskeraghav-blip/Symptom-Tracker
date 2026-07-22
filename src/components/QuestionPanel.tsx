import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInDown, FadeInDown } from 'react-native-reanimated';
import { GlassContainer } from './GlassContainer';
import { COLORS } from '../theme/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuestionPanelProps {
  currentCheckIn: any;
  title: string;
  options: string[];
  symptomData: any;
  customMedName: string;
  onCustomMedNameChange: (name: string) => void;
  onOptionSelect: (option: string) => void;
  onWorseTriggerClick: (trigger: string) => void;
  onBetterTriggerClick: (reliever: string) => void;
  onMedicationStatusChange: (taken: boolean) => void;
  onMedNameChange: (name: string) => void;
  onMedEffectChange: (effect: any) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onDiscard: () => void;
  onEventDateTimeChange: (date: Date) => void;
}

const formatDate = (d: Date | string | undefined) => {
  if (!d) return 'Today';
  const date = new Date(d);
  const now = new Date();
  
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, now)) return 'Today';
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (d: Date | string | undefined) => {
  if (!d) return '12:00 PM';
  const date = new Date(d);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDateForInput = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeForInput = (d: Date) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const webInputStyle = {
  position: 'absolute' as const,
  opacity: 0,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  cursor: 'pointer',
};

export const QuestionPanel: React.FC<QuestionPanelProps> = ({
  currentCheckIn,
  title,
  options,
  symptomData,
  customMedName,
  onCustomMedNameChange,
  onOptionSelect,
  onWorseTriggerClick,
  onBetterTriggerClick,
  onMedicationStatusChange,
  onMedNameChange,
  onMedEffectChange,
  onNextStep,
  onPrevStep,
  onDiscard,
  onEventDateTimeChange,
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [isDateHovered, setIsDateHovered] = React.useState(false);
  const [isTimeHovered, setIsTimeHovered] = React.useState(false);
  const [customInputText, setCustomInputText] = React.useState('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customInputType, setCustomInputType] = React.useState('');

  const handleAddCustomOption = (val: string) => {
    if (customInputType === 'subregion') {
      if (!currentCheckIn.subRegions.includes(val)) {
        onOptionSelect(val);
      }
    } else if (customInputType === 'symptom') {
      onOptionSelect(val);
    } else if (customInputType === 'descriptor') {
      onOptionSelect(val);
    } else if (customInputType === 'began') {
      onOptionSelect(val);
    } else if (customInputType === 'frequency') {
      onOptionSelect(val);
    } else if (customInputType === 'trigger') {
      onWorseTriggerClick(val);
    } else if (customInputType === 'reliever') {
      onBetterTriggerClick(val);
    } else if (customInputType === 'associated') {
      if (!currentCheckIn.associatedSymptoms?.includes(val)) {
        onOptionSelect(val);
      }
    }
  };

  const getSeverityInfo = (val: number) => {
    if (val <= 3) return { label: 'Mild', color: COLORS.severity.low };
    if (val <= 6) return { label: 'Moderate', color: COLORS.severity.medium };
    return { label: 'Severe', color: COLORS.severity.high };
  };

  const currentStep = currentCheckIn.step;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20).stiffness(90)}
      style={styles.cardContainer}
    >
      <GlassContainer style={styles.questionCard} intensity={70}>
        {/* Header containing progress indicator */}
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={onPrevStep} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>✕ Back</Text>
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(currentStep / 9) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{currentStep} of 9</Text>
          </View>
        </View>

        {/* Dynamic Question Title */}
        <Text style={styles.questionTitle}>{title}</Text>

        {/* Retroactive Date & Time Entry */}
        <View style={styles.retroactiveContainer}>
          <Text style={styles.retroactiveLabel}>When did this happen?</Text>
          <View style={styles.pickerRow}>
            {/* Date Pick Pill */}
            <TouchableOpacity 
              style={[
                styles.pickerChip,
                isDateHovered && styles.pickerChipHovered
              ]} 
              activeOpacity={0.7} 
              {...({
                onMouseEnter: () => setIsDateHovered(true),
                onMouseLeave: () => setIsDateHovered(false)
              } as any)}
              onPress={(e) => {
                if (Platform.OS !== 'web') {
                  setShowDatePicker(true);
                } else {
                  try {
                    const input = (e.currentTarget as any).querySelector('input');
                    if (input) {
                      if (typeof input.showPicker === 'function') {
                        input.showPicker();
                      } else {
                        input.click();
                      }
                    }
                  } catch (err) {
                    console.log('web date picker error:', err);
                  }
                }
              }}
            >
              <Text style={styles.pickerChipText}>📅 {formatDate(currentCheckIn.eventDateTime)}</Text>
              {Platform.OS === 'web' && (
                <input
                  type="date"
                  max={formatDateForInput(new Date())}
                  value={formatDateForInput(new Date(currentCheckIn.eventDateTime || new Date()))}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected) {
                      const newDate = new Date(currentCheckIn.eventDateTime || new Date());
                      const [yr, mo, dy] = selected.split('-').map(Number);
                      newDate.setFullYear(yr, mo - 1, dy);
                      if (newDate <= new Date()) {
                        onEventDateTimeChange(newDate);
                      }
                    }
                  }}
                  style={webInputStyle}
                />
              )}
            </TouchableOpacity>

            {/* Time Pick Pill */}
            <TouchableOpacity 
              style={[
                styles.pickerChip,
                isTimeHovered && styles.pickerChipHovered
              ]} 
              activeOpacity={0.7} 
              {...({
                onMouseEnter: () => setIsTimeHovered(true),
                onMouseLeave: () => setIsTimeHovered(false)
              } as any)}
              onPress={(e) => {
                if (Platform.OS !== 'web') {
                  setShowTimePicker(true);
                } else {
                  try {
                    const input = (e.currentTarget as any).querySelector('input');
                    if (input) {
                      if (typeof input.showPicker === 'function') {
                        input.showPicker();
                      } else {
                        input.click();
                      }
                    }
                  } catch (err) {
                    console.log('web time picker error:', err);
                  }
                }
              }}
            >
              <Text style={styles.pickerChipText}>🕒 {formatTime(currentCheckIn.eventDateTime)}</Text>
              {Platform.OS === 'web' && (
                <input
                  type="time"
                  value={formatTimeForInput(new Date(currentCheckIn.eventDateTime || new Date()))}
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected) {
                      const newDate = new Date(currentCheckIn.eventDateTime || new Date());
                      const [hr, min] = selected.split(':').map(Number);
                      newDate.setHours(hr, min, 0, 0);
                      if (newDate <= new Date()) {
                        onEventDateTimeChange(newDate);
                      }
                    }
                  }}
                  style={webInputStyle}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Native picker modals for Android/iOS */}
        {Platform.OS !== 'web' && showDatePicker && (
          <DateTimePicker
            value={new Date(currentCheckIn.eventDateTime || new Date())}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const current = new Date(currentCheckIn.eventDateTime || new Date());
                selectedDate.setHours(current.getHours(), current.getMinutes(), 0, 0);
                if (selectedDate <= new Date()) {
                  onEventDateTimeChange(selectedDate);
                }
              }
            }}
          />
        )}

        {Platform.OS !== 'web' && showTimePicker && (
          <DateTimePicker
            value={new Date(currentCheckIn.eventDateTime || new Date())}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                const current = new Date(currentCheckIn.eventDateTime || new Date());
                current.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                if (current <= new Date()) {
                  onEventDateTimeChange(current);
                }
              }
            }}
          />
        )}

        {/* Content list */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* STEP 1: Subregion details */}
          {currentStep === 1 && (
            <View style={styles.chipGrid}>
              {(() => {
                const subregionsList = [...options, ...currentCheckIn.subRegions.filter((x: string) => !options.includes(x))];
                return subregionsList.map((option) => {
                  const isSelected = currentCheckIn.subRegions?.includes(option);
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => onOptionSelect(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
              <TouchableOpacity
                style={styles.chipCustom}
                onPress={() => {
                  setCustomInputType('subregion');
                  setCustomInputText('');
                  setShowCustomInput(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.chipCustomText}>+ Other Region...</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Symptoms selection */}
          {currentStep === 2 && (
            <View style={styles.chipGrid}>
              {(() => {
                const symptomsList = [...options, ...(currentCheckIn.symptom && !options.includes(currentCheckIn.symptom) ? [currentCheckIn.symptom] : [])];
                return symptomsList.map((option) => {
                  const isSelected = currentCheckIn.symptom === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => onOptionSelect(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
              <TouchableOpacity
                style={styles.chipCustom}
                onPress={() => {
                  setCustomInputType('symptom');
                  setCustomInputText('');
                  setShowCustomInput(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.chipCustomText}>+ Other Symptom...</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Descriptor classification */}
          {currentStep === 3 && (
            <View style={styles.chipGrid}>
              {(() => {
                const descriptorsList = [...options, ...(currentCheckIn.descriptor && !options.includes(currentCheckIn.descriptor) ? [currentCheckIn.descriptor] : [])];
                return descriptorsList.map((option) => {
                  const isSelected = currentCheckIn.descriptor === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => onOptionSelect(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
              <TouchableOpacity
                style={styles.chipCustom}
                onPress={() => {
                  setCustomInputType('descriptor');
                  setCustomInputText('');
                  setShowCustomInput(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.chipCustomText}>+ Other Descriptor...</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Severity score (0-10) */}
          {currentStep === 4 && (
            <View style={styles.severityWrapper}>
              <View style={styles.severityIndicator}>
                <Text
                  style={[
                    styles.severityNum,
                    { color: getSeverityInfo(currentCheckIn.severity || 0).color },
                  ]}
                >
                  {currentCheckIn.severity ?? 0}
                </Text>
                <Text style={styles.severityLabel}>
                  {getSeverityInfo(currentCheckIn.severity || 0).label}
                </Text>
              </View>

              <View style={styles.severityScale}>
                {options.map((numStr) => {
                  const num = parseInt(numStr);
                  const isSelected = currentCheckIn.severity === num;
                  const activeColor = getSeverityInfo(num).color;
                  return (
                    <TouchableOpacity
                      key={numStr}
                      style={[
                        styles.severityBubble,
                        isSelected && {
                          backgroundColor: activeColor,
                          borderColor: activeColor,
                          transform: [{ scale: 1.25 }],
                        },
                      ]}
                      onPress={() => onOptionSelect(numStr)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.severityBubbleText,
                          isSelected && styles.severityBubbleTextActive,
                        ]}
                      >
                        {numStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 5: Onset timeline */}
          {currentStep === 5 && (
            <View style={styles.checkCardGrid}>
              {(() => {
                const onsetList = [...options, ...(currentCheckIn.began && !options.includes(currentCheckIn.began) ? [currentCheckIn.began] : [])];
                return onsetList.map((option) => {
                  const isSelected = currentCheckIn.began === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.checkCard, isSelected && styles.checkCardActive]}
                      onPress={() => onOptionSelect(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.checkCardText, isSelected && styles.checkCardTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
              <TouchableOpacity
                style={[styles.checkCard, { borderStyle: 'dashed', borderWidth: 1 }]}
                onPress={() => {
                  setCustomInputType('began');
                  setCustomInputText('');
                  setShowCustomInput(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.checkCardText, { color: COLORS.textMuted }]}>
                  + Other Onset...
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6: Frequency interval */}
          {currentStep === 6 && (
            <View style={styles.checkCardGrid}>
              {(() => {
                const frequencyList = [...options, ...(currentCheckIn.frequency && !options.includes(currentCheckIn.frequency) ? [currentCheckIn.frequency] : [])];
                return frequencyList.map((option) => {
                  const isSelected = currentCheckIn.frequency === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.checkCard, isSelected && styles.checkCardActive]}
                      onPress={() => onOptionSelect(option)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.checkCardText, isSelected && styles.checkCardTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
              <TouchableOpacity
                style={[styles.checkCard, { borderStyle: 'dashed', borderWidth: 1 }]}
                onPress={() => {
                  setCustomInputType('frequency');
                  setCustomInputText('');
                  setShowCustomInput(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.checkCardText, { color: COLORS.textMuted }]}>
                  + Other Frequency...
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 7: Triggers & Relievers list */}
          {currentStep === 7 && (
            <View>
              <Text style={styles.stepSubtitle}>Triggers (makes it worse)</Text>
              <View style={[styles.chipGrid, { marginBottom: 20 }]}>
                {(() => {
                  const triggersList = [...symptomData.triggers, ...(currentCheckIn.worseTriggers?.filter((x: string) => !symptomData.triggers.includes(x)) || [])];
                  return triggersList.map((trigger: string) => {
                    const isSelected = currentCheckIn.worseTriggers?.includes(trigger);
                    return (
                      <TouchableOpacity
                        key={trigger}
                        style={[
                          styles.chip,
                          isSelected && {
                            borderColor: COLORS.severity.high,
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          },
                        ]}
                        onPress={() => onWorseTriggerClick(trigger)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && { color: COLORS.severity.high, fontWeight: '600' },
                          ]}
                        >
                          {trigger}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
                <TouchableOpacity
                  style={styles.chipCustom}
                  onPress={() => {
                    setCustomInputType('trigger');
                    setCustomInputText('');
                    setShowCustomInput(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipCustomText}>+ Other Trigger...</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.stepSubtitle}>Relievers (makes it better)</Text>
              <View style={styles.chipGrid}>
                {(() => {
                  const relieversList = [...symptomData.relievers, ...(currentCheckIn.betterTriggers?.filter((x: string) => !symptomData.relievers.includes(x)) || [])];
                  return relieversList.map((reliever: string) => {
                    const isSelected = currentCheckIn.betterTriggers?.includes(reliever);
                    return (
                      <TouchableOpacity
                        key={reliever}
                        style={[
                          styles.chip,
                          isSelected && {
                            borderColor: COLORS.severity.low,
                            backgroundColor: 'rgba(54, 211, 153, 0.12)',
                          },
                        ]}
                        onPress={() => onBetterTriggerClick(reliever)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && { color: COLORS.severity.low, fontWeight: '600' },
                          ]}
                        >
                          {reliever}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
                <TouchableOpacity
                  style={styles.chipCustom}
                  onPress={() => {
                    setCustomInputType('reliever');
                    setCustomInputText('');
                    setShowCustomInput(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipCustomText}>+ Other Reliever...</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 8: Medication use details */}
          {currentStep === 8 && (
            <View>
              <Text style={styles.stepSubtitle}>Did you take any medication?</Text>
              <View style={styles.pillChoiceRow}>
                <TouchableOpacity
                  style={[
                    styles.pillChoice,
                    currentCheckIn.takenMedication === true && styles.pillChoiceActive,
                  ]}
                  onPress={() => onMedicationStatusChange(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillChoiceText,
                      currentCheckIn.takenMedication === true && styles.pillChoiceTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pillChoice,
                    currentCheckIn.takenMedication === false && styles.pillChoiceActive,
                  ]}
                  onPress={() => onMedicationStatusChange(false)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillChoiceText,
                      currentCheckIn.takenMedication === false && styles.pillChoiceTextActive,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>

              {currentCheckIn.takenMedication && (
                <Animated.View style={styles.subMedContainer} entering={FadeIn.duration(200)}>
                  <Text style={styles.stepSubtitle}>Choose Medication</Text>
                  <View style={[styles.chipGrid, { marginBottom: 16 }]}>
                    {(() => {
                      const medsToShow = [...(symptomData.otc || []), 'Custom'];
                      return medsToShow.map((med) => {
                        const isSelected =
                          currentCheckIn.medicationName === med ||
                          (med === 'Custom' &&
                            currentCheckIn.medicationName &&
                            !symptomData.otc?.includes(currentCheckIn.medicationName));
                        return (
                          <TouchableOpacity
                            key={med}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            onPress={() => {
                              if (med === 'Custom') {
                                onMedNameChange('');
                              } else {
                                onMedNameChange(med);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                              {med}
                            </Text>
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>

                  {(currentCheckIn.medicationName === '' ||
                    (currentCheckIn.medicationName &&
                      !symptomData.otc?.includes(currentCheckIn.medicationName))) && (
                    <TextInput
                      style={styles.textInput}
                      placeholder="Type medication name..."
                      placeholderTextColor="#9898B0"
                      value={customMedName}
                      onChangeText={onCustomMedNameChange}
                    />
                  )}

                  <Text style={[styles.stepSubtitle, { marginTop: 14 }]}>How did it affect it?</Text>
                  <View style={styles.pillChoiceRow}>
                    {['Better', 'Same', 'Worse'].map((effect) => {
                      const isSelected = currentCheckIn.medicationEffect === effect;
                      const activeBg =
                        effect === 'Better'
                          ? 'rgba(54, 211, 153, 0.12)'
                          : effect === 'Worse'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(251, 191, 36, 0.12)';
                      const activeColor =
                        effect === 'Better'
                          ? COLORS.severity.low
                          : effect === 'Worse'
                          ? COLORS.severity.high
                          : COLORS.severity.medium;

                      return (
                        <TouchableOpacity
                          key={effect}
                          style={[
                            styles.pillChoice,
                            isSelected && { backgroundColor: activeBg, borderColor: activeColor },
                          ]}
                          onPress={() => onMedEffectChange(effect)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.pillChoiceText,
                              isSelected && { color: activeColor, fontWeight: '700' },
                            ]}
                          >
                            {effect}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>
              )}
            </View>
          )}

          {/* STEP 9: Associated symptoms / Follow-ups */}
          {currentStep === 9 && (
            <View>
              <Text style={styles.stepSubtitle}>Tap to check off any associated effects:</Text>
              <View style={styles.chipGrid}>
                {(() => {
                  const associatedList = [...options, ...(currentCheckIn.associatedSymptoms?.filter((x: string) => !options.includes(x)) || [])];
                  return associatedList.map((option) => {
                    const isSelected = currentCheckIn.associatedSymptoms?.includes(option);
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => onOptionSelect(option)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
                <TouchableOpacity
                  style={styles.chipCustom}
                  onPress={() => {
                    setCustomInputType('associated');
                    setCustomInputText('');
                    setShowCustomInput(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipCustomText}>+ Other Symptom...</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showCustomInput && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.customInputCard}>
              <Text style={styles.customInputLabel}>
                Add custom {customInputType === 'subregion' ? 'region' : customInputType === 'began' ? 'onset' : customInputType}
              </Text>
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customTextInputField}
                  placeholder={`Type custom ${customInputType === 'subregion' ? 'region' : customInputType}...`}
                  placeholderTextColor="#9898B0"
                  value={customInputText}
                  onChangeText={setCustomInputText}
                  autoFocus
                  onSubmitEditing={() => {
                    const trimmed = customInputText.trim();
                    if (trimmed) {
                      handleAddCustomOption(trimmed);
                    }
                    setShowCustomInput(false);
                  }}
                />
                <TouchableOpacity
                  style={styles.customAddBtn}
                  onPress={() => {
                    const trimmed = customInputText.trim();
                    if (trimmed) {
                      handleAddCustomOption(trimmed);
                    }
                    setShowCustomInput(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customAddBtnText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customCancelBtn}
                  onPress={() => setShowCustomInput(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Footer next/discard controls */}
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onDiscard} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Discard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextBtn,
              currentStep === 1 && currentCheckIn.subRegions.length === 0 && styles.nextBtnDisabled,
            ]}
            onPress={onNextStep}
            disabled={currentStep === 1 && currentCheckIn.subRegions.length === 0}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.nextBtnText,
                currentStep === 1 &&
                  currentCheckIn.subRegions.length === 0 &&
                  styles.nextBtnTextDisabled,
              ]}
            >
              {currentStep === 9 ? 'Save & Complete' : 'Continue →'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassContainer>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: SCREEN_HEIGHT * 0.54,
    maxHeight: 460,
    zIndex: 200,
  },
  questionCard: {
    flex: 1,
    height: '100%',
    padding: 20,
    justifyContent: 'space-between',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBg: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(9, 30, 66, 0.06)',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    fontWeight: '600',
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  scrollContent: {
    flex: 1,
    marginBottom: 14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 30, 66, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.06)',
  },
  chipActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checkCard: {
    flex: 1,
    minWidth: 100,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 30, 66, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCardActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: COLORS.primary,
  },
  checkCardText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  checkCardTextActive: {
    color: COLORS.primary,
  },
  stepSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  severityWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  severityIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  severityNum: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 56,
  },
  severityLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: -2,
  },
  severityScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  severityBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 30, 66, 0.02)',
  },
  severityBubbleText: {
    color: COLORS.textSecondary,
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  severityBubbleTextActive: {
    color: '#FFFFFF',
  },
  pillChoiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  pillChoice: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(9, 30, 66, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillChoiceActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: COLORS.primary,
  },
  pillChoiceText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillChoiceTextActive: {
    color: COLORS.primary,
  },
  subMedContainer: {
    marginTop: 10,
  },
  textInput: {
    width: '100%',
    backgroundColor: 'rgba(9, 30, 66, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.06)',
    borderRadius: 10,
    color: COLORS.text,
    padding: 10,
    fontSize: 12,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 30, 66, 0.06)',
    paddingTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  nextBtnDisabled: {
    backgroundColor: 'rgba(9, 30, 66, 0.05)',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  nextBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  retroactiveContainer: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(9, 30, 66, 0.05)',
  },
  retroactiveLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 30, 66, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.06)',
    position: 'relative',
    overflow: 'hidden',
  },
  pickerChipText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  pickerChipHovered: {
    backgroundColor: 'rgba(9, 30, 66, 0.08)',
    borderColor: 'rgba(9, 30, 66, 0.15)',
  },
  chipCustom: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.15)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCustomText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  customInputCard: {
    marginTop: 10,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.08)',
  },
  customInputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTextInputField: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(9, 30, 66, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    color: COLORS.text,
  },
  customAddBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  customCancelBtn: {
    paddingHorizontal: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
