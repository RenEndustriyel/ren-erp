import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

import { calculateEMA } from "../brain/brain";

export default function Chart({ data = [], symbol = "BTCUSDT" }) {
  const containerRef = useRef(null);
  const chartWrapperRef = useRef(null);

  const chartRef = useRef(null);

  const candleSeriesRef = useRef(null);
  const ema20Ref = useRef(null);
  const ema50Ref = useRef(null);
  const ema200Ref = useRef(null);

  const initializedRef = useRef(false);

  const [fullscreen, setFullscreen] = useState(false);

  // ============================================================
  // GRAFİĞİ SADECE 1 KEZ OLUŞTUR
  // ============================================================

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 560,

      layout: {
        background: {
          color: "#07111f",
        },

        textColor: "#94a3b8",
      },

      grid: {
        vertLines: {
          color: "#172235",
        },

        horzLines: {
          color: "#172235",
        },
      },

      rightPriceScale: {
        borderColor: "#263548",
        scaleMargins: {
          top: 0.08,
          bottom: 0.08,
        },
      },

      timeScale: {
        borderColor: "#263548",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
      },

      crosshair: {
        mode: 0,

        vertLine: {
          color: "#64748b",
          width: 1,
          style: 2,
        },

        horzLine: {
          color: "#64748b",
          width: 1,
          style: 2,
        },
      },

      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },

      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#16c784",
      downColor: "#ea3943",

      borderUpColor: "#16c784",
      borderDownColor: "#ea3943",

      wickUpColor: "#16c784",
      wickDownColor: "#ea3943",
    });

    const ema20 = chart.addSeries(LineSeries, {
      color: "#00e5a0",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const ema50 = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const ema200 = chart.addSeries(LineSeries, {
      color: "#ef4444",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;

    candleSeriesRef.current = candles;
    ema20Ref.current = ema20;
    ema50Ref.current = ema50;
    ema200Ref.current = ema200;

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;

      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height: fullscreen
          ? Math.max(window.innerHeight - 90, 500)
          : 560,
      });
    });

    resizeObserver.observe(containerRef.current);

    initializedRef.current = true;

    return () => {
      resizeObserver.disconnect();

      chart.remove();

      chartRef.current = null;
      candleSeriesRef.current = null;
      ema20Ref.current = null;
      ema50Ref.current = null;
      ema200Ref.current = null;

      initializedRef.current = false;
    };
  }, [fullscreen]);

  // ============================================================
  // VERİLERİ GÜNCELLE
  // ============================================================

  useEffect(() => {
    if (!initializedRef.current) return;

    if (!data.length) return;

    if (
      !candleSeriesRef.current ||
      !ema20Ref.current ||
      !ema50Ref.current ||
      !ema200Ref.current
    ) {
      return;
    }

    candleSeriesRef.current.setData(data);

    const ema20 = calculateEMA(data, 20);
    const ema50 = calculateEMA(data, 50);
    const ema200 = calculateEMA(data, 200);

    ema20Ref.current.setData(ema20);
    ema50Ref.current.setData(ema50);
    ema200Ref.current.setData(ema200);

    // YALNIZCA İLK VERİ YÜKLENDİĞİNDE KADRAJA OTURT.
    // Her yeni mumda fitContent YOK.
    if (chartRef.current) {
      const logicalRange = chartRef.current
        .timeScale()
        .getVisibleLogicalRange();

      if (!logicalRange) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data]);

  // ============================================================
  // COIN DEĞİŞTİĞİNDE KADRAJA OTURT
  // ============================================================

  useEffect(() => {
    if (!chartRef.current) return;
    if (!data.length) return;

    chartRef.current.timeScale().fitContent();
  }, [symbol]);

  // ============================================================
  // TAM EKRAN
  // ============================================================

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active =
        document.fullscreenElement === chartWrapperRef.current;

      setFullscreen(active);
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await chartWrapperRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Tam ekran hatası:", error);
    }
  }

  return (
    <div
      ref={chartWrapperRef}
      className={
        fullscreen
          ? "chart-wrapper fullscreen"
          : "chart-wrapper"
      }
    >
      <div className="chart-tools">
        <div className="chart-legend">
          <span className="legend-item ema20">
            EMA 20
          </span>

          <span className="legend-item ema50">
            EMA 50
          </span>

          <span className="legend-item ema200">
            EMA 200
          </span>
        </div>

        <button
          className="fullscreen-button"
          onClick={toggleFullscreen}
          title={
            fullscreen
              ? "Tam ekrandan çık"
              : "Tam ekran"
          }
        >
          {fullscreen ? "⛶ KÜÇÜLT" : "⛶ TAM EKRAN"}
        </button>
      </div>

      <div
        ref={containerRef}
        className="chart-container"
      />
    </div>
  );
}