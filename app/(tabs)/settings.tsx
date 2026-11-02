import { Text, View, Pressable, Image, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useAuth, useClerk, useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import clsx from "clsx";
import { useState } from "react";
import images from '@/constants/images';
import { colors } from '@/constants/theme';
import { usePostHog } from 'posthog-react-native';
import { resetSubscriptionStore } from '@/lib/subscriptionStore';
import { accountApi } from '@/lib/api';
import { requestReminderPermission, syncRenewalReminders } from '@/lib/reminders';
import {
    usePreferences,
    CURRENCIES,
    REMINDER_DAY_OPTIONS,
    type ThemePreference,
} from '@/lib/preferencesStore';
const SafeAreaView = styled(RNSafeAreaView);

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

const Settings = () => {
    const { signOut } = useClerk();
    const { getToken } = useAuth();
    const { user } = useUser();
    const posthog = usePostHog();
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        theme, currency, remindersEnabled, reminderDaysBefore,
        setTheme, setCurrency, setRemindersEnabled, setReminderDaysBefore,
    } = usePreferences();

    // Clears everything tied to this user on the device
    const clearLocalUserData = async () => {
        posthog.reset();
        resetSubscriptionStore();
        await syncRenewalReminders([], { enabled: false, daysBefore: reminderDaysBefore, currency });
    };

    const handleSignOut = async () => {
        posthog.capture('user_signed_out');
        try {
            await signOut();
            // Only reset analytics and cached data after successful sign-out
            await clearLocalUserData();
        } catch (error) {
            console.error('Sign-out failed:', error);
            // Don't reset analytics if sign-out failed
        }
    };

    const uploadPhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Photos access needed', 'Allow access to your photos in Settings to choose a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });
        const asset = result.assets?.[0];
        if (result.canceled || !asset?.base64 || !user) return;

        setIsUpdatingPhoto(true);
        try {
            await user.setProfileImage({ file: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` });
            posthog.capture('profile_photo_updated');
        } catch (error) {
            Alert.alert('Could not update photo', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            setIsUpdatingPhoto(false);
        }
    };

    const removePhoto = async () => {
        if (!user) return;
        setIsUpdatingPhoto(true);
        try {
            await user.setProfileImage({ file: null });
        } catch (error) {
            Alert.alert('Could not remove photo', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            setIsUpdatingPhoto(false);
        }
    };

    const handlePhotoPress = () => {
        Alert.alert('Profile photo', undefined, [
            { text: 'Choose from library', onPress: uploadPhoto },
            ...(user?.hasImage ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: removePhoto }] : []),
            { text: 'Cancel', style: 'cancel' as const },
        ]);
    };

    const handleRemindersToggle = async (enabled: boolean) => {
        if (enabled && !(await requestReminderPermission())) {
            Alert.alert('Notifications are off', 'Allow notifications for this app in your phone settings to get renewal reminders.');
            return;
        }
        setRemindersEnabled(enabled);
    };

    const deleteAccount = async () => {
        setIsDeleting(true);
        try {
            await accountApi.remove(getToken);
            posthog.capture('account_deleted');
            await clearLocalUserData();
            // The account no longer exists, so ending the local session may report an error — that's fine
            await signOut().catch(() => {});
        } catch (error) {
            setIsDeleting(false);
            Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Please try again.');
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete account?',
            'This permanently deletes your account and all your subscriptions. This cannot be undone.',
            [
                { text: 'Keep account', style: 'cancel' },
                { text: 'Delete account', style: 'destructive', onPress: deleteAccount },
            ]
        );
    };

    const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';
    const email = user?.emailAddresses[0]?.emailAddress;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView contentContainerClassName="p-5 pb-30" showsVerticalScrollIndicator={false}>
                <Text className="text-3xl font-sans-bold text-primary mb-6">Settings</Text>

                {/* User Profile Section */}
                <View className="auth-card mt-0 mb-5">
                    <View className="flex-row items-center gap-4">
                        <Pressable onPress={handlePhotoPress} disabled={isUpdatingPhoto}>
                            <Image
                                source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                                className="size-16 rounded-full"
                            />
                            {isUpdatingPhoto ? (
                                <View className="absolute inset-0 items-center justify-center rounded-full bg-black/40">
                                    <ActivityIndicator color="#fff" />
                                </View>
                            ) : (
                                <View className="absolute -bottom-1 -right-1 size-6 items-center justify-center rounded-full bg-accent">
                                    <Text className="text-xs font-sans-bold text-white">✎</Text>
                                </View>
                            )}
                        </Pressable>
                        <View className="flex-1">
                            <Text className="text-lg font-sans-bold text-primary">{displayName}</Text>
                            {email && (
                                <Text className="text-sm font-sans-medium text-muted-foreground">{email}</Text>
                            )}
                            <Text className="text-xs font-sans-medium text-accent mt-1">Tap photo to change</Text>
                        </View>
                    </View>
                </View>

                {/* Preferences Section */}
                <View className="auth-card mt-0 mb-5 gap-5">
                    <Text className="text-base font-sans-semibold text-primary">Preferences</Text>

                    <View className="auth-field">
                        <Text className="auth-label">Appearance</Text>
                        <View className="picker-row">
                            {THEME_OPTIONS.map((option) => (
                                <Pressable
                                    key={option.value}
                                    className={clsx('picker-option', theme === option.value && 'picker-option-active')}
                                    onPress={() => setTheme(option.value)}
                                >
                                    <Text className={clsx('picker-option-text', theme === option.value && 'picker-option-text-active')}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View className="auth-field">
                        <Text className="auth-label">Currency</Text>
                        <View className="category-scroll">
                            {CURRENCIES.map((option) => (
                                <Pressable
                                    key={option.code}
                                    className={clsx('category-chip', currency === option.code && 'category-chip-active')}
                                    onPress={() => setCurrency(option.code)}
                                    accessibilityLabel={option.label}
                                >
                                    <Text className={clsx('category-chip-text', currency === option.code && 'category-chip-text-active')}>
                                        {option.code}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <Text className="auth-helper">Changes the symbol shown on prices — amounts aren&apos;t converted.</Text>
                    </View>

                    <View className="auth-field">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1 pr-3">
                                <Text className="auth-label">Renewal reminders</Text>
                                <Text className="auth-helper">Get a notification before a subscription renews.</Text>
                            </View>
                            <Switch
                                value={remindersEnabled}
                                onValueChange={handleRemindersToggle}
                                trackColor={{ true: colors.accent }}
                            />
                        </View>

                        {remindersEnabled && (
                            <View className="picker-row mt-2">
                                {REMINDER_DAY_OPTIONS.map((days) => (
                                    <Pressable
                                        key={days}
                                        className={clsx('picker-option', reminderDaysBefore === days && 'picker-option-active')}
                                        onPress={() => setReminderDaysBefore(days)}
                                    >
                                        <Text className={clsx('picker-option-text', reminderDaysBefore === days && 'picker-option-text-active')}>
                                            {days === 1 ? '1 day before' : `${days} days before`}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Account Section */}
                <View className="auth-card mt-0 mb-5">
                    <Text className="text-base font-sans-semibold text-primary mb-3">Account</Text>
                    <View className="gap-2">
                        <View className="flex-row justify-between items-center py-2">
                            <Text className="text-sm font-sans-medium text-muted-foreground">Account ID</Text>
                            <Text className="text-sm font-sans-medium text-primary" numberOfLines={1} ellipsizeMode="tail">
                                {user?.id?.substring(0, 20)}...
                            </Text>
                        </View>
                        <View className="flex-row justify-between items-center py-2">
                            <Text className="text-sm font-sans-medium text-muted-foreground">Joined</Text>
                            <Text className="text-sm font-sans-medium text-primary">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Sign Out Button */}
                <Pressable
                    className="auth-button bg-destructive"
                    onPress={handleSignOut}
                    disabled={isDeleting}
                >
                    <Text className="auth-button-text text-white">Sign Out</Text>
                </Pressable>

                {/* Delete Account */}
                <Pressable className="mt-4 items-center py-3" onPress={handleDeleteAccount} disabled={isDeleting}>
                    {isDeleting ? (
                        <ActivityIndicator />
                    ) : (
                        <Text className="text-sm font-sans-semibold text-destructive">Delete account</Text>
                    )}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Settings
