import {Tabs, Redirect} from "expo-router";
import {tabs} from "@/constants/data";
import {View} from "react-native";
import { colors, components } from '@/constants/theme'
import clsx from "clsx";
import {Image} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from '@clerk/expo';
import { useEffect } from "react";
import { useSubscriptionStore } from "@/lib/subscriptionStore";
import { usePreferences } from "@/lib/preferencesStore";
import { syncRenewalReminders } from "@/lib/reminders";
import { useThemeColors } from "@/lib/useThemeColors";

const tabBar = components.tabBar;

const TabIcon = ({focused, icon}: TabIconProps) => {
    return (
        <View className="tabs-icon">
            <View className={clsx('tabs-pill', focused && 'tabs-active')}>
                <Image source={icon} resizeMode="contain" className="tabs-glyph"/>
            </View>
        </View>
    );
};
const TabLayout = () => {
        const { isSignedIn, isLoaded } = useAuth();
        const insets = useSafeAreaInsets();
        const { subscriptions, hasLoaded, fetchSubscriptions } = useSubscriptionStore();
        const remindersEnabled = usePreferences((state) => state.remindersEnabled);
        const reminderDaysBefore = usePreferences((state) => state.reminderDaysBefore);
        const currency = usePreferences((state) => state.currency);
        const themeColors = useThemeColors();

        // Load this user's subscriptions from the API once they're signed in
        useEffect(() => {
            if (isLoaded && isSignedIn) {
                fetchSubscriptions();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isLoaded, isSignedIn]);

        // Keep renewal reminders in step with the subscription list and reminder settings
        useEffect(() => {
            if (!hasLoaded) return;
            syncRenewalReminders(subscriptions, {
                enabled: remindersEnabled,
                daysBefore: reminderDaysBefore,
                currency,
            }).catch((error) => console.warn('Could not schedule reminders:', error));
        }, [hasLoaded, subscriptions, remindersEnabled, reminderDaysBefore, currency]);

        // Wait for auth to load before rendering anything
        if (!isLoaded) {
            return null;
        }

        // Redirect to sign-in if user is not authenticated
        if (!isSignedIn) {
            return <Redirect href="/(auth)/sign-in" />;
        }

        return (
            <Tabs
                screenOptions={{
                        headerShown: false,
                        tabBarShowLabel: false,
                        tabBarStyle: {
                                position: 'absolute',
                                bottom: Math.max(insets.bottom, tabBar.horizontalInset),
                                height: tabBar.height,
                                marginHorizontal: tabBar.horizontalInset,
                                borderRadius: tabBar.radius,
                                backgroundColor: themeColors.tabBar,
                                borderTopWidth: 0,
                                elevation: 0,
                        },
                        tabBarItemStyle: {
                                paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
                        },
                        tabBarIconStyle: {
                                width: tabBar.iconFrame,
                                height: tabBar.iconFrame,
                                alignItems: 'center'
                        }
            }}
            >
                    {tabs.map((tab) => (
                        <Tabs.Screen
                            key={tab.name}
                            name={tab.name}
                            options={{
                                    title: tab.title,
                                    tabBarIcon: ({focused}) => (
                                        <TabIcon focused={focused} icon={tab.icon} />
                                    )
                            }}/>
                    ))}
            </Tabs>
        )
}

export default TabLayout;
