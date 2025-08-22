# Groww Stocks App �

A React Native stocks trading platform, featuring real-time market data from Alpha Vantage API.

## Features

- 📊 Real-time stock market data (Top Gainers/Losers)
- 📝 Multiple watchlists management
- 🔍 Stock search functionality
- 📱 Clean, Groww-inspired UI design
- 💾 Local data caching with AsyncStorage
- 🌙 Light/Dark theme support
- 🔧 Environment configuration via TypeScript (no dotenv dependency)

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Create an `env.ts` file in the root directory:
   ```bash
   cp env.example.ts env.ts
   ```
   
   Then edit `env.ts` and add your Alpha Vantage API key:
   ```typescript
   export const ENV = {
       ALPHA_VANTAGE_API_KEY: 'your_api_key_here',
       ALPHA_VANTAGE_BASE_URL: 'https://www.alphavantage.co/query',
       CACHE_EXPIRATION_TIME: 300000, // 5 minutes in milliseconds
   } as const;

   export default ENV;
   ```
   
   Get your free API key from: [Alpha Vantage](https://www.alphavantage.co/support/#api-key)

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## Architecture

- Environment variables are managed via a TypeScript file (`env.ts`) instead of traditional `.env` files for better Router compatibility
- API responses are cached locally to reduce API calls and improve performance
- Clean separation of concerns with dedicated services, components, and type definitions