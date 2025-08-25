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
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadMarketStatus();
        
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        
        return () => clearInterval(interval);
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

    const isMarketOpenByTime = () => {
        const now = new Date();
        
        const dayOfWeek = now.getDay();
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return false;
        }
        
        const hours = now.getHours();
        const isOpen = hours >= 9 && hours < 16;
        
        // console.log('Market Status Check:', {
        //     currentTime: now.toISOString(),
        //     dayOfWeek,
        //     hours,
        //     isWeekday: dayOfWeek >= 1 && dayOfWeek <= 5,
        //     isBusinessHours: hours >= 9 && hours < 16,
        //     isOpen
        // });
        
        return isOpen;
    };

    if (loading || !marketData) {
        const isOpenByTime = isMarketOpenByTime();
        const statusColor = isOpenByTime ? '#10B981' : '#EF4444';
        const statusIcon = isOpenByTime ? 'circle.fill' : 'circle';
        
        return (
            <ThemedView style={[styles.container, { borderColor: Colors[colorScheme ?? 'light'].border }]}>
                <View style={styles.statusRow}>
                    <IconSymbol name={statusIcon as any} size={12} color={statusColor} />
                    <ThemedText style={[styles.statusText, { color: statusColor }]}>
                        Market {isOpenByTime ? 'Open' : 'Closed'}
                    </ThemedText>
                </View>
                
                <ThemedText style={styles.timeText}>
                    9:30 AM - 4:00 PM ET
                </ThemedText>
            </ThemedView>
        );
    }

    const usMarket = marketData.markets?.find(market => 
        market.region === 'United States' && market.market_type === 'Equity'
    );

    if (!usMarket) {
        const isOpenByTime = isMarketOpenByTime();
        const statusColor = isOpenByTime ? '#10B981' : '#EF4444';
        const statusIcon = isOpenByTime ? 'circle.fill' : 'circle';
        
        return (
            <ThemedView style={[styles.container, { borderColor: Colors[colorScheme ?? 'light'].border }]}>
                <View style={styles.statusRow}>
                    <IconSymbol name={statusIcon} size={12} color={statusColor} />
                    <ThemedText style={[styles.statusText, { color: statusColor }]}>
                        Market {isOpenByTime ? 'Open' : 'Closed'}
                    </ThemedText>
                </View>
                
                <ThemedText style={styles.timeText}>
                    9:30 AM - 4:00 PM ET
                </ThemedText>
            </ThemedView>
        );
    }

    const apiIsOpen = usMarket.current_status === 'open';
    const timeBasedIsOpen = isMarketOpenByTime();
    
    const isOpen = timeBasedIsOpen || apiIsOpen;
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
    fallbackText: {
        fontSize: 12,
        opacity: 0.5,
        marginLeft: 4,
    },
});
