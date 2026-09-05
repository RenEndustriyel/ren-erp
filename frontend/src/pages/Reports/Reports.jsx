import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getInvoices,
} from "../../lib/invoiceStore";

import {
  getCustomers,
} from "../../lib/customerStore";

import {
  getProducts,
} from "../../lib/stockStore";

import "./Reports.css";


const ACCOUNT_KEY =
  "ren-erp-cash-bank-accounts";

const MOVEMENT_KEY =
  "ren-erp-cash-bank-movements";

const ORDER_KEY =
  "ren-erp-orders";


function num(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const result =
    Number(
      String(value)
        .replace(/\./g, "")
        .replace(",", ".")
    );

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
    num(value)
  );
}


function today() {
  return new Date()
    .toISOString()
    .slice(
      0,
      10
    );
}


function monthStart() {
  const date =
    new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),
    "01",
  ].join("-");
}


function dateOnly(value) {
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
    ).padStart(
      2,
      "0"
    ),
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}


function typeOfInvoice(
  invoice
) {
  const type =
    String(
      invoice?.type ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    type === "purchase" ||
    type === "purchases" ||
    type === "alış" ||
    type === "alis"
  ) {
    return "purchase";
  }

  if (
    type === "return" ||
    type === "returns" ||
    type === "iade"
  ) {
    return "return";
  }

  return "sales";
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

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function productCost(
  product
) {
  return num(
    product?.purchaseNet ??
    product?.purchasePrice ??
    product?.buyPrice ??
    product?.cost ??
    0
  );
}


function calculateProfit(
  invoices,
  products
) {
  return invoices.reduce(
    (
      total,
      invoice
    ) => {

      if (
        typeOfInvoice(
          invoice
        ) !== "sales"
      ) {
        return total;
      }

      const items =
        Array.isArray(
          invoice.items
        )
          ? invoice.items
          : [];

      return (
        total +
        items.reduce(
          (
            itemTotal,
            item
          ) => {

            const quantity =
              num(
                item.quantity
              );

            const salePrice =
              num(
                item.unitPrice ??
                item.price
              );

            const product =
              products.find(
                (productItem) =>
                  String(
                    productItem.id
                  ) ===
                  String(
                    item.productId
                  )
              );

            const cost =
              productCost(
                product
              );

            const revenue =
              quantity *
              salePrice;

            const totalCost =
              quantity *
              cost;

            return (
              itemTotal +
              revenue -
              totalCost
            );

          },
          0
        )
      );

    },
    0
  );
}


export default function Reports() {

  const navigate =
    useNavigate();


  const [
    invoices,
    setInvoices,
  ] = useState(
    () =>
      getInvoices() || []
  );


  const [
    customers,
    setCustomers,
  ] = useState(
    () =>
      getCustomers() || []
  );


  const [
    products,
    setProducts,
  ] = useState(
    () =>
      getProducts() || []
  );


  const [
    accounts,
    setAccounts,
  ] = useState(
    () =>
      readArray(
        ACCOUNT_KEY
      )
  );


  const [
    movements,
    setMovements,
  ] = useState(
    () =>
      readArray(
        MOVEMENT_KEY
      )
  );


  const [
    orders,
    setOrders,
  ] = useState(
    () =>
      readArray(
        ORDER_KEY
      )
  );


  const [
    dateFrom,
    setDateFrom,
  ] = useState(
    monthStart()
  );


  const [
    dateTo,
    setDateTo,
  ] = useState(
    today()
  );


  const refresh =
    () => {

      setInvoices(
        getInvoices() ||
        []
      );

      setCustomers(
        getCustomers() ||
        []
      );

      setProducts(
        getProducts() ||
        []
      );

      setAccounts(
        readArray(
          ACCOUNT_KEY
        )
      );

      setMovements(
        readArray(
          MOVEMENT_KEY
        )
      );

      setOrders(
        readArray(
          ORDER_KEY
        )
      );

    };


  useEffect(() => {

    refresh();


    const events = [
      "ren-invoices-updated",
      "ren-finance-updated",
      "ren-customers-updated",
      "ren-products-changed",
      "ren-stock-updated",
      "ren-cash-bank-updated",
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


  const periodInvoices =
    useMemo(() => {

      return invoices.filter(
        (invoice) => {

          const date =
            dateOnly(
              invoice.date ||
              invoice.createdAt
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
      );

    }, [
      invoices,
      dateFrom,
      dateTo,
    ]);


  const salesInvoices =
    periodInvoices.filter(
      (invoice) =>
        typeOfInvoice(
          invoice
        ) === "sales"
    );


  const purchaseInvoices =
    periodInvoices.filter(
      (invoice) =>
        typeOfInvoice(
          invoice
        ) === "purchase"
    );


  const returnInvoices =
    periodInvoices.filter(
      (invoice) =>
        typeOfInvoice(
          invoice
        ) === "return"
    );


  const salesTotal =
    salesInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        num(
          invoice.total
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
        num(
          invoice.total
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
        num(
          invoice.total
        ),
      0
    );


  const netSales =
    salesTotal -
    returnTotal;


  const profit =
    calculateProfit(
      periodInvoices,
      products
    );


  const profitMargin =
    netSales > 0
      ? (
          profit /
          netSales
        ) *
        100
      : 0;


  const cashIncome =
    movements
      .filter(
        (movement) => {

          const date =
            dateOnly(
              movement.date ||
              movement.createdAt
            );

          return (
            movement.direction ===
              "Giriş" &&
            date >= dateFrom &&
            date <= dateTo
          );

        }
      )
      .reduce(
        (
          total,
          movement
        ) =>
          total +
          num(
            movement.amount
          ),
        0
      );


  const cashExpense =
    movements
      .filter(
        (movement) => {

          const date =
            dateOnly(
              movement.date ||
              movement.createdAt
            );

          return (
            movement.direction ===
              "Çıkış" &&
            date >= dateFrom &&
            date <= dateTo
          );

        }
      )
      .reduce(
        (
          total,
          movement
        ) =>
          total +
          num(
            movement.amount
          ),
        0
      );


  /*
   * LİKİT VARLIK
   *
   * Kasa & Banka ekranındaki hesaplama ile
   * birebir aynı olmalı:
   *
   * Kasa + Banka + POS
   *
   * Böylece diğer türdeki hesaplar yanlışlıkla
   * toplam likit varlığa dahil edilmez.
   */
  const totalLiquidity =
    accounts
      .filter(
        (account) =>
          account.type === "Kasa" ||
          account.type === "Banka" ||
          account.type === "POS"
      )
      .reduce(
        (
          total,
          account
        ) =>
          total +
          num(
            account.balance
          ),
        0
      );


  const receivables =
    salesInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        Math.max(
          0,
          num(
            invoice.total
          ) -
          num(
            invoice.paidAmount
          )
        ),
      0
    );


  const payables =
    purchaseInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        Math.max(
          0,
          num(
            invoice.total
          ) -
          num(
            invoice.paidAmount
          )
        ),
      0
    );


  const openOrders =
    orders.filter(
      (order) =>
        order.type ===
          "Sipariş" &&
        !order.invoiceId
    );


  const openOffers =
    orders.filter(
      (order) =>
        order.type ===
        "Teklif"
    );


  const stockValue =
    products.reduce(
      (
        total,
        product
      ) =>
        total +
        (
          num(
            product.stock
          ) *
          productCost(
            product
          )
        ),
      0
    );


  const criticalStock =
    products.filter(
      (product) =>
        num(
          product.stock
        ) <=
        num(
          product.criticalStock ??
          product.minStock ??
          0
        )
    ).length;


  return (

    <div className="reports-page">

      <div className="reports-container">


        {/* HEADER */}

        <div className="reports-header">

          <div>

            <div className="reports-breadcrumb">

              <span>
                REN ERP
              </span>

              <span>
                /
              </span>

              <strong>
                Raporlar
              </strong>

            </div>

            <h1>
              Raporlar
            </h1>

            <p>
              İşletmenizin satış, finans, cari,
              stok ve nakit durumunu tek ekrandan analiz edin.
            </p>

          </div>


          <button
            type="button"
            className="reports-refresh"
            onClick={
              refresh
            }
          >
            ↻ Yenile
          </button>

        </div>


        {/* TARİH */}

        <div className="reports-filter">

          <div>

            <label>
              BAŞLANGIÇ
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
              BİTİŞ
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


          <button
            type="button"
            onClick={() => {

              setDateFrom(
                monthStart()
              );

              setDateTo(
                today()
              );

            }}
          >
            Bu Ay
          </button>

        </div>


        {/* KPI */}

        <div className="reports-kpi-grid">

          <button
            type="button"
            className="reports-kpi"
            onClick={() =>
              navigate(
                "/invoices/sales"
              )
            }
          >

            <span>
              SATIŞ CİROSU
            </span>

            <strong>
              ₺ {money(netSales)}
            </strong>

            <small>
              {salesInvoices.length} satış faturası
            </small>

          </button>


          <button
            type="button"
            className="reports-kpi"
            onClick={() =>
              navigate(
                "/invoices/purchases"
              )
            }
          >

            <span>
              ALIŞLAR
            </span>

            <strong>
              ₺ {money(purchaseTotal)}
            </strong>

            <small>
              {purchaseInvoices.length} alış faturası
            </small>

          </button>


          <button
            type="button"
            className="reports-kpi"
            onClick={() =>
              navigate(
                "/invoices/reports"
              )
            }
          >

            <span>
              SATIŞ KÂRI
            </span>

            <strong className="positive">
              ₺ {money(profit)}
            </strong>

            <small>
              %{profitMargin.toFixed(1)} kâr marjı
            </small>

          </button>


          <button
            type="button"
            className="reports-kpi"
            onClick={() =>
              navigate(
                "/cash-bank"
              )
            }
          >

            <span>
              LİKİT VARLIK
            </span>

            <strong>
              ₺ {money(totalLiquidity)}
            </strong>

            <small>
              Kasa + Banka + POS
            </small>

          </button>

        </div>


        {/* RAPOR KARTLARI */}

        <div className="reports-section-title">
          <h2>
            Raporlama Merkezi
          </h2>

          <span>
            İlgili modüle doğrudan geçiş yapın.
          </span>
        </div>


        <div className="reports-module-grid">


          <button
            type="button"
            className="reports-module-card"
            onClick={() =>
              navigate(
                "/invoices/reports"
              )
            }
          >

            <div className="reports-module-icon">
              ₺
            </div>

            <div>

              <strong>
                Satış Raporu
              </strong>

              <span>
                Ciro, satış adedi, KDV ve kâr analizi.
              </span>

            </div>

            <b>
              →
            </b>

          </button>


          <button
            type="button"
            className="reports-module-card"
            onClick={() =>
              navigate(
                "/invoices/reports"
              )
            }
          >

            <div className="reports-module-icon">
              A
            </div>

            <div>

              <strong>
                Alış Raporu
              </strong>

              <span>
                Tedarikçi faturaları ve alış maliyetleri.
              </span>

            </div>

            <b>
              →
            </b>

          </button>


          <button
            type="button"
            className="reports-module-card"
            onClick={() =>
              navigate(
                "/cash-bank/reports"
              )
            }
          >

            <div className="reports-module-icon">
              ₺
            </div>

            <div>

              <strong>
                Kasa / Banka
              </strong>

              <span>
                Hesap bakiyeleri ve finans hareketleri.
              </span>

            </div>

            <b>
              →
            </b>

          </button>


          <button
            type="button"
            className="reports-module-card"
            onClick={() =>
              navigate(
                "/cash-bank/cash-flow"
              )
            }
          >

            <div className="reports-module-icon">
              ↕
            </div>

            <div>

              <strong>
                Nakit Akışı
              </strong>

              <span>
                Para girişleri, çıkışları ve net akış.
              </span>

            </div>

            <b>
              →
            </b>

          </button>


          <button
            type="button"
            className="reports-module-card"
            onClick={() =>
              navigate(
                "/customers/reports"
              )
            }
          >

            <div className="reports-module-icon">
              C
            </div>

            <div>

              <strong>
                Cari Raporu
              </strong>

              <span>
                Borç, alacak, tahsilat ve vade analizi.
              </span>

            </div>

            <b>
              →
            </b>

          </button>


          <button
            type="button"
            className="reports-module-card"
            onClick={() =>
              navigate(
                "/stock/movements"
              )
            }
          >

            <div className="reports-module-icon">
              S
            </div>

            <div>

              <strong>
                Stok Raporu
              </strong>

              <span>
                Stok değeri, hareketler ve kritik stoklar.
              </span>

            </div>

            <b>
              →
            </b>

          </button>

        </div>


        {/* OPERASYON ÖZETİ */}

        <div className="reports-section-title">

          <h2>
            Operasyon Özeti
          </h2>

          <span>
            İşletmenin açıkta kalan önemli kalemleri.
          </span>

        </div>


        <div className="reports-status-grid">


          <button
            type="button"
            className="reports-status-card"
            onClick={() =>
              navigate(
                "/customers/due-tracking"
              )
            }
          >

            <span>
              YAPILACAK TAHSİLAT
            </span>

            <strong>
              ₺ {money(receivables)}
            </strong>

            <small>
              Açık satış faturaları
            </small>

          </button>


          <button
            type="button"
            className="reports-status-card"
            onClick={() =>
              navigate(
                "/customers/due-tracking"
              )
            }
          >

            <span>
              YAPILACAK ÖDEME
            </span>

            <strong>
              ₺ {money(payables)}
            </strong>

            <small>
              Açık alış faturaları
            </small>

          </button>


          <button
            type="button"
            className="reports-status-card"
            onClick={() =>
              navigate(
                "/orders?type=pending"
              )
            }
          >

            <span>
              FATURALANMAYAN SİPARİŞ
            </span>

            <strong>
              {openOrders.length}
            </strong>

            <small>
              İşleme hazır sipariş
            </small>

          </button>


          <button
            type="button"
            className="reports-status-card"
            onClick={() =>
              navigate(
                "/orders?type=offer"
              )
            }
          >

            <span>
              AKTİF TEKLİF
            </span>

            <strong>
              {openOffers.length}
            </strong>

            <small>
              Bekleyen teklifler
            </small>

          </button>


          <button
            type="button"
            className="reports-status-card"
            onClick={() =>
              navigate(
                "/stock/list"
              )
            }
          >

            <span>
              STOK DEĞERİ
            </span>

            <strong>
              ₺ {money(stockValue)}
            </strong>

            <small>
              Mevcut stok maliyeti
            </small>

          </button>


          <button
            type="button"
            className="reports-status-card"
            onClick={() =>
              navigate(
                "/stock/movements"
              )
            }
          >

            <span>
              KRİTİK STOK
            </span>

            <strong>
              {criticalStock}
            </strong>

            <small>
              Kritik seviyedeki ürün
            </small>

          </button>

        </div>


        {/* FİNANS AKIŞI */}

        <div className="reports-section-title">

          <h2>
            Finansal Özet
          </h2>

          <span>
            Seçilen döneme ait nakit hareketleri.
          </span>

        </div>


        <div className="reports-finance-card">

          <div>

            <span>
              DÖNEM GİRİŞİ
            </span>

            <strong className="positive">
              + ₺ {money(cashIncome)}
            </strong>

          </div>


          <div>

            <span>
              DÖNEM ÇIKIŞI
            </span>

            <strong className="negative">
              - ₺ {money(cashExpense)}
            </strong>

          </div>


          <div>

            <span>
              NET NAKİT AKIŞI
            </span>

            <strong
              className={
                cashIncome -
                  cashExpense >=
                0
                  ? "positive"
                  : "negative"
              }
            >
              {
                cashIncome -
                  cashExpense >=
                0
                  ? "+"
                  : "-"
              }

              {" ₺ "}

              {
                money(
                  Math.abs(
                    cashIncome -
                      cashExpense
                  )
                )
              }

            </strong>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/cash-bank/cash-flow"
              )
            }
          >
            Detaylı Nakit Akışı →
          </button>

        </div>

      </div>

    </div>

  );
}