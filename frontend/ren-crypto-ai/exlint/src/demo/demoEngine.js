// ============================================================
// EXLINT - DEMO TRADING ENGINE
// LONG + SHORT + LEVERAGE
//
// GERÇEK PARA KULLANMAZ.
// BINANCE'E EMİR GÖNDERMEZ.
// SADECE SANAL İŞLEM SİMÜLASYONU YAPAR.
// ============================================================

const INITIAL_BALANCE = 1000;

const MAX_RISK_PERCENT = 1;

const DEFAULT_LEVERAGE = 1;

const ALLOWED_LEVERAGES = [
  1,
  2,
  3,
  5,
  10,
];

const STORAGE_KEY =
  "exlint_demo_account_v3";

// ============================================================
// VARSAYILAN HESAP
// ============================================================

const DEFAULT_ACCOUNT = {
  initialBalance:
    INITIAL_BALANCE,

  balance:
    INITIAL_BALANCE,

  availableBalance:
    INITIAL_BALANCE,

  totalProfit: 0,

  totalLoss: 0,

  openPositions: [],

  history: [],

  stats: {
    totalTrades: 0,

    winningTrades: 0,

    losingTrades: 0,

    breakEvenTrades: 0,

    longTrades: 0,

    shortTrades: 0,

    longWins: 0,

    shortWins: 0,
  },

  createdAt:
    new Date().toISOString(),
};

// ============================================================
// YUVARLAMA
// ============================================================

function round(
  value,
  decimals = 2
) {
  const factor =
    10 ** decimals;

  return (
    Math.round(
      (value +
        Number.EPSILON) *
        factor
    ) / factor
  );
}

// ============================================================
// HESABI YÜKLE
// ============================================================

export function loadDemoAccount() {
  try {
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return structuredClone(
        DEFAULT_ACCOUNT
      );
    }

    const parsed =
      JSON.parse(saved);

    return {
      ...structuredClone(
        DEFAULT_ACCOUNT
      ),

      ...parsed,

      openPositions:
        Array.isArray(
          parsed.openPositions
        )
          ? parsed.openPositions
          : [],

      history:
        Array.isArray(
          parsed.history
        )
          ? parsed.history
          : [],

      stats: {
        ...DEFAULT_ACCOUNT.stats,

        ...(parsed.stats || {}),
      },
    };
  } catch (error) {
    console.error(
      "Demo hesap yüklenemedi:",
      error
    );

    return structuredClone(
      DEFAULT_ACCOUNT
    );
  }
}

// ============================================================
// KAYDET
// ============================================================

export function saveDemoAccount(
  account
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(account)
    );
  } catch (error) {
    console.error(
      "Demo hesap kaydedilemedi:",
      error
    );
  }
}

// ============================================================
// SIFIRLA
// ============================================================

export function resetDemoAccount() {
  const account =
    structuredClone(
      DEFAULT_ACCOUNT
    );

  saveDemoAccount(account);

  return account;
}

// ============================================================
// MAKSİMUM RİSK
// ============================================================

export function calculateMaxRisk(
  balance
) {
  if (
    !Number.isFinite(balance) ||
    balance <= 0
  ) {
    return 0;
  }

  return round(
    balance *
      (MAX_RISK_PERCENT /
        100),
    2
  );
}

// ============================================================
// KALDIRAÇ NORMALİZASYONU
// ============================================================

export function normalizeLeverage(
  leverage
) {
  const numeric =
    Number(leverage);

  if (
    !ALLOWED_LEVERAGES.includes(
      numeric
    )
  ) {
    return DEFAULT_LEVERAGE;
  }

  return numeric;
}

