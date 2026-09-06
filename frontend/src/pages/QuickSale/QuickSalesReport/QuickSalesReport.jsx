import { useEffect, useMemo, useState } from "react";
import {
  MdDelete,
  MdEdit,
  MdRefresh,
  MdSearch,
  MdPointOfSale,
  MdTrendingUp,
  MdPayments,
  MdPercent,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { getProducts, updateProduct } from "../../../lib/stockStore";

import "./QuickSalesReport.css";

const QUICK_SALE_STORAGE_KEY = "ren_erp_quick_sales";
const FINANCE_MOVEMENT_STORAGE_KEY = "ren-erp-cash-bank-movements";
const ACCOUNT_STORAGE_KEY = "ren-erp-cash-bank-accounts";
const CUSTOMER_MOVEMENT_STORAGE_KEY = "ren-erp-customer-movements";
const STOCK_MOVEMENT_STORAGE_KEY = "ren_erp_stock_movements";

function num(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let text = String(value).trim().replace(/\s/g, "");
  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else {
    text = text.replace(",", ".");
  }
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num(value));
}

function readArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function dateOf(sale) {
  return String(sale?.date || sale?.createdAt || "").slice(0, 10);
}

function getCostPrice(item) {
  return num(
    item?.costPrice ??
    item?.purchaseGross ??
    item?.purchasePriceGross ??
    item?.purchaseNet ??
    item?.purchasePrice ??
    item?.buyPrice ??
    item?.costPrice ??
    0
  );
}

function saleCost(sale) {
  if (num(sale?.totalCost) > 0) return num(sale.totalCost);
  return (sale?.items || []).reduce(
    (sum, item) => sum + getCostPrice(item) * num(item?.quantity),
    0
  );
}

function saleProfit(sale) {
  const revenue = num(sale?.total);
  const cost = saleCost(sale);
  return revenue - cost;
}

function profitRate(sale) {
  const revenue = num(sale?.total);
  if (revenue <= 0 || saleCost(sale) <= 0) return null;
  return (saleProfit(sale) / revenue) * 100;
}

function getPaymentTotal(sale) {
  const payments = sale?.payments || {};
  return (
    num(payments.cash) +
    num(payments.card) +
    num(payments.credit)
  );
}

function getSameSaleFinanceMovements(sale) {
  const no = String(sale?.number || sale?.id || "");
  return readArray(FINANCE_MOVEMENT_STORAGE_KEY).filter(
    (m) =>
      String(m?.source) === "quick-sale" &&
      String(m?.sourceDocument || "") === no
  );
}

function adjustSaleFinanceAndAccounts(sale, oldTotal, newTotal) {
  const finance = readArray(FINANCE_MOVEMENT_STORAGE_KEY);
  const related = getSameSaleFinanceMovements(sale);

  const oldPayments = {
    cash: num(sale?.payments?.cash),
    card: num(sale?.payments?.card),
  };

  const oldPaid = oldPayments.cash + oldPayments.card;
  const newPaid = Math.min(oldPaid, newTotal);
  const ratio = oldPaid > 0 ? newPaid / oldPaid : 0;

  const newCash = Number((oldPayments.cash * ratio).toFixed(2));
  const newCard = Number((oldPayments.card * ratio).toFixed(2));
  const newCredit = Number(
    Math.max(0, newTotal - newCash - newCard).toFixed(2)
  );

  const desiredByMethod = {
    Nakit: newCash,
    "Kredi Kartı": newCard,
  };

  const updatedFinance = finance.map((movement) => {
    const same = related.find(
      (r) => String(r?.id) === String(movement?.id)
    );
    if (!same) return movement;

    const target = num(desiredByMethod[movement?.method]);
    const sameMethod = related.filter(
      (r) => r?.method === movement?.method
    );
    const first = sameMethod[0];

    if (
      first &&
      String(first.id) === String(movement.id)
    ) {
      return {
        ...movement,
        amount: Number(target.toFixed(2)),
      };
    }

    return {
      ...movement,
      amount: 0,
    };
  });

  const accounts = readArray(ACCOUNT_STORAGE_KEY);
  const updatedAccounts = accounts.map((account) => {
    let adjustment = 0;

    related
      .filter(
        (m) => String(m?.accountId) === String(account?.id)
      )
      .forEach((movement) => {
        const oldAmount = num(movement?.amount);
        const target =
          movement?.method === "Nakit"
            ? newCash
            : movement?.method === "Kredi Kartı"
            ? newCard
            : oldAmount;
        adjustment += target - oldAmount;
      });

    return Math.abs(adjustment) < 0.005
      ? account
      : {
          ...account,
          balance: num(account?.balance) + adjustment,
        };
  });

  writeArray(FINANCE_MOVEMENT_STORAGE_KEY, updatedFinance);
  writeArray(ACCOUNT_STORAGE_KEY, updatedAccounts);

  return {
    newCash,
    newCard,
    newCredit,
    newTotal,
    oldTotal,
  };
}

