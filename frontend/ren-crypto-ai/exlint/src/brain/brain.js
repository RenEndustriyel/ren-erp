// ============================================================
// EXLINT BRAIN
// LONG + SHORT yönlü teknik analiz motoru
// ============================================================

// ============================================================
// EMA
// ============================================================

export function calculateEMA(data, period) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const multiplier = 2 / (period + 1);

  let ema = data[0].close;

  const result = [];

  for (const candle of data) {
    ema =
      candle.close * multiplier +
      ema * (1 - multiplier);

    result.push({
      time: candle.time,
      value: ema,
    });
  }

  return result;
}

// ============================================================
// RSI
// ============================================================

export function calculateRSI(
  data,
  period = 14
) {
  if (
    !Array.isArray(data) ||
    data.length < period + 1
  ) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (
    let i = data.length - period;
    i < data.length;
    i++
  ) {
    const difference =
      data[i].close -
      data[i - 1].close;

    if (difference > 0) {
      gains += difference;
    } else {
      losses += Math.abs(
        difference
      );
    }
  }

  if (losses === 0) {
    return 100;
  }

  const averageGain =
    gains / period;

  const averageLoss =
    losses / period;

  const rs =
    averageGain /
    averageLoss;

  return (
    100 -
    100 / (1 + rs)
  );
}

// ============================================================
// ATR
// ============================================================

export function calculateATR(
  data,
  period = 14
) {
  if (
    !Array.isArray(data) ||
    data.length < period + 1
  ) {
    return 0;
  }

  const trueRanges = [];

  for (
    let i = 1;
    i < data.length;
    i++
  ) {
    const current =
      data[i];

    const previous =
      data[i - 1];

    const tr1 =
      current.high -
      current.low;

    const tr2 =
      Math.abs(
        current.high -
          previous.close
      );

    const tr3 =
      Math.abs(
        current.low -
          previous.close
      );

    trueRanges.push(
      Math.max(
        tr1,
        tr2,
        tr3
      )
    );
  }

  const recent =
    trueRanges.slice(
      -period
    );

  return (
    recent.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / recent.length
  );
}

// ============================================================
// HACİM
// ============================================================

function calculateAverageVolume(
  data,
  period = 20
) {
  if (
    !Array.isArray(data) ||
    data.length < period
  ) {
    return 0;
  }

  const slice =
    data.slice(-period);

  return (
    slice.reduce(
      (sum, candle) =>
        sum + candle.volume,
      0
    ) / slice.length
  );
}

// ============================================================
// MARKET ANALİZİ
// ============================================================

