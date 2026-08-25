import {
  useMemo,
  useState,
} from "react";

import {
  MdArrowBack,
  MdCalendarMonth,
  MdReceiptLong,
  MdShoppingCart,
  MdLocalShipping,
  MdReplay,
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalance,
} from "react-icons/md";

import {
  getInvoices,
} from "../../../lib/invoiceStore";

import "./InvoiceReports.css";


/* =========================================================
   YARDIMCI FONKSİYONLAR
========================================================= */

function money(value) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value) || 0
  );
}


function normalizeType(type) {

  const value =
    String(
      type || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "purchase" ||
    value === "alış" ||
    value === "alis"
  ) {
    return "purchase";
  }


  if (
    value === "return" ||
    value === "iade"
  ) {
    return "return";
  }


  return "sales";
}


function getTypeLabel(type) {

  const normalized =
    normalizeType(
      type
    );


  if (
    normalized === "purchase"
  ) {
    return "Alış";
  }


  if (
    normalized === "return"
  ) {
    return "İade";
  }


  return "Satış";
}


function getTypeClass(type) {

  const normalized =
    normalizeType(
      type
    );


  if (
    normalized === "purchase"
  ) {
    return "purchase";
  }


  if (
    normalized === "return"
  ) {
    return "return";
  }


  return "sales";
}


function getInvoiceDate(invoice) {

  const value =
    invoice.date ||
    invoice.createdAt ||
    invoice.createdDate;


  if (!value) {
    return null;
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }


  return date;
}


function startOfDay(date) {

  const result =
    new Date(
      date
    );

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}


function endOfDay(date) {

  const result =
    new Date(
      date
    );

  result.setHours(
    23,
    59,
    59,
    999
  );

  return result;
}


function getDateRange(period) {

  const today =
    new Date();


  const end =
    endOfDay(
      today
    );


  const start =
    startOfDay(
      today
    );


  if (
    period === "today"
  ) {
    return {
      start,
      end,
    };
  }


  if (
    period === "week"
  ) {

    const day =
      today.getDay();


    const diff =
      day === 0
        ? 6
        : day - 1;


    start.setDate(
      today.getDate() -
      diff
    );


    return {
      start,
      end,
    };
  }


  if (
    period === "month"
  ) {

    start.setDate(
      1
    );


    return {
      start,
      end,
    };
  }


  if (
    period === "3month"
  ) {

    start.setMonth(
      today.getMonth() - 2
    );

    start.setDate(
      1
    );


    return {
      start,
      end,
    };
  }


  if (
    period === "6month"
  ) {

    start.setMonth(
      today.getMonth() - 5
    );

    start.setDate(
      1
    );


    return {
      start,
      end,
    };
  }


  if (
    period === "year"
  ) {

    start.setMonth(
      0
    );

    start.setDate(
      1
    );


    return {
      start,
      end,
    };
  }


  return {
    start,
    end,
  };
}


/* =========================================================
   COMPONENT
========================================================= */