// ============================================================
// RİSK BAZLI POZİSYON
//
// Burada çok önemli mantık:
// Risk = maksimum %1.
//
// Örneğin:
//
// Bakiye: 1000
// Risk: 10 TL
// Stop mesafesi: %1
//
// Gerekli nominal pozisyon: 1000 TL
//
// 5X kaldıraç:
//
// Nominal: 1000 TL
// Teminat: 200 TL
// Risk: yaklaşık 10 TL
//
// Yani kaldıraç riski sınırsız büyütmez.
// ============================================================

export function calculatePositionSize({
  balance,
  availableBalance = balance,
  entry,
  stop,
  leverage = 1,
}) {
  const normalizedLeverage =
    normalizeLeverage(
      leverage
    );

  if (
    !Number.isFinite(
      balance
    ) ||
    !Number.isFinite(
      availableBalance
    ) ||
    !Number.isFinite(entry) ||
    !Number.isFinite(stop)
  ) {
    return {
      valid: false,

      reason:
        "Geçersiz matematiksel değer.",

      riskAmount: 0,

      positionValue: 0,

      marginRequired: 0,

      quantity: 0,

      leverage:
        normalizedLeverage,
    };
  }

  if (
    balance <= 0 ||
    availableBalance <= 0
  ) {
    return {
      valid: false,

      reason:
        "Kullanılabilir bakiye yok.",

      riskAmount: 0,

      positionValue: 0,

      marginRequired: 0,

      quantity: 0,

      leverage:
        normalizedLeverage,
    };
  }

  if (
    entry <= 0 ||
    stop <= 0
  ) {
    return {
      valid: false,

      reason:
        "Giriş ve stop pozitif olmalı.",

      riskAmount: 0,

      positionValue: 0,

      marginRequired: 0,

      quantity: 0,

      leverage:
        normalizedLeverage,
    };
  }

  if (
    entry === stop
  ) {
    return {
      valid: false,

      reason:
        "Giriş ile stop aynı olamaz.",

      riskAmount: 0,

      positionValue: 0,

      marginRequired: 0,

      quantity: 0,

      leverage:
        normalizedLeverage,
    };
  }

  const riskAmount =
    calculateMaxRisk(
      balance
    );

  const stopDistance =
    Math.abs(
      entry - stop
    );

  const stopDistancePercent =
    stopDistance / entry;

  if (
    stopDistancePercent <= 0
  ) {
    return {
      valid: false,

      reason:
        "Stop mesafesi geçersiz.",

      riskAmount,

      positionValue: 0,

      marginRequired: 0,

      quantity: 0,

      leverage:
        normalizedLeverage,
    };
  }

  // Risk limitine göre teorik nominal pozisyon
  const riskBasedNotional =
    riskAmount /
    stopDistancePercent;

  // Kaldıraçla mevcut teminat üzerinden açılabilecek maksimum nominal
  const leverageBasedNotional =
    availableBalance *
    normalizedLeverage;

  const positionValue =
    Math.min(
      riskBasedNotional,
      leverageBasedNotional
    );

  const marginRequired =
    positionValue /
    normalizedLeverage;

  const quantity =
    positionValue /
    entry;

  return {
    valid: true,

    riskAmount:

      riskAmount,

    stopDistancePercent:

      round(
        stopDistancePercent *
          100,
        4
      ),

    positionValue:

      round(
        positionValue,
        2
      ),

    marginRequired:

      round(
        marginRequired,
        2
      ),

    quantity:

      round(
        quantity,
        8
      ),

    leverage:
      normalizedLeverage,
  };
}

// ============================================================
// RİSK / ÖDÜL
// ============================================================

