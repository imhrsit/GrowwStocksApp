import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [topGainers, setTopGainers] = useState<Stock[]>([]);
  const [topLosers, setTopLosers] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      const data = await alphaVantageAPI.getTopGainersLosers();
      
      const gainers = data.top_gainers.slice(0, 4).map(item => ({
        symbol: item.ticker,
        name: item.ticker,
        price: parseFloat(item.price),
        change: parseFloat(item.change_amount),
        changePercent: parseFloat(item.change_percentage.replace('%', '')),
        volume: item.volume,
      }));

      const losers = data.top_losers.slice(0, 4).map(item => ({
        symbol: item.ticker,
        name: item.ticker,
        price: parseFloat(item.price),
        change: parseFloat(item.change_amount),
        changePercent: parseFloat(item.change_percentage.replace('%', '')),
        volume: item.volume,
      }));

      setTopGainers(gainers);
      setTopLosers(losers);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarketData();
  };

  const renderStockCard = ({ item }: { item: Stock }) => (
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

  const renderSection = (title: string, data: Stock[], onViewAll: () => void) => (
    <ThemedView style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
          <ThemedText style={[styles.viewAllText, { color: Colors[colorScheme ?? 'light'].primary }]}>
            View All
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={data}
        renderItem={renderStockCard}
        keyExtractor={(item) => item.symbol}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
      />
    </ThemedView>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Loading text="Loading market data..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Stocks App</ThemedText>
        
        <View style={[styles.searchContainer, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors[colorScheme ?? 'light'].icon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="Search here..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
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
        {renderSection('Top Gainers', topGainers, () => {
          router.push({
            pathname: '/view-all',
            params: { type: 'gainers', title: 'Top Gainers' }
          });
        })}
        
        {renderSection('Top Losers', topLosers, () => {
          router.push({
            pathname: '/view-all',
            params: { type: 'losers', title: 'Top Losers' }
          });
        })}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  grid: {
    paddingVertical: 4,
  },
  row: {
    justifyContent: 'space-between',
  },
});
