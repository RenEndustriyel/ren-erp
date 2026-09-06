/* =========================================================
   REN ERP - TEK CARİ BAKİYE MOTORU

   Kural:
   Müşteri:
     Satış       + borç
     Tahsilat    - borç
     İade        - borç

   Tedarikçi:
     Alış        + borç
     Ödeme       - borç
     İade        - borç

   Eski kayıtlarda hareket/fatura yoksa customer.balance
   güvenli bir geriye dönük yedek olarak kullanılır.
========================================================= */

function num(value) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  let text = String(value).trim().replace(/\s/g, "");
  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else {
    text = text.replace(",", ".");
  }

  const result = Number(text);
  return Number.isFinite(result) ? result : 0;
}

function typeOf(customer) {
  return String(customer?.type || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function isSupplier(customer) {
  const type = typeOf(customer);
  return type === "tedarikçi" || type === "tedarikci";
}

function movementAmount(movement) {
  return Math.max(
    num(movement?.amount),
    num(movement?.debt),
    num(movement?.credit)
  );
}

function movementEffect(movement, supplier) {
  const type = String(movement?.type || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
  const amount = movementAmount(movement);

  if (!amount) return 0;

  if (!supplier) {
    if (type === "satış" || type === "satis") return amount;
    if (type === "tahsilat") return -amount;
    if (type === "iade") return -amount;
    return num(movement?.debt) - num(movement?.credit);
  }

  if (type === "alış" || type === "alis") return amount;
  if (type === "ödeme" || type === "odeme") return -amount;
  if (type === "iade") return -amount;
  return num(movement?.credit) - num(movement?.debt);
}

function invoiceType(invoice) {
  const type = String(invoice?.type || "")
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (["purchase", "purchases", "alış", "alis", "buy"].includes(type)) {
    return "purchase";
  }
  if (["return", "returns", "iade"].includes(type)) {
    return "return";
  }
  return "sales";
}

function invoiceOutstanding(invoices, supplier) {
  let total = 0;
  let count = 0;

  invoices.forEach((invoice) => {
    const type = invoiceType(invoice);
    const gross = Math.max(0, num(invoice?.total));
    const paid = Math.max(0, num(invoice?.paidAmount));
    const remaining = Math.max(0, gross - paid);

    if (!remaining) return;

    if (!supplier && type === "sales") {
      total += remaining;
      count += 1;
    }

    if (supplier && type === "purchase") {
      total += remaining;
      count += 1;
    }

    // İade faturası açık bir karşı bakiye oluşturuyorsa azaltıcı etkiyi
    // fatura toplamından ayrıca düşmüyoruz. İade hareketi varsa hareket
    // kaynağı zaten canonical hesaplamaya dahil edilir.
  });

  return { total, count };
}

function openingBalance(customer) {
  const explicit = num(customer?.openingBalance);
  const direction = String(customer?.balanceDirection || "")
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (explicit > 0) {
    return direction === "alacak" ? -explicit : explicit;
  }

  return num(customer?.balance);
}

export function getCustomerBalanceSnapshot({ customer, movements = [], invoices = [] }) {
  const supplier = isSupplier(customer);
  const rows = Array.isArray(movements) ? movements : [];
  const invoiceRows = Array.isArray(invoices) ? invoices : [];

  const movementDebt = rows.reduce((sum, row) => sum + num(row?.debt), 0);
  const movementCredit = rows.reduce((sum, row) => sum + num(row?.credit), 0);
  const transactionBalance = rows.reduce(
    (sum, row) => sum + movementEffect(row, supplier),
    0
  );

  const hasMovementData = rows.length > 0;
  const invoiceBalance = invoiceOutstanding(invoiceRows, supplier).total;
  const hasInvoiceData = invoiceRows.length > 0;

  let balance;

  if (hasMovementData) {
    balance = transactionBalance;
  } else if (hasInvoiceData) {
    balance = invoiceBalance;
  } else {
    balance = openingBalance(customer);
  }

  const receivable = !supplier ? Math.max(0, balance) : 0;
  const payable = supplier ? Math.max(0, balance) : 0;
  const creditBalance = balance < 0 ? Math.abs(balance) : 0;

  return {
    customerId: customer?.id ?? null,
    isSupplier: supplier,
    balance,
    receivable,
    payable,
    creditBalance,
    movementDebt,
    movementCredit,
    movementBalance: transactionBalance,
    invoiceOutstanding: invoiceBalance,
    hasMovementData,
    hasInvoiceData,
  };
}

export function getCustomerReceivable(args) {
  return getCustomerBalanceSnapshot(args).receivable;
}

export function getCustomerPayable(args) {
  return getCustomerBalanceSnapshot(args).payable;
}
