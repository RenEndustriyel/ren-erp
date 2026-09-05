import { useEffect, useMemo, useState } from "react";
import {
  MdAccountBalance,
  MdAdd,
  MdArrowForward,
  MdCalendarToday,
  MdCheckCircle,
  MdDescription,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
  MdLocalAtm,
  MdMoreVert,
  MdPayments,
  MdReceiptLong,
  MdSearch,
  MdTrendingDown,
  MdTrendingUp,
} from "react-icons/md";

import { getInvoices } from "../../lib/invoiceStore";
import { getCustomers } from "../../lib/customerStore";
import { getProducts } from "../../lib/stockStore";

import "./Overview.css";

const ACCOUNT_KEYS = [
  "ren-erp-cash-bank-accounts",
  "ren-finance-accounts",
  "ren-cashbank-accounts",
];

const money = (value) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateKey = (value) => {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const typeOf = (value) => {
  const type = String(value || "").toLowerCase();

  if (
    type.includes("alış") ||
    type.includes("alis") ||
    type.includes("purchase")
  ) {
    return "purchase";
  }

  if (type.includes("iade") || type.includes("return")) {
    return "return";
  }

  return "sales";
};

const totalOf = (invoice) =>
  Number(
    invoice?.total ??
      invoice?.grandTotal ??
      invoice?.amount ??
      invoice?.totalAmount ??
      0
  ) || 0;

const paidOf = (invoice) =>
  Number(
    invoice?.paidAmount ??
      invoice?.paymentAmount ??
      invoice?.paid ??
      0
  ) || 0;

const isPaid = (invoice) => {
  const status = String(
    invoice?.status || invoice?.paymentStatus || ""
  ).toLowerCase();

  return (
    status.includes("paid") ||
    status.includes("ödendi") ||
    status.includes("tahsil") ||
    status.includes("tamam")
  );
};

const getAccountType = (account) => {
  const type = String(
    account?.type || account?.accountType || ""
  ).toLowerCase();

  return type.includes("kasa") ||
    type.includes("cash") ||
    type.includes("nakit")
    ? "cash"
    : "bank";
};

const getAccountName = (account) =>
  account?.name ||
  account?.title ||
  account?.accountName ||
  account?.bankName ||
  "Hesap";

const loadAccounts = () => {
  for (const key of ACCOUNT_KEYS) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || "null");

      if (Array.isArray(raw)) return raw;
      if (raw?.accounts && Array.isArray(raw.accounts)) {
        return raw.accounts;
      }
    } catch {}
  }

  return [];
};

const customerOf = (invoice, customers) => {
  if (invoice?.customerName) return invoice.customerName;
  if (invoice?.supplierName) return invoice.supplierName;

  const customer = customers.find(
    (item) =>
      String(item.id) ===
      String(invoice?.customerId || invoice?.supplierId)
  );

  return (
    customer?.name ||
    customer?.title ||
    customer?.companyName ||
    "Cari"
  );
};

const daysToDue = (invoice, today) => {
  const due = dateKey(invoice?.dueDate || invoice?.date);
  if (!due) return null;

  return Math.round(
    (new Date(`${due}T12:00:00`).getTime() -
      new Date(`${today}T12:00:00`).getTime()) /
      86400000
  );
};

const getQuickSales = () => {
  try {
    const raw = JSON.parse(
      localStorage.getItem("ren_erp_quick_sales") || "[]"
    );

    if (!Array.isArray(raw)) return [];

    return raw.map((sale) => ({
      id: sale.id || `quick-${Date.now()}-${Math.random()}`,
      type: "sales",
      invoiceNo:
        sale.number ||
        sale.saleNumber ||
        sale.invoiceNo ||
        sale.id ||
        "Hızlı Satış",
      date: sale.date || sale.createdAt,
      createdAt:
        sale.createdAt ||
        `${sale.date || dateKey(new Date())}T${sale.time || "00:00"}:00`,
      customerName:
        sale.customerName ||
        sale.customer ||
        "Hızlı Satış",
      notes: sale.notes || "Hızlı Satış",
      total: Number(
        sale.total ||
          sale.grandTotal ||
          sale.totalAmount ||
          0
      ),
      status:
        sale.paymentType === "credit"
          ? "Veresiye"
          : "Tamamlandı",
      __quickSale: true,
    }));
  } catch {
    return [];
  }
};

