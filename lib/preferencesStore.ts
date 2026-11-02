import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'ZAR', label: 'South African Rand' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'NGN', label: 'Nigerian Naira' },
  { code: 'KES', label: 'Kenyan Shilling' },
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const REMINDER_DAY_OPTIONS = [1, 3, 7] as const;
export type ReminderDays = (typeof REMINDER_DAY_OPTIONS)[number];

interface PreferencesState {
  theme: ThemePreference;
  currency: CurrencyCode;
  remindersEnabled: boolean;
  reminderDaysBefore: ReminderDays;
  setTheme: (theme: ThemePreference) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderDaysBefore: (days: ReminderDays) => void;
}

// Device-level preferences, saved on the phone so they survive app restarts
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      currency: 'USD',
      remindersEnabled: false,
      reminderDaysBefore: 3,
      setTheme: (theme) => set({ theme }),
      setCurrency: (currency) => set({ currency }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
      setReminderDaysBefore: (reminderDaysBefore) => set({ reminderDaysBefore }),
    }),
    {
      name: 'recurrly-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ theme, currency, remindersEnabled, reminderDaysBefore }) => ({
        theme, currency, remindersEnabled, reminderDaysBefore,
      }),
    }
  )
);
