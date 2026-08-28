/* =========================================================
   REN ERP V2 PREMIUM
   INVOICE STORE
========================================================= */

const INVOICES_KEY = "ren_erp_invoices";
const INVOICE_SEQUENCE_KEY = "ren_erp_invoice_sequence";

const INVOICE_CHANGED_EVENT =
  "ren-invoices-changed";

/* =========================================================
   TEMEL ARAÇLAR
========================================================= */

function normalizeNumber(value) {
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

  let text = String(value).trim();

  if (
    text.includes(".") &&
    text.includes(",")
  ) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (
    text.includes(",")
  ) {
    text = text.replace(",", ".");
  }

  const result = Number(text);

  return Number.isFinite(result)
    ? result
    : 0;
}

function readInvoices() {
  try {
    const raw =
      localStorage.getItem(
        INVOICES_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "REN ERP invoiceStore okuma hatası:",
      error
    );

    return [];
  }
}

function writeInvoices(
  invoices
) {
  localStorage.setItem(
    INVOICES_KEY,
    JSON.stringify(
      Array.isArray(invoices)
        ? invoices
        : []
    )
  );

  notifyChange();

  return invoices;
}

function notifyChange() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      INVOICE_CHANGED_EVENT
    )
  );
}

function createId() {
  return (
    "INV-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );
}

function nowIso() {
  return new Date().toISOString();
}

/* =========================================================
   FATURA TİPİ
========================================================= */

export function normalizeType(
  type
) {
  const value =
    String(type || "")
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    value.includes("alış") ||
    value.includes("alis") ||
    value.includes("purchase")
  ) {
    return "purchase";
  }

  if (
    value.includes("iade") ||
    value.includes("return")
  ) {
    return "return";
  }

  return "sales";
}

function getTypeTitle(
  type
) {
  switch (
    normalizeType(type)
  ) {
    case "purchase":
      return "Alış Faturası";

    case "return":
      return "İade Faturası";

    default:
      return "Satış Faturası";
  }
}

/* =========================================================
   TARİH
========================================================= */

