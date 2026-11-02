import Constants from "expo-constants";
import { icons, type IconKey } from "@/constants/icons";

// In development the API runs on the same computer as Metro, so reuse Metro's
// LAN address (e.g. 192.168.1.46) — that way a physical phone can reach it too.
const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (devHost ? `http://${devHost}:4000` : "http://localhost:4000");

export type GetToken = () => Promise<string | null>;

export interface SubscriptionInput {
  name: string;
  price: number;
  currency?: string;
  frequency?: "Monthly" | "Yearly";
  category?: string;
  plan?: string;
  paymentMethod?: string;
  status?: "active" | "paused" | "cancelled";
  iconKey?: IconKey;
  color?: string;
  startDate?: string;
  renewalDate?: string;
}

type ApiSubscription = Omit<Subscription, "icon" | "billing"> & { iconKey?: string };

const toSubscription = (sub: ApiSubscription): Subscription => ({
  ...sub,
  icon: icons[sub.iconKey as IconKey] ?? icons.plus,
  billing: sub.frequency ?? "Monthly",
});

async function request<T>(getToken: GetToken, path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export const subscriptionsApi = {
  list: async (getToken: GetToken) =>
    (await request<ApiSubscription[]>(getToken, "/api/subscriptions")).map(toSubscription),

  create: async (getToken: GetToken, input: SubscriptionInput) =>
    toSubscription(
      await request<ApiSubscription>(getToken, "/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ),

  update: async (getToken: GetToken, id: string, changes: Partial<SubscriptionInput>) =>
    toSubscription(
      await request<ApiSubscription>(getToken, `/api/subscriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      })
    ),

  remove: (getToken: GetToken, id: string) =>
    request<void>(getToken, `/api/subscriptions/${id}`, { method: "DELETE" }),
};
