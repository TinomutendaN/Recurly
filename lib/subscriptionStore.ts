import { create } from 'zustand';
import { useAuth } from '@clerk/expo';
import { subscriptionsApi, type GetToken, type SubscriptionInput } from '@/lib/api';

interface SubscriptionState {
  subscriptions: Subscription[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  fetchSubscriptions: (getToken: GetToken) => Promise<void>;
  addSubscription: (getToken: GetToken, input: SubscriptionInput) => Promise<Subscription>;
  updateSubscription: (getToken: GetToken, id: string, changes: Partial<SubscriptionInput>) => Promise<Subscription>;
  removeSubscription: (getToken: GetToken, id: string) => Promise<void>;
  reset: () => void;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong';

const useSubscriptionState = create<SubscriptionState>((set) => ({
  subscriptions: [],
  isLoading: false,
  hasLoaded: false,
  error: null,

  fetchSubscriptions: async (getToken) => {
    set({ isLoading: true, error: null });
    try {
      const subscriptions = await subscriptionsApi.list(getToken);
      set({ subscriptions, hasLoaded: true });
    } catch (error) {
      set({ error: errorMessage(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  addSubscription: async (getToken, input) => {
    const created = await subscriptionsApi.create(getToken, input);
    set((state) => ({ subscriptions: [created, ...state.subscriptions] }));
    return created;
  },

  updateSubscription: async (getToken, id, changes) => {
    const updated = await subscriptionsApi.update(getToken, id, changes);
    set((state) => ({
      subscriptions: state.subscriptions.map((sub) => (sub.id === id ? updated : sub)),
    }));
    return updated;
  },

  removeSubscription: async (getToken, id) => {
    await subscriptionsApi.remove(getToken, id);
    set((state) => ({ subscriptions: state.subscriptions.filter((sub) => sub.id !== id) }));
  },

  // Called on sign-out so the next user never sees the previous user's data
  reset: () => set({ subscriptions: [], isLoading: false, hasLoaded: false, error: null }),
}));

/** Subscription data for the signed-in user, with API calls pre-authorised via Clerk. */
export const useSubscriptionStore = () => {
  const { getToken } = useAuth();
  const state = useSubscriptionState();

  return {
    subscriptions: state.subscriptions,
    isLoading: state.isLoading,
    hasLoaded: state.hasLoaded,
    error: state.error,
    fetchSubscriptions: () => state.fetchSubscriptions(getToken),
    addSubscription: (input: SubscriptionInput) => state.addSubscription(getToken, input),
    updateSubscription: (id: string, changes: Partial<SubscriptionInput>) =>
      state.updateSubscription(getToken, id, changes),
    removeSubscription: (id: string) => state.removeSubscription(getToken, id),
  };
};

export const resetSubscriptionStore = () => useSubscriptionState.getState().reset();
