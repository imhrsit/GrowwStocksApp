
import { StockCard } from '@/components/StockCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { alphaVantageAPI, CompanyOverview } from '@/services/alphaVantageAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [stocks, setStocks] = useState<CompanyOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      const favs: string[] = storedFavorites ? JSON.parse(storedFavorites) : [];
      setFavorites(favs);
      if (favs.length > 0) {
        // Fetch company overviews in parallel
        const results = await Promise.allSettled(
          favs.map(symbol => alphaVantageAPI.getCompanyOverview(symbol))
        );
        setStocks(
          results
            .map((r, i) => (r.status === 'fulfilled' ? { ...r.value, Symbol: favs[i] } : null))
            .filter(Boolean) as CompanyOverview[]
        );
      } else {
        setStocks([]);
      }
    } catch (error) {
      setStocks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleStockPress = (symbol: string, name: string) => {
    router.push({ pathname: '/stock-details', params: { symbol, name } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      <ThemedView style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText type="title">Favorites</ThemedText>
          <ThemeToggle />
        </View>
      </ThemedView>
      {favorites.length === 0 && !loading ? (
        <FlatList
          key="empty-list"
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol 
                name="star.fill" 
                size={64} 
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>No Favorites Yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Tap the star on a stock to add it here for quick access
              </ThemedText>
            </View>
          }
          contentContainerStyle={styles.emptyScrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? 'light'].primary}
            />
          }
        />
      ) : (
        <FlatList
          key="stocks-list"
          data={stocks}
          renderItem={({ item }) => (
            <StockCard
              stock={{ symbol: item.Symbol, name: item.Name, price: 0, change: 0, changePercent: 0 }}
              onPress={() => handleStockPress(item.Symbol, item.Name)}
            />
          )}
          keyExtractor={item => item.Symbol}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? 'light'].primary}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '80%',
    paddingBottom: 70,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
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
  listContainer: {
    paddingBottom: 20,
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
});
