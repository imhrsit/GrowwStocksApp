import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stock } from '@/types';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface StockCardProps {
    stock: Stock;
    onPress?: () => void;
    style?: any;
}

export function StockCard({ stock, onPress, style }: StockCardProps) {
    const colorScheme = useColorScheme();
    const isPositive = stock.change >= 0;

    const changeColor = isPositive
        ? Colors[colorScheme ?? 'light'].success
        : Colors[colorScheme ?? 'light'].danger;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.symbolContainer}>
                    <View style={[styles.symbolIcon, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
                        <ThemedText style={styles.symbolText}>
                            {stock.symbol.charAt(0)}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <ThemedText style={styles.symbol} numberOfLines={1}>
                    {stock.symbol}
                </ThemedText>
                <ThemedText style={styles.name} numberOfLines={1}>
                    {stock.name}
                </ThemedText>

                <View style={styles.priceContainer}>
                    <ThemedText style={styles.price}>
                        ${stock.price.toFixed(2)}
                    </ThemedText>
                    <View style={[styles.changeContainer, { backgroundColor: changeColor }]}>
                        <ThemedText style={styles.changeText}>
                            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 12,
        margin: 6,
        minHeight: 120,
        flex: 1,
        maxWidth: '47%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    symbolContainer: {
        flex: 1,
    },
    symbolIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    symbolText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    symbol: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    name: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 8,
    },
    priceContainer: {
        marginTop: 'auto',
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    changeContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    changeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});
