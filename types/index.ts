export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: string;
}

export interface Watchlist {
    id: string;
    name: string;
    stocks: Stock[];
    createdAt: Date;
    updatedAt: Date;
}

export interface MarketData {
    topGainers: Stock[];
    topLosers: Stock[];
    mostActive: Stock[];
}

export interface StockDetails {
    symbol: string;
    name: string;
    description: string;
    industry: string;
    sector: string;
    marketCap: string;
    peRatio: string;
    dividendYield: string;
    fiftyTwoWeekHigh: string;
    fiftyTwoWeekLow: string;
    currentPrice: number;
    change: number;
    changePercent: number;
}

export interface ChartData {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface SearchResult {
    symbol: string;
    name: string;
    type: string;
    region: string;
    marketOpen: string;
    marketClose: string;
    timezone: string;
    currency: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    loading: boolean;
}
