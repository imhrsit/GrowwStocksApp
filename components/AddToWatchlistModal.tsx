import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Watchlist {
    id: string;
    name: string;
    stocks: string[];
}

interface AddToWatchlistModalProps {
    visible: boolean;
    onClose: () => void;
    onAddToWatchlist: (selectedWatchlistIds: string[], newWatchlistName?: string) => void;
    watchlists: Watchlist[];
    stockSymbol: string;
}

export const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
    visible,
    onClose,
    onAddToWatchlist,
    watchlists,
    stockSymbol,
}) => {
    const colorScheme = useColorScheme();
    const [selectedWatchlists, setSelectedWatchlists] = useState<string[]>([]);
    const [newWatchlistName, setNewWatchlistName] = useState('');
    const [showCreateNew, setShowCreateNew] = useState(false);

    const handleToggleWatchlist = (watchlistId: string) => {
        setSelectedWatchlists(prev => 
            prev.includes(watchlistId) 
                ? prev.filter(id => id !== watchlistId)
                : [...prev, watchlistId]
        );
    };

    const handleSubmit = () => {
        if (selectedWatchlists.length === 0 && !newWatchlistName.trim()) {
            Alert.alert('Error', 'Please select a watchlist or create a new one');
            return;
        }

        onAddToWatchlist(selectedWatchlists, newWatchlistName.trim() || undefined);
        
        // Reset form
        setSelectedWatchlists([]);
        setNewWatchlistName('');
        setShowCreateNew(false);
    };

    const handleClose = () => {
        setSelectedWatchlists([]);
        setNewWatchlistName('');
        setShowCreateNew(false);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <ThemedView style={[
                    styles.container,
                    { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
                ]}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>Add {stockSymbol} to Watchlist</ThemedText>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={20} color={Colors[colorScheme ?? 'light'].text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Existing Watchlists */}
                        {watchlists.length > 0 && (
                            <View style={styles.section}>
                                <ThemedText style={styles.sectionTitle}>Select Existing Watchlists</ThemedText>
                                {watchlists.map((watchlist) => {
                                    const isSelected = selectedWatchlists.includes(watchlist.id);
                                    const alreadyContains = watchlist.stocks.includes(stockSymbol);
                                    
                                    return (
                                        <TouchableOpacity
                                            key={watchlist.id}
                                            style={[
                                                styles.watchlistItem,
                                                { 
                                                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                                                    borderColor: isSelected ? Colors[colorScheme ?? 'light'].primary : Colors[colorScheme ?? 'light'].border,
                                                    opacity: alreadyContains ? 0.5 : 1,
                                                }
                                            ]}
                                            onPress={() => !alreadyContains && handleToggleWatchlist(watchlist.id)}
                                            disabled={alreadyContains}
                                        >
                                            <View style={styles.watchlistInfo}>
                                                <ThemedText style={styles.watchlistName}>
                                                    {watchlist.name}
                                                </ThemedText>
                                                <ThemedText style={styles.stockCount}>
                                                    {watchlist.stocks.length} stocks
                                                    {alreadyContains && ' • Already added'}
                                                </ThemedText>
                                            </View>
                                            {!alreadyContains && (
                                                <View style={[
                                                    styles.checkbox,
                                                    { 
                                                        borderColor: Colors[colorScheme ?? 'light'].border,
                                                        backgroundColor: isSelected ? Colors[colorScheme ?? 'light'].primary : 'transparent'
                                                    }
                                                ]}>
                                                    {isSelected && (
                                                        <IconSymbol name="checkmark" size={16} color="white" />
                                                    )}
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* Create New Watchlist */}
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={styles.createNewButton}
                                onPress={() => setShowCreateNew(!showCreateNew)}
                            >
                                <IconSymbol 
                                    name="plus" 
                                    size={20} 
                                    color={Colors[colorScheme ?? 'light'].primary} 
                                />
                                <ThemedText style={[
                                    styles.createNewText,
                                    { color: Colors[colorScheme ?? 'light'].primary }
                                ]}>
                                    Create New Watchlist
                                </ThemedText>
                            </TouchableOpacity>

                            {showCreateNew && (
                                <View style={styles.createNewForm}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            { 
                                                backgroundColor: Colors[colorScheme ?? 'light'].background,
                                                borderColor: Colors[colorScheme ?? 'light'].border,
                                                color: Colors[colorScheme ?? 'light'].text,
                                            }
                                        ]}
                                        placeholder="Enter watchlist name"
                                        placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
                                        value={newWatchlistName}
                                        onChangeText={setNewWatchlistName}
                                        autoFocus
                                    />
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.addButton,
                                { backgroundColor: Colors[colorScheme ?? 'light'].primary }
                            ]}
                            onPress={handleSubmit}
                        >
                            <ThemedText style={styles.addButtonText}>Add to Watchlist</ThemedText>
                        </TouchableOpacity>
                    </View>
                </ThemedView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    watchlistItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    watchlistInfo: {
        flex: 1,
    },
    watchlistName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    stockCount: {
        fontSize: 14,
        opacity: 0.7,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    createNewText: {
        fontSize: 16,
        fontWeight: '500',
    },
    createNewForm: {
        marginTop: 12,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    addButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
