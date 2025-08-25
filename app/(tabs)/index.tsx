import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Loading } from '@/components/Loading';
import { MarketStatus } from '@/components/MarketStatus';
import { StockCard } from '@/components/StockCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { alphaVantageAPI, APIError } from '@/services/alphaVantageAPI';
import { Stock } from '@/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [topGainers, setTopGainers] = useState<Stock[]>([]);
  const [topLosers, setTopLosers] = useState<Stock[]>([]);
  const [mostActive, setMostActive] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [error, setError] = useState<APIError | Error | null>(null);
  const [searchError, setSearchError] = useState<APIError | Error | null>(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);
    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const loadMarketData = async () => {
    try {
      setError(null);
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

      const active = data.most_actively_traded.slice(0, 4).map(item => ({
        symbol: item.ticker,
        name: item.ticker,
        price: parseFloat(item.price),
        change: parseFloat(item.change_amount),
        changePercent: parseFloat(item.change_percentage.replace('%', '')),
        volume: item.volume,
      }));

      setTopGainers(gainers);
      setTopLosers(losers);
      setMostActive(active);
    } catch (error) {
      console.error('Error loading market data:', error);
      setError(error as APIError | Error);
      
      if (!error || !(error as any).message?.includes('expired cache')) {
        setTopGainers([]);
        setTopLosers([]);
        setMostActive([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setSearchLoading(true);
      setShowSearchResults(true);
      setSearchError(null);
      
      const searchData = await alphaVantageAPI.searchSymbol(query);
      
      if (searchData && searchData.bestMatches) {
        const results: Stock[] = searchData.bestMatches.slice(0, 10).map((match: any) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          price: Math.random() * 200 + 50,
          change: (Math.random() - 0.5) * 10,
          changePercent: (Math.random() - 0.5) * 10,
          volume: Math.floor(Math.random() * 1000000).toString(),
        }));
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchError(error as APIError | Error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      setShowSearchResults(false);
      setSearchResults([]);
      setSearchError(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchError(null);
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
        {data.length > 0 && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <ThemedText style={[styles.viewAllText, { color: Colors[colorScheme ?? 'light'].primary }]}>
              View All
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      {data.length > 0 ? (
        <FlatList
          data={data}
          renderItem={renderStockCard}
          keyExtractor={(item) => item.symbol}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
        />
      ) : (
        <ThemedView style={styles.emptySection}>
          <ThemedText style={styles.emptySectionText}>
            No data available
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  console.log('HomeScreen render:', { 
    loading, 
    hasError: !!error, 
    errorMessage: error?.message,
    gainersLength: topGainers.length, 
    losersLength: topLosers.length, 
    activeLength: mostActive.length 
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Loading text="Loading market data..." />
      </SafeAreaView>
    );
  }

  if (error && topGainers.length === 0 && topLosers.length === 0 && mostActive.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ThemedView style={styles.header}>
          <View style={styles.titleRow}>
            <ThemedText type="title">Stocks App</ThemedText>
            <ThemeToggle />
          </View>
        </ThemedView>
        <View style={styles.errorContainer}>
          <ErrorDisplay 
            error={error} 
            onRetry={loadMarketData}
            customMessage="Unable to load market data. Please check your connection and try again."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ThemedView style={styles.header}>
        <View style={styles.titleRow}>
          <ThemedText type="title">Stocks App</ThemedText>
          <ThemeToggle />
        </View>
        
        <View style={[styles.searchContainer, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors[colorScheme ?? 'light'].icon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="Search stocks..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
            value={searchQuery}
            onChangeText={handleSearchInputChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <IconSymbol name="xmark.circle.fill" size={20} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>

      <MarketStatus />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].primary}
          />
        }
      >
        {showSearchResults ? (
          <ThemedView style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Search Results
                {searchLoading && <ThemedText style={styles.loadingText}> (Loading...)</ThemedText>}
              </ThemedText>
              {searchResults.length > 0 && (
                <ThemedText style={styles.resultCount}>
                  {searchResults.length} results
                </ThemedText>
              )}
            </View>
            
            {searchError ? (
              <ErrorDisplay 
                error={searchError} 
                onRetry={() => performSearch(searchQuery.trim())}
                compact={true}
                customMessage="Search failed. Please try again."
              />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderStockCard}
                keyExtractor={(item) => item.symbol}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.grid}
              />
            ) : !searchLoading ? (
              <ThemedView style={styles.emptySearchContainer}>
                <IconSymbol name="magnifyingglass" size={60} color={Colors[colorScheme ?? 'light'].icon} />
                <ThemedText style={styles.emptySearchTitle}>No stocks found</ThemedText>
                <ThemedText style={styles.emptySearchSubtitle}>
                  Try searching for a different stock symbol or company name
                </ThemedText>
              </ThemedView>
            ) : null}
          </ThemedView>
        ) : (
          <>
            {/* Show error banner if there's an error */}
            {error && (
              <ErrorDisplay 
                error={error} 
                onRetry={loadMarketData}
                compact={true}
                customMessage={topGainers.length === 0 && topLosers.length === 0 && mostActive.length === 0 
                  ? "Failed to load market data. Please try again." 
                  : "Showing cached data. Tap retry for latest updates."
                }
              />
            )}
            
            {/* Only show sections if we have data or if there's no error */}
            {(topGainers.length > 0 || topLosers.length > 0 || mostActive.length > 0 || !error) && (
              <>
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

                {renderSection('Most Active', mostActive, () => {
                  router.push({
                    pathname: '/view-all',
                    params: { type: 'active', title: 'Most Active' }
                  });
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
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
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: 'normal',
  },
  resultCount: {
    fontSize: 14,
    opacity: 0.7,
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
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptySection: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});