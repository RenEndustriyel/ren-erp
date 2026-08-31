import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdArrowForward,
  MdCalendarToday,
  MdCreditCard,
  MdPayments,
  MdReceiptLong,
  MdShoppingCart,
  MdTrendingDown,
  MdTrendingUp,
  MdWallet,
} from "react-icons/md";

import {
  getInvoices,
} from "../../lib/invoiceStore";

import {
  getCustomers,
} from "../../lib/customerStore";

import {
  getProducts,
} from "../../lib/stockStore";

import "./Overview.css";


/* =========================================================
   YARDIMCI FONKSİYONLAR
========================================================= */

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  let text =
    String(value).trim();

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text =
      text
        .replace(/\./g, "")
        .replace(",", ".");
  } else if (
    text.includes(",")
  ) {
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
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    toNumber(value)
  );
}


function normalizeType(type) {
  const value =
    String(type || "")
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    value === "purchase" ||
    value === "purchases" ||
    value === "buy" ||
    value === "alış" ||
    value === "alis" ||
    value.includes("alış") ||
    value.includes("alis")
  ) {
    return "purchase";
  }

  if (
    value === "return" ||
    value === "returns" ||
    value === "iade" ||
    value.includes("iade")
  ) {
    return "return";
  }

  return "sales";
}


function getInvoiceDate(
  invoice
) {
  return (
    invoice?.date ||
    invoice?.invoiceDate ||
    ""
  );
}


function getInvoiceTotal(
  invoice
) {
  return toNumber(
    invoice?.total ??
    invoice?.grandTotal ??
    invoice?.netTotal ??
    0
  );
}


function getCustomerName(
  invoice,
  customers
) {
  if (
    invoice?.customerName
  ) {
    return invoice.customerName;
  }

  if (
    invoice?.supplierName
  ) {
    return invoice.supplierName;
  }

  const customer =
    customers.find(
      (item) =>
        String(item.id) ===
        String(
          invoice?.customerId
        )
    );

  return (
    customer?.name ||
    customer?.title ||
    customer?.companyName ||
    "Cari"
  );
}


function getInvoiceNumber(
  invoice
) {
  return (
    invoice?.invoiceNo ||
    invoice?.number ||
    invoice?.documentNo ||
    `FAT-${invoice?.id || ""}`
  );
}


function getInvoiceTime(
  invoice
) {
  const raw =
    invoice?.createdAt ||
    invoice?.updatedAt ||
    invoice?.date;

  if (!raw) {
    return "—";
  }

  const date =
    new Date(raw);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleTimeString(
    "tr-TR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function sameDay(
  invoiceDate,
  targetDate
) {
  if (!invoiceDate) {
    return false;
  }

  const raw =
    String(invoiceDate);

  const date =
    new Date(
      raw.includes("T")
        ? raw
        : `${raw}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return (
    date.getFullYear() ===
      targetDate.getFullYear() &&
    date.getMonth() ===
      targetDate.getMonth() &&
    date.getDate() ===
      targetDate.getDate()
  );
}


function sameMonth(
  invoiceDate,
  targetDate
) {
  if (!invoiceDate) {
    return false;
  }

  const raw =
    String(invoiceDate);

  const date =
    new Date(
      raw.includes("T")
        ? raw
        : `${raw}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return (
    date.getFullYear() ===
      targetDate.getFullYear() &&
    date.getMonth() ===
      targetDate.getMonth()
  );
}


/* =========================================================
   ÜRÜN MALİYETİ
========================================================= */

function getProductCost(
  product
) {
  if (!product) {
    return 0;
  }

  return toNumber(
    product.purchaseNet ??
    product.purchasePrice ??
    product.buyPrice ??
    product.cost ??
    product.purchase ??
    0
  );
}


/* =========================================================
   FATURA SATIR KÂRI
========================================================= */

function calculateInvoiceProfit(
  invoice,
  products
) {
  if (
    normalizeType(
      invoice?.type
    ) !== "sales"
  ) {
    return 0;
  }

  const invoiceItems =
    Array.isArray(
      invoice?.items
    )
      ? invoice.items
      : [];

  return invoiceItems.reduce(
    (
      totalProfit,
      item
    ) => {

      const quantity =
        toNumber(
          item.quantity
        );

      if (
        quantity <= 0
      ) {
        return totalProfit;
      }

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

      const purchasePrice =
        getProductCost(
          product
        );

      const salePrice =
        toNumber(
          item.unitPrice ??
          item.price ??
          item.salesNet ??
          0
        );

      const lineDiscount =
        toNumber(
          item.discount ??
          item.lineDiscount ??
          0
        );

      const grossSale =
        salePrice *
        quantity;

      const netSale =
        Math.max(
          0,
          grossSale -
          lineDiscount
        );

      const cost =
        purchasePrice *
        quantity;

      return (
        totalProfit +
        (
          netSale -
          cost
        )
      );

    },
    0
  );
}


/* =========================================================
   KÂR VERİSİ
========================================================= */

function calculateProfitData(
  invoices,
  products
) {
  let salesTotal = 0;
  let profitTotal = 0;

  invoices
    .filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) === "sales"
    )
    .forEach(
      (invoice) => {

        salesTotal +=
          getInvoiceTotal(
            invoice
          );

        profitTotal +=
          calculateInvoiceProfit(
            invoice,
            products
          );

      }
    );

  const profitMargin =
    salesTotal > 0
      ? (
          profitTotal /
          salesTotal
        ) *
        100
      : 0;

  return {
    salesTotal,
    profitTotal,
    profitMargin,
  };
}