export function calculateRiskReward({
  side,
  entry,
  stop,
  target,
}) {
  if (
    !Number.isFinite(entry) ||
    !Number.isFinite(stop) ||
    !Number.isFinite(target)
  ) {
    return {
      valid: false,

      ratio: 0,

      riskPercent: 0,

      rewardPercent: 0,
    };
  }

  let riskDistance = 0;

  let rewardDistance = 0;

  if (
    side === "SHORT"
  ) {
    riskDistance =
      Math.abs(
        stop - entry
      );

    rewardDistance =
      Math.abs(
        entry - target
      );
  } else {
    riskDistance =
      Math.abs(
        entry - stop
      );

    rewardDistance =
      Math.abs(
        target - entry
      );
  }

  if (
    riskDistance <= 0 ||
    rewardDistance <= 0
  ) {
    return {
      valid: false,

      ratio: 0,

      riskPercent: 0,

      rewardPercent: 0,
    };
  }

  const riskPercent =
    (riskDistance /
      entry) *
    100;

  const rewardPercent =
    (rewardDistance /
      entry) *
    100;

  const ratio =
    rewardDistance /
    riskDistance;

  return {
    valid: true,

    ratio:
      round(ratio, 2),

    riskPercent:
      round(
        riskPercent,
        2
      ),

    rewardPercent:
      round(
        rewardPercent,
        2
      ),
  };
}

// ============================================================
// POZİSYON AÇ
// ============================================================

export function openDemoPosition({
  account,
  symbol,
  side = "LONG",
  entry,
  stop,
  target,
  score = 0,
  reason = "",
  leverage = 1,
}) {
  if (!account) {
    return {
      success: false,

      error:
        "Demo hesabı bulunamadı.",
    };
  }

  if (
    !Array.isArray(
      account.openPositions
    )
  ) {
    account.openPositions =
      [];
  }

  const normalizedLeverage =
    normalizeLeverage(
      leverage
    );

  const sameSymbol =
    account.openPositions.find(
      (position) =>
        position.symbol ===
          symbol
    );

  if (sameSymbol) {
    return {
      success: false,

      error:
        `${symbol} için zaten ${sameSymbol.side} pozisyonu açık.`,
    };
  }

  if (
    side !== "LONG" &&
    side !== "SHORT"
  ) {
    return {
      success: false,

      error:
        "Yön LONG veya SHORT olmalı.",
    };
  }

  if (
    !symbol ||
    !Number.isFinite(entry) ||
    !Number.isFinite(stop) ||
    !Number.isFinite(target)
  ) {
    return {
      success: false,

      error:
        "Pozisyon bilgileri geçersiz.",
    };
  }

  // LONG matematiği
  if (
    side === "LONG" &&
    (
      stop >= entry ||
      target <= entry
    )
  ) {
    return {
      success: false,

      error:
        "LONG işlemde stop girişin altında, hedef girişin üstünde olmalı.",
    };
  }

  // SHORT matematiği
  if (
    side === "SHORT" &&
    (
      stop <= entry ||
      target >= entry
    )
  ) {
    return {
      success: false,

      error:
        "SHORT işlemde stop girişin üstünde, hedef girişin altında olmalı.",
    };
  }

  const availableBalance =
    Number.isFinite(
      account.availableBalance
    )
      ? account.availableBalance
      : account.balance;

  const positionInfo =
    calculatePositionSize({
      balance:
        account.balance,

      availableBalance,

      entry,

      stop,

      leverage:
        normalizedLeverage,
    });

  if (
    !positionInfo.valid
  ) {
    return {
      success: false,

      error:
        positionInfo.reason,
    };
  }

  const rr =
    calculateRiskReward({
      side,

      entry,

      stop,

      target,
    });

  if (!rr.valid) {
    return {
      success: false,

      error:
        "Risk / ödül hesaplanamadı.",
    };
  }

  const position = {
    id: crypto.randomUUID(),

    symbol,

    side,

    leverage:
      normalizedLeverage,

    entry:
      round(
        entry,
        8
      ),

    stop:
      round(
        stop,
        8
      ),

    target:
      round(
        target,
        8
      ),

    quantity:
      positionInfo.quantity,

    // Nominal pozisyon
    positionValue:
      positionInfo.positionValue,

    // Gerçekten kilitlenen demo teminat
    marginRequired:
      positionInfo.marginRequired,

    riskAmount:
      positionInfo.riskAmount,

    riskPercent:
      MAX_RISK_PERCENT,

    rewardPercent:
      rr.rewardPercent,

    riskReward:
      rr.ratio,

    score,

    reason,

    openedAt:
      new Date().toISOString(),

    currentPrice:
      entry,

    unrealizedPnL: 0,

    status: "OPEN",
  };

  account.openPositions.push(
    position
  );

  account.availableBalance =
    round(
      account.balance -
        account.openPositions.reduce(
          (total, item) =>
            total +
            item.marginRequired,
          0
        ),
      2
    );

  if (
    side === "LONG"
  ) {
    account.stats.longTrades +=
      1;
  } else {
    account.stats.shortTrades +=
      1;
  }

  saveDemoAccount(account);

  return {
    success: true,

    account,

    position,
  };
}

