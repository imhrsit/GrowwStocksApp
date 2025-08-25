import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { APIError, APIErrorType } from '@/services/alphaVantageAPI';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

interface ErrorDisplayProps {
    error: APIError | Error | null;
    onRetry?: () => void;
    showRetryButton?: boolean;
    compact?: boolean;
    customMessage?: string;
}

export function ErrorDisplay({ 
    error, 
    onRetry, 
    showRetryButton = true, 
    compact = false,
    customMessage 
}: ErrorDisplayProps) {
    const colorScheme = useColorScheme();

    if (!error) return null;

    const getErrorMessage = (error: APIError | Error): string => {
        if (customMessage) return customMessage;

        if (error instanceof APIError) {
            switch (error.type) {
                case APIErrorType.RATE_LIMIT:
                    return 'API rate limit reached. Please try again in a few minutes.';
                case APIErrorType.NETWORK_ERROR:
                    return 'Network connection failed. Please check your internet connection.';
                case APIErrorType.INVALID_API_KEY:
                    return 'Service configuration error. Please contact support.';
                case APIErrorType.DATA_NOT_AVAILABLE:
                    return 'Data not available for this request.';
                case APIErrorType.TIMEOUT:
                    return 'Request timed out. Please try again.';
                default:
                    return 'An unexpected error occurred. Please try again.';
            }
        }

        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('connection')) {
            return 'Network connection failed. Please check your internet connection.';
        }
        if (message.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }
        if (message.includes('cannot read property') && message.includes('slice')) {
            return 'Data format error. This may be due to API limits. Please try again later.';
        }
        
        return 'Unable to load data. Please try again.';
    };

    const getErrorIcon = (error: APIError | Error): any => {
        if (error instanceof APIError) {
            switch (error.type) {
                case APIErrorType.RATE_LIMIT:
                    return 'clock';
                case APIErrorType.NETWORK_ERROR:
                case APIErrorType.TIMEOUT:
                    return 'wifi.slash';
                case APIErrorType.DATA_NOT_AVAILABLE:
                    return 'exclamationmark.triangle';
                default:
                    return 'exclamationmark.circle';
            }
        }
        return 'exclamationmark.circle';
    };

    const shouldShowRetryButton = (): boolean => {
        if (!showRetryButton || !onRetry) return false;
        
        if (error instanceof APIError) {
            return error.type !== APIErrorType.INVALID_API_KEY;
        }
        
        return true;
    };

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        }
    };

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <IconSymbol 
                    name={getErrorIcon(error) as any} 
                    size={16} 
                    color={Colors[colorScheme ?? 'light'].danger} 
                />
                <ThemedText style={[styles.compactText, { color: Colors[colorScheme ?? 'light'].danger }]}>
                    {getErrorMessage(error)}
                </ThemedText>
                {shouldShowRetryButton() && (
                    <TouchableOpacity onPress={handleRetry} style={styles.compactRetryButton}>
                        <ThemedText style={[styles.compactRetryText, { color: Colors[colorScheme ?? 'light'].primary }]}>
                            Retry
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <ThemedView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <View style={styles.iconContainer}>
                <IconSymbol 
                    name={getErrorIcon(error) as any} 
                    size={48} 
                    color={Colors[colorScheme ?? 'light'].danger} 
                />
            </View>
            
            <ThemedText style={styles.title}>Oops! Something went wrong</ThemedText>
            
            <ThemedText style={styles.message}>
                {getErrorMessage(error)}
            </ThemedText>

            {shouldShowRetryButton() && (
                <TouchableOpacity 
                    onPress={handleRetry} 
                    style={[styles.retryButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
                >
                    <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
                </TouchableOpacity>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        margin: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.8,
        lineHeight: 20,
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 8,
    },
    compactText: {
        fontSize: 12,
        flex: 1,
    },
    compactRetryButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    compactRetryText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
