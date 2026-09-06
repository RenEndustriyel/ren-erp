import { useEffect, useMemo, useState } from "react";

import {
  loadDemoAccount,
  resetDemoAccount,
  openDemoPosition,
  closeDemoPosition,
  updateDemoPositions,
  processAutomaticExits,
  getDemoStats,
  calculateRiskReward,
  calculatePositionSize,
  ALLOWED_LEVERAGES,
} from "../demo/demoEngine";

const styles = `
.demo-terminal-x {
  width: 100%;
  margin-top: 16px;
  padding: 18px;
  box-sizing: border-box;

  background: #08111d;
  border: 1px solid #1b2a3d;
  border-radius: 14px;

  color: #e8eef4;
  font-family:
    Inter,
    Segoe UI,
    Arial,
    sans-serif;

  box-shadow:
    0 12px 35px rgba(0,0,0,.18);

  overflow: hidden;
}

.demo-terminal-x *,
.demo-terminal-x *::before,
.demo-terminal-x *::after {
  box-sizing: border-box;
}

.demo-header-x {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  padding-bottom: 15px;
  border-bottom: 1px solid #172638;
}

.demo-title-x {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .9px;
  color: #e9eff4;
}

.demo-subtitle-x {
  margin-top: 5px;
  color: #607084;
  font-size: 8px;
}

.demo-right-x {
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo-balance-x {
  text-align: right;
}

.demo-balance-x small {
  display: block;
  color: #5b6b7e;
  font-size: 7px;
  font-weight: 800;
}

.demo-balance-x strong {
  display: block;
  margin-top: 4px;
  color: #f4f7fa;
  font-size: 14px;
  font-weight: 900;
}

.auto-x {
  padding: 8px 11px;
  border-radius: 7px;

  border: 1px solid #26384e;
  background: #0b1623;

  color: #7c8c9f;

  cursor: pointer;

  font-size: 8px;
  font-weight: 900;
}

.auto-x.active {
  color: #00e5a0;
  border-color: rgba(0,229,160,.35);
  background: rgba(0,229,160,.07);
}

.summary-x {
  display: grid;
  grid-template-columns:
    2fr
    1fr
    1fr
    1fr
    1fr;

  gap: 1px;

  margin-top: 12px;

  background: #18273a;

  border: 1px solid #18273a;
  border-radius: 9px;

  overflow: hidden;
}

.summary-cell-x {
  min-width: 0;
  padding: 11px 12px;
  background: #091521;
}

.summary-cell-x span {
  display: block;

  color: #566678;

  font-size: 7px;
  font-weight: 800;

  letter-spacing: .5px;
}

.summary-cell-x strong {
  display: block;

  margin-top: 5px;

  font-size: 12px;
  font-weight: 900;
}

.green-x {
  color: #16c784 !important;
}

.red-x {
  color: #ea3943 !important;
}

.yellow-x {
  color: #f5b74f !important;
}

.signal-bar-x {
  display: grid;

  grid-template-columns:
    2fr
    1fr
    1fr
    1.2fr;

  gap: 1px;

  margin-top: 10px;

  background: #18273a;

  border: 1px solid #18273a;
  border-radius: 9px;

  overflow: hidden;
}

.signal-cell-x {
  padding: 11px 13px;
  background: #091521;
}

.signal-cell-x span {
  display: block;
  color: #596a7d;
  font-size: 7px;
  font-weight: 800;
}

.signal-cell-x strong {
  display: block;
  margin-top: 5px;
  color: #e4ebf0;
  font-size: 11px;
  font-weight: 900;
}

.instrument-x {
  display: flex;
  align-items: center;
  gap: 10px;
}

.instrument-x strong {
  margin: 0;
}

.instrument-x em {
  margin: 0;
  font-style: normal;
  color: #627286;
  font-size: 8px;
}

.leverage-x {
  margin-top: 10px;

  padding: 12px;

  background: #091521;

  border: 1px solid #18273a;
  border-radius: 9px;
}

.leverage-head-x {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 9px;
}

.leverage-head-x strong {
  color: #8797a8;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .8px;
}

.leverage-head-x span {
  color: #48586b;
  font-size: 7px;
}

.leverage-list-x {
  display: grid;

  grid-template-columns:
    repeat(5, 1fr);

  gap: 6px;
}

.leverage-item-x {
  min-width: 0;

  display: grid;

  grid-template-columns: auto 1fr;

  gap: 3px 7px;

  align-items: center;

  padding: 9px;

  background: #07111d;

  border: 1px solid #1a2b40;

  border-radius: 8px;

  cursor: pointer;

  text-align: left;

  color: #dce4eb;
}

.leverage-item-x.active {
  border-color: rgba(0,229,160,.45);

  background:
    linear-gradient(
      145deg,
      rgba(0,229,160,.08),
      rgba(0,229,160,.02)
    );
}

.leverage-item-x b {
  grid-row: 1 / 3;

  font-size: 11px;
}

.leverage-item-x span {
  font-size: 7px;
  font-weight: 900;
}

.leverage-item-x small {
  color: #536376;
  font-size: 6px;
}

.trade-grid-x {
  display: grid;

  grid-template-columns:
    1fr
    1fr;

  gap: 10px;

  margin-top: 10px;
}

.trade-box-x {
  background: #091521;

  border: 1px solid #18273a;

  border-radius: 9px;

  padding: 13px;
}

.box-head-x {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-head-x strong {
  color: #8796a7;
  font-size: 8px;
  font-weight: 900;

  letter-spacing: .8px;
}

.box-head-x span {
  color: #536376;
  font-size: 7px;
}

.side-badges-x {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 6px;

  margin-top: 9px;
}

.side-badge-x {
  min-height: 34px;

  border-radius: 7px;

  font-size: 8px;

  font-weight: 900;

  cursor: pointer;
}

.side-badge-x.long {
  color: #16c784;

  border: 1px solid rgba(22,199,132,.18);

  background: rgba(22,199,132,.04);
}

.side-badge-x.long.active {
  background: rgba(22,199,132,.13);

  border-color: rgba(22,199,132,.38);
}

.side-badge-x.short {
  color: #ea3943;

  border: 1px solid rgba(234,57,67,.18);

  background: rgba(234,57,67,.04);
}

.side-badge-x.short.active {
  background: rgba(234,57,67,.13);

  border-color: rgba(234,57,67,.38);
}

.fields-x {
  display: grid;

  grid-template-columns:
    repeat(3,1fr);

  gap: 7px;

  margin-top: 9px;
}

.fields-x label {
  display: block;

  color: #56677a;

  font-size: 7px;
  font-weight: 800;
}

.fields-x input {
  width: 100%;

  height: 35px;

  margin-top: 5px;

  padding: 0 9px;

  border-radius: 7px;

  border: 1px solid #1d3046;

  background: #07111d;

  color: #e7edf2;

  outline: none;

  font-size: 9px;
}

.fields-x input:focus {
  border-color: #00b886;
}

.metrics-x {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 6px;

  margin-top: 8px;
}

.metric-x {
  padding: 8px;

  background: #07111d;

  border: 1px solid #15273a;

  border-radius: 7px;
}

.metric-x span {
  display: block;
  color: #4e6073;
  font-size: 6px;
  font-weight: 800;
}

.metric-x strong {
  display: block;
  margin-top: 4px;
  color: #e0e7ed;
  font-size: 9px;
  font-weight: 900;
}

.execute-x {
  width: 100%;

  height: 38px;

  margin-top: 8px;

  border-radius: 7px;

  cursor: pointer;

  font-size: 9px;

  font-weight: 900;
}

.execute-x.long {
  color: #16c784;

  background: rgba(22,199,132,.08);

  border: 1px solid rgba(22,199,132,.25);
}

.execute-x.short {
  color: #ea3943;

  background: rgba(234,57,67,.08);

  border: 1px solid rgba(234,57,67,.25);
}

.execute-x:hover {
  filter: brightness(1.12);
}

.position-empty-x {
  min-height: 177px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  text-align: center;

  color: #708094;
}

.position-empty-x strong {
  color: #8898a9;
  font-size: 9px;
}

.position-empty-x span {
  margin-top: 5px;
  color: #4d5e71;
  font-size: 7px;
}

.position-card-x {
  margin-top: 9px;

  padding: 11px;

  border-radius: 8px;

  border: 1px solid #20364c;

  background:
    linear-gradient(
      145deg,
      rgba(0,229,160,.025),
      #07111d
    );
}

.position-head-x {
  display: flex;

  justify-content: space-between;

  align-items: center;
}

.position-head-x small {
  display: block;

  color: #526477;

  font-size: 6px;
}

.position-head-x strong {
  display: block;

  margin-top: 3px;

  font-size: 10px;
}

.position-value-x {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 6px;

  margin-top: 9px;
}

.position-value-x div {
  padding: 8px;

  background: #091521;

  border: 1px solid #15273a;

  border-radius: 7px;
}

.position-value-x span {
  display: block;

  color: #4d5f72;

  font-size: 6px;
}

.position-value-x strong {
  display: block;

  margin-top: 4px;

  color: #e0e7ed;

  font-size: 8px;
}

.position-foot-x {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-top: 9px;

  color: #68798c;

  font-size: 7px;
}

.position-foot-x strong {
  color: #dce4ea;
}

.close-x {
  padding: 7px 11px;

  border-radius: 6px;

  border: 1px solid rgba(234,57,67,.2);

  background: rgba(234,57,67,.07);

  color: #ea3943;

  cursor: pointer;

  font-size: 7px;

  font-weight: 900;
}

.message-x {
  margin-top: 8px;

  padding: 9px 11px;

  border-radius: 7px;

  font-size: 8px;

  line-height: 1.5;
}

.message-x.success {
  color: #16c784;

  background: rgba(22,199,132,.06);

  border: 1px solid rgba(22,199,132,.18);
}

.message-x.error {
  color: #ea3943;

  background: rgba(234,57,67,.06);

  border: 1px solid rgba(234,57,67,.18);
}

.history-x {
  margin-top: 10px;

  border-top: 1px solid #162638;

  padding-top: 10px;
}

.history-toggle-x {
  width: 100%;

  display: flex;

  align-items: center;

  gap: 9px;

  padding: 0;

  background: transparent;

  color: #637488;

  cursor: pointer;

  text-align: left;

  font-size: 7px;

  font-weight: 900;
}

.history-count-x {
  padding: 3px 6px;

  border-radius: 5px;

  background: #0a1622;

  border: 1px solid #17283b;

  color: #bbc6d0;

  font-size: 7px;
}

.history-arrow-x {
  margin-left: auto;

  color: #425266;
}

.history-list-x {
  margin-top: 8px;

  display: flex;

  flex-direction: column;

  gap: 4px;
}

.history-row-x {
  display: grid;

  grid-template-columns:
    1fr
    1fr
    90px;

  gap: 8px;

  align-items: center;

  padding: 8px 10px;

  border-radius: 7px;

  background: #091521;

  border: 1px solid #14263a;
}

.history-row-x span {
  color: #55677a;
  font-size: 7px;
}

.history-row-x strong {
  font-size: 8px;
}

.reset-x {
  margin-top: 7px;

  padding: 6px 9px;

  border-radius: 6px;

  border: 1px solid #1b2d41;

  background: #091521;

  color: #617286;

  cursor: pointer;

  font-size: 7px;

  font-weight: 800;
}

@media (max-width: 1100px) {
  .trade-grid-x {
    grid-template-columns: 1fr;
  }

  .position-value-x {
    grid-template-columns:
      repeat(4,1fr);
  }
}

@media (max-width: 800px) {
  .summary-x {
    grid-template-columns:
      repeat(2,1fr);
  }

  .summary-cell-x:first-child {
    grid-column: 1 / -1;
  }

  .signal-bar-x {
    grid-template-columns:
      repeat(2,1fr);
  }

  .leverage-list-x {
    grid-template-columns:
      repeat(3,1fr);
  }

  .fields-x {
    grid-template-columns: 1fr;
  }

  .metrics-x {
    grid-template-columns:
      repeat(2,1fr);
  }

  .position-value-x {
    grid-template-columns:
      repeat(2,1fr);
  }
}

@media (max-width: 560px) {
  .demo-terminal-x {
    padding: 11px;
  }

  .demo-header-x {
    flex-direction: column;
    align-items: flex-start;
  }

  .demo-right-x {
    width: 100%;
    justify-content: space-between;
  }

  .summary-x,
  .signal-bar-x {
    grid-template-columns: 1fr;
  }

  .summary-cell-x:first-child {
    grid-column: auto;
  }

  .leverage-list-x {
    grid-template-columns:
      repeat(2,1fr);
  }

  .history-row-x {
    grid-template-columns: 1fr;
  }
}
`;

