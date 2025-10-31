const express = require('express');
const cors = require('cors');
const marketService = require('./marketService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Hardcoded trending Indian stocks
const TRENDING_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'BHARTIARTL.NS', 'ITC.NS', 'SBIN.NS', 'LT.NS'
];

// Get comprehensive stock data using MarketService
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`📊 Fetching comprehensive data for ${symbol}...`);
    
    const detailedData = await marketService.getDetailedStockData(symbol, {
      period: '2y',
      interval: '1d'
    });
    
    res.json(detailedData);
  } catch (error) {
    console.error('❌ Error fetching stock data:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get multiple quotes efficiently
app.get('/api/quotes', async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : TRENDING_STOCKS;
    console.log(`📊 Fetching quotes for: ${symbols.join(', ')}`);
    
    const quotes = await marketService.getMultipleQuotes(symbols);
    res.json({ quotes });
  } catch (error) {
    console.error('❌ Error fetching quotes:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get trending stocks with live data
app.get('/api/trending', async (req, res) => {
  try {
    console.log('🔥 Fetching trending stocks...');
    const quotes = await marketService.getMultipleQuotes(TRENDING_STOCKS);
    
    const formattedQuotes = quotes.map(q => ({
      symbol: q.symbol,
      shortName: q.name,
      regularMarketPrice: q.price,
      regularMarketChange: q.change,
      regularMarketChangePercent: q.changePercent
    }));
    
    res.json({ quotes: formattedQuotes });
  } catch (error) {
    console.error('❌ Error fetching trending:', error.message);
    res.json({ 
      quotes: TRENDING_STOCKS.map(s => ({ symbol: s, shortName: s.replace('.NS', '') }))
    });
  }
});

// Get single quote (fast)
app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await marketService.getStockData(symbol);
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching quote:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check with service stats
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = await marketService.healthCheck();
    const stats = marketService.getStats();
    const cacheStats = marketService.getCacheStats();
    
    res.json({
      ...healthStatus,
      stats,
      cache: cacheStats,
      version: '2.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Service statistics
app.get('/api/stats', (req, res) => {
  const stats = marketService.getStats();
  const cacheStats = marketService.getCacheStats();
  
  res.json({
    service: stats,
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});

// Clear cache
app.post('/api/cache/clear', (req, res) => {
  marketService.clearCache();
  res.json({ 
    success: true, 
    message: 'Cache cleared successfully' 
  });
});

// Extract market data from message
app.post('/api/analyze-message', async (req, res) => {
  try {
    const { message } = req.body;
    const relevantData = await marketService.getRelevantMarketData(message);
    res.json(relevantData || { message: 'No relevant stock symbols found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 ASRE Backend Server v2.0`);
  console.log(`📡 Running on http://localhost:${PORT}\n`);
  console.log(`📊 API Endpoints:`);
  console.log(`   ├─ GET  /api/stock/:symbol       - Comprehensive stock data`);
  console.log(`   ├─ GET  /api/quote/:symbol       - Quick quote`);
  console.log(`   ├─ GET  /api/quotes?symbols=...  - Multiple quotes`);
  console.log(`   ├─ GET  /api/trending            - Trending stocks`);
  console.log(`   ├─ GET  /api/health              - Health check + stats`);
  console.log(`   ├─ GET  /api/stats               - Service statistics`);
  console.log(`   ├─ POST /api/cache/clear         - Clear cache`);
  console.log(`   └─ POST /api/analyze-message     - Extract symbols from text\n`);
  console.log(`💡 Quick Test:`);
  console.log(`   curl http://localhost:${PORT}/api/health`);
  console.log(`   curl http://localhost:${PORT}/api/quote/RELIANCE.NS\n`);
});
