import React from 'react';
import { Alert, Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { NewsArticle } from '@/services/alphaVantageAPI';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

interface NewsCardProps {
    article: NewsArticle;
    compact?: boolean;
}

export function NewsCard({ article, compact = false }: NewsCardProps) {
    const colorScheme = useColorScheme();

    const openArticle = async () => {
        try {
            const supported = await Linking.canOpenURL(article.url);
            if (supported) {
                await Linking.openURL(article.url);
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

    return (
        <TouchableOpacity 
            style={[
                compact ? styles.compactCard : styles.fullCard, 
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            onPress={openArticle}
        >
            {!compact && article.banner_image && (
                <Image 
                    source={{ uri: article.banner_image }} 
                    style={styles.newsImage}
                    resizeMode="cover"
                />
            )}
            
            <View style={styles.newsContent}>
                <View style={styles.newsHeader}>
                    <ThemedText style={styles.newsSource}>{article.source}</ThemedText>
                    <ThemedText style={styles.newsTime}>{formatTimeAgo(article.time_published)}</ThemedText>
                </View>
                
                <ThemedText 
                    style={styles.newsTitle} 
                    numberOfLines={compact ? 2 : 3}
                >
                    {article.title}
                </ThemedText>
                
                {!compact && (
                    <ThemedText style={styles.newsSummary} numberOfLines={2}>
                        {article.summary}
                    </ThemedText>
                )}
                
                <View style={styles.newsFooter}>
                    <View style={styles.sentimentContainer}>
                        <IconSymbol 
                            name={getSentimentIcon(article.overall_sentiment_label)} 
                            size={12} 
                            color={getSentimentColor(article.overall_sentiment_label)} 
                        />
                        <ThemedText style={[
                            styles.sentimentText, 
                            { color: getSentimentColor(article.overall_sentiment_label) }
                        ]}>
                            {article.overall_sentiment_label.replace('-', ' ')}
                        </ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fullCard: {
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    compactCard: {
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    newsImage: {
        width: '100%',
        height: 160,
    },
    newsContent: {
        padding: 12,
    },
    newsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    newsSource: {
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.7,
        textTransform: 'uppercase',
    },
    newsTime: {
        fontSize: 11,
        opacity: 0.5,
    },
    newsTitle: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
        marginBottom: 6,
    },
    newsSummary: {
        fontSize: 12,
        lineHeight: 16,
        opacity: 0.8,
        marginBottom: 8,
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
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 3,
        textTransform: 'capitalize',
    },
});
