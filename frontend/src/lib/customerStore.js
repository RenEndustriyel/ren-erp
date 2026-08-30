import {
  rebuildAllCustomerBalances,
  getCustomerLedgerTotals,
} from "./customerLedger";


const CUSTOMER_STORAGE_KEY =
  "ren-erp-customers";


/* =========================================================
   TEMİZ BAŞLANGIÇ
   Demo cari yok
========================================================= */

const defaultCustomers = [];


/* =========================================================
   CARİ TİPİ
========================================================= */

function normalizeCustomerType(
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
    value === "tedarikçi" ||
    value === "tedarikci" ||
    value === "supplier"
  ) {
    return "Tedarikçi";
  }


  return "Müşteri";
}


/* =========================================================
   CARİ KODU ÜRET
========================================================= */

function generateCustomerCode(
  customers = [],
  type = "Müşteri"
) {
  const normalizedType =
    normalizeCustomerType(
      type
    );


  const prefix =
    normalizedType ===
    "Tedarikçi"
      ? "CRT"
      : "CRM";


  let maxNumber =
    0;


  customers.forEach(
    (
      customer
    ) => {

      const code =
        String(
          customer?.code ||
          ""
        )
          .trim()
          .toLocaleUpperCase(
            "tr-TR"
          );


      const match =
        code.match(
          new RegExp(
            `^${prefix}-(\\d+)$`
          )
        );


      if (!match) {
        return;
      }


      const number =
        Number(
          match[1]
        );


      if (
        Number.isFinite(
          number
        ) &&
        number >
        maxNumber
      ) {

        maxNumber =
          number;

      }

    }
  );


  return `${prefix}-${String(
    maxNumber + 1
  ).padStart(
    4,
    "0"
  )}`;
}


/* =========================================================
   HAM VERİYİ OKU
========================================================= */

function readCustomersRaw() {

  try {

    const saved =
      localStorage.getItem(
        CUSTOMER_STORAGE_KEY
      );


    if (
      saved
    ) {

      const parsed =
        JSON.parse(
          saved
        );


      if (
        Array.isArray(
          parsed
        )
      ) {

        return parsed.map(
          (
            customer
          ) => ({

            ...customer,

            type:
              normalizeCustomerType(
                customer.type
              ),

          })
        );

      }

    }

  } catch (
    error
  ) {

    console.error(
      "REN ERP cari verileri okunamadı:",
      error
    );

  }


  return defaultCustomers;
}


/* =========================================================
   CARİLERİ GETİR
========================================================= */

export function getCustomers() {

  const customers =
    readCustomersRaw();


  return customers.map(
    (
      customer
    ) => ({

      ...customer,

      type:
        normalizeCustomerType(
          customer.type
        ),

    })
  );

}


/* =========================================================
   CARİLERİ KAYDET
========================================================= */

export function saveCustomers(
  customers
) {

  const normalized =
    (
      Array.isArray(
        customers
      )
        ? customers
        : []
    ).map(
      (
        customer
      ) => ({

        ...customer,

        type:
          normalizeCustomerType(
            customer.type
          ),

        balance:
          Number(
            customer.balance ||
            0
          ),

      })
    );


  localStorage.setItem(
    CUSTOMER_STORAGE_KEY,
    JSON.stringify(
      normalized
    )
  );


  window.dispatchEvent(
    new Event(
      "ren-customers-updated"
    )
  );


  return normalized;
}


/* =========================================================
   CARİ ID
========================================================= */

export function getCustomerById(
  id
) {

  return getCustomers().find(
    (
      customer
    ) =>
      String(
        customer.id
      ) ===
      String(
        id
      )
  );

}


/* =========================================================
   BAKİYE GÜNCELLE
========================================================= */

export function updateCustomerBalance(
  customerId,
  amount
) {

  const customers =
    readCustomersRaw();


  const updated =
    customers.map(
      (
        customer
      ) =>
        String(
          customer.id
        ) ===
        String(
          customerId
        )
          ? {

              ...customer,

              balance:
                Number(
                  customer.balance ||
                  0
                ) +
                Number(
                  amount ||
                  0
                ),

            }

          : customer
    );


  saveCustomers(
    updated
  );


  return updated;
}


/* =========================================================
   YENİ CARİ
========================================================= */

