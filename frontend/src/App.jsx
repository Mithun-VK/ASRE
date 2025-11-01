/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import './App.css';

// ASRE Pro v2.1 - Enhanced with Balanced Scoring Formula
// - V1's intuitive balanced weights (0.3, 0.25, 0.15, 0.15, 0.15)
// - V2's advanced technical indicators (RSI, MACD, Bollinger Bands)
// - Professional UI with watchlist & CSV export
// - Real-time trending stocks
// - Service health monitoring

const API_BASE_URL = "https://asre.onrender.com/api";
console.log("API URL:", API_BASE_URL);

export default function ASREDemo() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [trending, setTrending] = useState([]);
  const [serviceHealth, setServiceHealth] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("asre_watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
    fetchTrending();
    checkServiceHealth();
  }, []);

  async function checkServiceHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const data = await res.json();
      setServiceHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  }

  async function fetchTrending() {
    try {
      const res = await fetch(`${API_BASE_URL}/trending`);
      const data = await res.json();
      if (data.quotes) setTrending(data.quotes.slice(0, 5));
    } catch (err) {
      console.log('Trending fetch failed (optional)');
    }
  }

  function std(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1 || 1);
    return Math.sqrt(variance);
  }

  function normalize(x, min, max) {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (x - min) / (max - min)));
  }

  function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    let ema = data[0];
    const result = [ema];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
      result.push(ema);
    }
    return result;
  }

  function calculateMACD(prices) {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12.map((val, i) => val - ema26[i]);
    const signalLine = calculateEMA(macdLine, 9);
    const histogram = macdLine.map((val, i) => val - signalLine[i]);
    return {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1]
    };
  }

  function calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
    const slice = prices.slice(-period);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const stdDeviation = Math.sqrt(variance);
    return {
      upper: sma + stdDev * stdDeviation,
      middle: sma,
      lower: sma - stdDev * stdDeviation
    };
  }

  function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  function calculateSharpeRatio(returns, riskFreeRate = 0.06) {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const annualizedReturn = avgReturn * 252;
    const volatility = std(returns) * Math.sqrt(252);
    if (volatility === 0) return 0;
    return (annualizedReturn - riskFreeRate) / volatility;
  }

  function calculateMaxDrawdown(prices) {
    let maxDD = 0;
    let peak = prices[0];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) peak = prices[i];
      const dd = (peak - prices[i]) / peak;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  // ===== ENHANCED SENTIMENT SCORE FROM V2 =====
  function enhancedSentimentScore(recommendations = []) {
    if (!recommendations || recommendations.length === 0) return 0.5;
    let score = 0;
    let count = 0;
    recommendations.forEach(rec => {
      if (rec.strongBuy) { score += rec.strongBuy * 2; count += rec.strongBuy; }
      if (rec.buy) { score += rec.buy * 1; count += rec.buy; }
      if (rec.sell) { score -= rec.sell * 1; count += rec.sell; }
      if (rec.strongSell) { score -= rec.strongSell * 2; count += rec.strongSell; }
    });
    if (count === 0) return 0.5;
    const raw = score / (count * 2);
    return Math.max(0, Math.min(1, (raw + 1) / 2));
  }

  function toStars(x) {
    const scaled = Math.max(0, Math.min(1, x));
    return Math.round(scaled * 5 * 10) / 10;
  }

  function addToWatchlist(sym) {
    if (!watchlist.includes(sym)) {
      const newList = [...watchlist, sym];
      setWatchlist(newList);
      localStorage.setItem("asre_watchlist", JSON.stringify(newList));
    }
  }

  function removeFromWatchlist(sym) {
    const newList = watchlist.filter(s => s !== sym);
    setWatchlist(newList);
    localStorage.setItem("asre_watchlist", JSON.stringify(newList));
  }

  function exportToCSV() {
    if (!result) return;
    const csv = [
      ["Metric", "Value"],
      ["Symbol", result.symbol],
      ["Current Price", result.currentPrice],
      ["Star Rating", result.stars],
      ["Risk Level", result.riskLabel],
      ["Valuation Score", (result.valComp * 5).toFixed(2)],
      ["Growth Score", (result.growthComp * 5).toFixed(2)],
      ["Momentum Score", (result.momentumComp * 5).toFixed(2)],
      ["Sentiment Score", (result.sentimentComp * 5).toFixed(2)],
      ["Projected 1Y Return", result.projReturn + "%"],
      ["Confidence", result.confidence + "%"],
      ["RSI", result.rsi?.toFixed(2) || "N/A"],
      ["MACD", result.macd?.macd?.toFixed(4) || "N/A"],
      ["Sharpe Ratio", result.sharpeRatio?.toFixed(2) || "N/A"],
      ["Max Drawdown", result.maxDrawdown ? (result.maxDrawdown * 100).toFixed(2) + "%" : "N/A"],
      ["Beta", result.beta?.toFixed(2) || "N/A"],
      ["P/E Ratio", result.pe?.toFixed(2) || "N/A"],
      ["P/B Ratio", result.pb?.toFixed(2) || "N/A"]
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.symbol}_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!symbol) return;
    setLoading(true);

    try {
      let sym = symbol.trim().toUpperCase();
      if (!sym.endsWith(".NS") && !sym.endsWith(".BO") && !sym.match(/^[A-Z]+$/)) {
        sym = sym + ".NS";
      }

      const response = await fetch(`${API_BASE_URL}/stock/${encodeURIComponent(sym)}`);
      if (!response.ok) throw new Error('Failed to fetch stock data from backend');
      const data = await response.json();
      if (!data || (!data.quote && !data.quoteSummary)) {
        throw new Error('No data found for symbol. Try a different ticker.');
      }

      const quote = data.quote || {};
      const summary = data.quoteSummary || {};
      const summaryDetail = summary.summaryDetail || {};
      const statistics = summary.statistics || summary.defaultKeyStatistics || {};
      const financialData = summary.financialData || {};
      const recommendations = summary.recommendationTrend?.trend || [];

      const currentPrice = quote.regularMarketPrice || data.price || null;
      const pe = statistics.trailingPE || quote.trailingPE || null;
      const forwardPE = statistics.forwardPE || summaryDetail.forwardPE || null;
      const pb = statistics.priceToBook || quote.priceToBook || null;
      const ps = quote.priceToSalesTrailing12Months || null;
      const beta = statistics.beta || summaryDetail.beta || 1;
      const marketCap = quote.marketCap || data.marketCap || null;
      const roe = financialData.returnOnEquity || null;
      const debtToEquity = financialData.debtToEquity || null;
      const freeCashflow = financialData.freeCashflow || null;
      const earningsGrowth = financialData.earningsGrowth || null;
      const revenueGrowth = financialData.revenueGrowth || null;
      const targetMeanPrice = financialData.targetMeanPrice || null;

      let closes = [];
      if (data.historical && Array.isArray(data.historical)) {
        closes = data.historical.filter(h => h.close !== null && h.close !== undefined).map(h => h.close);
      }

      let momentum12m = 0, momentum6m = 0, momentum3m = 0, rsi = 50, ma50 = null, ma200 = null;
      let volatility = 0, sharpeRatio = 0, maxDrawdown = 0;
      let macd = { macd: 0, signal: 0, histogram: 0 };
      let bollingerBands = { upper: 0, middle: 0, lower: 0 };
      const dailyReturns = [];

      if (closes.length > 30) {
        const end = closes[closes.length - 1];
        if (closes.length >= 252) momentum12m = (end - closes[closes.length - 252]) / closes[closes.length - 252];
        else momentum12m = (end - closes[0]) / closes[0];
        if (closes.length >= 126) momentum6m = (end - closes[closes.length - 126]) / closes[closes.length - 126];
        if (closes.length >= 63) momentum3m = (end - closes[closes.length - 63]) / closes[closes.length - 63];
        rsi = calculateRSI(closes);
        macd = calculateMACD(closes);
        bollingerBands = calculateBollingerBands(closes);
        if (closes.length >= 50) ma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
        if (closes.length >= 200) ma200 = closes.slice(-200).reduce((a, b) => a + b, 0) / 200;
        for (let i = 1; i < closes.length; i++) {
          dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
        }
        volatility = std(dailyReturns) * Math.sqrt(252);
        sharpeRatio = calculateSharpeRatio(dailyReturns);
        maxDrawdown = calculateMaxDrawdown(closes);
      }

      const sentiment = enhancedSentimentScore(recommendations);

      // ===== V1's BALANCED COMPONENT SCORING =====
      
      // VALUATION: 30% weight
      const valComp = (() => {
        let score = 0.5, count = 0;
        if (pe !== null && pe > 0) { score += normalize(1 / pe, 1 / 50, 1 / 5) * 0.35; count += 0.35; }
        if (forwardPE !== null && forwardPE > 0) { score += normalize(1 / forwardPE, 1 / 40, 1 / 8) * 0.15; count += 0.15; }
        if (pb !== null && pb > 0) { score += normalize(1 / pb, 1 / 8, 1 / 0.8) * 0.25; count += 0.25; }
        if (ps !== null && ps > 0) { score += normalize(1 / ps, 1 / 10, 1 / 0.5) * 0.15; count += 0.15; }
        if (roe !== null && roe > 0) { score += normalize(roe, 0.05, 0.30) * 0.10; count += 0.10; }
        return count > 0 ? score / (count + (1 - count) * 0.5) : 0.5;
      })();

      // GROWTH: 25% weight
      const growthComp = (() => {
        let score = 0, count = 0;
        if (earningsGrowth !== null) { score += normalize(earningsGrowth, -0.3, 0.5) * 0.4; count += 0.4; }
        if (revenueGrowth !== null) { score += normalize(revenueGrowth, -0.2, 0.4) * 0.3; count += 0.3; }
        if (freeCashflow !== null && freeCashflow > 0) { score += 0.15; count += 0.15; }
        if (roe !== null) { score += normalize(roe, 0, 0.35) * 0.15; count += 0.15; }
        return count > 0 ? score / count : 0.5;
      })();

      // MOMENTUM: 15% weight
      const momentumComp = (() => {
        let score = 0;
        score += normalize(momentum12m, -0.5, 1.0) * 0.20;
        score += normalize(momentum6m, -0.3, 0.8) * 0.15;
        score += normalize(momentum3m, -0.2, 0.5) * 0.10;
        score += normalize(rsi, 20, 80) * 0.20;
        score += (macd.histogram > 0 ? 0.10 : 0.05);
        if (ma50 && ma200 && currentPrice) {
          score += (currentPrice > ma50 && ma50 > ma200) ? 0.15 : (currentPrice > ma50 || ma50 > ma200) ? 0.075 : 0.025;
        } else { score += 0.05; }
        if (targetMeanPrice && currentPrice) {
          score += normalize((targetMeanPrice - currentPrice) / currentPrice, -0.3, 0.5) * 0.05;
        }
        return Math.max(0, Math.min(1, score));
      })();

      // SENTIMENT: 15% weight (from analyst recommendations)
      const sentimentComp = sentiment;

      // RISK: 15% weight (subtracted from final score)
      const riskComp = (() => {
        let risk = 0;
        risk += (volatility ? normalize(volatility, 0.1, 0.8) : 0.15) * 0.30;
        risk += normalize(Math.abs(beta - 1), 0, 1.5) * 0.20;
        risk += normalize(maxDrawdown, 0, 0.6) * 0.25;
        risk += (sharpeRatio > 0 ? (1 - normalize(sharpeRatio, -1, 3)) : 1) * 0.15;
        risk += (debtToEquity !== null ? normalize(debtToEquity, 0, 2) : 0.5) * 0.10;
        return Math.max(0, Math.min(1, risk));
      })();

      // ===== V1's FINAL SCORING FORMULA =====
      // Score = 0.30*Valuation + 0.25*Growth + 0.15*Momentum + 0.15*Sentiment - 0.15*Risk
      const rawScore = 
        0.30 * valComp + 
        0.25 * growthComp + 
        0.15 * momentumComp + 
        0.15 * sentimentComp - 
        0.15 * riskComp;

      // Normalize to 0-1 range with slight boost
      const score = Math.max(0, Math.min(1, rawScore * 1.2 + 0.1));
      const stars = toStars(score);
      
      // Risk label mapping from V1
      let riskLabel = "High Risk";
      if (score >= 0.85) riskLabel = "High Risk–High Reward";
      else if (score >= 0.70) riskLabel = "Moderate";
      else if (score >= 0.50) riskLabel = "Balanced";
      else if (score >= 0.30) riskLabel = "Cautious";

      // ===== PROJECTION & CONFIDENCE =====
      const projReturn = (() => {
        let projection = momentum12m * 0.25 + (growthComp - 0.5) * 0.35 + (valComp - 0.5) * 0.30 + (sentimentComp - 0.5) * 0.10;
        if (targetMeanPrice && currentPrice) {
          projection = projection * 0.6 + ((targetMeanPrice - currentPrice) / currentPrice) * 0.4;
        }
        return Math.round(projection * 100);
      })();

      const confidence = (() => {
        let conf = 50;
        if (closes.length >= 200) conf += 15;
        if (recommendations.length >= 3) conf += 10;
        if (pe !== null && pb !== null) conf += 10;
        if (earningsGrowth !== null) conf += 10;
        if (targetMeanPrice !== null) conf += 5;
        return Math.min(95, conf);
      })();

      const explanation = [];
      if (pe !== null) explanation.push(`P/E: ${pe.toFixed(2)}`);
      if (forwardPE !== null) explanation.push(`Fwd P/E: ${forwardPE.toFixed(2)}`);
      if (pb !== null) explanation.push(`P/B: ${pb.toFixed(2)}`);
      if (roe !== null) explanation.push(`ROE: ${(roe * 100).toFixed(1)}%`);
      if (momentum12m) explanation.push(`12M Return: ${(momentum12m * 100).toFixed(1)}%`);
      if (rsi) explanation.push(`RSI: ${rsi.toFixed(0)}`);
      if (macd.macd) explanation.push(`MACD: ${macd.histogram > 0 ? 'Bullish' : 'Bearish'}`);
      if (earningsGrowth !== null) explanation.push(`Earnings Growth: ${(earningsGrowth * 100).toFixed(1)}%`);
      explanation.push(`Analyst Sentiment: ${(sentimentComp * 100).toFixed(0)}%`);
      if (sharpeRatio) explanation.push(`Sharpe: ${sharpeRatio.toFixed(2)}`);

      setResult({
        symbol: sym, currentPrice, pe, pb, beta, marketCap,
        valComp, growthComp, momentumComp, sentimentComp, riskComp,
        score, stars, riskLabel, projReturn, confidence, explanation,
        recommendationsCount: recommendations.length,
        rsi, sharpeRatio, maxDrawdown, targetMeanPrice,
        macd, bollingerBands, ma50, ma200
      });

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || "Unknown error. Make sure backend is running on port 3001.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="asre-container">
      <div className="asre-content">
        <h1 className="gradient-text animate-fadeIn">ASRE Pro 2.1</h1>
        <p className="asre-subtitle">
          Balanced Stock Rating Engine • V1 Scoring Formula • V2 Technical Analysis • Real-time Yahoo Finance
        </p>

        {/* Service Health */}
        {serviceHealth && (
          <div className="flex-center" style={{ gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
            <span className={serviceHealth.status === 'healthy' ? 'badge badge-success' : 'badge badge-danger'}>
              {serviceHealth.status === 'healthy' ? '✅' : '❌'} Backend {serviceHealth.status}
            </span>
            {serviceHealth.stats && (
              <span className="badge badge-info">
                📊 Success: {serviceHealth.stats.successRate}
              </span>
            )}
            {serviceHealth.cache && (
              <span className="badge badge-warning">
                💾 Cache Hit: {serviceHealth.cache.hitRate}
              </span>
            )}
          </div>
        )}

        {/* Trending */}
        {trending.length > 0 && (
          <div className="flex-center" style={{ gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ color: '#888', fontSize: 13, fontWeight: 600 }}>🔥 Trending:</span>
            {trending.map((stock, idx) => (
              <button
                key={idx}
                onClick={() => setSymbol(stock.symbol.replace('.NS', '').replace('.BO', ''))}
                className="badge badge-warning animate-scaleIn"
                style={{ cursor: 'pointer' }}
              >
                {stock.symbol}
              </button>
            ))}
          </div>
        )}

        {/* Watchlist */}
        {watchlist.length > 0 && (
          <div className="flex-center" style={{ gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ color: '#888', fontSize: 13, fontWeight: 600 }}>⭐ Watchlist:</span>
            {watchlist.map((sym, idx) => (
              <div key={idx} className="flex-center" style={{ gap: 4 }}>
                <button
                  onClick={() => setSymbol(sym.replace('.NS', '').replace('.BO', ''))}
                  className="badge badge-info"
                  style={{ cursor: 'pointer' }}
                >
                  {sym}
                </button>
                <button
                  onClick={() => removeFromWatchlist(sym)}
                  className="badge badge-danger"
                  style={{ cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
          <div className="flex-center" style={{ gap: 10, flexWrap: 'wrap' }}>
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="Enter stock ticker (RELIANCE, TCS, INFY, AAPL, TSLA)"
              className="glass-input"
              style={{ flex: 1, minWidth: 280, maxWidth: 500 }}
            />
            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'animate-pulse' : ''}`}
              disabled={loading}
            >
              <span className="btn-icon">
                {loading ? '🔄 Analyzing...' : '🚀 Analyze'}
              </span>
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="alert alert-error animate-slideInLeft">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="glass-card animate-fadeIn">
            {/* Header */}
            <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{result.symbol}</h2>
                <div style={{ color: '#aaa', fontSize: 14 }}>
                  {result.currentPrice ? `₹${result.currentPrice.toFixed(2)}` : 'Price: N/A'}
                </div>
                {result.targetMeanPrice && (
                  <div style={{ color: '#4ecdc4', fontSize: 13, marginTop: 4 }}>
                    Target: ₹{result.targetMeanPrice.toFixed(2)} ({((result.targetMeanPrice - result.currentPrice) / result.currentPrice * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div className={result.stars >= 4 ? 'text-gradient-success' : result.stars >= 3 ? 'text-gradient-warning' : 'text-gradient-danger'}
                     style={{ fontSize: 38, fontWeight: 800, marginBottom: 6 }}>
                  {result.stars} ⭐
                </div>
                <span className={
                  result.riskLabel === "Low" ? 'badge badge-success' :
                  result.riskLabel === "Moderate" ? 'badge badge-warning' :
                  result.riskLabel === "Balanced" ? 'badge badge-info' :
                  'badge badge-danger'
                }>
                  {result.riskLabel}
                </span>
                <div className="flex-center" style={{ gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => addToWatchlist(result.symbol)}
                    disabled={watchlist.includes(result.symbol)}
                    className="btn btn-sm"
                    style={{ background: watchlist.includes(result.symbol) ? '#555' : 'rgba(102, 126, 234, 0.2)' }}
                  >
                    {watchlist.includes(result.symbol) ? '✓ In Watchlist' : '+ Watchlist'}
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="btn btn-sm btn-success"
                  >
                    📊 Export CSV
                  </button>
                </div>
              </div>
            </div>

            <hr className="divider" />

            {/* Metrics Grid */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
              {[
                { label: 'Valuation', value: result.valComp, icon: '💰' },
                { label: 'Growth', value: result.growthComp, icon: '📈' },
                { label: 'Momentum', value: result.momentumComp, icon: '🚀' },
                { label: 'Sentiment', value: result.sentimentComp, icon: '💭' }
              ].map((metric, idx) => (
                <div key={idx} className="metric-card">
                  <div className="metric-label">{metric.icon} {metric.label}</div>
                  <div className="metric-value">{(metric.value * 5).toFixed(2)} ⭐</div>
                  <div className="progress-bar">
                    <div 
                      className={
                        metric.value >= 0.7 ? 'progress-fill progress-fill-success' :
                        metric.value >= 0.4 ? 'progress-fill progress-fill-warning' :
                        'progress-fill progress-fill-danger'
                      }
                      style={{ width: `${metric.value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Projection & Confidence */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
              <div style={{
                background: result.projReturn >= 0 
                  ? 'linear-gradient(135deg, rgba(17, 153, 142, 0.15), rgba(56, 239, 125, 0.15))'
                  : 'linear-gradient(135deg, rgba(238, 9, 121, 0.15), rgba(255, 106, 0, 0.15))',
                padding: 20,
                borderRadius: 12
              }}>
                <div className="metric-label">📊 Projected 1Y Return</div>
                <div className={result.projReturn >= 0 ? 'text-gradient-success' : 'text-gradient-danger'}
                     style={{ fontSize: 30, fontWeight: 800 }}>
                  {result.projReturn >= 0 ? '+' : ''}{result.projReturn}%
                </div>
              </div>

              <div style={{ background: 'rgba(102, 126, 234, 0.1)', padding: 20, borderRadius: 12 }}>
                <div className="metric-label">🎯 Confidence</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#667eea' }}>
                  {result.confidence}%
                </div>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="glass-card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: '#aaa' }}>
                📋 Technical Indicators
              </h3>
              <div className="grid-4">
                {result.rsi && (
                  <div>
                    <span style={{ color: '#888' }}>RSI:</span>{' '}
                    <span className={result.rsi > 70 ? 'text-gradient-danger' : result.rsi < 30 ? 'text-gradient-success' : ''}
                          style={{ fontWeight: 600 }}>
                      {result.rsi.toFixed(0)} {result.rsi > 70 ? '🔴' : result.rsi < 30 ? '🟢' : ''}
                    </span>
                  </div>
                )}
                {result.macd && result.macd.macd !== 0 && (
                  <div>
                    <span style={{ color: '#888' }}>MACD:</span>{' '}
                    <span className={result.macd.histogram > 0 ? 'text-gradient-success' : 'text-gradient-danger'}
                          style={{ fontWeight: 600 }}>
                      {result.macd.histogram > 0 ? 'Bullish 🟢' : 'Bearish 🔴'}
                    </span>
                  </div>
                )}
                {result.bollingerBands && result.bollingerBands.middle > 0 && result.currentPrice && (
                  <div>
                    <span style={{ color: '#888' }}>Bollinger:</span>{' '}
                    <span style={{ fontWeight: 600 }}>
                      {result.currentPrice < result.bollingerBands.lower ? 'Oversold' :
                       result.currentPrice > result.bollingerBands.upper ? 'Overbought' : 'Neutral'}
                    </span>
                  </div>
                )}
                {result.sharpeRatio !== undefined && (
                  <div>
                    <span style={{ color: '#888' }}>Sharpe:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{result.sharpeRatio.toFixed(2)}</span>
                  </div>
                )}
                {result.maxDrawdown !== undefined && (
                  <div>
                    <span style={{ color: '#888' }}>Max DD:</span>{' '}
                    <span style={{ color: '#ff6a00', fontWeight: 600 }}>
                      {(result.maxDrawdown * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {result.ma50 && result.ma200 && (
                  <div>
                    <span style={{ color: '#888' }}>MA Trend:</span>{' '}
                    <span className={result.ma50 > result.ma200 ? 'text-gradient-success' : 'text-gradient-danger'}
                          style={{ fontWeight: 600 }}>
                      {result.ma50 > result.ma200 ? 'Golden 🟢' : 'Death 🔴'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="glass-card">
              <h3 style={{ fontSize: 13, marginBottom: 10, fontWeight: 600, color: '#aaa' }}>
                🔍 Analysis Details
              </h3>
              <div className="flex-center" style={{ gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {result.explanation.map((item, idx) => (
                  <span key={idx} className="badge badge-info">
                    {item}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: '#888', fontStyle: 'italic' }}>
                ⚡ ASRE Pro 2.1: V1 Balanced Scoring + V2 Advanced Indicators
              </div>
            </div>
          </div>
        )}

        {!result && !error && (
          <div className="glass-card animate-float" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
            <div style={{ fontSize: 16 }}>Enter a ticker symbol to begin comprehensive analysis</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
              Supports NSE (.NS), BSE (.BO), and US stocks
            </div>
          </div>
        )}

        <div className="glass-card" style={{ marginTop: 24, padding: 20 }}>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#888' }}>
            <strong className="gradient-text" style={{ fontSize: 14 }}>💡 Scoring Formula:</strong>
            <div style={{ marginTop: 8, fontFamily: 'monospace' }}>
              Score = 0.30×Valuation + 0.25×Growth + 0.15×Momentum + 0.15×Sentiment − 0.15×Risk
              <br />
              <br />
              <strong>Features:</strong>
              <br />
              • Balanced weight distribution (V1 formula)
              <br />
              • Technical indicators: RSI, MACD, Bollinger Bands
              <br />
              • Risk-adjusted scoring with Sharpe ratio & max drawdown
              <br />
              • Watchlist & CSV export • Real-time trending stocks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
