/**
 * Advanced Price Forecasting — Quantitative Finance Models
 * 
 * Inspired by: github.com/wilsonfreitas/awesome-quant
 * 
 * Borrows quantitative finance techniques for agricultural price forecasting:
 * 1. EWMA (Exponentially Weighted Moving Average) — volatility estimation
 * 2. ARCH/GARCH — volatility clustering (prices become more volatile during shortages)
 * 3. Value at Risk (VaR) — risk assessment for farmers considering storage decisions
 * 4. Simple Moving Average crossover — trend detection for sell/hold signals
 * 
 * These models are adapted from financial markets to agricultural commodity prices,
 * which exhibit similar patterns: trends, volatility clustering, and seasonal effects.
 */

interface PricePoint {
  date: string;
  price: number;
}

interface ForecastResult {
  forecast: { date: string; price: number; lower: number; upper: number }[];
  metrics: {
    ewmaVolatility: number;
    var95: number;          // 95% Value at Risk
    var99: number;          // 99% Value at Risk
    trend: 'bullish' | 'bearish' | 'neutral';
    smaSignal: 'buy' | 'sell' | 'hold';
    rsi: number;            // Relative Strength Index (0-100)
  };
  recommendation: string;
}

export class QuantForecasting {
  /**
   * Generate comprehensive price forecast with risk metrics
   */
  async forecast(
    prices: PricePoint[],
    horizon: number = 14,
    confidenceLevel: number = 0.95,
  ): Promise<ForecastResult> {
    if (prices.length < 10) {
      return this.insufficientData();
    }

    const priceValues = prices.map(p => p.price);
    const returns = this.calculateReturns(priceValues);
    
    // ─── Forecast using Holt-Winters exponential smoothing ─────────
    const smoothed = this.holtWintersForecast(priceValues, horizon);
    
    // ─── Volatility using EWMA ─────────────────────────────────────
    const ewmaVol = this.calculateEWMAVolatility(returns, 0.94);
    
    // ─── GARCH(1,1) simplified volatility forecast ────────────────
    const garchVol = this.garch11Forecast(returns, horizon);
    
    // ─── Value at Risk ─────────────────────────────────────────────
    const zScore95 = 1.645;
    const zScore99 = 2.326;
    const currentPrice = priceValues[priceValues.length - 1];
    const var95 = currentPrice * ewmaVol * zScore95;
    const var99 = currentPrice * ewmaVol * zScore99;
    
    // ─── SMA crossover signal ──────────────────────────────────────
    const smaShort = this.sma(priceValues, 5);
    const smaLong = this.sma(priceValues, 20);
    const smaSignal = smaShort > smaLong * 1.02 ? 'buy' : smaShort < smaLong * 0.98 ? 'sell' : 'hold';
    
    // ─── RSI (Relative Strength Index) ─────────────────────────────
    const rsi = this.calculateRSI(priceValues, 14);
    
    // ─── Trend detection ───────────────────────────────────────────
    const trend = this.detectTrend(priceValues);
    
    // ─── Build forecast with confidence intervals ──────────────────
    const forecast = smoothed.map((price, h) => {
      const stepVol = garchVol * Math.sqrt(h + 1);
      const lower = price * (1 - zScore95 * stepVol);
      const upper = price * (1 + zScore95 * stepVol);
      
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + (h + 1) * 7); // Weekly steps
      
      return {
        date: forecastDate.toISOString().split('T')[0],
        price: Math.round(price),
        lower: Math.round(Math.max(0, lower)),
        upper: Math.round(upper),
      };
    });
    
    // ─── Generate recommendation ──────────────────────────────────
    const recommendation = this.generateRecommendation({
      trend, smaSignal, rsi, var95, currentPrice, ewmaVol,
    });
    