function formatMoney(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPrice(value) {
  if (!Number.isFinite(value)) {
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

function signalClass(signal) {
  if (signal === "AL") {
    return "green-x";
  }

  if (signal === "SAT") {
    return "red-x";
  }

  return "yellow-x";
}

export default function DemoPanel({
  symbol = "BTCUSDT",
  currentPrice = 0,
  signal = "BEKLE",
  direction = "NONE",
  score = 0,
  analysis = null,
}) {
  const [account, setAccount] =
    useState(() => loadDemoAccount());

  const [autoTrade, setAutoTrade] =
    useState(false);

  const [manualSide, setManualSide] =
    useState(
      direction === "SHORT"
        ? "SHORT"
        : "LONG"
    );

  const [leverage, setLeverage] =
    useState(1);

  const [entry, setEntry] =
    useState("");

  const [stop, setStop] =
    useState("");

  const [target, setTarget] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("success");

  const [historyOpen, setHistoryOpen] =
    useState(false);

  const [
    lastAutoSignal,
    setLastAutoSignal,
  ] = useState("");

  // ==========================================================
  // STİLLERİ SAYFAYA EKLE
  // ==========================================================

  useEffect(() => {
    const styleId =
      "exlint-demo-terminal-styles";

    if (
      document.getElementById(
        styleId
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id = styleId;

    style.textContent = styles;

    document.head.appendChild(
      style
    );

    return () => {
      const existing =
        document.getElementById(
          styleId
        );

      if (existing) {
        existing.remove();
      }
    };
  }, []);

  // ==========================================================
  // YÖN
  // ==========================================================

  useEffect(() => {
    if (
      direction === "LONG"
    ) {
      setManualSide("LONG");
    }

    if (
      direction === "SHORT"
    ) {
      setManualSide("SHORT");
    }
  }, [direction]);

  // ==========================================================
  // SEVİYELER
  // ==========================================================

  useEffect(() => {
    if (
      !analysis ||
      !currentPrice
    ) {
      return;
    }

    const levels =
      manualSide === "SHORT"
        ? analysis.levels?.short
        : analysis.levels?.long;

    if (!levels) {
      return;
    }

    setEntry(
      String(
        Number(
          levels.entry.toFixed(8)
        )
      )
    );

    setStop(
      String(
        Number(
          levels.stop.toFixed(8)
        )
      )
    );

    setTarget(
      String(
        Number(
          levels.target.toFixed(8)
        )
      )
    );
  }, [
    analysis,
    currentPrice,
    manualSide,
    symbol,
  ]);

  // ==========================================================
  // CANLI POZİSYON
  // ==========================================================

  useEffect(() => {
    if (
      !account ||
      !currentPrice
    ) {
      return;
    }

    if (
      !account.openPositions?.some(
        (position) =>
          position.symbol === symbol
      )
    ) {
      return;
    }

    let working =
      {
        ...account,

        openPositions: [
          ...account.openPositions,
        ],

        history: [
          ...account.history,
        ],

        stats: {
          ...account.stats,
        },
      };

    working =
      updateDemoPositions(
        working,
        {
          [symbol]:
            currentPrice,
        }
      );

    const exits =
      processAutomaticExits(
        working,
        {
          [symbol]:
            currentPrice,
        }
      );

    setAccount(
      exits.account
    );

    if (
      exits.closedTrades
        .length > 0
    ) {
      const trade =
        exits.closedTrades[0];

      setMessage(
        `${trade.symbol} ${
          trade.closeReason ===
          "TARGET"
            ? "HEDEFE"
            : "STOP'A"
        } ulaştı · ${
          trade.pnl >= 0
            ? "+"
            : ""
        }${formatMoney(
          trade.pnl
        )} TL`
      );

      setMessageType(
        trade.pnl >= 0
          ? "success"
          : "error"
      );
    }
  }, [
    currentPrice,
    symbol,
  ]);

  // ==========================================================
  // OTOMATİK TEST
  // ==========================================================

  useEffect(() => {
    if (!autoTrade) {
      return;
    }

    if (
      signal !== "AL" &&
      signal !== "SAT"
    ) {
      return;
    }

    if (score < 85) {
      return;
    }

    if (
      !analysis ||
      !currentPrice
    ) {
      return;
    }

    const signalId =
      `${symbol}-${signal}-${score}`;

    if (
      lastAutoSignal ===
      signalId
    ) {
      return;
    }

    const existing =
      account.openPositions?.find(
        (position) =>
          position.symbol ===
          symbol
      );

    if (existing) {
      return;
    }

    const side =
      signal === "SAT"
        ? "SHORT"
        : "LONG";

    const levels =
      side === "SHORT"
        ? analysis.levels?.short
        : analysis.levels?.long;

    if (!levels) {
      return;
    }

    const result =
      openDemoPosition({
        account: {
          ...account,

          openPositions: [
            ...account.openPositions,
          ],

          history: [
            ...account.history,
          ],

          stats: {
            ...account.stats,
          },
        },

        symbol,

        side,

        entry:
          levels.entry,

        stop:
          levels.stop,

        target:
          levels.target,

        score,

        reason:
          analysis.reason || "",

        leverage,
      });

    if (!result.success) {
      return;
    }

    setAccount(
      result.account
    );

    setLastAutoSignal(
      signalId
    );

    setMessage(
      `${symbol} ${
        side === "LONG"
          ? "LONG / AL"
          : "SHORT / SAT"
      } otomatik açıldı · ${leverage}X`
    );

    setMessageType(
      "success"
    );
  }, [
    autoTrade,
    signal,
    score,
    symbol,
    analysis,
    currentPrice,
    leverage,
    account,
    lastAutoSignal,
  ]);

  // ==========================================================
  // R/R
  // ==========================================================

  const preview = useMemo(() => {
    const e = Number(entry);
    const s = Number(stop);
    const t = Number(target);

    if (!e || !s || !t) {
      return null;
    }

    return calculateRiskReward({
      side:
        manualSide,

      entry: e,

      stop: s,

      target: t,
    });
  }, [
    manualSide,
    entry,
    stop,
    target,
  ]);

  // ==========================================================
  // KALDIRAÇ HESAPLARI
  // ==========================================================

  const leverageRows =
    useMemo(() => {
      const e = Number(entry);
      const s = Number(stop);

      if (!e || !s) {
        return [];
      }

      return ALLOWED_LEVERAGES.map(
        (item) => ({
          leverage: item,

          ...calculatePositionSize({
            balance:
              account.balance,

            availableBalance:
              account.availableBalance,

            entry: e,

            stop: s,

            leverage: item,
          }),
        })
      );
    }, [
      account.balance,
      account.availableBalance,
      entry,
      stop,
    ]);

  const selectedLeverage =
    leverageRows.find(
      (item) =>
        item.leverage ===
        leverage
    );

  // ==========================================================
  // POZİSYON AÇ
  // ==========================================================

  function handleOpen() {
    setMessage("");

    if (
      signal === "BEKLE"
    ) {
      setMessage(
        "EXLINT şu anda BEKLE diyor. Demo testini manuel olarak açmak için sinyal koşulunu ayrıca gevşetmemiz gerekir."
      );

      setMessageType(
        "error"
      );

      return;
    }

    const e = Number(entry);
    const s = Number(stop);
    const t = Number(target);

    if (!e || !s || !t) {
      setMessage(
        "Giriş, stop ve hedef bilgilerini kontrol et."
      );

      setMessageType(
        "error"
      );

      return;
    }

    if (
      manualSide === "LONG" &&
      (
        s >= e ||
        t <= e
      )
    ) {
      setMessage(
        "LONG için stop girişin altında, hedef girişin üstünde olmalı."
      );

      setMessageType(
        "error"
      );

      return;
    }

    if (
      manualSide === "SHORT" &&
      (
        s <= e ||
        t >= e
      )
    ) {
      setMessage(
        "SHORT için stop girişin üstünde, hedef girişin altında olmalı."
      );

      setMessageType(
        "error"
      );

      return;
    }

    if (
      preview &&
      preview.ratio < 2
    ) {
      setMessage(
        "İşlem reddedildi: minimum R/R 1:2."
      );

      setMessageType(
        "error"
      );

      return;
    }

    const result =
      openDemoPosition({
        account: {
          ...account,

          openPositions: [
            ...account.openPositions,
          ],

          history: [
            ...account.history,
          ],

          stats: {
            ...account.stats,
          },
        },

        symbol,

        side:
          manualSide,

        entry: e,

        stop: s,

        target: t,

        score,

        reason:
          analysis?.reason || "",

        leverage,
      });

    if (!result.success) {
      setMessage(
        result.error
      );

      setMessageType(
        "error"
      );

      return;
    }

    setAccount(
      result.account
    );

    setMessage(
      `${symbol} ${
        manualSide ===
        "LONG"
          ? "LONG"
          : "SHORT"
      } açıldı · ${leverage}X · Nominal ${formatMoney(
        result.position.positionValue
      )} TL · Teminat ${formatMoney(
        result.position.marginRequired
      )} TL · Risk ${formatMoney(
        result.position.riskAmount
      )} TL`
    );

    setMessageType(
      "success"
    );
  }

  // ==========================================================
  // KAPAT
  // ==========================================================

  function handleClose(
    position
  ) {
    const result =
      closeDemoPosition(
        {
          ...account,

          openPositions: [
            ...account.openPositions,
          ],

          history: [
            ...account.history,
          ],

          stats: {
            ...account.stats,
          },
        },

        position.id,

        currentPrice,

        "MANUAL"
      );

    if (!result.success) {
      setMessage(
        result.error
      );

      setMessageType(
        "error"
      );

      return;
    }

    setAccount(
      result.account
    );

    setMessage(
      `İşlem kapandı · ${
        result.trade.pnl >=
        0
          ? "+"
          : ""
      }${formatMoney(
        result.trade.pnl
      )} TL`
    );

    setMessageType(
      result.trade.pnl >=
      0
        ? "success"
        : "error"
    );
  }

  // ==========================================================
  // RESET
  // ==========================================================

  function handleReset() {
    const confirmed =
      window.confirm(
        "Demo hesap 1.000 TL'ye sıfırlansın mı?"
      );

    if (!confirmed) {
      return;
    }

    const reset =
      resetDemoAccount();

    setAccount(reset);

    setLastAutoSignal("");

    setMessage(
      "Demo hesap sıfırlandı."
    );

    setMessageType(
      "success"
    );
  }

  const stats =
    getDemoStats(account);

  const radarSignal =
    signal === "AL" &&
    score >= 85
      ? "AL"
      : signal === "SAT" &&
        score >= 85
      ? "SAT"
      : "BEKLE";

  return (
    <section className="demo-terminal-x">
      {/* ======================================================
          HEADER
         ====================================================== */}

      <header className="demo-header-x">
        <div>
          <div className="demo-title-x">
            DEMO TRADING
          </div>

          <div className="demo-subtitle-x">
            EXLINT sinyallerini gerçek para kullanmadan test et
          </div>
        </div>

        <div className="demo-right-x">
          <div className="demo-balance-x">
            <small>
              SANAL BAKİYE
            </small>

            <strong>
              {formatMoney(
                stats.balance
              )}{" "}
              TL
            </strong>
          </div>

          <button
            className={
              autoTrade
                ? "auto-x active"
                : "auto-x"
            }
            onClick={() =>
              setAutoTrade(
                (value) =>
                  !value
              )
            }
          >
            {autoTrade
              ? "● OTOMATİK TEST AÇIK"
              : "○ MANUEL TEST"}
          </button>
        </div>
      </header>

      {/* ======================================================
          ÖZET
         ====================================================== */}

      <div className="summary-x">
        <div className="summary-cell-x">
          <span>
            NET PERFORMANS
          </span>

          <strong
            className={
              stats.netProfit >=
              0
                ? "green-x"
                : "red-x"
            }
          >
            {stats.netProfit >=
            0
              ? "+"
              : ""}
            {formatMoney(
              stats.netProfit
            )}{" "}
            TL
          </strong>
        </div>

        <div className="summary-cell-x">
          <span>
            İŞLEM
          </span>

          <strong>
            {stats.totalTrades}
          </strong>
        </div>

        <div className="summary-cell-x">
          <span>
            BAŞARI
          </span>

          <strong>
            %{stats.winRate}
          </strong>
        </div>

        <div className="summary-cell-x">
          <span>
            AÇIK
          </span>

          <strong>
            {
              stats.openPositions
            }
          </strong>
        </div>

        <div className="summary-cell-x">
          <span>
            KULLANILABİLİR
          </span>

          <strong>
            {formatMoney(
              stats.availableBalance
            )}{" "}
            TL
          </strong>
        </div>
      </div>

      {/* ======================================================
          SİNYAL
         ====================================================== */}

      <div className="signal-bar-x">
        <div className="signal-cell-x">
          <span>
            ENSTRÜMAN
          </span>

          <div className="instrument-x">
            <strong>
              {symbol}
            </strong>

            <em>
              {
                radarSignal
              }
            </em>
          </div>
        </div>

        <div className="signal-cell-x">
          <span>
            SCORE
          </span>

          <strong>
            {score}/100
          </strong>
        </div>

        <div className="signal-cell-x">
          <span>
            YÖN
          </span>

          <strong
            className={signalClass(
              signal
            )}
          >
            {direction ===
            "LONG"
              ? "LONG ↑"
              : direction ===
                "SHORT"
              ? "SHORT ↓"
              : "BEKLE"}
          </strong>
        </div>

        <div className="signal-cell-x">
          <span>
            GÜNCEL FİYAT
          </span>

          <strong>
            {formatPrice(
              currentPrice
            )}
          </strong>
        </div>
      </div>

      {/* ======================================================
          KALDIRAÇ RADARI
         ====================================================== */}

      <section className="leverage-x">
        <div className="leverage-head-x">
          <div>
            <strong>
              KALDIRAÇ RADARI
            </strong>

            <span>
              &nbsp; 1X–10X
            </span>
          </div>

          <span>
            Seçili {leverage}X
          </span>
        </div>

        <div className="leverage-list-x">
          {ALLOWED_LEVERAGES.map(
            (item) => {
              const row =
                leverageRows.find(
                  (value) =>
                    value.leverage ===
                    item
                );

              return (
                <button
                  className={
                    leverage ===
                    item
                      ? "leverage-item-x active"
                      : "leverage-item-x"
                  }
                  key={item}
                  onClick={() =>
                    setLeverage(
                      item
                    )
                  }
                >
                  <b>
                    {item}X
                  </b>

                  <span
                    className={signalClass(
                      radarSignal
                    )}
                  >
                    {radarSignal}
                  </span>

                  <small>
                    {row?.marginRequired
                      ? `${formatMoney(
                          row.marginRequired
                        )} TL teminat`
                      : "—"}
                  </small>
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* ======================================================
          İŞLEM + AKTİF
         ====================================================== */}

      <div className="trade-grid-x">
        <section className="trade-box-x">
          <div className="box-head-x">
            <div>
              <strong>
                İŞLEM OLUŞTUR
              </strong>

              <span>
                {leverage}X ·{" "}
                {manualSide}
              </span>
            </div>
          </div>

          <div className="side-badges-x">
            <button
              className={
                manualSide ===
                "LONG"
                  ? "side-badge-x long active"
                  : "side-badge-x long"
              }
              onClick={() =>
                setManualSide(
                  "LONG"
                )
              }
            >
              LONG / AL ↑
            </button>

            <button
              className={
                manualSide ===
                "SHORT"
                  ? "side-badge-x short active"
                  : "side-badge-x short"
              }
              onClick={() =>
                setManualSide(
                  "SHORT"
                )
              }
            >
              SHORT / SAT ↓
            </button>
          </div>

          <div className="fields-x">
            <label>
              GİRİŞ

              <input
                type="number"
                value={entry}
                onChange={(e) =>
                  setEntry(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              STOP

              <input
                type="number"
                value={stop}
                onChange={(e) =>
                  setStop(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              HEDEF

              <input
                type="number"
                value={target}
                onChange={(e) =>
                  setTarget(
                    e.target.value
                  )
                }
              />
            </label>
          </div>

          <div className="metrics-x">
            <div className="metric-x">
              <span>
                NOMİNAL
              </span>

              <strong>
                {selectedLeverage
                  ? `${formatMoney(
                      selectedLeverage.positionValue
                    )} TL`
                  : "--"}
              </strong>
            </div>

            <div className="metric-x">
              <span>
                TEMİNAT
              </span>

              <strong>
                {selectedLeverage
                  ? `${formatMoney(
                      selectedLeverage.marginRequired
                    )} TL`
                  : "--"}
              </strong>
            </div>

            <div className="metric-x">
              <span>
                RİSK
              </span>

              <strong>
                {selectedLeverage
                  ? `${formatMoney(
                      selectedLeverage.riskAmount
                    )} TL`
                  : "--"}
              </strong>
            </div>

            <div className="metric-x">
              <span>
                R/R
              </span>

              <strong>
                {preview
                  ? `1:${preview.ratio}`
                  : "--"}
              </strong>
            </div>
          </div>

          <button
            className={
              manualSide ===
              "LONG"
                ? "execute-x long"
                : "execute-x short"
            }
            onClick={
              handleOpen
            }
          >
            {manualSide ===
            "LONG"
              ? `DEMO LONG AÇ · ${leverage}X`
              : `DEMO SHORT AÇ · ${leverage}X`}
          </button>
        </section>

        {/* ====================================================
            AKTİF POZİSYON
           ==================================================== */}

        <section className="trade-box-x">
          <div className="box-head-x">
            <div>
              <strong>
                AKTİF POZİSYON
              </strong>

              <span>
                Canlı takip
              </span>
            </div>
          </div>

          {account.openPositions
            ?.length > 0 ? (
            <div className="position-list-x">
              {account.openPositions.map(
                (position) => (
                  <div
                    className="position-card-x"
                    key={
                      position.id
                    }
                  >
                    <div className="position-head-x">
                      <div>
                        <small>
                          {
                            position.symbol
                          }
                        </small>

                        <strong
                          className={
                            position.side ===
                            "LONG"
                              ? "green-x"
                              : "red-x"
                          }
                        >
                          {position.side ===
                          "LONG"
                            ? `LONG ↑ · ${position.leverage}X`
                            : `SHORT ↓ · ${position.leverage}X`}
                        </strong>
                      </div>

                      <strong
                        className={
                          position.unrealizedPnL >=
                          0
                            ? "green-x"
                            : "red-x"
                        }
                      >
                        {position.unrealizedPnL >=
                        0
                          ? "+"
                          : ""}
                        {formatMoney(
                          position.unrealizedPnL
                        )}{" "}
                        TL
                      </strong>
                    </div>

                    <div className="position-value-x">
                      <div>
                        <span>
                          GİRİŞ
                        </span>

                        <strong>
                          {formatPrice(
                            position.entry
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          STOP
                        </span>

                        <strong>
                          {formatPrice(
                            position.stop
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          HEDEF
                        </span>

                        <strong>
                          {formatPrice(
                            position.target
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          TEMİNAT
                        </span>

                        <strong>
                          {formatMoney(
                            position.marginRequired
                          )}{" "}
                          TL
                        </strong>
                      </div>
                    </div>

                    <div className="position-foot-x">
                      <span>
                        Risk{" "}
                        <strong>
                          {formatMoney(
                            position.riskAmount
                          )}{" "}
                          TL
                        </strong>
                      </span>

                      <span>
                        R/R{" "}
                        <strong>
                          1:
                          {
                            position.riskReward
                          }
                        </strong>
                      </span>

                      <button
                        className="close-x"
                        onClick={() =>
                          handleClose(
                            position
                          )
                        }
                      >
                        KAPAT
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="position-empty-x">
              <strong>
                Açık pozisyon yok
              </strong>

              <span>
                LONG veya SHORT işlemi
                açıldığında burada canlı
                olarak izlenecek.
              </span>
            </div>
          )}
        </section>
      </div>

      {/* ======================================================
          MESAJ
         ====================================================== */}

      {message && (
        <div
          className={`message-x ${messageType}`}
        >
          {message}
        </div>
      )}

      {/* ======================================================
          GEÇMİŞ
         ====================================================== */}

      <section className="history-x">
        <button
          className="history-toggle-x"
          onClick={() =>
            setHistoryOpen(
              (value) =>
                !value
            )
          }
        >
          <span>
            SON İŞLEMLER
          </span>

          <span className="history-count-x">
            {
              account.history.length
            }
          </span>

          <span className="history-arrow-x">
            {historyOpen
              ? "▲"
              : "▼"}
          </span>
        </button>

        {historyOpen && (
          <div className="history-list-x">
            {account.history.length ===
            0 ? (
              <div className="position-empty-x">
                Henüz sonuçlanmış demo
                işlem yok.
              </div>
            ) : (
              account.history
                .slice(0, 15)
                .map(
                  (trade) => (
                    <div
                      className="history-row-x"
                      key={
                        trade.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            trade.symbol
                          }
                        </strong>

                        <span
                          className={
                            trade.side ===
                            "LONG"
                              ? "green-x"
                              : "red-x"
                          }
                        >
                          {" "}
                          {
                            trade.side
                          }{" "}
                          ·{" "}
                          {
                            trade.leverage
                          }X
                        </span>
                      </div>

                      <div>
                        <span>
                          {
                            trade.closeReason
                          }
                        </span>
                      </div>

                      <strong
                        className={
                          trade.pnl >=
                          0
                            ? "green-x"
                            : "red-x"
                        }
                      >
                        {trade.pnl >=
                        0
                          ? "+"
                          : ""}
                        {formatMoney(
                          trade.pnl
                        )}{" "}
                        TL
                      </strong>
                    </div>
                  )
                )
            )}
          </div>
        )}

        <button
          className="reset-x"
          onClick={
            handleReset
          }
        >
          DEMO HESABI SIFIRLA
        </button>
      </section>
    </section>
  );
}