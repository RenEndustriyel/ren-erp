import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import {
  MdAdd,
  MdArrowForward,
  MdAttachMoney,
  MdAutoAwesome,
  MdCalendarMonth,
  MdDelete,
  MdEdit,
  MdInventory2,
  MdLocalAtm,
  MdMoreHoriz,
  MdPeople,
  MdPointOfSale,
  MdPrint,
  MdReceiptLong,
  MdShoppingCart,
  MdTrendingUp,
  MdVisibility,
  MdWarning,
} from "react-icons/md";

import "./Dashboard.css";

function todayYear() {
  return new Date().getFullYear();
}

function Dashboard() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState("month");
  const [chartPeriod, setChartPeriod] = useState("month");
  const [chartYear, setChartYear] = useState(todayYear());

  const loadJSON = (key, fallback = []) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return fallback;
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const sales = loadJSON("ren_sales", []);
  const invoices = loadJSON("ren_invoices", []);
  const customers = loadJSON("customers", []);
  const expenses = loadJSON("ren_expenses", []);

  /*
   * Ürün/Stok kaynağı artık Supabase products tablosudur.
   * Supabase erişilemezse eski localStorage verisi geçici
   * fallback olarak kullanılmaya devam eder.
   */
  const [products, setProducts] = useState(() =>
    loadJSON("ren_products", [])
  );

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(
            [
              "id",
              "name",
              "purchase_price",
              "purchase_price_type",
              "sale_price",
              "sale_price_type",
              "vat_rate",
              "stock_quantity",
              "critical_stock",
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("name");

        if (error) {
          throw error;
        }

        if (cancelled) return;

        const mappedProducts = (data || []).map(
          (product) => ({
            id: product.id,
            name: product.name || "",
            buy: Number(
              product.purchase_price || 0
            ),
            buyPrice: Number(
              product.purchase_price || 0
            ),
            purchasePrice: Number(
              product.purchase_price || 0
            ),
            purchasePriceType:
              product.purchase_price_type ||
              "exclusive",
            sale: Number(
              product.sale_price || 0
            ),
            salePrice: Number(
              product.sale_price || 0
            ),
            salePriceType:
              product.sale_price_type ||
              "exclusive",
            vatRate: Number(
              product.vat_rate || 0
            ),
            stock: Number(
              product.stock_quantity || 0
            ),
            stockQuantity: Number(
              product.stock_quantity || 0
            ),
            criticalStock: Number(
              product.critical_stock || 0
            ),
            isActive:
              product.is_active !== false,
          })
        );

        setProducts(mappedProducts);

        /*
         * Sadece uyumluluk/fallback amacıyla güncel
         * ürün listesini localStorage'a da yazıyoruz.
         * Ana kaynak Supabase'dir.
         */
        try {
          localStorage.setItem(
            "ren_products",
            JSON.stringify(mappedProducts)
          );
        } catch {
          // localStorage zorunlu değil.
        }
      } catch (error) {
        console.error(
          "Dashboard ürün/stok verileri yüklenemedi:",
          error
        );

        /*
         * Supabase hata verirse mevcut localStorage
         * verisiyle Dashboard yine açılır.
         */
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const money = (value) =>
    Number(value || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const dateValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const today = new Date();
  const todayStart = startOfDay(today);

  const saleDate = (sale) =>
    dateValue(
      sale?.date ||
        sale?.createdAt ||
        sale?.timestamp
    );

  const invoiceDate = (invoice) =>
    dateValue(
      invoice?.date ||
        invoice?.createdAt ||
        invoice?.timestamp
    );

  const expenseDate = (expense) =>
    dateValue(
      expense?.date ||
        expense?.createdAt ||
        expense?.timestamp
    );

  const saleTotal = (sale) =>
    Number(
      sale?.total ??
        sale?.grandTotal ??
        sale?.amount ??
        0
    ) || 0;

  const invoiceTotal = (invoice) =>
    Number(
      invoice?.total ??
        invoice?.grandTotal ??
        invoice?.amount ??
        0
    ) || 0;

  const expenseTotal = (expense) =>
    Number(
      expense?.amount ??
        expense?.total ??
        expense?.price ??
        expense?.tutar ??
        0
    ) || 0;

  const formatDate = (value) => {
    const date = dateValue(value);
    return date
      ? date.toLocaleDateString("tr-TR")
      : "-";
  };

  const formatTime = (value) => {
    const date = dateValue(value);
    return date
      ? date.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";
  };

  /* =========================================================
     SALES / FINANCE
  ========================================================= */

  const todaySales = useMemo(
    () =>
      sales
        .filter((sale) => {
          const date = saleDate(sale);
          return (
            date &&
            date >= todayStart &&
            date <= today
          );
        })
        .reduce(
          (sum, sale) => sum + saleTotal(sale),
          0
        ),
    [sales]
  );

  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const monthSales = useMemo(
    () =>
      sales
        .filter((sale) => {
          const date = saleDate(sale);
          return (
            date &&
            date >= monthStart &&
            date <= today
          );
        })
        .reduce(
          (sum, sale) => sum + saleTotal(sale),
          0
        ),
    [sales]
  );

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => {
          const date = expenseDate(expense);
          return (
            date &&
            date >= monthStart &&
            date <= today
          );
        })
        .reduce(
          (sum, expense) =>
            sum + expenseTotal(expense),
          0
        ),
    [expenses]
  );

  /* =========================================================
     STOCK
  ========================================================= */

  const stockValue = useMemo(
    () =>
      products.reduce((sum, product) => {
        const stock = Number(
          product?.stock ??
            product?.stockQuantity ??
            product?.quantity ??
            0
        );

        const purchasePrice = Number(
          product?.purchasePrice ??
            product?.purchase ??
            product?.buyPrice ??
            product?.cost ??
            product?.alis ??
            product?.buy ??
            0
        );

        return sum + stock * purchasePrice;
      }, 0),
    [products]
  );

  const criticalStocks = useMemo(
    () =>
      products
        .filter((product) => {
          const stock = Number(
            product?.stock ??
              product?.stockQuantity ??
              product?.quantity ??
              0
          );

          return stock <= 5;
        })
        .sort(
          (a, b) =>
            Number(
              a?.stock ??
                a?.stockQuantity ??
                a?.quantity ??
                0
            ) -
            Number(
              b?.stock ??
                b?.stockQuantity ??
                b?.quantity ??
                0
            )
        )
        .slice(0, 5),
    [products]
  );

  /* =========================================================
     CUSTOMERS
  ========================================================= */

  const activeCustomers = customers.filter(
    (customer) =>
      customer &&
      customer.name
  ).length;

  const outstandingAmount = customers
    .filter((customer) => customer?.name)
    .reduce(
      (sum, customer) =>
        sum +
        Number(
          customer.balance ??
            customer.bakiye ??
            customer.receivable ??
            0
        ),
      0
    );

  /* =========================================================
     INVOICES
  ========================================================= */

  const salesInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          String(
            invoice?.type || "Satış"
          ).toLowerCase() !== "alış"
      ),
    [invoices]
  );

  const recentInvoices = useMemo(
    () =>
      [...salesInvoices]
        .sort(
          (a, b) =>
            (invoiceDate(b)?.getTime() || 0) -
            (invoiceDate(a)?.getTime() || 0)
        )
        .slice(0, 6),
    [salesInvoices]
  );

  const invoicePaidAmount = (invoice) => {
    if (invoice?.paidAmount !== undefined) {
      return Number(invoice.paidAmount) || 0;
    }

    if (
      invoice?.receivedMoney !== undefined
    ) {
      return Number(invoice.receivedMoney) || 0;
    }

    if (
      invoice?.paymentStatus === "Ödendi" ||
      invoice?.status === "Tahsil Edildi"
    ) {
      return invoiceTotal(invoice);
    }

    return 0;
  };

  const invoiceRemaining = (invoice) =>
    Math.max(
      invoiceTotal(invoice) -
        invoicePaidAmount(invoice),
      0
    );

  const monthCollected = useMemo(
    () =>
      sales
        .filter((sale) => {
          const date = saleDate(sale);
          return (
            date &&
            date >= monthStart &&
            date <= today &&
            sale?.paymentType !== "Veresiye"
          );
        })
        .reduce(
          (sum, sale) =>
            sum +
            Number(
              sale?.receivedMoney ??
                saleTotal(sale)
            ),
          0
        ),
    [sales]
  );

  const pendingAmount = salesInvoices.reduce(
    (sum, invoice) =>
      sum + invoiceRemaining(invoice),
    0
  );

  const overdueAmount = salesInvoices
    .filter((invoice) => {
      const due = dateValue(
        invoice?.dueDate
      );

      return (
        due &&
        due < todayStart &&
        invoiceRemaining(invoice) > 0
      );
    })
    .reduce(
      (sum, invoice) =>
        sum + invoiceRemaining(invoice),
      0
    );

  const partiallyPaidAmount = salesInvoices
    .filter((invoice) => {
      const total = invoiceTotal(invoice);
      const paid = invoicePaidAmount(invoice);

      return paid > 0 && paid < total;
    })
    .reduce(
      (sum, invoice) =>
        sum + invoiceRemaining(invoice),
      0
    );

  const invoiceStatus = (invoice) => {
    const total = invoiceTotal(invoice);
    const paid = invoicePaidAmount(invoice);

    if (paid >= total && total > 0) {
      return {
        text: "Tahsil Edildi",
        type: "success",
      };
    }

    if (paid > 0) {
      return {
        text: "Kısmi Ödendi",
        type: "warning",
      };
    }

    const due = dateValue(invoice?.dueDate);

    if (
      due &&
      due < todayStart
    ) {
      return {
        text: "Gecikmiş",
        type: "danger",
      };
    }

    return {
      text: "Beklemede",
      type: "pending",
    };
  };

  /* =========================================================
     SON İŞLEMLER
     Şimdilik satışlar gerçek veri kaynağıdır.
     Diğer modüller hazır olduğunda aynı listeye eklenecek.
  ========================================================= */

  const recentCollections = useMemo(
    () =>
      [...sales]
        .map((sale) => ({
          ...sale,
          transactionType: "Satış",
          transactionDate: saleDate(sale),
        }))
        .filter(
          (sale) =>
            sale.transactionDate
        )
        .sort(
          (a, b) =>
            b.transactionDate.getTime() -
            a.transactionDate.getTime()
        )
        .slice(0, 5),
    [sales]
  );

  /* =========================================================
     CHART
  ========================================================= */

  const currentYear =
    today.getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set([
      currentYear,
      currentYear - 1,
    ]);

    [...sales, ...invoices].forEach((item) => {
      const date =
        item?.date ||
        item?.createdAt ||
        item?.timestamp;

      const parsed = dateValue(date);

      if (parsed) {
        years.add(parsed.getFullYear());
      }
    });

    return [...years].sort(
      (a, b) => b - a
    );
  }, [
    sales,
    invoices,
    currentYear,
  ]);

  const chartData = useMemo(() => {
    const points = [];

    const addDailyPoint = (date, label) => {
      const start = startOfDay(date);
      const end = new Date(start);
      end.setHours(
        23,
        59,
        59,
        999
      );

      const value = sales
        .filter((sale) => {
          const dateValueItem =
            saleDate(sale);

          return (
            dateValueItem &&
            dateValueItem >= start &&
            dateValueItem <= end
          );
        })
        .reduce(
          (sum, sale) =>
            sum + saleTotal(sale),
          0
        );

      points.push({
        date: start,
        value,
        label,
      });
    };

    const addMonthlyPoint = (
      year,
      month
    ) => {
      const start = new Date(
        year,
        month,
        1
      );

      const end = new Date(
        year,
        month + 1,
        0
      );

      end.setHours(
        23,
        59,
        59,
        999
      );

      const value = sales
        .filter((sale) => {
          const saleDateValue =
            saleDate(sale);

          return (
            saleDateValue &&
            saleDateValue >= start &&
            saleDateValue <= end
          );
        })
        .reduce(
          (sum, sale) =>
            sum + saleTotal(sale),
          0
        );

      points.push({
        date: start,
        value,
        label:
          start.toLocaleDateString(
            "tr-TR",
            {
              month: "short",
            }
          ),
      });
    };

    if (
      chartPeriod === "today" ||
      chartPeriod === "yesterday"
    ) {
      const date = new Date(today);

      if (
        chartPeriod === "yesterday"
      ) {
        date.setDate(
          date.getDate() - 1
        );
      }

      addDailyPoint(
        date,
        chartPeriod === "today"
          ? "Bugün"
          : "Dün"
      );

      return points;
    }

    const dailyPeriods = {
      "7d": 7,
      "15d": 15,
      "30d": 30,
      "60d": 60,
      "90d": 90,
    };

    if (dailyPeriods[chartPeriod]) {
      const dayCount =
        dailyPeriods[chartPeriod];

      for (
        let i = dayCount - 1;
        i >= 0;
        i--
      ) {
        const date = new Date(today);
        date.setDate(
          date.getDate() - i
        );

        addDailyPoint(
          date,
          date.toLocaleDateString(
            "tr-TR",
            {
              day: "2-digit",
              month: "short",
            }
          )
        );
      }

      return points;
    }

    if (
      chartPeriod === "thisMonth" ||
      chartPeriod === "lastMonth" ||
      chartPeriod === "3m" ||
      chartPeriod === "6m" ||
      chartPeriod === "12m"
    ) {
      if (
        chartPeriod === "thisMonth"
      ) {
        addMonthlyPoint(
          currentYear,
          today.getMonth()
        );
      } else if (
        chartPeriod === "lastMonth"
      ) {
        const date = new Date(
          currentYear,
          today.getMonth() - 1,
          1
        );

        addMonthlyPoint(
          date.getFullYear(),
          date.getMonth()
        );
      } else {
        const count =
          chartPeriod === "3m"
            ? 3
            : chartPeriod === "6m"
            ? 6
            : 12;

        for (
          let i = count - 1;
          i >= 0;
          i--
        ) {
          const date = new Date(
            currentYear,
            today.getMonth() - i,
            1
          );

          addMonthlyPoint(
            date.getFullYear(),
            date.getMonth()
          );
        }
      }

      return points;
    }

    const selectedYear =
      chartPeriod === "thisYear"
        ? currentYear
        : chartPeriod === "lastYear"
        ? currentYear - 1
        : Number(chartYear);

    for (
      let month = 0;
      month < 12;
      month++
    ) {
      addMonthlyPoint(
        selectedYear,
        month
      );
    }

    return points;
  }, [
    sales,
    chartPeriod,
    chartYear,
    currentYear,
  ]);

  const chartMax = Math.max(
    ...chartData.map(
      (point) => point.value
    ),
    1000
  );

  const chartWidth = 760;
  const chartHeight = 230;

  const chartPoints =
    chartData.map(
      (point, index) => {
        const x =
          chartData.length === 1
            ? chartWidth / 2
            : 35 +
              (index /
                (chartData.length - 1)) *
                690;

        const y =
          195 -
          (point.value /
            chartMax) *
            170;

        return {
          ...point,
          x,
          y,
        };
      }
    );

  const linePoints =
    chartPoints
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");

  const areaPoints = [
    "35,195",
    ...chartPoints.map(
      (point) =>
        `${point.x},${point.y}`
    ),
    "725,195",
  ].join(" ");

  const quickActions = [
    {
      title: "Yeni Fatura",
      icon: MdReceiptLong,
      type: "blue",
      action: () =>
        navigate("/invoices"),
    },
    {
      title: "Hızlı Satış",
      icon: MdPointOfSale,
      type: "green",
      action: () =>
        navigate("/sales"),
    },
    {
      title: "Yeni Müşteri",
      icon: MdPeople,
      type: "purple",
      action: () =>
        navigate("/customers"),
    },
    {
      title: "Yeni Ürün",
      icon: MdInventory2,
      type: "orange",
      action: () =>
        navigate("/products"),
    },
    {
      title: "Tahsilat",
      icon: MdAttachMoney,
      type: "cyan",
      action: () =>
        navigate("/collections"),
    },
    {
      title: "Raporlar",
      icon: MdTrendingUp,
      type: "red",
      action: () =>
        navigate("/reports"),
    },
  ];

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            REN ERP • YÖNETİM PANELİ
          </span>

          <h1>
            İşletme Özeti
          </h1>

          <p>
            İşletmenizin satış, tahsilat,
            stok ve finans durumunu tek
            ekrandan takip edin.
          </p>
        </div>

        <div className="dashboard-date">
          <MdCalendarMonth />

          <div>
            <span>BUGÜN</span>

            <strong>
              {today.toLocaleDateString(
                "tr-TR",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </strong>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="dashboard-actions">
        <button
          className="action-green"
          onClick={() =>
            navigate("/sales")
          }
        >
          <MdAdd />
          Perakende Satış
        </button>

        <button
          className="action-blue"
          onClick={() =>
            navigate("/customers")
          }
        >
          <MdAdd />
          Yeni Müşteri
        </button>

        <button
          className="action-red"
          onClick={() =>
            navigate("/invoices")
          }
        >
          <MdAdd />
          Yeni Fatura
        </button>

        <button
          className="action-purple"
          onClick={() =>
            alert(
              "Teklif modülü hazırlanıyor."
            )
          }
        >
          <MdAdd />
          Yeni Teklif
        </button>

        <button
          className="action-orange"
          onClick={() =>
            alert(
              "Makbuz modülü hazırlanıyor."
            )
          }
        >
          <MdAdd />
          Serbest Meslek Makbuzu
        </button>

        <button
          className="action-shortcuts"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <MdMoreHoriz />
          Kısayollar
        </button>
      </div>

      {/* KPI */}
      <div className="dashboard-kpis">

        <div className="kpi-card sales">
          <div className="kpi-icon">
            <MdShoppingCart />
          </div>

          <div>
            <span>
              BUGÜNKÜ SATIŞ
            </span>

            <strong>
              ₺ {money(todaySales)}
            </strong>

            <small>
              Bugünkü gerçek satış
            </small>
          </div>
        </div>

        <div className="kpi-card month">
          <div className="kpi-icon">
            <MdTrendingUp />
          </div>

          <div>
            <span>
              BU AY SATIŞ
            </span>

            <strong>
              ₺ {money(monthSales)}
            </strong>

            <small>
              Bu ay toplam satış
            </small>
          </div>
        </div>

        <div className="kpi-card collection">
          <div className="kpi-icon">
            <MdAttachMoney />
          </div>

          <div>
            <span>
              BEKLEYEN TAHSİLAT
            </span>

            <strong>
              ₺ {money(pendingAmount)}
            </strong>

            <small>
              Toplam açık bakiye
            </small>
          </div>
        </div>

        <div className="kpi-card partial">
          <div className="kpi-icon">
            <MdReceiptLong />
          </div>

          <div>
            <span>
              KISMİ ÖDENEN
            </span>

            <strong>
              ₺ {money(partiallyPaidAmount)}
            </strong>

            <small>
              Kısmi ödeme bekleyen
            </small>
          </div>
        </div>

        <div className="kpi-card customer">
          <div className="kpi-icon">
            <MdPeople />
          </div>

          <div>
            <span>
              TOPLAM MÜŞTERİ
            </span>

            <strong>
              {activeCustomers}
            </strong>

            <small>
              Aktif cari
            </small>
          </div>
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="dashboard-main-grid">

        {/* SON FATURALAR */}
        <section className="dashboard-card invoices-card">

          <div className="dashboard-card-header">
            <div>
              <span>
                FATURA YÖNETİMİ
              </span>

              <h2>
                Son Faturalar
              </h2>
            </div>

            <button
              className="header-link"
              onClick={() =>
                navigate("/invoices")
              }
            >
              Tüm Faturalar
              <MdArrowForward />
            </button>
          </div>

          <div className="invoice-table-wrap">

            <table className="dashboard-invoice-table">

              <thead>
                <tr>
                  <th>Belge No</th>
                  <th>Müşteri</th>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Tahsilat</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>

              <tbody>

                {recentInvoices.length === 0 ? (

                  <tr>
                    <td
                      colSpan="7"
                      className="dashboard-empty"
                    >
                      <MdReceiptLong />

                      <strong>
                        Henüz fatura bulunmuyor
                      </strong>

                      <span>
                        Yeni Fatura ile ilk
                        faturanızı oluşturun.
                      </span>
                    </td>
                  </tr>

                ) : (

                  recentInvoices.map(
                    (invoice) => {

                      const status =
                        invoiceStatus(
                          invoice
                        );

                      return (
                        <tr
                          key={
                            invoice.id ??
                            invoice.invoiceNo
                          }
                        >

                          <td>
                            <strong className="invoice-number">
                              {invoice.invoiceNo ||
                                `REN-${invoice.id}`}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {invoice.cariName ||
                                invoice.customerName ||
                                invoice.customer?.name ||
                                "Müşteri"}
                            </strong>
                          </td>

                          <td>
                            {formatDate(
                              invoice?.date ||
                                invoice?.createdAt
                            )}
                          </td>

                          <td>
                            <strong>
                              ₺{" "}
                              {money(
                                invoiceTotal(
                                  invoice
                                )
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="paid-amount">
                              ₺{" "}
                              {money(
                                invoicePaidAmount(
                                  invoice
                                )
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${status.type}`}
                            >
                              {status.text}
                            </span>
                          </td>

                          <td>
                            <div className="invoice-actions">

                              <button
                                title="Görüntüle"
                                onClick={() =>
                                  navigate(
                                    "/invoices"
                                  )
                                }
                              >
                                <MdVisibility />
                              </button>

                              <button
                                title="Düzenle"
                                onClick={() =>
                                  navigate(
                                    "/invoices"
                                  )
                                }
                              >
                                <MdEdit />
                              </button>

                              {invoiceRemaining(
                                invoice
                              ) > 0 && (
                                <button
                                  className="payment"
                                  title="Tahsilat"
                                  onClick={() =>
                                    navigate(
                                      "/collections"
                                    )
                                  }
                                >
                                  <MdLocalAtm />
                                </button>
                              )}

                              <button
                                title="Yazdır"
                                onClick={() =>
                                  window.print()
                                }
                              >
                                <MdPrint />
                              </button>

                              <button
                                title="Sil"
                                className="danger"
                                onClick={() =>
                                  alert(
                                    "Silme işlemi Fatura ekranından yapılabilir."
                                  )
                                }
                              >
                                <MdDelete />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>
            </table>
          </div>

          <button
            className="table-footer-button"
            onClick={() =>
              navigate("/invoices")
            }
          >
            Tümünü Gör
            <MdArrowForward />
          </button>

        </section>

        {/* SAĞ KOLON */}
        <aside className="dashboard-side">

          {/* TAHSİLAT DURUMU */}
          <section className="dashboard-card collection-card">

            <div className="dashboard-card-header">

              <div>
                <span>
                  FİNANS
                </span>

                <h2>
                  Tahsilat Durumu
                </h2>
              </div>

              <select
                value={period}
                onChange={(event) =>
                  setPeriod(
                    event.target.value
                  )
                }
              >
                <option value="week">
                  Son 7 Gün
                </option>

                <option value="month">
                  Bu Ay
                </option>

                <option value="quarter">
                  Son 3 Ay
                </option>
              </select>

            </div>

            <div className="collection-content">

              <div className="collection-list">

                <div className="collection-row">
                  <i className="dot green" />

                  <span>
                    Tahsil Edilen
                  </span>

                  <strong>
                    ₺{" "}
                    {money(
                      monthCollected
                    )}
                  </strong>
                </div>

                <div className="collection-row">
                  <i className="dot orange" />

                  <span>
                    Bekleyen
                  </span>

                  <strong>
                    ₺{" "}
                    {money(
                      Math.max(
                        pendingAmount -
                          overdueAmount,
                        0
                      )
                    )}
                  </strong>
                </div>

                <div className="collection-row">
                  <i className="dot red" />

                  <span>
                    Geciken
                  </span>

                  <strong>
                    ₺{" "}
                    {money(
                      overdueAmount
                    )}
                  </strong>
                </div>

                <div className="collection-total">
                  <span>
                    Toplam
                  </span>

                  <strong>
                    ₺{" "}
                    {money(
                      monthCollected +
                        pendingAmount
                    )}
                  </strong>
                </div>

              </div>

              <div className="donut-wrapper">

                <div
                  className="donut"
                  style={{
                    "--paid":
                      `${Math.min(
                        100,
                        monthCollected +
                          pendingAmount >
                          0
                          ? (
                              monthCollected /
                              (monthCollected +
                                pendingAmount)
                            ) *
                            100
                          : 0
                      )}%`,
                  }}
                >
                  <div>

                    <span>
                      Tahsilat Oranı
                    </span>

                    <strong>
                      {monthCollected +
                        pendingAmount >
                      0
                        ? (
                            (
                              monthCollected /
                              (monthCollected +
                                pendingAmount)
                            ) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </strong>

                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* SON İŞLEMLER */}
          <section className="dashboard-card recent-collections">

            <div className="dashboard-card-header">

              <div>
                <span>
                  HAREKETLER
                </span>

                <h2>
                  Son İşlemler
                </h2>
              </div>

              <button
                type="button"
                className="header-link"
                onClick={() =>
                  navigate("/sales")
                }
              >
                Tümü
                <MdArrowForward />
              </button>
            </div>

            <div className="collection-history">

              {recentCollections.length === 0 ? (

                <div className="small-empty">
                  Henüz işlem bulunmuyor.
                </div>

              ) : (

                recentCollections.map(
                  (sale, index) => {

                    const customerName =
                      sale?.customer?.name ||
                      sale?.customerName ||
                      sale?.cariName ||
                      sale?.customer ||
                      "Perakende Müşteri";

                    const paymentType =
                      sale?.paymentType ||
                      "Nakit";

                    const isCredit =
                      paymentType === "Veresiye" ||
                      paymentType === "Vadeli";

                    const termDays =
                      sale?.dueDays ??
                      sale?.termDays ??
                      sale?.vadeGun ??
                      null;

                    const termText =
                      isCredit
                        ? termDays
                          ? `Vadeli • ${termDays} Gün`
                          : "Vadeli"
                        : "Peşin";

                    const paymentText =
                      paymentType ===
                      "Veresiye"
                        ? "Cari"
                        : paymentType;

                    return (
                      <div
                        className="collection-history-row"
                        key={
                          sale?.id ??
                          index
                        }
                      >

                        <div className="history-icon">
                          🛒
                        </div>

                        <div className="history-info">

                          <strong>
                            Satış
                            {" • "}
                            {customerName}
                          </strong>

                          <span>
                            {formatDate(
                              sale?.date ||
                                sale?.createdAt ||
                                sale?.timestamp
                            )}
                            {" • "}
                            {formatTime(
                              sale?.date ||
                                sale?.createdAt ||
                                sale?.timestamp
                            )}
                            {" • "}
                            {termText}
                            {" • "}
                            {paymentText}
                          </span>

                        </div>

                        <strong className="history-amount">
                          ₺{" "}
                          {money(
                            sale?.receivedMoney ??
                              saleTotal(sale)
                          )}
                        </strong>

                      </div>
                    );
                  }
                )

              )}
            </div>

          </section>

        </aside>

      </div>

      {/* SALES CHART + QUICK ACTIONS */}
      <div className="dashboard-bottom-grid">

        <section className="dashboard-card chart-card">

          <div className="dashboard-card-header">

            <div>
              <span>
                PERFORMANS
              </span>

              <h2>
                Satış Grafiği
              </h2>
            </div>

            <div className="chart-period-controls">

              <select
                value={chartPeriod}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setChartPeriod(value);

                  if (
                    value === "year"
                  ) {
                    setChartYear(
                      currentYear
                    );
                  }
                }}
              >
                <optgroup label="Günlük">
                  <option value="today">
                    Bugün
                  </option>

                  <option value="yesterday">
                    Dün
                  </option>

                  <option value="7d">
                    7G
                  </option>

                  <option value="15d">
                    15G
                  </option>

                  <option value="30d">
                    30G
                  </option>

                  <option value="60d">
                    60G
                  </option>

                  <option value="90d">
                    90G
                  </option>
                </optgroup>

                <optgroup label="Aylık">
                  <option value="thisMonth">
                    Bu Ay
                  </option>

                  <option value="lastMonth">
                    Geçen Ay
                  </option>

                  <option value="3m">
                    3 Ay
                  </option>

                  <option value="6m">
                    6 Ay
                  </option>

                  <option value="12m">
                    12 Ay
                  </option>
                </optgroup>

                <optgroup label="Yıllık">
                  <option value="thisYear">
                    Bu Yıl
                  </option>

                  <option value="lastYear">
                    Geçen Yıl
                  </option>

                  <option value="year">
                    Yıl Seç
                  </option>
                </optgroup>

              </select>

              {chartPeriod === "year" && (
                <select
                  value={chartYear}
                  onChange={(event) =>
                    setChartYear(
                      Number(
                        event.target.value
                      )
                    )
                  }
                >
                  {availableYears.map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>
                    )
                  )}
                </select>
              )}
            </div>

          </div>

          <div className="chart-summary">

            <div>
              <span>
                SATIŞ
              </span>

              <strong>
                ₺ {money(monthSales)}
              </strong>

              <small className="chart-period-label">
                {chartPeriod === "today"
                  ? "Bugün"
                  : chartPeriod ===
                    "yesterday"
                  ? "Dün"
                  : chartPeriod === "7d"
                  ? "Son 7 Gün"
                  : chartPeriod === "15d"
                  ? "Son 15 Gün"
                  : chartPeriod === "30d"
                  ? "Son 30 Gün"
                  : chartPeriod === "60d"
                  ? "Son 60 Gün"
                  : chartPeriod === "90d"
                  ? "Son 90 Gün"
                  : chartPeriod ===
                    "thisMonth"
                  ? "Bu Ay"
                  : chartPeriod ===
                    "lastMonth"
                  ? "Geçen Ay"
                  : chartPeriod === "3m"
                  ? "Son 3 Ay"
                  : chartPeriod === "6m"
                  ? "Son 6 Ay"
                  : chartPeriod ===
                    "12m"
                  ? "Son 12 Ay"
                  : chartPeriod ===
                    "thisYear"
                  ? "Bu Yıl"
                  : chartPeriod ===
                    "lastYear"
                  ? "Geçen Yıl"
                  : chartYear}
              </small>
            </div>

            <div>
              <span>
                GİDER
              </span>

              <strong>
                ₺ {money(monthExpenses)}
              </strong>
            </div>

            <div>
              <span>
                NET
              </span>

              <strong className="positive">
                ₺{" "}
                {money(
                  Math.max(
                    monthSales -
                      monthExpenses,
                    0
                  )
                )}
              </strong>
            </div>

          </div>

          <div className="chart-area-wrapper">

            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >

              {[25, 75, 125, 175, 195].map(
                (y) => (
                  <line
                    key={y}
                    x1="35"
                    x2="725"
                    y1={y}
                    y2={y}
                    className="chart-grid-line"
                  />
                )
              )}

              <polygon
                points={areaPoints}
                className="chart-area-fill"
              />

              <polyline
                points={linePoints}
                className="chart-line"
              />

              {chartPoints.map(
                (point, index) =>
                  point.value > 0 && (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      className="chart-point"
                    />
                  )
              )}

            </svg>

            <div className="chart-labels">

              {chartPoints.map(
                (point, index) => (
                  <span
                    key={index}
                  >
                    {point.label}
                  </span>
                )
              )}

            </div>

          </div>
        </section>

        {/* HIZLI İŞLEMLER */}
        <section className="dashboard-card quick-card">

          <div className="dashboard-card-header">

            <div>
              <span>
                YÖNETİM
              </span>

              <h2>
                Hızlı İşlemler
              </h2>
            </div>

          </div>

          <div className="quick-grid">

            {quickActions.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <button
                    key={item.title}
                    type="button"
                    className={`quick-item ${item.type}`}
                    onClick={
                      item.action
                    }
                  >

                    <div>
                      <Icon />
                    </div>

                    <span>
                      {item.title}
                    </span>

                  </button>
                );
              }
            )}

          </div>
        </section>

      </div>

      {/* FINANCE + STOCK + AI */}
      <div className="dashboard-management-grid">

        <section className="dashboard-card finance-card">

          <div className="dashboard-card-header">

            <div>
              <span>
                FİNANS
              </span>

              <h2>
                Finans Özeti
              </h2>
            </div>

            <span className="header-muted">
              Bu Ay
            </span>

          </div>

          <div className="finance-values">

            <div>
              <span>
                Satış
              </span>

              <strong>
                ₺ {money(monthSales)}
              </strong>
            </div>

            <div>
              <span>
                Gider
              </span>

              <strong>
                ₺ {money(monthExpenses)}
              </strong>
            </div>

            <div>
              <span>
                Net Kâr
              </span>

              <strong className="positive">
                ₺{" "}
                {money(
                  Math.max(
                    monthSales -
                      monthExpenses,
                    0
                  )
                )}
              </strong>
            </div>

          </div>
        </section>

        <section className="dashboard-card stock-card">

          <div className="dashboard-card-header">

            <div>
              <span>
                STOK
              </span>

              <h2>
                Stok Durumu
              </h2>
            </div>

            <button
              type="button"
              className="header-link"
              onClick={() =>
                navigate("/products")
              }
            >
              Stok
              <MdArrowForward />
            </button>

          </div>

          <div className="stock-overview">

            <div className="stock-big">

              <span>
                STOK DEĞERİ
              </span>

              <strong>
                ₺ {money(stockValue)}
              </strong>

              <small>
                {products.length} ürün
              </small>

            </div>

            <div className="critical-stock">

              <MdWarning />

              <div>
                <strong>
                  {criticalStocks.length}
                </strong>

                <span>
                  Kritik stok
                </span>
              </div>

            </div>

          </div>

        </section>

        <section className="dashboard-card ai-summary-card">

          <div className="dashboard-card-header">

            <div className="ai-title">

              <div className="ai-small-icon">
                <MdAutoAwesome />
              </div>

              <div>
                <span>
                  YAPAY ZEKA
                </span>

                <h2>
                  REN AI
                </h2>
              </div>

            </div>

            <span className="ai-active">
              AKTİF
            </span>

          </div>

          <div className="ai-summary-content">

            <strong>
              Patron Özeti
            </strong>

            <p>
              {criticalStocks.length > 0
                ? `${criticalStocks.length} üründe kritik stok seviyesi var. `
                : "Kritik stok görünmüyor. "}

              {overdueAmount > 0
                ? `Ayrıca ₺ ${money(
                    overdueAmount
                  )} gecikmiş tahsilat bulunuyor.`
                : "Gecikmiş tahsilat görünmüyor."}
            </p>

          </div>

          <button
            type="button"
            className="ai-open-button"
            onClick={() =>
              alert(
                "REN AI detaylı analiz modülü sonraki aşamada aktif edilecek."
              )
            }
          >
            REN AI'ya Sor
            <MdArrowForward />
          </button>

        </section>

      </div>

      {/* FULL AI ASSISTANT */}
      <section className="ren-ai-assistant">

        <div className="ai-assistant-top">

          <div className="ai-brand">

            <div className="ai-avatar">
              <span>
                REN
              </span>

              <i />
            </div>

            <div>

              <div className="ai-eyebrow">
                REN AI
              </div>

              <h2>
                Patron Asistanın
              </h2>

              <p>
                İşletmeni analiz eder,
                önemli noktaları senin
                için özetler.
              </p>

            </div>
          </div>

          <div className="ai-status">
            <span />
            Çevrimiçi
          </div>

        </div>

        <div className="ai-assistant-grid">

          <div className="ai-insights">

            <div className="ai-message">

              <div className="ai-message-icon">
                ✦
              </div>

              <div>

                <strong>
                  Bugünkü Patron Özeti
                </strong>

                <p>
                  Bugünkü satışın{" "}
                  <b>
                    ₺ {money(todaySales)}
                  </b>
                  . Bu ay toplam satışın{" "}
                  <b>
                    ₺ {money(monthSales)}
                  </b>
                  .{" "}
                  {overdueAmount > 0
                    ? `₺ ${money(
                        overdueAmount
                      )} gecikmiş tahsilat var.`
                    : "Gecikmiş tahsilat görünmüyor."}
                </p>

              </div>
            </div>

            <div className="ai-mini-grid">

              <div className="ai-mini-card">

                <span>
                  Satış
                </span>

                <strong>
                  ₺ {money(todaySales)}
                </strong>

                <small>
                  Bugünkü satış
                </small>

              </div>

              <div className="ai-mini-card">

                <span>
                  Tahsilat
                </span>

                <strong>
                  ₺ {money(monthCollected)}
                </strong>

                <small>
                  Bu ay tahsilat
                </small>

              </div>

              <div className="ai-mini-card warning">

                <span>
                  Risk
                </span>

                <strong>
                  {criticalStocks.length}
                </strong>

                <small>
                  Kritik stok
                </small>

              </div>

            </div>

          </div>

          <div className="ai-chat">

            <div className="ai-chat-title">

              <span>
                REN AI'ya sor
              </span>

              <small>
                Örn. "Bugün neye dikkat etmeliyim?"
              </small>

            </div>

            <div className="ai-chat-row">

              <input
                type="text"
                placeholder="İşletmen hakkında bir şey sor..."
                onKeyDown={(event) => {

                  if (
                    event.key !== "Enter"
                  ) {
                    return;
                  }

                  const value =
                    event.currentTarget.value
                      .trim()
                      .toLowerCase();

                  if (!value) {
                    return;
                  }

                  let answer =
                    "Bugün satış, tahsilat ve kritik stokları kontrol etmeni öneriyorum.";

                  if (
                    value.includes(
                      "satış"
                    ) ||
                    value.includes(
                      "ciro"
                    )
                  ) {
                    answer =
                      `Bugünkü satışın ₺ ${money(
                        todaySales
                      )}, bu ay satışın ₺ ${money(
                        monthSales
                      )}.`;
                  } else if (
                    value.includes(
                      "tahsilat"
                    ) ||
                    value.includes(
                      "borç"
                    )
                  ) {
                    answer =
                      `Bekleyen tahsilat ₺ ${money(
                        pendingAmount
                      )}. Geciken tutar ₺ ${money(
                        overdueAmount
                      )}.`;
                  } else if (
                    value.includes(
                      "stok"
                    )
                  ) {
                    answer =
                      `Toplam ${products.length} ürün kayıtlı. ${criticalStocks.length} ürün kritik stok seviyesinde.`;
                  } else if (
                    value.includes(
                      "müşteri"
                    ) ||
                    value.includes(
                      "cari"
                    )
                  ) {
                    answer =
                      `${activeCustomers} aktif cari bulunuyor. Açık bakiye toplamı ₺ ${money(
                        outstandingAmount
                      )}.`;
                  } else if (
                    value.includes(
                      "vade"
                    )
                  ) {
                    answer =
                      `${salesInvoices.filter(
                        (invoice) =>
                          invoiceRemaining(
                            invoice
                          ) > 0
                      ).length} faturada açık bakiye bulunuyor.`;
                  }

                  alert(
                    `REN AI\n\n${answer}`
                  );

                  event.currentTarget.value =
                    "";
                }}
              />

              <button
                type="button"
                onClick={(event) => {

                  const input =
                    event.currentTarget
                      .previousElementSibling;

                  if (
                    input &&
                    input.value.trim()
                  ) {
                    input.dispatchEvent(
                      new KeyboardEvent(
                        "keydown",
                        {
                          key: "Enter",
                          bubbles: true,
                        }
                      )
                    );
                  }

                }}
              >
                Gönder
              </button>

            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <div className="dashboard-footer-note">

        <span>
          REN ERP PRO • Yönetim Paneli
        </span>

        <span>
          {products.length} ürün •{" "}
          {invoices.length} fatura •{" "}
          {customers.length} cari
        </span>

      </div>

    </div>
  );
}

export default Dashboard;