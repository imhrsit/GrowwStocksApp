import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Watchlist {
    id: string;
    name: string;
    stocks: Stock[];
}

interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

export default function WatchlistScreen() {
    const colorScheme = useColorScheme();
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadWatchlists();
    }, []);

    // Reload watchlists when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadWatchlists();
        }, [])
    );

    const loadWatchlists = async () => {
        try {
            const storedWatchlists = await AsyncStorage.getItem('watchlists');
            if (storedWatchlists) {
                setWatchlists(JSON.parse(storedWatchlists));
            }
        } catch (error) {
            console.error('Error loading watchlists:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadWatchlists();
    };

    const deleteWatchlist = async (watchlistId: string) => {
        try {
            const storedWatchlists = await AsyncStorage.getItem('watchlists');
            if (storedWatchlists) {
                const watchlists: Watchlist[] = JSON.parse(storedWatchlists);
                const updatedWatchlists = watchlists.filter(w => w.id !== watchlistId);
                await AsyncStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
                setWatchlists(updatedWatchlists);
            }
        } catch (error) {
            console.error('Error deleting watchlist:', error);
            Alert.alert('Error', 'Failed to delete watchlist');
        }
    };

    const handleDeleteWatchlist = (watchlist: Watchlist) => {
        Alert.alert(
            'Delete Watchlist',
            `Are you sure you want to delete "${watchlist.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive', 
                    onPress: () => deleteWatchlist(watchlist.id) 
                }
            ]
        );
    };

    const renderEmptyState = () => (
        <ThemedView style={styles.emptyContainer}>
            <IconSymbol name="heart" size={80} color={Colors[colorScheme ?? 'light'].icon} />
            <ThemedText style={styles.emptyTitle}>No Watchlists Yet</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
                Start building your watchlist by adding stocks from the explore screen
            </ThemedText>
        </ThemedView>
    );

    const renderWatchlistItem = (watchlist: Watchlist) => (
        <TouchableOpacity
            key={watchlist.id}
            style={[
                styles.watchlistItem,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            onPress={() => {
                router.push({
                    pathname: '/watchlist-details',
                    params: { 
                        watchlistId: watchlist.id,
                        watchlistName: watchlist.name 
                    }
                });
            }}
            onLongPress={() => handleDeleteWatchlist(watchlist)}
        >
            <View style={styles.watchlistHeader}>
                <ThemedText style={styles.watchlistName}>{watchlist.name}</ThemedText>
                <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].icon} />
            </View>
            <ThemedText style={styles.stockCount}>
                {watchlist.stocks.length} stocks
            </ThemedText>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <ThemedView style={styles.loadingContainer}>
                    <ThemedText>Loading watchlists...</ThemedText>
                </ThemedView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedView style={styles.header}>
                <ThemedText type="title">Watchlist</ThemedText>
            </ThemedView>

            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors[colorScheme ?? 'light'].primary}
                    />
                }
            >
                {watchlists.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View style={styles.watchlistsContainer}>
                        {watchlists.map(renderWatchlistItem)}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    watchlistsContainer: {
        paddingVertical: 8,
    },
    watchlistItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    watchlistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    watchlistName: {
        fontSize: 16,
        fontWeight: '600',
    },
    stockCount: {
        fontSize: 14,
        opacity: 0.7,
    },
});
