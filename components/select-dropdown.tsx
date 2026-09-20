import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { UI_SPRING } from '@/constants/motion';

import { Colors, defaultFontFamily } from '@/constants/theme';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function AnimatedChevron({ isOpen }: { isOpen: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(isOpen ? 180 : 0, UI_SPRING);
  }, [isOpen, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <AnimatedIonicons
      name="chevron-down"
      size={20}
      color={Colors.icon}
      style={animatedStyle}
    />
  );
}

interface SelectDropdownProps {
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  disabledOptions?: string[];
  disabled?: boolean;
}

export function SelectDropdown({
  value,
  options,
  placeholder,
  onSelect,
  onOpenChange,
  disabledOptions = [],
  disabled = false,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const disabledSet = new Set(disabledOptions);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    return () => {
      onOpenChange?.(false);
    };
  }, [onOpenChange]);

  const close = () => setIsOpen(false);

  const renderOptions = () =>
    options.map((option) => {
      const isDisabled = disabledSet.has(option);
      const isSelected = value === option;
      return (
        <Pressable
          key={option}
          style={[
            styles.dropdownItem,
            isSelected && styles.dropdownItemSelected,
            isDisabled && styles.dropdownItemDisabled,
          ]}
          disabled={isDisabled}
          onPress={() => {
            onSelect(option);
            close();
          }}
        >
          <Text
            style={[
              styles.dropdownItemText,
              isSelected && styles.dropdownItemTextSelected,
              isDisabled && styles.dropdownItemTextDisabled,
            ]}
          >
            {option}
            {isDisabled ? ' (taken)' : ''}
          </Text>
          {isSelected && !isDisabled && (
            <Ionicons name="checkmark" size={18} color="#6E92FF" />
          )}
        </Pressable>
      );
    });

  return (
    <View style={styles.dropdownContainer}>
      <Pressable
        style={[styles.dropdown, isOpen && styles.dropdownOpen, disabled && styles.dropdownDisabled]}
        onPress={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <AnimatedChevron isOpen={isOpen} />
      </Pressable>

      {isOpen && Platform.OS !== 'android' && (
        <View style={styles.dropdownList}>
          <ScrollView
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {options.length === 0 ? (
              <Text style={styles.emptyText}>No options</Text>
            ) : (
              renderOptions()
            )}
          </ScrollView>
        </View>
      )}

      {Platform.OS === 'android' && (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
          <View style={styles.dropdownModalOverlay}>
            <Pressable style={styles.dropdownModalBackdrop} onPress={close} />
            <View style={styles.dropdownModalCard}>
              <ScrollView
                style={styles.dropdownModalScroll}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {options.length === 0 ? (
                  <Text style={styles.emptyText}>No options</Text>
                ) : (
                  renderOptions()
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
  },
  dropdown: {
    width: '100%',
    height: 48,
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    borderColor: Colors.icon,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownDisabled: {
    opacity: 0.5,
  },
  dropdownText: {
    color: Colors.text,
    fontSize: 16,
    flex: 1,
    fontFamily: defaultFontFamily,
  },
  dropdownPlaceholder: {
    color: Colors.placeholder,
    fontFamily: defaultFontFamily,
  },
  dropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    maxHeight: 180,
    backgroundColor: '#3a3a3a',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#4a4a4a',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 20,
  },
  dropdownScroll: {
    flexGrow: 0,
  },
  dropdownModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dropdownModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dropdownModalCard: {
    maxHeight: '60%',
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    overflow: 'hidden',
  },
  dropdownModalScroll: {
    maxHeight: 360,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(110, 146, 255, 0.1)',
  },
  dropdownItemDisabled: {
    opacity: 0.45,
  },
  dropdownItemText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  dropdownItemTextSelected: {
    color: '#6E92FF',
    fontWeight: '500',
  },
  dropdownItemTextDisabled: {
    color: Colors.icon,
  },
  emptyText: {
    color: Colors.icon,
    fontSize: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: defaultFontFamily,
  },
});
