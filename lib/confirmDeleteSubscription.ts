import { Alert } from "react-native";

/** Asks the user to confirm, then permanently deletes a (cancelled) subscription. */
export const confirmDeleteSubscription = (
  subscription: Subscription,
  removeSubscription: (id: string) => Promise<void>,
  onDeleted?: () => void
) => {
  Alert.alert(
    "Delete subscription?",
    `${subscription.name} will be permanently removed. This can't be undone.`,
    [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeSubscription(subscription.id);
            onDeleted?.();
          } catch (e) {
            Alert.alert("Could not delete", e instanceof Error ? e.message : "Please try again.");
          }
        },
      },
    ]
  );
};
