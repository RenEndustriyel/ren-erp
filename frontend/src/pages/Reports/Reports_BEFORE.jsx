import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  MdAssessment,
  MdBarChart,
  MdBusiness,
  MdCalendarMonth,
  MdCheckCircle,
  MdDescription,
  MdDownload,
  MdInventory2,
  MdLocalAtm,
  MdPayments,
  MdPointOfSale,
  MdRefresh,
  MdShoppingCart,
  MdStorefront,
  MdTableChart,
  MdTrendingUp,
  MdAccountBalance,
} from "react-icons/md";

import { getInvoices } from "../../lib/invoiceStore";
import { getCustomers } from "../../lib/customerStore";
import { getProducts } from "../../lib/stockStore";
import "./Reports.css";

const QUICK_SALES_KEY = "ren_erp_quick_sales";
const ACCOUNTS_KEY = "ren-erp-cash-bank-accounts";
const FINANCE_MOVEMENTS_KEY = "ren-erp-cash-bank-movements";
const CUSTOMER_MOVEMENTS_KEY = "ren-erp-customer-movements";

const REPORTS = [
  { key: "general", title: "Genel Raporlar", desc: "İşletmenizin tamamını tek bakışta analiz edin.", icon: MdAssessment },
  { key: "sales", title: "Satış Raporları", desc: "Satış, ciro, ürün ve müşteri performansını inceleyin.", icon: MdTrendingUp },
  { key: "purchases", title: "Alış Raporları", desc: "Alışlarınızı, tedarikçilerinizi ve maliyetleri izleyin.", icon: MdShoppingCart },
  { key: "customers", title: "Cari Raporları", desc: "Alacak, borç, tahsilat ve bakiye görünümünü yönetin.", icon: MdBusiness },
  { key: "stock", title: "Stok Raporları", desc: "Stok değeri, kritik ürünler ve hareketleri takip edin.", icon: MdInventory2 },
  { key: "cash", title: "Kasa / Banka Raporları", desc: "Kasa, banka, POS ve nakit hareketlerini analiz edin.", icon: MdAccountBalance },
  { key: "quick", title: "Hızlı Satış Raporu", desc: "Hızlı satış fişlerini ve ödeme dağılımını inceleyin.", icon: MdPointOfSale },
  { key: "vat", title: "KDV Raporu", desc: "Satış ve alış KDV matrahlarını oran bazında görün.", icon: MdPayments },
];

function num(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let text = String(value).trim().replace(/\s/g, "");
  if (text.includes(",") && text.includes(".")) text = text.replace(/\./g, "").replace(",", ".");
  else text = text.replace(",", ".");
  const valueNumber = Number(text);
  return Number.isFinite(valueNumber) ? valueNumber : 0;
}

function money(value) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(num(value));
}

