/* =========================================================
   REN ERP — FATURA STORE
   Satış / Alış / İade
   Ödeme / POS / Banka / Vade altyapısı
========================================================= */

const STORAGE_KEY =
  "ren_erp_invoices";


/* =========================================================
   YARDIMCI
========================================================= */

function createId() {
  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2, 9)
  );
}


function today() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function number(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
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

  const parsed =
    Number(text);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}


/* =========================================================
   FATURA TİPİ
========================================================= */

function normalizeType(type) {

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
   ÖDEME YÖNTEMİ
========================================================= */

export function normalizePaymentMethod(
  method
) {

  const value =
    String(
      method || ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );


  if (
    value === "nakit" ||
    value === "cash"
  ) {
    return "cash";
  }


  if (
    value.includes("pos") ||
    value.includes("kredi") ||
    value.includes("kart")
  ) {
    return "pos";
  }


  if (
    value.includes("havale") ||
    value.includes("eft") ||
    value.includes("banka") ||
    value === "bank"
  ) {
    return "bank";
  }


  if (
    value.includes("vadeli") ||
    value.includes("vade") ||
    value === "credit"
  ) {
    return "credit";
  }


  return "credit";
}


/* =========================================================
   ÖDEME YÖNTEMİ ETİKETİ
========================================================= */

export function getPaymentMethodLabel(
  method
) {

  switch (
    normalizePaymentMethod(
      method
    )
  ) {

    case "cash":
      return "Nakit";

    case "pos":
      return "POS / Kredi Kartı";

    case "bank":
      return "Banka / Havale-EFT";

    case "credit":
    default:
      return "Vadeli";

  }
}


/* =========================================================
   FATURA NUMARASI
========================================================= */

export function getNextInvoiceNumber(
  type = "sales"
) {

  const invoices =
    getInvoices();

  const normalizedType =
    normalizeType(
      type
    );

  const prefix =
    normalizedType ===
    "purchase"
      ? "AF"
      : normalizedType ===
        "return"
      ? "IA"
      : "SF";

  let maxNumber =
    0;

  invoices.forEach(
    (invoice) => {

      if (
        normalizeType(
          invoice.type
        ) !==
        normalizedType
      ) {
        return;
      }

      const match =
        String(
          invoice.invoiceNo ||
          ""
        ).match(
          /(\d+)$/
        );

      if (!match) {
        return;
      }

      const current =
        Number(
          match[1]
        );

      if (
        current >
        maxNumber
      ) {
        maxNumber =
          current;
      }

    }
  );


  return `${prefix}-${String(
    maxNumber + 1
  ).padStart(
    6,
    "0"
  )}`;
}


/* =========================================================
   OKUMA
========================================================= */

export function getInvoices() {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw
      );

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }


    return parsed.map(
      (invoice) => {

        const paymentMethod =
          normalizePaymentMethod(
            invoice.paymentMethod
          );


        return {

          ...invoice,

          type:
            normalizeType(
              invoice.type
            ),

          total:
            number(
              invoice.total
            ),

          subtotal:
            number(
              invoice.subtotal
            ),

          vatTotal:
            number(
              invoice.vatTotal
            ),

          discountTotal:
            number(
              invoice.discountTotal
            ),

          paymentMethod,

          paymentMethodLabel:
            getPaymentMethodLabel(
              paymentMethod
            ),

          paymentStatus:
            invoice.paymentStatus ||
            (
              paymentMethod ===
              "credit"
                ? "Bekliyor"
                : "Ödendi"
            ),

          dueDate:
            invoice.dueDate ||
            "",

          items:
            Array.isArray(
              invoice.items
            )
              ? invoice.items
              : [],

        };

      }
    );

  } catch (
    error
  ) {

    console.error(
      "REN ERP invoiceStore okuma hatası:",
      error
    );

    return [];

  }
}


/* =========================================================
   KAYDET
========================================================= */

