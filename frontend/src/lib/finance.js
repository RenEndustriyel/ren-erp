const KEYS = {
  invoices: "ren_invoices",
  collections: "ren_collections",
  payments: "ren_payments",
};

const read = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const write = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

export const Finance = {
  getInvoices() {
    return read(KEYS.invoices);
  },

  saveInvoice(invoice) {
    const invoices = read(KEYS.invoices);
    invoices.unshift({
      ...invoice,
      id: invoice.id || Date.now(),
      createdAt: invoice.createdAt || new Date().toISOString(),
    });
    write(KEYS.invoices, invoices);
  },

  getCollections() {
    return read(KEYS.collections);
  },

  saveCollection(collection) {
    const collections = read(KEYS.collections);
    collections.unshift({
      ...collection,
      id: collection.id || Date.now(),
      createdAt: collection.createdAt || new Date().toISOString(),
    });
    write(KEYS.collections, collections);
  },

  getPayments() {
    return read(KEYS.payments);
  },

  savePayment(payment) {
    const payments = read(KEYS.payments);
    payments.unshift({
      ...payment,
      id: payment.id || Date.now(),
      createdAt: payment.createdAt || new Date().toISOString(),
    });
    write(KEYS.payments, payments);
  },

  getCustomerBalance(customerId) {
    const invoices = read(KEYS.invoices)
      .filter((i) => i.customerId === customerId)
      .reduce((t, i) => t + Number(i.total || 0), 0);

    const collections = read(KEYS.collections)
      .filter((c) => c.customerId === customerId)
      .reduce((t, c) => t + Number(c.amount || 0), 0);

    const payments = read(KEYS.payments)
      .filter((p) => p.customerId === customerId)
      .reduce((t, p) => t + Number(p.amount || 0), 0);

    return invoices - collections + payments;
  },

  getCashTotal() {
    const collections = read(KEYS.collections).reduce(
      (t, c) => t + Number(c.amount || 0),
      0
    );

    const payments = read(KEYS.payments).reduce(
      (t, p) => t + Number(p.amount || 0),
      0
    );

    return collections - payments;
  },

  getDashboard() {
    const invoices = read(KEYS.invoices);
    const collections = read(KEYS.collections);
    const payments = read(KEYS.payments);

    const sales = invoices.reduce((t, i) => t + Number(i.total || 0), 0);
    const collected = collections.reduce(
      (t, c) => t + Number(c.amount || 0),
      0
    );
    const paid = payments.reduce((t, p) => t + Number(p.amount || 0), 0);

    return {
      sales,
      collected,
      paid,
      receivable: sales - collected,
      cash: collected - paid,
      invoiceCount: invoices.length,
    };
  },
};