export function addCustomer(
  customer
) {

  const customers =
    readCustomersRaw();


  const type =
    normalizeCustomerType(
      customer?.type
    );


  const customCode =
    String(
      customer?.code ||
      ""
    ).trim();


  const code =
    customCode ||
    generateCustomerCode(
      customers,
      type
    );


  /*
   * Aynı kod varsa yeni kod üret.
   */

  const codeExists =
    customers.some(
      (
        existing
      ) =>
        String(
          existing.code ||
          ""
        )
          .trim()
          .toLocaleUpperCase(
            "tr-TR"
          ) ===
        code
          .trim()
          .toLocaleUpperCase(
            "tr-TR"
          )
    );


  let finalCode =
    code;


  if (
    codeExists
  ) {

    finalCode =
      generateCustomerCode(
        customers,
        type
      );

  }


  const newCustomer = {

    ...customer,

    id:
      customer?.id ??
      Date.now(),

    code:
      finalCode,

    type,

    balance:
      Number(
        customer?.balance ||
        0
      ),

    status:
      customer?.status ||
      "Aktif",

    createdAt:
      customer?.createdAt ||
      new Date().toISOString(),

  };


  const updated = [
    ...customers,
    newCustomer,
  ];


  saveCustomers(
    updated
  );


  return updated;
}


/* =========================================================
   YENİ CARİ ALIAS
========================================================= */

export function createCustomer(
  customer
) {

  const customers =
    readCustomersRaw();


  const type =
    normalizeCustomerType(
      customer?.type
    );


  const customCode =
    String(
      customer?.code ||
      ""
    ).trim();


  const code =
    customCode ||
    generateCustomerCode(
      customers,
      type
    );


  const codeExists =
    customers.some(
      (
        existing
      ) =>
        String(
          existing.code ||
          ""
        )
          .trim()
          .toLocaleUpperCase(
            "tr-TR"
          ) ===
        code
          .trim()
          .toLocaleUpperCase(
            "tr-TR"
          )
    );


  if (
    codeExists
  ) {

    throw new Error(
      "Bu cari kodu zaten kullanılıyor."
    );

  }


  const newCustomer = {

    ...customer,

    id:
      customer?.id ??
      Date.now(),

    code,

    type,

    balance:
      Number(
        customer?.balance ||
        0
      ),

    status:
      customer?.status ||
      "Aktif",

    createdAt:
      customer?.createdAt ||
      new Date().toISOString(),

  };


  const updated = [
    ...customers,
    newCustomer,
  ];


  saveCustomers(
    updated
  );


  return newCustomer;
}


/* =========================================================
   CARİ GÜNCELLE
========================================================= */

export function updateCustomer(
  customerId,
  updates
) {

  const customers =
    readCustomersRaw();


  const updated =
    customers.map(
      (
        customer
      ) =>
        String(
          customer.id
        ) ===
        String(
          customerId
        )
          ? {

              ...customer,

              ...updates,

              type:
                updates?.type !==
                undefined

                  ? normalizeCustomerType(
                      updates.type
                    )

                  : normalizeCustomerType(
                      customer.type
                    ),

            }

          : customer
    );


  saveCustomers(
    updated
  );


  return updated;
}


/* =========================================================
   CARİ SİL
========================================================= */

export function deleteCustomer(
  customerId
) {

  const customers =
    readCustomersRaw();


  const updated =
    customers.filter(
      (
        customer
      ) =>
        String(
          customer.id
        ) !==
        String(
          customerId
        )
    );


  saveCustomers(
    updated
  );


  return updated;
}


/* =========================================================
   RESET
========================================================= */

export function resetCustomers() {

  localStorage.removeItem(
    CUSTOMER_STORAGE_KEY
  );


  window.dispatchEvent(
    new Event(
      "ren-customers-updated"
    )
  );

}


/* =========================================================
   BAKİYE YENİDEN HESAP
========================================================= */

export function rebuildCustomerBalances() {

  return rebuildAllCustomerBalances();

}


/* =========================================================
   CARİ LEDGER TOPLAMLARI
========================================================= */

export function getCustomerTotals(
  customerId
) {

  try {

    return getCustomerLedgerTotals(
      customerId
    );

  } catch {

    return {
      debt: 0,
      credit: 0,
      balance: 0,
    };

  }

}


/* =========================================================
   DURUM
========================================================= */

export function getCustomerStatus(
  customer
) {

  const balance =
    Number(
      customer?.balance ||
      0
    );


  const type =
    normalizeCustomerType(
      customer?.type
    );


  if (
    Math.abs(
      balance
    ) <
    0.005
  ) {

    return "Bakiyesi Yok";

  }


  if (
    type ===
    "Tedarikçi"
  ) {

    return balance >
      0
      ? "Borçlu"
      : "Alacaklı";

  }


  return balance >
    0
    ? "Borçlu"
    : "Alacaklı";
}


/* =========================================================
   DURUM CLASS
========================================================= */

export function getCustomerStatusClass(
  customer
) {

  const status =
    getCustomerStatus(
      customer
    );


  if (
    status ===
    "Borçlu"
  ) {

    return "cari-status-borclu";

  }


  if (
    status ===
    "Alacaklı"
  ) {

    return "cari-status-alacakli";

  }


  return "cari-status-zero";
}


/* =========================================================
   DIŞARI AÇ
========================================================= */

export {
  defaultCustomers,
  generateCustomerCode,
  normalizeCustomerType,
};