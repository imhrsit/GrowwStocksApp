import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingProps {
    text?: string;
    size?: 'small' | 'large';
}

export function Loading({ text = 'Loading...', size = 'large' }: LoadingProps) {
    const colorScheme = useColorScheme();

    return (
        <ThemedView style={styles.container}>
            <ActivityIndicator
                size={size}
                color={Colors[colorScheme ?? 'light'].primary}
            />
            {text && (
                <ThemedText style={styles.text}>
                    {text}
                </ThemedText>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        opacity: 0.7,
    },
});
