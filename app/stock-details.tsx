import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddToWatchlistModal } from '@/components/AddToWatchlistModal';
import { Loading } from '@/components/Loading';
import { NewsCard } from '@/components/NewsCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { alphaVantageAPI, CompanyOverview, GlobalQuote, NewsArticle } from '@/services/alphaVantageAPI';

interface ChartData {
    labels: string[];
    datasets: [
        {
            data: number[];
            color?: (opacity: number) => string;
            strokeWidth?: number;
        }
    ];
}

interface Watchlist {
    id: string;
    name: string;
    stocks: string[];
}

interface StockPriceData {
    price: number;
    change: number;
    changePercent: number;
}

interface EarningsData {
    annualEarnings: any[];
    quarterlyEarnings: any[];
}

export default function StockDetailsScreen() {
    const { symbol } = useLocalSearchParams<{ symbol: string }>();
    const colorScheme = useColorScheme();
    const [companyData, setCompanyData] = useState<CompanyOverview | null>(null);
    const [priceData, setPriceData] = useState<StockPriceData | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [globalQuote, setGlobalQuote] = useState<GlobalQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [showWatchlistModal, setShowWatchlistModal] = useState(false);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);

    useEffect(() => {
        if (symbol) {
            loadStockData();
            checkWatchlistStatus();
            loadWatchlists();
            loadNews();
        }
    }, [symbol]);

    const loadNews = async () => {
        if (!symbol) return;

        try {
            setNewsLoading(true);
            const newsResponse = await alphaVantageAPI.getNews([symbol], undefined, 10);
            setNews(newsResponse.feed || []);
        } catch (error) {
            console.error('Error loading news:', error);
        } finally {
            setNewsLoading(false);
        }
    };

    const loadStockData = async () => {
        if (!symbol) return;

        try {
            setLoading(true);

            // Load multiple data sources in parallel
            const [overview, timeSeriesData, quote, earnings] = await Promise.allSettled([
                alphaVantageAPI.getCompanyOverview(symbol),
                alphaVantageAPI.getIntradayData(symbol, '60min'),
                alphaVantageAPI.getGlobalQuote(symbol),
                alphaVantageAPI.getEarnings(symbol)
            ]);

            // Set company overview
            if (overview.status === 'fulfilled') {
                setCompanyData(overview.value);
            }

            // Set global quote for real-time price, with checks for missing fields
            if (quote.status === 'fulfilled' && quote.value && quote.value['05. price'] !== undefined) {
                setGlobalQuote(quote.value);

                const priceStr = quote.value['05. price'];
                const changeStr = quote.value['09. change'];
                const changePercentStr = quote.value['10. change percent'];

                const currentPrice = priceStr !== undefined ? parseFloat(priceStr) : 0;
                const change = changeStr !== undefined ? parseFloat(changeStr) : 0;
                const changePercent = (changePercentStr && typeof changePercentStr === 'string')
                    ? parseFloat(changePercentStr.replace('%', ''))
                    : 0;

                setPriceData({
                    price: currentPrice,
                    change: change,
                    changePercent: changePercent
                });
            }

            // Set earnings data
            if (earnings.status === 'fulfilled') {
                setEarningsData({
                    annualEarnings: earnings.value?.annualEarnings || [],
                    quarterlyEarnings: earnings.value?.quarterlyEarnings || []
                });
            }

            // Set chart data from intraday
            if (timeSeriesData.status === 'fulfilled' && timeSeriesData.value && timeSeriesData.value['Time Series (60min)']) {
                const timeSeries = timeSeriesData.value['Time Series (60min)'];
                const entries = Object.entries(timeSeries).slice(0, 20).reverse();

                // Fallback price data if global quote failed
                if ((!priceData || priceData.price === 0) && entries.length > 0) {
                    const latestData = entries[entries.length - 1][1] as any;
                    const closeStr = latestData['4. close'];
                    const openStr = latestData['1. open'];
                    const currentPrice = closeStr !== undefined ? parseFloat(closeStr) : 0;
                    const openPrice = openStr !== undefined ? parseFloat(openStr) : 0;
                    const change = currentPrice - openPrice;
                    const changePercent = openPrice !== 0 ? (change / openPrice) * 100 : 0;

                    setPriceData({
                        price: currentPrice,
                        change: change,
                        changePercent: changePercent
                    });
                }

                const chartData: ChartData = {
                    labels: entries.map(([time]) => time.split(' ')[1]?.substring(0, 5) || ''),
                    datasets: [
                        {
                            data: entries.map(([, data]) => {
                                const close = (data as any)['4. close'];
                                return close !== undefined ? parseFloat(close) : 0;
                            }),
                            color: (opacity = 1) => Colors[colorScheme ?? 'light'].primary,
                            strokeWidth: 2,
                        },
                    ],
                };

                setChartData(chartData);
            }
        } catch (error) {
            console.error('Error loading stock data:', error);
            Alert.alert('Error', 'Failed to load stock data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadWatchlists = async () => {
        try {
            const storedWatchlists = await AsyncStorage.getItem('watchlists');
            if (storedWatchlists) {
                setWatchlists(JSON.parse(storedWatchlists));
            }
        } catch (error) {
            console.error('Error loading watchlists:', error);
        }
    };

    const checkWatchlistStatus = async () => {
        try {
            const storedWatchlists = await AsyncStorage.getItem('watchlists');
            if (storedWatchlists && symbol) {
                const watchlists: Watchlist[] = JSON.parse(storedWatchlists);
                const isInAnyWatchlist = watchlists.some(watchlist => 
                    watchlist.stocks.includes(symbol)
                );
                setIsInWatchlist(isInAnyWatchlist);
            }
        } catch (error) {
            console.error('Error checking watchlist status:', error);
        }
    };

    const removeFromWatchlists = async () => {
        try {
            const updatedWatchlists = watchlists.map(watchlist => ({
                ...watchlist,
                stocks: watchlist.stocks.filter(stock => stock !== symbol)
            }));
            
            await AsyncStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
            setWatchlists(updatedWatchlists);
            setIsInWatchlist(false);
            Alert.alert('Success', 'Stock removed from watchlists');
        } catch (error) {
            console.error('Error removing from watchlists:', error);
            Alert.alert('Error', 'Failed to remove from watchlists');
        }
    };

    const handleWatchlistAction = () => {
        if (isInWatchlist) {
            Alert.alert(
                'Remove from Watchlist',
                'Are you sure you want to remove this stock from all watchlists?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: removeFromWatchlists }
                ]
            );
        } else {
            setShowWatchlistModal(true);
        }
    };

    const handleAddToWatchlist = async (selectedWatchlistIds: string[], newWatchlistName?: string) => {
        try {
            let updatedWatchlists = [...watchlists];

            // Create new watchlist if provided
            if (newWatchlistName) {
                const newWatchlist: Watchlist = {
                    id: Date.now().toString(),
                    name: newWatchlistName,
                    stocks: [symbol!]
                };
                updatedWatchlists.push(newWatchlist);
            }

            // Add to selected existing watchlists
            selectedWatchlistIds.forEach(watchlistId => {
                const watchlist = updatedWatchlists.find(w => w.id === watchlistId);
                if (watchlist && !watchlist.stocks.includes(symbol!)) {
                    watchlist.stocks.push(symbol!);
                }
            });

            await AsyncStorage.setItem('watchlists', JSON.stringify(updatedWatchlists));
            setWatchlists(updatedWatchlists);
            setIsInWatchlist(true);
            setShowWatchlistModal(false);
            Alert.alert('Success', 'Stock added to watchlist(s)');
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            Alert.alert('Error', 'Failed to add to watchlist');
        }
    };

    if (loading || !companyData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                    </TouchableOpacity>
                </View>
                <Loading text="Loading stock details..." />
            </SafeAreaView>
        );
    }

    const currentPrice = priceData?.price || 0;
    const priceChange = priceData?.change || 0;
    const changePercent = priceData?.changePercent || 0;
    const isPositive = priceChange >= 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleWatchlistAction} style={styles.watchlistButton}>
                    <IconSymbol 
                        name={isInWatchlist ? "bookmark.fill" : "bookmark"} 
                        size={24} 
                        color={isInWatchlist ? Colors[colorScheme ?? 'light'].primary : Colors[colorScheme ?? 'light'].text} 
                    />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Stock Info Header */}
                <ThemedView style={styles.stockHeader}>
                    <ThemedText style={styles.stockSymbol}>{symbol}</ThemedText>
                    <ThemedText style={styles.companyName}>{companyData.Name}</ThemedText>
                    
                    <View style={styles.priceContainer}>
                        <ThemedText style={styles.currentPrice}>
                            ${currentPrice.toFixed(2)}
                        </ThemedText>
                        <View style={styles.changeContainer}>
                            <ThemedText style={[
                                styles.priceChange,
                                { color: isPositive ? '#10B981' : '#EF4444' }
                            ]}>
                                {isPositive ? '+' : ''}${priceChange.toFixed(2)}
                            </ThemedText>
                            <ThemedText style={[
                                styles.changePercent,
                                { color: isPositive ? '#10B981' : '#EF4444' }
                            ]}>
                                ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                            </ThemedText>
                        </View>
                    </View>
                </ThemedView>

                {/* Chart */}
                {chartData && (
                    <ThemedView style={styles.chartContainer}>
                        <ThemedText style={styles.sectionTitle}>Price Chart (1H)</ThemedText>
                        <LineChart
                            data={chartData}
                            width={Dimensions.get('window').width - 40}
                            height={220}
                            chartConfig={{
                                backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                                backgroundGradientFrom: Colors[colorScheme ?? 'light'].cardBackground,
                                backgroundGradientTo: Colors[colorScheme ?? 'light'].cardBackground,
                                decimalPlaces: 2,
                                color: (opacity = 1) => Colors[colorScheme ?? 'light'].primary,
                                labelColor: (opacity = 1) => Colors[colorScheme ?? 'light'].text,
                                style: {
                                    borderRadius: 16,
                                },
                                propsForDots: {
                                    r: '3',
                                    strokeWidth: '2',
                                    stroke: Colors[colorScheme ?? 'light'].primary,
                                },
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </ThemedView>
                )}

                {/* Key Metrics */}
                <ThemedView style={styles.metricsContainer}>
                    <ThemedText style={styles.sectionTitle}>Key Metrics</ThemedText>
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricLabel}>Market Cap</ThemedText>
                            <ThemedText style={styles.metricValue}>
                                {companyData.MarketCapitalization || 'N/A'}
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricLabel}>P/E Ratio</ThemedText>
                            <ThemedText style={styles.metricValue}>
                                {companyData.PERatio || 'N/A'}
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricLabel}>52W High</ThemedText>
                            <ThemedText style={styles.metricValue}>
                                ${companyData['52WeekHigh'] || 'N/A'}
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricLabel}>52W Low</ThemedText>
                            <ThemedText style={styles.metricValue}>
                                ${companyData['52WeekLow'] || 'N/A'}
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricLabel}>Dividend Yield</ThemedText>
                            <ThemedText style={styles.metricValue}>
                                {companyData.DividendYield ? `${(parseFloat(companyData.DividendYield) * 100).toFixed(2)}%` : 'N/A'}
                            </ThemedText>
                        </View>
                        <View style={styles.metricItem}>
                            <ThemedText style={styles.metricLabel}>Industry</ThemedText>
                            <ThemedText style={styles.metricValue}>
                                {companyData.Industry || 'N/A'}
                            </ThemedText>
                        </View>
                    </View>
                </ThemedView>

                {/* Earnings Data */}
                {earningsData && earningsData.quarterlyEarnings && earningsData.quarterlyEarnings.length > 0 && (
                    <ThemedView style={styles.earningsContainer}>
                        <ThemedText style={styles.sectionTitle}>Recent Earnings</ThemedText>
                        <View style={styles.earningsGrid}>
                            {earningsData.quarterlyEarnings.slice(0, 4).map((earnings: any, index: number) => (
                                <View key={index} style={styles.earningsItem}>
                                    <ThemedText style={styles.earningsQuarter}>
                                        {earnings.fiscalDateEnding || 'N/A'}
                                    </ThemedText>
                                    <ThemedText style={styles.earningsEPS}>
                                        EPS: ${earnings.reportedEPS || 'N/A'}
                                    </ThemedText>
                                    <ThemedText style={styles.earningsRevenue}>
                                        Revenue: ${earnings.totalRevenue ? (parseFloat(earnings.totalRevenue) / 1000000).toFixed(0) + 'M' : 'N/A'}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    </ThemedView>
                )}

                {/* Stock News */}
                <ThemedView style={styles.newsContainer}>
                    <ThemedText style={styles.sectionTitle}>Latest News</ThemedText>
                    {newsLoading ? (
                        <View style={styles.newsLoadingContainer}>
                            <Loading text="Loading news..." />
                        </View>
                    ) : news.length > 0 ? (
                        <FlatList
                            data={news.slice(0, 5)}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => <NewsCard article={item} compact={true} />}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <ThemedText style={styles.noNewsText}>No recent news available</ThemedText>
                    )}
                </ThemedView>

                {/* About Company */}
                <ThemedView style={styles.aboutContainer}>
                    <ThemedText style={styles.sectionTitle}>About {companyData.Name}</ThemedText>
                    <ThemedText style={styles.aboutText}>
                        <ThemedText style={styles.aboutLabel}>Industry: </ThemedText>
                        {companyData.Industry}
                    </ThemedText>
                    <ThemedText style={styles.aboutText}>
                        <ThemedText style={styles.aboutLabel}>Sector: </ThemedText>
                        {companyData.Sector}
                    </ThemedText>
                    {companyData.Description && (
                        <ThemedText style={styles.description}>
                            {companyData.Description}
                        </ThemedText>
                    )}
                </ThemedView>
            </ScrollView>

            <AddToWatchlistModal
                visible={showWatchlistModal}
                onClose={() => setShowWatchlistModal(false)}
                onAddToWatchlist={handleAddToWatchlist}
                watchlists={watchlists}
                stockSymbol={symbol || ''}
            />
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
    watchlistButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    stockHeader: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    stockSymbol: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
        marginTop: 5,
    },
    companyName: {
        fontSize: 16,
        opacity: 0.7,
        marginBottom: 16,
        textAlign: 'center',
    },
    priceContainer: {
        alignItems: 'center',
    },
    currentPrice: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 2,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceChange: {
        fontSize: 16,
        fontWeight: '600',
    },
    changePercent: {
        fontSize: 16,
        fontWeight: '600',
    },
    chartContainer: {
        paddingVertical: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    chart: {
        borderRadius: 16,
    },
    metricsContainer: {
        paddingVertical: 20,
        marginBottom: 20,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    metricItem: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        backgroundColor: 'rgba(0, 179, 134, 0.1)',
        borderRadius: 12,
    },
    metricLabel: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    aboutContainer: {
        paddingVertical: 20,
        marginBottom: 40,
    },
    aboutText: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    aboutLabel: {
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 12,
        opacity: 0.8,
    },
    earningsContainer: {
        paddingVertical: 20,
        marginBottom: 20,
    },
    earningsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    earningsItem: {
        flex: 1,
        minWidth: '45%',
        padding: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
    },
    earningsQuarter: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        opacity: 0.8,
    },
    earningsEPS: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    earningsRevenue: {
        fontSize: 12,
        opacity: 0.7,
    },
    newsContainer: {
        paddingVertical: 20,
        marginBottom: 40,
    },
    newsLoadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    noNewsText: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center',
        paddingVertical: 20,
    },
});
