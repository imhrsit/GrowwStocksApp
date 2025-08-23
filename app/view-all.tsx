import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
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
    const [allStocks, setAllStocks] = useState<Stock[]>([]);
    const [displayedStocks, setDisplayedStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        loadStocks();
    }, [type]);

    useEffect(() => {
        // Update displayed stocks when page changes
        const startIndex = 0;
        const endIndex = page * ITEMS_PER_PAGE;
        const newDisplayedStocks = allStocks.slice(startIndex, endIndex);
        setDisplayedStocks(newDisplayedStocks);
        setHasMore(endIndex < allStocks.length);
    }, [allStocks, page]);

    const loadStocks = async () => {
        try {
            setLoading(true);

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
            } else if (type === 'active') {
                stockData = data.most_actively_traded.map(item => ({
                    symbol: item.ticker,
                    name: item.ticker,
                    price: parseFloat(item.price),
                    change: parseFloat(item.change_amount),
                    changePercent: parseFloat(item.change_percentage.replace('%', '')),
                    volume: item.volume,
                }));
            }

            setAllStocks(stockData);
            setPage(1); // Reset to first page
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
        loadStocks();
    };

    const handleLoadMore = () => {
        if (hasMore && !loadingMore) {
            setLoadingMore(true);
            setPage(prevPage => prevPage + 1);
            // Small delay to show loading state
            setTimeout(() => setLoadingMore(false), 300);
        }
    };

    const renderStockItem = ({ item }: { item: Stock }) => (
        <StockCard 
            stock={item} 
            onPress={() => {
                router.push({
                    pathname: '/stock-details',
                    params: { symbol: item.symbol }
                });
            }}
        />
    );

    const renderLoadingFooter = () => {
        if (!loadingMore && !hasMore) return null;
        
        return (
            <View style={styles.footerLoading}>
                {loadingMore ? (
                    <Loading text="Loading more..." />
                ) : hasMore ? (
                    <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
                        <ThemedText style={[styles.loadMoreText, { color: Colors[colorScheme ?? 'light'].primary }]}>
                            Load More ({allStocks.length - displayedStocks.length} remaining)
                        </ThemedText>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    if (loading && displayedStocks.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <ThemedView style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{title}</ThemedText>
                    <View style={styles.placeholder} />
                </ThemedView>
                <Loading text="Loading stocks..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedView style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{title}</ThemedText>
                <View style={styles.placeholder} />
            </ThemedView>

            <ThemedView style={styles.content}>
                <ThemedText style={styles.subtitle}>
                    {displayedStocks.length} of {allStocks.length} stocks • Updated now
                </ThemedText>

                <FlatList
                    data={displayedStocks}
                    renderItem={renderStockItem}
                    keyExtractor={(item) => item.symbol}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors[colorScheme ?? 'light'].primary}
                        />
                    }
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 32,
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
        paddingVertical: 4,
    },
    row: {
        justifyContent: 'space-between',
    },
    footerLoading: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    loadMoreButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 179, 134, 0.3)',
        backgroundColor: 'rgba(0, 179, 134, 0.1)',
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});
