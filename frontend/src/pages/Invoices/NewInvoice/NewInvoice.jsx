import { useEffect, useMemo, useState } from "react";
import {
  MdAdd,
  MdArrowBack,
  MdDeleteOutline,
  MdPictureAsPdf,
  MdPrint,
  MdSave,
  MdSearch,
  MdPayments,
  MdEdit,
} from "react-icons/md";

import {
  getInvoices,
  addInvoice,
  updateInvoice,
  getNextInvoiceNumber,
  deleteInvoice,
} from "../../../lib/invoiceStore";

import {
  getCustomers,
  createCustomer,
  updateCustomerBalance,
} from "../../../lib/customerStore";

import {
  getProducts,
  createProduct,
  changeStock,
  updateProduct,
  addProductPriceHistory,
} from "../../../lib/stockStore";

import { Finance } from "../../../lib/finance";

import "./NewInvoice.css";


/* =========================================================
   YARDIMCILAR
========================================================= */

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function numberValue(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = String(value).trim();

  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  const result = Number(text);
  return Number.isFinite(result) ? result : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function datePlusDays(baseDate, days) {
  const date = new Date(`${baseDate || today()}T12:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function normalizeType(type) {
  const value = String(type || "").trim().toLowerCase();

  if (
    value === "purchase" ||
    value === "purchases" ||
    value === "buy" ||
    value === "alış" ||
    value === "alis"
  ) {
    return "purchase";
  }

  if (
    value === "return" ||
    value === "returns" ||
    value === "iade"
  ) {
    return "return";
  }

  return "sales";
}

function getTypeTitle(type) {
  if (type === "purchase") return "Yeni Alış Faturası";
  if (type === "return") return "Yeni İade Faturası";
  return "Yeni Satış Faturası";
}

function productName(product) {
  return (
    product?.name ||
    product?.productName ||
    product?.title ||
    ""
  );
}

function productCode(product) {
  return (
    product?.code ||
    product?.stockCode ||
    product?.barcode ||
    ""
  );
}

function productUnit(product) {
  return product?.unit || product?.unitName || "Adet";
}

function productPurchasePrice(product) {
  return numberValue(
    product?.purchaseNet ??
      product?.purchasePrice ??
      product?.buyPrice ??
      product?.cost ??
      0
  );
}

function productSalePrice(product) {
  return numberValue(
    product?.salesNet ??
      product?.salePrice ??
      product?.sellingPrice ??
      product?.price ??
      0
  );
}

function productVat(product) {
  return numberValue(
    product?.salesVat ??
      product?.vatRate ??
      product?.vat ??
      20
  );
}

function customerDisplayName(customer) {
  return (
    customer?.name ||
    customer?.title ||
    customer?.companyName ||
    customer?.unvan ||
    customer?.firmaAdi ||
    ""
  );
}

function customerBalanceValue(customer) {
  const candidates = [
    customer?.balance,
    customer?.currentBalance,
    customer?.current_balance,
    customer?.balanceAmount,
    customer?.cariBalance,
    customer?.debitBalance,
  ];

  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }

  return 0;
}

function createItem() {
  return {
    id: `INV-ITEM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: "",
    productName: "",
    productCode: "",
    quantity: 1,
    unit: "Adet",
    unitPrice: "",
    vatRate: 20,
    discount1: 0,
    discount2: 0,
    discount3: 0,
  };
}


function pdfSafeText(value) {
  const map = {
    "ç": "c", "Ç": "C",
    "ğ": "g", "Ğ": "G",
    "ı": "i", "İ": "I",
    "ö": "o", "Ö": "O",
    "ş": "s", "Ş": "S",
    "ü": "u", "Ü": "U",
    "€": "EUR", "₺": "TL",
    "—": "-", "–": "-",
    "•": "-", "’": "'",
    "“": '"', "”": '"',
  };

  return String(value ?? "")
    .replace(/[çÇğĞıİöÖşŞüÜ€₺—–•’“”]/g, (char) => map[char] || "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function pdfEscape(value) {
  return pdfSafeText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function pdfWrap(text, maxChars = 92) {
  const clean = pdfSafeText(text);
  if (!clean) return [""];
  const words = clean.split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    if (!line) {
      line = word;
      return;
    }

    const candidate = `${line} ${word}`;

    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function buildSimpleInvoicePdf({
  invoiceType,
  invoiceNo,
  invoiceDate,
  dueDate,
  customer,
  paymentMethod,
  paymentSubMethod,
  paymentAccountName,
  calculatedItems,
  totals,
  notes,
  existingCustomerBalance,
  displayCustomerBalance,
}) {
  const typeText =
    invoiceType === "purchase"
      ? "ALIS NOTU"
      : invoiceType === "return"
      ? "IADE NOTU"
      : "SATIS NOTU";

  const customerName = customerDisplayName(customer) || "-";
  const lines = [];

  lines.push("REN ENDUSTRIYEL");
  lines.push("Endustriyel Temizlik Urunleri");
  lines.push(typeText);
  lines.push(`Cari: ${customerName}`);
  lines.push(`Tarih: ${invoiceDate || "-"}`);
  lines.push(`No: ${invoiceNo || "-"}`);
  if (dueDate) lines.push(`Vade: ${dueDate}`);
  if (paymentMethod === "Peşin") {
    const p = paymentSubMethod || "Pesin";
    const a = paymentAccountName ? ` - ${paymentAccountName}` : "";
    lines.push(`Odeme: ${pdfSafeText(p)}${pdfSafeText(a)}`);
  } else {
    lines.push("Odeme: Vadeli");
  }

  lines.push("");
  lines.push("Aciklama                         Miktar   Fiyat       Indirim (%)   Tutar (KDV Haric)");
  lines.push("-".repeat(92));

  calculatedItems.forEach((item, index) => {
    const name = pdfSafeText(item.productName || "-").slice(0, 32);
    const qty = `${money(item.quantity)} ${pdfSafeText(item.unit || "ad")}`.slice(0, 12);
    const price = `${money(item.unitPrice)} TL`;
    const discountPercent = numberValue(item.discount1) + numberValue(item.discount2) + numberValue(item.discount3);
    const discount = `%${money(discountPercent)}`;
    const total = `${money(item.lineNet)} TL`;
    lines.push(`${String(index + 1).padEnd(3)} ${name.padEnd(32)} ${qty.padStart(12)} ${price.padStart(12)} ${discount.padStart(12)} ${total.padStart(18)}`);
  });

  lines.push("-".repeat(92));
  lines.push(`Net:           ${money(totals.subtotal)} TL`);
  lines.push(`KDV:           ${money(totals.vat)} TL`);
  lines.push(`Toplam:        ${money(totals.total)} TL`);
  lines.push(`Onceki Bakiye: ${money(existingCustomerBalance)} TL`);
  lines.push(`Guncel Bakiye: ${money(displayCustomerBalance)} TL`);

  if (notes) {
    lines.push("");
    lines.push("Not:");
    lines.push(...pdfWrap(notes, 92));
  }
  lines.push("");
  lines.push("Tesekkur ederiz.");

  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const left = 42;
  const startY = 804;
  const lineHeight = 13;
  const bottom = 42;
  const maxLines = Math.floor((startY - bottom) / lineHeight);

  const pageLines = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    pageLines.push(lines.slice(i, i + maxLines));
  }

  const objects = [];
  const addObject = (body) => { objects.push(body); return objects.length; };
  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pageObjectNumbers = [];
  const fontObjectNumber = 3;
  const firstPageObject = 4;
  const firstContentObject = firstPageObject + pageLines.length;
  pageLines.forEach((_, index) => pageObjectNumbers.push(firstPageObject + index));
  addObject(`<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageLines.length} >>`);
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
  pageLines.forEach((_, index) => {
    const contentNumber = firstContentObject + index;
    addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentNumber} 0 R >>`);
  });
  pageLines.forEach((page) => {
    const commands = ["BT", "/F1 9 Tf", `${left} ${startY} Td`];
    page.forEach((line, index) => {
      if (index > 0) commands.push(`0 -${lineHeight} Td`);
      commands.push(`(${pdfEscape(line)}) Tj`);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function getLocalAccounts() {
  const keys = [
    "ren-finance-accounts",
    "ren-financial-accounts",
    "ren-cash-bank-accounts",
    "ren-cashbank-accounts",
    "cashBankAccounts",
    "cash_bank_accounts",
  ];

  for (const key of keys) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(parsed) && parsed.length) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.accounts) && parsed.accounts.length) {
        return parsed.accounts;
      }
    } catch {
      // Ignore malformed optional account storage.
    }
  }

  return [
    { id: "cash-main", name: "Ana Kasa", type: "cash" },
    { id: "cash-shop", name: "Dükkan Kasası", type: "cash" },
    { id: "bank-ziraat", name: "Ziraat Bankası", type: "bank" },
    { id: "bank-garanti", name: "Garanti BBVA", type: "bank" },
    { id: "bank-odeal", name: "Ödeal POS", type: "bank" },
  ];
}

function getAccountName(account) {
  return (
    account?.name ||
    account?.title ||
    account?.accountName ||
    account?.bankName ||
    ""
  );
}

function getAccountType(account) {
  const raw = String(
    account?.type ||
      account?.accountType ||
      account?.kind ||
      ""
  ).toLowerCase();

  if (
    raw.includes("cash") ||
    raw.includes("kasa") ||
    raw.includes("nakit")
  ) {
    return "cash";
  }

  return "bank";
}

function getPaymentSubMethod(method) {
  if (method === "Nakit") return "Nakit";
  if (method === "Kredi Kartı") return "Kredi Kartı";
  if (method === "Havale / EFT") return "Havale / EFT";
  return "";
}


/* =========================================================
   COMPONENT
========================================================= */

export default function NewInvoice() {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const queryType = params.get("type");

  const [invoiceType, setInvoiceType] = useState(
    normalizeType(queryType)
  );

  const [customers, setCustomers] = useState(() => getCustomers() || []);
  const [products, setProducts] = useState(() => getProducts() || []);
  const [accounts, setAccounts] = useState(() => getLocalAccounts());

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [invoiceNo, setInvoiceNo] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Vadeli");
  const [paymentSubMethod, setPaymentSubMethod] = useState("");
  const [paymentAccountType, setPaymentAccountType] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentAccountName, setPaymentAccountName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([createItem()]);
  const [stockTracking, setStockTracking] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    taxNumber: "",
  });

  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProductTargetId, setNewProductTargetId] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    unit: "Adet",
    purchasePrice: "",
    salePrice: "",
    vatRate: 20,
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const [originalItems, setOriginalItems] = useState([]);
  const [originalInvoiceType, setOriginalInvoiceType] = useState("");
  const [duePreset, setDuePreset] = useState("");


  /* =========================================================
     YENİ FATURA NUMARASI
  ========================================================= */

  useEffect(() => {
    if (editId) return;

    setInvoiceNo(
      getNextInvoiceNumber(normalizeType(invoiceType))
    );
  }, [invoiceType, editId]);


  /* =========================================================
     DIŞ VERİ YENİLEME
  ========================================================= */

  useEffect(() => {
    const refresh = () => {
      setCustomers(getCustomers() || []);
      setProducts(getProducts() || []);
      setAccounts(getLocalAccounts());
    };

    window.addEventListener("ren-customers-updated", refresh);
    window.addEventListener("ren-products-changed", refresh);
    window.addEventListener("ren-stock-updated", refresh);
    window.addEventListener("ren-finance-updated", refresh);

    return () => {
      window.removeEventListener("ren-customers-updated", refresh);
      window.removeEventListener("ren-products-changed", refresh);
      window.removeEventListener("ren-stock-updated", refresh);
      window.removeEventListener("ren-finance-updated", refresh);
    };
  }, []);


  /* =========================================================
     MEVCUT FATURAYI YÜKLE
  ========================================================= */

  useEffect(() => {
    if (!editId) return;

    const invoice = getInvoices().find(
      (item) => String(item.id) === String(editId)
    );

    if (!invoice) return;

    const type = normalizeType(invoice.type);

    setInvoiceType(type);
    setOriginalInvoiceType(type);
    setInvoiceNo(invoice.invoiceNo || "");
    setInvoiceDate(invoice.date || today());
    setDueDate(invoice.dueDate || today());
    setPaymentMethod(invoice.paymentMethod || "Vadeli");

    setPaymentSubMethod(
      invoice.paymentSubMethod ||
        getPaymentSubMethod(invoice.paymentMethod)
    );

    setPaymentAccountType(
      invoice.paymentAccountType || ""
    );

    setPaymentAccountId(
      invoice.paymentAccountId || ""
    );

    setPaymentAccountName(
      invoice.paymentAccountName || ""
    );

    setPaymentReference(
      invoice.paymentReference || ""
    );

    setNotes(invoice.notes || "");
    setStockTracking(invoice.stockTracking !== false);

    const customer = (getCustomers() || []).find(
      (item) =>
        String(item.id) ===
        String(invoice.customerId || invoice.supplierId)
    );

    if (customer) {
      setSelectedCustomer(customer);
    } else if (invoice.customerName || invoice.supplierName) {
      setSelectedCustomer({
        id:
          invoice.customerId ||
          invoice.supplierId ||
          `legacy-${Date.now()}`,
        name:
          invoice.customerName ||
          invoice.supplierName ||
          "",
        code:
          invoice.customerCode ||
          invoice.supplierCode ||
          "",
      });
    }

    const loadedItems = Array.isArray(invoice.items)
      ? invoice.items.map((item, index) => ({
          id:
            item.id ||
            `INV-EDIT-${index}-${Date.now()}`,
          productId: item.productId || "",
          productName:
            item.productName ||
            item.name ||
            "",
          productCode:
            item.productCode ||
            item.code ||
            "",
          quantity:
            numberValue(item.quantity) || 1,
          unit:
            item.unit ||
            "Adet",
          unitPrice:
            numberValue(
              item.unitPrice ??
                item.price
            ),
          vatRate:
            numberValue(
              item.vatRate ??
                item.vat ??
                20
            ),
          discount1:
            numberValue(
              item.discount1 ??
                item.discount ??
                item.discountPercent ??
                0
            ),
          discount2:
            numberValue(item.discount2),
          discount3:
            numberValue(item.discount3),
        }))
      : [];

    const safeItems =
      loadedItems.length
        ? loadedItems
        : [createItem()];

    setItems(safeItems);
    setOriginalItems(
      safeItems.map((item) => ({ ...item }))
    );
  }, [editId]);


  /* =========================================================
     CARİ ARAMA
  ========================================================= */

  const customerResults = useMemo(() => {
    const q = customerSearch
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!q) return [];

    return customers
      .filter((customer) => {
        const name = customerDisplayName(customer)
          .toLocaleLowerCase("tr-TR");

        const code = String(customer.code || "")
          .toLocaleLowerCase("tr-TR");

        return name.includes(q) || code.includes(q);
      })
      .slice(0, 8);
  }, [customers, customerSearch]);


  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
  };


  const openNewCustomer = () => {
    setNewCustomer({
      name: customerSearch.trim(),
      phone: "",
      taxNumber: "",
    });

    setNewCustomerOpen(true);
  };


  const saveNewCustomer = () => {
    const name = String(newCustomer.name || "").trim();

    if (!name) {
      window.alert("Cari adı boş olamaz.");
      return;
    }

    try {
      const created = createCustomer({
        name,
        phone: newCustomer.phone || "",
        taxNumber: newCustomer.taxNumber || "",
        type:
          invoiceType === "purchase"
            ? "Tedarikçi"
            : "Müşteri",
      });

      setCustomers(getCustomers() || []);
      setSelectedCustomer(created);
      setCustomerSearch("");
      setNewCustomerOpen(false);
    } catch (error) {
      window.alert(
        error?.message || "Cari oluşturulamadı."
      );
    }
  };


  /* =========================================================
     ÜRÜNLER
  ========================================================= */

  const updateItem = (id, field, value) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );
  };


  const addEmptyLine = () => {
    setItems((current) => [
      ...current,
      createItem(),
    ]);
  };


  const removeItem = (id) => {
    setItems((current) => {
      const next = current.filter(
        (item) => item.id !== id
      );

      return next.length
        ? next
        : [createItem()];
    });
  };


  const changeLineProduct = (itemId, productId) => {
    if (!productId) {
      setItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                productId: "",
                productCode: "",
                productName: "",
              }
            : item
        )
      );
      return;
    }

    const product = products.find(
      (item) =>
        String(item.id) === String(productId)
    );

    if (!product) return;

    const price =
      invoiceType === "purchase"
        ? productPurchasePrice(product)
        : productSalePrice(product);

    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: product.id,
              productName: productName(product),
              productCode: productCode(product),
              unit: productUnit(product),
              unitPrice: price,
              vatRate: productVat(product),
            }
          : item
      )
    );
  };


  const openNewProduct = (
    itemId,
    initialName = ""
  ) => {
    const item = items.find(
      (entry) => entry.id === itemId
    );

    setNewProduct({
      name:
        initialName ||
        item?.productName ||
        "",
      code: item?.productCode || "",
      unit: item?.unit || "Adet",
      purchasePrice:
        invoiceType === "purchase"
          ? item?.unitPrice || ""
          : "",
      salePrice:
        invoiceType === "sales"
          ? item?.unitPrice || ""
          : "",
      vatRate: item?.vatRate ?? 20,
    });

    setNewProductTargetId(itemId);
    setNewProductOpen(true);
  };


  const saveNewProduct = () => {
    const name = String(newProduct.name || "").trim();

    if (!name) {
      window.alert("Ürün adı boş olamaz.");
      return;
    }

    const code =
      String(newProduct.code || "").trim() ||
      `FAT-${Date.now()}`;

    try {
      const product = createProduct({
        name,
        code,
        barcode: code,
        unit: newProduct.unit || "Adet",

        purchaseNet:
          numberValue(
            newProduct.purchasePrice
          ),

        purchaseGross:
          numberValue(
            newProduct.purchasePrice
          ) *
          (1 +
            numberValue(newProduct.vatRate) /
              100),

        purchaseVat:
          numberValue(newProduct.vatRate),

        salesNet:
          numberValue(
            newProduct.salePrice
          ),

        salesGross:
          numberValue(
            newProduct.salePrice
          ) *
          (1 +
            numberValue(newProduct.vatRate) /
              100),

        salesVat:
          numberValue(newProduct.vatRate),

        openingStock: 0,
        stockTracking: true,
        active: true,
      });

      setProducts(getProducts() || []);

      setItems((current) =>
        current.map((item) =>
          item.id === newProductTargetId
            ? {
                ...item,
                productId: product.id,
                productName: product.name,
                productCode: product.code,
                unit:
                  product.unit ||
                  "Adet",
                unitPrice:
                  invoiceType === "purchase"
                    ? numberValue(
                        newProduct.purchasePrice
                      )
                    : numberValue(
                        newProduct.salePrice
                      ),
                vatRate:
                  numberValue(
                    newProduct.vatRate
                  ),
              }
            : item
        )
      );

      setNewProductOpen(false);
      setNewProductTargetId("");

      setNewProduct({
        name: "",
        code: "",
        unit: "Adet",
        purchasePrice: "",
        salePrice: "",
        vatRate: 20,
      });
    } catch (error) {
      window.alert(
        error?.message ||
          "Ürün oluşturulamadı."
      );
    }
  };


  const productMatches = (query) => {
    const q = String(query || "")
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!q) return [];

    return products
      .filter((product) => {
        const name = productName(product)
          .toLocaleLowerCase("tr-TR");

        const code = productCode(product)
          .toLocaleLowerCase("tr-TR");

        return (
          name.includes(q) ||
          code.includes(q)
        );
      })
      .slice(0, 6);
  };


  /* =========================================================
     HESAPLAMA
  ========================================================= */

  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      const quantity =
        Math.max(
          0,
          numberValue(item.quantity)
        );

      const unitPrice =
        Math.max(
          0,
          numberValue(item.unitPrice)
        );

      const gross =
        quantity * unitPrice;

      const d1 = Math.min(
        100,
        Math.max(
          0,
          numberValue(
            item.discount1 ??
              item.discount
          )
        )
      );

      const d2 = Math.min(
        100,
        Math.max(
          0,
          numberValue(item.discount2)
        )
      );

      const d3 = Math.min(
        100,
        Math.max(
          0,
          numberValue(item.discount3)
        )
      );

      const after1 =
        gross * (1 - d1 / 100);

      const after2 =
        after1 * (1 - d2 / 100);

      const net =
        Math.max(
          0,
          after2 * (1 - d3 / 100)
        );

      const vatRate =
        Math.max(
          0,
          numberValue(item.vatRate)
        );

      const vat =
        net * vatRate / 100;

      return {
        ...item,
        quantity,
        unitPrice,
        discount1: d1,
        discount2: d2,
        discount3: d3,
        lineGross: gross,
        lineDiscount: gross - net,
        lineNet: net,
        lineVat: vat,
        lineTotal: net + vat,
      };
    });
  }, [items]);


  const totals = useMemo(() => {
    const subtotal =
      calculatedItems.reduce(
        (sum, item) =>
          sum + item.lineNet,
        0
      );

    const vat =
      calculatedItems.reduce(
        (sum, item) =>
          sum + item.lineVat,
        0
      );

    const discount =
      calculatedItems.reduce(
        (sum, item) =>
          sum + item.lineDiscount,
        0
      );

    return {
      subtotal,
      discount,
      vat,
      total: subtotal + vat,
    };
  }, [calculatedItems]);


  const remainingBalance =
    Math.max(
      0,
      totals.total -
        numberValue(
          editId
            ? getInvoices().find(
                (item) =>
                  String(item.id) ===
                  String(editId)
              )?.paidAmount || 0
            : 0
        )
    );


  /* =========================================================
     YAZDIRMA BAKİYE
  ========================================================= */

  const existingCustomerBalance =
    customerBalanceValue(selectedCustomer);

  const existingInvoice =
    editId
      ? getInvoices().find(
          (item) =>
            String(item.id) ===
            String(editId)
        )
      : null;

  const existingInvoiceEffect =
    existingInvoice
      ? normalizeType(existingInvoice.type) === "purchase"
        ? -numberValue(existingInvoice.total)
        : numberValue(existingInvoice.total)
      : 0;

  const currentInvoiceEffect =
    invoiceType === "purchase"
      ? -totals.total
      : totals.total;

  const projectedCustomerBalance =
    existingInvoice
      ? existingCustomerBalance - existingInvoiceEffect + currentInvoiceEffect
      : existingCustomerBalance + currentInvoiceEffect;

  const displayCustomerBalance =
    paymentMethod === "Peşin"
      ? projectedCustomerBalance
      : projectedCustomerBalance;


  /* =========================================================
     VADE
  ========================================================= */

  const chooseDuePreset = (days) => {
    const nextDate =
      datePlusDays(
        invoiceDate,
        days
      );

    setDuePreset(String(days));
    setDueDate(nextDate);
  };


  useEffect(() => {
    const difference =
      Math.round(
        (
          new Date(
            `${dueDate}T12:00:00`
          ).getTime() -
          new Date(
            `${invoiceDate}T12:00:00`
          ).getTime()
        ) /
          86400000
      );

    if ([0, 7, 14, 30, 60].includes(difference)) {
      setDuePreset(String(difference));
    } else {
      setDuePreset("");
    }
  }, [invoiceDate, dueDate]);


  /* =========================================================
     ÖDEME
  ========================================================= */

  const setCashPayment = () => {
    setPaymentMethod("Peşin");
    setPaymentSubMethod("Nakit");
    setPaymentAccountType("cash");
    setPaymentAccountId("");
    setPaymentAccountName("");
  };


  const setCardPayment = () => {
    setPaymentMethod("Peşin");
    setPaymentSubMethod("Kredi Kartı");
    setPaymentAccountType("bank");
    setPaymentAccountId("");
    setPaymentAccountName("");
  };


  const setTransferPayment = () => {
    setPaymentMethod("Peşin");
    setPaymentSubMethod("Havale / EFT");
    setPaymentAccountType("bank");
    setPaymentAccountId("");
    setPaymentAccountName("");
  };


  const selectAccount = (accountId) => {
    const account = accounts.find(
      (entry) =>
        String(entry.id) ===
        String(accountId)
    );

    setPaymentAccountId(accountId || "");

    setPaymentAccountName(
      account
        ? getAccountName(account)
        : ""
    );
  };


  const visibleAccounts = useMemo(() => {
    if (!paymentAccountType) return [];

    return accounts.filter(
      (account) =>
        getAccountType(account) ===
        paymentAccountType
    );
  }, [
    accounts,
    paymentAccountType,
  ]);


  /* =========================================================
     STOK FİYAT HİSTORY
  ========================================================= */

  const savePriceChanges = (invoiceItems) => {
    invoiceItems.forEach((item) => {
      if (!item.productId) return;

      const product = products.find(
        (entry) =>
          String(entry.id) ===
          String(item.productId)
      );

      if (!product) return;

      if (invoiceType === "purchase") {
        if (
          Math.abs(
            productPurchasePrice(product) -
              numberValue(item.unitPrice)
          ) > 0.005
        ) {
          updateProduct(product.id, {
            purchaseNet:
              numberValue(item.unitPrice),
            purchaseGross:
              numberValue(item.unitPrice) *
              (
                1 +
                numberValue(
                  product.purchaseVat
                ) /
                  100
              ),
          });

          addProductPriceHistory({
            productId: product.id,
            productCode:
              productCode(product),
            productName:
              productName(product),
            priceType: "purchase",
            oldPrice:
              productPurchasePrice(
                product
              ),
            newPrice:
              numberValue(
                item.unitPrice
              ),
            supplierId:
              selectedCustomer?.id ||
              "",
            supplierName:
              customerDisplayName(
                selectedCustomer
              ),
            invoiceId:
              editId || "",
            invoiceNo,
            date: invoiceDate,
          });
        }
      } else {
        if (
          Math.abs(
            productSalePrice(product) -
              numberValue(item.unitPrice)
          ) > 0.005
        ) {
          updateProduct(product.id, {
            salesNet:
              numberValue(item.unitPrice),
            salesGross:
              numberValue(item.unitPrice) *
              (
                1 +
                numberValue(
                  product.salesVat
                ) /
                  100
              ),
          });

          addProductPriceHistory({
            productId: product.id,
            productCode:
              productCode(product),
            productName:
              productName(product),
            priceType: "sales",
            oldPrice:
              productSalePrice(
                product
              ),
            newPrice:
              numberValue(
                item.unitPrice
              ),
            invoiceId:
              editId || "",
            invoiceNo,
            date: invoiceDate,
          });
        }
      }
    });
  };


  /* =========================================================
     STOK HAREKETİ
  ========================================================= */

  const stockSign = (type) => {
    if (type === "sales") return -1;
    return 1;
  };


  const applyNewInvoiceStock = (savedInvoice) => {
    if (!stockTracking) return;

    calculatedItems.forEach((item) => {
      if (
        !item.productId ||
        item.quantity <= 0
      ) {
        return;
      }

      const amount =
        item.quantity *
        stockSign(
          invoiceType
        );

      const movementType =
        invoiceType === "purchase"
          ? "Alış Faturası"
          : invoiceType === "return"
          ? "İade Faturası"
          : "Satış Faturası";

      changeStock(
        item.productId,
        amount,
        {
          type: movementType,
          source: "Fatura",
          sourceId: savedInvoice.id,
          description:
            `${savedInvoice.invoiceNo} numaralı ${movementType.toLowerCase()}.`,
        }
      );
    });
  };


  const applyEditedInvoiceStock = (savedInvoice) => {
    if (!stockTracking) return;

    const oldMap = new Map();

    originalItems.forEach((item) => {
      if (!item.productId) return;

      oldMap.set(
        String(item.productId),
        (
          oldMap.get(
            String(item.productId)
          ) || 0
        ) +
          numberValue(
            item.quantity
          )
      );
    });

    const newMap = new Map();

    calculatedItems.forEach((item) => {
      if (!item.productId) return;

      newMap.set(
        String(item.productId),
        (
          newMap.get(
            String(item.productId)
          ) || 0
        ) +
          numberValue(
            item.quantity
          )
      );
    });

    const ids = new Set([
      ...oldMap.keys(),
      ...newMap.keys(),
    ]);

    ids.forEach((productId) => {
      const oldQty =
        oldMap.get(productId) || 0;

      const newQty =
        newMap.get(productId) || 0;

      const delta =
        newQty - oldQty;

      if (Math.abs(delta) < 0.000001) {
        return;
      }

      const amount =
        delta *
        stockSign(
          invoiceType
        );

      const movementType =
        invoiceType === "purchase"
          ? "Alış Faturası Düzeltme"
          : invoiceType === "return"
          ? "İade Faturası Düzeltme"
          : "Satış Faturası Düzeltme";

      changeStock(
        productId,
        amount,
        {
          type: movementType,
          source: "Fatura Düzenleme",
          sourceId:
            savedInvoice.id,
          description:
            `${savedInvoice.invoiceNo} faturasının miktar değişikliği.`,
        }
      );
    });
  };


  /* =========================================================
     CARİ
  ========================================================= */

  const applyCariForNewInvoice = () => {
    if (!selectedCustomer) return;
    if (paymentMethod !== "Vadeli") return;

    if (invoiceType === "sales") {
      updateCustomerBalance(
        selectedCustomer.id,
        -totals.total
      );
    }

    if (invoiceType === "purchase") {
      updateCustomerBalance(
        selectedCustomer.id,
        totals.total
      );
    }

    if (invoiceType === "return") {
      updateCustomerBalance(
        selectedCustomer.id,
        totals.total
      );
    }
  };


  /* =========================================================
     SİL
  ========================================================= */

  const handleDelete = () => {
    if (!editId) {
      window.alert(
        "Silinecek kayıt henüz kaydedilmedi."
      );
      return;
    }

    const current =
      getInvoices().find(
        (item) =>
          String(item.id) ===
          String(editId)
      );

    if (!current) {
      window.alert(
        "Fatura bulunamadı."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `${current.invoiceNo || "Bu fatura"} silinsin mi?`
      );

    if (!confirmed) return;

    try {
      deleteInvoice(current.id);
      window.dispatchEvent(
        new Event("ren-invoices-updated")
      );

      window.location.href =
        "/invoices";
    } catch (error) {
      console.error(error);

      window.alert(
        error?.message ||
          "Fatura silinemedi."
      );
    }
  };


  /* =========================================================
     YAZDIR / PDF
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = () => {
    const pdfBytes = buildSimpleInvoicePdf({
      invoiceType,
      invoiceNo,
      invoiceDate,
      dueDate,
      customer: selectedCustomer,
      paymentMethod,
      paymentSubMethod,
      paymentAccountName,
      calculatedItems,
      totals,
      notes,
      existingCustomerBalance,
      displayCustomerBalance,
    });

    const blob = new Blob(
      [pdfBytes],
      { type: "application/pdf" }
    );

    const url =
      URL.createObjectURL(blob);

    const pdfWindow =
      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    if (!pdfWindow) {
      const link =
        document.createElement("a");

      link.href = url;
      link.target = "_blank";
      link.rel =
        "noopener,noreferrer";
      link.click();
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  };


  /* =========================================================
     TAHSİLAT
  ========================================================= */

  const handleOpenPayment = () => {
    setPaymentAmount(
      remainingBalance > 0
        ? remainingBalance.toFixed(2)
        : totals.total.toFixed(2)
    );

    setPaymentNote("");
    setPaymentModalOpen(true);
  };


  const handleSavePayment = () => {
    const amount =
      numberValue(paymentAmount);

    if (!amount || amount <= 0) {
      window.alert(
        "Tahsilat tutarını girin."
      );
      return;
    }

    if (amount > totals.total) {
      window.alert(
        "Tahsilat faturanın toplamından büyük olamaz."
      );
      return;
    }

    const current =
      editId
        ? getInvoices().find(
            (item) =>
              String(item.id) ===
              String(editId)
          )
        : null;

    if (!current) {
      window.alert(
        "Önce faturayı kaydedin."
      );
      return;
    }

    const existingPaid =
      numberValue(
        current.paidAmount
      );

    const newPaid =
      existingPaid + amount;

    const status =
      newPaid >= numberValue(current.total)
        ? "paid"
        : "partial";

    const paymentEntry = {
      id: `PAY-${Date.now()}`,
      invoiceId: current.id,
      invoiceNo:
        current.invoiceNo || "",
      date: today(),
      amount,
      method:
        paymentSubMethod ||
        "Nakit",
      accountType:
        paymentAccountType ||
        "",
      accountId:
        paymentAccountId ||
        "",
      accountName:
        paymentAccountName ||
        "",
      note:
        paymentNote.trim(),
    };

    const updated = {
      ...current,
      paidAmount: newPaid,
      paymentStatus:
        status === "paid"
          ? invoiceType === "purchase"
            ? "Ödendi"
            : "Tahsil Edildi"
          : "Kısmi Ödendi",
      status,
      lastPayment:
        paymentEntry,
      payments: [
        ...(Array.isArray(
          current.payments
        )
          ? current.payments
          : []),
        paymentEntry,
      ],
      updatedAt:
        new Date().toISOString(),
    };

    updateInvoice(
      current.id,
      updated
    );

    window.dispatchEvent(
      new Event("ren-invoices-updated")
    );

    window.dispatchEvent(
      new Event("ren-finance-updated")
    );

    setPaymentModalOpen(false);

    window.alert(
      `${money(amount)} ₺ tahsilat/ödeme kaydedildi.`
    );
  };


  /* =========================================================
     KAYDET
  ========================================================= */

  const handleSave = () => {
    if (saving) return;

    if (!selectedCustomer) {
      window.alert(
        invoiceType === "purchase"
          ? "Lütfen tedarikçi seçin."
          : "Lütfen müşteri seçin."
      );
      return;
    }

    if (!invoiceNo.trim()) {
      window.alert(
        "Fatura numarası girin."
      );
      return;
    }

    if (!invoiceDate) {
      window.alert(
        "Fatura tarihini girin."
      );
      return;
    }

    const invalidName =
      calculatedItems.find(
        (item) =>
          String(
            item.productName || ""
          ).trim() &&
          !item.productId
      );

    if (invalidName) {
      openNewProduct(
        invalidName.id,
        invalidName.productName
      );

      window.alert(
        `"${invalidName.productName}" stok kartına bağlı değil. Önce ürünü oluşturun.`
      );

      return;
    }

    const validItems =
      calculatedItems.filter(
        (item) =>
          item.productId &&
          item.quantity > 0
      );

    if (!validItems.length) {
      window.alert(
        "Faturaya en az bir ürün ekleyin."
      );
      return;
    }

    if (totals.total <= 0) {
      window.alert(
        "Fatura toplamı 0 TL olamaz."
      );
      return;
    }

    if (
      paymentMethod === "Peşin" &&
      !paymentSubMethod
    ) {
      window.alert(
        "Peşin ödeme için Nakit, Kredi Kartı veya Havale / EFT seçin."
      );
      return;
    }

    if (
      paymentMethod === "Peşin" &&
      !paymentAccountName
    ) {
      window.alert(
        "Peşin ödeme için Kasa veya Banka hesabı seçin."
      );
      return;
    }

    setSaving(true);

    try {
      const type =
        normalizeType(
          invoiceType
        );

      savePriceChanges(
        validItems
      );

      const previous =
        editId
          ? getInvoices().find(
              (item) =>
                String(item.id) ===
                String(editId)
            )
          : null;

      const invoiceData = {
        ...(previous || {}),

        type,
        invoiceNo:
          invoiceNo.trim(),
        date: invoiceDate,
        dueDate,

        customerId:
          selectedCustomer.id,
        customerName:
          customerDisplayName(
            selectedCustomer
          ),
        customerCode:
          selectedCustomer.code ||
          "",

        supplierId:
          type === "purchase"
            ? selectedCustomer.id
            : "",

        supplierName:
          type === "purchase"
            ? customerDisplayName(
                selectedCustomer
              )
            : "",

        supplierCode:
          type === "purchase"
            ? selectedCustomer.code ||
              ""
            : "",

        paymentMethod,
        paymentSubMethod,
        paymentAccountType,
        paymentAccountId,
        paymentAccountName,
        paymentReference,

        paymentStatus:
          paymentMethod === "Peşin"
            ? "Ödendi"
            : previous?.paymentStatus ||
              "Bekliyor",

        status:
          previous?.status ||
          (
            paymentMethod === "Peşin"
              ? "paid"
              : "open"
          ),

        stockTracking,

        items: validItems.map(
          (item) => ({
            id: item.id,
            productId:
              item.productId,
            productName:
              item.productName,
            productCode:
              item.productCode,
            unit: item.unit,
            quantity:
              item.quantity,
            unitPrice:
              item.unitPrice,
            vatRate:
              item.vatRate,
            discount1:
              item.discount1,
            discount2:
              item.discount2,
            discount3:
              item.discount3,
            discount:
              item.lineDiscount,
            lineGross:
              item.lineGross,
            lineDiscount:
              item.lineDiscount,
            lineNet:
              item.lineNet,
            lineVat:
              item.lineVat,
            lineTotal:
              item.lineTotal,
            total:
              item.lineTotal,
          })
        ),

        subtotal:
          totals.subtotal,
        discountTotal:
          totals.discount,
        discount:
          totals.discount,
        vatTotal:
          totals.vat,
        kdvTotal:
          totals.vat,
        total:
          totals.total,

        notes,

        updatedAt:
          new Date().toISOString(),
      };

      let saved;

      if (editId) {
        saved =
          updateInvoice(
            editId,
            invoiceData
          );
      } else {
        saved =
          addInvoice(
            invoiceData
          );
      }

      if (!saved) {
        throw new Error(
          "Fatura kaydedilemedi."
        );
      }

      if (editId) {
        if (
          originalInvoiceType &&
          originalInvoiceType !==
            type
        ) {
          window.alert(
            "Fatura türü değişti. Stok farkı oluşturulmadı; lütfen stok hareketini kontrol edin."
          );
        } else {
          applyEditedInvoiceStock(
            saved
          );
        }
      } else {
        applyNewInvoiceStock(
          saved
        );
        applyCariForNewInvoice();
      }

      if (
        Finance &&
        typeof Finance.saveInvoice ===
          "function"
      ) {
        Finance.saveInvoice({
          id: saved.id,
          customerId:
            saved.customerId,
          customerName:
            saved.customerName,
          total:
            saved.total,
          subtotal:
            saved.subtotal,
          vat:
            saved.vatTotal,
          discount:
            saved.discountTotal,
          type:
            saved.type,
          invoiceNo:
            saved.invoiceNo,
          date:
            saved.date,
          items:
            saved.items,
          paymentMethod:
            saved.paymentMethod,
          paymentSubMethod:
            saved.paymentSubMethod,
          paymentAccountName:
            saved.paymentAccountName,
        });

        window.dispatchEvent(
          new Event(
            "ren-finance-updated"
          )
        );
      }

      window.dispatchEvent(
        new Event(
          "ren-invoices-updated"
        )
      );

      window.dispatchEvent(
        new Event(
          "ren-invoices-changed"
        )
      );

      window.dispatchEvent(
        new Event(
          "ren-stock-updated"
        )
      );

      window.dispatchEvent(
        new Event(
          "ren-stock-movements-changed"
        )
      );

      window.dispatchEvent(
        new Event(
          "ren-customers-updated"
        )
      );

      window.alert(
        `${saved.invoiceNo} numaralı fatura başarıyla kaydedildi.`
      );

      window.location.href =
        `/invoices/detail?id=${encodeURIComponent(
          saved.id
        )}`;
    } catch (error) {
      console.error(
        "REN ERP fatura kaydetme hatası:",
        error
      );

      window.alert(
        error?.message ||
          "Fatura kaydedilirken hata oluştu."
      );

      setSaving(false);
    }
  };


  /* =========================================================
     ÇIKIŞ
  ========================================================= */

  const close = () => {
    window.location.href =
      "/invoices";
  };


  /* =========================================================
     RENDER
  ========================================================= */

  const paymentIsCash =
    paymentMethod === "Peşin" &&
    paymentSubMethod === "Nakit";

  const paymentIsBank =
    paymentMethod === "Peşin" &&
    (
      paymentSubMethod ===
        "Kredi Kartı" ||
      paymentSubMethod ===
        "Havale / EFT"
    );

  const createCustomerSearchButton =
    customerSearch.trim() &&
    customerResults.length === 0;

  return (
    <div className="ren-invoice-edit ren-invoice-active-editor">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="ren-invoice-edit-header">

        <div>
          <button
            type="button"
            className="ren-invoice-edit-back"
            onClick={close}
          >
            <MdArrowBack />
            Fatura Listesi
          </button>

          <div className="ren-invoice-edit-breadcrumb">
            <span>Faturalar</span>
            <span>›</span>
            <strong>
              {getTypeTitle(invoiceType)}
            </strong>
          </div>

          <div className="ren-editor-title-line">
            <div>
              <h1>
                {editId
                  ? "Fatura Düzenle"
                  : getTypeTitle(
                      invoiceType
                    )}
              </h1>

              <p>
                {invoiceNo ||
                  "Yeni fatura"}
              </p>
            </div>

            {editId && (
              <span className="ren-editor-active-badge">
                <MdEdit />
                DÜZENLEME AKTİF
              </span>
            )}
          </div>
        </div>

        <div className="ren-invoice-edit-header-actions">

          <button
            type="button"
            className="secondary"
            onClick={handlePrint}
          >
            <MdPrint />
            YAZDIR
          </button>

          <button
            type="button"
            className="secondary"
            onClick={handlePdf}
          >
            <MdPictureAsPdf />
            PDF
          </button>

          {editId && (
            <>
              <button
                type="button"
                className="payment"
                onClick={handleOpenPayment}
              >
                <MdPayments />
                TAHSİLAT EKLE
              </button>

              <button
                type="button"
                className="danger"
                onClick={handleDelete}
              >
                <MdDeleteOutline />
                SİL
              </button>
            </>
          )}

          <button
            type="button"
            className="secondary"
            onClick={close}
          >
            VAZGEÇ
          </button>

          <button
            type="button"
            className="primary"
            onClick={handleSave}
            disabled={saving}
          >
            <MdSave />
            {saving
              ? "KAYDEDİLİYOR..."
              : "KAYDET"}
          </button>

        </div>
      </header>


      {/* =================================================
          TOP INFORMATION
      ================================================= */}

      <div className="ren-invoice-edit-top-grid">

        {/* CARİ */}

        <div className="ren-invoice-edit-card customer-card">

          <div className="ren-editor-label">
            {invoiceType === "purchase"
              ? "TEDARİKÇİ"
              : "MÜŞTERİ"}
          </div>

          {selectedCustomer ? (
            <div className="ren-selected-customer">
              <div>
                <strong>
                  {customerDisplayName(
                    selectedCustomer
                  )}
                </strong>

                <span>
                  {selectedCustomer.code ||
                    ""}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCustomer(
                    null
                  )
                }
              >
                Değiştir
              </button>
            </div>
          ) : (
            <div className="ren-customer-search-wrap">

              <div className="ren-customer-search-box">
                <MdSearch />

                <input
                  value={
                    customerSearch
                  }
                  onChange={(event) =>
                    setCustomerSearch(
                      event.target.value
                    )
                  }
                  placeholder={
                    invoiceType ===
                    "purchase"
                      ? "Tedarikçi ara..."
                      : "Müşteri ara..."
                  }
                />
              </div>

              {(customerResults.length >
                0 ||
                createCustomerSearchButton) && (
                <div className="ren-customer-dropdown">

                  {customerResults.map(
                    (customer) => (
                      <button
                        key={
                          customer.id
                        }
                        type="button"
                        onClick={() =>
                          selectCustomer(
                            customer
                          )
                        }
                      >
                        <strong>
                          {customerDisplayName(
                            customer
                          )}
                        </strong>

                        <span>
                          {customer.code ||
                            ""}
                        </span>
                      </button>
                    )
                  )}

                  {createCustomerSearchButton && (
                    <button
                      type="button"
                      className="new-option"
                      onClick={
                        openNewCustomer
                      }
                    >
                      ＋ "{customerSearch}"
                      {" "}
                      adında yeni{" "}
                      {invoiceType ===
                      "purchase"
                        ? "tedarikçi"
                        : "müşteri"}{" "}
                      oluştur
                    </button>
                  )}

                </div>
              )}

            </div>
          )}
        </div>


        {/* FATURA NO */}

        <div className="ren-invoice-edit-card compact">

          <div className="ren-editor-label">
            FATURA NO
          </div>

          <input
            className="ren-editor-input"
            value={invoiceNo}
            onChange={(event) =>
              setInvoiceNo(
                event.target.value
              )
            }
          />
        </div>


        {/* TARİH */}

        <div className="ren-invoice-edit-card compact">

          <div className="ren-editor-label">
            TARİH
          </div>

          <input
            className="ren-editor-input"
            type="date"
            value={invoiceDate}
            onChange={(event) =>
              setInvoiceDate(
                event.target.value
              )
            }
          />
        </div>


        {/* VADE */}

        <div className="ren-invoice-edit-card compact">

          <div className="ren-editor-label">
            VADE
          </div>

          <input
            className="ren-editor-input"
            type="date"
            value={dueDate}
            onChange={(event) =>
              setDueDate(
                event.target.value
              )
            }
          />
        </div>

      </div>


      {/* =================================================
          PAYMENT
      ================================================= */}

      <div className="ren-payment-area">

        <div className="ren-payment-method-card">

          <div className="ren-editor-label">
            ÖDEME / TAHSİLAT
          </div>

          <div className="ren-payment-main-buttons">

            <button
              type="button"
              className={
                paymentMethod ===
                "Vadeli"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setPaymentMethod(
                  "Vadeli"
                );
                setPaymentSubMethod(
                  ""
                );
                setPaymentAccountType(
                  ""
                );
                setPaymentAccountId(
                  ""
                );
                setPaymentAccountName(
                  ""
                );
              }}
            >
              VADELİ
            </button>

            <button
              type="button"
              className={
                paymentMethod ===
                "Peşin"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setPaymentMethod(
                  "Peşin"
                );

                if (
                  !paymentSubMethod
                ) {
                  setCashPayment();
                }
              }}
            >
              PEŞİN
            </button>

          </div>

          {paymentMethod === "Peşin" && (
            <div className="ren-payment-sub-buttons">

              <button
                type="button"
                className={
                  paymentSubMethod ===
                  "Nakit"
                    ? "active"
                    : ""
                }
                onClick={
                  setCashPayment
                }
              >
                NAKİT
              </button>

              <button
                type="button"
                className={
                  paymentSubMethod ===
                  "Kredi Kartı"
                    ? "active"
                    : ""
                }
                onClick={
                  setCardPayment
                }
              >
                KREDİ KARTI
              </button>

              <button
                type="button"
                className={
                  paymentSubMethod ===
                  "Havale / EFT"
                    ? "active"
                    : ""
                }
                onClick={
                  setTransferPayment
                }
              >
                HAVALE / EFT
              </button>

            </div>
          )}

        </div>


        <div className="ren-due-card">

          <div className="ren-editor-label">
            HIZLI VADE
          </div>

          <div className="ren-due-buttons">

            {[
              [0, "AYNI GÜN"],
              [7, "7 GÜN"],
              [14, "14 GÜN"],
              [30, "30 GÜN"],
              [60, "60 GÜN"],
            ].map(
              ([days, label]) => (
                <button
                  key={days}
                  type="button"
                  className={
                    duePreset ===
                    String(days)
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    chooseDuePreset(
                      days
                    )
                  }
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>

      </div>


      {/* =================================================
          PAYMENT ACCOUNT
      ================================================= */}

      {paymentMethod === "Peşin" && (
        <div className="ren-payment-account-card">

          <div className="ren-payment-account-title">
            <div>
              <strong>
                {paymentSubMethod ||
                  "Peşin Ödeme"}
              </strong>

              <span>
                Ödeme hareketinin işleneceği
                kasa veya banka hesabını seçin.
              </span>
            </div>
          </div>

          <div className="ren-payment-account-grid">

            <label>
              <span>
                HESAP TÜRÜ
              </span>

              <select
                value={
                  paymentAccountType
                }
                onChange={(event) => {
                  setPaymentAccountType(
                    event.target.value
                  );

                  setPaymentAccountId(
                    ""
                  );

                  setPaymentAccountName(
                    ""
                  );
                }}
              >
                <option value="">
                  Hesap türü seçin
                </option>

                {paymentIsCash && (
                  <option value="cash">
                    Kasa
                  </option>
                )}

                {paymentIsBank && (
                  <option value="bank">
                    Banka / POS
                  </option>
                )}
              </select>
            </label>


            <label>
              <span>
                {paymentAccountType ===
                "cash"
                  ? "KASA"
                  : "BANKA / POS"}
              </span>

              <select
                value={
                  paymentAccountId
                }
                onChange={(event) =>
                  selectAccount(
                    event.target.value
                  )
                }
                disabled={
                  !paymentAccountType
                }
              >
                <option value="">
                  {paymentAccountType
                    ? "Hesap seçin"
                    : "Önce hesap türünü seçin"}
                </option>

                {visibleAccounts.map(
                  (account) => (
                    <option
                      key={
                        account.id
                      }
                      value={
                        account.id
                      }
                    >
                      {getAccountName(
                        account
                      )}
                    </option>
                  )
                )}
              </select>
            </label>


            <label>
              <span>
                REFERANS / AÇIKLAMA
              </span>

              <input
                value={
                  paymentReference
                }
                onChange={(event) =>
                  setPaymentReference(
                    event.target.value
                  )
                }
                placeholder="Slip no, dekont no..."
              />
            </label>

          </div>

        </div>
      )}


      {/* =================================================
          PRODUCTS
      ================================================= */}

      <div className="ren-invoice-edit-card products-card">

        <div className="ren-products-header">

          <div>
            <strong>
              Ürünler
            </strong>

            <span>
              Fatura satırlarını buradan
              tamamen düzenleyebilirsiniz.
            </span>
          </div>

          <button
            type="button"
            className="ren-add-line"
            onClick={addEmptyLine}
          >
            <MdAdd />
            SATIR EKLE
          </button>

        </div>


        <div className="ren-product-table-scroll">

          <div className="ren-product-table">

            <div className="ren-product-row ren-product-head">

              <div>ÜRÜN</div>
              <div>MİKTAR</div>
              <div>BİRİM</div>
              <div>BR. FİYAT</div>
              <div>KDV</div>
              <div>İSKONTO 1 / 2 / 3</div>
              <div>NET</div>
              <div>TOPLAM</div>
              <div></div>

            </div>


            {calculatedItems.map(
              (item) => (
                <div
                  className="ren-product-row"
                  key={item.id}
                >

                  {/* PRODUCT */}

                  <div className="ren-product-cell product-cell">

                    <input
                      value={
                        item.productName ||
                        ""
                      }
                      onChange={(event) => {
                        updateItem(
                          item.id,
                          "productName",
                          event.target
                            .value
                        );

                        if (
                          item.productId
                        ) {
                          updateItem(
                            item.id,
                            "productId",
                            ""
                          );
                        }
                      }}
                      placeholder="Ürün adı"
                    />

                    {item.productName &&
                      !item.productId && (
                        <>
                          <div className="ren-product-suggestion-list">

                            {productMatches(
                              item.productName
                            ).map(
                              (
                                product
                              ) => (
                                <button
                                  key={
                                    product.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    changeLineProduct(
                                      item.id,
                                      product.id
                                    )
                                  }
                                >
                                  <span>
                                    {productName(
                                      product
                                    )}
                                  </span>

                                  <small>
                                    {productCode(
                                      product
                                    )}
                                  </small>
                                </button>
                              )
                            )}

                          </div>

                          <button
                            type="button"
                            className="ren-new-product-inline"
                            onClick={() =>
                              openNewProduct(
                                item.id
                              )
                            }
                          >
                            ＋ Yeni ürün oluştur
                          </button>
                        </>
                      )}

                    {item.productId && (
                      <small className="ren-product-code">
                        Kod:
                        {" "}
                        {item.productCode ||
                          "-"}
                      </small>
                    )}

                  </div>


                  {/* QUANTITY */}

                  <div className="ren-product-cell">

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        item.quantity
                      }
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "quantity",
                          event.target
                            .value
                        )
                      }
                    />

                  </div>


                  {/* UNIT */}

                  <div className="ren-product-cell">

                    <input
                      value={
                        item.unit || ""
                      }
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "unit",
                          event.target
                            .value
                        )
                      }
                    />

                  </div>


                  {/* PRICE */}

                  <div className="ren-product-cell">

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        item.unitPrice
                      }
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "unitPrice",
                          event.target
                            .value
                        )
                      }
                    />

                  </div>


                  {/* VAT */}

                  <div className="ren-product-cell">

                    <select
                      value={
                        item.vatRate
                      }
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "vatRate",
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="0">
                        %0
                      </option>

                      <option value="1">
                        %1
                      </option>

                      <option value="10">
                        %10
                      </option>

                      <option value="20">
                        %20
                      </option>
                    </select>

                  </div>


                  {/* DISCOUNTS */}

                  <div className="ren-discount-grid">

                    {[
                      "discount1",
                      "discount2",
                      "discount3",
                    ].map(
                      (field) => (
                        <input
                          key={
                            field
                          }
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            item[
                              field
                            ] ?? 0
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              field,
                              event.target
                                .value
                            )
                          }
                        />
                      )
                    )}

                  </div>


                  {/* NET */}

                  <div className="ren-product-number">
                    {money(
                      item.lineNet
                    )}
                    {" "}
                    ₺
                  </div>


                  {/* TOTAL */}

                  <div className="ren-product-number total">
                    {money(
                      item.lineTotal
                    )}
                    {" "}
                    ₺
                  </div>


                  {/* DELETE */}

                  <button
                    type="button"
                    className="ren-product-delete"
                    onClick={() =>
                      removeItem(
                        item.id
                      )
                    }
                    title="Satırı sil"
                  >
                    <MdDeleteOutline />
                  </button>

                </div>
              )
            )}

          </div>

        </div>


        {/* NOTE / TOTAL */}

        <div className="ren-invoice-bottom-area">

          <div className="ren-invoice-note-area">

            <label>
              <span>
                NOT
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Fatura notu..."
                rows="5"
              />
            </label>

          </div>


          <div className="ren-invoice-total-box">

            <div>
              <span>
                ARA TOPLAM
              </span>

              <strong>
                {money(
                  totals.subtotal
                )}
                {" "}
                ₺
              </strong>
            </div>

            <div>
              <span>
                İSKONTO
              </span>

              <strong>
                {money(
                  totals.discount
                )}
                {" "}
                ₺
              </strong>
            </div>

            <div>
              <span>
                KDV
              </span>

              <strong>
                {money(
                  totals.vat
                )}
                {" "}
                ₺
              </strong>
            </div>

            <div className="grand">
              <span>
                GENEL TOPLAM
              </span>

              <strong>
                {money(
                  totals.total
                )}
                {" "}
                ₺
              </strong>
            </div>

          </div>

        </div>


        {/* STOCK */}

        <div className="ren-stock-control">

          <div>
            <strong>
              STOK TAKİBİ
            </strong>

            <span>
              Fatura kaydedildiğinde stok
              hareketini yönetir.
            </span>
          </div>

          <button
            type="button"
            className={
              stockTracking
                ? "active"
                : ""
            }
            onClick={() =>
              setStockTracking(
                true
              )
            }
          >
            STOK HAREKETİ OLUŞTUR
          </button>

          <button
            type="button"
            className={
              !stockTracking
                ? "active"
                : ""
            }
            onClick={() =>
              setStockTracking(
                false
              )
            }
          >
            STOK HAREKETİ YOK
          </button>

        </div>

      </div>


      {/* =================================================
          MODAL - CUSTOMER
      ================================================= */}

      {newCustomerOpen && (
        <div className="ren-modal-overlay">
          <div className="ren-modal">

            <div className="ren-modal-head">
              <div>
                <strong>
                  Yeni{" "}
                  {invoiceType ===
                  "purchase"
                    ? "Tedarikçi"
                    : "Müşteri"}
                </strong>

                <span>
                  Cari kartı oluştur
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNewCustomerOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            {[
              ["name", "Cari adı"],
              ["phone", "Telefon"],
              ["taxNumber", "Vergi No"],
            ].map(
              ([field, label]) => (
                <label
                  key={field}
                  className="ren-modal-field"
                >
                  <span>
                    {label}
                  </span>

                  <input
                    autoFocus={
                      field ===
                      "name"
                    }
                    value={
                      newCustomer[
                        field
                      ]
                    }
                    onChange={(event) =>
                      setNewCustomer(
                        (current) => ({
                          ...current,
                          [field]:
                            event.target
                              .value,
                        })
                      )
                    }
                  />
                </label>
              )
            )}

            <div className="ren-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setNewCustomerOpen(
                    false
                  )
                }
              >
                VAZGEÇ
              </button>

              <button
                type="button"
                className="primary"
                onClick={
                  saveNewCustomer
                }
              >
                CARİYİ KAYDET
              </button>
            </div>

          </div>
        </div>
      )}


      {/* =================================================
          MODAL - PRODUCT
      ================================================= */}

      {newProductOpen && (
        <div className="ren-modal-overlay">
          <div className="ren-modal wide">

            <div className="ren-modal-head">
              <div>
                <strong>
                  Yeni Ürün
                </strong>

                <span>
                  Stok kartı oluştur
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewProductOpen(
                    false
                  );
                  setNewProductTargetId(
                    ""
                  );
                }}
              >
                ×
              </button>
            </div>


            <label className="ren-modal-field">
              <span>
                ÜRÜN ADI
              </span>

              <input
                autoFocus
                value={
                  newProduct.name
                }
                onChange={(event) =>
                  setNewProduct(
                    (current) => ({
                      ...current,
                      name:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </label>


            <div className="ren-modal-two">

              {[
                ["code", "KOD / BARKOD"],
                ["unit", "BİRİM"],
                [
                  "purchasePrice",
                  "ALIŞ FİYATI",
                ],
                [
                  "salePrice",
                  "SATIŞ FİYATI",
                ],
              ].map(
                ([field, label]) => (
                  <label
                    key={field}
                    className="ren-modal-field"
                  >
                    <span>
                      {label}
                    </span>

                    <input
                      type={
                        field.includes(
                          "Price"
                        )
                          ? "number"
                          : "text"
                      }
                      value={
                        newProduct[
                          field
                        ]
                      }
                      onChange={(event) =>
                        setNewProduct(
                          (current) => ({
                            ...current,
                            [field]:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>
                )
              )}

              <label className="ren-modal-field">
                <span>
                  KDV
                </span>

                <select
                  value={
                    newProduct.vatRate
                  }
                  onChange={(event) =>
                    setNewProduct(
                      (current) => ({
                        ...current,
                        vatRate:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  <option value="0">
                    %0
                  </option>

                  <option value="1">
                    %1
                  </option>

                  <option value="10">
                    %10
                  </option>

                  <option value="20">
                    %20
                  </option>
                </select>
              </label>

            </div>


            <div className="ren-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setNewProductOpen(
                    false
                  );
                  setNewProductTargetId(
                    ""
                  );
                }}
              >
                VAZGEÇ
              </button>

              <button
                type="button"
                className="primary"
                onClick={
                  saveNewProduct
                }
              >
                ÜRÜNÜ OLUŞTUR
              </button>
            </div>

          </div>
        </div>
      )}


      {/* =================================================
          MODAL - PAYMENT
      ================================================= */}

      {paymentModalOpen && (
        <div className="ren-modal-overlay">
          <div className="ren-modal">

            <div className="ren-modal-head">
              <div>
                <strong>
                  Tahsilat / Ödeme Ekle
                </strong>

                <span>
                  Faturanın kalan bakiyesine
                  ödeme kaydı ekleyin.
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaymentModalOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>


            <div className="ren-payment-modal-summary">

              <div>
                <span>
                  FATURA TOPLAMI
                </span>

                <strong>
                  {money(
                    totals.total
                  )}
                  {" "}
                  ₺
                </strong>
              </div>

              <div>
                <span>
                  KAYITLI ÖDENEN
                </span>

                <strong>
                  {money(
                    numberValue(
                      editId
                        ? getInvoices().find(
                            (item) =>
                              String(
                                item.id
                              ) ===
                              String(
                                editId
                              )
                          )
                            ?.paidAmount ||
                            0
                        : 0
                    )
                  )}
                  {" "}
                  ₺
                </strong>
              </div>

              <div className="remaining">
                <span>
                  KALAN
                </span>

                <strong>
                  {money(
                    remainingBalance
                  )}
                  {" "}
                  ₺
                </strong>
              </div>

            </div>


            <label className="ren-modal-field">
              <span>
                TUTAR
              </span>

              <input
                type="number"
                min="0"
                max={totals.total}
                step="0.01"
                value={
                  paymentAmount
                }
                onChange={(event) =>
                  setPaymentAmount(
                    event.target.value
                  )
                }
              />
            </label>


            <div className="ren-modal-two">

              <label className="ren-modal-field">
                <span>
                  YÖNTEM
                </span>

                <select
                  value={
                    paymentSubMethod
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setPaymentSubMethod(
                      value
                    );

                    if (
                      value === "Nakit"
                    ) {
                      setPaymentAccountType(
                        "cash"
                      );
                    } else {
                      setPaymentAccountType(
                        "bank"
                      );
                    }

                    setPaymentAccountId(
                      ""
                    );

                    setPaymentAccountName(
                      ""
                    );
                  }}
                >
                  <option value="">
                    Seçin
                  </option>

                  <option>
                    Nakit
                  </option>

                  <option>
                    Kredi Kartı
                  </option>

                  <option>
                    Havale / EFT
                  </option>
                </select>
              </label>


              <label className="ren-modal-field">
                <span>
                  {paymentAccountType ===
                  "cash"
                    ? "KASA"
                    : "BANKA / POS"}
                </span>

                <select
                  value={
                    paymentAccountId
                  }
                  onChange={(event) =>
                    selectAccount(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Hesap seçin
                  </option>

                  {accounts
                    .filter(
                      (account) =>
                        getAccountType(
                          account
                        ) ===
                        (
                          paymentAccountType ||
                          "cash"
                        )
                    )
                    .map(
                      (account) => (
                        <option
                          key={
                            account.id
                          }
                          value={
                            account.id
                          }
                        >
                          {getAccountName(
                            account
                          )}
                        </option>
                      )
                    )}
                </select>
              </label>

            </div>


            <label className="ren-modal-field">
              <span>
                NOT
              </span>

              <textarea
                rows="3"
                value={
                  paymentNote
                }
                onChange={(event) =>
                  setPaymentNote(
                    event.target.value
                  )
                }
                placeholder="Tahsilat notu..."
              />
            </label>


            <div className="ren-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setPaymentModalOpen(
                    false
                  )
                }
              >
                VAZGEÇ
              </button>

              <button
                type="button"
                className="payment"
                onClick={
                  handleSavePayment
                }
              >
                <MdPayments />
                TAHSİLATI KAYDET
              </button>
            </div>

          </div>
        </div>
      )}


      {/* =================================================
          SADE YAZDIR / PDF CIKTISI
      ================================================= */}
      <div className="ren-print-document">
        <div className="ren-simple-print-head">
          <div>
            <strong>REN ENDÜSTRİYEL</strong>
            <span>Endüstriyel Temizlik Ürünleri</span>
          </div>
          <strong className="ren-simple-print-type">
            {invoiceType === "purchase" ? "ALIŞ NOTU" : invoiceType === "return" ? "İADE NOTU" : "SATIŞ NOTU"}
          </strong>
        </div>

        <div className="ren-simple-print-info">
          <div><span>{invoiceType === "purchase" ? "Tedarikçi" : "Müşteri"}</span><strong>{customerDisplayName(selectedCustomer) || "-"}</strong></div>
          <div><span>Tarih</span><strong>{invoiceDate || "-"}</strong></div>
          <div><span>No</span><strong>{invoiceNo || "-"}</strong></div>
          <div><span>Vade</span><strong>{dueDate || "-"}</strong></div>
        </div>

        <table className="ren-simple-print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Açıklama</th>
              <th>Miktar</th>
              <th>Fiyat</th>
              <th>İndirim (%)</th>
              <th>Tutar (KDV Hariç)</th>
            </tr>
          </thead>
          <tbody>
            {calculatedItems.map((item, index) => {
              const discountPercent = numberValue(item.discount1) + numberValue(item.discount2) + numberValue(item.discount3);
              return (
                <tr key={`simple-print-${item.id}`}>
                  <td>{index + 1}</td>
                  <td>
                    {item.productName || "-"}
                    {item.productCode && <small>{item.productCode}</small>}
                  </td>
                  <td>{money(item.quantity)} {item.unit || "ad"}</td>
                  <td>{money(item.unitPrice)} ₺</td>
                  <td>%{money(discountPercent)}</td>
                  <td>{money(item.lineNet)} ₺</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ren-simple-print-totals">
          <div><span>Net</span><strong>{money(totals.subtotal)} ₺</strong></div>
          <div><span>KDV</span><strong>{money(totals.vat)} ₺</strong></div>
          <div><span>Toplam</span><strong>{money(totals.total)} ₺</strong></div>
          <div><span>Önceki Bakiye</span><strong>{money(existingCustomerBalance)} ₺</strong></div>
          <div><span>Güncel Bakiye</span><strong>{money(displayCustomerBalance)} ₺</strong></div>
        </div>

        {paymentMethod === "Peşin" && (
          <div className="ren-simple-print-payment">
            Ödeme: {paymentSubMethod || "Peşin"}{paymentAccountName ? ` - ${paymentAccountName}` : ""}
          </div>
        )}

        {notes && (
          <div className="ren-simple-print-note">
            Not: {notes}
          </div>
        )}

        <div className="ren-simple-print-thanks">Teşekkür ederiz.</div>
      </div>
    </div>
  );
}
