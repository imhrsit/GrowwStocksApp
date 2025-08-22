import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/Loading';
import { StockCard } from '@/components/StockCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { alphaVantageAPI } from '@/services/alphaVantageAPI';
import { Stock } from '@/types';

export default function ViewAllScreen() {
    const { type, title } = useLocalSearchParams<{ type: string; title: string }>();
    const colorScheme = useColorScheme();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadStocks();
    }, [type]);

    const loadStocks = async (pageNum = 1, append = false) => {
        try {
            if (!append) {
                setLoading(true);
            }

            const data = await alphaVantageAPI.getTopGainersLosers();
            
            let stockData: Stock[] = [];
            
            if (type === 'gainers') {
                stockData = data.top_gainers.map(item => ({
                    symbol: item.ticker,
                    name: item.ticker,
                    price: parseFloat(item.price),
                    change: parseFloat(item.change_amount),
                    changePercent: parseFloat(item.change_percentage.replace('%', '')),
                    volume: item.volume,
                }));
            } else if (type === 'losers') {
                stockData = data.top_losers.map(item => ({
                    symbol: item.ticker,
                    name: item.ticker,
                    price: parseFloat(item.price),
                    change: parseFloat(item.change_amount),
                    changePercent: parseFloat(item.change_percentage.replace('%', '')),
                    volume: item.volume,
                }));
            }

            if (append) {
                setStocks(prev => [...prev, ...stockData]);
            } else {
                setStocks(stockData);
            }

            setHasMore(false);
            setPage(pageNum);
        } catch (error) {
            console.error('Error loading stocks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadStocks(1, false);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading) {
            loadStocks(page + 1, true);
        }
    };

    const renderStockItem = ({ item }: { item: Stock }) => (
        <View style={styles.stockItemContainer}>
            <StockCard 
                stock={item} 
                onPress={() => {
                    router.push({
                        pathname: '/stock-details',
                        params: { symbol: item.symbol }
                    });
                }}
                style={styles.stockCard}
            />
        </View>
    );

    const renderLoadingFooter = () => {
        if (!hasMore || !loading) return null;
        
        return (
            <View style={styles.footerLoading}>
                <Loading text="Loading more..." />
            </View>
        );
    };

    if (loading && stocks.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{title}</ThemedText>
                    <View style={styles.placeholder} />
                </View>
                <Loading text="Loading stocks..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{title}</ThemedText>
                <View style={styles.placeholder} />
            </View>

            <ThemedView style={styles.content}>
                <ThemedText style={styles.subtitle}>
                    {stocks.length} stocks • Updated now
                </ThemedText>

                <FlatList
                    data={stocks}
                    renderItem={renderStockItem}
                    keyExtractor={(item) => item.symbol}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderLoadingFooter}
                    contentContainerStyle={styles.listContainer}
                />
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 16,
    },
    listContainer: {
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
    },
    stockItemContainer: {
        flex: 1,
        paddingHorizontal: 4,
        marginBottom: 12,
    },
    stockCard: {
        flex: 1,
    },
    footerLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