function MoneyRing({ title, amount, percent, type = "green" }) {
  const safePercent = Math.max(
    0,
    Math.min(100, Number(percent) || 0)
  );

  return (
    <article className={`def-ring-card ${type}`}>
      <span className="def-ring-title">{title}</span>

      <div
        className="def-ring"
        style={{
          "--ring-progress": `${safePercent}%`,
        }}
      >
        <div className="def-ring-inner">
          <strong>₺{money(amount)}</strong>
          <span>%{Math.round(safePercent)}</span>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ children = "Kayıt bulunamadı." }) {
  return (
    <div className="def-empty-state">
      <MdCheckCircle />
      <span>{children}</span>
    </div>
  );
}

export default function Overview() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(new Date());
  const [period, setPeriod] = useState("Tüm zamanlar");
  const [agendaView, setAgendaView] = useState("Haftalık");
  const [agendaSearch, setAgendaSearch] = useState("");

  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
      setRefreshKey((value) => value + 1);
    };

    const events = [
      "ren-invoices-updated",
      "ren-finance-updated",
      "ren-stock-updated",
      "ren-stock-movements-changed",
      "ren-products-changed",
      "ren-customers-updated",
      "ren-cash-bank-updated",
      "storage",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, refresh)
    );

    const timer = window.setInterval(refresh, 30000);

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, refresh)
      );
      window.clearInterval(timer);
    };
  }, []);

  const invoices = useMemo(
    () => getInvoices() || [],
    [refreshKey]
  );

  const customers = useMemo(
    () => getCustomers() || [],
    [refreshKey]
  );

  const products = useMemo(
    () => getProducts() || [],
    [refreshKey]
  );

  const accounts = useMemo(
    () => loadAccounts(),
    [refreshKey]
  );

  const today = dateKey(now);
  const currentMonth = today.slice(0, 7);

  const sales = invoices.filter(
    (invoice) => typeOf(invoice.type) === "sales"
  );

  const purchases = invoices.filter(
    (invoice) => typeOf(invoice.type) === "purchase"
  );

  const quickSales = useMemo(
    () => getQuickSales(),
    [refreshKey, today]
  );

  const invoiceRecent = invoices.map((invoice) => ({
    ...invoice,
    __quickSale: false,
  }));

  const recent = [
    ...invoiceRecent,
    ...quickSales.filter(
      (quickSale) =>
        !invoiceRecent.some(
          (invoice) =>
            String(invoice.sourceId || "") ===
              String(quickSale.invoiceNo || "") ||
            String(invoice.id || "") ===
              String(quickSale.id || "")
        )
    ),
  ]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt ||
            b.date ||
            0
        ).getTime() -
        new Date(
          a.createdAt ||
            a.date ||
            0
        ).getTime()
    )
    .slice(0, 7);

  const todaySalesInvoices = [
    ...sales,
    ...quickSales,
  ].filter(
    (invoice) =>
      dateKey(invoice.date || invoice.createdAt) === today
  );

  const todayPurchaseInvoices = purchases.filter(
    (invoice) =>
      dateKey(invoice.date || invoice.createdAt) === today
  );

  const todaySales = todaySalesInvoices.reduce(
    (sum, invoice) => sum + totalOf(invoice),
    0
  );

  const todayPurchases = todayPurchaseInvoices.reduce(
    (sum, invoice) => sum + totalOf(invoice),
    0
  );

  const monthSales = [
    ...sales,
    ...quickSales,
  ]
    .filter(
      (invoice) =>
        dateKey(invoice.date || invoice.createdAt).startsWith(
          currentMonth
        )
    )
    .reduce((sum, invoice) => sum + totalOf(invoice), 0);

  const monthPurchases = purchases
    .filter(
      (invoice) =>
        dateKey(invoice.date || invoice.createdAt).startsWith(
          currentMonth
        )
    )
    .reduce((sum, invoice) => sum + totalOf(invoice), 0);

  const toCollect = [
    ...sales,
    ...quickSales,
  ].filter((invoice) => !isPaid(invoice));

  const toPay = purchases.filter(
    (invoice) => !isPaid(invoice)
  );

  const collectTotal = toCollect.reduce(
    (sum, invoice) =>
      sum +
      Math.max(
        totalOf(invoice) - paidOf(invoice),
        0
      ),
    0
  );

  const payTotal = toPay.reduce(
    (sum, invoice) =>
      sum +
      Math.max(
        totalOf(invoice) - paidOf(invoice),
        0
      ),
    0
  );

  const overdueCollect = toCollect
    .filter(
      (invoice) =>
        (daysToDue(invoice, today) ?? 0) < 0
    )
    .reduce(
      (sum, invoice) =>
        sum +
        Math.max(
          totalOf(invoice) - paidOf(invoice),
          0
        ),
      0
    );

  const overduePay = toPay
    .filter(
      (invoice) =>
        (daysToDue(invoice, today) ?? 0) < 0
    )
    .reduce(
      (sum, invoice) =>
        sum +
        Math.max(
          totalOf(invoice) - paidOf(invoice),
          0
        ),
      0
    );

  const cashBalance = accounts
    .filter(
      (account) =>
        getAccountType(account) === "cash"
    )
    .reduce(
      (sum, account) =>
        sum +
        Number(
          account?.balance ??
            account?.currentBalance ??
            account?.amount ??
            0
        ),
      0
    );

  const bankBalance = accounts
    .filter(
      (account) =>
        getAccountType(account) === "bank"
    )
    .reduce(
      (sum, account) =>
        sum +
        Number(
          account?.balance ??
            account?.currentBalance ??
            account?.amount ??
            0
        ),
      0
    );

  const totalIncome = monthSales;
  const totalExpense = monthPurchases;
  const profit = totalIncome - totalExpense;
  const totalCash = bankBalance + cashBalance;

  const stockQty = products.reduce(
    (sum, product) =>
      sum + Number(product?.stock || 0),
    0
  );

  const criticalProducts = products.filter(
    (product) =>
      Number(product?.stock || 0) <=
      Number(product?.criticalStock ?? 15)
  ).length;

  const upcomingCollections = [...toCollect]
    .sort(
      (a, b) =>
        (daysToDue(a, today) ?? 9999) -
        (daysToDue(b, today) ?? 9999)
    )
    .slice(0, 4);

  const upcomingPayments = [...toPay]
    .sort(
      (a, b) =>
        (daysToDue(a, today) ?? 9999) -
        (daysToDue(b, today) ?? 9999)
    )
    .slice(0, 4);

  const profitIncomePercent =
    totalIncome > 0
      ? (Math.max(profit, 0) / totalIncome) * 100
      : 0;

  const profitExpensePercent =
    totalIncome > 0
      ? (Math.max(totalExpense, 0) / totalIncome) * 100
      : 0;

  const recentCashAccounts = accounts
    .slice(0, 3)
    .map((account) => ({
      name: getAccountName(account),
      balance: Number(
        account?.balance ??
          account?.currentBalance ??
          account?.amount ??
          0
      ),
    }));

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const agendaDays = Array.from({ length: 5 }, (_, index) => {
    const day = new Date(dayStart);
    day.setDate(day.getDate() + index);

    return {
      date: day,
      key: dateKey(day),
    };
  });

  const filteredRecent = recent.filter((item) => {
    const query = agendaSearch.trim().toLocaleLowerCase("tr-TR");
    if (!query) return true;

    const text = [
      item.invoiceNo,
      item.customerName,
      item.supplierName,
      item.notes,
      item.description,
      item.__quickSale ? "hızlı satış" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    return text.includes(query);
  });

  const openQuickAction = (path) => {
    window.location.href = path;
  };

  const formattedToday = now.toLocaleDateString(
    "tr-TR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="def-dashboard">
      <div className="def-dashboard-grid">
        <main className="def-main-column">
          <section className="def-welcome-card">
            <div className="def-welcome-tabs">
              <button type="button">Nakit Akışı</button>
              <button className="active" type="button">
                Özet
              </button>
            </div>

            <div className="def-welcome-list">
              {[
                [
                  "Geciken ödemeler",
                  overduePay,
                  "/payments",
                ],
                [
                  "Geciken tahsilatlar",
                  overdueCollect,
                  "/collections",
                ],
                [
                  "Vade girilmemiş ödemeler",
                  0,
                  "/payments",
                ],
                [
                  "Vade girilmemiş tahsilatlar",
                  0,
                  "/collections",
                ],
                [
                  "Yaklaşan ödemeler",
                  Math.max(payTotal - overduePay, 0),
                  "/payments",
                ],
                [
                  "Yaklaşan tahsilatlar",
                  Math.max(
                    collectTotal - overdueCollect,
                    0
                  ),
                  "/collections",
                ],
              ].map(([label, amount, path]) => (
                <button
                  key={label}
                  className="def-summary-row"
                  type="button"
                  onClick={() => openQuickAction(path)}
                >
                  <span>{label}</span>
                  <strong>
                    ₺{money(amount)}
                    <MdKeyboardArrowRight />
                  </strong>
                </button>
              ))}
            </div>
          </section>

          <section className="def-agenda-card">
            <div className="def-section-title-row">
              <div>
                <h2>Ajanda</h2>
                <span>
                  Planlanmış etkinliklerinizi gözden geçirin
                </span>
              </div>

              <div className="def-agenda-actions">
                <label className="def-search">
                  <MdSearch />
                  <input
                    value={agendaSearch}
                    onChange={(event) =>
                      setAgendaSearch(
                        event.target.value
                      )
                    }
                    placeholder="Kayıtlarda ara..."
                  />
                </label>

                <button
                  className="def-select"
                  type="button"
                  onClick={() =>
                    setAgendaView((value) =>
                      value === "Haftalık"
                        ? "Aylık"
                        : "Haftalık"
                    )
                  }
                >
                  {agendaView}
                  <MdKeyboardArrowDown />
                </button>

                <button
                  className="def-filter-btn"
                  type="button"
                >
                  Filtre
                </button>

                <button
                  className="def-add-btn"
                  type="button"
                  onClick={() =>
                    openQuickAction("/calendar")
                  }
                >
                  <MdAdd />
                  Ekle
                </button>
              </div>
            </div>

            <div className="def-calendar-head">
              {agendaDays.map((day) => (
                <div key={day.key}>
                  <span>
                    {day.date
                      .toLocaleDateString(
                        "tr-TR",
                        {
                          day: "numeric",
                          month: "long",
                          weekday: "short",
                        }
                      )
                      .toLocaleUpperCase("tr-TR")}
                  </span>
                </div>
              ))}
            </div>

            <div className="def-calendar-body">
              <div className="def-calendar-note">
                <MdCalendarToday />
                <div>
                  <strong>{formattedToday}</strong>
                  <span>
                    Hızlı satış, fatura ve tahsilat
                    hareketleri burada takip edilebilir.
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="def-large-grid">
            <article className="def-card def-finance-card">
              <div className="def-card-heading">
                <div>
                  <h2>Gelir - Gider</h2>
                  <span>Gelir ve gider grafiği</span>
                  <small>En güncel finansal durum</small>
                </div>

                <button
                  className="def-select"
                  type="button"
                  onClick={() =>
                    setPeriod((value) =>
                      value === "Tüm zamanlar"
                        ? "Bu ay"
                        : "Tüm zamanlar"
                    )
                  }
                >
                  {period}
                  <MdKeyboardArrowDown />
                </button>
              </div>

              <div className="def-profit-visual">
                <div
                  className="def-profit-arc"
                  style={{
                    "--profit-rotation": `${Math.min(
                      180,
                      Math.max(
                        0,
                        profitIncomePercent * 1.8
                      )
                    )}deg`,
                  }}
                >
                  <div className="def-profit-hole">
                    <span>Kâr</span>
                    <strong>
                      ₺{money(profit)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="def-income-expense">
                <div>
                  <span className="dot green" />
                  <label>Gelir</label>
                  <strong>
                    ₺{money(totalIncome)}
                  </strong>
                  <small>
                    %{Math.round(
                      totalIncome
                        ? 100
                        : 0
                    )}
                  </small>
                </div>

                <div>
                  <span className="dot gray" />
                  <label>Gider</label>
                  <strong>
                    ₺{money(totalExpense)}
                  </strong>
                  <small>
                    %{Math.round(
                      totalIncome
                        ? (totalExpense /
                            totalIncome) *
                            100
                        : 0
                    )}
                  </small>
                </div>
              </div>

              <div className="def-finance-bottom">
                <div>
                  <span>
                    <i className="dot green" />
                    Kasa
                  </span>
                  <strong>₺{money(cashBalance)}</strong>
                  <small>Net kasa</small>
                </div>

                <div>
                  <span>
                    <i className="dot red" />
                    Borç
                  </span>
                  <strong>₺{money(payTotal)}</strong>
                  <small>Kalan borç</small>
                </div>

                <div>
                  <span>
                    <i className="dot orange" />
                    Alacak
                  </span>
                  <strong>
                    ₺{money(collectTotal)}
                  </strong>
                  <small>Kalan alacak</small>
                </div>
              </div>
            </article>

            <article className="def-card def-cash-card">
              <div className="def-card-heading">
                <div>
                  <h2>Bankaya Bağlı Hesaplarınız</h2>
                  <span>
                    Kasa ve banka bakiyelerinizi
                    izleyin
                  </span>
                </div>

                <button
                  type="button"
                  className="def-link-btn"
                  onClick={() =>
                    openQuickAction(
                      "/cash-bank"
                    )
                  }
                >
                  Tümü
                  <MdKeyboardArrowRight />
                </button>
              </div>

              <div className="def-account-total">
                <span>Toplam nakit</span>
                <strong>
                  ₺{money(totalCash)}
                </strong>
              </div>

              <div className="def-account-list">
                {recentCashAccounts.length ? (
                  recentCashAccounts.map(
                    (account, index) => (
                      <div
                        className="def-account-row"
                        key={`${account.name}-${index}`}
                      >
                        <div className="def-account-icon">
                          <MdAccountBalance />
                        </div>

                        <div>
                          <strong>
                            {account.name}
                          </strong>
                          <span>
                            Bağlı hesap
                          </span>
                        </div>

                        <b>
                          ₺{money(account.balance)}
                        </b>
                      </div>
                    )
                  )
                ) : (
                  <EmptyState>
                    Henüz kasa veya banka hesabı
                    eklenmemiş.
                  </EmptyState>
                )}
              </div>
            </article>
          </section>

          <section className="def-card def-recent-card">
            <div className="def-card-heading">
              <div>
                <h2>Son İşlemler</h2>
                <span>
                  Bugünkü faturalar ve finansal
                  hareketler
                </span>
              </div>

              <button
                type="button"
                className="def-link-btn"
                onClick={() =>
                  openQuickAction("/invoices")
                }
              >
                Tüm Faturalar
                <MdArrowForward />
              </button>
            </div>

            <div className="def-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>TARİH</th>
                    <th>İŞLEM</th>
                    <th>AÇIKLAMA</th>
                    <th>BELGE</th>
                    <th>CARİ</th>
                    <th>TUTAR</th>
                    <th>DURUM</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecent.length ? (
                    filteredRecent.map((invoice) => {
                      const type = typeOf(
                        invoice.type
                      );

                      return (
                        <tr key={invoice.id}>
                          <td>
                            {new Date(
                              invoice.date ||
                                invoice.createdAt ||
                                Date.now()
                            ).toLocaleDateString(
                              "tr-TR"
                            )}
                          </td>

                          <td>
                            <span
                              className={`def-type-pill ${type}`}
                            >
                              {type === "purchase"
                                ? "Alış"
                                : type === "return"
                                ? "İade"
                                : "Satış"}
                            </span>
                          </td>

                          <td>
                            {invoice.__quickSale
                              ? "Hızlı Satış"
                              : invoice.notes ||
                                invoice.description ||
                                "Fatura işlemi"}
                          </td>

                          <td>
                            {invoice.invoiceNo ||
                              invoice.id}
                          </td>

                          <td>
                            {customerOf(
                              invoice,
                              customers
                            )}
                          </td>

                          <td className="def-amount">
                            ₺{money(
                              totalOf(invoice)
                            )}
                          </td>

                          <td>
                            <span className="def-status">
                              <MdCheckCircle />
                              {invoice.status ||
                                invoice.paymentStatus ||
                                "Tamamlandı"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="def-empty-cell"
                      >
                        <EmptyState>
                          Henüz işlem bulunmuyor.
                        </EmptyState>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <aside className="def-side-column">
          <section className="def-card def-side-card">
            <div className="def-side-heading">
              <div>
                <h3>Yaklaşan Tahsilatlar</h3>
                <span>
                  Müşterilerinizden beklenen ödemeler
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  openQuickAction(
                    "/collections"
                  )
                }
              >
                Tümü
                <MdKeyboardArrowRight />
              </button>
            </div>

            {upcomingCollections.length ? (
              upcomingCollections.map((invoice) => {
                const days = daysToDue(
                  invoice,
                  today
                );

                return (
                  <div
                    className="def-timeline-row"
                    key={invoice.id}
                  >
                    <div className="def-timeline-dot green">
                      {days < 0
                        ? "!"
                        : days ?? "–"}
                    </div>

                    <div className="def-timeline-info">
                      <strong>
                        {customerOf(
                          invoice,
                          customers
                        )}
                      </strong>

                      <span>
                        {invoice.invoiceNo ||
                          "Fatura"}{" "}
                        ·{" "}
                        {days == null
                          ? "Planlanmadı"
                          : days < 0
                          ? `${Math.abs(
                              days
                            )} gün gecikmiş`
                          : days === 0
                          ? "Bugün"
                          : `${days} gün`}
                      </span>
                    </div>

                    <b>
                      ₺{money(
                        Math.max(
                          totalOf(invoice) -
                            paidOf(invoice),
                          0
                        )
                      )}
                    </b>
                  </div>
                );
              })
            ) : (
              <EmptyState>
                Bekleyen tahsilat yok
              </EmptyState>
            )}
          </section>

          <section className="def-card def-side-card">
            <div className="def-side-heading">
              <div>
                <h3>Yaklaşan Ödemeler</h3>
                <span>
                  Tedarikçilere yapılacak ödemeler
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  openQuickAction("/payments")
                }
              >
                Tümü
                <MdKeyboardArrowRight />
              </button>
            </div>

            {upcomingPayments.length ? (
              upcomingPayments.map((invoice) => {
                const days = daysToDue(
                  invoice,
                  today
                );

                return (
                  <div
                    className="def-timeline-row"
                    key={invoice.id}
                  >
                    <div className="def-timeline-dot red">
                      {days < 0
                        ? "!"
                        : days ?? "–"}
                    </div>

                    <div className="def-timeline-info">
                      <strong>
                        {customerOf(
                          invoice,
                          customers
                        )}
                      </strong>

                      <span>
                        {invoice.invoiceNo ||
                          "Fatura"}{" "}
                        ·{" "}
                        {days == null
                          ? "Planlanmadı"
                          : days < 0
                          ? `${Math.abs(
                              days
                            )} gün gecikmiş`
                          : days === 0
                          ? "Bugün"
                          : `${days} gün`}
                      </span>
                    </div>

                    <b>
                      ₺{money(
                        Math.max(
                          totalOf(invoice) -
                            paidOf(invoice),
                          0
                        )
                      )}
                    </b>
                  </div>
                );
              })
            ) : (
              <EmptyState>
                Bekleyen ödeme yok
              </EmptyState>
            )}
          </section>

          <section className="def-card def-side-card">
            <div className="def-side-heading">
              <div>
                <h3>Kısa Yollar</h3>
                <span>Sık kullandığınız işlemler</span>
              </div>
            </div>

            <div className="def-shortcuts">
              <button
                type="button"
                onClick={() =>
                  openQuickAction(
                    "/invoices/new"
                  )
                }
              >
                <MdDescription />
                Yeni Fatura
              </button>

              <button
                type="button"
                onClick={() =>
                  openQuickAction(
                    "/customers/new"
                  )
                }
              >
                <MdLocalAtm />
                Cari Ekle
              </button>

              <button
                type="button"
                onClick={() =>
                  openQuickAction("/quick-sale")
                }
              >
                <MdPayments />
                Hızlı Satış
              </button>

              <button
                type="button"
                onClick={() =>
                  openQuickAction("/stock/new")
                }
              >
                <MdReceiptLong />
                Yeni Ürün
              </button>

              <button
                type="button"
                onClick={() =>
                  openQuickAction("/reports")
                }
              >
                <MdTrendingUp />
                Raporlar
              </button>

              <button
                type="button"
                onClick={() =>
                  openQuickAction(
                    "/cash-bank"
                  )
                }
              >
                <MdAccountBalance />
                Kasa / Banka
              </button>
            </div>
          </section>

          <section className="def-card def-side-card def-cashflow-card">
            <div className="def-today-header">
              <div>
                <span>BUGÜN</span>
                <h3>Net Nakit Akışı</h3>
              </div>
              <MdMoreVert />
            </div>

            <strong className="def-today-number">
              ₺{money(
                Math.max(
                  todaySales - todayPurchases,
                  0
                )
              )}
            </strong>

            <div className="def-cashflow-bar">
              <span
                style={{
                  width:
                    todaySales + todayPurchases
                      ? `${Math.min(
                          100,
                          (todaySales /
                            (todaySales +
                              todayPurchases)) *
                            100
                        )}%`
                      : "0%",
                }}
              />
            </div>

            <div className="def-today-footer">
              <span>
                <MdTrendingUp />
                Giriş ₺{money(todaySales)}
              </span>

              <span>
                <MdTrendingDown />
                Çıkış ₺{money(todayPurchases)}
              </span>
            </div>
          </section>

          <div className="def-mobile-note">
            <MoneyRing
              title="Aylık gelir"
              amount={totalIncome}
              percent={
                totalIncome > 0 ? 100 : 0
              }
            />
            <MoneyRing
              title="Aylık gider"
              amount={totalExpense}
              percent={
                totalIncome > 0
                  ? profitExpensePercent
                  : 0
              }
              type="orange"
            />
            <div className="def-mobile-stock">
              <MdReceiptLong />
              <div>
                <span>STOK</span>
                <strong>
                  {money(stockQty)}
                </strong>
                <small>
                  {criticalProducts} kritik ürün
                </small>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
