import { useEffect, useMemo, useState } from "react";

import "./App.css";

import Chart from "./components/Chart";
import DemoPanel from "./components/DemoPanel";

import {
  getKlines,
  getMultiple24h,
  connectLive,
  connectTickerStream,
} from "./services/binance";

import { analyzeMarket } from "./brain/brain";

const COINS = [
  {
    name: "BTC",
    pair: "BTCUSDT",
  },
  {
    name: "ETH",
    pair: "ETHUSDT",
  },
  {
    name: "SOL",
    pair: "SOLUSDT",
  },
  {
    name: "XRP",
    pair: "XRPUSDT",
  },
  {
    name: "BNB",
    pair: "BNBUSDT",
  },
];

const INTERVALS = [
  {
    label: "1D",
    value: "1d",
  },
  {
    label: "4H",
    value: "4h",
  },
  {
    label: "1H",
    value: "1h",
  },
  {
    label: "15M",
    value: "15m",
  },
  {
    label: "5M",
    value: "5m",
  },
  {
    label: "1M",
    value: "1m",
  },
];

function formatPrice(value) {
  if (!Number.isFinite(value) || value === 0) {
    return "--";
  }

  if (value >= 1000) {
    return value.toLocaleString("tr-TR", {
      maximumFractionDigits: 2,
    });
  }

  if (value >= 1) {
    return value.toLocaleString("tr-TR", {
      maximumFractionDigits: 4,
    });
  }

  return value.toLocaleString("tr-TR", {
    maximumFractionDigits: 8,
  });
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function buildAiComment(
  analysis,
  coinName
) {
  if (
    !analysis ||
    analysis.score === 0
  ) {
    return `${coinName} için yeterli veri henüz hazırlanmadı.`;
  }

  if (
    analysis.signal === "AL"
  ) {
    return `${coinName} tarafında yukarı yönlü kurulum güçlü. Trend, momentum ve hacim aynı yönde onay veriyor. Demo işleminde risk ve stop kurallarına bağlı kalınıyor.`;
  }

  if (
    analysis.signal === "SAT"
  ) {
    return `${coinName} tarafında aşağı yönlü kurulum güçlü. Fiyat trend ortalamalarının altında ve satış yönü teknik olarak öne çıkıyor.`;
  }

  if (
    analysis.shortScore >
      analysis.longScore &&
    analysis.shortScore >= 70
  ) {
    return `${coinName} aşağı yönlü baskı taşıyor ancak henüz yüksek kaliteli SHORT onayı oluşmadı. Şimdilik beklemek daha güvenli.`;
  }

  if (
    analysis.longScore >
      analysis.shortScore &&
    analysis.longScore >= 70
  ) {
    return `${coinName} yukarı yönlü görünüyor ancak AL için yeterli teyit yok. Hacim veya trend onayı beklenmeli.`;
  }

  if (
    analysis.rsi >= 70
  ) {
    return `${coinName} güçlü yükselmiş ve RSI yüksek bölgede. Yeni girişte geri çekilme veya yeniden teyit beklemek daha kontrollü.`;
  }

  if (
    analysis.rsi <= 30
  ) {
    return `${coinName} aşırı satış bölgesine yakın. Tepki ihtimali var ancak dönüş onayı bulunmadan işlem açmak riskli.`;
  }

  if (
    !analysis.checks.volume
  ) {
    return `${coinName} için teknik görünüm kararsız. En önemli eksik hacim onayı.`;
  }

  return `${coinName} için henüz yüksek kaliteli bir işlem kurulumu oluşmadı. Sistem BEKLE modunda.`;
}

export default function App() {
  const [
    selectedCoin,
    setSelectedCoin,
  ] = useState(
    COINS[0]
  );

  const [interval, setIntervalValue] =
    useState("15m");

  const [
    chartData,
    setChartData,
  ] = useState([]);

  const [
    marketData,
    setMarketData,
  ] = useState({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const analysis = useMemo(
    () =>
      analyzeMarket(
        chartData
      ),
    [chartData]
  );

  const aiComment =
    useMemo(
      () =>
        buildAiComment(
          analysis,
          selectedCoin.name
        ),
      [
        analysis,
        selectedCoin.name,
      ]
    );

  // ==========================================================
  // GRAFİK
  // ==========================================================

  useEffect(() => {
    let socket = null;

    let cancelled = false;

    async function loadChart() {
      setLoading(true);

      setError("");

      setChartData([]);

      try {
        const candles =
          await getKlines(
            selectedCoin.pair,
            interval,
            500
          );

        if (cancelled) {
          return;
        }

        setChartData(
          candles
        );

        socket =
          connectLive(
            selectedCoin.pair,
            interval,
            (candle) => {
              setChartData(
                (previous) => {
                  if (
                    !previous.length
                  ) {
                    return [
                      candle,
                    ];
                  }

                  const next = [
                    ...previous,
                  ];

                  const lastIndex =
                    next.length - 1;

                  const last =
                    next[
                      lastIndex
                    ];

                  if (
                    last.time ===
                    candle.time
                  ) {
                    next[
                      lastIndex
                    ] = candle;
                  } else if (
                    candle.time >
                    last.time
                  ) {
                    next.push(
                      candle
                    );

                    if (
                      next.length >
                      500
                    ) {
                      next.shift();
                    }
                  }

                  return next;
                }
              );
            }
          );
      } catch (err) {
        console.error(
          err
        );

        if (!cancelled) {
          setError(
            "Binance verisi alınamadı."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChart();

    return () => {
      cancelled = true;

      if (socket) {
        socket.close();
      }
    };
  }, [
    selectedCoin.pair,
    interval,
  ]);

  // ==========================================================
  // RADAR
  // ==========================================================

  useEffect(() => {
    let socket = null;

    const symbols =
      COINS.map(
        (coin) => coin.pair
      );

    async function loadMarket() {
      try {
        const initial =
          await getMultiple24h(
            symbols
          );

        setMarketData(
          initial
        );
      } catch (err) {
        console.error(
          err
        );
      }

      socket =
        connectTickerStream(
          symbols,
          (update) => {
            setMarketData(
              (previous) => ({
                ...previous,

                [update.symbol]: {
                  symbol:
                    update.symbol,

                  lastPrice:
                    update.price,

                  priceChangePercent:
                    update.changePercent,

                  highPrice:
                    update.high,

                  lowPrice:
                    update.low,

                  volume:
                    update.volume,
                },
              })
            );
          }
        );
    }

    loadMarket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand-block">
          <div className="brand-mark">
            X
          </div>

          <div>
            <div className="brand-name">
              EXLINT
            </div>

            <div className="brand-subtitle">
              PERSONAL AI MARKET TERMINAL
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="market-state">
            <span className="live-dot"></span>
            PİYASA CANLI
          </div>

          <div className="header-divider"></div>

          <div className="demo-badge">
            DEMO
          </div>
        </div>
      </header>

      <main className="terminal-grid">
        <aside className="sidebar">
          <div className="panel-heading">
            MARKET RADAR
          </div>

          <div className="panel-caption">
            İzlenen piyasalar
          </div>

          <div className="coin-list">
            {COINS.map(
              (coin) => {
                const info =
                  marketData[
                    coin.pair
                  ];

                const selected =
                  selectedCoin.pair ===
                  coin.pair;

                const change =
                  info?.priceChangePercent ??
                  0;

                return (
                  <button
                    key={
                      coin.pair
                    }
                    className={
                      selected
                        ? "coin-row selected"
                        : "coin-row"
                    }
                    onClick={() =>
                      setSelectedCoin(
                        coin
                      )
                    }
                  >
                    <div className="coin-row-left">
                      <div className="coin-icon">
                        {coin.name.charAt(
                          0
                        )}
                      </div>

                      <div>
                        <div className="coin-name">
                          {coin.name}
                        </div>

                        <div className="coin-pair">
                          {
                            coin.pair
                          }
                        </div>
                      </div>
                    </div>

                    <div className="coin-row-right">
                      <div className="coin-last">
                        {formatPrice(
                          info?.lastPrice
                        )}
                      </div>

                      <div
                        className={
                          change >=
                          0
                            ? "coin-change positive"
                            : "coin-change negative"
                        }
                      >
                        {formatPercent(
                          change
                        )}
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <div className="sidebar-divider"></div>

          <div className="panel-heading">
            YÖN
          </div>

          <div
            className={`market-mode ${analysis.trendClass}`}
          >
            <span className="mode-dot"></span>

            <div>
              <strong>
                {analysis.trend}
              </strong>

              <span>
                {selectedCoin.name}
                {" "}
                market yapısı
              </span>
            </div>
          </div>
        </aside>

        <section className="main-column">
          <div className="instrument-bar">
            <div className="instrument-left">
              <div className="instrument-symbol">
                {
                  selectedCoin.name
                }
                <span>
                  /USDT
                </span>
              </div>

              <div className="instrument-live">
                <span></span>
                CANLI
              </div>
            </div>

            <div className="timeframe-bar">
              {INTERVALS.map(
                (item) => (
                  <button
                    key={
                      item.value
                    }
                    className={
                      interval ===
                      item.value
                        ? "timeframe active"
                        : "timeframe"
                    }
                    onClick={() =>
                      setIntervalValue(
                        item.value
                      )
                    }
                  >
                    {
                      item.label
                    }
                  </button>
                )
              )}
            </div>
          </div>

          <section className="chart-panel">
            <div className="chart-panel-header">
              <div>
                <div className="chart-title">
                  {
                    selectedCoin.pair
                  }
                </div>

                <div className="chart-subtitle">
                  PRICE ACTION · EMA 20 / 50 / 200
                </div>
              </div>

              {loading && (
                <div className="chart-loading">
                  VERİ YÜKLENİYOR...
                </div>
              )}
            </div>

            {error ? (
              <div className="chart-error">
                {error}
              </div>
            ) : (
              <Chart
                data={
                  chartData
                }
                symbol={
                  selectedCoin.pair
                }
              />
            )}
          </section>

          <section className="technical-strip">
            <div className="metric">
              <span>
                FİYAT
              </span>

              <strong>
                {formatPrice(
                  analysis.price
                )}
              </strong>
            </div>

            <div className="metric">
              <span>
                RSI
              </span>

              <strong>
                {analysis.rsi
                  ? analysis.rsi.toFixed(
                      1
                    )
                  : "--"}
              </strong>
            </div>

            <div className="metric">
              <span>
                LONG
              </span>

              <strong>
                {analysis.longScore}
              </strong>
            </div>

            <div className="metric">
              <span>
                SHORT
              </span>

              <strong>
                {analysis.shortScore}
              </strong>
            </div>

            <div className="metric">
              <span>
                ATR
              </span>

              <strong>
                {analysis.atr
                  ? formatPrice(
                      analysis.atr
                    )
                  : "--"}
              </strong>
            </div>

            <div className="metric">
              <span>
                HACİM
              </span>

              <strong>
                %
                {analysis.volumeStrength
                  ? analysis.volumeStrength.toFixed(
                      0
                    )
                  : "0"}
              </strong>
            </div>
          </section>
        </section>

        <aside className="ai-sidebar">
          <section className="ai-decision">
            <div className="ai-label">
              EXLINT AI
            </div>

            <div className="ai-coin-name">
              {
                selectedCoin.name
              }
              /USDT
            </div>

            <div
              className={`score-large ${analysis.trendClass}`}
            >
              {analysis.score}

              <span>
                /100
              </span>
            </div>

            <div
              className={`decision-pill ${analysis.signal.toLowerCase()}`}
            >
              {analysis.signal}
            </div>

            <div className="decision-description">
              {analysis.direction ===
              "LONG"
                ? "Yukarı yönlü fırsat"
                : analysis.direction ===
                  "SHORT"
                ? "Aşağı yönlü fırsat"
                : "İşlem yok"}
            </div>
          </section>

          <section className="ai-section">
            <div className="section-label">
              EXLINT AI YORUMU
            </div>

            <div className="ai-comment">
              {aiComment}
            </div>
          </section>

          <section className="ai-section">
            <div className="section-label">
              YÖN ANALİZİ
            </div>

            <div className="direction-analysis">
              <div className="direction-score long">
                <span>
                  LONG
                </span>

                <strong>
                  {
                    analysis.longScore
                  }
                </strong>
              </div>

              <div className="direction-score short">
                <span>
                  SHORT
                </span>

                <strong>
                  {
                    analysis.shortScore
                  }
                </strong>
              </div>
            </div>
          </section>

          <section className="ai-section">
            <div className="section-label">
              TEKNİK KONTROLLER
            </div>

            <div className="validation-list">
              <div className="validation-row">
                <span>
                  EMA20
                </span>

                <strong
                  className={
                    analysis.checks
                      .ema20
                      ? "check-ok"
                      : "check-no"
                  }
                >
                  {analysis.checks
                    .ema20
                    ? "✓"
                    : "—"}
                </strong>
              </div>

              <div className="validation-row">
                <span>
                  EMA50
                </span>

                <strong
                  className={
                    analysis.checks
                      .ema50
                      ? "check-ok"
                      : "check-no"
                  }
                >
                  {analysis.checks
                    .ema50
                    ? "✓"
                    : "—"}
                </strong>
              </div>

              <div className="validation-row">
                <span>
                  EMA200
                </span>

                <strong
                  className={
                    analysis.checks
                      .ema200
                      ? "check-ok"
                      : "check-no"
                  }
                >
                  {analysis.checks
                    .ema200
                    ? "✓"
                    : "—"}
                </strong>
              </div>

              <div className="validation-row">
                <span>
                  HACİM
                </span>

                <strong
                  className={
                    analysis.checks
                      .volume
                      ? "check-ok"
                      : "check-no"
                  }
                >
                  {analysis.checks
                    .volume
                    ? "ONAY"
                    : "ZAYIF"}
                </strong>
              </div>
            </div>
          </section>

          <section className="risk-summary">
            <div className="section-label">
              RİSK KONTROLÜ
            </div>

            <div className="risk-row">
              <span>
                İşlem riski
              </span>

              <strong>
                %1
              </strong>
            </div>

            <div className="risk-row">
              <span>
                Sermaye
              </span>

              <strong>
                1.000 TL
              </strong>
            </div>

            <div className="risk-row">
              <span>
                R/R
              </span>

              <strong>
                En az 1:2
              </strong>
            </div>
          </section>
        </aside>
      </main>

      <DemoPanel
        symbol={
          selectedCoin.pair
        }
        currentPrice={
          marketData[
            selectedCoin.pair
          ]?.lastPrice ??
          analysis.price
        }
        signal={
          analysis.signal
        }
        direction={
          analysis.direction
        }
        score={
          analysis.score
        }
        analysis={
          analysis
        }
      />

      <footer className="terminal-footer">
        <span>
          EXLINT · Personal AI Market Terminal
        </span>

        <span>
          Demo execution · Gerçek emir gönderilmez
        </span>
      </footer>
    </div>
  );
}