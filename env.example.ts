export const ENV = {
    ALPHA_VANTAGE_API_KEY: 'your_api_key_here',
    ALPHA_VANTAGE_BASE_URL: 'https://www.alphavantage.co/query',
    CACHE_EXPIRATION_TIME: 300000, // 5 minutes in milliseconds
} as const;

export default ENV;
