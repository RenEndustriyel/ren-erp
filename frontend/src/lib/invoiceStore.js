const INVOICES_KEY =
  "ren_erp_invoices";


/* =========================================================
   GENEL
========================================================= */

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
      JSON.parse(
        raw
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];

  } catch {
    return [];
  }
}


function saveInvoices(
  invoices
) {
  localStorage.setItem(
    INVOICES_KEY,
    JSON.stringify(
      invoices
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-invoices-updated"
    )
  );

  return invoices;
}


/* =========================================================
   NUMARA TİPİ
========================================================= */

function normalizeInvoiceType(
  type
) {
  const value =
    String(
      type || ""
    )
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
    value === "alış faturası" ||
    value === "alis faturasi"
  ) {
    return "purchase";
  }


  if (
    value === "return" ||
    value === "returns" ||
    value === "iade" ||
    value === "iade faturası" ||
    value === "iade faturasi"
  ) {
    return "return";
  }


  return "sales";
}


/* =========================================================
   FATURA PREFIX
========================================================= */

function getInvoicePrefix(
  type
) {
  const normalized =
    normalizeInvoiceType(
      type
    );


  if (
    normalized ===
    "purchase"
  ) {
    return "AF";
  }


  if (
    normalized ===
    "return"
  ) {
    return "IF";
  }


  return "SF";
}


/* =========================================================
   SON NUMARAYI BUL
========================================================= */

function getLastInvoiceSequence(
  prefix,
  invoices
) {
  let max =
    0;


  invoices.forEach(
    (
      invoice
    ) => {

      const number =
        String(
          invoice.invoiceNo ||
          ""
        )
          .trim();


      if (
        !number
      ) {
        return;
      }


      const match =
        number.match(
          new RegExp(
            `^${prefix}-(\\d+)$`,
            "i"
          )
        );


      if (!match) {
        return;
      }


      const sequence =
        Number(
          match[1]
        );


      if (
        Number.isFinite(
          sequence
        ) &&
        sequence >
        max
      ) {
        max =
          sequence;
      }

    }
  );


  return max;
}


/* =========================================================
   YENİ FATURA NUMARASI
========================================================= */

export function getNextInvoiceNumber(
  type
) {
  const invoices =
    getInvoices();


  const prefix =
    getInvoicePrefix(
      type
    );


  const lastNumber =
    getLastInvoiceSequence(
      prefix,
      invoices
    );


  return `${prefix}-${String(
    lastNumber + 1
  ).padStart(
    6,
    "0"
  )}`;
}


/* =========================================================
   TÜM FATURALAR
========================================================= */

export function getInvoices() {
  return readInvoices();
}


/* =========================================================
   ID'YE GÖRE
========================================================= */

export function getInvoiceById(
  id
) {
  return getInvoices().find(
    (
      invoice
    ) =>
      String(
        invoice.id
      ) ===
      String(
        id
      )
  ) || null;
}


/* =========================================================
   FATURA EKLE
========================================================= */

export function addInvoice(
  invoiceData
) {
  const invoices =
    getInvoices();


  const type =
    normalizeInvoiceType(
      invoiceData.type
    );


  const invoiceNo =
    invoiceData.invoiceNo ||
    getNextInvoiceNumber(
      type
    );


  const invoice = {

    id:
      invoiceData.id ||
      `INV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    type,

    invoiceNo,

    date:
      invoiceData.date ||
      new Date()
        .toISOString()
        .slice(
          0,
          10
        ),

    dueDate:
      invoiceData.dueDate ||
      "",

    customerId:
      invoiceData.customerId ||
      "",

    customerName:
      invoiceData.customerName ||
      "",

    customerCode:
      invoiceData.customerCode ||
      "",

    supplierId:
      invoiceData.supplierId ||
      "",

    supplierName:
      invoiceData.supplierName ||
      "",

    supplierCode:
      invoiceData.supplierCode ||
      "",

    paymentMethod:
      invoiceData.paymentMethod ||
      "Vadeli",

    paymentStatus:
      invoiceData.paymentStatus ||
      "Bekliyor",

    status:
      invoiceData.status ||
      "open",

    stockTracking:
      invoiceData.stockTracking !==
      false,

    items:
      Array.isArray(
        invoiceData.items
      )
        ? invoiceData.items
        : [],

    subtotal:
      Number(
        invoiceData.subtotal
      ) || 0,

    discount:
      Number(
        invoiceData.discount ??
        invoiceData.discountTotal
      ) || 0,

    discountTotal:
      Number(
        invoiceData.discountTotal ??
        invoiceData.discount
      ) || 0,

    vat:
      Number(
        invoiceData.vat ??
        invoiceData.vatTotal
      ) || 0,

    vatTotal:
      Number(
        invoiceData.vatTotal ??
        invoiceData.vat
      ) || 0,

    total:
      Number(
        invoiceData.total
      ) || 0,

    paidAmount:
      Number(
        invoiceData.paidAmount
      ) || 0,

    notes:
      invoiceData.notes ||
      "",

    orderId:
      invoiceData.orderId ||
      "",

    orderNumber:
      invoiceData.orderNumber ||
      "",

    source:
      invoiceData.source ||
      "",

    sourceType:
      invoiceData.sourceType ||
      "",

    createdAt:
      invoiceData.createdAt ||
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString(),

  };


  saveInvoices([
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
      (
        invoice
      ) =>
        String(
          invoice.id
        ) ===
        String(
          id
        )
    );


  if (
    index ===
    -1
  ) {
    throw new Error(
      "Fatura bulunamadı."
    );
  }


  const current =
    invoices[index];


  const updated = {

    ...current,

    ...changes,

    updatedAt:
      new Date()
        .toISOString(),

  };


  /*
    Fatura numarası boşaltılırsa
    mevcut numarayı koru.
  */

  if (
    !updated.invoiceNo
  ) {
    updated.invoiceNo =
      current.invoiceNo;
  }


  /*
    Tip değişirse eski numarayı
    otomatik değiştirmiyoruz.
    Eski belge referansı korunur.
  */


  const nextInvoices =
    [
      ...invoices,
    ];


  nextInvoices[index] =
    updated;


  saveInvoices(
    nextInvoices
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
      (
        invoice
      ) =>
        String(
          invoice.id
        ) ===
        String(
          id
        )
    );


  if (!exists) {
    return false;
  }


  saveInvoices(
    invoices.filter(
      (
        invoice
      ) =>
        String(
          invoice.id
        ) !==
        String(
          id
        )
    )
  );


  return true;
}


/* =========================================================
   TİP FİLTRELERİ
========================================================= */

export function getSalesInvoices() {
  return getInvoices().filter(
    (
      invoice
    ) =>
      normalizeInvoiceType(
        invoice.type
      ) ===
      "sales"
  );
}


export function getPurchaseInvoices() {
  return getInvoices().filter(
    (
      invoice
    ) =>
      normalizeInvoiceType(
        invoice.type
      ) ===
      "purchase"
  );
}


export function getReturnInvoices() {
  return getInvoices().filter(
    (
      invoice
    ) =>
      normalizeInvoiceType(
        invoice.type
      ) ===
      "return"
  );
}


/* =========================================================
   CARİYE GÖRE
========================================================= */

export function getInvoicesByCustomerId(
  customerId
) {
  return getInvoices().filter(
    (
      invoice
    ) =>
      String(
        invoice.customerId ||
        invoice.supplierId ||
        ""
      ) ===
      String(
        customerId
      )
  );
}


/* =========================================================
   NUMARA / TİP YARDIMCILARI
========================================================= */

export {
  normalizeInvoiceType,
  getInvoicePrefix,
};