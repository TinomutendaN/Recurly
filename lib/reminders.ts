import * as Notifications from 'expo-notifications';
import dayjs from 'dayjs';
import { formatCurrency } from '@/lib/utils';

// Show reminders as a banner even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const REMINDER_HOUR = 9;

/** Asks for notification permission; returns whether reminders can be shown. */
export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Replaces all scheduled renewal reminders with one per active subscription,
 * fired at 9:00 the chosen number of days before its renewal date.
 */
export async function syncRenewalReminders(
  subscriptions: Subscription[],
  { enabled, daysBefore, currency }: { enabled: boolean; daysBefore: number; currency: string }
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  const now = dayjs();
  const reminders = subscriptions
    .filter((sub) => sub.status === 'active' && sub.renewalDate)
    .map((sub) => ({
      sub,
      fireAt: dayjs(sub.renewalDate).subtract(daysBefore, 'day').hour(REMINDER_HOUR).minute(0).second(0),
    }))
    .filter(({ fireAt }) => fireAt.isAfter(now));

  await Promise.all(
    reminders.map(({ sub, fireAt }) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: `${sub.name} renews ${daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`}`,
          body: `${formatCurrency(sub.price, currency)} will be charged on ${dayjs(sub.renewalDate).format('D MMM')}.`,
          data: { subscriptionId: sub.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt.toDate() },
      })
    )
  );
}