export default function InvoiceReports() {

  const [
    invoices,
    setInvoices,
  ] = useState(
    () =>
      getInvoices()
  );


  const [
    period,
    setPeriod,
  ] = useState(
    "month"
  );


  const [
    typeFilter,
    setTypeFilter,
  ] = useState(
    "all"
  );


  /* =========================================================
     TARİH FİLTRESİ
  ========================================================= */

  const range =
    useMemo(
      () =>
        getDateRange(
          period
        ),
      [
        period,
      ]
    );


  /* =========================================================
     RAPOR VERİSİ
  ========================================================= */

  const reportInvoices =
    useMemo(
      () => {

        return invoices.filter(
          (invoice) => {

            const date =
              getInvoiceDate(
                invoice
              );


            if (!date) {
              return false;
            }


            const type =
              normalizeType(
                invoice.type
              );


            const dateMatch =
              date >=
                range.start &&
              date <=
                range.end;


            const typeMatch =
              typeFilter ===
                "all" ||
              type ===
                typeFilter;


            return (
              dateMatch &&
              typeMatch
            );

          }
        );

      },
      [
        invoices,
        range,
        typeFilter,
      ]
    );


  /* =========================================================
     TÜRLER
  ========================================================= */

  const salesInvoices =
    reportInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) ===
        "sales"
    );


  const purchaseInvoices =
    reportInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) ===
        "purchase"
    );


  const returnInvoices =
    reportInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) ===
        "return"
    );


  /* =========================================================
     TUTARLAR
  ========================================================= */

  const salesTotal =
    salesInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.total
          ) || 0
        ),
      0
    );


  const purchaseTotal =
    purchaseInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.total
          ) || 0
        ),
      0
    );


  const returnTotal =
    returnInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.total
          ) || 0
        ),
      0
    );


  const grossDifference =
    salesTotal -
    purchaseTotal;


  /* =========================================================
     KDV
  ========================================================= */

  const salesVat =
    salesInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.vatTotal ??
            invoice.totalVat ??
            invoice.taxTotal
          ) || 0
        ),
      0
    );


  const purchaseVat =
    purchaseInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.vatTotal ??
            invoice.totalVat ??
            invoice.taxTotal
          ) || 0
        ),
      0
    );


  const returnVat =
    returnInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.vatTotal ??
            invoice.totalVat ??
            invoice.taxTotal
          ) || 0
        ),
      0
    );


  const vatBalance =
    salesVat -
    purchaseVat -
    returnVat;


  /* =========================================================
     ÖDEME DURUMU
  ========================================================= */

  const paidInvoices =
    reportInvoices.filter(
      (invoice) =>
        invoice.status ===
          "paid" ||
        invoice.paymentStatus ===
          "Ödendi" ||
        invoice.paymentStatus ===
          "Tahsil Edildi"
    );


  const openInvoices =
    reportInvoices.filter(
      (invoice) =>
        !(
          invoice.status ===
            "paid" ||
          invoice.paymentStatus ===
            "Ödendi" ||
          invoice.paymentStatus ===
            "Tahsil Edildi"
        ) &&
        invoice.status !==
          "cancelled" &&
        invoice.status !==
          "canceled"
    );


  const paidTotal =
    paidInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.total
          ) || 0
        ),
      0
    );


  const openTotal =
    openInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.total
          ) || 0
        ),
      0
    );


  /* =========================================================
     YENİLE
  ========================================================= */

  const refresh =
    () => {

      setInvoices(
        getInvoices()
      );

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="ren-invoice-reports">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ren-invoice-reports-header">

        <div>

          <button
            type="button"
            className="ren-invoice-reports-back"
            onClick={() =>
              window.location.href =
                "/invoices"
            }
          >

            <MdArrowBack />

            Faturalara Dön

          </button>


          <div className="ren-invoice-reports-breadcrumb">

            <span>
              Faturalar
            </span>

            <span>
              /
            </span>

            <strong>
              Fatura Raporları
            </strong>

          </div>


          <h1>
            Fatura Raporları
          </h1>


          <p>
            Satış, alış, iade ve KDV hareketlerinizi
            dönem bazında analiz edin.
          </p>

        </div>


        <button
          type="button"
          className="ren-invoice-reports-refresh"
          onClick={
            refresh
          }
        >

          Raporu Yenile

        </button>

      </header>


      {/* =====================================================
          FILTER
      ===================================================== */}

      <section className="ren-invoice-reports-filter-card">


        <div className="ren-invoice-report-filter-title">

          <MdCalendarMonth />

          <div>

            <strong>
              Rapor Dönemi
            </strong>

            <span>
              Hesaplamalarda seçilen tarih aralığı
              kullanılır.
            </span>

          </div>

        </div>


        <div className="ren-invoice-report-periods">

          <button
            type="button"
            className={
              period === "today"
                ? "active"
                : ""
            }
            onClick={() =>
              setPeriod(
                "today"
              )
            }
          >
            Bugün
          </button>


          <button
            type="button"
            className={
              period === "week"
                ? "active"
                : ""
            }
            onClick={() =>
              setPeriod(
                "week"
              )
            }
          >
            Bu Hafta
          </button>


          <button
            type="button"
            className={
              period === "month"
                ? "active"
                : ""
            }
            onClick={() =>
              setPeriod(
                "month"
              )
            }
          >
            Bu Ay
          </button>


          <button
            type="button"
            className={
              period === "3month"
                ? "active"
                : ""
            }
            onClick={() =>
              setPeriod(
                "3month"
              )
            }
          >
            3 Ay
          </button>


          <button
            type="button"
            className={
              period === "6month"
                ? "active"
                : ""
            }
            onClick={() =>
              setPeriod(
                "6month"
              )
            }
          >
            6 Ay
          </button>


          <button
            type="button"
            className={
              period === "year"
                ? "active"
                : ""
            }
            onClick={() =>
              setPeriod(
                "year"
              )
            }
          >
            Bu Yıl
          </button>

        </div>


        <div className="ren-invoice-report-type">

          <select
            value={
              typeFilter
            }
            onChange={(
              event
            ) =>
              setTypeFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              Tüm Faturalar
            </option>

            <option value="sales">
              Sadece Satış
            </option>

            <option value="purchase">
              Sadece Alış
            </option>

            <option value="return">
              Sadece İade
            </option>

          </select>

        </div>

      </section>


      {/* =====================================================
          KPI
      ===================================================== */}

      <section className="ren-invoice-report-kpis">


        <div className="ren-invoice-report-kpi">

          <div className="kpi-icon sales">
            <MdTrendingUp />
          </div>

          <div>

            <span>
              SATIŞ
            </span>

            <strong>
              ₺{money(
                salesTotal
              )}
            </strong>

            <small>
              {salesInvoices.length}
              {" "}
              fatura
            </small>

          </div>

        </div>


        <div className="ren-invoice-report-kpi">

          <div className="kpi-icon purchase">
            <MdTrendingDown />
          </div>

          <div>

            <span>
              ALIŞ
            </span>

            <strong>
              ₺{money(
                purchaseTotal
              )}
            </strong>

            <small>
              {purchaseInvoices.length}
              {" "}
              fatura
            </small>

          </div>

        </div>


        <div className="ren-invoice-report-kpi">

          <div className="kpi-icon return">
            <MdReplay />
          </div>

          <div>

            <span>
              İADE
            </span>

            <strong>
              ₺{money(
                returnTotal
              )}
            </strong>

            <small>
              {returnInvoices.length}
              {" "}
              fatura
            </small>

          </div>

        </div>


        <div className="ren-invoice-report-kpi">

          <div className="kpi-icon balance">
            <MdAccountBalance />
          </div>

          <div>

            <span>
              SATIŞ - ALIŞ
            </span>

            <strong>
              ₺{money(
                grossDifference
              )}
            </strong>

            <small>
              Brüt fark
            </small>

          </div>

        </div>


      </section>


      {/* =====================================================
          DETAY KARTLARI
      ===================================================== */}

      <section className="ren-invoice-reports-grid">


        {/* FATURA DAĞILIMI */}

        <div className="ren-invoice-report-card">

          <div className="ren-invoice-report-card-header">

            <div>

              <h2>
                Fatura Dağılımı
              </h2>

              <span>
                Seçilen dönemdeki belge özeti
              </span>

            </div>

          </div>


          <div className="ren-invoice-report-breakdown">


            <div>

              <div className="breakdown-label">

                <span className="dot sales" />

                Satış

              </div>

              <strong>
                {salesInvoices.length}
              </strong>

              <span>
                ₺{money(
                  salesTotal
                )}
              </span>

            </div>


            <div>

              <div className="breakdown-label">

                <span className="dot purchase" />

                Alış

              </div>

              <strong>
                {purchaseInvoices.length}
              </strong>

              <span>
                ₺{money(
                  purchaseTotal
                )}
              </span>

            </div>


            <div>

              <div className="breakdown-label">

                <span className="dot return" />

                İade

              </div>

              <strong>
                {returnInvoices.length}
              </strong>

              <span>
                ₺{money(
                  returnTotal
                )}
              </span>

            </div>


          </div>

        </div>


        {/* ÖDEME DURUMU */}

        <div className="ren-invoice-report-card">

          <div className="ren-invoice-report-card-header">

            <div>

              <h2>
                Ödeme Durumu
              </h2>

              <span>
                Faturaların tahsilat durumu
              </span>

            </div>

          </div>


          <div className="ren-invoice-report-payment">


            <div>

              <span>
                Ödenen Fatura
              </span>

              <strong>
                {paidInvoices.length}
              </strong>

              <small>
                ₺{money(
                  paidTotal
                )}
              </small>

            </div>


            <div>

              <span>
                Açık Fatura
              </span>

              <strong>
                {openInvoices.length}
              </strong>

              <small>
                ₺{money(
                  openTotal
                )}
              </small>

            </div>


          </div>

        </div>


        {/* KDV */}

        <div className="ren-invoice-report-card">

          <div className="ren-invoice-report-card-header">

            <div>

              <h2>
                KDV Özeti
              </h2>

              <span>
                Dönem içerisindeki KDV hareketleri
              </span>

            </div>

          </div>


          <div className="ren-invoice-report-vat">


            <div>

              <span>
                Hesaplanan KDV
              </span>

              <strong>
                ₺{money(
                  salesVat
                )}
              </strong>

            </div>


            <div>

              <span>
                İndirilecek KDV
              </span>

              <strong>
                ₺{money(
                  purchaseVat
                )}
              </strong>

            </div>


            <div>

              <span>
                İade KDV
              </span>

              <strong>
                ₺{money(
                  returnVat
                )}
              </strong>

            </div>


            <div className="vat-total">

              <span>
                Net KDV
              </span>

              <strong>
                ₺{money(
                  vatBalance
                )}
              </strong>

            </div>


          </div>

        </div>


        {/* TOPLAM BELGE */}

        <div className="ren-invoice-report-card">

          <div className="ren-invoice-report-card-header">

            <div>

              <h2>
                Genel Özet
              </h2>

              <span>
                Seçilen dönemin toplam faturaları
              </span>

            </div>

          </div>


          <div className="ren-invoice-report-general">


            <div>

              <MdReceiptLong />

              <span>
                Toplam Fatura
              </span>

              <strong>
                {reportInvoices.length}
              </strong>

            </div>


            <div>

              <MdShoppingCart />

              <span>
                Satış
              </span>

              <strong>
                {salesInvoices.length}
              </strong>

            </div>


            <div>

              <MdLocalShipping />

              <span>
                Alış
              </span>

              <strong>
                {purchaseInvoices.length}
              </strong>

            </div>


            <div>

              <MdReplay />

              <span>
                İade
              </span>

              <strong>
                {returnInvoices.length}
              </strong>

            </div>


          </div>

        </div>


      </section>


      {/* =====================================================
          SON FATURALAR
      ===================================================== */}

      <section className="ren-invoice-report-card ren-invoice-report-recent">

        <div className="ren-invoice-report-card-header">

          <div>

            <h2>
              Dönem Faturaları
            </h2>

            <span>
              Seçilen dönemdeki son kayıtlar
            </span>

          </div>

          <strong>
            {reportInvoices.length}
            {" "}
            kayıt
          </strong>

        </div>


        <div className="ren-invoice-report-recent-list">

          {reportInvoices.length >
          0 ? (

            reportInvoices
              .slice(
                0,
                10
              )
              .map(
                (
                  invoice
                ) => (

                  <div
                    key={
                      invoice.id
                    }
                    className="ren-invoice-report-recent-row"
                  >

                    <div className="recent-icon">

                      <MdReceiptLong />

                    </div>


                    <div className="recent-main">

                      <strong>
                        {
                          invoice.invoiceNo ||
                          "-"
                        }
                      </strong>

                      <span>
                        {
                          invoice.customerName ||
                          invoice.supplierName ||
                          "Cari belirtilmemiş"
                        }
                      </span>

                    </div>


                    <span
                      className={
                        `ren-invoice-type-badge ${
                          getTypeClass(
                            invoice.type
                          )
                        }`
                      }
                    >

                      {
                        getTypeLabel(
                          invoice.type
                        )
                      }

                    </span>


                    <span className="recent-date">

                      {
                        getInvoiceDate(
                          invoice
                        )
                          ? new Intl.DateTimeFormat(
                              "tr-TR"
                            ).format(
                              getInvoiceDate(
                                invoice
                              )
                            )
                          : "-"
                      }

                    </span>


                    <strong className="recent-total">

                      ₺{money(
                        invoice.total
                      )}

                    </strong>

                  </div>

                )
              )

          ) : (

            <div className="ren-invoice-report-no-data">

              <MdReceiptLong />

              <strong>
                Bu dönemde fatura bulunamadı
              </strong>

              <span>
                Seçtiğiniz tarih veya fatura türü
                için kayıt bulunmuyor.
              </span>

            </div>

          )}

        </div>

      </section>


    </div>
  );
}