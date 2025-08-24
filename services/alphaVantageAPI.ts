import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { ENV } from '../env';

const CACHE_EXPIRATION = ENV.CACHE_EXPIRATION_TIME;

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

export interface NewsArticle {
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image?: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: Array<{
        topic: string;
        relevance_score: string;
    }>;
    overall_sentiment_score: number;
    overall_sentiment_label: string;
    ticker_sentiment?: Array<{
        ticker: string;
        relevance_score: string;
        ticker_sentiment_score: string;
        ticker_sentiment_label: string;
    }>;
}

export interface NewsResponse {
    items: string;
    sentiment_score_definition: string;
    relevance_score_definition: string;
    feed: NewsArticle[];
}

export interface GlobalQuote {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
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

        const cachedData = await this.getCachedData<TopGainersLosers>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TOP_GAINERS_LOSERS',
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching top gainers/losers:', error);
            throw new Error('Failed to fetch market data');
        }
    }

    async getCompanyOverview(symbol: string): Promise<CompanyOverview> {
        const cacheKey = `company_overview_${symbol}`;

        const cachedData = await this.getCachedData<CompanyOverview>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'OVERVIEW',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching company overview:', error);
            throw new Error('Failed to fetch company data');
        }
    }

    async searchSymbol(keywords: string): Promise<any> {
        const cacheKey = `symbol_search_${keywords}`;

        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords: keywords,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error searching symbols:', error);
            throw new Error('Failed to search symbols');
        }
    }

    async getIntradayData(symbol: string, interval: string = '5min'): Promise<any> {
        const cacheKey = `intraday_${symbol}_${interval}`;

        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_INTRADAY',
                    symbol: symbol,
                    interval: interval,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching intraday data:', error);
            throw new Error('Failed to fetch stock data');
        }
    }

    async getNews(tickers?: string[], topics?: string[], limit: number = 50): Promise<NewsResponse> {
        const cacheKey = `news_${tickers?.join(',') || 'general'}_${topics?.join(',') || 'general'}_${limit}`;

        const cachedData = await this.getCachedData<NewsResponse>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const params: any = {
                function: 'NEWS_SENTIMENT',
                apikey: ENV.ALPHA_VANTAGE_API_KEY,
                limit: limit.toString(),
                sort: 'LATEST',
            };

            if (tickers && tickers.length > 0) {
                params.tickers = tickers.join(',');
            }

            if (topics && topics.length > 0) {
                params.topics = topics.join(',');
            }

            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params,
                timeout: 15000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching news:', error);
            throw new Error('Failed to fetch news data');
        }
    }

    async getGlobalQuote(symbol: string): Promise<GlobalQuote> {
        const cacheKey = `global_quote_${symbol}`;

        const cachedData = await this.getCachedData<GlobalQuote>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data['Global Quote'];

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching global quote:', error);
            throw new Error('Failed to fetch quote data');
        }
    }

    async getMarketStatus(): Promise<any> {
        const cacheKey = 'market_status';

        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'MARKET_STATUS',
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching market status:', error);
            throw new Error('Failed to fetch market status');
        }
    }

    async getEarnings(symbol: string): Promise<any> {
        const cacheKey = `earnings_${symbol}`;

        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'EARNINGS',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching earnings:', error);
            throw new Error('Failed to fetch earnings data');
        }
    }

    async getDailyData(symbol: string): Promise<any> {
        const cacheKey = `daily_${symbol}`;

        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_DAILY',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching daily data:', error);
            throw new Error('Failed to fetch daily stock data');
        }
    }

    async getWeeklyData(symbol: string): Promise<any> {
        const cacheKey = `weekly_${symbol}`;

        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_WEEKLY',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching weekly data:', error);
            throw new Error('Failed to fetch weekly stock data');
        }
    }

    async getMonthlyData(symbol: string): Promise<any> {
        const cacheKey = `monthly_${symbol}`;

        const cachedData = await this.getCachedData<any>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const response = await axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_MONTHLY',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 10000,
            });

            const data = response.data;

            await this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            console.error('Error fetching monthly data:', error);
            throw new Error('Failed to fetch monthly stock data');
        }
    }
}

export const alphaVantageAPI = new AlphaVantageAPI();