export function analyzeMarket(
  data
) {
  if (
    !Array.isArray(data) ||
    data.length < 200
  ) {
    return {
      score: 0,

      longScore: 0,

      shortScore: 0,

      signal: "BEKLE",

      direction: "NONE",

      trend: "VERİ BEKLENİYOR",

      trendClass: "neutral",

      price: 0,

      rsi: 50,

      atr: 0,

      ema20: 0,

      ema50: 0,

      ema200: 0,

      volumeStrength: 0,

      longReason:
        "Yeterli veri bekleniyor.",

      shortReason:
        "Yeterli veri bekleniyor.",

      reason:
        "Analiz için yeterli veri bekleniyor.",

      checks: {
        ema20: false,
        ema50: false,
        ema200: false,

        longRsi: false,
        shortRsi: false,

        volume: false,

        bullishStructure: false,
        bearishStructure: false,
      },

      levels: {
        long: null,
        short: null,
      },
    };
  }

  const current =
    data[data.length - 1];

  const price =
    current.close;

  const ema20Data =
    calculateEMA(
      data,
      20
    );

  const ema50Data =
    calculateEMA(
      data,
      50
    );

  const ema200Data =
    calculateEMA(
      data,
      200
    );

  const ema20 =
    ema20Data[
      ema20Data.length - 1
    ].value;

  const ema50 =
    ema50Data[
      ema50Data.length - 1
    ].value;

  const ema200 =
    ema200Data[
      ema200Data.length - 1
    ].value;

  const rsi =
    calculateRSI(data);

  const atr =
    calculateATR(data);

  const averageVolume =
    calculateAverageVolume(
      data,
      20
    );

  const volumeStrength =
    averageVolume > 0
      ? (current.volume /
          averageVolume) *
        100
      : 0;

  // ==========================================================
  // TREND
  // ==========================================================

  const bullishStructure =
    price > ema20 &&
    ema20 > ema50 &&
    ema50 > ema200;

  const bearishStructure =
    price < ema20 &&
    ema20 < ema50 &&
    ema50 < ema200;

  // ==========================================================
  // LONG SCORE
  // ==========================================================

  let longScore = 0;

  if (price > ema20) {
    longScore += 15;
  }

  if (price > ema50) {
    longScore += 20;
  }

  if (price > ema200) {
    longScore += 25;
  }

  if (
    rsi >= 45 &&
    rsi <= 68
  ) {
    longScore += 15;
  } else if (
    rsi > 30 &&
    rsi < 70
  ) {
    longScore += 8;
  }

  if (
    volumeStrength >= 100
  ) {
    longScore += 15;
  }

  if (bullishStructure) {
    longScore += 10;
  }

  // ==========================================================
  // SHORT SCORE
  // ==========================================================

  let shortScore = 0;

  if (price < ema20) {
    shortScore += 15;
  }

  if (price < ema50) {
    shortScore += 20;
  }

  if (price < ema200) {
    shortScore += 25;
  }

  if (
    rsi >= 32 &&
    rsi <= 55
  ) {
    shortScore += 15;
  } else if (
    rsi > 30 &&
    rsi < 70
  ) {
    shortScore += 8;
  }

  if (
    volumeStrength >= 100
  ) {
    shortScore += 15;
  }

  if (bearishStructure) {
    shortScore += 10;
  }

  // ==========================================================
  // SİNYAL KARARI
  // ==========================================================

  let signal = "BEKLE";

  let direction = "NONE";

  let score = Math.max(
    longScore,
    shortScore
  );

  if (
    longScore >= 85 &&
    longScore > shortScore
  ) {
    signal = "AL";
    direction = "LONG";
  } else if (
    shortScore >= 85 &&
    shortScore > longScore
  ) {
    signal = "SAT";
    direction = "SHORT";
  }

  // ==========================================================
  // TREND
  // ==========================================================

  let trend =
    "YATAY";

  let trendClass =
    "neutral";

  if (bullishStructure) {
    trend =
      "GÜÇLÜ YÜKSELİŞ";

    trendClass =
      "bull";
  } else if (
    bearishStructure
  ) {
    trend =
      "GÜÇLÜ DÜŞÜŞ";

    trendClass =
      "bear";
  } else if (
    price > ema200
  ) {
    trend =
      "YÜKSELİŞ";

    trendClass =
      "bull";
  } else if (
    price < ema200
  ) {
    trend =
      "DÜŞÜŞ";

    trendClass =
      "bear";
  }

  // ==========================================================
  // YÖN AÇIKLAMALARI
  // ==========================================================

  const longReasons = [];

  if (price > ema20) {
    longReasons.push(
      "Fiyat EMA20 üzerinde."
    );
  }

  if (price > ema50) {
    longReasons.push(
      "Fiyat EMA50 üzerinde."
    );
  }

  if (price > ema200) {
    longReasons.push(
      "Uzun vadeli trend yukarı."
    );
  }

  if (
    rsi >= 45 &&
    rsi <= 68
  ) {
    longReasons.push(
      "RSI yükseliş için uygun bölgede."
    );
  }

  if (
    volumeStrength >= 100
  ) {
    longReasons.push(
      "Hacim ortalamanın üzerinde."
    );
  }

  const shortReasons = [];

  if (price < ema20) {
    shortReasons.push(
      "Fiyat EMA20 altında."
    );
  }

  if (price < ema50) {
    shortReasons.push(
      "Fiyat EMA50 altında."
    );
  }

  if (price < ema200) {
    shortReasons.push(
      "Uzun vadeli trend aşağı."
    );
  }

  if (
    rsi >= 32 &&
    rsi <= 55
  ) {
    shortReasons.push(
      "RSI aşağı yönlü harekete uygun bölgede."
    );
  }

  if (
    volumeStrength >= 100
  ) {
    shortReasons.push(
      "Hacim hareketi destekliyor."
    );
  }

  const longReason =
    longReasons.length > 0
      ? longReasons.join(
          " "
        )
      : "LONG için yeterli teknik onay yok.";

  const shortReason =
    shortReasons.length > 0
      ? shortReasons.join(
          " "
        )
      : "SHORT için yeterli teknik onay yok.";

  // ==========================================================
  // GİRİŞ / STOP / HEDEF
  //
  // ATR tabanlı.
  // Ancak minimum stop mesafesi %0.5.
  // ==========================================================

  const atrPercent =
    price > 0
      ? (atr / price) *
        100
      : 1;

  const stopPercent =
    Math.max(
      0.5,
      atrPercent *
        1.2
    );

  const rewardPercent =
    stopPercent * 2;

  const longStop =
    price *
    (1 -
      stopPercent / 100);

  const longTarget =
    price *
    (1 +
      rewardPercent / 100);

  const shortStop =
    price *
    (1 +
      stopPercent / 100);

  const shortTarget =
    price *
    (1 -
      rewardPercent / 100);

  return {
    score,

    longScore,

    shortScore,

    signal,

    direction,

    trend,

    trendClass,

    price,

    rsi,

    atr,

    ema20,

    ema50,

    ema200,

    volumeStrength,

    longReason,

    shortReason,

    reason:
      direction === "LONG"
        ? longReason
        : direction === "SHORT"
        ? shortReason
        : "Henüz yüksek kaliteli işlem kurulumu oluşmadı.",

    checks: {
      ema20:
        price > ema20,

      ema50:
        price > ema50,

      ema200:
        price > ema200,

      longRsi:
        rsi >= 45 &&
        rsi <= 68,

      shortRsi:
        rsi >= 32 &&
        rsi <= 55,

      rsi:
        rsi >= 35 &&
        rsi <= 65,

      volume:
        volumeStrength >= 100,

      bullishStructure,

      bearishStructure,
    },

    levels: {
      long: {
        entry: price,

        stop: longStop,

        target: longTarget,

        stopPercent,

        rewardPercent,
      },

      short: {
        entry: price,

        stop: shortStop,

        target: shortTarget,

        stopPercent,

        rewardPercent,
      },
    },
  };
}