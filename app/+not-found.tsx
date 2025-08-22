import { Link, Stack, router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Page Not Found',
          headerStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
          },
          headerTintColor: Colors[colorScheme ?? 'light'].text,
        }} 
      />
      <ThemedView style={styles.container}>
        <View style={styles.iconContainer}>
          <IconSymbol 
            name="exclamationmark.triangle" 
            size={80} 
            color={Colors[colorScheme ?? 'light'].warning} 
          />
        </View>
        
        <ThemedText style={styles.title}>Oops! Page Not Found</ThemedText>
        <ThemedText style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </ThemedText>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={() => router.replace('/')}
          >
            <IconSymbol name="house.fill" size={18} color="white" />
            <ThemedText style={styles.primaryButtonText}>Go to Home</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={() => router.replace('/(tabs)/watchlist')}
          >
            <IconSymbol name="heart.fill" size={18} color={Colors[colorScheme ?? 'light'].primary} />
            <ThemedText style={[styles.secondaryButtonText, { color: Colors[colorScheme ?? 'light'].primary }]}>
              View Watchlist
            </ThemedText>
          </TouchableOpacity>
        </View>

        <Link href="/" style={styles.linkContainer}>
          <ThemedText style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].primary }]}>
            Or tap here to go back
          </ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    marginTop: 12,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
