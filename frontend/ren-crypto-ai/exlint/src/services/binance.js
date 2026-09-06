// ============================================================
// EXLINT - Binance Market Data Service
// ============================================================

const REST_URL = "https://api.binance.com/api/v3";
const WS_URL = "wss://stream.binance.com:9443/ws";

// ------------------------------------------------------------
// Geçmiş mumları getir
// ------------------------------------------------------------
export async function getKlines(
  symbol = "BTCUSDT",
  interval = "15m",
  limit = 500
) {
  const response = await fetch(
    `${REST_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Binance kline hatası: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Binance geçersiz kline verisi döndürdü.");
  }

  return data.map((item) => ({
    time: Math.floor(item[0] / 1000),
    open: Number(item[1]),
    high: Number(item[2]),
    low: Number(item[3]),
    close: Number(item[4]),
    volume: Number(item[5]),
  }));
}

// ------------------------------------------------------------
// 24 saatlik market bilgisi
// ------------------------------------------------------------
export async function get24hTicker(symbol) {
  const response = await fetch(
    `${REST_URL}/ticker/24hr?symbol=${symbol}`
  );

  if (!response.ok) {
    throw new Error(`24h ticker hatası: ${response.status}`);
  }

  const data = await response.json();

  return {
    symbol: data.symbol,
    lastPrice: Number(data.lastPrice),
    priceChange: Number(data.priceChange),
    priceChangePercent: Number(data.priceChangePercent),
    highPrice: Number(data.highPrice),
    lowPrice: Number(data.lowPrice),
    volume: Number(data.volume),
    quoteVolume: Number(data.quoteVolume),
  };
}

// ------------------------------------------------------------
// Birden fazla coin için 24h verisi
// ------------------------------------------------------------
export async function getMultiple24h(symbols) {
  const results = {};

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        results[symbol] = await get24hTicker(symbol);
      } catch (error) {
        console.error(`${symbol} 24h alınamadı:`, error);

        results[symbol] = {
          symbol,
          lastPrice: 0,
          priceChange: 0,
          priceChangePercent: 0,
          highPrice: 0,
          lowPrice: 0,
          volume: 0,
          quoteVolume: 0,
        };
      }
    })
  );

  return results;
}

// ------------------------------------------------------------
// Canlı tek coin WebSocket
// ------------------------------------------------------------
export function connectLive(symbol, interval, onCandle) {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;

  const socket = new WebSocket(`${WS_URL}/${stream}`);

  socket.onopen = () => {
    console.log(`🟢 WebSocket bağlandı: ${symbol} ${interval}`);
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (!message.k) return;

      const candle = message.k;

      onCandle({
        time: Math.floor(candle.t / 1000),
        open: Number(candle.o),
        high: Number(candle.h),
        low: Number(candle.l),
        close: Number(candle.c),
        volume: Number(candle.v),
        closed: Boolean(candle.x),
      });
    } catch (error) {
      console.error("WebSocket veri işleme hatası:", error);
    }
  };

  socket.onerror = (error) => {
    console.error(`🔴 WebSocket hatası ${symbol}:`, error);
  };

  socket.onclose = () => {
    console.log(`🟠 WebSocket kapandı: ${symbol}`);
  };

  return socket;
}

// ------------------------------------------------------------
// Canlı fiyat WebSocket
// ------------------------------------------------------------
export function connectTickerStream(symbols, onPrice) {
  const streams = symbols
    .map((symbol) => `${symbol.toLowerCase()}@miniTicker`)
    .join("/");

  const socket = new WebSocket(
    `wss://stream.binance.com:9443/stream?streams=${streams}`
  );

  socket.onopen = () => {
    console.log("🟢 Toplu fiyat WebSocket bağlantısı açıldı.");
  };

  socket.onmessage = (event) => {
    try {
      const wrapper = JSON.parse(event.data);

      if (!wrapper.data) return;

      const data = wrapper.data;

      onPrice({
        symbol: data.s,
        price: Number(data.c),
        changePercent: Number(
          ((Number(data.c) - Number(data.o)) / Number(data.o)) * 100
        ),
        high: Number(data.h),
        low: Number(data.l),
        volume: Number(data.v),
      });
    } catch (error) {
      console.error("Toplu fiyat verisi işleme hatası:", error);
    }
  };

  socket.onerror = (error) => {
    console.error("Toplu fiyat WebSocket hatası:", error);
  };

  socket.onclose = () => {
    console.log("🟠 Toplu fiyat WebSocket kapandı.");
  };

  return socket;
}