function updateCustomerMovementForSale(sale, newCredit) {
  const saleNumber = String(sale?.number || sale?.id || "");
  const movements = readArray(CUSTOMER_MOVEMENT_STORAGE_KEY);

  const updated = movements.map((movement) => {
    const same =
      String(movement?.source) === "quick-sale" &&
      String(movement?.sourceId || movement?.document || "") ===
        saleNumber;

    return same
      ? {
          ...movement,
          debt: Number(newCredit.toFixed(2)),
          credit: 0,
        }
      : movement;
  });

  writeArray(CUSTOMER_MOVEMENT_STORAGE_KEY, updated);
  window.dispatchEvent(new Event("ren-customer-movements-updated"));
}

function reverseQuickSaleStock(sale) {
  const saleNumber = String(sale?.number || sale?.id || "");
  const movements = readArray(STOCK_MOVEMENT_STORAGE_KEY);

  const related = movements.filter(
    (m) =>
      String(m?.sourceDocument || m?.documentNo || "") === saleNumber
  );

  related.forEach((movement) => {
    if (!movement?.productId) return;
    const quantity = num(
      movement?.quantity ?? movement?.movement ?? movement?.amount
    );
    if (!quantity) return;

    const products = getProducts() || [];
    const product = products.find(
      (p) => String(p?.id) === String(movement.productId)
    );
    if (!product) return;

    updateProduct(product.id, {
      stock: num(product.stock) - quantity,
      updatedAt: new Date().toISOString(),
    });
  });

  writeArray(
    STOCK_MOVEMENT_STORAGE_KEY,
    movements.filter(
      (m) =>
        String(m?.sourceDocument || m?.documentNo || "") !== saleNumber
    )
  );

  window.dispatchEvent(new Event("ren-stock-updated"));
  window.dispatchEvent(new Event("ren-stock-movements-changed"));
}