function saveInvoices(
  invoices
) {

  localStorage.setItem(
    STORAGE_KEY,
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
   FATURA GETİR
========================================================= */

export function getInvoiceById(
  id
) {

  if (!id) {
    return null;
  }

  return (
    getInvoices().find(
      (invoice) =>
        String(
          invoice.id
        ) ===
        String(
          id
        )
    ) ||
    null
  );
}


/* =========================================================
   FATURA EKLE
========================================================= */

export function addInvoice(
  data = {}
) {

  const type =
    normalizeType(
      data.type
    );


  const paymentMethod =
    normalizePaymentMethod(
      data.paymentMethod
    );


  const total =
    number(
      data.total
    );


  /*
   * Vadeli faturada vade tarihi yoksa
   * boş bırakılır.
   *
   * Nakit / POS / banka işlemleri
   * doğrudan ödenmiş kabul edilir.
   */

  const defaultPaymentStatus =
    paymentMethod ===
    "credit"
      ? "Bekliyor"
      : "Ödendi";


  const invoice = {

    id:
      data.id ||
      createId(),

    type,

    invoiceNo:
      data.invoiceNo ||
      getNextInvoiceNumber(
        type
      ),

    date:
      data.date ||
      today(),

    dueDate:
      data.dueDate ||
      "",


    /* CARİ */

    customerId:
      data.customerId ||
      "",

    customerName:
      data.customerName ||
      "",

    customerCode:
      data.customerCode ||
      "",


    supplierId:
      data.supplierId ||
      "",

    supplierName:
      data.supplierName ||
      "",

    supplierCode:
      data.supplierCode ||
      "",


    /* FATURA */

    title:
      data.title ||
      "",

    description:
      data.description ||
      "",


    /* ÖDEME */

    paymentMethod,

    paymentMethodLabel:
      getPaymentMethodLabel(
        paymentMethod
      ),

    paymentStatus:
      data.paymentStatus ||
      defaultPaymentStatus,

    status:
      data.status ||
      (
        paymentMethod ===
        "credit"
          ? "open"
          : "paid"
      ),


    /*
     * Finans bağlantısı için
     * ayrıca tutulacak.
     */

    paymentAmount:
      number(
        data.paymentAmount ??
        (
          paymentMethod !==
          "credit"
            ? total
            : 0
        )
      ),

    paymentDate:
      data.paymentDate ||
      (
        paymentMethod !==
        "credit"
          ? (
              data.date ||
              today()
            )
          : ""
      ),

    paymentReference:
      data.paymentReference ||
      "",

    bankAccountId:
      data.bankAccountId ||
      "",

    bankAccountName:
      data.bankAccountName ||
      "",

    posAccountId:
      data.posAccountId ||
      "",

    posAccountName:
      data.posAccountName ||
      "",

    cashAccountId:
      data.cashAccountId ||
      "",

    cashAccountName:
      data.cashAccountName ||
      "",

    posCommissionRate:
      number(
        data.posCommissionRate
      ),

    posCommission:
      number(
        data.posCommission
      ),

    netPaymentAmount:
      number(
        data.netPaymentAmount ??
        (
          paymentMethod ===
          "pos"
            ? total -
              number(
                data.posCommission
              )
            : (
                paymentMethod !==
                "credit"
                  ? total
                  : 0
              )
        )
      ),


    /* TUTARLAR */

    subtotal:
      number(
        data.subtotal
      ),

    discountTotal:
      number(
        data.discountTotal
      ),

    vatTotal:
      number(
        data.vatTotal
      ),

    total,


    /* SATIRLAR */

    items:
      Array.isArray(
        data.items
      )
        ? data.items
        : [],


    /* İADE */

    returnType:
      data.returnType ||
      "",

    originalInvoiceId:
      data.originalInvoiceId ||
      "",


    /* DİĞER */

    notes:
      data.notes ||
      "",

    createdAt:
      data.createdAt ||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

  };


  const invoices =
    getInvoices();


  invoices.unshift(
    invoice
  );


  saveInvoices(
    invoices
  );


  return invoice;
}


/* =========================================================
   FATURA GÜNCELLE
========================================================= */

export function updateInvoice(
  id,
  data = {}
) {

  const invoices =
    getInvoices();


  const index =
    invoices.findIndex(
      (invoice) =>
        String(
          invoice.id
        ) ===
        String(
          id
        )
    );


  if (
    index === -1
  ) {
    return null;
  }


  const oldInvoice =
    invoices[index];


  const type =
    data.type !==
    undefined
      ? normalizeType(
          data.type
        )
      : normalizeType(
          oldInvoice.type
        );


  const paymentMethod =
    data.paymentMethod !==
    undefined
      ? normalizePaymentMethod(
          data.paymentMethod
        )
      : normalizePaymentMethod(
          oldInvoice.paymentMethod
        );


  const updatedTotal =
    data.total !==
    undefined
      ? number(
          data.total
        )
      : number(
          oldInvoice.total
        );


  const updatedInvoice = {

    ...oldInvoice,

    ...data,

    id:
      oldInvoice.id,

    type,

    paymentMethod,

    paymentMethodLabel:
      getPaymentMethodLabel(
        paymentMethod
      ),

    invoiceNo:
      data.invoiceNo ||
      oldInvoice.invoiceNo ||
      getNextInvoiceNumber(
        type
      ),

    subtotal:
      data.subtotal !==
      undefined
        ? number(
            data.subtotal
          )
        : number(
            oldInvoice.subtotal
          ),

    discountTotal:
      data.discountTotal !==
      undefined
        ? number(
            data.discountTotal
          )
        : number(
            oldInvoice.discountTotal
          ),

    vatTotal:
      data.vatTotal !==
      undefined
        ? number(
            data.vatTotal
          )
        : number(
            oldInvoice.vatTotal
          ),

    total:
      updatedTotal,

    paymentAmount:
      data.paymentAmount !==
      undefined
        ? number(
            data.paymentAmount
          )
        : number(
            oldInvoice.paymentAmount
          ),

    posCommissionRate:
      data.posCommissionRate !==
      undefined
        ? number(
            data.posCommissionRate
          )
        : number(
            oldInvoice.posCommissionRate
          ),

    posCommission:
      data.posCommission !==
      undefined
        ? number(
            data.posCommission
          )
        : number(
            oldInvoice.posCommission
          ),

    netPaymentAmount:
      data.netPaymentAmount !==
      undefined
        ? number(
            data.netPaymentAmount
          )
        : number(
            oldInvoice.netPaymentAmount
          ),

    items:
      Array.isArray(
        data.items
      )
        ? data.items
        : Array.isArray(
            oldInvoice.items
          )
        ? oldInvoice.items
        : [],

    updatedAt:
      new Date().toISOString(),

  };


  /*
   * Ödeme yöntemi değiştiğinde
   * durum da mantıklı hale gelir.
   */

  if (
    data.paymentStatus ===
    undefined
  ) {

    updatedInvoice.paymentStatus =
      paymentMethod ===
      "credit"
        ? (
            oldInvoice.paymentStatus ||
            "Bekliyor"
          )
        : "Ödendi";

  }


  if (
    data.status ===
    undefined
  ) {

    updatedInvoice.status =
      paymentMethod ===
      "credit"
        ? (
            oldInvoice.status ||
            "open"
          )
        : "paid";

  }


  invoices[index] =
    updatedInvoice;


  saveInvoices(
    invoices
  );


  return updatedInvoice;
}


/* =========================================================
   ÖDEME DURUMUNU GÜNCELLE
========================================================= */

export function markInvoicePaid(
  id,
  paymentData = {}
) {

  const invoice =
    getInvoiceById(
      id
    );


  if (!invoice) {
    return null;
  }


  const total =
    number(
      invoice.total
    );


  const paymentAmount =
    number(
      paymentData.amount ??
      total
    );


  return updateInvoice(
    id,
    {

      paymentStatus:
        "Ödendi",

      status:
        "paid",

      paymentAmount,

      paymentDate:
        paymentData.date ||
        today(),

      paymentReference:
        paymentData.reference ||
        "",

      paymentMethod:
        paymentData.method ||
        invoice.paymentMethod,

      bankAccountId:
        paymentData.bankAccountId ||
        invoice.bankAccountId,

      bankAccountName:
        paymentData.bankAccountName ||
        invoice.bankAccountName,

      posAccountId:
        paymentData.posAccountId ||
        invoice.posAccountId,

      posAccountName:
        paymentData.posAccountName ||
        invoice.posAccountName,

      cashAccountId:
        paymentData.cashAccountId ||
        invoice.cashAccountId,

      cashAccountName:
        paymentData.cashAccountName ||
        invoice.cashAccountName,

    }
  );
}


/* =========================================================
   FATURA SİL
========================================================= */

export function deleteInvoice(
  id
) {

  const invoices =
    getInvoices();


  const filtered =
    invoices.filter(
      (invoice) =>
        String(
          invoice.id
        ) !==
        String(
          id
        )
    );


  saveInvoices(
    filtered
  );


  return true;
}


/* =========================================================
   TİP
========================================================= */

export function getInvoicesByType(
  type
) {

  const normalizedType =
    normalizeType(
      type
    );


  return getInvoices().filter(
    (invoice) =>
      normalizeType(
        invoice.type
      ) ===
      normalizedType
  );
}


export function getSalesInvoices() {
  return getInvoicesByType(
    "sales"
  );
}


export function getPurchaseInvoices() {
  return getInvoicesByType(
    "purchase"
  );
}


export function getReturnInvoices() {
  return getInvoicesByType(
    "return"
  );
}


/* =========================================================
   SAYI / TOPLAM
========================================================= */

export function getInvoiceCount(
  type
) {

  return getInvoicesByType(
    type
  ).length;
}


export function getInvoiceTotal(
  type
) {

  return getInvoicesByType(
    type
  ).reduce(
    (
      total,
      invoice
    ) =>
      total +
      number(
        invoice.total
      ),
    0
  );
}


/* =========================================================
   ÖDENEN / AÇIK
========================================================= */

export function getPaidInvoices() {

  return getInvoices().filter(
    (invoice) =>
      invoice.status ===
        "paid" ||
      invoice.paymentStatus ===
        "Ödendi" ||
      invoice.paymentStatus ===
        "Tahsil Edildi"
  );
}


export function getOpenInvoices() {

  return getInvoices().filter(
    (invoice) =>
      invoice.status !==
        "paid" &&
      invoice.status !==
        "cancelled" &&
      invoice.status !==
        "canceled" &&
      invoice.paymentStatus !==
        "Ödendi" &&
      invoice.paymentStatus !==
        "Tahsil Edildi"
  );
}


/* =========================================================
   VADELİ FATURALAR
========================================================= */

export function getCreditInvoices() {

  return getInvoices().filter(
    (invoice) =>
      normalizePaymentMethod(
        invoice.paymentMethod
      ) === "credit"
  );
}


/* =========================================================
   VADESİ GEÇEN
========================================================= */

export function getOverdueInvoices() {

  const currentDate =
    new Date();

  currentDate.setHours(
    0,
    0,
    0,
    0
  );


  return getCreditInvoices()
    .filter(
      (invoice) => {

        if (
          !invoice.dueDate
        ) {
          return false;
        }

        if (
          invoice.status ===
          "paid"
        ) {
          return false;
        }

        const due =
          new Date(
            `${invoice.dueDate}T00:00:00`
          );

        return (
          due <
          currentDate
        );

      }
    );

}


/* =========================================================
   YAKLAŞAN VADELER
========================================================= */

export function getUpcomingDueInvoices(
  days = 7
) {

  const currentDate =
    new Date();

  currentDate.setHours(
    0,
    0,
    0,
    0
  );


  const endDate =
    new Date(
      currentDate
    );

  endDate.setDate(
    endDate.getDate() +
      number(days)
  );


  return getCreditInvoices()
    .filter(
      (invoice) => {

        if (
          !invoice.dueDate
        ) {
          return false;
        }

        if (
          invoice.status ===
          "paid"
        ) {
          return false;
        }

        const due =
          new Date(
            `${invoice.dueDate}T00:00:00`
          );

        return (
          due >=
            currentDate &&
          due <=
            endDate
        );

      }
    );

}


/* =========================================================
   ÖDEME YÖNTEMİNE GÖRE
========================================================= */

export function getInvoicesByPaymentMethod(
  method
) {

  const normalized =
    normalizePaymentMethod(
      method
    );


  return getInvoices().filter(
    (invoice) =>
      normalizePaymentMethod(
        invoice.paymentMethod
      ) ===
      normalized
  );
}


export function getCashInvoices() {
  return getInvoicesByPaymentMethod(
    "cash"
  );
}


export function getPosInvoices() {
  return getInvoicesByPaymentMethod(
    "pos"
  );
}


export function getBankInvoices() {
  return getInvoicesByPaymentMethod(
    "bank"
  );
}


/* =========================================================
   FATURA ÖZETİ
========================================================= */

export function getInvoiceSummary() {

  const invoices =
    getInvoices();


  const sales =
    invoices.filter(
      (invoice) =>
        invoice.type ===
        "sales"
    );


  const purchases =
    invoices.filter(
      (invoice) =>
        invoice.type ===
        "purchase"
    );


  const returns =
    invoices.filter(
      (invoice) =>
        invoice.type ===
        "return"
    );


  const paid =
    getPaidInvoices();


  const open =
    getOpenInvoices();


  const credit =
    getCreditInvoices();


  const overdue =
    getOverdueInvoices();


  const upcoming =
    getUpcomingDueInvoices(
      7
    );


  return {

    totalCount:
      invoices.length,

    salesCount:
      sales.length,

    purchaseCount:
      purchases.length,

    returnCount:
      returns.length,

    totalAmount:
      invoices.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    salesTotal:
      sales.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    purchaseTotal:
      purchases.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    returnTotal:
      returns.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    paidTotal:
      paid.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    openTotal:
      open.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    creditTotal:
      credit.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    overdueTotal:
      overdue.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

    upcomingDueTotal:
      upcoming.reduce(
        (
          total,
          invoice
        ) =>
          total +
          number(
            invoice.total
          ),
        0
      ),

  };
}


/* =========================================================
   SON FATURALAR
========================================================= */

export function getRecentInvoices(
  limit = 10
) {

  return getInvoices()
    .sort(
      (
        a,
        b
      ) =>
        String(
          b.date ||
          ""
        ).localeCompare(
          String(
            a.date ||
            ""
          )
        )
    )
    .slice(
      0,
      limit
    );
}


/* =========================================================
   TİP DEĞİŞTİR
========================================================= */

export function changeInvoiceType(
  id,
  type
) {

  const invoice =
    getInvoiceById(
      id
    );


  if (!invoice) {
    return null;
  }


  return updateInvoice(
    id,
    {
      type:
        normalizeType(
          type
        ),
    }
  );
}


/* =========================================================
   DEMO
========================================================= */

export function seedInvoiceDemoData() {

  const invoices =
    getInvoices();


  if (
    invoices.length > 0
  ) {
    return invoices;
  }


  const demoInvoices = [

    {
      id:
        createId(),

      type:
        "sales",

      invoiceNo:
        "SF-000001",

      date:
        today(),

      dueDate:
        today(),

      customerName:
        "Demo Müşteri",

      customerCode:
        "CR-0001",

      paymentMethod:
        "credit",

      paymentMethodLabel:
        "Vadeli",

      paymentStatus:
        "Bekliyor",

      status:
        "open",

      subtotal:
        1000,

      discountTotal:
        0,

      vatTotal:
        200,

      total:
        1200,

      paymentAmount:
        0,

      items:
        [],

      notes:
        "",

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

    },

  ];


  saveInvoices(
    demoInvoices
  );


  return demoInvoices;
}


/* =========================================================
   DEFAULT
========================================================= */

export default {

  getInvoices,

  getInvoiceById,

  addInvoice,

  updateInvoice,

  deleteInvoice,

  getInvoicesByType,

  getSalesInvoices,

  getPurchaseInvoices,

  getReturnInvoices,

  getInvoiceCount,

  getInvoiceTotal,

  getPaidInvoices,

  getOpenInvoices,

  getCreditInvoices,

  getOverdueInvoices,

  getUpcomingDueInvoices,

  getInvoicesByPaymentMethod,

  getCashInvoices,

  getPosInvoices,

  getBankInvoices,

  getInvoiceSummary,

  getRecentInvoices,

  changeInvoiceType,

  markInvoicePaid,

  normalizePaymentMethod,

  getPaymentMethodLabel,

  seedInvoiceDemoData,

  getNextInvoiceNumber,

};