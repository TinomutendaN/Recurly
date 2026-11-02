import {View, Text, Image, Pressable} from 'react-native'
import React from 'react'
import {formatCurrency, formatStatusLabel, formatSubscriptionDateTime} from "@/lib/utils";
import clsx from "clsx";
import * as Haptics from "expo-haptics";
import { usePreferences } from "@/lib/preferencesStore";

// How long a cancelled subscription must be held before the delete prompt appears
const DELETE_HOLD_MS = 1000;

const SubscriptionCard = ({ name, price, icon, billing, color, category, plan, renewalDate, expanded, onPress, paymentMethod, startDate, status, onCancelPress, isCancelling, onDeletePress}: SubscriptionCardProps) => {
    const currency = usePreferences((state) => state.currency);
    const canDelete = status === 'cancelled' && !!onDeletePress;

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDeletePress?.();
    };

    return (
        <Pressable
            onPress={onPress}
            onLongPress={canDelete ? handleLongPress : undefined}
            delayLongPress={DELETE_HOLD_MS}
            className={clsx('sub-card', expanded ? 'sub-card-expanded' : 'bg-sheet')}
            style={!expanded && color ? { backgroundColor: color } : undefined}
        >
            <View className="sub-head">
                <View className="sub-main">
                    <Image source={icon} className="sub-icon" />
                    <View className="sub-copy">
                        <Text numberOfLines={1} className="sub-title">
                            {name}
                        </Text>
                        <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
                            {category?.trim() || plan?.trim() || (renewalDate ? formatSubscriptionDateTime(renewalDate) : '')}
                        </Text>
                    </View>
                </View>

                <View className="sub-price-box">
                    <Text className="sub-price">{formatCurrency(price, currency)}</Text>
                    <Text className="sub-billing">{billing}</Text>
                </View>
            </View>

            {expanded && (
                <View className="sub-body">
                    <View className="sub-details">
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Payment:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{paymentMethod?.trim() ?? 'Not provided'}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Category:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{(category?.trim() || plan?.trim()) ?? 'Not provided'}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Started:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{startDate ? formatSubscriptionDateTime(startDate) : 'Not provided'}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Renewal date:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{renewalDate ? formatSubscriptionDateTime(renewalDate) : 'Not provided'}</Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Status:</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">{status ? formatStatusLabel(status) : 'Not provided'}</Text>
                            </View>
                        </View>
                    </View>

                    {onCancelPress && status === 'active' && (
                        <Pressable
                            className={clsx('sub-cancel', isCancelling && 'sub-cancel-disabled')}
                            onPress={onCancelPress}
                            disabled={isCancelling}
                        >
                            <Text className="sub-cancel-text">{isCancelling ? 'Cancelling...' : 'Cancel subscription'}</Text>
                        </Pressable>
                    )}
                </View>
            )}
        </Pressable>
    )
}
export default SubscriptionCard