function normalizeDate(
  value
) {
  if (!value) {
    return nowIso();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  const parsed =
    new Date(value);

  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {
    return parsed.toISOString();
  }

  return String(value);
}

/* =========================================================
   FATURA SATIRI
========================================================= */

function normalizeItem(
  item = {}
) {
  const quantity =
    normalizeNumber(
      item.quantity ??
        item.qty ??
        item.amount
    );

  const unitPrice =
    normalizeNumber(
      item.unitPrice ??
        item.price ??
        item.salesPrice ??
        item.purchasePrice
    );

  const vatRate =
    normalizeNumber(
      item.vatRate ??
        item.vat ??
        item.taxRate
    );

  const discountRate =
    normalizeNumber(
      item.discountRate ??
        item.discountPercent
    );

  const gross =
    quantity *
    unitPrice;

  const discountAmount =
    gross *
    (discountRate / 100);

  const net =
    Math.max(
      0,
      gross -
        discountAmount
    );

  const vatAmount =
    net *
    (vatRate / 100);

  const total =
    net + vatAmount;

  return {
    ...item,

    id:
      item.id ||
      `ITEM-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

    productId:
      item.productId ??
      item.stockId ??
      "",

    productCode:
      item.productCode ??
      item.code ??
      "",

    productName:
      item.productName ??
      item.name ??
      "",

    barcode:
      item.barcode ??
      "",

    quantity,

    qty: quantity,

    unit:
      item.unit ??
      item.unitName ??
      "Adet",

    unitPrice,

    price: unitPrice,

    vatRate,

    vat: vatRate,

    discountRate,

    discountAmount,

    netAmount: net,

    vatAmount,

    total,
  };
}

/* =========================================================
   TOPLAM HESAPLAMA
========================================================= */

function calculateTotals(
  items = [],
  invoice = {}
) {
  const normalizedItems =
    Array.isArray(items)
      ? items.map(
          normalizeItem
        )
      : [];

  const subtotalBeforeDiscount =
    normalizedItems.reduce(
      (sum, item) =>
        sum +
        normalizeNumber(
          item.quantity
        ) *
        normalizeNumber(
          item.unitPrice
        ),
      0
    );

  const lineDiscount =
    normalizedItems.reduce(
      (sum, item) =>
        sum +
        normalizeNumber(
          item.discountAmount
        ),
      0
    );

  const invoiceDiscount =
    normalizeNumber(
      invoice.discountAmount ??
        invoice.discount
    );

  const subtotal =
    Math.max(
      0,
      subtotalBeforeDiscount -
        lineDiscount -
        invoiceDiscount
    );

  const vatTotal =
    normalizedItems.reduce(
      (sum, item) =>
        sum +
        normalizeNumber(
          item.vatAmount
        ),
      0
    );

  const additionalCharge =
    normalizeNumber(
      invoice.additionalCharge ??
        invoice.extraCharge
    );

  const total =
    Math.max(
      0,
      subtotal +
        vatTotal +
        additionalCharge
    );

  return {
    items:
      normalizedItems,

    subtotal,

    discount:
      lineDiscount +
      invoiceDiscount,

    discountAmount:
      lineDiscount +
      invoiceDiscount,

    vatTotal,

    tax:
      vatTotal,

    additionalCharge,

    total,

    grandTotal:
      total,

    amount:
      total,
  };
}

/* =========================================================
   FATURA NORMALİZASYONU
========================================================= */

function normalizeInvoice(
  data = {},
  existing = null
) {
  const source =
    existing
      ? {
          ...existing,
          ...data,
        }
      : {
          ...data,
        };

  const type =
    normalizeType(
      source.type ??
        source.invoiceType
    );

  const items =
    Array.isArray(
      source.items
    )
      ? source.items
      : Array.isArray(
          source.lines
        )
      ? source.lines
      : [];

  const totals =
    calculateTotals(
      items,
      source
    );

  const invoiceNumber =
    String(
      source.invoiceNumber ??
        source.invoiceNo ??
        source.number ??
        ""
    ).trim();

  const customerName =
    source.customerName ??
    source.partyName ??
    source.customer ??
    source.accountName ??
    "";

  const customerCode =
    source.customerCode ??
    source.partyCode ??
    source.accountCode ??
    "";

  const supplierName =
    source.supplierName ??
    source.supplier ??
    source.partyName ??
    "";

  const supplierCode =
    source.supplierCode ??
    source.partyCode ??
    source.accountCode ??
    "";

  return {
    ...source,

    id:
      source.id ||
      createId(),

    type,

    invoiceType:
      type,

    typeTitle:
      getTypeTitle(type),

    invoiceNumber,

    invoiceNo:
      invoiceNumber,

    number:
      invoiceNumber,

    invoiceDate:
      normalizeDate(
        source.invoiceDate ??
          source.date ??
          source.createdAt
      ),

    date:
      normalizeDate(
        source.invoiceDate ??
          source.date ??
          source.createdAt
      ),

    dueDate:
      source.dueDate ??
      source.vadeDate ??
      "",

    customerId:
      source.customerId ??
      source.accountId ??
      "",

    supplierId:
      source.supplierId ??
      "",

    customerName,

    customerCode,

    supplierName,

    supplierCode,

    partyName:
      customerName ||
      supplierName,

    partyCode:
      customerCode ||
      supplierCode,

    items:
      totals.items,

    lines:
      totals.items,

    subtotal:
      totals.subtotal,

    discount:
      totals.discount,

    discountAmount:
      totals.discountAmount,

    vatTotal:
      totals.vatTotal,

    tax:
      totals.tax,

    additionalCharge:
      totals.additionalCharge,

    total:
      totals.total,

    grandTotal:
      totals.grandTotal,

    amount:
      totals.amount,

    status:
      source.status ||
      "Taslak",

    paymentStatus:
      source.paymentStatus ||
      "Bekliyor",

    paymentMethod:
      source.paymentMethod ||
      "",

    notes:
      source.notes ??
      source.note ??
      "",

    note:
      source.note ??
      source.notes ??
      "",

    createdAt:
      source.createdAt ||
      nowIso(),

    updatedAt:
      nowIso(),
  };
}

/* =========================================================
   FATURA LİSTESİ
========================================================= */

export function getInvoices() {
  return readInvoices();
}

/* =========================================================
   FATURA BUL
========================================================= */

export function getInvoiceById(
  id
) {
  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    return null;
  }

  return (
    getInvoices().find(
      (invoice) =>
        String(
          invoice.id
        ) ===
        String(id)
    ) || null
  );
}

export function getInvoiceByNumber(
  number
) {
  const target =
    String(
      number || ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (!target) {
    return null;
  }

  return (
    getInvoices().find(
      (invoice) =>
        String(
          invoice.invoiceNumber ??
            invoice.invoiceNo ??
            ""
        )
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          ) === target
    ) || null
  );
}

/* =========================================================
   FATURA EKLE
========================================================= */

export function addInvoice(
  invoiceData
) {
  if (
    !invoiceData ||
    typeof invoiceData !==
      "object"
  ) {
    throw new Error(
      "Geçerli fatura verisi gerekli."
    );
  }

  const invoices =
    getInvoices();

  const invoice =
    normalizeInvoice(
      invoiceData
    );

  if (
    invoice.invoiceNumber
  ) {
    const duplicate =
      invoices.some(
        (item) =>
          String(
            item.invoiceNumber ??
              item.invoiceNo ??
              ""
          )
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            ) ===
          invoice.invoiceNumber
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            )
      );

    if (duplicate) {
      throw new Error(
        `Bu fatura numarası zaten kullanılıyor: ${invoice.invoiceNumber}`
      );
    }
  }

  writeInvoices([
    invoice,
    ...invoices,
  ]);

  return invoice;
}

/* =========================================================
   FATURA GÜNCELLE
========================================================= */

export function updateInvoice(
  id,
  changes
) {
  const invoices =
    getInvoices();

  const index =
    invoices.findIndex(
      (invoice) =>
        String(
          invoice.id
        ) ===
        String(id)
    );

  if (index === -1) {
    throw new Error(
      "Fatura bulunamadı."
    );
  }

  const updated =
    normalizeInvoice(
      changes,
      invoices[index]
    );

  if (
    updated.invoiceNumber
  ) {
    const duplicate =
      invoices.some(
        (invoice, i) =>
          i !== index &&
          String(
            invoice.invoiceNumber ??
              invoice.invoiceNo ??
              ""
          )
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            ) ===
          updated.invoiceNumber
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            )
      );

    if (duplicate) {
      throw new Error(
        `Bu fatura numarası başka bir faturada kullanılıyor: ${updated.invoiceNumber}`
      );
    }
  }

  const next =
    [...invoices];

  next[index] =
    updated;

  writeInvoices(
    next
  );

  return updated;
}

/* =========================================================
   FATURA SİL
========================================================= */

export function deleteInvoice(
  id
) {
  const invoices =
    getInvoices();

  const exists =
    invoices.some(
      (invoice) =>
        String(
          invoice.id
        ) ===
        String(id)
    );

  if (!exists) {
    return false;
  }

  const next =
    invoices.filter(
      (invoice) =>
        String(
          invoice.id
        ) !==
        String(id)
    );

  writeInvoices(
    next
  );

  return true;
}

/* =========================================================
   TİP FİLTRELERİ
========================================================= */

export function getSalesInvoices() {
  return getInvoices().filter(
    (invoice) =>
      normalizeType(
        invoice.type ??
          invoice.invoiceType
      ) === "sales"
  );
}

export function getPurchaseInvoices() {
  return getInvoices().filter(
    (invoice) =>
      normalizeType(
        invoice.type ??
          invoice.invoiceType
      ) === "purchase"
  );
}

export function getReturnInvoices() {
  return getInvoices().filter(
    (invoice) =>
      normalizeType(
        invoice.type ??
          invoice.invoiceType
      ) === "return"
  );
}

/* =========================================================
   FATURA TOPLAMI
========================================================= */

export function getInvoiceTotal(
  invoice
) {
  if (!invoice) {
    return 0;
  }

  return normalizeNumber(
    invoice.grandTotal ??
      invoice.total ??
      invoice.amount
  );
}

/* =========================================================
   KAR HESABI
========================================================= */

export function calculateInvoiceProfit(
  invoice
) {
  if (!invoice) {
    return {
      revenue: 0,
      cost: 0,
      profit: 0,
      margin: 0,
    };
  }

  const items =
    Array.isArray(
      invoice.items
    )
      ? invoice.items
      : [];

  let revenue = 0;
  let cost = 0;

  items.forEach(
    (item) => {
      const quantity =
        normalizeNumber(
          item.quantity ??
            item.qty
        );

      const salePrice =
        normalizeNumber(
          item.unitPrice ??
            item.price ??
            item.salesPrice
        );

      const purchasePrice =
        normalizeNumber(
          item.purchasePrice ??
            item.purchaseNet ??
            item.costPrice ??
            item.cost
        );

      revenue +=
        quantity *
        salePrice;

      cost +=
        quantity *
        purchasePrice;
    }
  );

  const profit =
    revenue - cost;

  const margin =
    revenue > 0
      ? (profit /
          revenue) *
        100
      : 0;

  return {
    revenue,
    cost,
    profit,
    margin,
    marginRate:
      margin,
  };
}

/* =========================================================
   FATURA NUMARASI
========================================================= */

export function getNextInvoiceNumber(
  type = "sales"
) {
  const year =
    new Date()
      .getFullYear();

  const prefix =
    `REN-${year}-`;

  const invoices =
    getInvoices();

  let highest = 0;

  invoices.forEach(
    (invoice) => {
      const number =
        String(
          invoice.invoiceNumber ??
            invoice.invoiceNo ??
            ""
        ).trim();

      if (
        number.startsWith(
          prefix
        )
      ) {
        const numeric =
          normalizeNumber(
            number.slice(
              prefix.length
            )
          );

        if (
          numeric >
          highest
        ) {
          highest =
            numeric;
        }
      }
    }
  );

  /*
   * Sequence localStorage'tan da okunur.
   * Böylece mevcut numaraların gerisine düşülmez.
   */
  try {
    const raw =
      localStorage.getItem(
        INVOICE_SEQUENCE_KEY
      );

    if (raw) {
      const sequence =
        JSON.parse(raw);

      const stored =
        normalizeNumber(
          sequence?.[year]
        );

      if (
        stored >
        highest
      ) {
        highest =
          stored;
      }
    }
  } catch {
    // Mevcut faturalar yeterli.
  }

  const next =
    highest + 1;

  try {
    const raw =
      localStorage.getItem(
        INVOICE_SEQUENCE_KEY
      );

    const sequence =
      raw
        ? JSON.parse(raw)
        : {};

    sequence[year] =
      next;

    localStorage.setItem(
      INVOICE_SEQUENCE_KEY,
      JSON.stringify(
        sequence
      )
    );
  } catch {
    // Numara yine üretilecek.
  }

  return (
    prefix +
    String(next)
      .padStart(
        6,
        "0"
      )
  );
}

/* =========================================================
   ARAMA
========================================================= */

export function searchInvoices(
  query = ""
) {
  const text =
    String(query)
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (!text) {
    return getInvoices();
  }

  return getInvoices().filter(
    (invoice) => {
      const searchable = [
        invoice.invoiceNumber,
        invoice.invoiceNo,
        invoice.customerName,
        invoice.customerCode,
        invoice.supplierName,
        invoice.supplierCode,
        invoice.partyName,
        invoice.partyCode,
        invoice.status,
        invoice.paymentStatus,
        invoice.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(
          "tr-TR"
        );

      return searchable.includes(
        text
      );
    }
  );
}

/* =========================================================
   TARİH ARALIĞI
========================================================= */

export function getInvoicesByDateRange(
  startDate,
  endDate
) {
  let start = null;
  let end = null;

  if (startDate) {
    start =
      new Date(
        startDate
      );

    start.setHours(
      0,
      0,
      0,
      0
    );
  }

  if (endDate) {
    end =
      new Date(
        endDate
      );

    end.setHours(
      23,
      59,
      59,
      999
    );
  }

  return getInvoices().filter(
    (invoice) => {
      const date =
        new Date(
          invoice.invoiceDate ||
            invoice.date ||
            invoice.createdAt
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return false;
      }

      if (
        start &&
        date < start
      ) {
        return false;
      }

      if (
        end &&
        date > end
      ) {
        return false;
      }

      return true;
    }
  );
}

/* =========================================================
   BUGÜN
========================================================= */

export function getTodayInvoices() {
  const today =
    new Date();

  return getInvoices().filter(
    (invoice) => {
      const date =
        new Date(
          invoice.invoiceDate ||
            invoice.date ||
            invoice.createdAt
        );

      return (
        date.getFullYear() ===
          today.getFullYear() &&
        date.getMonth() ===
          today.getMonth() &&
        date.getDate() ===
          today.getDate()
      );
    }
  );
}

/* =========================================================
   ÖZET
========================================================= */

export function getInvoiceSummary(
  invoices = getInvoices()
) {
  const list =
    Array.isArray(
      invoices
    )
      ? invoices
      : [];

  let sales = 0;
  let purchases = 0;
  let returns = 0;

  let salesCount = 0;
  let purchaseCount = 0;
  let returnCount = 0;

  list.forEach(
    (invoice) => {
      const type =
        normalizeType(
          invoice.type ??
            invoice.invoiceType
        );

      const total =
        getInvoiceTotal(
          invoice
        );

      if (
        type === "sales"
      ) {
        sales += total;
        salesCount += 1;
      }

      if (
        type === "purchase"
      ) {
        purchases += total;
        purchaseCount += 1;
      }

      if (
        type === "return"
      ) {
        returns += total;
        returnCount += 1;
      }
    }
  );

  return {
    totalCount:
      list.length,

    sales,
    purchases,
    returns,

    salesCount,
    purchaseCount,
    returnCount,

    netSales:
      sales - returns,

    netAmount:
      sales -
      returns -
      purchases,
  };
}

/* =========================================================
   EVENT
========================================================= */

export function onInvoicesChanged(
  callback
) {
  if (
    typeof window ===
      "undefined" ||
    typeof callback !==
      "function"
  ) {
    return () => {};
  }

  window.addEventListener(
    INVOICE_CHANGED_EVENT,
    callback
  );

  return () => {
    window.removeEventListener(
      INVOICE_CHANGED_EVENT,
      callback
    );
  };
}

/* =========================================================
   DIŞA / İÇE AKTARMA
========================================================= */

export function exportInvoices() {
  return JSON.stringify(
    getInvoices(),
    null,
    2
  );
}

export function importInvoices(
  data,
  options = {}
) {
  let imported;

  if (
    typeof data ===
    "string"
  ) {
    try {
      imported =
        JSON.parse(data);
    } catch {
      throw new Error(
        "Geçersiz JSON fatura verisi."
      );
    }
  } else {
    imported = data;
  }

  if (
    !Array.isArray(
      imported
    )
  ) {
    throw new Error(
      "Fatura listesi geçerli değil."
    );
  }

  const normalized =
    imported.map(
      (invoice) =>
        normalizeInvoice(
          invoice
        )
    );

  if (
    options.replace ===
    true
  ) {
    writeInvoices(
      normalized
    );

    return normalized;
  }

  const existing =
    getInvoices();

  const byId =
    new Map();

  existing.forEach(
    (invoice) => {
      byId.set(
        String(
          invoice.id
        ),
        invoice
      );
    }
  );

  normalized.forEach(
    (invoice) => {
      byId.set(
        String(
          invoice.id
        ),
        invoice
      );
    }
  );

  const merged =
    Array.from(
      byId.values()
    );

  writeInvoices(
    merged
  );

  return merged;
}

/* =========================================================
   TEMİZLEME
========================================================= */

export function clearInvoices() {
  localStorage.removeItem(
    INVOICES_KEY
  );

  localStorage.removeItem(
    INVOICE_SEQUENCE_KEY
  );

  notifyChange();

  return true;
}

/* =========================================================
   BAŞLANGIÇ
========================================================= */

export function initializeInvoiceStore() {
  return getInvoices();
}

/* =========================================================
   EXPORT
========================================================= */

export const INVOICE_KEYS = {
  INVOICES_KEY,
  INVOICE_SEQUENCE_KEY,
};

export const INVOICE_EVENTS = {
  changed:
    INVOICE_CHANGED_EVENT,
};

export default {
  getInvoices,
  getInvoiceById,
  getInvoiceByNumber,

  addInvoice,
  updateInvoice,
  deleteInvoice,

  getSalesInvoices,
  getPurchaseInvoices,
  getReturnInvoices,

  searchInvoices,
  getInvoicesByDateRange,
  getTodayInvoices,

  getInvoiceTotal,
  calculateInvoiceProfit,
  getInvoiceSummary,

  getNextInvoiceNumber,

  normalizeType,

  exportInvoices,
  importInvoices,
  clearInvoices,

  onInvoicesChanged,
  initializeInvoiceStore,
};