export default function QuickSalesReport() {
  const navigate = useNavigate();
  const [sales, setSales] = useState(() => readArray(QUICK_SALE_STORAGE_KEY));
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("Tümü");
  const [editSale, setEditSale] = useState(null);
  const [editTotal, setEditTotal] = useState("");
  const [notice, setNotice] = useState("");

  const reload = () => {
    setSales(readArray(QUICK_SALE_STORAGE_KEY));
  };

  useEffect(() => {
    const events = [
      "ren-quick-sales-updated",
      "ren-cash-bank-updated",
      "ren-customers-updated",
      "ren-products-changed",
      "ren-stock-updated",
    ];
    events.forEach((e) => window.addEventListener(e, reload));
    return () => events.forEach((e) => window.removeEventListener(e, reload));
  }, []);

  const filteredSales = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");

    return sales
      .filter((sale) => {
        const d = dateOf(sale);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;

        if (paymentFilter !== "Tümü") {
          const type = sale?.paymentType;
          if (
            (paymentFilter === "Nakit" && type !== "cash") ||
            (paymentFilter === "Kredi Kartı" && type !== "card") ||
            (paymentFilter === "Veresiye" && type !== "credit") ||
            (paymentFilter === "Parçalı" && type !== "split")
          ) {
            return false;
          }
        }

        if (!q) return true;

        return (
          String(sale?.number || "").toLocaleLowerCase("tr-TR").includes(q) ||
          String(sale?.customerName || "").toLocaleLowerCase("tr-TR").includes(q)
        );
      })
      .sort(
        (a, b) =>
          `${dateOf(b)} ${b.time || ""}`.localeCompare(
            `${dateOf(a)} ${a.time || ""}`
          )
      );
  }, [sales, dateFrom, dateTo, search, paymentFilter]);

  const summary = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let cash = 0;
    let card = 0;
    let credit = 0;

    filteredSales.forEach((sale) => {
      revenue += num(sale?.total);
      cost += saleCost(sale);
      cash += num(sale?.payments?.cash);
      card += num(sale?.payments?.card);
      credit += num(sale?.payments?.credit);
    });

    const profit = revenue - cost;

    return {
      count: filteredSales.length,
      revenue,
      cost,
      profit,
      margin: revenue > 0 && cost > 0 ? (profit / revenue) * 100 : null,
      cash,
      card,
      credit,
    };
  }, [filteredSales]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const todaySales = useMemo(
    () => sales.filter((sale) => dateOf(sale) === todayKey),
    [sales, todayKey]
  );

  const todaySummary = useMemo(() => {
    const revenue = todaySales.reduce((s, sale) => s + num(sale?.total), 0);
    const cost = todaySales.reduce((s, sale) => s + saleCost(sale), 0);
    const profit = revenue - cost;
    return {
      revenue,
      cost,
      profit,
      margin: revenue > 0 && cost > 0 ? (profit / revenue) * 100 : null,
    };
  }, [todaySales]);

  const saveEdit = () => {
    if (!editSale) return;
    const newTotal = num(editTotal);
    if (newTotal <= 0) {
      setNotice("Geçerli bir yeni satış toplamı girin.");
      return;
    }

    const list = readArray(QUICK_SALE_STORAGE_KEY);
    const current = list.find(
      (sale) => String(sale?.id) === String(editSale.id)
    );
    if (!current) {
      setNotice("Satış kaydı bulunamadı.");
      return;
    }

    const finance = adjustSaleFinanceAndAccounts(
      current,
      num(current.total),
      newTotal
    );

    updateCustomerMovementForSale(
      current,
      finance.newCredit
    );

    const updatedSale = {
      ...current,
      originalTotal:
        current.originalTotal ??
        current.automaticTotal ??
        current.total,
      total: Number(newTotal.toFixed(2)),
      manualTotal: Number(newTotal.toFixed(2)),
      payments: {
        cash: finance.newCash,
        card: finance.newCard,
        credit: finance.newCredit,
      },
      updatedAt: new Date().toISOString(),
      editedAt: new Date().toISOString(),
    };

    const updated = list.map((sale) =>
      String(sale?.id) === String(current.id) ? updatedSale : sale
    );

    writeArray(QUICK_SALE_STORAGE_KEY, updated);
    setSales(updated);
    setEditSale(null);
    setEditTotal("");
    setNotice(
      `${current.number} güncellendi. Yeni toplam ${money(newTotal)} TL.`
    );

    window.dispatchEvent(new Event("ren-quick-sales-updated"));
    window.dispatchEvent(new Event("ren-finance-updated"));
    window.dispatchEvent(new Event("ren-cash-bank-updated"));
  };

  const deleteSale = (sale) => {
    const no = sale?.number || sale?.id;
    if (
      !window.confirm(
        `${no} numaralı hızlı satış silinsin mi?\n\nStok, kasa/POS ve varsa cari hareketi geri alınacaktır.`
      )
    ) {
      return;
    }

    const list = readArray(QUICK_SALE_STORAGE_KEY);
    writeArray(
      QUICK_SALE_STORAGE_KEY,
      list.filter((x) => String(x?.id) !== String(sale?.id))
    );

    reverseQuickSaleStock(sale);

    const finance = readArray(FINANCE_MOVEMENT_STORAGE_KEY);
    const relatedFinance = finance.filter(
      (m) =>
        String(m?.source) === "quick-sale" &&
        String(m?.sourceDocument || "") === String(no)
    );

    const accounts = readArray(ACCOUNT_STORAGE_KEY);
    const updatedAccounts = accounts.map((account) => {
      const outgoing = relatedFinance
        .filter(
          (m) => String(m?.accountId) === String(account?.id)
        )
        .reduce((s, m) => s + num(m?.amount), 0);
      return outgoing
        ? { ...account, balance: num(account?.balance) - outgoing }
        : account;
    });

    writeArray(
      FINANCE_MOVEMENT_STORAGE_KEY,
      finance.filter(
        (m) =>
          !(
            String(m?.source) === "quick-sale" &&
            String(m?.sourceDocument || "") === String(no)
          )
      )
    );
    writeArray(ACCOUNT_STORAGE_KEY, updatedAccounts);

    const customerMovements = readArray(CUSTOMER_MOVEMENT_STORAGE_KEY);
    writeArray(
      CUSTOMER_MOVEMENT_STORAGE_KEY,
      customerMovements.filter(
        (m) =>
          !(
            String(m?.source) === "quick-sale" &&
            String(m?.sourceId || m?.document || "") === String(no)
          )
      )
    );

    setSales(
      readArray(QUICK_SALE_STORAGE_KEY)
    );
    setNotice(`${no} numaralı hızlı satış silindi.`);

    [
      "ren-customer-movements-updated",
      "ren-customers-updated",
      "ren-cash-bank-updated",
      "ren-finance-updated",
      "ren-quick-sales-updated",
    ].forEach((eventName) =>
      window.dispatchEvent(new Event(eventName))
    );
  };

  const exportCsv = () => {
    const rows = [
      ["Tarih", "Fiş No", "Müşteri", "Ciro", "Maliyet", "Kâr", "Kâr %"],
      ...filteredSales.map((sale) => [
        dateOf(sale),
        sale?.number || sale?.id || "",
        sale?.customerName || "Müşterisiz",
        num(sale?.total).toFixed(2),
        saleCost(sale).toFixed(2),
        saleProfit(sale).toFixed(2),
        profitRate(sale) == null ? "" : profitRate(sale).toFixed(2),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "REN-Hizli-Satis-Raporu.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="quick-sales-report-page">
      <div className="quick-sales-report-header">
        <div>
          <div className="quick-sales-report-breadcrumb">
            Satış <span>›</span> Hızlı Satış Raporu
          </div>
          <h1>Hızlı Satış Raporu</h1>
          <p>Hızlı satışların ciro, maliyet, kâr ve ödeme dağılımını izleyin.</p>
        </div>

        <div className="quick-sales-report-actions">
          <button type="button" onClick={reload}>
            <MdRefresh /> Yenile
          </button>
          <button type="button" onClick={exportCsv}>
            CSV / Excel
          </button>
          <button type="button" onClick={() => window.print()}>
            Yazdır / PDF
          </button>
        </div>
      </div>

      <section className="quick-sales-report-period">
        <div className="quick-sales-report-date">
          <label>Başlangıç</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="quick-sales-report-date">
          <label>Bitiş</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="quick-sales-report-search">
          <MdSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fiş no veya müşteri ara..."
          />
        </div>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option>Tümü</option>
          <option>Nakit</option>
          <option>Kredi Kartı</option>
          <option>Veresiye</option>
          <option>Parçalı</option>
        </select>
      </section>

      <section className="quick-sales-report-kpis">
        <div className="qs-report-kpi">
          <span><MdPointOfSale /> TOPLAM HIZLI SATIŞ</span>
          <strong>{summary.count}</strong>
          <small>fiş</small>
        </div>
        <div className="qs-report-kpi">
          <span><MdPayments /> CİRO</span>
          <strong>₺{money(summary.revenue)}</strong>
          <small>seçili dönem</small>
        </div>
        <div className="qs-report-kpi">
          <span> MALİYET</span>
          <strong>₺{money(summary.cost)}</strong>
          <small>kayıtlı maliyet</small>
        </div>
        <div className="qs-report-kpi profit">
          <span><MdTrendingUp /> BRÜT KÂR</span>
          <strong>₺{money(summary.profit)}</strong>
          <small>
            {summary.margin == null ? "Maliyet verisi eksik" : `%${summary.margin.toFixed(2)}`}
          </small>
        </div>
      </section>

      <section className="quick-sales-report-today">
        <div>
          <span>BUGÜNÜN HIZLI SATIŞI</span>
          <strong>₺{money(todaySummary.revenue)}</strong>
        </div>
        <div>
          <span>BUGÜN MALİYET</span>
          <strong>₺{money(todaySummary.cost)}</strong>
        </div>
        <div className="positive">
          <span>BUGÜN KÂR</span>
          <strong>₺{money(todaySummary.profit)}</strong>
        </div>
        <div className="positive">
          <span>BUGÜN KÂR ORANI</span>
          <strong>
            {todaySummary.margin == null ? "—" : `%${todaySummary.margin.toFixed(2)}`}
          </strong>
        </div>
      </section>

      <section className="quick-sales-report-payment">
        <div>
          <span>Nakit</span>
          <strong>₺{money(summary.cash)}</strong>
        </div>
        <div>
          <span>Kredi Kartı</span>
          <strong>₺{money(summary.card)}</strong>
        </div>
        <div>
          <span>Veresiye</span>
          <strong>₺{money(summary.credit)}</strong>
        </div>
      </section>

      <section className="quick-sales-report-table-card">
        <div className="quick-sales-report-table-head">
          <div>
            <h2>Hızlı Satışlar</h2>
            <span>{filteredSales.length} kayıt</span>
          </div>
        </div>

        <div className="quick-sales-report-table-wrap">
          <table>
            <thead>
              <tr>
                <th>TARİH</th>
                <th>FİŞ NO</th>
                <th>MÜŞTERİ</th>
                <th>ÖDEME</th>
                <th>CİRO</th>
                <th>MALİYET</th>
                <th>KÂR</th>
                <th>KÂR %</th>
                <th>İŞLEM</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="quick-sales-report-empty">
                    Henüz hızlı satış kaydı bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const margin = profitRate(sale);
                  return (
                    <tr key={sale.id}>
                      <td>{dateOf(sale)}</td>
                      <td><strong>{sale.number || sale.id}</strong></td>
                      <td>{sale.customerName || "Müşterisiz"}</td>
                      <td>{sale.paymentType === "cash" ? "Nakit" : sale.paymentType === "card" ? "Kart" : sale.paymentType === "credit" ? "Veresiye" : "Parçalı"}</td>
                      <td>₺{money(sale.total)}</td>
                      <td>₺{money(saleCost(sale))}</td>
                      <td className={saleProfit(sale) >= 0 ? "profit-text" : "loss-text"}>₺{money(saleProfit(sale))}</td>
                      <td className={saleProfit(sale) >= 0 ? "profit-text" : "loss-text"}>{margin == null ? "—" : `%${margin.toFixed(2)}`}</td>
                      <td>
                        <div className="quick-sales-report-row-actions">
                          <button type="button" onClick={() => {
                            setEditSale(sale);
                            setEditTotal(String(num(sale.total)));
                          }}>
                            <MdEdit /> Düzenle
                          </button>
                          <button type="button" className="danger" onClick={() => deleteSale(sale)}>
                            <MdDelete /> Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {notice && (
        <div className="quick-sales-report-notice">
          {notice}
          <button type="button" onClick={() => setNotice("")}>×</button>
        </div>
      )}

      {editSale && (
        <div className="quick-sales-report-overlay">
          <div className="quick-sales-report-modal">
            <div className="quick-sales-report-modal-head">
              <div>
                <span>Hızlı Satış Düzenle</span>
                <strong>{editSale.number}</strong>
              </div>
              <button type="button" onClick={() => setEditSale(null)}>×</button>
            </div>
            <div className="quick-sales-report-modal-body">
              <div className="edit-info">
                <span>Müşteri</span>
                <strong>{editSale.customerName || "Müşterisiz"}</strong>
              </div>
              <div className="edit-info">
                <span>Mevcut Toplam</span>
                <strong>₺{money(editSale.total)}</strong>
              </div>
              <label>
                Yeni Satış Toplamı
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                />
              </label>
              <p>
                Toplam değiştiğinde ödeme dağılımı ve varsa veresiye tutarı da yeni toplamla uyarlanır.
                Ürün stok miktarı değiştirilmez.
              </p>
            </div>
            <div className="quick-sales-report-modal-foot">
              <button type="button" onClick={() => setEditSale(null)}>VAZGEÇ</button>
              <button type="button" className="save" onClick={saveEdit}>KAYDET</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