// ============================================================
// POZİSYONLARI GÜNCELLE
// ============================================================

export function updateDemoPositions(
  account,
  currentPrices
) {
  if (!account) {
    return account;
  }

  if (
    !Array.isArray(
      account.openPositions
    )
  ) {
    account.openPositions =
      [];
  }

  account.openPositions =
    account.openPositions.map(
      (position) => {
        const currentPrice =
          currentPrices[
            position.symbol
          ];

        if (
          !Number.isFinite(
            currentPrice
          )
        ) {
          return position;
        }

        const difference =
          position.side ===
          "LONG"
            ? currentPrice -
              position.entry
            : position.entry -
              currentPrice;

        position.currentPrice =
          round(
            currentPrice,
            8
          );

        position.unrealizedPnL =
          round(
            difference *
              position.quantity,
            2
          );

        return position;
      }
    );

  saveDemoAccount(
    account
  );

  return account;
}

// ============================================================
// POZİSYON KAPAT
// ============================================================

export function closeDemoPosition(
  account,
  positionId,
  exitPrice,
  closeReason = "MANUAL"
) {
  if (!account) {
    return {
      success: false,

      error:
        "Demo hesabı bulunamadı.",
    };
  }

  const index =
    account.openPositions.findIndex(
      (position) =>
        position.id ===
        positionId
    );

  if (index === -1) {
    return {
      success: false,

      error:
        "Açık pozisyon bulunamadı.",
    };
  }

  if (
    !Number.isFinite(
      exitPrice
    )
  ) {
    return {
      success: false,

      error:
        "Geçersiz kapanış fiyatı.",
    };
  }

  const position =
    account.openPositions[
      index
    ];

  const priceDifference =
    position.side === "LONG"
      ? exitPrice -
        position.entry
      : position.entry -
        exitPrice;

  const pnl =
    priceDifference *
    position.quantity;

  const roundedPnL =
    round(pnl, 2);

  account.balance =
    round(
      account.balance +
        roundedPnL,
      2
    );

  account.openPositions.splice(
    index,
    1
  );

  account.availableBalance =
    round(
      account.balance -
        account.openPositions.reduce(
          (total, item) =>
            total +
            item.marginRequired,
          0
        ),
      2
    );

  if (
    roundedPnL > 0
  ) {
    account.totalProfit =
      round(
        account.totalProfit +
          roundedPnL,
        2
      );

    account.stats.winningTrades +=
      1;

    if (
      position.side ===
      "LONG"
    ) {
      account.stats.longWins +=
        1;
    } else {
      account.stats.shortWins +=
        1;
    }
  } else if (
    roundedPnL < 0
  ) {
    account.totalLoss =
      round(
        account.totalLoss +
          Math.abs(
            roundedPnL
          ),
        2
      );

    account.stats.losingTrades +=
      1;
  } else {
    account.stats.breakEvenTrades +=
      1;
  }

  account.stats.totalTrades +=
    1;

  const closedTrade = {
    ...position,

    exitPrice:
      round(
        exitPrice,
        8
      ),

    pnl:
      roundedPnL,

    result:
      roundedPnL > 0
        ? "WIN"
        : roundedPnL < 0
        ? "LOSS"
        : "BREAK_EVEN",

    closeReason,

    closedAt:
      new Date().toISOString(),

    status:
      "CLOSED",
  };

  account.history.unshift(
    closedTrade
  );

  if (
    account.history.length >
    300
  ) {
    account.history =
      account.history.slice(
        0,
        300
      );
  }

  saveDemoAccount(
    account
  );

  return {
    success: true,

    account,

    trade:
      closedTrade,
  };
}

