import { View, Text, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from 'react';
import clsx from 'clsx';
import { type IconKey } from '@/constants/icons';
import type { SubscriptionInput } from '@/lib/api';

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: SubscriptionInput) => Promise<void>;
}

type Frequency = 'Monthly' | 'Yearly';
// Only the card type and last 4 digits are collected — never the full card number
type CardType = 'Visa' | 'Mastercard' | 'Amex' | 'Other';
const CARD_TYPES: CardType[] = ['Visa', 'Mastercard', 'Amex', 'Other'];
type Category = 'Entertainment' | 'AI Tools' | 'Developer Tools' | 'Design' | 'Productivity' | 'Other';
const CATEGORIES: Category[] = ['Entertainment', 'AI Tools', 'Developer Tools', 'Design', 'Productivity', 'Other'];
const CATEGORY_COLORS: Record<Category, string> = {
  'Entertainment': '#ff6b6b',
  'AI Tools': '#b8d4e3',
  'Developer Tools': '#e8def8',
  'Design': '#f5c542',
  'Productivity': '#95e1d3',
  'Other': '#d4d4d4',
};

// Brand icons bundled with the app; a matching name (e.g. "Spotify Premium") gets its logo
const BRAND_ICONS: IconKey[] = ['notion', 'dropbox', 'openai', 'adobe', 'medium', 'figma', 'spotify', 'github', 'claude', 'canva'];
const iconForName = (name: string): IconKey =>
  BRAND_ICONS.find((key) => name.toLowerCase().includes(key)) ?? 'plus';

const CreateSubscriptionModal = ({ visible, onClose, onSubmit }: CreateSubscriptionModalProps) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [category, setCategory] = useState<Category>('Other');
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [cardLast4, setCardLast4] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Improved price validation
  const isValidPrice = () => {
    const trimmedPrice = price.trim();
    if (!trimmedPrice) return false;
    // Strict numeric pattern check
    if (!/^\s*[+-]?(\d+(\.\d+)?|\.\d+)\s*$/.test(trimmedPrice)) return false;
    const numValue = Number(trimmedPrice);
    return Number.isFinite(numValue) && numValue > 0;
  };

  const isValidPaymentMethod = cardType !== null && /^\d{4}$/.test(cardLast4);
  const isValidForm = name.trim() !== '' && isValidPrice() && isValidPaymentMethod;

  const handleSubmit = async () => {
    if (!isValidForm || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      // The server sets the start date and calculates the first renewal date
      await onSubmit({
        name: name.trim(),
        price: Number(price.trim()),
        currency: 'USD',
        frequency,
        category,
        paymentMethod: `${cardType === 'Other' ? 'Card' : cardType} ending in ${cardLast4}`,
        status: 'active',
        iconKey: iconForName(name),
        color: CATEGORY_COLORS[category],
      });
      resetForm();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save subscription');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setFrequency('Monthly');
    setCategory('Other');
    setCardType(null);
    setCardLast4('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <Pressable className="modal-overlay" onPress={handleClose}>
          <Pressable className="modal-container" onPress={(e) => e.stopPropagation()}>
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable className="modal-close" onPress={handleClose}>
                <Text className="modal-close-text">✕</Text>
              </Pressable>
            </View>

            <ScrollView
              className="p-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 20, paddingBottom: 20 }}
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className="auth-input"
                  placeholder="Subscription name"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  className="auth-input"
                  placeholder="0.00"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  <Pressable
                    className={clsx('picker-option', frequency === 'Monthly' && 'picker-option-active')}
                    onPress={() => setFrequency('Monthly')}
                  >
                    <Text className={clsx('picker-option-text', frequency === 'Monthly' && 'picker-option-text-active')}>
                      Monthly
                    </Text>
                  </Pressable>
                  <Pressable
                    className={clsx('picker-option', frequency === 'Yearly' && 'picker-option-active')}
                    onPress={() => setFrequency('Yearly')}
                  >
                    <Text className={clsx('picker-option-text', frequency === 'Yearly' && 'picker-option-text-active')}>
                      Yearly
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      className={clsx('category-chip', category === cat && 'category-chip-active')}
                      onPress={() => setCategory(cat)}
                    >
                      <Text className={clsx('category-chip-text', category === cat && 'category-chip-text-active')}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Payment method</Text>
                <View className="category-scroll">
                  {CARD_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      className={clsx('category-chip', cardType === type && 'category-chip-active')}
                      onPress={() => setCardType(type)}
                    >
                      <Text className={clsx('category-chip-text', cardType === type && 'category-chip-text-active')}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  className="auth-input"
                  placeholder="Last 4 digits of card"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={cardLast4}
                  onChangeText={(text) => setCardLast4(text.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              {error && <Text className="auth-error">{error}</Text>}

              <Pressable
                className={clsx('auth-button', (!isValidForm || isSaving) && 'auth-button-disabled')}
                onPress={handleSubmit}
                disabled={!isValidForm || isSaving}
              >
                <Text className="auth-button-text">{isSaving ? 'Saving...' : 'Create Subscription'}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;
