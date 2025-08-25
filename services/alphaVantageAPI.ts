import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { ENV } from '../env';

const CACHE_EXPIRATION = ENV.CACHE_EXPIRATION_TIME;

enum APIErrorType {
    RATE_LIMIT = 'RATE_LIMIT',
    NETWORK_ERROR = 'NETWORK_ERROR',
    INVALID_API_KEY = 'INVALID_API_KEY',
    DATA_NOT_AVAILABLE = 'DATA_NOT_AVAILABLE',
    TIMEOUT = 'TIMEOUT',
    UNKNOWN = 'UNKNOWN'
}

class APIError extends Error {
    type: APIErrorType;
    retryAfter?: number;
    originalError?: any;

    constructor(message: string, type: APIErrorType, retryAfter?: number, originalError?: any) {
        super(message);
        this.name = 'APIError';
        this.type = type;
        this.retryAfter = retryAfter;
        this.originalError = originalError;
    }
}

interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

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
    private defaultRetryConfig: RetryConfig = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
    };

    private rateLimitRetryConfig: RetryConfig = {
        maxRetries: 2,
        baseDelay: 60000, // 1 minute
        maxDelay: 300000, // 5 minutes
        backoffMultiplier: 2
    };

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private calculateRetryDelay(attempt: number, config: RetryConfig): number {
        const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        return Math.min(delay, config.maxDelay);
    }

    private detectErrorType(error: any, data: any): APIError {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return new APIError('Request timeout', APIErrorType.TIMEOUT, undefined, error);
        }

        if (!error.response) {
            return new APIError('Network connection failed', APIErrorType.NETWORK_ERROR, undefined, error);
        }

        if (data) {
            if (data.Information && data.Information.includes('API call frequency')) {
                return new APIError(
                    'API rate limit exceeded. Please try again later.',
                    APIErrorType.RATE_LIMIT,
                    3600, // 1 hour
                    error
                );
            }

            // Daily quota exceeded
            if (data.Information && data.Information.includes('daily quota')) {
                return new APIError(
                    'Daily API quota exceeded. Please try again tomorrow.',
                    APIErrorType.RATE_LIMIT,
                    86400, // 24 hours
                    error
                );
            }

            // Invalid API key
            if (data.Information && data.Information.includes('API key')) {
                return new APIError('Invalid API key', APIErrorType.INVALID_API_KEY, undefined, error);
            }

            // Data not available
            if (data['Error Message']) {
                return new APIError(
                    data['Error Message'],
                    APIErrorType.DATA_NOT_AVAILABLE,
                    undefined,
                    error
                );
            }

            // Data not available
            if (data.Note && data.Note.includes('premium')) {
                return new APIError(
                    'This data requires a premium API key',
                    APIErrorType.DATA_NOT_AVAILABLE,
                    undefined,
                    error
                );
            }
        }

        // HTTP status code errors
        if (error.response?.status >= 500) {
            return new APIError('Server error', APIErrorType.NETWORK_ERROR, undefined, error);
        }

        if (error.response?.status === 429) {
            return new APIError('Too many requests', APIErrorType.RATE_LIMIT, 3600, error);
        }

        return new APIError('Unknown error occurred', APIErrorType.UNKNOWN, undefined, error);
    }

    private async makeRequestWithRetry<T>(
        requestFn: () => Promise<any>,
        customRetryConfig?: Partial<RetryConfig>
    ): Promise<T> {
        const config = { ...this.defaultRetryConfig, ...customRetryConfig };
        let lastError: APIError;

        for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
            try {
                const response = await requestFn();
                const data = response.data;

                const apiError = this.detectErrorType(null, data);
                if (apiError.type !== APIErrorType.UNKNOWN) {
                    throw apiError;
                }

                return data;
            } catch (error) {
                if (error instanceof APIError) {
                    lastError = error;
                } else {
                    lastError = this.detectErrorType(error, (error as AxiosError)?.response?.data);
                }

                console.error(`API request attempt ${attempt} failed:`, lastError.message);

                if (lastError.type === APIErrorType.INVALID_API_KEY || 
                    lastError.type === APIErrorType.DATA_NOT_AVAILABLE) {
                    throw lastError;
                }

                if (attempt > config.maxRetries) {
                    throw lastError;
                }

                let retryDelay: number;
                if (lastError.type === APIErrorType.RATE_LIMIT) {
                    const rateLimitConfig = { ...this.rateLimitRetryConfig, ...customRetryConfig };
                    retryDelay = this.calculateRetryDelay(attempt, rateLimitConfig);
                    
                    if (lastError.retryAfter) {
                        retryDelay = Math.min(lastError.retryAfter * 1000, rateLimitConfig.maxDelay);
                    }
                } else {
                    retryDelay = this.calculateRetryDelay(attempt, config);
                }

                console.log(`Retrying in ${retryDelay / 1000} seconds... (attempt ${attempt}/${config.maxRetries})`);
                await this.sleep(retryDelay);
            }
        }

        throw lastError!;
    }

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

    private async getFromCacheOrFetch<T>(
        cacheKey: string,
        fetchFn: () => Promise<T>,
        customRetryConfig?: Partial<RetryConfig>
    ): Promise<T> {
        const cachedData = await this.getCachedData<T>(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const data = await this.makeRequestWithRetry<T>(fetchFn, customRetryConfig);
            await this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            try {
                const expiredCache = await AsyncStorage.getItem(cacheKey);
                if (expiredCache) {
                    const { data } = JSON.parse(expiredCache);
                    console.warn('Using expired cache data due to API error:', error);
                    return data as T;
                }
            } catch (cacheError) {
                console.error('Failed to read expired cache:', cacheError);
            }
            
            throw error;
        }
    }

    async getTopGainersLosers(): Promise<TopGainersLosers> {
        const cacheKey = 'top_gainers_losers';

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TOP_GAINERS_LOSERS',
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 15000,
            }),
            { maxRetries: 2 }
        );
    }

    async getCompanyOverview(symbol: string): Promise<CompanyOverview> {
        const cacheKey = `company_overview_${symbol}`;

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'OVERVIEW',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 15000,
            })
        );
    }

    async searchSymbol(keywords: string): Promise<any> {
        const cacheKey = `symbol_search_${keywords}`;

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords: keywords,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 15000,
            }),
            { maxRetries: 1 }
        );
    }

    async getIntradayData(symbol: string, interval: string = '5min'): Promise<any> {
        const cacheKey = `intraday_${symbol}_${interval}`;

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_INTRADAY',
                    symbol: symbol,
                    interval: interval,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 20000,
            })
        );
    }

    async getNews(tickers?: string[], topics?: string[], limit: number = 50): Promise<NewsResponse> {
        const cacheKey = `news_${tickers?.join(',') || 'general'}_${topics?.join(',') || 'general'}_${limit}`;

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

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params,
                timeout: 20000,
            }),
            { maxRetries: 2 }
        );
    }

    async getGlobalQuote(symbol: string): Promise<GlobalQuote> {
        const cacheKey = `global_quote_${symbol}`;

        const responseData = await this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 15000,
            })
        );

        if (responseData && (responseData as any)['Global Quote']) {
            return (responseData as any)['Global Quote'];
        }
        
        throw new APIError(
            'Global quote data not available for this symbol',
            APIErrorType.DATA_NOT_AVAILABLE
        );
    }

    async getMarketStatus(): Promise<any> {
        const cacheKey = 'market_status';

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'MARKET_STATUS',
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 15000,
            }),
            { maxRetries: 1 }
        );
    }

    async getEarnings(symbol: string): Promise<any> {
        const cacheKey = `earnings_${symbol}`;

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'EARNINGS',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 15000,
            })
        );
    }

    async getDailyData(symbol: string): Promise<any> {
        const cacheKey = `daily_${symbol}`;

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_DAILY',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 20000,
            })
        );
    }

    async getWeeklyData(symbol: string): Promise<any> {
        const cacheKey = `weekly_${symbol}`;

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_WEEKLY',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 20000,
            })
        );
    }

    async getMonthlyData(symbol: string): Promise<any> {
        const cacheKey = `monthly_${symbol}`;

        return this.getFromCacheOrFetch(
            cacheKey,
            () => axios.get(ENV.ALPHA_VANTAGE_BASE_URL, {
                params: {
                    function: 'TIME_SERIES_MONTHLY',
                    symbol: symbol,
                    apikey: ENV.ALPHA_VANTAGE_API_KEY,
                },
                timeout: 20000,
            })
        );
    }
}

export const alphaVantageAPI = new AlphaVantageAPI();

export { APIError, APIErrorType };
