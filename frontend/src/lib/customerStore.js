import {
  rebuildAllCustomerBalances,
  getCustomerLedgerTotals,
} from "./customerLedger";


const CUSTOMER_STORAGE_KEY =
  "ren-erp-customers";


const defaultCustomers = [
  {
    id: 1,
    code: "CR-0001",
    name: "Akın Ambalaj",
    type: "Müşteri",
    phone: "0532 000 00 00",
    email: "info@akinambalaj.com",
    city: "Balıkesir",
    district: "Susurluk",
    status: "Aktif",
    balance: 0,
  },

  {
    id: 2,
    code: "CR-0002",
    name: "Aykım Temizlik Maddeleri",
    type: "Tedarikçi",
    phone: "0533 000 00 00",
    email: "info@aykim.com",
    city: "Balıkesir",
    district: "Susurluk",
    status: "Aktif",
    balance: 0,
  },

  {
    id: 3,
    code: "CR-0003",
    name: "Yörsan",
    type: "Müşteri",
    phone: "0534 000 00 00",
    email: "info@yorsan.com",
    city: "Balıkesir",
    district: "Susurluk",
    status: "Aktif",
    balance: 0,
  },

  {
    id: 4,
    code: "CR-0004",
    name: "Matlı Holding",
    type: "Tedarikçi",
    phone: "0535 000 00 00",
    email: "info@matli.com",
    city: "Balıkesir",
    district: "Bandırma",
    status: "Aktif",
    balance: 0,
  },

  {
    id: 5,
    code: "CR-0005",
    name: "Susurluk Sanayi Market",
    type: "Müşteri",
    phone: "0536 000 00 00",
    email: "",
    city: "Balıkesir",
    district: "Susurluk",
    status: "Aktif",
    balance: 0,
  },
];


function normalizeCustomerType(
  type
) {
  const value =
    String(type || "")
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


function readCustomersRaw() {
  try {
    const saved =
      localStorage.getItem(
        CUSTOMER_STORAGE_KEY
      );

    if (saved) {
      const parsed =
        JSON.parse(saved);

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed.map(
          (customer) => ({
            ...customer,
            type:
              normalizeCustomerType(
                customer.type
              ),
          })
        );
      }
    }
  } catch (error) {
    console.error(
      "REN ERP cari verileri okunamadı:",
      error
    );
  }

  return defaultCustomers;
}


export function getCustomers() {
  const customers =
    readCustomersRaw();

  return customers.map(
    (customer) => ({
      ...customer,

      type:
        normalizeCustomerType(
          customer.type
        ),
    })
  );
}


export function saveCustomers(
  customers
) {
  const normalized =
    customers.map(
      (customer) => ({
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


export function getCustomerById(
  id
) {
  return getCustomers().find(
    (customer) =>
      String(
        customer.id
      ) ===
      String(id)
  );
}


export function updateCustomerBalance(
  customerId,
  amount
) {
  const customers =
    readCustomersRaw();

  const updated =
    customers.map(
      (customer) =>
        String(
          customer.id
        ) ===
        String(customerId)
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


export function addCustomer(
  customer
) {
  const customers =
    readCustomersRaw();

  const updated = [
    ...customers,
    {
      ...customer,

      type:
        normalizeCustomerType(
          customer.type
        ),
    },
  ];

  saveCustomers(
    updated
  );

  return updated;
}


export function updateCustomer(
  customerId,
  updates
) {
  const customers =
    readCustomersRaw();

  const updated =
    customers.map(
      (customer) =>
        String(
          customer.id
        ) ===
        String(customerId)
          ? {
              ...customer,
              ...updates,

              type:
                updates.type !==
                undefined
                  ? normalizeCustomerType(
                      updates.type
                    )
                  : customer.type,
            }
          : customer
    );

  saveCustomers(
    updated
  );

  return updated;
}


export function deleteCustomer(
  customerId
) {
  const customers =
    readCustomersRaw();

  const updated =
    customers.filter(
      (customer) =>
        String(
          customer.id
        ) !==
        String(customerId)
    );

  saveCustomers(
    updated
  );

  return updated;
}


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
   TEK SEFERLİK YENİDEN HESAP
========================================================= */

export function rebuildCustomerBalances() {
  return rebuildAllCustomerBalances();
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
    Math.abs(balance) <
    0.005
  ) {
    return "Bakiyesi Yok";
  }

  if (
    type ===
    "Tedarikçi"
  ) {
    return balance > 0
      ? "Borçlu"
      : "Alacaklı";
  }

  return balance > 0
    ? "Borçlu"
    : "Alacaklı";
}


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


export {
  defaultCustomers,
};