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

type TimeFilter = '1H' | '1Y' | '3Y' | '5Y' | '10Y';

export default function StockDetailsScreen() {
    const { symbol } = useLocalSearchParams<{ symbol: string }>();
    const colorScheme = useColorScheme();
    const [companyData, setCompanyData] = useState<CompanyOverview | null>(null);
    const [priceData, setPriceData] = useState<StockPriceData | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [globalQuote, setGlobalQuote] = useState<GlobalQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [showWatchlistModal, setShowWatchlistModal] = useState(false);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [newsLoading, setNewsLoading] = useState(false);
    const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('1H');
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (symbol) {
            loadStockData();
            checkWatchlistStatus();
            loadWatchlists();
            loadNews();
            checkFavoriteStatus();
            loadChartData(selectedTimeFilter);
        }
    }, [symbol]);

    useEffect(() => {
        if (symbol && companyData) {
            loadChartData(selectedTimeFilter);
        }
    }, [selectedTimeFilter]);

    const loadChartData = async (timeFilter: TimeFilter) => {
        if (!symbol) return;

        try {
            setChartLoading(true);

            let timeSeriesData;
            let dataKey;
            let labelFormat;
            let dataLimit;

            switch (timeFilter) {
                case '1H':
                    timeSeriesData = await alphaVantageAPI.getIntradayData(symbol, '60min');
                    dataKey = 'Time Series (60min)';
                    labelFormat = (time: string) => time.split(' ')[1]?.substring(0, 5) || '';
                    dataLimit = 20;
                    break;
                case '1Y':
                    timeSeriesData = await alphaVantageAPI.getDailyData(symbol);
                    dataKey = 'Time Series (Daily)';
                    labelFormat = (time: string) => {
                        const date = new Date(time);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                    };
                    dataLimit = 250; 
                    break;
                case '3Y':
                    timeSeriesData = await alphaVantageAPI.getWeeklyData(symbol);
                    dataKey = 'Weekly Time Series';
                    labelFormat = (time: string) => {
                        const date = new Date(time);
                        return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                    };
                    dataLimit = 156;
                    break;
                case '5Y':
                    timeSeriesData = await alphaVantageAPI.getWeeklyData(symbol);
                    dataKey = 'Weekly Time Series';
                    labelFormat = (time: string) => {
                        const date = new Date(time);
                        return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                    };
                    dataLimit = 260;
                    break;
                case '10Y':
                    timeSeriesData = await alphaVantageAPI.getMonthlyData(symbol);
                    dataKey = 'Monthly Time Series';
                    labelFormat = (time: string) => {
                        const date = new Date(time);
                        return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                    };
                    dataLimit = 120;
                    break;
                default:
                    return;
            }

            if (timeSeriesData && timeSeriesData[dataKey]) {
                const timeSeries = timeSeriesData[dataKey];
                const entries = Object.entries(timeSeries).slice(0, dataLimit).reverse();

                const labelStep = Math.max(1, Math.floor(entries.length / 6));
                const labels = entries.map(([time], index) => 
                    index % labelStep === 0 ? labelFormat(time) : ''
                );

                const chartData: ChartData = {
                    labels,
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
            console.error('Error loading chart data:', error);
        } finally {
            setChartLoading(false);
        }
    };

    const checkFavoriteStatus = async () => {
        try {
            const storedFavorites = await AsyncStorage.getItem('favorites');
            if (storedFavorites && symbol) {
                const favorites: string[] = JSON.parse(storedFavorites);
                setIsFavorite(favorites.includes(symbol));
            } else {
                setIsFavorite(false);
            }
        } catch (error) {
            setIsFavorite(false);
        }
    };

    const handleFavoriteToggle = async () => {
        try {
            const storedFavorites = await AsyncStorage.getItem('favorites');
            let favorites: string[] = storedFavorites ? JSON.parse(storedFavorites) : [];
            if (isFavorite) {
                favorites = favorites.filter(fav => fav !== symbol);
            } else {
                if (!favorites.includes(symbol!)) favorites.push(symbol!);
            }
            await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
            setIsFavorite(!isFavorite);
        } catch (error) {
            Alert.alert('Error', 'Failed to update favorites');
        }
    };

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

            const [overview, quote, earnings] = await Promise.allSettled([
                alphaVantageAPI.getCompanyOverview(symbol),
                alphaVantageAPI.getGlobalQuote(symbol),
                alphaVantageAPI.getEarnings(symbol)
            ]);

            if (overview.status === 'fulfilled') {
                setCompanyData(overview.value);
            }

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

            if (earnings.status === 'fulfilled') {
                setEarningsData({
                    annualEarnings: earnings.value?.annualEarnings || [],
                    quarterlyEarnings: earnings.value?.quarterlyEarnings || []
                });
            }

        } catch (error) {
            console.error('Error loading stock data:', error);
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

            if (newWatchlistName) {
                const newWatchlist: Watchlist = {
                    id: Date.now().toString(),
                    name: newWatchlistName,
                    stocks: [symbol!]
                };
                updatedWatchlists.push(newWatchlist);
            }

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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleFavoriteToggle} style={styles.favoriteButton}>
                        <IconSymbol 
                            name={isFavorite ? "star.fill" : "star"}
                            size={24}
                            color={isFavorite ? Colors[colorScheme ?? 'light'].warning : Colors[colorScheme ?? 'light'].icon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleWatchlistAction} style={styles.watchlistButton}>
                        <IconSymbol 
                            name={isInWatchlist ? "bookmark.fill" : "bookmark"} 
                            size={24} 
                            color={isInWatchlist ? Colors[colorScheme ?? 'light'].primary : Colors[colorScheme ?? 'light'].text} 
                        />
                    </TouchableOpacity>
                </View>
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
                <ThemedView style={styles.chartContainer}>
                    <ThemedText style={styles.sectionTitle}>Price Chart ({selectedTimeFilter})</ThemedText>
                    
                    {chartData ? (
                        <View style={[styles.chartWrapper, chartLoading && { opacity: 0.5 }]}>
                            <LineChart
                                data={chartData}
                                width={Dimensions.get('window').width - 40}
                                height={240}
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
                                    propsForLabels: {
                                        fontSize: 10,
                                    },
                                }}
                                bezier
                                style={styles.chart}
                                withHorizontalLabels={true}
                                withVerticalLabels={true}
                                withInnerLines={false}
                                withOuterLines={false}
                                verticalLabelRotation={0}
                                horizontalLabelRotation={0}
                                fromZero={false}
                            />
                            
                            {/* Loading Overlay */}
                            {chartLoading && (
                                <View style={styles.chartLoadingOverlay}>
                                    <View style={styles.chartLoadingIndicator}>
                                        <Loading text="Updating chart..." />
                                    </View>
                                </View>
                            )}
                        </View>
                    ) : !chartLoading ? (
                        <View style={styles.chartErrorContainer}>
                            <ThemedText style={styles.chartErrorText}>
                                Chart data not available
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.chartLoadingContainer}>
                            <Loading text="Loading chart..." />
                        </View>
                    )}
                    
                    {/* Time Filter Buttons */}
                    <View style={styles.timeFilterContainer}>
                        {(['1H', '1Y', '3Y', '5Y', '10Y'] as TimeFilter[]).map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.timeFilterButton,
                                    selectedTimeFilter === filter && styles.timeFilterButtonActive,
                                    { 
                                        backgroundColor: selectedTimeFilter === filter 
                                            ? Colors[colorScheme ?? 'light'].primary 
                                            : 'transparent',
                                        borderColor: Colors[colorScheme ?? 'light'].primary,
                                    }
                                ]}
                                onPress={() => setSelectedTimeFilter(filter)}
                                disabled={chartLoading}
                            >
                                <ThemedText 
                                    style={[
                                        styles.timeFilterButtonText,
                                        selectedTimeFilter === filter && styles.timeFilterButtonTextActive,
                                        { 
                                            color: selectedTimeFilter === filter 
                                                ? '#FFFFFF'
                                                : Colors[colorScheme ?? 'light'].primary
                                        }
                                    ]}
                                >
                                    {filter}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ThemedView>

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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
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
    favoriteButton: {
        padding: 8,
        marginRight: 2,
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
    chartWrapper: {
        position: 'relative',
    },
    chartLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 16,
    },
    chartLoadingIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
    chartLoadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        height: 240,
    },
    chartErrorContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        height: 240,
    },
    chartErrorText: {
        fontSize: 14,
        opacity: 0.6,
        textAlign: 'center',
    },
    timeFilterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 8,
    },
    timeFilterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        minWidth: 50,
        alignItems: 'center',
    },
    timeFilterButtonActive: {
    },
    timeFilterButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    timeFilterButtonTextActive: {
    },
});
