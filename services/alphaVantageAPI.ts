import { ALPHA_VANTAGE_API_KEY, ALPHA_VANTAGE_BASE_URL, CACHE_EXPIRATION_TIME } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Cache expiration time (in milliseconds) - default to 5 minutes if not set
const CACHE_EXPIRATION = parseInt(CACHE_EXPIRATION_TIME) || 5 * 60 * 1000;

export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

export interface CompanyOverview {
    Symbol: string;
    Name: string;
    Description: string;
    Industry: string;
    Sector: string;
    MarketCapitalization: string;
    PERatio: string;
    DividendYield: string;
    '52WeekHigh': string;
    '52WeekLow': string;
}

export interface TopGainersLosers {
    top_gainers: Array<{
        ticker: string;
        price: string;
        change_amount: string;
        change_percentage: string;
        volume: string;
    }>;
    top_losers: Array<{
        ticker: string;
        price: string;
        change_amount: string;
        change_percentage: string;
        volume: string;
    }>;
    most_actively_traded: Array<{
        ticker: string;
        price: string;
        change_amount: string;
        change_percentage: string;
        volume: string;
    }>;
}

class AlphaVantageAPI {
    private async getCachedData<T>(key: string): Promise<T | null> {
        try {
            const cached = await AsyncStorage.getItem(key);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRATION) {
                    return data as T;
                }
                // Remove expired cache
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Error reading cache:', error);
        }
        return null;
    }

    private async setCachedData<T>(key: string, data: T): Promise<void> {
        try {
            const cacheObject = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(key, JSON.stringify(cacheObject));
        } catch (error) {
            console.error('Error setting cache:', error);
        }
    }

    async getTopGainersLosers(): Promise<TopGainersLosers> {
        const cacheKey = 'top_gainers_losers';

        // Check cache first
        const cachedData = await this.getCachedData<TopGainersLosers>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TOP_GAINERS_LOSERS',
                    apikey: ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            // Cache the response
            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching top gainers/losers:', error);
            throw new Error('Failed to fetch market data');
        }
    }

    async getCompanyOverview(symbol: string): Promise<CompanyOverview> {
        const cacheKey = `company_overview_${symbol}`;

        // Check cache first
        const cachedData = await this.getCachedData<CompanyOverview>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'OVERVIEW',
                    symbol: symbol,
                    apikey: ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            // Cache the response
            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching company overview:', error);
            throw new Error('Failed to fetch company data');
        }
    }

    async searchSymbol(keywords: string): Promise<any> {
        const cacheKey = `symbol_search_${keywords}`;

        // Check cache first
        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords: keywords,
                    apikey: ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            // Cache the response for a shorter time (1 minute for search)
            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error searching symbols:', error);
            throw new Error('Failed to search symbols');
        }
    }

    async getIntradayData(symbol: string, interval: string = '5min'): Promise<any> {
        const cacheKey = `intraday_${symbol}_${interval}`;

        // Check cache first
        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_INTRADAY',
                    symbol: symbol,
                    interval: interval,
                    apikey: ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            // Cache the response
            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching intraday data:', error);
            throw new Error('Failed to fetch stock data');
        }
    }
}

export const alphaVantageAPI = new AlphaVantageAPI();
