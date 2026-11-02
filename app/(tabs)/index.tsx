import "@/global.css"
import {ActivityIndicator, Alert, FlatList, Image, Pressable, Text, View} from "react-native";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import { styled } from "nativewind";
import images from "@/constants/images";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useState, useMemo} from "react";
import { useUser } from '@clerk/expo';
import { usePostHog } from 'posthog-react-native';
import { useSubscriptionStore } from "@/lib/subscriptionStore";
import type { SubscriptionInput } from "@/lib/api";
const SafeAreaView = styled(RNSafeAreaView);

// Normalise every active subscription to its monthly cost
const monthlyCost = (sub: Subscription) => (sub.frequency === 'Yearly' ? sub.price / 12 : sub.price);

export default function App() {
    const { user } = useUser();
    const posthog = usePostHog();
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const { subscriptions, isLoading, hasLoaded, error, fetchSubscriptions, addSubscription, updateSubscription } = useSubscriptionStore();

    const activeSubscriptions = useMemo(
        () => subscriptions.filter((sub) => sub.status === 'active'),
        [subscriptions]
    );

    const monthlyTotal = useMemo(
        () => activeSubscriptions.reduce((total, sub) => total + monthlyCost(sub), 0),
        [activeSubscriptions]
    );

    // Get upcoming subscriptions (active subscriptions with renewal date within next 7 days)
    const upcomingSubscriptions = useMemo<UpcomingSubscription[]>(() => {
        const now = dayjs();
        const nextWeek = now.add(7, 'days');
        return activeSubscriptions.filter(sub =>
            dayjs(sub.renewalDate).isAfter(now) &&
            dayjs(sub.renewalDate).isBefore(nextWeek)
        ).sort((a, b) => dayjs(a.renewalDate).diff(dayjs(b.renewalDate)))
        .map(sub => ({
            ...sub,
            // Count calendar days so "3 days left" doesn't flip to 2 partway through the day
            daysLeft: dayjs(sub.renewalDate).startOf('day').diff(now.startOf('day'), 'day'),
        }));
    }, [activeSubscriptions]);

    const nextRenewalDate = useMemo(
        () => activeSubscriptions
            .map((sub) => sub.renewalDate)
            .filter((date): date is string => !!date)
            .sort((a, b) => dayjs(a).diff(dayjs(b)))[0],
        [activeSubscriptions]
    );

    const handleSubscriptionPress = (item: Subscription) => {
        const isExpanding = expandedSubscriptionId !== item.id;
        setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id));
        posthog.capture(isExpanding ? 'subscription_expanded' : 'subscription_collapsed', {
            subscription_name: item.name,
            subscription_id: item.id,
        });
    };

    const handleCreateSubscription = async (input: SubscriptionInput) => {
        const created = await addSubscription(input);
        posthog.capture('subscription_created', {
            subscription_id: created.id,
            subscription_name: created.name,
            subscription_price: created.price,
            subscription_frequency: created.frequency ?? null,
            subscription_category: created.category ?? null,
        });
    };

    const handleCancelSubscription = (item: Subscription) => {
        Alert.alert('Cancel subscription?', `${item.name} will be marked as cancelled.`, [
            { text: 'Keep', style: 'cancel' },
            {
                text: 'Cancel subscription',
                style: 'destructive',
                onPress: async () => {
                    setCancellingId(item.id);
                    try {
                        await updateSubscription(item.id, { status: 'cancelled' });
                        posthog.capture('subscription_cancelled', {
                            subscription_id: item.id,
                            subscription_name: item.name,
                        });
                    } catch (e) {
                        Alert.alert('Could not cancel', e instanceof Error ? e.message : 'Please try again.');
                    } finally {
                        setCancellingId(null);
                    }
                },
            },
        ]);
    };

    // Get user display name: firstName, fullName, or email
    const displayName = user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            <View className="home-header">
                                <View className="home-user">
                                    <Image
                                        source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                                        className="home-avatar"
                                    />
                                    <Text className="home-user-name" numberOfLines={1}>{displayName}</Text>
                                </View>

                                <Pressable onPress={() => setIsModalVisible(true)}>
                                    <Image source={icons.add} className="home-add-icon" />
                                </Pressable>
                            </View>

                            <View className="home-balance-card">
                                <Text className="home-balance-label">Monthly spend</Text>

                                <View className="home-balance-row">
                                    <Text className="home-balance-amount">
                                        {formatCurrency(monthlyTotal)}
                                    </Text>
                                    {nextRenewalDate && (
                                        <Text className="home-balance-date">
                                            {dayjs(nextRenewalDate).format('MM/DD')}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View className="mb-5">
                                <ListHeading title="Upcoming" />

                                <FlatList
                                    data={upcomingSubscriptions}
                                    renderItem={({ item }) => (<UpcomingSubscriptionCard {...item} />)}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals yet.</Text>}
                                />
                            </View>

                            <ListHeading title="All Subscriptions" />
                        </>
                    )}
                    data={subscriptions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <SubscriptionCard
                            {...item}
                            expanded={expandedSubscriptionId === item.id}
                            onPress={() => handleSubscriptionPress(item)}
                            onCancelPress={() => handleCancelSubscription(item)}
                            isCancelling={cancellingId === item.id}
                        />
                    )}
                    extraData={[expandedSubscriptionId, cancellingId]}
                    ItemSeparatorComponent={() => <View className="h-4" />}
                    showsVerticalScrollIndicator={false}
                    refreshing={isLoading && hasLoaded}
                    onRefresh={fetchSubscriptions}
                    ListEmptyComponent={
                        !hasLoaded && isLoading ? (
                            <ActivityIndicator className="mt-6" />
                        ) : error ? (
                            <Pressable onPress={fetchSubscriptions}>
                                <Text className="home-empty-state">Couldn&apos;t load subscriptions: {error}. Tap to retry.</Text>
                            </Pressable>
                        ) : (
                            <Text className="home-empty-state">No subscriptions yet. Tap + to add one.</Text>
                        )
                    }
                    contentContainerClassName="pb-30"
                />

            <CreateSubscriptionModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleCreateSubscription}
            />
        </SafeAreaView>
    );
}