function dateOnly(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayDate(value) {
  const date = dateOnly(value);
  if (!date) return "-";
  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
}

function today() {
  return dateOnly(new Date());
}

function monthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function readArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function invoiceType(invoice) {
  const value = String(invoice?.type || "").toLowerCase().trim();
  if (["purchase", "purchases", "alış", "alis", "buy"].includes(value)) return "purchase";
  if (["return", "returns", "iade"].includes(value)) return "return";
  return "sales";
}

function invoiceTitle(type) {
  if (type === "purchase") return "Alış";
  if (type === "return") return "İade";
  return "Satış";
}

function customerName(customer) {
  return customer?.name || customer?.title || customer?.companyName || customer?.unvan || "-";
}

function productCost(product) {
  return num(product?.purchaseNet ?? product?.purchasePrice ?? product?.buyPrice ?? product?.cost ?? 0);
}

function lineMetrics(item, fallbackVat = 20) {
  const quantity = num(item?.quantity);
  const unitPrice = num(item?.unitPrice ?? item?.price);
  const gross = num(item?.lineTotal ?? item?.lineGross ?? item?.total);
  const vatRate = num(item?.vatRate ?? item?.vat ?? fallbackVat) || fallbackVat;
  const grossTotal = gross || quantity * unitPrice;
  const vat = grossTotal - grossTotal / (1 + vatRate / 100);
  return { quantity, unitPrice, grossTotal, vatRate, vat, net: grossTotal - vat };
}

function invoiceMetrics(invoice) {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  if (!items.length) {
    const total = num(invoice?.total);
    const vat = num(invoice?.vat ?? invoice?.totalVat ?? 0);
    return { net: total - vat, vat, gross: total, rows: [], vatByRate: {} };
  }
  const rows = items.map((item) => ({ item, ...lineMetrics(item) }));
  const net = rows.reduce((sum, row) => sum + row.net, 0);
  const vat = rows.reduce((sum, row) => sum + row.vat, 0);
  const gross = rows.reduce((sum, row) => sum + row.grossTotal, 0);
  const vatByRate = {};
  rows.forEach((row) => {
    const key = String(row.vatRate);
    if (!vatByRate[key]) vatByRate[key] = { rate: row.vatRate, net: 0, vat: 0, gross: 0 };
    vatByRate[key].net += row.net;
    vatByRate[key].vat += row.vat;
    vatByRate[key].gross += row.grossTotal;
  });
  return { net, vat, gross, rows, vatByRate };
}

function quickSaleMetrics(sale) {
  const rows = Array.isArray(sale?.items) ? sale.items : [];
  const gross = num(sale?.total) || rows.reduce((sum, item) => sum + num(item?.lineTotal), 0);
  const vat = num(sale?.totalVat) || rows.reduce((sum, item) => sum + lineMetrics(item).vat, 0);
  return {
    gross,
    vat,
    net: gross - vat,
    quantity: rows.reduce((sum, item) => sum + num(item?.quantity), 0),
  };
}

function filteredByDate(items, from, to, getter = (x) => x?.date || x?.createdAt) {
  return items.filter((item) => {
    const date = dateOnly(getter(item));
    if (!date) return false;
    return (!from || date >= from) && (!to || date <= to);
  });
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(";"), ...rows.map((row) => headers.map((h) => escape(row[h])).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="report-stat-card">
      <div className="report-stat-icon"><Icon /></div>
      <div className="report-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
      </div>
    </div>
  );
}

function EmptyState({ text = "Bu tarih aralığında kayıt bulunamadı." }) {
  return <div className="report-empty"><MdTableChart /><strong>{text}</strong><span>Tarih filtresini genişletmeyi veya veri oluşturmayı deneyin.</span></div>;
}

export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const pathView = {
    "/reports/general": "general",
    "/reports/sales": "sales",
    "/reports/purchases": "purchases",
    "/reports/customers": "customers",
    "/reports/stock": "stock",
    "/reports/cash": "cash",
    "/reports/quick-sales": "quick",
    "/reports/vat": "vat",
  }[location.pathname] || "";
  const view = pathView || searchParams.get("view") || "home";
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo] = useState(today());
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [quickSales, setQuickSales] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [financeMovements, setFinanceMovements] = useState([]);
  const [customerMovements, setCustomerMovements] = useState([]);

  const refresh = () => {
    setInvoices(getInvoices() || []);
    setCustomers(getCustomers() || []);
    setProducts(getProducts() || []);
    setQuickSales(readArray(QUICK_SALES_KEY));
    setAccounts(readArray(ACCOUNTS_KEY));
    setFinanceMovements(readArray(FINANCE_MOVEMENTS_KEY));
    setCustomerMovements(readArray(CUSTOMER_MOVEMENTS_KEY));
  };

  useEffect(() => {
    refresh();
    const events = [
      "ren-invoices-updated", "ren-quick-sales-updated", "ren-products-changed", "ren-stock-updated",
      "ren-cash-bank-updated", "ren-customers-updated", "ren-customer-movements-updated", "storage",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => events.forEach((eventName) => window.removeEventListener(eventName, refresh));
  }, []);

  const periodInvoices = useMemo(() => filteredByDate(invoices, dateFrom, dateTo), [invoices, dateFrom, dateTo]);
  const periodQuick = useMemo(() => filteredByDate(quickSales, dateFrom, dateTo), [quickSales, dateFrom, dateTo]);
  const salesInvoices = periodInvoices.filter((x) => invoiceType(x) === "sales");
  const purchaseInvoices = periodInvoices.filter((x) => invoiceType(x) === "purchase");
  const returnInvoices = periodInvoices.filter((x) => invoiceType(x) === "return");

  const salesTotal = salesInvoices.reduce((sum, x) => sum + invoiceMetrics(x).gross, 0) + periodQuick.reduce((sum, x) => sum + quickSaleMetrics(x).gross, 0);
  const salesVat = salesInvoices.reduce((sum, x) => sum + invoiceMetrics(x).vat, 0) + periodQuick.reduce((sum, x) => sum + quickSaleMetrics(x).vat, 0);
  const purchaseTotal = purchaseInvoices.reduce((sum, x) => sum + invoiceMetrics(x).gross, 0);
  const purchaseVat = purchaseInvoices.reduce((sum, x) => sum + invoiceMetrics(x).vat, 0);
  const returnTotal = returnInvoices.reduce((sum, x) => sum + invoiceMetrics(x).gross, 0);
  const returnVat = returnInvoices.reduce((sum, x) => sum + invoiceMetrics(x).vat, 0);
  const netSales = salesTotal - returnTotal;
  const netSalesVat = salesVat - returnVat;
  const cost = salesInvoices.reduce((sum, invoice) => {
    return sum + invoiceMetrics(invoice).rows.reduce((rowSum, row) => {
      const product = products.find((p) => String(p.id) === String(row.item?.productId));
      return rowSum + row.quantity * productCost(product);
    }, 0);
  }, 0);
  const quickCost = periodQuick.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => {
    const product = products.find((p) => String(p.id) === String(item?.productId));
    return itemSum + num(item?.quantity) * productCost(product);
  }, 0), 0);
  const grossProfit = netSales - cost - quickCost;
  const liquidity = accounts.filter((x) => ["Kasa", "Banka", "POS", "cash", "bank"].includes(x?.type)).reduce((sum, x) => sum + num(x?.balance), 0);
  const stockValue = products.reduce((sum, p) => sum + num(p?.stock) * productCost(p), 0);
  const criticalStock = products.filter((p) => num(p?.stock) <= num(p?.criticalStock ?? p?.minStock ?? 0)).length;
  const financeIncome = filteredByDate(financeMovements, dateFrom, dateTo).filter((x) => String(x?.direction) === "Giriş").reduce((sum, x) => sum + num(x?.amount), 0);
  const financeExpense = filteredByDate(financeMovements, dateFrom, dateTo).filter((x) => String(x?.direction) === "Çıkış").reduce((sum, x) => sum + num(x?.amount), 0);

  const reportTitle = REPORTS.find((x) => x.key === view)?.title || "Raporlar";

  const openReport = (key) => navigate(`/reports/${key === "quick" ? "quick-sales" : key}`);

  const clearDate = () => {
    setDateFrom(monthStart());
    setDateTo(today());
  };

  const periodSalesRows = useMemo(() => {
    const invoiceRows = salesInvoices.map((invoice) => ({
      date: invoice.date || invoice.createdAt,
      no: invoice.number || invoice.invoiceNo || invoice.id,
      customer: invoice.customerName || invoice.customer?.name || customerName(customers.find((c) => String(c.id) === String(invoice.customerId))),
      type: "Satış Faturası",
      source: "Fatura",
      total: invoiceMetrics(invoice).gross,
    }));
    const quickRows = periodQuick.map((sale) => ({
      date: sale.date || sale.createdAt,
      no: sale.number || sale.saleNumber || sale.id,
      customer: sale.customerName || "Peşin / Müşterisiz",
      type: "Hızlı Satış",
      source: "Hızlı Satış",
      total: quickSaleMetrics(sale).gross,
    }));
    return [...invoiceRows, ...quickRows].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [salesInvoices, periodQuick, customers]);

  const periodPurchaseRows = useMemo(() => purchaseInvoices.map((invoice) => ({
    date: invoice.date || invoice.createdAt,
    no: invoice.number || invoice.invoiceNo || invoice.id,
    supplier: invoice.customerName || invoice.customer?.name || customerName(customers.find((c) => String(c.id) === String(invoice.customerId))),
    total: invoiceMetrics(invoice).gross,
    vat: invoiceMetrics(invoice).vat,
  })).sort((a, b) => String(b.date).localeCompare(String(a.date))), [purchaseInvoices, customers]);

  const vatRows = useMemo(() => {
    const map = {};
    const add = (rate, netValue, vatValue, grossValue, saleValue, purchaseValue) => {
      const key = String(rate);
      if (!map[key]) map[key] = { rate: num(rate), net: 0, vat: 0, gross: 0, salesNet: 0, purchasesNet: 0, salesVat: 0, purchasesVat: 0 };
      map[key].net += netValue;
      map[key].vat += vatValue;
      map[key].gross += grossValue;
      map[key].salesNet += saleValue || 0;
      map[key].purchasesNet += purchaseValue || 0;
      if (saleValue) map[key].salesVat += vatValue;
      if (purchaseValue) map[key].purchasesVat += vatValue;
    };
    salesInvoices.forEach((invoice) => Object.values(invoiceMetrics(invoice).vatByRate).forEach((x) => add(x.rate, x.net, x.vat, x.gross, x.net, 0)));
    periodQuick.forEach((sale) => sale.items.forEach((item) => { const x = lineMetrics(item); add(x.vatRate, x.net, x.vat, x.grossTotal, x.net, 0); }));
    purchaseInvoices.forEach((invoice) => Object.values(invoiceMetrics(invoice).vatByRate).forEach((x) => add(x.rate, x.net, x.vat, x.gross, 0, x.net)));
    return Object.values(map).sort((a, b) => a.rate - b.rate);
  }, [salesInvoices, purchaseInvoices, periodQuick]);

  const customersReport = useMemo(() => customers.map((customer) => {
    const rows = customerMovements.filter((m) => String(m?.customerId) === String(customer?.id));
    const movementDebt = rows.reduce((sum, m) => sum + num(m?.debt), 0);
    const movementCredit = rows.reduce((sum, m) => sum + num(m?.credit), 0);
    const invoiceOpen = invoices.filter((invoice) => String(invoice?.customerId) === String(customer?.id)).reduce((sum, invoice) => {
      const type = invoiceType(invoice);
      if (type !== "sales") return sum;
      return sum + Math.max(0, num(invoice.total) - num(invoice.paidAmount));
    }, 0);
    return { id: customer.id, name: customerName(customer), code: customer.code || "-", debt: movementDebt, credit: movementCredit, receivable: Math.max(invoiceOpen, num(customer.balance) > 0 ? num(customer.balance) : 0), balance: num(customer.balance) };
  }).sort((a, b) => b.receivable - a.receivable), [customers, customerMovements, invoices]);

  const cashRows = filteredByDate(financeMovements, dateFrom, dateTo).sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
  const quickRows = [...periodQuick].sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date)));

  const exportCurrent = () => {
    if (view === "sales") return downloadCsv("ren-satis-raporu.csv", periodSalesRows.map((x) => ({ Tarih: displayDate(x.date), Belge: x.no, Cari: x.customer, Tip: x.type, Kaynak: x.source, Tutar: x.total.toFixed(2) })));
    if (view === "purchases") return downloadCsv("ren-alis-raporu.csv", periodPurchaseRows.map((x) => ({ Tarih: displayDate(x.date), Belge: x.no, Tedarikci: x.supplier, Tutar: x.total.toFixed(2), KDV: x.vat.toFixed(2) })));
    if (view === "quick") return downloadCsv("ren-hizli-satis-raporu.csv", quickRows.map((x) => ({ Tarih: displayDate(x.date), Saat: x.time, Fis: x.number, Cari: x.customerName || "-", Tutar: num(x.total).toFixed(2), Nakit: num(x.payments?.cash).toFixed(2), Kart: num(x.payments?.card).toFixed(2), Veresiye: num(x.payments?.credit).toFixed(2) })));
    if (view === "customers") return downloadCsv("ren-cari-raporu.csv", customersReport.map((x) => ({ Kod: x.code, Cari: x.name, HareketBorcu: x.debt.toFixed(2), HareketAlacagi: x.credit.toFixed(2), Alacak: x.receivable.toFixed(2) })));
    if (view === "cash") return downloadCsv("ren-kasa-banka-raporu.csv", cashRows.map((x) => ({ Tarih: displayDate(x.date || x.createdAt), Hesap: x.accountName, Yon: x.direction, Tutar: num(x.amount).toFixed(2), Yontem: x.method, Aciklama: x.description })));
    if (view === "stock") return downloadCsv("ren-stok-raporu.csv", products.map((x) => ({ Kod: x.code || "-", Urun: x.name || "-", Stok: num(x.stock).toFixed(2), BirimMaliyet: productCost(x).toFixed(2), StokDegeri: (num(x.stock) * productCost(x)).toFixed(2) })));
    if (view === "vat") return downloadCsv("ren-kdv-raporu.csv", vatRows.map((x) => ({ KDV: `%${x.rate}`, SatisMatrahi: x.salesNet.toFixed(2), HesaplananKDV: x.salesVat.toFixed(2), AlisMatrahi: x.purchasesNet.toFixed(2), IndirilecekKDV: x.purchasesVat.toFixed(2) })));
    downloadCsv("ren-genel-rapor.csv", [{ TarihAraligi: `${displayDate(dateFrom)} - ${displayDate(dateTo)}`, Satis: salesTotal.toFixed(2), Alis: purchaseTotal.toFixed(2), NetSatis: netSales.toFixed(2), BrutKar: grossProfit.toFixed(2), Likidite: liquidity.toFixed(2), StokDegeri: stockValue.toFixed(2) }]);
  };

  return (
    <div className="reports-page">
      <div className="reports-container">
        <header className="reports-hero">
          <div>
            <div className="reports-breadcrumb"><span>REN ERP</span><b>/</b><strong>{reportTitle}</strong></div>
            <h1>{view === "home" ? "Raporlar" : reportTitle}</h1>
            <p>{view === "home" ? "İşletmenizin satış, alış, cari, stok, nakit ve KDV verilerini tek merkezden yönetin." : "Tarih aralığını seçin, raporu inceleyin ve gerektiğinde dışa aktarın."}</p>
          </div>
          <div className="reports-actions">
            {view !== "home" ? <button type="button" className="report-action secondary" onClick={() => navigate("/reports")}>Rapor Merkezi</button> : null}
            <button type="button" className="report-action secondary" onClick={refresh}><MdRefresh /> Yenile</button>
            {view !== "home" ? <button type="button" className="report-action" onClick={exportCurrent}><MdDownload /> Excel / CSV</button> : null}
            {view !== "home" ? <button type="button" className="report-action" onClick={() => window.print()}><MdDescription /> Yazdır / PDF</button> : null}
          </div>
        </header>

        {view === "home" ? (
          <>
            <div className="reports-period-summary">
              <div><span>Bu ay satış</span><strong>{money(salesTotal)}</strong></div>
              <div><span>Bu ay alış</span><strong>{money(purchaseTotal)}</strong></div>
              <div><span>Brüt kâr</span><strong>{money(grossProfit)}</strong></div>
              <div><span>Likidite</span><strong>{money(liquidity)}</strong></div>
            </div>
            <div className="report-grid">
              {REPORTS.map(({ key, title, desc, icon: Icon }) => (
                <button key={key} type="button" className="report-tile" onClick={() => openReport(key)}>
                  <div className="report-tile-icon"><Icon /></div>
                  <div className="report-tile-copy"><strong>{title}</strong><span>{desc}</span></div>
                  <span className="report-tile-arrow">›</span>
                </button>
              ))}
            </div>
            <div className="reports-note"><MdCheckCircle /><div><strong>Tek rapor mantığı</strong><span>Fatura, Hızlı Satış, stok, cari ve kasa verileri aynı merkezde okunur. KDV raporu da aynı tarih filtresini kullanır.</span></div></div>
          </>
        ) : (
          <>
            <section className="report-toolbar">
              <div className="report-date-group"><MdCalendarMonth /><div><label>Başlangıç</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div><div><label>Bitiş</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div><button type="button" onClick={clearDate}>Bu Ay</button></div>
            </section>

            {view === "general" && (
              <>
                <div className="report-stat-grid">
                  <StatCard label="Net Satış" value={money(netSales)} hint={`${salesInvoices.length + periodQuick.length} satış kaydı`} icon={MdTrendingUp} />
                  <StatCard label="Toplam Alış" value={money(purchaseTotal)} hint={`${purchaseInvoices.length} alış faturası`} icon={MdShoppingCart} />
                  <StatCard label="Brüt Kâr" value={money(grossProfit)} hint={`${netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : "0.0"}% marj`} icon={MdBarChart} />
                  <StatCard label="Kasa / Banka" value={money(liquidity)} hint="Anlık likit varlık" icon={MdAccountBalance} />
                  <StatCard label="Stok Değeri" value={money(stockValue)} hint={`${products.length} ürün / ${criticalStock} kritik`} icon={MdInventory2} />
                  <StatCard label="Net Finans Akışı" value={money(financeIncome - financeExpense)} hint={`${money(financeIncome)} giriş / ${money(financeExpense)} çıkış`} icon={MdLocalAtm} />
                </div>
                <div className="report-two-column">
                  <div className="report-panel"><div className="report-panel-head"><div><strong>Satış / Alış Karşılaştırması</strong><span>Seçili tarih aralığı</span></div></div><div className="comparison-bars"><div><span>Satış</span><b style={{ width: `${Math.min(100, (salesTotal / Math.max(salesTotal, purchaseTotal, 1)) * 100)}%` }}></b><strong>{money(salesTotal)}</strong></div><div><span>Alış</span><b style={{ width: `${Math.min(100, (purchaseTotal / Math.max(salesTotal, purchaseTotal, 1)) * 100)}%` }}></b><strong>{money(purchaseTotal)}</strong></div></div></div>
                  <div className="report-panel"><div className="report-panel-head"><div><strong>Finans Akışı</strong><span>Seçili tarih aralığı</span></div></div><div className="mini-kpi-list"><div><span>Giriş</span><strong>{money(financeIncome)}</strong></div><div><span>Çıkış</span><strong>{money(financeExpense)}</strong></div><div><span>Net</span><strong>{money(financeIncome - financeExpense)}</strong></div></div></div>
                </div>
              </>
            )}

            {view === "sales" && (
              <>
                <div className="report-stat-grid compact"><StatCard label="Toplam Satış" value={money(salesTotal)} icon={MdTrendingUp} /><StatCard label="Net Satış" value={money(netSales)} icon={MdPointOfSale} /><StatCard label="Satış KDV" value={money(netSalesVat)} icon={MdPayments} /><StatCard label="Kayıt" value={`${periodSalesRows.length}`} hint="Fatura + hızlı satış" icon={MdDescription} /></div>
                <div className="report-panel"><ReportTable headers={["Tarih", "Belge", "Cari", "Tip", "Kaynak", "Tutar"]} rows={periodSalesRows} renderRow={(row) => <><td>{displayDate(row.date)}</td><td className="mono">{row.no}</td><td>{row.customer}</td><td><span className="pill">{row.type}</span></td><td>{row.source}</td><td className="amount">{money(row.total)}</td></>} empty="Satış kaydı bulunamadı." /></div>
              </>
            )}

            {view === "purchases" && (
              <>
                <div className="report-stat-grid compact"><StatCard label="Toplam Alış" value={money(purchaseTotal)} icon={MdShoppingCart} /><StatCard label="Alış KDV" value={money(purchaseVat)} icon={MdPayments} /><StatCard label="İade" value={money(returnTotal)} icon={MdRefresh} /><StatCard label="Fatura Sayısı" value={`${purchaseInvoices.length}`} icon={MdDescription} /></div>
                <div className="report-panel"><ReportTable headers={["Tarih", "Belge", "Tedarikçi", "Tutar", "KDV"]} rows={periodPurchaseRows} renderRow={(row) => <><td>{displayDate(row.date)}</td><td className="mono">{row.no}</td><td>{row.supplier}</td><td className="amount">{money(row.total)}</td><td>{money(row.vat)}</td></>} empty="Alış kaydı bulunamadı." /></div>
              </>
            )}

            {view === "customers" && (
              <>
                <div className="report-stat-grid compact"><StatCard label="Cari Sayısı" value={`${customers.length}`} icon={MdBusiness} /><StatCard label="Toplam Alacak" value={money(customersReport.reduce((s, x) => s + x.receivable, 0))} icon={MdTrendingUp} /><StatCard label="Bakiye Pozitif Cari" value={`${customersReport.filter((x) => x.receivable > 0).length}`} icon={MdPayments} /><StatCard label="Hareket Sayısı" value={`${customerMovements.length}`} icon={MdTableChart} /></div>
                <div className="report-panel"><ReportTable headers={["Kod", "Cari", "Hareket Borcu", "Hareket Alacağı", "Alacak"]} rows={customersReport} renderRow={(row) => <><td className="mono">{row.code}</td><td><button type="button" className="table-link" onClick={() => navigate(`/customers/detail?id=${row.id}`)}>{row.name}</button></td><td>{money(row.debt)}</td><td>{money(row.credit)}</td><td className="amount">{money(row.receivable)}</td></>} empty="Cari kaydı bulunamadı." /></div>
              </>
            )}

            {view === "stock" && (
              <>
                <div className="report-stat-grid compact"><StatCard label="Stok Değeri" value={money(stockValue)} icon={MdInventory2} /><StatCard label="Ürün Sayısı" value={`${products.length}`} icon={MdStorefront} /><StatCard label="Kritik Stok" value={`${criticalStock}`} hint="Minimum stok altında" icon={MdCheckCircle} /><StatCard label="Hareketsiz / Düşük" value={`${products.filter((p) => num(p.stock) === 0).length}`} icon={MdBarChart} /></div>
                <div className="report-panel"><ReportTable headers={["Kod", "Ürün", "Stok", "Birim Maliyet", "Stok Değeri"]} rows={products} renderRow={(row) => <><td className="mono">{row.code || "-"}</td><td>{row.name || "-"}</td><td>{num(row.stock).toLocaleString("tr-TR")}</td><td>{money(productCost(row))}</td><td className="amount">{money(num(row.stock) * productCost(row))}</td></>} empty="Ürün kaydı bulunamadı." /></div>
              </>
            )}

            {view === "cash" && (
              <>
                <div className="report-stat-grid compact"><StatCard label="Likit Varlık" value={money(liquidity)} icon={MdAccountBalance} /><StatCard label="Giriş" value={money(financeIncome)} icon={MdTrendingUp} /><StatCard label="Çıkış" value={money(financeExpense)} icon={MdPayments} /><StatCard label="Net Akış" value={money(financeIncome - financeExpense)} icon={MdLocalAtm} /></div>
                <div className="report-panel"><ReportTable headers={["Tarih", "Hesap", "Yön", "Tutar", "Yöntem", "Açıklama"]} rows={cashRows} renderRow={(row) => <><td>{displayDate(row.date || row.createdAt)}</td><td>{row.accountName || "-"}</td><td><span className={`pill ${row.direction === "Giriş" ? "success" : "danger"}`}>{row.direction}</span></td><td className="amount">{money(row.amount)}</td><td>{row.method || "-"}</td><td>{row.description || "-"}</td></>} empty="Finans hareketi bulunamadı." /></div>
              </>
            )}

            {view === "quick" && (
              <>
                <div className="report-stat-grid compact"><StatCard label="Hızlı Satış" value={money(periodQuick.reduce((s, x) => s + num(x.total), 0))} icon={MdPointOfSale} /><StatCard label="İşlem Sayısı" value={`${periodQuick.length}`} icon={MdReceiptIcon} /><StatCard label="Ortalama Sepet" value={money(periodQuick.length ? periodQuick.reduce((s, x) => s + num(x.total), 0) / periodQuick.length : 0)} icon={MdBarChart} /><StatCard label="Veresiye" value={money(periodQuick.reduce((s, x) => s + num(x.payments?.credit), 0))} icon={MdPayments} /></div>
                <div className="report-panel"><ReportTable headers={["Tarih", "Saat", "Fiş No", "Cari", "Ürün", "Toplam", "Nakit", "Kart", "Veresiye"]} rows={quickRows} renderRow={(row) => <><td>{displayDate(row.date)}</td><td>{row.time || "-"}</td><td className="mono">{row.number || row.id}</td><td>{row.customerName || "Peşin / Müşterisiz"}</td><td>{Array.isArray(row.items) ? row.items.reduce((s, i) => s + num(i.quantity), 0).toLocaleString("tr-TR") : 0}</td><td className="amount">{money(row.total)}</td><td>{money(row.payments?.cash)}</td><td>{money(row.payments?.card)}</td><td>{money(row.payments?.credit)}</td></>} empty="Hızlı satış kaydı bulunamadı." /></div>
              </>
            )}

            {view === "vat" && (
              <>
                <div className="report-stat-grid compact"><StatCard label="Hesaplanan KDV" value={money(netSalesVat)} icon={MdPayments} /><StatCard label="İndirilecek KDV" value={money(purchaseVat)} icon={MdShoppingCart} /><StatCard label="Net KDV" value={money(netSalesVat - purchaseVat)} icon={MdAssessment} /><StatCard label="Toplam Matrah" value={money(netSales - netSalesVat + purchaseTotal - purchaseVat)} icon={MdTableChart} /></div>
                <div className="report-panel"><div className="report-panel-head"><div><strong>KDV Oran Dağılımı</strong><span>Satış ve alış matrahları aynı tabloda</span></div></div><table className="report-table"><thead><tr><th>KDV</th><th>Satış Matrahı</th><th>Hesaplanan KDV</th><th>Alış Matrahı</th><th>İndirilecek KDV</th><th>Net KDV</th></tr></thead><tbody>{vatRows.length ? vatRows.map((row) => <tr key={row.rate}><td><span className="vat-rate">%{row.rate}</span></td><td>{money(row.salesNet)}</td><td>{money(row.salesVat)}</td><td>{money(row.purchasesNet)}</td><td>{money(row.purchasesVat)}</td><td className="amount">{money(row.salesVat - row.purchasesVat)}</td></tr>) : <tr><td colSpan="6"><EmptyState /></td></tr>}</tbody></table></div>
                <div className="report-panel vat-summary"><div><span>Hesaplanan KDV</span><strong>{money(netSalesVat)}</strong></div><div><span>İndirilecek KDV</span><strong>{money(purchaseVat)}</strong></div><div className={netSalesVat - purchaseVat >= 0 ? "highlight" : "highlight success"}><span>{netSalesVat - purchaseVat >= 0 ? "Ödenecek KDV" : "Devreden KDV"}</span><strong>{money(Math.abs(netSalesVat - purchaseVat))}</strong></div></div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MdReceiptIcon(props) {
  return <MdDescription {...props} />;
}

function ReportTable({ headers, rows, renderRow, empty }) {
  return (
    <table className="report-table">
      <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
      <tbody>
        {rows.length ? rows.map((row, index) => <tr key={row.id || row.no || `${index}`}>{renderRow(row)}</tr>) : <tr><td colSpan={headers.length}><EmptyState text={empty} /></td></tr>}
      </tbody>
    </table>
  );
}
