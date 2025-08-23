import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Linking,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/Loading';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { alphaVantageAPI, NewsArticle } from '@/services/alphaVantageAPI';

export default function NewsScreen() {
    const colorScheme = useColorScheme();
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('general');

    const categories = [
        { key: 'general', label: 'General', topics: undefined },
        { key: 'tech', label: 'Technology', topics: ['technology'] },
        { key: 'finance', label: 'Finance', topics: ['finance'] },
        { key: 'earnings', label: 'Earnings', topics: ['earnings'] },
        { key: 'ipo', label: 'IPO', topics: ['ipo'] },
    ];

    useEffect(() => {
        loadNews();
    }, [selectedCategory]);

    const loadNews = async () => {
        try {
            setLoading(articles.length === 0);
            
            const selectedCategoryData = categories.find(cat => cat.key === selectedCategory);
            const newsData = await alphaVantageAPI.getNews(
                undefined, // No specific tickers for general news
                selectedCategoryData?.topics,
                20
            );

            if (newsData && newsData.feed) {
                setArticles(newsData.feed);
            }
        } catch (error) {
            console.error('Error loading news:', error);
            Alert.alert('Error', 'Failed to load news. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNews();
    };

    const openArticle = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open this link');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open article');
        }
    };

    const formatTimeAgo = (timeString: string) => {
        const articleTime = new Date(timeString.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - articleTime.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment.toLowerCase()) {
            case 'bullish':
            case 'somewhat-bullish':
                return '#10B981';
            case 'bearish':
            case 'somewhat-bearish':
                return '#EF4444';
            default:
                return Colors[colorScheme ?? 'light'].text;
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment.toLowerCase()) {
            case 'bullish':
            case 'somewhat-bullish':
                return 'arrow.up';
            case 'bearish':
            case 'somewhat-bearish':
                return 'arrow.down';
            default:
                return 'minus';
        }
    };

    const renderNewsItem = ({ item }: { item: NewsArticle }) => (
        <TouchableOpacity 
            style={[styles.newsCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}
            onPress={() => openArticle(item.url)}
        >
            {item.banner_image && (
                <Image 
                    source={{ uri: item.banner_image }} 
                    style={styles.newsImage}
                    resizeMode="cover"
                />
            )}
            
            <View style={styles.newsContent}>
                <View style={styles.newsHeader}>
                    <ThemedText style={styles.newsSource}>{item.source}</ThemedText>
                    <ThemedText style={styles.newsTime}>{formatTimeAgo(item.time_published)}</ThemedText>
                </View>
                
                <ThemedText style={styles.newsTitle} numberOfLines={3}>
                    {item.title}
                </ThemedText>
                
                <ThemedText style={styles.newsSummary} numberOfLines={3}>
                    {item.summary}
                </ThemedText>
                
                <View style={styles.newsFooter}>
                    <View style={styles.sentimentContainer}>
                        <IconSymbol 
                            name={getSentimentIcon(item.overall_sentiment_label)} 
                            size={14} 
                            color={getSentimentColor(item.overall_sentiment_label)} 
                        />
                        <ThemedText style={[
                            styles.sentimentText, 
                            { color: getSentimentColor(item.overall_sentiment_label) }
                        ]}>
                            {item.overall_sentiment_label.replace('-', ' ')}
                        </ThemedText>
                    </View>
                    
                    {item.authors && item.authors.length > 0 && (
                        <ThemedText style={styles.authorText}>
                            {item.authors[0]}
                        </ThemedText>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCategoryFilter = () => (
        <View style={styles.categoryContainer}>
            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryButton,
                            {
                                backgroundColor: selectedCategory === item.key 
                                    ? Colors[colorScheme ?? 'light'].primary 
                                    : Colors[colorScheme ?? 'light'].cardBackground
                            }
                        ]}
                        onPress={() => setSelectedCategory(item.key)}
                    >
                        <ThemedText style={[
                            styles.categoryText,
                            {
                                color: selectedCategory === item.key 
                                    ? '#FFFFFF' 
                                    : Colors[colorScheme ?? 'light'].text
                            }
                        ]}>
                            {item.label}
                        </ThemedText>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.categoryList}
            />
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <ThemedView style={styles.header}>
                    <ThemedText type="title">Market News</ThemedText>
                    <ThemeToggle />
                </ThemedView>
                <Loading text="Loading news..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedView style={styles.header}>
                <ThemedText type="title">Market News</ThemedText>
                <ThemeToggle />
            </ThemedView>

            {renderCategoryFilter()}

            <FlatList
                data={articles}
                renderItem={renderNewsItem}
                keyExtractor={(item, index) => `${item.url}-${index}`}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors[colorScheme ?? 'light'].primary}
                    />
                }
                contentContainerStyle={styles.newsList}
                showsVerticalScrollIndicator={false}
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    categoryContainer: {
        paddingVertical: 12,
    },
    categoryList: {
        paddingHorizontal: 20,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    newsList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    newsCard: {
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    newsImage: {
        width: '100%',
        height: 200,
    },
    newsContent: {
        padding: 16,
    },
    newsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    newsSource: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.7,
        textTransform: 'uppercase',
    },
    newsTime: {
        fontSize: 12,
        opacity: 0.5,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 22,
        marginBottom: 8,
    },
    newsSummary: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
        marginBottom: 12,
    },
    newsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sentimentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sentimentText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    authorText: {
        fontSize: 12,
        opacity: 0.6,
        fontStyle: 'italic',
    },
});