// ============================================================
// OTOMATİK STOP / HEDEF
// ============================================================

export function processAutomaticExits(
  account,
  currentPrices
) {
  if (!account) {
    return {
      account,

      closedTrades: [],
    };
  }

  if (
    !Array.isArray(
      account.openPositions
    )
  ) {
    account.openPositions =
      [];
  }

  const positions =
    [
      ...account.openPositions,
    ];

  const closedTrades = [];

  for (
    const position of
      positions
  ) {
    const currentPrice =
      currentPrices[
        position.symbol
      ];

    if (
      !Number.isFinite(
        currentPrice
      )
    ) {
      continue;
    }

    let reason = null;

    if (
      position.side ===
      "LONG"
    ) {
      if (
        currentPrice <=
        position.stop
      ) {
        reason = "STOP";
      } else if (
        currentPrice >=
        position.target
      ) {
        reason =
          "TARGET";
      }
    }

    if (
      position.side ===
      "SHORT"
    ) {
      if (
        currentPrice >=
        position.stop
      ) {
        reason = "STOP";
      } else if (
        currentPrice <=
        position.target
      ) {
        reason =
          "TARGET";
      }
    }

    if (!reason) {
      continue;
    }

    const result =
      closeDemoPosition(
        account,

        position.id,

        currentPrice,

        reason
      );

    if (
      result.success
    ) {
      closedTrades.push(
        result.trade
      );
    }
  }

  return {
    account,

    closedTrades,
  };
}

// ============================================================
// WIN RATE
// ============================================================

export function getWinRate(
  account
) {
  if (
    !account ||
    account.stats.totalTrades ===
      0
  ) {
    return 0;
  }

  return round(
    (account.stats
      .winningTrades /
      account.stats
        .totalTrades) *
      100,
    1
  );
}

// ============================================================
// NET PROFIT
// ============================================================

export function getNetProfit(
  account
) {
  if (!account) {
    return 0;
  }

  return round(
    account.totalProfit -
      account.totalLoss,
    2
  );
}

// ============================================================
// DEMO İSTATİSTİKLERİ
// ============================================================

export function getDemoStats(
  account
) {
  if (!account) {
    return {
      balance: 0,

      availableBalance: 0,

      netProfit: 0,

      winRate: 0,

      totalTrades: 0,

      winningTrades: 0,

      losingTrades: 0,

      breakEvenTrades: 0,

      longTrades: 0,

      shortTrades: 0,

      longWins: 0,

      shortWins: 0,

      openPositions: 0,
    };
  }

  return {
    balance:
      round(
        account.balance,
        2
      ),

    availableBalance:
      round(
        account.availableBalance,
        2
      ),

    netProfit:
      getNetProfit(
        account
      ),

    winRate:
      getWinRate(
        account
      ),

    totalTrades:
      account.stats
        .totalTrades,

    winningTrades:
      account.stats
        .winningTrades,

    losingTrades:
      account.stats
        .losingTrades,

    breakEvenTrades:
      account.stats
        .breakEvenTrades,

    longTrades:
      account.stats
        .longTrades,

    shortTrades:
      account.stats
        .shortTrades,

    longWins:
      account.stats
        .longWins,

    shortWins:
      account.stats
        .shortWins,

    openPositions:
      account.openPositions
        .length,
  };
}

export {
  ALLOWED_LEVERAGES,
};