    return {
      forecast,
      metrics: {
        ewmaVolatility: Math.round(ewmaVol * 10000) / 100, // As percentage
        var95: Math.round(var95),
        var99: Math.round(var99),
        trend,
        smaSignal,
        rsi: Math.round(rsi),
      },
      recommendation,
    };
  }
  
  /**
   * Calculate log returns
   */
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] === 0) continue;
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    return returns;
  }
  
  /**
   * EWMA Volatility (RiskMetrics approach, lambda = 0.94)
   */
  private calculateEWMAVolatility(returns: number[], lambda: number = 0.94): number {
    if (returns.length === 0) return 0;
    
    let variance = returns[0] ** 2;
    for (let i = 1; i < returns.length; i++) {
      variance = lambda * variance + (1 - lambda) * returns[i] ** 2;
    }
    
    return Math.sqrt(variance);
  }
  
  /**
   * Simplified GARCH(1,1) volatility forecast
   * sigma^2 = omega + alpha * r^2 + beta * sigma^2
   */
  private garch11Forecast(returns: number[], horizon: number): number {
    if (returns.length < 5) return this.calculateEWMAVolatility(returns);
    
    // Estimate GARCH parameters using method of moments
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, r) => a + (r - meanReturn) ** 2, 0) / returns.length;
    
    // Typical GARCH(1,1) parameters for commodity prices
    const omega = variance * 0.05;
    const alpha = 0.1;
    const beta = 0.85;
    
    // Forecast volatility for h steps ahead
    let sigma2 = variance;
    for (let h = 0; h < horizon; h++) {
      sigma2 = omega + alpha * returns[returns.length - 1] ** 2 + beta * sigma2;
    }
    
    return Math.sqrt(sigma2);
  }
  
  /**
   * Simple Moving Average
   */
  private sma(prices: number[], period: number): number {
    if (prices.length < period) return prices.reduce((a, b) => a + b, 0) / prices.length;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }
  
  /**
   * Relative Strength Index (RSI)
   * RSI > 70: Overbought (prices may fall — sell signal)
   * RSI < 30: Oversold (prices may rise — buy/hold signal)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
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
  
  /**
   * Detect trend using linear regression slope
   */
  private detectTrend(prices: number[]): 'bullish' | 'bearish' | 'neutral' {
    if (prices.length < 5) return 'neutral';
    
    const n = prices.length;
    const xMean = (n - 1) / 2;
    const yMean = prices.reduce((a, b) => a + b, 0) / n;
    
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (prices[i] - yMean);
      den += (i - xMean) ** 2;
    }
    
    const slope = den === 0 ? 0 : num / den;
    const slopePercent = (slope / yMean) * 100;
    
    if (slopePercent > 1) return 'bullish';
    if (slopePercent < -1) return 'bearish';
    return 'neutral';
  }
  
  /**
   * Holt-Winters forecast for price prediction
   */
  private holtWintersForecast(prices: number[], horizon: number): number[] {
    const alpha = 0.3;
    const beta = 0.1;
    
    let level = prices[0];
    let trend = prices.length > 1 ? prices[1] - prices[0] : 0;
    
    for (let i = 1; i < prices.length; i++) {
      const lastLevel = level;
      const lastTrend = trend;
      level = alpha * prices[i] + (1 - alpha) * (lastLevel + lastTrend);
      trend = beta * (level - lastLevel) + (1 - beta) * lastTrend;
    }
    
    const forecast: number[] = [];
    for (let h = 1; h <= horizon; h++) {
      forecast.push(Math.max(0, level + h * trend));
    }
    
    return forecast;
  }
  
  /**
   * Generate actionable recommendation based on quant metrics
   */
  private generateRecommendation(metrics: {
    trend: string; smaSignal: string; rsi: number;
    var95: number; currentPrice: number; ewmaVol: number;
  }): string {
    const parts: string[] = [];
    
    // Trend-based advice
    if (metrics.trend === 'bullish') {
      parts.push('Prices are trending upward. If you have produce ready, consider selling soon to capture the trend.');
    } else if (metrics.trend === 'bearish') {
      parts.push('Prices are trending downward. If you can store your produce, consider waiting for prices to recover.');
    } else {
      parts.push('Prices are stable. Sell when convenient.');
    }
    
    // RSI-based advice
    if (metrics.rsi > 70) {
      parts.push('RSI indicates prices are high (overbought). This may be a good time to sell.');
    } else if (metrics.rsi < 30) {
      parts.push('RSI indicates prices are low (oversold). Consider holding if you can afford to wait.');
    }
    
    // SMA signal
    if (metrics.smaSignal === 'buy') {
      parts.push('Short-term moving average is above long-term — bullish signal. Sell now to maximize returns.');
    } else if (metrics.smaSignal === 'sell') {
      parts.push('Short-term moving average is below long-term — bearish signal. Consider storing produce.');
    }
    
    // Volatility warning
    const volPercent = (metrics.ewmaVol * 100).toFixed(1);
    if (metrics.ewmaVol > 0.15) {
      parts.push(`⚠️ High price volatility (${volPercent}%). Prices may swing significantly. Consider selling in batches to average out risk.`);
    }
    
    // VaR warning
    const varPercent = ((metrics.var95 / metrics.currentPrice) * 100).toFixed(1);
    parts.push(`Risk assessment: 95% chance prices won't drop more than ${varPercent}% (KES ${Math.round(metrics.var95)} per unit) in the next 2 weeks.`);
    
    return parts.join('\n\n');
  }
  
  private insufficientData(): ForecastResult {
    return {
      forecast: [],
      metrics: {
        ewmaVolatility: 0, var95: 0, var99: 0,
        trend: 'neutral', smaSignal: 'hold', rsi: 50,
      },
      recommendation: 'Insufficient price history for reliable forecasting. Need at least 10 data points.',
    };
  }
}

export const quantForecasting = new QuantForecasting();
