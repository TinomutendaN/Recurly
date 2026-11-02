import dayjs from "dayjs";
import { icons } from "./icons";

// Dummy dates are relative to today so the demo data always looks current
const daysFromNow = (days: number) => dayjs().add(days, "day").hour(10).minute(0).second(0).millisecond(0).toISOString();
// Start dates sit a whole number of billing cycles before the renewal date
const monthsBefore = (date: string, months: number) => dayjs(date).subtract(months, "month").toISOString();

const ADOBE_RENEWAL = daysFromNow(3);
const GITHUB_RENEWAL = daysFromNow(6);
const CLAUDE_RENEWAL = daysFromNow(25);
const CANVA_RENEWAL = daysFromNow(150);

export const tabs: AppTab[] = [
    { name: "index", title: "Home", icon: icons.home },
    { name: "subscriptions", title: "Subscriptions", icon: icons.wallet },
    { name: "insights", title: "Insights", icon: icons.activity },
    { name: "settings", title: "Settings", icon: icons.setting },
];

export const HOME_USER = {
    name: "Adrian | JS Mastery",
};

export const HOME_BALANCE = {
    amount: 2489.48,
    nextRenewalDate: ADOBE_RENEWAL,
};

export const UPCOMING_SUBSCRIPTIONS: UpcomingSubscription[] = [
    {
        id: "spotify",
        icon: icons.spotify,
        name: "Spotify",
        price: 5.99,
        currency: "USD",
        daysLeft: 2,
    },
    {
        id: "notion",
        icon: icons.notion,
        name: "Notion",
        price: 12.0,
        currency: "USD",
        daysLeft: 4,
    },
    {
        id: "figma",
        icon: icons.figma,
        name: "Figma",
        price: 15.0,
        currency: "USD",
        daysLeft: 6,
    },
];

export const HOME_SUBSCRIPTIONS: Subscription[] = [
    {
        id: "adobe-creative-cloud",
        icon: icons.adobe,
        name: "Adobe Creative Cloud",
        plan: "Teams Plan",
        category: "Design",
        paymentMethod: "Visa ending in 8530",
        status: "active",
        startDate: monthsBefore(ADOBE_RENEWAL, 19),
        price: 77.49,
        currency: "USD",
        billing: "Monthly",
        renewalDate: ADOBE_RENEWAL,
        color: "#f5c542",
    },
    {
        id: "github-pro",
        icon: icons.github,
        name: "GitHub Pro",
        plan: "Developer",
        category: "Developer Tools",
        paymentMethod: "Mastercard ending in 2408",
        status: "active",
        startDate: monthsBefore(GITHUB_RENEWAL, 24),
        price: 9.99,
        currency: "USD",
        billing: "Monthly",
        renewalDate: GITHUB_RENEWAL,
        color: "#e8def8",
    },
    {
        id: "claude-pro",
        icon: icons.claude,
        name: "Claude Pro",
        plan: "Pro Plan",
        category: "AI Tools",
        paymentMethod: "Amex ending in 1010",
        status: "paused",
        startDate: monthsBefore(CLAUDE_RENEWAL, 6),
        price: 20.0,
        currency: "USD",
        billing: "Monthly",
        renewalDate: CLAUDE_RENEWAL,
        color: "#b8d4e3",
    },
    {
        id: "canva-pro",
        icon: icons.canva,
        name: "Canva Pro",
        plan: "Yearly Access",
        category: "Design",
        paymentMethod: "Visa ending in 7784",
        status: "cancelled",
        startDate: monthsBefore(CANVA_RENEWAL, 24),
        price: 119.99,
        currency: "USD",
        billing: "Yearly",
        renewalDate: CANVA_RENEWAL,
        color: "#b8e8d0",
    },
];
