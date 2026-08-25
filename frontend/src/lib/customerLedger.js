const INVOICE_STORAGE_KEY =
  "ren_erp_invoices";

const FINANCE_MOVEMENT_STORAGE_KEY =
  "ren-erp-cash-bank-movements";

const CUSTOMER_STORAGE_KEY =
  "ren-erp-customers";


/* =========================================================
   SAYI
========================================================= */

function numberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  let text = String(value).trim();

  if (
    text.includes(",") &&
    text.includes(".")
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


/* =========================================================
   DİZİ OKU
========================================================= */

function readArray(key) {
  try {
    const raw =
      localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


/* =========================================================
   CARİ TİPİ
========================================================= */

function normalizeCustomerType(
  type
) {
  const value =
    String(type || "")
      .trim()
      .toLocaleLowerCase("tr-TR");

  if (
    value === "tedarikçi" ||
    value === "tedarikci" ||
    value === "supplier"
  ) {
    return "Tedarikçi";
  }

  return "Müşteri";
}


/* =========================================================
   FATURA TİPİ
========================================================= */

function normalizeInvoiceType(
  type
) {
  const value =
    String(type || "")
      .trim()
      .toLocaleLowerCase("tr-TR");

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
   CARİ EŞLEŞMESİ
   ÖNEMLİ:
   customerId VE supplierId kontrol ediyoruz.
========================================================= */

function invoiceBelongsToCustomer(
  invoice,
  customer
) {
  const id =
    String(customer.id);

  const customerId =
    invoice.customerId !==
    undefined &&
    invoice.customerId !==
    null
      ? String(
          invoice.customerId
        )
      : "";

  const supplierId =
    invoice.supplierId !==
    undefined &&
    invoice.supplierId !==
    null
      ? String(
          invoice.supplierId
        )
      : "";

  return (
    customerId === id ||
    supplierId === id
  );
}


/* =========================================================
   FATURA HAREKETLERİ
========================================================= */

function getInvoiceMovements(
  customer
) {
  const invoices =
    readArray(
      INVOICE_STORAGE_KEY
    );

  const customerType =
    normalizeCustomerType(
      customer.type
    );

  return invoices
    .filter(
      (invoice) =>
        invoiceBelongsToCustomer(
          invoice,
          customer
        )
    )
    .map(
      (invoice) => {

        const total =
          numberValue(
            invoice.total
          );

        if (total <= 0) {
          return null;
        }

        const type =
          normalizeInvoiceType(
            invoice.type
          );

        /*
         * MÜŞTERİ
         * Satış -> müşterinin borcu
         */
        if (
          customerType ===
            "Müşteri" &&
          type ===
            "sales"
        ) {
          return {
            id:
              `invoice-sale-${invoice.id}`,
            customerId:
              customer.id,
            customerName:
              customer.name,
            date:
              invoice.date ||
              "",
            document:
              invoice.invoiceNo ||
              "",
            type:
              "Satış",
            description:
              "Satış faturası",
            debt:
              total,
            credit:
              0,
            source:
              "invoice",
            invoiceId:
              invoice.id,
          };
        }

        /*
         * MÜŞTERİ İADE
         */
        if (
          customerType ===
            "Müşteri" &&
          type ===
            "return"
        ) {
          return {
            id:
              `invoice-return-${invoice.id}`,
            customerId:
              customer.id,
            customerName:
              customer.name,
            date:
              invoice.date ||
              "",
            document:
              invoice.invoiceNo ||
              "",
            type:
              "İade",
            description:
              "İade faturası",
            debt:
              0,
            credit:
              total,
            source:
              "invoice",
            invoiceId:
              invoice.id,
          };
        }

        /*
         * TEDARİKÇİ
         * Alış -> bizim borcumuz
         */
        if (
          customerType ===
            "Tedarikçi" &&
          type ===
            "purchase"
        ) {
          return {
            id:
              `invoice-purchase-${invoice.id}`,
            customerId:
              customer.id,
            customerName:
              customer.name,
            date:
              invoice.date ||
              "",
            document:
              invoice.invoiceNo ||
              "",
            type:
              "Alış",
            description:
              "Alış faturası",
            debt:
              total,
            credit:
              0,
            source:
              "invoice",
            invoiceId:
              invoice.id,
          };
        }

        /*
         * TEDARİKÇİ İADE
         */
        if (
          customerType ===
            "Tedarikçi" &&
          type ===
            "return"
        ) {
          return {
            id:
              `invoice-return-${invoice.id}`,
            customerId:
              customer.id,
            customerName:
              customer.name,
            date:
              invoice.date ||
              "",
            document:
              invoice.invoiceNo ||
              "",
            type:
              "İade",
            description:
              "İade faturası",
            debt:
              0,
            credit:
              total,
            source:
              "invoice",
            invoiceId:
              invoice.id,
          };
        }

        return null;
      }
    )
    .filter(Boolean);
}


/* =========================================================
   FİNANS HAREKETLERİ
========================================================= */

function getFinanceMovements(
  customer
) {
  const movements =
    readArray(
      FINANCE_MOVEMENT_STORAGE_KEY
    );

  const customerType =
    normalizeCustomerType(
      customer.type
    );

  return movements
    .filter(
      (movement) =>
        String(
          movement.customerId
        ) ===
        String(
          customer.id
        )
    )
    .filter(
      (movement) =>
        movement.source ===
          "payment" ||
        movement.source ===
          "collection"
    )
    .map(
      (movement) => {

        const amount =
          numberValue(
            movement.amount
          );

        if (amount <= 0) {
          return null;
        }

        /*
         * TEDARİKÇİ ÖDEMESİ
         * Borcu azaltır.
         */
        if (
          customerType ===
            "Tedarikçi" &&
          movement.source ===
            "payment"
        ) {
          return {
            id:
              `finance-payment-${movement.id}`,
            customerId:
              customer.id,
            customerName:
              customer.name,
            date:
              movement.date ||
              "",
            document:
              movement.sourceDocument ||
              movement.invoiceNo ||
              "Ödeme",
            type:
              "Ödeme",
            description:
              movement.description ||
              "Tedarikçi ödemesi",
            debt:
              0,
            credit:
              amount,
            source:
              "payment",
            method:
              movement.method ||
              "",
            account:
              movement.accountName ||
              "",
          };
        }

        /*
         * MÜŞTERİ TAHSİLATI
         * Borcu azaltır.
         */
        if (
          customerType ===
            "Müşteri" &&
          movement.source ===
            "collection"
        ) {
          return {
            id:
              `finance-collection-${movement.id}`,
            customerId:
              customer.id,
            customerName:
              customer.name,
            date:
              movement.date ||
              "",
            document:
              movement.sourceDocument ||
              movement.invoiceNo ||
              "Tahsilat",
            type:
              "Tahsilat",
            description:
              movement.description ||
              "Müşteri tahsilatı",
            debt:
              0,
            credit:
              amount,
            source:
              "collection",
            method:
              movement.method ||
              "",
            account:
              movement.accountName ||
              "",
          };
        }

        return null;
      }
    )
    .filter(Boolean);
}


/* =========================================================
   CARİ DEFTERİ
========================================================= */

export function getCustomerLedger(
  customer
) {
  if (!customer) {
    return [];
  }

  const invoiceMovements =
    getInvoiceMovements(
      customer
    );

  const financeMovements =
    getFinanceMovements(
      customer
    );

  return [
    ...invoiceMovements,
    ...financeMovements,
  ].sort(
    (a, b) => {

      const dateCompare =
        String(
          a.date || ""
        ).localeCompare(
          String(
            b.date || ""
          )
        );

      if (
        dateCompare !==
        0
      ) {
        return dateCompare;
      }

      return String(
        a.id || ""
      ).localeCompare(
        String(
          b.id || ""
        )
      );
    }
  );
}


/* =========================================================
   BAKİYELİ DEFTER
========================================================= */

export function getCustomerLedgerWithBalance(
  customer
) {
  const ledger =
    getCustomerLedger(
      customer
    );

  let balance = 0;

  return ledger.map(
    (movement) => {

      balance +=
        numberValue(
          movement.debt
        ) -
        numberValue(
          movement.credit
        );

      return {
        ...movement,
        balance,
      };
    }
  );
}


/* =========================================================
   TOPLAMLAR
========================================================= */

export function getCustomerLedgerTotals(
  customer
) {
  const ledger =
    getCustomerLedger(
      customer
    );

  let debt = 0;
  let credit = 0;

  let sales = 0;
  let purchases = 0;

  let collections = 0;
  let payments = 0;

  ledger.forEach(
    (movement) => {

      const movementDebt =
        numberValue(
          movement.debt
        );

      const movementCredit =
        numberValue(
          movement.credit
        );

      debt +=
        movementDebt;

      credit +=
        movementCredit;

      if (
        movement.type ===
        "Satış"
      ) {
        sales +=
          movementDebt;
      }

      if (
        movement.type ===
        "Alış"
      ) {
        purchases +=
          movementDebt;
      }

      if (
        movement.type ===
        "Tahsilat"
      ) {
        collections +=
          movementCredit;
      }

      if (
        movement.type ===
        "Ödeme"
      ) {
        payments +=
          movementCredit;
      }
    }
  );

  return {
    debt,
    credit,
    sales,
    purchases,
    collections,
    payments,
    balance:
      debt -
      credit,
  };
}


/* =========================================================
   TÜM CARİLERİN YENİDEN HESABI
========================================================= */

export function rebuildAllCustomerBalances() {
  const customers =
    readArray(
      CUSTOMER_STORAGE_KEY
    );

  const updated =
    customers.map(
      (customer) => {

        const totals =
          getCustomerLedgerTotals(
            customer
          );

        return {
          ...customer,

          type:
            normalizeCustomerType(
              customer.type
            ),

          balance:
            totals.balance,

          ledgerDebt:
            totals.debt,

          ledgerCredit:
            totals.credit,

          totalSales:
            totals.sales,

          totalPurchases:
            totals.purchases,

          totalCollections:
            totals.collections,

          totalPayments:
            totals.payments,
        };
      }
    );

  localStorage.setItem(
    CUSTOMER_STORAGE_KEY,
    JSON.stringify(
      updated
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-customers-updated"
    )
  );

  return updated;
}