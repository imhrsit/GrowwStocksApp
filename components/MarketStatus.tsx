import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { alphaVantageAPI } from '@/services/alphaVantageAPI';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

interface MarketStatusData {
    endpoint: string;
    markets: Array<{
        market_type: string;
        region: string;
        primary_exchanges: string;
        local_open: string;
        local_close: string;
        current_status: string;
        notes: string;
    }>;
}

export function MarketStatus() {
    const colorScheme = useColorScheme();
    const [marketData, setMarketData] = useState<MarketStatusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarketStatus();
    }, []);

    const loadMarketStatus = async () => {
        try {
            const data = await alphaVantageAPI.getMarketStatus();
            setMarketData(data);
        } catch (error) {
            console.error('Error loading market status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !marketData) {
        return null;
    }

    const usMarket = marketData.markets?.find(market => 
        market.region === 'United States' && market.market_type === 'Equity'
    );

    if (!usMarket) {
        return null;
    }

    const isOpen = usMarket.current_status === 'open';
    const statusColor = isOpen ? '#10B981' : '#EF4444';
    const statusIcon = isOpen ? 'circle.fill' : 'circle';

    return (
        <ThemedView style={[styles.container, { borderColor: Colors[colorScheme ?? 'light'].border }]}>
            <View style={styles.statusRow}>
                <IconSymbol name={statusIcon} size={12} color={statusColor} />
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                    Market {isOpen ? 'Open' : 'Closed'}
                </ThemedText>
            </View>
            
            <ThemedText style={styles.timeText}>
                {usMarket.local_open} - {usMarket.local_close} ET
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.7,
    },
});
