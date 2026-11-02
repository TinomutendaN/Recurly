import {Text, View, TextInput, FlatList} from 'react-native'
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useState } from "react";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptionStore } from "@/lib/subscriptionStore";
import { confirmDeleteSubscription } from "@/lib/confirmDeleteSubscription";
import { usePostHog } from "posthog-react-native";
import { useThemeColors } from "@/lib/useThemeColors";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
    const { placeholder: placeholderColor } = useThemeColors();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { subscriptions, removeSubscription } = useSubscriptionStore();
    const posthog = usePostHog();

    const filteredSubscriptions = subscriptions.filter((subscription) =>
        subscription.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscription.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscription.plan?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView className="flex-1 bg-background">
            <FlatList
                data={filteredSubscriptions}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <View className="px-5 pt-5">
                        <Text className="text-3xl font-sans-bold text-primary mb-5">Subscriptions</Text>
                        <TextInput
                            className="bg-card rounded-xl px-4 py-3 text-primary mb-4"
                            placeholder="Search subscriptions..."
                            placeholderTextColor={placeholderColor}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                }
                renderItem={({ item }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedId === item.id}
                        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        onDeletePress={() =>
                            confirmDeleteSubscription(item, removeSubscription, () =>
                                posthog.capture('subscription_deleted', {
                                    subscription_id: item.id,
                                    subscription_name: item.name,
                                })
                            )
                        }
                    />
                )}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            />
        </SafeAreaView>
    )
}
export default Subscriptions