/* =========================================================
   BUGÜNÜN TARİHİ
========================================================= */

function normalizeTodayDate(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


/* =========================================================
   TODAY CARD
========================================================= */

function TodayCard({
  icon: Icon,
  title,
  amount,
  change,
  type,
}) {
  return (
    <article
      className={`ren-today-card ${type}`}
    >

      <div className="ren-today-icon">
        <Icon />
      </div>

      <div className="ren-today-content">

        <span>
          {title}
        </span>

        <strong>
          {amount}
        </strong>

      </div>

      <div className="ren-today-change">

        <MdTrendingUp />

        {change}

      </div>

    </article>
  );
}


/* =========================================================
   FINANCE CARD
========================================================= */

function FinanceCard({
  icon: Icon,
  title,
  amount,
  type,
  detail,
}) {
  return (
    <article className="ren-finance-card">

      <div
        className={`ren-finance-icon ${type}`}
      >
        <Icon />
      </div>

      <div className="ren-finance-title">
        {title}
      </div>

      <div
        className={`ren-finance-amount ${type}`}
      >
        {amount}
      </div>

      <div className="ren-finance-detail">
        {detail}
      </div>

    </article>
  );
}


/* =========================================================
   OVERVIEW
========================================================= */

export default function Overview() {

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);


  const [
    now,
    setNow,
  ] = useState(
    () => new Date()
  );


  /* =======================================================
     VERİLERİ YENİLE
  ======================================================= */

  useEffect(() => {

    const refresh =
      () => {
        setNow(
          new Date()
        );

        setRefreshKey(
          (value) =>
            value + 1
        );
      };


    const events = [
      "ren-invoices-updated",
      "ren-finance-updated",
      "ren-stock-updated",
      "ren-stock-movements-changed",
      "ren-products-changed",
      "ren-customers-updated",
      "ren-cash-bank-updated",
      "ren-orders-updated",
    ];


    events.forEach(
      (eventName) => {

        window.addEventListener(
          eventName,
          refresh
        );

      }
    );


    const storageRefresh =
      (event) => {

        const relevantKeys = [
          "ren_erp_products",
          "ren_erp_categories",
          "ren_erp_brands",
          "ren_erp_units",
          "ren_erp_stock_movements",
          "ren_erp_customers",
          "ren-erp-orders",
          "ren-erp-cash-bank-accounts",
          "ren-erp-cash-bank-movements",
        ];


        if (
          !event.key ||
          relevantKeys.includes(
            event.key
          )
        ) {

          refresh();

        }

      };


    window.addEventListener(
      "storage",
      storageRefresh
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


      window.removeEventListener(
        "storage",
        storageRefresh
      );

    };

  }, []);


  /* =======================================================
     VERİLER
  ======================================================= */

  const invoices =
    useMemo(
      () =>
        getInvoices() || [],
      [refreshKey]
    );


  const customers =
    useMemo(
      () =>
        getCustomers() || [],
      [refreshKey]
    );


  const products =
    useMemo(
      () =>
        getProducts() || [],
      [refreshKey]
    );


  /* =======================================================
     BUGÜN
  ======================================================= */

  const todayInvoices =
    useMemo(
      () =>
        invoices.filter(
          (invoice) =>
            sameDay(
              getInvoiceDate(
                invoice
              ),
              now
            )
        ),
      [
        invoices,
        now,
      ]
    );


  /* =======================================================
     BU AY
  ======================================================= */

  const monthInvoices =
    useMemo(
      () =>
        invoices.filter(
          (invoice) =>
            sameMonth(
              getInvoiceDate(
                invoice
              ),
              now
            )
        ),
      [
        invoices,
        now,
      ]
    );


  /* =======================================================
     BUGÜNKÜ SATIŞ
  ======================================================= */

  const todaySales =
    todayInvoices
      .filter(
        (invoice) =>
          normalizeType(
            invoice.type
          ) === "sales"
      )
      .reduce(
        (
          total,
          invoice
        ) =>
          total +
          getInvoiceTotal(
            invoice
          ),
        0
      );


  /* =======================================================
     BUGÜNKÜ ALIŞ
  ======================================================= */

  const todayPurchases =
    todayInvoices
      .filter(
        (invoice) =>
          normalizeType(
            invoice.type
          ) === "purchase"
      )
      .reduce(
        (
          total,
          invoice
        ) =>
          total +
          getInvoiceTotal(
            invoice
          ),
        0
      );


  /* =======================================================
     BU AY SATIŞ
  ======================================================= */

  const monthSales =
    monthInvoices
      .filter(
        (invoice) =>
          normalizeType(
            invoice.type
          ) === "sales"
      )
      .reduce(
        (
          total,
          invoice
        ) =>
          total +
          getInvoiceTotal(
            invoice
          ),
        0
      );


  /* =======================================================
     BU AY ALIŞ
  ======================================================= */

  const monthPurchases =
    monthInvoices
      .filter(
        (invoice) =>
          normalizeType(
            invoice.type
          ) === "purchase"
      )
      .reduce(
        (
          total,
          invoice
        ) =>
          total +
          getInvoiceTotal(
            invoice
          ),
        0
      );


  /* =======================================================
     BU AY KÂR
  ======================================================= */

  const monthProfitData =
    calculateProfitData(
      monthInvoices,
      products
    );


  /* =======================================================
     BUGÜN KÂR
  ======================================================= */

  const todayProfitData =
    calculateProfitData(
      todayInvoices,
      products
    );


  /* =======================================================
     ADET
  ======================================================= */

  const todaySalesCount =
    todayInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) === "sales"
    ).length;


  const todayPurchaseCount =
    todayInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) === "purchase"
    ).length;


  const monthSalesCount =
    monthInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) === "sales"
    ).length;


  const monthPurchaseCount =
    monthInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) === "purchase"
    ).length;


  /* =======================================================
     BUGÜNKÜ İŞLEMLER
  ======================================================= */

  const transactions =
    useMemo(() => {

      return todayInvoices
        .slice()
        .sort(
          (
            first,
            second
          ) => {

            const firstRaw =
              first.createdAt ||
              first.updatedAt ||
              getInvoiceDate(
                first
              );

            const secondRaw =
              second.createdAt ||
              second.updatedAt ||
              getInvoiceDate(
                second
              );

            const firstDate =
              new Date(
                firstRaw
              );

            const secondDate =
              new Date(
                secondRaw
              );

            const firstTime =
              Number.isNaN(
                firstDate.getTime()
              )
                ? 0
                : firstDate.getTime();

            const secondTime =
              Number.isNaN(
                secondDate.getTime()
              )
                ? 0
                : secondDate.getTime();

            return (
              secondTime -
              firstTime
            );

          }
        )
        .slice(
          0,
          10
        )
        .map(
          (invoice) => {

            const normalizedType =
              normalizeType(
                invoice.type
              );

            let type =
              "Satış";

            let color =
              "blue";

            let icon =
              MdShoppingCart;


            if (
              normalizedType ===
              "purchase"
            ) {

              type =
                "Alış";

              color =
                "orange";

              icon =
                MdReceiptLong;

            }


            if (
              normalizedType ===
              "return"
            ) {

              type =
                "İade";

              color =
                "red";

              icon =
                MdReceiptLong;

            }


            return {

              id:
                invoice.id,

              time:
                getInvoiceTime(
                  invoice
                ),

              type,

              description:
                getCustomerName(
                  invoice,
                  customers
                ),

              document:
                getInvoiceNumber(
                  invoice
                ),

              amount:
                money(
                  getInvoiceTotal(
                    invoice
                  )
                ),

              color,

              icon,

              status:
                invoice.status ||
                invoice.paymentStatus ||
                "Tamamlandı",

            };

          }
        );

    }, [
      todayInvoices,
      customers,
    ]);


  /* =======================================================
     BUGÜN ÖZET
  ======================================================= */

  const todayReturnTotal =
    todayInvoices
      .filter(
        (invoice) =>
          normalizeType(
            invoice.type
          ) === "return"
      )
      .reduce(
        (
          total,
          invoice
        ) =>
          total +
          getInvoiceTotal(
            invoice
          ),
        0
      );


  const todayNetSales =
    todaySales -
    todayReturnTotal;


  /* =======================================================
     TARİH
  ======================================================= */

  const formattedDate =
    now.toLocaleDateString(
      "tr-TR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );


  const formattedDay =
    now.toLocaleDateString(
      "tr-TR",
      {
        weekday: "long",
      }
    );


  /* =======================================================
     EKRAN
  ======================================================= */

  return (
    <div className="ren-overview ren-parasut-layout">
      <div className="ren-main-column">
        <header className="ren-overview-header">
          <div>
            <span className="ren-eyebrow">GENEL BAKIŞ</span>
            <h1>Hoş geldiniz</h1>
            <p>İşletmenizin güncel finansal durumunu buradan takip edin.</p>
          </div>

          <div className="ren-date-box">
            <MdCalendarToday />
            <div>
              <strong>{formattedDate}</strong>
              <span>{formattedDay}</span>
            </div>
          </div>
        </header>

        <section className="ren-kpi-grid">
          <TodayCard icon={MdShoppingCart} title="Bugünkü Satış" amount={money(todayNetSales)} change={`${todaySalesCount} fatura`} type="sales"/>
          <TodayCard icon={MdTrendingUp} title="Bugünkü Kâr" amount={money(todayProfitData.profitTotal)} change={`%${todayProfitData.profitMargin.toFixed(1)} marj`} type="collections"/>
          <FinanceCard icon={MdTrendingUp} title="Bu Ayın Cirosu" amount={money(monthSales)} type="blue" detail={`${monthSalesCount} satış faturası`}/>
          <FinanceCard icon={MdTrendingDown} title="Bu Ayın Alışları" amount={money(monthPurchases)} type="red" detail={`${monthPurchaseCount} alış faturası`}/>
        </section>

        <section className="ren-cash-card">
          <div className="cash-box"><span>Nakit Girişi</span><strong>{money(todaySales)}</strong></div>
          <div className="cash-box"><span>Nakit Çıkışı</span><strong>{money(todayPurchases)}</strong></div>
          <div className="cash-box"><span>Net Akış</span><strong>{money(todayNetSales-todayPurchases)}</strong></div>
        </section>

        <section className="ren-transactions">
          <header className="ren-transactions-header">
            <div><h2>Son Hareketler</h2><p>Bugünkü faturalar ve işlemler</p></div>
            <button className="ren-view-button">Tüm Faturalar</button>
          </header>

          <table className="ren-table">
            <thead>
              <tr><th>SAAT</th><th>İŞLEM</th><th>AÇIKLAMA</th><th>BELGE</th><th>TUTAR</th></tr>
            </thead>
            <tbody>
              {transactions.length ? transactions.map(item=>(
                <tr key={item.id}>
                  <td>{item.time}</td>
                  <td>{item.type}</td>
                  <td>{item.description}</td>
                  <td>{item.document}</td>
                  <td>{item.amount}</td>
                </tr>
              )):(
                <tr><td colSpan="5" className="ren-empty-transactions">Bugün henüz işlem yok.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <aside className="ren-right-column">
        <div className="ren-side-card">
          <h3>Yaklaşan Tahsilatlar</h3>
          {[
            ["1 Gün","ABC Market","₺2.190,00"],
            ["3 Gün","XYZ Gıda","₺1.560,00"],
            ["5 Gün","Deniz Cafe","₺980,00"],
            ["7 Gün","Mega Plaza","₺3.450,00"]
          ].map((r,i)=>(
            <div className="ren-timeline" key={i}>
              <span className="ren-day">{r[0]}</span>
              <div><strong>{r[1]}</strong><small>{r[2]}</small></div>
            </div>
          ))}
        </div>

        <div className="ren-side-card">
          <h3>Yaklaşan Ödemeler</h3>
          {[
            ["2 Gün","Tedarikçi A.Ş.","₺4.250,00"],
            ["4 Gün","Ambalaj San.","₺1.870,00"],
            ["6 Gün","Temizlik Ürünleri","₺2.950,00"]
          ].map((r,i)=>(
            <div className="ren-timeline danger" key={i}>
              <span className="ren-day danger">{r[0]}</span>
              <div><strong>{r[1]}</strong><small>{r[2]}</small></div>
            </div>
          ))}
        </div>

        <div className="ren-side-card">
          <h3>Kısa Yollar</h3>
          <div className="ren-shortcuts">
            <button>Yeni Fatura</button>
            <button>Yeni Teklif</button>
            <button>Yeni Ürün</button>
            <button>Cari Ekle</button>
            <button>Tahsilat</button>
            <button>Rapor</button>
          </div>
        </div>
      </aside>
    </div>
  );
}