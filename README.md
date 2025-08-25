# 📈 Groww Stocks App

A React Native stocks/ etfs broking platform, featuring real-time market data from Alpha Vantage API.

<div align="center">
  <img src="https://drive.google.com/file/d/1iv8HpBbV5uiTHfNNwZmOTGcJdsN_kc26/view?usp=sharing" alt="Market Dashboard" width="200"/>
  <img src="https://drive.google.com/file/d/1NbNJD8e3v06dON7mcZd8ZAV5uM6C5bjS/view?usp=sharing" alt="Stock Details" width="200"/>
  <img src="https://drive.google.com/file/d/15LZePfYo7fpD7ZZXDKPRkerwHKFR1cw6/view?usp=sharing" alt="Favorites" width="200"/>
  <img src="https://drive.google.com/file/d/1PSw6wx6G4P63NUQui6sUYgvFJgEsb77j/view?usp=sharing" alt="News Feed" width="200"/>
</div>

## ✨ Features

### 🏠 **Market Dashboard**
- 📊 Real-time market data with Top Gainers/Losers
- � Market status indicator (Open/Closed with trading hours)
- 🎯 Most actively traded stocks
- 📱 Clean, intuitive Groww-inspired UI design

### ⭐ **Favorites & Watchlists**
- 📋 Create and manage multiple custom watchlists
- ⭐ Quick favorites system for instant access
- ➕ Easy stock addition with smart modal interface
- 🔄 Real-time price updates for tracked stocks

### 📰 **Financial News**
- 📺 Latest market news with sentiment analysis
- 🎯 Company-specific news filtering
- 📊 Bullish/Bearish sentiment indicators
- 🖼️ Rich news cards with images and summaries
- 🔗 Direct links to full articles

### 🔍 **Stock Analysis**
- 🏢 Comprehensive company overviews
- 📈 Multiple timeframe charts (Intraday, Daily, Weekly, Monthly)
- � Key financial metrics (P/E ratio, Market Cap, Dividend Yield)
- 📊 52-week high/low tracking
- 💼 Sector and industry information

### 🎨 **User Experience**
- 🌙 Adaptive Light/Dark theme support
- � Native iOS/Android optimized interface
- ⚡ Smart caching for improved performance
- 🎪 Haptic feedback for enhanced interaction
- 🔄 Pull-to-refresh functionality

### 🛠️ **Technical Features**
- 💾 Local data caching with AsyncStorage
- 🔧 TypeScript-first environment configuration
- ⚡ Optimized API calls with intelligent caching
- 🔐 Secure API key management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- iOS Simulator / Android Emulator (optional)

### Installation

1. **Clone & Install Dependencies**
   ```bash
   git clone <repository-url>
   cd growwStocksApp
   npm install
   ```

2. **Configure API Access**
   
   Create your environment configuration:
   ```bash
   cp env.example.ts env.ts
   ```
   
   Edit `env.ts` with your Alpha Vantage API credentials:
   ```typescript
   export const ENV = {
       ALPHA_VANTAGE_API_KEY: 'your_api_key_here',
       ALPHA_VANTAGE_BASE_URL: 'https://www.alphavantage.co/query',
       CACHE_EXPIRATION_TIME: 300000,
   } as const;
   ```
   
   > 🔑 **Get your free API key:** [Alpha Vantage Registration](https://www.alphavantage.co/support/#api-key)

3. **Launch the Application**
   ```bash
   npm start
   ```

### 📱 Platform Options
Choose your preferred development environment:
- 📱 [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/)
- 🤖 [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- 🌐 Web Browser

## 🏗️ Architecture & Tech Stack

### **Frontend Framework**
- ⚛️ **React Native**
- 📘 **TypeScript**

### **Project Structure**
```
📁 app/                
  📁 (tabs)/           # Tab-based navigation
    🏠 index.tsx       # Market dashboard
    ⭐ favorites.tsx   # Favorites management
    📰 news.tsx        # Financial news feed
    📋 watchlist.tsx   # Watchlist management
  📄 stock-details.tsx # Individual stock analysis
  📄 view-all.tsx      # Extended market views

📁 components/          
  📊 StockCard.tsx     # Stock display cards
  📰 NewsCard.tsx      # News article cards
  📋 AddToWatchlistModal.tsx
  🌙 ThemeToggle.tsx

📁 services/           
  📈 alphaVantageAPI.ts # Alpha Vantage API client

📁 contexts/           
  🎨 ThemeContext.tsx  # Theme management

📁 types/              # TypeScript definitions
```

### **Design Principles**
- 🏗️ **Clean Architecture**: Separation of concerns with dedicated services, components and utilities
- 📱 **Mobile-First**: Optimized for React Native performance patterns
- 💾 **Smart Caching**: Local storage with configurable TTL to minimize API calls
- 🔧 **Environment Management**: TypeScript-based configuration for better IDE support
- 🎨 **Theme-Aware**: Comprehensive light/dark mode implementation

### **Performance Optimizations**
- ⚡ Intelligent data caching with AsyncStorage
- 🔄 Background refresh strategies
- 📱 Native platform optimizations
- 🎯 Lazy loading for improved startup time