# Groww Stocks App �

A React Native stocks trading platform, featuring real-time market data from Alpha Vantage API.

## Features

- 📊 Real-time stock market data (Top Gainers/Losers)
- 📝 Multiple watchlists management
- 🔍 Stock search functionality
- 📱 Clean, Groww-inspired UI design
- 💾 Local data caching with AsyncStorage
- 🌙 Light/Dark theme support

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Alpha Vantage API key:
   ```
   ALPHA_VANTAGE_API_KEY=your_api_key_here
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
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo