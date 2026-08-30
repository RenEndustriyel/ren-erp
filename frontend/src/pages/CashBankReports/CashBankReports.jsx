import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./CashBankReports.css";

const ACCOUNT_STORAGE_KEY =
  "ren-erp-cash-bank-accounts";

const MOVEMENT_STORAGE_KEY =
  "ren-erp-cash-bank-movements";


function numberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  let text =
    String(value)
      .trim()
      .replace(/\s/g, "");

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text =
      text
        .replace(/\./g, "")
        .replace(",", ".");
  } else {
    text =
      text.replace(",", ".");
  }

  const result =
    Number(text);

  return Number.isFinite(result)
    ? result
    : 0;
}


function money(value) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    numberValue(value)
  );
}


function readArray(key) {
  try {
    const raw =
      localStorage.getItem(
        key
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function normalizeDate(value) {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0"),
  ].join("-");
}


function formatDate(value) {
  const normalized =
    normalizeDate(value);

  if (!normalized) {
    return "—";
  }

  const date =
    new Date(
      `${normalized}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(date);
}


function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function currentMonthStart() {
  const date =
    new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    "01",
  ].join("-");
}


function getAccountType(account) {
  const type =
    String(
      account?.type || ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  const combined =
    `${account?.name || ""} ${
      account?.bank || ""
    }`
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    type === "kasa"
  ) {
    return "Kasa";
  }

  if (
    type === "pos" ||
    combined.includes("pos")
  ) {
    return "POS";
  }

  return "Banka";
}


function getSourceLabel(
  source
) {
  switch (
    String(
      source || ""
    ).toLowerCase()
  ) {
    case "invoice":
      return "Fatura";

    case "collection":
      return "Tahsilat";

    case "payment":
      return "Ödeme";

    case "order":
      return "Sipariş";

    default:
      return "Manuel";
  }
}


export default function CashBankReports({
  mode = "report",
}) {
  const [
    accounts,
    setAccounts,
  ] = useState(
    () =>
      readArray(
        ACCOUNT_STORAGE_KEY
      )
  );

  const [
    movements,
    setMovements,
  ] = useState(
    () =>
      readArray(
        MOVEMENT_STORAGE_KEY
      )
  );

  const [
    dateFrom,
    setDateFrom,
  ] = useState(
    currentMonthStart()
  );

  const [
    dateTo,
    setDateTo,
  ] = useState(
    today()
  );

  const [
    viewMode,
    setViewMode,
  ] = useState(
    "daily"
  );


  const refresh = () => {
    setAccounts(
      readArray(
        ACCOUNT_STORAGE_KEY
      )
    );

    setMovements(
      readArray(
        MOVEMENT_STORAGE_KEY
      )
    );
  };


  useEffect(() => {
    refresh();

    const events = [
      "ren-cash-bank-updated",
      "ren-invoices-updated",
      "ren-finance-updated",
      "ren-customers-updated",
      "ren-orders-updated",
      "storage",
    ];

    events.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refresh
        );
      }
    );

    return () => {
      events.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            refresh
          );
        }
      );
    };
  }, []);


  /* =======================================================
     DÖNEM HAREKETLERİ
  ======================================================= */

  const filteredMovements =
    useMemo(() => {
      return movements
        .filter(
          (movement) => {
            const date =
              normalizeDate(
                movement.date ||
                  movement.createdAt
              );

            if (!date) {
              return false;
            }

            if (
              dateFrom &&
              date < dateFrom
            ) {
              return false;
            }

            if (
              dateTo &&
              date > dateTo
            ) {
              return false;
            }

            return true;
          }
        )
        .sort(
          (a, b) => {
            const aDate =
              normalizeDate(
                a.date ||
                  a.createdAt
              );

            const bDate =
              normalizeDate(
                b.date ||
                  b.createdAt
              );

            return bDate.localeCompare(
              aDate
            );
          }
        );
    }, [
      movements,
      dateFrom,
      dateTo,
    ]);


  /* =======================================================
     GİRİŞ / ÇIKIŞ
  ======================================================= */

  const summary =
    useMemo(() => {
      let income = 0;
      let expense = 0;

      filteredMovements.forEach(
        (movement) => {
          const amount =
            numberValue(
              movement.amount
            );

          if (
            movement.direction ===
            "Giriş"
          ) {
            income +=
              amount;
          }

          if (
            movement.direction ===
            "Çıkış"
          ) {
            expense +=
              amount;
          }
        }
      );

      return {
        income,
        expense,
        net:
          income -
          expense,
      };
    }, [
      filteredMovements,
    ]);


  /* =======================================================
     HESAP BAKİYELERİ
  ======================================================= */

  const accountSummary =
    useMemo(() => {
      return accounts.reduce(
        (result, account) => {
          const type =
            getAccountType(
              account
            );

          result[type] +=
            numberValue(
              account.balance
            );

          return result;
        },
        {
          Kasa: 0,
          Banka: 0,
          POS: 0,
        }
      );
    }, [
      accounts,
    ]);


  const totalLiquidity =
    accountSummary.Kasa +
    accountSummary.Banka +
    accountSummary.POS;


  /* =======================================================
     HESAP RAPORU
  ======================================================= */

  const accountRows =
    useMemo(() => {
      return accounts
        .map(
          (account) => {
            let income = 0;
            let expense = 0;

            filteredMovements
              .filter(
                (movement) =>
                  String(
                    movement.accountId
                  ) ===
                  String(
                    account.id
                  )
              )
              .forEach(
                (movement) => {
                  const amount =
                    numberValue(
                      movement.amount
                    );

                  if (
                    movement.direction ===
                    "Giriş"
                  ) {
                    income +=
                      amount;
                  }

                  if (
                    movement.direction ===
                    "Çıkış"
                  ) {
                    expense +=
                      amount;
                  }
                }
              );

            return {
              id:
                account.id,

              name:
                account.name ||
                "Hesap",

              type:
                getAccountType(
                  account
                ),

              income,

              expense,

              net:
                income -
                expense,

              balance:
                numberValue(
                  account.balance
                ),
            };
          }
        )
        .sort(
          (a, b) =>
            b.balance -
            a.balance
        );
    }, [
      accounts,
      filteredMovements,
    ]);


  /* =======================================================
     GÜNLÜK / AYLIK AKIŞ
  ======================================================= */

  const flowRows =
    useMemo(() => {
      const grouped =
        {};

      filteredMovements.forEach(
        (movement) => {
          const date =
            normalizeDate(
              movement.date ||
                movement.createdAt
            );

          if (!date) {
            return;
          }

          const key =
            viewMode === "monthly"
              ? date.slice(0, 7)
              : date;

          if (!grouped[key]) {
            grouped[key] = {
              key,
              income: 0,
              expense: 0,
              count: 0,
            };
          }

          const amount =
            numberValue(
              movement.amount
            );

          if (
            movement.direction ===
            "Giriş"
          ) {
            grouped[key].income +=
              amount;
          }

          if (
            movement.direction ===
            "Çıkış"
          ) {
            grouped[key].expense +=
              amount;
          }

          grouped[key].count +=
            1;
        }
      );

      return Object.values(
        grouped
      )
        .map(
          (row) => ({
            ...row,
            net:
              row.income -
              row.expense,
          })
        )
        .sort(
          (a, b) =>
            b.key.localeCompare(
              a.key
            )
        );
    }, [
      filteredMovements,
      viewMode,
    ]);


  const isCashFlow =
    mode ===
    "cashflow";


  return (
    <div className="cash-report-page">

      <div className="cash-report-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="cash-report-header">

          <div>

            <div className="cash-report-breadcrumb">

              <span>
                Kasa - Banka
              </span>

              <span>
                /
              </span>

              <strong>
                {
                  isCashFlow
                    ? "Nakit Akışı"
                    : "Raporlar"
                }
              </strong>

            </div>

            <h1>
              {
                isCashFlow
                  ? "Nakit Akışı Raporu"
                  : "Kasa / Banka Raporu"
              }
            </h1>

            <p>
              {
                isCashFlow
                  ? "İşletmenizin nakit giriş ve çıkışlarını dönemsel olarak takip edin."
                  : "Kasa, banka ve POS hesaplarınızın finansal durumunu analiz edin."
              }
            </p>

          </div>


          <button
            type="button"
            className="cash-report-refresh"
            onClick={
              refresh
            }
          >
            ↻ Yenile
          </button>

        </div>


        {/* =================================================
            FİLTRE
        ================================================= */}

        <div className="cash-report-filter-card">

          <div className="cash-report-filter-title">
            RAPOR DÖNEMİ
          </div>


          <div className="cash-report-filters">

            <div>
              <label>
                Başlangıç
              </label>

              <input
                type="date"
                value={
                  dateFrom
                }
                onChange={(
                  event
                ) =>
                  setDateFrom(
                    event.target.value
                  )
                }
              />
            </div>


            <div>
              <label>
                Bitiş
              </label>

              <input
                type="date"
                value={
                  dateTo
                }
                onChange={(
                  event
                ) =>
                  setDateTo(
                    event.target.value
                  )
                }
              />
            </div>


            {
              isCashFlow && (
                <div>
                  <label>
                    Görünüm
                  </label>

                  <select
                    value={
                      viewMode
                    }
                    onChange={(
                      event
                    ) =>
                      setViewMode(
                        event.target.value
                      )
                    }
                  >
                    <option value="daily">
                      Günlük
                    </option>

                    <option value="monthly">
                      Aylık
                    </option>
                  </select>
                </div>
              )
            }


            <button
              type="button"
              onClick={() => {
                setDateFrom(
                  currentMonthStart()
                );

                setDateTo(
                  today()
                );
              }}
            >
              Bu Ay
            </button>

          </div>

        </div>


        {/* =================================================
            KPI
        ================================================= */}

        <div className="cash-report-kpi-grid">

          <div className="cash-report-kpi">

            <span>
              TOPLAM LİKİT VARLIK
            </span>

            <strong>
              ₺{" "}
              {
                money(
                  totalLiquidity
                )
              }
            </strong>

            <small>
              Kasa + banka + POS
            </small>

          </div>


          <div className="cash-report-kpi">

            <span>
              DÖNEM GİRİŞİ
            </span>

            <strong className="income">
              +{" "}
              {
                money(
                  summary.income
                )
              } TL
            </strong>

            <small>
              {
                filteredMovements.filter(
                  (movement) =>
                    movement.direction ===
                    "Giriş"
                ).length
              } hareket
            </small>

          </div>


          <div className="cash-report-kpi">

            <span>
              DÖNEM ÇIKIŞI
            </span>

            <strong className="expense">
              -{" "}
              {
                money(
                  summary.expense
                )
              } TL
            </strong>

            <small>
              {
                filteredMovements.filter(
                  (movement) =>
                    movement.direction ===
                    "Çıkış"
                ).length
              } hareket
            </small>

          </div>


          <div className="cash-report-kpi highlight">

            <span>
              NET NAKİT AKIŞI
            </span>

            <strong
              className={
                summary.net >= 0
                  ? "income"
                  : "expense"
              }
            >
              {
                summary.net >= 0
                  ? "+"
                  : "-"
              }

              {" "}

              {
                money(
                  Math.abs(
                    summary.net
                  )
                )
              } TL

            </strong>

            <small>
              Dönem girişi - çıkışı
            </small>

          </div>

        </div>


        {/* =================================================
            KASA / BANKA
        ================================================= */}

        {
          !isCashFlow && (

            <>

              <div className="cash-report-grid-3">

                <div className="cash-report-big-card">

                  <span>
                    KASA
                  </span>

                  <strong>
                    ₺{" "}
                    {
                      money(
                        accountSummary.Kasa
                      )
                    }
                  </strong>

                  <small>
                    {
                      accounts.filter(
                        (account) =>
                          getAccountType(
                            account
                          ) ===
                          "Kasa"
                      ).length
                    } hesap
                  </small>

                </div>


                <div className="cash-report-big-card">

                  <span>
                    BANKA
                  </span>

                  <strong>
                    ₺{" "}
                    {
                      money(
                        accountSummary.Banka
                      )
                    }
                  </strong>

                  <small>
                    {
                      accounts.filter(
                        (account) =>
                          getAccountType(
                            account
                          ) ===
                          "Banka"
                      ).length
                    } hesap
                  </small>

                </div>


                <div className="cash-report-big-card">

                  <span>
                    POS
                  </span>

                  <strong>
                    ₺{" "}
                    {
                      money(
                        accountSummary.POS
                      )
                    }
                  </strong>

                  <small>
                    {
                      accounts.filter(
                        (account) =>
                          getAccountType(
                            account
                          ) ===
                          "POS"
                      ).length
                    } hesap
                  </small>

                </div>

              </div>


              <div className="cash-report-section">

                <div className="cash-report-section-header">

                  <div>

                    <strong>
                      Hesap Bazında Rapor
                    </strong>

                    <span>
                      Seçilen dönemdeki giriş ve çıkışlar.
                    </span>

                  </div>

                </div>


                <div className="cash-report-table-wrapper">

                  <table className="cash-report-table">

                    <thead>

                      <tr>
                        <th>
                          HESAP
                        </th>

                        <th>
                          TÜR
                        </th>

                        <th>
                          GİRİŞ
                        </th>

                        <th>
                          ÇIKIŞ
                        </th>

                        <th>
                          NET
                        </th>

                        <th>
                          GÜNCEL BAKİYE
                        </th>
                      </tr>

                    </thead>


                    <tbody>

                      {
                        accountRows.map(
                          (account) => (

                            <tr
                              key={
                                account.id
                              }
                            >

                              <td>
                                <strong>
                                  {
                                    account.name
                                  }
                                </strong>
                              </td>

                              <td>

                                <span className="cash-report-type">
                                  {
                                    account.type
                                  }
                                </span>

                              </td>

                              <td className="income-cell">
                                +
                                {
                                  money(
                                    account.income
                                  )
                                } TL
                              </td>

                              <td className="expense-cell">
                                -
                                {
                                  money(
                                    account.expense
                                  )
                                } TL
                              </td>

                              <td>

                                <strong
                                  className={
                                    account.net >=
                                    0
                                      ? "income-cell"
                                      : "expense-cell"
                                  }
                                >

                                  {
                                    account.net >=
                                    0
                                      ? "+"
                                      : "-"
                                  }

                                  {
                                    money(
                                      Math.abs(
                                        account.net
                                      )
                                    )
                                  } TL

                                </strong>

                              </td>

                              <td>

                                <strong>
                                  {
                                    money(
                                      account.balance
                                    )
                                  } TL
                                </strong>

                              </td>

                            </tr>

                          )
                        )
                      }


                      {
                        accountRows.length ===
                        0 && (

                          <tr>

                            <td
                              colSpan="6"
                              className="cash-report-empty"
                            >
                              Hesap bulunmuyor.
                            </td>

                          </tr>

                        )
                      }

                    </tbody>

                  </table>

                </div>

              </div>


              <div className="cash-report-section">

                <div className="cash-report-section-header">

                  <div>

                    <strong>
                      Son Finans Hareketleri
                    </strong>

                    <span>
                      Seçilen dönemdeki son hareketler.
                    </span>

                  </div>

                </div>


                <div className="cash-report-table-wrapper">

                  <table className="cash-report-table">

                    <thead>

                      <tr>

                        <th>
                          TARİH
                        </th>

                        <th>
                          HESAP
                        </th>

                        <th>
                          AÇIKLAMA
                        </th>

                        <th>
                          KAYNAK
                        </th>

                        <th>
                          YÖN
                        </th>

                        <th>
                          TUTAR
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {
                        filteredMovements
                          .slice(
                            0,
                            15
                          )
                          .map(
                            (
                              movement
                            ) => (

                              <tr
                                key={
                                  movement.id
                                }
                              >

                                <td>
                                  {
                                    formatDate(
                                      movement.date ||
                                      movement.createdAt
                                    )
                                  }
                                </td>

                                <td>
                                  <strong>
                                    {
                                      movement.accountName ||
                                      "—"
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    movement.description ||
                                    "—"
                                  }
                                </td>

                                <td>
                                  {
                                    getSourceLabel(
                                      movement.source
                                    )
                                  }
                                </td>

                                <td>

                                  <span
                                    className={
                                      movement.direction ===
                                      "Giriş"
                                        ? "cash-report-direction income"
                                        : "cash-report-direction expense"
                                    }
                                  >
                                    {
                                      movement.direction ||
                                      "—"
                                    }
                                  </span>

                                </td>

                                <td
                                  className={
                                    movement.direction ===
                                    "Giriş"
                                      ? "income-cell"
                                      : "expense-cell"
                                  }
                                >

                                  {
                                    movement.direction ===
                                    "Giriş"
                                      ? "+"
                                      : "-"
                                  }

                                  {
                                    money(
                                      movement.amount
                                    )
                                  } TL

                                </td>

                              </tr>

                            )
                          )
                      }


                      {
                        filteredMovements.length ===
                        0 && (

                          <tr>

                            <td
                              colSpan="6"
                              className="cash-report-empty"
                            >
                              Seçilen dönemde hareket bulunmuyor.
                            </td>

                          </tr>

                        )
                      }

                    </tbody>

                  </table>

                </div>

              </div>

            </>

          )
        }


        {/* =================================================
            NAKİT AKIŞI
        ================================================= */}

        {
          isCashFlow && (

            <>

              <div className="cash-report-section">

                <div className="cash-report-section-header">

                  <div>

                    <strong>
                      Nakit Akış Tablosu
                    </strong>

                    <span>
                      {
                        viewMode ===
                        "daily"
                          ? "Günlük"
                          : "Aylık"
                      } nakit hareketleri
                    </span>

                  </div>

                </div>


                <div className="cash-report-table-wrapper">

                  <table className="cash-report-table">

                    <thead>

                      <tr>

                        <th>
                          DÖNEM
                        </th>

                        <th>
                          GİRİŞ
                        </th>

                        <th>
                          ÇIKIŞ
                        </th>

                        <th>
                          NET
                        </th>

                        <th>
                          HAREKET
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {
                        flowRows.map(
                          (
                            row
                          ) => (

                            <tr
                              key={
                                row.key
                              }
                            >

                              <td>

                                <strong>
                                  {
                                    viewMode ===
                                    "daily"
                                      ? formatDate(
                                          row.key
                                        )
                                      : row.key
                                  }
                                </strong>

                              </td>


                              <td className="income-cell">
                                +
                                {
                                  money(
                                    row.income
                                  )
                                } TL
                              </td>


                              <td className="expense-cell">
                                -
                                {
                                  money(
                                    row.expense
                                  )
                                } TL
                              </td>


                              <td>

                                <strong
                                  className={
                                    row.net >=
                                    0
                                      ? "income-cell"
                                      : "expense-cell"
                                  }
                                >

                                  {
                                    row.net >=
                                    0
                                      ? "+"
                                      : "-"
                                  }

                                  {
                                    money(
                                      Math.abs(
                                        row.net
                                      )
                                    )
                                  } TL

                                </strong>

                              </td>


                              <td>
                                {
                                  row.count
                                }
                              </td>

                            </tr>

                          )
                        )
                      }


                      {
                        flowRows.length ===
                        0 && (

                          <tr>

                            <td
                              colSpan="5"
                              className="cash-report-empty"
                            >
                              Seçilen dönemde nakit hareketi bulunmuyor.
                            </td>

                          </tr>

                        )
                      }

                    </tbody>

                  </table>

                </div>

              </div>


              <div className="cash-report-section">

                <div className="cash-report-section-header">

                  <div>

                    <strong>
                      Son Finans Hareketleri
                    </strong>

                    <span>
                      Seçilen dönemdeki son 15 hareket.
                    </span>

                  </div>

                </div>


                <div className="cash-report-table-wrapper">

                  <table className="cash-report-table">

                    <thead>

                      <tr>

                        <th>
                          TARİH
                        </th>

                        <th>
                          HESAP
                        </th>

                        <th>
                          AÇIKLAMA
                        </th>

                        <th>
                          KAYNAK
                        </th>

                        <th>
                          YÖN
                        </th>

                        <th>
                          TUTAR
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {
                        filteredMovements
                          .slice(
                            0,
                            15
                          )
                          .map(
                            (
                              movement
                            ) => (

                              <tr
                                key={
                                  movement.id
                                }
                              >

                                <td>
                                  {
                                    formatDate(
                                      movement.date ||
                                      movement.createdAt
                                    )
                                  }
                                </td>


                                <td>
                                  {
                                    movement.accountName ||
                                    "—"
                                  }
                                </td>


                                <td>
                                  {
                                    movement.description ||
                                    "—"
                                  }
                                </td>


                                <td>
                                  {
                                    getSourceLabel(
                                      movement.source
                                    )
                                  }
                                </td>


                                <td>

                                  <span
                                    className={
                                      movement.direction ===
                                      "Giriş"
                                        ? "cash-report-direction income"
                                        : "cash-report-direction expense"
                                    }
                                  >
                                    {
                                      movement.direction ||
                                      "—"
                                    }
                                  </span>

                                </td>


                                <td
                                  className={
                                    movement.direction ===
                                    "Giriş"
                                      ? "income-cell"
                                      : "expense-cell"
                                  }
                                >

                                  {
                                    movement.direction ===
                                    "Giriş"
                                      ? "+"
                                      : "-"
                                  }

                                  {
                                    money(
                                      movement.amount
                                    )
                                  } TL

                                </td>

                              </tr>

                            )
                          )
                      }


                      {
                        filteredMovements.length ===
                        0 && (

                          <tr>

                            <td
                              colSpan="6"
                              className="cash-report-empty"
                            >
                              Hareket bulunmuyor.
                            </td>

                          </tr>

                        )
                      }

                    </tbody>

                  </table>

                </div>

              </div>

            </>

          )
        }

      </div>

    </div>
  );
}