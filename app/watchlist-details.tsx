import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/Loading';
import { StockCard } from '@/components/StockCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stock } from '@/types';

interface Watchlist {
    id: string;
    name: string;
    stocks: string[];
}

export default function WatchlistDetailsScreen() {
    const { watchlistId, watchlistName } = useLocalSearchParams<{ 
        watchlistId: string; 
        watchlistName: string; 
    }>();
    const colorScheme = useColorScheme();
    const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (watchlistId) {
            loadWatchlistData();
        }
    }, [watchlistId]);

    const loadWatchlistData = async () => {
        try {
            const storedWatchlists = await AsyncStorage.getItem('watchlists');
            if (storedWatchlists) {
                const watchlists: Watchlist[] = JSON.parse(storedWatchlists);
                const currentWatchlist = watchlists.find(w => w.id === watchlistId);
                
                if (currentWatchlist) {
                    setWatchlist(currentWatchlist);
                    
                    const stockData: Stock[] = currentWatchlist.stocks.map(symbol => ({
                        symbol,
                        name: symbol,
                        price: Math.random() * 200 + 50,
                        change: (Math.random() - 0.5) * 10,
                        changePercent: (Math.random() - 0.5) * 10,
                        volume: Math.floor(Math.random() * 1000000).toString(),
                    }));
                    
                    setStocks(stockData);
                }
            }
        } catch (error) {
            console.error('Error loading watchlist data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadWatchlistData();
    };

    const removeFromWatchlist = async (stockSymbol: string) => {
        try {
            const storedWatchlists = await AsyncStorage.getItem('watchlists');
            if (storedWatchlists && watchlist) {
                const watchlists: Watchlist[] = JSON.parse(storedWatchlists);
                const updatedWatchlists = watchlists.map(w => 
                    w.id === watchlist.id 
                        ? { ...w, stocks: w.stocks.filter(symbol => symbol !== stockSymbol) }
                        : w
                );
                
                await AsyncStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
                
                const updatedWatchlist = updatedWatchlists.find(w => w.id === watchlistId);
                if (updatedWatchlist) {
                    setWatchlist(updatedWatchlist);
                    setStocks(prev => prev.filter(stock => stock.symbol !== stockSymbol));
                }
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            Alert.alert('Error', 'Failed to remove stock from watchlist');
        }
    };

    const handleRemoveStock = (stock: Stock) => {
        Alert.alert(
            'Remove Stock',
            `Are you sure you want to remove ${stock.symbol} from this watchlist?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Remove', 
                    style: 'destructive', 
                    onPress: () => removeFromWatchlist(stock.symbol) 
                }
            ]
        );
    };

    const deleteWatchlist = async () => {
        try {
            const storedWatchlists = await AsyncStorage.getItem('watchlists');
            if (storedWatchlists) {
                const watchlists: Watchlist[] = JSON.parse(storedWatchlists);
                const updatedWatchlists = watchlists.filter(w => w.id !== watchlistId);
                
                await AsyncStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
                router.back();
            }
        } catch (error) {
            console.error('Error deleting watchlist:', error);
            Alert.alert('Error', 'Failed to delete watchlist');
        }
    };

    const handleDeleteWatchlist = () => {
        Alert.alert(
            'Delete Watchlist',
            `Are you sure you want to delete "${watchlistName}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: deleteWatchlist 
                }
            ]
        );
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
            onLongPress={() => handleRemoveStock(item)}
        />
    );

    const renderEmptyState = () => (
        <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="chart.bar" size={80} color={Colors[colorScheme ?? 'light'].icon} />
            <ThemedText style={styles.emptyTitle}>No Stocks in Watchlist</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
                Add stocks to this watchlist from the explore screen
            </ThemedText>
            <TouchableOpacity
                style={[
                    styles.exploreButton,
                    { backgroundColor: Colors[colorScheme ?? 'light'].primary }
                ]}
                onPress={() => {
                    router.push('/(tabs)');
                }}
            >
                <ThemedText style={styles.exploreButtonText}>Explore Stocks</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <ThemedView style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{watchlistName}</ThemedText>
                    <TouchableOpacity onPress={handleDeleteWatchlist} style={styles.deleteButton}>
                        <IconSymbol name="trash" size={20} color={Colors[colorScheme ?? 'light'].danger} />
                    </TouchableOpacity>
                </ThemedView>
                <Loading text="Loading watchlist..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedView style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{watchlistName}</ThemedText>
                <TouchableOpacity onPress={handleDeleteWatchlist} style={styles.deleteButton}>
                    <IconSymbol name="trash" size={20} color={Colors[colorScheme ?? 'light'].danger} />
                </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.content}>
                {stocks.length > 0 ? (
                    <>
                        <ThemedText style={styles.subtitle}>
                            {stocks.length} stocks • Long press to remove
                        </ThemedText>

                        <FlatList
                            data={stocks}
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
                            contentContainerStyle={styles.listContainer}
                        />
                    </>
                ) : (
                    renderEmptyState()
                )}
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
    deleteButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
        lineHeight: 20,
        marginBottom: 24,
    },
    exploreButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    exploreButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
