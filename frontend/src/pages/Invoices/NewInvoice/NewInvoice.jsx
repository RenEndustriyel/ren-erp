import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdAdd,
  MdCalendarToday,
  MdDeleteOutline,
  MdKeyboardArrowDown,
  MdSave,
  MdSearch,
} from "react-icons/md";

import {
  getInvoices,
  addInvoice,
  updateInvoice,
  getNextInvoiceNumber,
} from "../../../lib/invoiceStore";

import {
  getCustomers,
  updateCustomerBalance,
} from "../../../lib/customerStore";

import {
  getProducts,
  changeStock,
} from "../../../lib/stockStore";

import "./NewInvoice.css";


/* =========================================================
   YARDIMCI
========================================================= */

function money(value) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(value) || 0
  );
}


function numberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  let text =
    String(value)
      .trim();

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

  const result =
    Number(text);

  return Number.isFinite(result)
    ? result
    : 0;
}


function normalizeNumericInput(value) {
  let text = String(value ?? "");

  text = text.replace(/[^0-9,.-]/g, "");

  const negative = text.startsWith("-") ? "-" : "";
  text = text.replace(/-/g, "");

  if (text.includes(",")) {
    const parts = text.split(",");
    text = parts[0] + "," + parts.slice(1).join("");
  }

  return negative + text;
}

function handleNumberInputKeyDown(event, clearValue) {
  const currentValue = String(event.currentTarget.value ?? "");

  if (
    (event.key === "Backspace" || event.key === "Delete") &&
    currentValue === "0"
  ) {
    event.preventDefault();
    clearValue();
  }
}

function insertDecimalSeparator(event, currentValue, setValue) {
  const isDecimalKey =
    event.key === "," ||
    event.key === "." ||
    event.code === "NumpadDecimal";

  if (!isDecimalKey) {
    return false;
  }

  event.preventDefault();

  const input = event.currentTarget;
  const value = String(currentValue ?? "");
  const start = input.selectionStart ?? value.length;
  const end = input.selectionEnd ?? start;

  if (value.includes(",")) {
    return true;
  }

  const nextValue =
    value.slice(0, start) +
    "," +
    value.slice(end);

  setValue(nextValue);

  requestAnimationFrame(() => {
    try {
      const position = start + 1;
      input.focus();
      input.setSelectionRange(position, position);
    } catch {
      // Cursor is best-effort after React re-render.
    }
  });

  return true;
}

function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function normalizeType(type) {
  const value =
    String(type || "")
      .trim()
      .toLowerCase();

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


function getTypeTitle(type) {
  if (
    type === "purchase"
  ) {
    return "Yeni Alış Faturası";
  }

  if (
    type === "return"
  ) {
    return "Yeni İade Faturası";
  }

  return "Yeni Satış Faturası";
}


function productName(product) {
  return (
    product?.name ||
    product?.productName ||
    product?.title ||
    "Ürün"
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


function productPurchasePrice(product) {
  return numberValue(
    product?.purchaseNet ??
    product?.purchasePrice ??
    product?.buyPrice ??
    product?.cost ??
    product?.purchase ??
    0
  );
}


function productSalePrice(product) {
  return numberValue(
    product?.salesNet ??
    product?.salePrice ??
    product?.sellingPrice ??
    product?.price ??
    product?.sale ??
    0
  );
}


function productVat(product) {
  return numberValue(
    product?.salesVat ??
    product?.vatRate ??
    product?.vat ??
    product?.kdv ??
    20
  );
}

function productUnit(product) {
  return (
    product?.unit ||
    product?.unitName ||
    product?.unitType ||
    product?.birim ||
    "Adet"
  );
}

function productWarehouse(product) {
  return (
    product?.warehouse ||
    product?.warehouseName ||
    product?.depot ||
    product?.depo ||
    ""
  );
}

function createEmptyInvoiceItem() {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: "",
    productName: "",
    productCode: "",
    warehouse: "",
    quantity: 1,
    unit: "Adet",
    unitPrice: 0,
    vatRate: 20,
    discounts: [],
    discount: 0,
  };
}



/* =========================================================
   KASA / BANKA / POS FİNANS HESAPLARI
========================================================= */

const ACCOUNT_STORAGE_KEY =
  "ren-erp-cash-bank-accounts";

const MOVEMENT_STORAGE_KEY =
  "ren-erp-cash-bank-movements";


function readAccounts() {
  try {
    const saved =
      localStorage.getItem(
        ACCOUNT_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function saveAccounts(accounts) {
  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify(accounts)
  );

  window.dispatchEvent(
    new Event(
      "ren-cash-bank-updated"
    )
  );
}


function readMovements() {
  try {
    const saved =
      localStorage.getItem(
        MOVEMENT_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}


function saveMovements(movements) {
  localStorage.setItem(
    MOVEMENT_STORAGE_KEY,
    JSON.stringify(movements)
  );

  window.dispatchEvent(
    new Event(
      "ren-cash-bank-updated"
    )
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function NewInvoice() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const editId =
    params.get("id");

  const queryType =
    params.get("type");


  /* =======================================================
     STATE
  ======================================================= */

  const [
    invoiceType,
    setInvoiceType,
  ] = useState(
    normalizeType(
      queryType
    )
  );


  const [
    customers,
    setCustomers,
  ] = useState(
    () =>
      getCustomers()
  );


  const [
    products,
    setProducts,
  ] = useState(
    () =>
      getProducts()
  );


  const [
    customerSearch,
    setCustomerSearch,
  ] = useState("");


  const [
    showCustomerDropdown,
    setShowCustomerDropdown,
  ] = useState(false);


  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  const [
    activeProductRowId,
    setActiveProductRowId,
  ] = useState(null);

  const [
    showProductDropdown,
    setShowProductDropdown,
  ] = useState(false);


  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null);


  const [
    invoiceDate,
    setInvoiceDate,
  ] = useState(
    today()
  );


  const [
    dueDate,
    setDueDate,
  ] = useState(
    today()
  );


  const [
    invoiceNo,
    setInvoiceNo,
  ] = useState("");


  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState(
    "Vadeli"
  );


  const [
    notes,
    setNotes,
  ] = useState("");


  const [
    items,
    setItems,
  ] = useState([createEmptyInvoiceItem()]);


  const [
    openItemDiscountId,
    setOpenItemDiscountId,
  ] = useState(null);


  const [
    showExtraInvoiceNo,
    setShowExtraInvoiceNo,
  ] = useState(false);


  const [
    extraInvoiceNo,
    setExtraInvoiceNo,
  ] = useState("");


  const [
    showOrderModal,
    setShowOrderModal,
  ] = useState(false);


  const [
    orderInfo,
    setOrderInfo,
  ] = useState({
    orderNo: "",
    orderDate: "",
    deliveryDate: "",
    description: "",
  });


  const [
    stockTracking,
    setStockTracking,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  /* =======================================================
     FATURA TAHSİLAT / ÖDEME
  ======================================================= */

  const [
    detailInvoice,
    setDetailInvoice,
  ] = useState(null);

  const [
    showFinanceModal,
    setShowFinanceModal,
  ] = useState(false);

  const [
    financeMode,
    setFinanceMode,
  ] = useState("collection");

  const [
    accounts,
    setAccounts,
  ] = useState(readAccounts);

  const [
    financeAmount,
    setFinanceAmount,
  ] = useState("");

  const [
    financeDate,
    setFinanceDate,
  ] = useState(today());

  const [
    financeMethod,
    setFinanceMethod,
  ] = useState("Havale / EFT");

  const [
    financeAccountId,
    setFinanceAccountId,
  ] = useState("");

  const [
    financeDescription,
    setFinanceDescription,
  ] = useState("");

  const [
    financeSaving,
    setFinanceSaving,
  ] = useState(false);


  /* =======================================================
     FATURA NUMARASI
  ======================================================= */

  useEffect(() => {

    if (editId) {
      return;
    }

    setInvoiceNo(
      getNextInvoiceNumber(
        normalizeType(
          invoiceType
        )
      )
    );

  }, [
    invoiceType,
    editId,
  ]);


  /* =======================================================
     VERİLERİ YENİLE
  ======================================================= */

  useEffect(() => {

    const refreshCustomers =
      () => {
        setCustomers(
          getCustomers()
        );
      };


    const refreshProducts =
      () => {
        setProducts(
          getProducts()
        );
      };

    const refreshAccounts =
      () => {
        setAccounts(
          readAccounts()
        );
      };


    window.addEventListener(
      "ren-customers-updated",
      refreshCustomers
    );

    window.addEventListener(
      "ren-products-changed",
      refreshProducts
    );

    window.addEventListener(
      "ren-stock-updated",
      refreshProducts
    );

    window.addEventListener(
      "ren-cash-bank-updated",
      refreshAccounts
    );


    return () => {

      window.removeEventListener(
        "ren-customers-updated",
        refreshCustomers
      );

      window.removeEventListener(
        "ren-products-changed",
        refreshProducts
      );

      window.removeEventListener(
        "ren-stock-updated",
        refreshProducts
      );

      window.removeEventListener(
        "ren-cash-bank-updated",
        refreshAccounts
      );

    };

  }, []);


  /* =======================================================
     DÜZENLEME
  ======================================================= */

  useEffect(() => {

    if (!editId) {
      return;
    }


    const invoice =
      getInvoices().find(
        (item) =>
          String(item.id) ===
          String(editId)
      );


    if (!invoice) {
      return;
    }

    setDetailInvoice(
      invoice
    );


    setInvoiceType(
      normalizeType(
        invoice.type
      )
    );


    setInvoiceNo(
      invoice.invoiceNo ||
      ""
    );


    setInvoiceDate(
      invoice.date ||
      today()
    );


    setDueDate(
      invoice.dueDate ||
      today()
    );


    setPaymentMethod(
      invoice.paymentMethod ||
      "Vadeli"
    );


    setNotes(
      invoice.notes ||
      ""
    );


    setShowExtraInvoiceNo(
      Boolean(invoice.extraInvoiceNo)
    );

    setExtraInvoiceNo(
      invoice.extraInvoiceNo ||
      ""
    );

    setOrderInfo({
      orderNo:
        invoice.orderInfo?.orderNo ||
        "",
      orderDate:
        invoice.orderInfo?.orderDate ||
        "",
      deliveryDate:
        invoice.orderInfo?.deliveryDate ||
        "",
      description:
        invoice.orderInfo?.description ||
        "",
    });


    setStockTracking(
      invoice.stockTracking !== false
    );


    const customer =
      customers.find(
        (item) =>
          String(item.id) ===
          String(
            invoice.customerId
          )
      );


    if (customer) {
      setSelectedCustomer(
        customer
      );
    }


    const loadedItems =
      Array.isArray(invoice.items)
        ? invoice.items.map(
            (item, index) => {
              const legacyItemDiscount =
                numberValue(item.discount);

              const itemDiscounts =
                Array.isArray(item.discounts)
                  ? item.discounts.map(
                      (row, discountIndex) => ({
                        id:
                          row.id ||
                          `item-discount-${index}-${discountIndex}-${Date.now()}`,
                        type:
                          row.type === "amount"
                            ? "amount"
                            : "percent",
                        value:
                          row.value ??
                          "",
                      })
                    )
                  : legacyItemDiscount > 0
                    ? [
                        {
                          id:
                            `item-discount-${index}-${Date.now()}`,
                          type: "amount",
                          value: legacyItemDiscount,
                        },
                      ]
                    : [];

              return {
                id:
                  item.id ||
                  `item-${index}-${Date.now()}`,
                productId:
                  item.productId ||
                  "",
                productName:
                  item.productName ||
                  item.name ||
                  "Ürün",
                productCode:
                  item.productCode ||
                  item.code ||
                  "",
                warehouse:
                  item.warehouse ||
                  item.warehouseName ||
                  item.depot ||
                  "",
                quantity:
                  numberValue(item.quantity) ||
                  1,
                unit:
                  item.unit ||
                  item.unitName ||
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
                discounts: itemDiscounts,
                discount: legacyItemDiscount,
              };
            }
          )
        : [createEmptyInvoiceItem()];

    setItems(loadedItems);

  }, [
    editId,
    customers,
  ]);


  /* =======================================================
     CARİ ARAMA
  ======================================================= */

  const customerResults =
    useMemo(() => {
      const query = customerSearch.trim().toLocaleLowerCase("tr-TR");

      return customers
        .filter((customer) => {
          if (!query) return true;

          const name = String(
            customer?.name ||
            customer?.title ||
            customer?.companyName ||
            ""
          ).toLocaleLowerCase("tr-TR");

          const code = String(
            customer?.code ||
            customer?.customerCode ||
            ""
          ).toLocaleLowerCase("tr-TR");

          return name.includes(query) || code.includes(query);
        })
        .slice(0, 50);
    }, [customers, customerSearch]);


  /* =======================================================
     ÜRÜN ARAMA
  ======================================================= */

  const productResults =
    useMemo(() => {

      const query =
        productSearch
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      const matched =
        products.filter(
          (product) => {

            if (!query) {
              return true;
            }

            const name =
              productName(
                product
              )
                .toLocaleLowerCase(
                  "tr-TR"
                );

            const code =
              productCode(
                product
              )
                .toLocaleLowerCase(
                  "tr-TR"
                );

            const barcode =
              String(
                product?.barcode ||
                ""
              )
                .toLocaleLowerCase(
                  "tr-TR"
                );

            return (
              name.includes(
                query
              ) ||
              code.includes(
                query
              ) ||
              barcode.includes(
                query
              )
            );

          }
        );

      return matched.slice(
        0,
        10
      );

    }, [
      products,
      productSearch,
    ]);

  /* =======================================================
     ÜRÜN / SATIR İŞLEMLERİ
  ======================================================= */

  const addProductToRow =
    (
      rowId,
      product
    ) => {

      const price =
        invoiceType ===
        "purchase"
          ? productPurchasePrice(
              product
            )
          : productSalePrice(
              product
            );

      setItems(
        (currentItems) =>
          currentItems.map(
            (item) =>
              item.id === rowId
                ? {
                    ...item,

                    productId:
                      product.id,

                    productName:
                      productName(
                        product
                      ),

                    productCode:
                      productCode(
                        product
                      ),

                    warehouse:
                      productWarehouse(
                        product
                      ),

                    quantity:
                      item.quantity === ""
                        ? ""
                        : numberValue(item.quantity) || 1,

                    unit:
                      productUnit(
                        product
                      ),

                    discounts: [],

                    unitPrice:
                      price,

                    vatRate:
                      productVat(
                        product
                      ),
                  }
                : item
          )
      );

      setProductSearch("");

      setShowProductDropdown(
        false
      );

      setActiveProductRowId(
        null
      );
    };


  const addBlankItem =
    () => {

      const newItem =
        createEmptyInvoiceItem();

      setItems(
        (currentItems) => [
          ...currentItems,
          newItem,
        ]
      );

      setActiveProductRowId(
        newItem.id
      );

      setProductSearch("");

      setShowProductDropdown(
        true
      );

      window.setTimeout(
        () => {

          const input =
            document.querySelector(
              `[data-product-row="${newItem.id}"]`
            );

          input?.focus();

        },
        0
      );

    };


  const openProductPicker =
    (
      item
    ) => {

      setActiveProductRowId(
        item.id
      );

      setProductSearch(
        item.productName ||
        ""
      );

      setShowProductDropdown(
        true
      );

    };

  /* =======================================================
     SATIR GÜNCELLE
  ======================================================= */

  const updateItem =
    (
      id,
      field,
      value
    ) => {

      setItems(
        (currentItems) =>
          currentItems.map(
            (item) =>
              item.id === id
                ? {
                    ...item,
                    [field]:
                      value,
                  }
                : item
          )
      );

    };


  const updateItemFromTotal =
    (
      item,
      value
    ) => {

      if (value === "") {
        updateItem(
          item.id,
          "lineTotal",
          ""
        );
        return;
      }

      const targetTotal =
        numberValue(
          value
        );

      const quantity =
        Math.max(
          numberValue(
            item.quantity
          ),
          0
        );

      const vatRate =
        numberValue(
          item.vatRate
        );

      if (
        quantity <= 0
      ) {
        updateItem(
          item.id,
          "unitPrice",
          targetTotal
        );
        return;
      }

      const divisor =
        1 +
        vatRate /
          100;

      const unitPrice =
        divisor > 0
          ? targetTotal /
            quantity /
            divisor
          : targetTotal /
            quantity;

      updateItem(
        item.id,
        "unitPrice",
        Number.isFinite(
          unitPrice
        )
          ? unitPrice
          : 0
      );

    };


  /* =======================================================
     ÜRÜN İSKONTOLARI
  ======================================================= */

  const createDiscountRow = () => ({
    id: `item-discount-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    type: "percent",
    value: "",
  });


  const addItemDiscount =
    (itemId) => {
      setItems(
        (currentItems) =>
          currentItems.map(
            (item) =>
              item.id === itemId
                ? {
                    ...item,
                    discounts: [
                      ...(Array.isArray(
                        item.discounts
                      )
                        ? item.discounts
                        : []),
                      createDiscountRow(),
                    ],
                  }
                : item
          )
      );

      setOpenItemDiscountId(itemId);
    };


  const updateItemDiscount =
    (itemId, discountId, field, value) => {
      setItems(
        (currentItems) =>
          currentItems.map(
            (item) =>
              item.id === itemId
                ? {
                    ...item,
                    discounts: (
                      Array.isArray(
                        item.discounts
                      )
                        ? item.discounts
                        : []
                    ).map(
                      (row) =>
                        row.id === discountId
                          ? {
                              ...row,
                              [field]: value,
                            }
                          : row
                    ),
                  }
                : item
          )
      );
    };


  const removeItemDiscount =
    (itemId, discountId) => {
      setItems(
        (currentItems) =>
          currentItems.map(
            (item) =>
              item.id === itemId
                ? {
                    ...item,
                    discounts: (
                      Array.isArray(
                        item.discounts
                      )
                        ? item.discounts
                        : []
                    ).filter(
                      (row) =>
                        row.id !== discountId
                    ),
                  }
                : item
          )
      );
    };


  /* =======================================================
     SATIR SİL
  ======================================================= */

  const removeItem =
    (id) => {

      setItems(
        items.filter(
          (item) =>
            item.id !== id
        )
      );

    };


  /* =======================================================
     HESAPLAMA
  ======================================================= */

  const calculated =
    useMemo(() => {

      let subtotal = 0;

      let vatTotal = 0;


      const calculatedItems =
        items.map(
          (item) => {

            const quantity =
              numberValue(
                item.quantity
              );


            const unitPrice =
              numberValue(
                item.unitPrice
              );


            const lineGross =
              quantity *
              unitPrice;


            let itemDiscountBase =
              Math.max(
                0,
                lineGross
              );

            let itemDiscountTotal =
              0;

            const calculatedDiscounts =
              (Array.isArray(
                item.discounts
              )
                ? item.discounts
                : []
              ).map(
                (row) => {
                  const rawValue =
                    Math.max(
                      0,
                      numberValue(
                        row.value
                      )
                    );

                  const amount =
                    rawValue <= 0 ||
                    itemDiscountBase <= 0
                      ? 0
                      : row.type ===
                        "percent"
                        ? Math.min(
                            itemDiscountBase,
                            itemDiscountBase *
                              rawValue /
                              100
                          )
                        : Math.min(
                            itemDiscountBase,
                            rawValue
                          );

                  const baseBefore =
                    itemDiscountBase;

                  itemDiscountBase =
                    Math.max(
                      0,
                      itemDiscountBase -
                        amount
                    );

                  itemDiscountTotal +=
                    amount;

                  return {
                    ...row,
                    calculatedAmount:
                      amount,
                    baseBefore,
                    baseAfter:
                      itemDiscountBase,
                  };
                }
              );

            const lineDiscount =
              itemDiscountTotal;

            const lineNet =
              Math.max(
                0,
                itemDiscountBase
              );

            const vatRate =
              numberValue(
                item.vatRate
              );

            const lineVat =
              lineNet *
              vatRate /
              100;

            subtotal +=
              lineNet;

            vatTotal +=
              lineVat;

            return {
              ...item,
              discounts: Array.isArray(
                item.discounts
              )
                ? item.discounts
                : [],
              calculatedDiscounts,
              discount: lineDiscount,
              quantity,
              unitPrice,
              lineGross,
              lineDiscount,
              lineNet,
              lineVat,
              lineTotal:
                lineNet +
                lineVat,
            };

          }
        );


      const invoiceDiscount =
        calculatedItems.reduce(
          (sum, item) =>
            sum +
            numberValue(
              item.lineDiscount
            ),
          0
        );


      const taxableSubtotal =
        Math.max(
          0,
          subtotal
        );


      return {
        calculatedItems,
        subtotal,
        invoiceDiscount,
        vatTotal,
        total:
          taxableSubtotal +
          vatTotal,
      };

    }, [
      items,
    ]);



  /* =======================================================
     FATURA FİNANS DURUMU
  ======================================================= */

  const currentInvoice =
    editId
      ? getInvoices().find(
          (invoice) =>
            String(invoice.id) ===
            String(editId)
        )
      : detailInvoice;

  const isDetailInvoice =
    Boolean(
      editId &&
      currentInvoice
    );

  const currentPaidAmount =
    numberValue(
      currentInvoice?.paidAmount
    );

  const currentTotal =
    numberValue(
      currentInvoice?.total
    );

  const currentRemaining =
    Math.max(
      0,
      currentTotal -
        currentPaidAmount
    );

  const isSalesInvoice =
    normalizeType(
      invoiceType
    ) === "sales";

  const isPurchaseInvoice =
    normalizeType(
      invoiceType
    ) === "purchase";


  const openFinanceModal =
    (mode) => {

      if (
        !currentInvoice
      ) {
        return;
      }

      const remaining =
        Math.max(
          0,
          numberValue(
            currentInvoice.total
          ) -
          numberValue(
            currentInvoice.paidAmount
          )
        );

      if (remaining <= 0) {
        alert(
          mode === "payment"
            ? "Bu alış faturası tamamen ödenmiştir."
            : "Bu satış faturası tamamen tahsil edilmiştir."
        );
        return;
      }

      const availableAccounts =
        readAccounts();

      setAccounts(
        availableAccounts
      );

      setFinanceMode(
        mode
      );

      setFinanceAmount(
        String(
          remaining
        )
      );

      setFinanceDate(
        today()
      );

      setFinanceMethod(
        mode === "payment"
          ? "Havale / EFT"
          : "Havale / EFT"
      );

      setFinanceAccountId(
        availableAccounts[0]?.id ||
          ""
      );

      setFinanceDescription(
        mode === "payment"
          ? `${currentInvoice.invoiceNo} numaralı alış faturası ödemesi`
          : `${currentInvoice.invoiceNo} numaralı satış faturası tahsilatı`
      );

      setShowFinanceModal(
        true
      );
    };


  const refreshFinanceDetail =
    () => {

      if (!editId) {
        return;
      }

      const fresh =
        getInvoices().find(
          (invoice) =>
            String(invoice.id) ===
            String(editId)
        );

      if (fresh) {
        setDetailInvoice(
          fresh
        );

        setAccounts(
          readAccounts()
        );
      }
    };


  const saveFinanceTransaction =
    () => {

      if (
        financeSaving
      ) {
        return;
      }

      if (
        !currentInvoice
      ) {
        alert(
          "Fatura bulunamadı."
        );
        return;
      }

      const amount =
        numberValue(
          financeAmount
        );

      const alreadyProcessed =
        numberValue(
          currentInvoice.paidAmount
        );

      const remaining =
        Math.max(
          0,
          numberValue(
            currentInvoice.total
          ) -
          alreadyProcessed
        );

      if (amount <= 0) {
        alert(
          financeMode ===
          "payment"
            ? "Ödeme tutarı 0'dan büyük olmalıdır."
            : "Tahsilat tutarı 0'dan büyük olmalıdır."
        );
        return;
      }

      if (amount > remaining) {
        alert(
          `Tutar kalan tutardan fazla olamaz.\n\nKalan: ${money(
            remaining
          )} TL`
        );
        return;
      }

      if (!financeAccountId) {
        alert(
          "Lütfen kasa, banka veya POS hesabı seçin."
        );
        return;
      }

      const account =
        readAccounts().find(
          (item) =>
            String(item.id) ===
            String(financeAccountId)
        );

      if (!account) {
        alert(
          "Finans hesabı bulunamadı."
        );
        return;
      }

      if (
        !currentInvoice.customerId
      ) {
        alert(
          financeMode ===
          "payment"
            ? "Bu alış faturasına bağlı tedarikçi bulunamadı."
            : "Bu satış faturasına bağlı müşteri bulunamadı."
        );
        return;
      }

      setFinanceSaving(
        true
      );

      try {

        const newProcessed =
          alreadyProcessed +
          amount;

        const completed =
          newProcessed >=
          numberValue(
            currentInvoice.total
          );

        const updatedInvoice =
          updateInvoice(
            currentInvoice.id,
            {
              paidAmount:
                newProcessed,

              paymentStatus:
                completed
                  ? (
                      financeMode ===
                      "payment"
                        ? "Ödendi"
                        : "Tahsil Edildi"
                    )
                  : (
                      financeMode ===
                      "payment"
                        ? "Kısmi Ödeme"
                        : "Kısmi Tahsilat"
                    ),

              status:
                completed
                  ? "paid"
                  : "open",

              lastPaymentDate:
                financeDate,

              lastPaymentMethod:
                financeMethod,

              lastPaymentAccount:
                account.name,

              lastPaymentAmount:
                amount,

              updatedAt:
                new Date().toISOString(),
            }
          );

        if (!updatedInvoice) {
          throw new Error(
            "Fatura ödeme/tahsilat bilgisi güncellenemedi."
          );
        }


        /*
         * CARİ
         *
         * Satış tahsilatı:
         * müşteri borcunu azaltır.
         *
         * Alış ödemesi:
         * tedarikçiye olan borcu azaltır.
         */

        const normalizedType =
          normalizeType(
            currentInvoice.type
          );

        if (
          financeMode ===
          "collection" &&
          normalizedType ===
          "sales"
        ) {

          updateCustomerBalance(
            currentInvoice.customerId,
            amount
          );

        }

        if (
          financeMode ===
          "payment" &&
          normalizedType ===
          "purchase"
        ) {

          updateCustomerBalance(
            currentInvoice.customerId,
            -amount
          );

        }


        /*
         * FİNANS HESABI
         *
         * Tahsilat = giriş
         * Ödeme = çıkış
         */

        const currentAccounts =
          readAccounts();

        const updatedAccounts =
          currentAccounts.map(
            (item) => {

              if (
                String(item.id) !==
                String(account.id)
              ) {
                return item;
              }

              const currentBalance =
                numberValue(
                  item.balance
                );

              return {
                ...item,

                balance:
                  financeMode ===
                  "payment"
                    ? currentBalance -
                      amount
                    : currentBalance +
                      amount,
              };
            }
          );

        saveAccounts(
          updatedAccounts
        );


        /*
         * FİNANS HAREKETİ
         */

        const existingMovements =
          readMovements();

        const movement = {
          id:
            `FIN-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,

          accountId:
            account.id,

          accountName:
            account.name,

          accountType:
            account.type,

          direction:
            financeMode ===
            "payment"
              ? "Çıkış"
              : "Giriş",

          amount,

          description:
            financeDescription.trim() ||
            currentInvoice.invoiceNo,

          date:
            financeDate,

          method:
            financeMethod,

          source:
            financeMode ===
            "payment"
              ? "payment"
              : "collection",

          sourceId:
            currentInvoice.id,

          sourceDocument:
            currentInvoice.invoiceNo,

          invoiceId:
            currentInvoice.id,

          invoiceNo:
            currentInvoice.invoiceNo,

          customerId:
            currentInvoice.customerId,

          customerName:
            currentInvoice.customerName ||
            currentInvoice.supplierName ||
            selectedCustomer?.name ||
            "",

          createdAt:
            new Date().toISOString(),
        };

        saveMovements([
          movement,
          ...existingMovements,
        ]);


        window.dispatchEvent(
          new Event(
            "ren-invoices-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "ren-customers-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "ren-cash-bank-updated"
          )
        );


        setShowFinanceModal(
          false
        );

        setFinanceAmount(
          ""
        );

        setFinanceAccountId(
          ""
        );

        setFinanceDescription(
          ""
        );

        refreshFinanceDetail();


        alert(
          `${money(
            amount
          )} TL ${
            financeMode ===
            "payment"
              ? "ödeme"
              : "tahsilat"
          } başarıyla kaydedildi.`
        );

      } catch (
        error
      ) {

        console.error(
          "REN ERP finans işlemi hatası:",
          error
        );

        alert(
          error?.message ||
          "İşlem kaydedilirken bir hata oluştu."
        );

      } finally {

        setFinanceSaving(
          false
        );
      }
    };


  /* =======================================================
     STOK KONTROLÜ
  ======================================================= */

  const checkSalesStock =
    () => {

      if (
        invoiceType !==
        "sales"
      ) {
        return null;
      }


      if (
        !stockTracking
      ) {
        return null;
      }


      return calculated
        .calculatedItems
        .find(
          (item) => {

            const product =
              products.find(
                (p) =>
                  String(
                    p.id
                  ) ===
                  String(
                    item.productId
                  )
              );


            if (!product) {
              return null;
            }


            const currentStock =
              numberValue(
                product.stock
              );


            const requested =
              numberValue(
                item.quantity
              );


            if (
              requested >
              currentStock
            ) {
              return {
                ...item,

                currentStock,

                requested,
              };
            }


            return null;

          }
        );

    };


  /* =======================================================
     STOK HAREKETİ
  ======================================================= */

  const applyStockMovement =
    (
      invoice
    ) => {

      if (
        !stockTracking
      ) {
        return;
      }


      const type =
        normalizeType(
          invoiceType
        );


      calculated
        .calculatedItems
        .forEach(
          (item) => {

            const quantity =
              numberValue(
                item.quantity
              );


            if (
              quantity <= 0 ||
              !item.productId
            ) {
              return;
            }


            /*
             * SATIŞ
             * Stoktan düşer.
             */

            if (
              type === "sales"
            ) {

              changeStock(
                item.productId,
                -quantity,
                {

                  type:
                    "Satış Faturası",

                  source:
                    "Fatura",

                  sourceId:
                    invoice.id,

                  description:
                    `${invoice.invoiceNo} numaralı satış faturası.`,

                }
              );

              return;
            }


            /*
             * ALIŞ
             * Stoğa girer.
             */

            if (
              type === "purchase"
            ) {

              changeStock(
                item.productId,
                quantity,
                {

                  type:
                    "Alış Faturası",

                  source:
                    "Fatura",

                  sourceId:
                    invoice.id,

                  description:
                    `${invoice.invoiceNo} numaralı alış faturası.`,

                }
              );

              return;
            }


            /*
             * İADE
             * Stoğa geri girer.
             */

            if (
              type === "return"
            ) {

              changeStock(
                item.productId,
                quantity,
                {

                  type:
                    "İade Faturası",

                  source:
                    "Fatura",

                  sourceId:
                    invoice.id,

                  description:
                    `${invoice.invoiceNo} numaralı iade faturası.`,

                }
              );

            }

          }
        );

    };


  /* =======================================================
     CARİ HAREKET
  ======================================================= */

  const applyCustomerMovement =
    (
      invoice
    ) => {

      /*
       * Peşin faturalar cari bakiyeye
       * borç olarak işlenmez.
       */

      const credit =
        paymentMethod ===
        "Vadeli";


      if (!credit) {
        return;
      }


      if (
        !selectedCustomer
      ) {
        return;
      }


      const total =
        numberValue(
          calculated.total
        );


      if (
        total <= 0
      ) {
        return;
      }


      const type =
        normalizeType(
          invoiceType
        );


      /*
       * SATIŞ
       *
       * Müşterinin bize borcu oluşur.
       *
       * Mevcut REN cari yapısında
       * satış için negatif bakiye
       * kullanılıyor.
       */

      if (
        type === "sales"
      ) {

        updateCustomerBalance(
          selectedCustomer.id,
          -total
        );

        return;
      }


      /*
       * ALIŞ
       *
       * Tedarikçiye borcumuz oluşur.
       */

      if (
        type === "purchase"
      ) {

        updateCustomerBalance(
          selectedCustomer.id,
          total
        );

        return;
      }


      /*
       * İADE
       *
       * Satış iadesi varsayılan olarak
       * müşteri borcunu azaltır.
       */

      if (
        type === "return"
      ) {

        updateCustomerBalance(
          selectedCustomer.id,
          total
        );

      }

    };


  /* =======================================================
     KAYDET
  ======================================================= */

  const handleSave =
    () => {

      if (saving) {
        return;
      }

      if (!selectedCustomer) {
        alert(
          invoiceType === "purchase"
            ? "Lütfen tedarikçi seçin."
            : "Lütfen cari seçin."
        );
        return;
      }

      if (items.length === 0) {
        alert("Lütfen faturaya en az bir ürün ekleyin.");
        return;
      }

      if (calculated.total <= 0) {
        alert("Fatura toplamı 0 TL olamaz.");
        return;
      }

      const invalidStock = checkSalesStock();
      if (invalidStock) {
        alert(
          `"${invalidStock.productName}" için mevcut stok yetersiz.\n\nMevcut stok: ${money(
            invalidStock.currentStock
          )}\nİstenen çıkış: ${money(
            invalidStock.requested
          )}`
        );
        return;
      }

      setSaving(true);

      try {
        const normalizedType =
          normalizeType(invoiceType);

        const customerName =
          selectedCustomer.name ||
          selectedCustomer.title ||
          selectedCustomer.companyName ||
          "";

        const invoiceData = {
          type: normalizedType,
          invoiceNo:
            invoiceNo ||
            getNextInvoiceNumber(
              normalizedType
            ),
          date: invoiceDate || today(),
          dueDate: dueDate || "",

          customerId: selectedCustomer.id,
          customerName,
          customerCode:
            selectedCustomer.code || "",

          supplierId:
            normalizedType === "purchase"
              ? selectedCustomer.id
              : "",
          supplierName:
            normalizedType === "purchase"
              ? customerName
              : "",
          supplierCode:
            normalizedType === "purchase"
              ? selectedCustomer.code || ""
              : "",

          paymentMethod,
          paymentStatus:
            paymentMethod === "Peşin"
              ? "Ödendi"
              : "Bekliyor",
          status:
            paymentMethod === "Peşin"
              ? "paid"
              : "open",

          stockTracking,
          items: calculated.calculatedItems,
          subtotal: calculated.subtotal,
          discountTotal: calculated.invoiceDiscount,
          discount: calculated.invoiceDiscount,
          vatTotal: calculated.vatTotal,
          total: calculated.total,
          extraInvoiceNo:
            showExtraInvoiceNo
              ? extraInvoiceNo.trim()
              : "",
          orderInfo: {
            orderNo: orderInfo.orderNo.trim(),
            orderDate: orderInfo.orderDate,
            deliveryDate: orderInfo.deliveryDate,
            description: orderInfo.description.trim(),
          },
          notes,
        };

        let saved;

        if (editId) {
          saved = updateInvoice(
            editId,
            invoiceData
          );
        } else {
          saved = addInvoice(invoiceData);
        }

        if (!saved || !saved.id) {
          throw new Error(
            "Fatura kaydı oluşturulamadı."
          );
        }

        // Fatura kaydı tamamlandı. Yan hareketler
        // faturanın kendisini geçersiz hale getirmesin.
        if (!editId) {
          try {
            applyStockMovement(saved);
          } catch (stockError) {
            console.error(
              "REN ERP stok hareketi hatası:",
              stockError
            );
          }

          try {
            applyCustomerMovement(saved);
          } catch (customerError) {
            console.error(
              "REN ERP cari hareketi hatası:",
              customerError
            );
          }
        }

        window.dispatchEvent(
          new Event("ren-invoices-updated")
        );
        window.dispatchEvent(
          new Event("ren-stock-updated")
        );
        window.dispatchEvent(
          new Event("ren-stock-movements-changed")
        );
        window.dispatchEvent(
          new Event("ren-customers-updated")
        );

        setSaving(false);

        alert(
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

        setSaving(false);

        alert(
          error?.message ||
          "Fatura kaydedilirken bir hata oluştu."
        );
      }
    };


  /* =======================================================
     GÖRÜNÜM
  ======================================================= */

  return (
    <>
      <div className="parasut-invoice-page">


      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="parasut-page-header">

        <div className="parasut-page-title">

          <div className="parasut-breadcrumb">

            <span>
              Faturalar
            </span>

            <b>
              ›
            </b>

            <span>
              {invoiceType ===
              "purchase"
                ? "Alış"
                : invoiceType ===
                  "return"
                  ? "İade"
                  : "Satış"}
            </span>

          </div>


          <h1>
            {editId
              ? "Fatura Düzenle"
              : getTypeTitle(
                  invoiceType
                )}
          </h1>

        </div>


        <div className="parasut-header-actions">

          {isDetailInvoice &&
            isSalesInvoice && (

            <button
              type="button"
              className="parasut-save-button"
              onClick={() =>
                openFinanceModal(
                  "collection"
                )
              }
              disabled={
                currentRemaining <= 0
              }
            >
              {currentRemaining <= 0
                ? "TAHSİL EDİLDİ"
                : "+ TAHSİLAT EKLE"}
            </button>

          )}

          {isDetailInvoice &&
            isPurchaseInvoice && (

            <button
              type="button"
              className="parasut-save-button"
              onClick={() =>
                openFinanceModal(
                  "payment"
                )
              }
              disabled={
                currentRemaining <= 0
              }
            >
              {currentRemaining <= 0
                ? "ÖDENDİ"
                : "+ ÖDEME EKLE"}
            </button>

          )}

          <button
            type="button"
            className="parasut-cancel-button"
            onClick={() =>
              window.location.href =
                "/invoices"
            }
          >
            VAZGEÇ
          </button>


          <button
            type="button"
            className="parasut-save-button"
            disabled={saving}
            onClick={
              handleSave
            }
          >

            <MdSave />

            {saving
              ? "KAYDEDİLİYOR..."
              : "KAYDET"}

          </button>


          <button
            type="button"
            className="parasut-save-arrow"
          >
            <MdKeyboardArrowDown />
          </button>

        </div>

      </div>


      {/* ===================================================
          ANA FATURA KARTI
      =================================================== */}

      <div className="parasut-invoice-card">


        {/* FATURA İSMİ */}

        <div className="parasut-row parasut-invoice-name-row">

          <div className="parasut-row-icon document-icon">
            ▤
          </div>


          <div className="parasut-label">
            FATURA İSMİ
          </div>


          <div className="parasut-control">

            <input
              className="parasut-input"
              value={
                invoiceNo
              }
              onChange={(
                event
              ) =>
                setInvoiceNo(
                  event.target.value
                )
              }
              placeholder="Fatura adı"
            />

          </div>

        </div>


        {/* MÜŞTERİ / TEDARİKÇİ */}

        <div className="parasut-row customer-row">

          <div className="parasut-row-icon">
            ▦
          </div>


          <div className="parasut-label">

            {invoiceType ===
            "purchase"
              ? "TEDARİKÇİ"
              : "MÜŞTERİ"}

          </div>


          <div className="parasut-control customer-control">

            {selectedCustomer ? (

              <div className="selected-customer">

                <strong>
                  {
                    selectedCustomer.name ||
                    selectedCustomer.title ||
                    selectedCustomer.companyName
                  }
                </strong>


                <span>
                  {
                    selectedCustomer.code ||
                    ""
                  }
                </span>


                <button
                  type="button"
                  onClick={() => {

                    setSelectedCustomer(
                      null
                    );

                    setCustomerSearch(
                      ""
                    );

                    setShowCustomerDropdown(
                      true
                    );

                  }}
                >
                  Değiştir
                </button>

              </div>

            ) : (

              <div
                className="parasut-search-box customer-picker-box"
                onClick={() =>
                  setShowCustomerDropdown(true)
                }
              >

                <MdSearch />


                <input
                  value={
                    customerSearch
                  }
                  onFocus={() =>
                    setShowCustomerDropdown(true)
                  }
                  onChange={(
                    event
                  ) => {
                    setCustomerSearch(
                      event.target.value
                    );
                    setShowCustomerDropdown(true);
                  }}
                  onBlur={() =>
                    window.setTimeout(
                      () =>
                        setShowCustomerDropdown(false),
                      150
                    )
                  }
                  placeholder={
                    invoiceType ===
                    "purchase"
                      ? "Tedarikçi seçin veya arayın..."
                      : "Müşteri seçin veya arayın..."
                  }
                />


                {showCustomerDropdown &&
                  customerResults.length >
                    0 && (

                  <div className="parasut-dropdown customer-dropdown-panel">

                    <div className="parasut-dropdown-header">
                      {invoiceType ===
                      "purchase"
                        ? "Kayıtlı Tedarikçiler"
                        : "Kayıtlı Cariler"}
                    </div>

                    {customerResults.map(
                      (
                        customer
                      ) => (

                        <button
                          type="button"
                          key={
                            customer.id
                          }
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() => {

                            setSelectedCustomer(
                              customer
                            );

                            setCustomerSearch(
                              ""
                            );

                            setShowCustomerDropdown(
                              false
                            );

                          }}
                        >

                          <span className="customer-option-main">
                            <strong>
                              {
                                customer.name ||
                                customer.title ||
                                customer.companyName
                              }
                            </strong>

                            <small>
                              {
                                customer.phone ||
                                customer.city ||
                                customer.email ||
                                "Cari hesabı"
                              }
                            </small>
                          </span>

                          <span>
                            {
                              customer.code ||
                              ""
                            }
                          </span>

                        </button>

                      )
                    )}

                  </div>

                )}

                {showCustomerDropdown &&
                  customerResults.length ===
                    0 && (
                  <div className="parasut-dropdown customer-dropdown-panel">
                    <div className="parasut-dropdown-empty">
                      {invoiceType ===
                      "purchase"
                        ? "Kayıtlı tedarikçi bulunamadı."
                        : "Kayıtlı cari bulunamadı."}
                    </div>
                  </div>
                )}

              </div>

            )}


            <div className="parasut-help-text">

              <span>
                ⓘ
              </span>

              Kayıtlı bir cari seçebilir veya arama yapabilirsiniz.

            </div>

          </div>

        </div>


        {/* CARİ BİLGİLERİ */}

        <div className="parasut-row customer-info-row">

          <div className="parasut-row-icon">
            ▤
          </div>


          <div className="parasut-label">
            CARİ BİLGİLERİ
          </div>


          <div className="parasut-control">

            {selectedCustomer ? (

              <div className="customer-information">

                {selectedCustomer.phone ||
                  selectedCustomer.email ||
                  selectedCustomer.city ||
                  "—"}

              </div>

            ) : (

              <div className="empty-value">
                —
              </div>

            )}

          </div>

        </div>


        {/* TAHSİLAT DURUMU */}

        <div className="parasut-row payment-status-row">

          <div className="parasut-row-icon">
            ?
          </div>


          <div className="parasut-label">
            TAHSİLAT DURUMU
          </div>


          <div className="parasut-control">

            <div className="parasut-radio-group">

              <button
                type="button"
                className={
                  paymentMethod ===
                  "Vadeli"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setPaymentMethod(
                    "Vadeli"
                  )
                }
              >

                <span className="radio-dot">
                  ✓
                </span>

                TAHSİL EDİLECEK

              </button>


              <button
                type="button"
                className={
                  paymentMethod ===
                  "Peşin"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setPaymentMethod(
                    "Peşin"
                  )
                }
              >

                <span className="radio-dot">
                  ✓
                </span>

                TAHSİL EDİLDİ

              </button>

            </div>

          </div>

        </div>


        {/* TARİH */}

        <div className="parasut-row">

          <div className="parasut-row-icon">
            <MdCalendarToday />
          </div>


          <div className="parasut-label">
            DÜZENLEME TARİHİ
          </div>


          <div className="parasut-control">

            <div className="parasut-date-input">

              <input
                type="date"
                value={
                  invoiceDate
                }
                onChange={(
                  event
                ) =>
                  setInvoiceDate(
                    event.target.value
                  )
                }
              />


              <MdCalendarToday />

            </div>

          </div>

        </div>


        {/* VADE */}

        <div className="parasut-row">

          <div className="parasut-row-icon">
            ●
          </div>


          <div className="parasut-label">
            VADE TARİHİ
          </div>


          <div className="parasut-control">

            <div className="parasut-due-buttons">

              {[
                {
                  label:
                    "AYNI GÜN",
                  days:
                    0,
                },

                {
                  label:
                    "7 GÜN",
                  days:
                    7,
                },

                {
                  label:
                    "14 GÜN",
                  days:
                    14,
                },

                {
                  label:
                    "30 GÜN",
                  days:
                    30,
                },

                {
                  label:
                    "60 GÜN",
                  days:
                    60,
                },
              ].map(
                (
                  option
                ) => (

                  <button
                    type="button"
                    key={
                      option.days
                    }
                    className={
                      dueDate ===
                      (() => {

                        const date =
                          new Date(
                            `${invoiceDate}T12:00:00`
                          );

                        date.setDate(
                          date.getDate() +
                          option.days
                        );

                        return date
                          .toISOString()
                          .slice(
                            0,
                            10
                          );

                      })()
                        ? "active"
                        : ""
                    }
                    onClick={() => {

                      const date =
                        new Date(
                          `${invoiceDate}T12:00:00`
                        );

                      date.setDate(
                        date.getDate() +
                        option.days
                      );

                      setDueDate(
                        date
                          .toISOString()
                          .slice(
                            0,
                            10
                          )
                      );

                    }}
                  >
                    {
                      option.label
                    }
                  </button>

                )
              )}

            </div>


            <div className="parasut-date-input">

              <input
                type="date"
                value={
                  dueDate
                }
                onChange={(
                  event
                ) =>
                  setDueDate(
                    event.target.value
                  )
                }
              />


              <MdCalendarToday />

            </div>

          </div>

        </div>


        {/* EK BUTONLAR */}

        <div className="parasut-extra-buttons">

          <button
            type="button"
            className={
              showExtraInvoiceNo
                ? "active"
                : ""
            }
            onClick={() =>
              setShowExtraInvoiceNo(
                (current) => !current
              )
            }
          >
            {showExtraInvoiceNo
              ? "− FATURA NO KALDIR"
              : "+ FATURA NO EKLE"}
          </button>


          <button
            type="button"
            onClick={() =>
              setShowOrderModal(true)
            }
          >
            + SİPARİŞ BİLGİSİ EKLE
          </button>

        </div>


        {showExtraInvoiceNo && (
          <div className="parasut-extra-invoice-row">
            <div className="parasut-row-icon">#</div>
            <div className="parasut-label">EK FATURA NO</div>
            <div className="parasut-control">
              <input
                className="parasut-input"
                value={extraInvoiceNo}
                onChange={(event) =>
                  setExtraInvoiceNo(
                    event.target.value
                  )
                }
                placeholder="Ek fatura numarası"
              />
            </div>
          </div>
        )}


        {(orderInfo.orderNo ||
          orderInfo.orderDate ||
          orderInfo.deliveryDate ||
          orderInfo.description) && (
          <div className="parasut-order-summary">
            <div>
              <strong>SİPARİŞ BİLGİSİ</strong>
              <span>
                {orderInfo.orderNo ||
                  "Sipariş bilgisi eklendi"}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setShowOrderModal(true)
              }
            >
              DÜZENLE
            </button>
          </div>
        )}


        {/* STOK TAKİBİ */}

        <div className="parasut-stock-section">

          <div className="parasut-row-icon">
            ▦
          </div>


          <div className="parasut-label">
            STOK TAKİBİ
          </div>


          <div className="parasut-stock-options">

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

              <span className="stock-radio">
                {
                  stockTracking
                    ? "✓"
                    : "○"
                }
              </span>


              <div>

                <strong>
                  STOK ÇIKIŞI YAPILSIN
                </strong>


                <small>
                  Fatura kaydedildiğinde stok hareketi oluşturulur.
                </small>

              </div>

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

              <span className="stock-radio">
                {
                  !stockTracking
                    ? "✓"
                    : "○"
                }
              </span>


              <div>

                <strong>
                  STOK ÇIKIŞI YAPILMASIN
                </strong>


                <small>
                  Fatura stok miktarını değiştirmeden kaydedilir.
                </small>

              </div>

            </button>

          </div>

        </div>

      </div>


      {/* ===================================================
          SAĞ PANEL
      =================================================== */}

      <aside className="parasut-side-column">

        <div className="parasut-side-card">

          <div className="side-card-title">
            📁 FATURA KATEGORİSİ
          </div>


          <div className="side-select">

            <span>
              KATEGORİSİZ
            </span>

            <MdKeyboardArrowDown />

          </div>


          <p>
            Faturaların kategorilere göre
            dağılımını raporlarda takip
            edebilirsiniz.
          </p>

        </div>


        <div className="parasut-side-card">

          <div className="side-card-title">
            🏷 ETİKETLER
          </div>


          <div className="side-select">

            <span>
              ETİKETSİZ
            </span>

            <MdKeyboardArrowDown />

          </div>


          <p>
            Faturaları etiket bazında
            takip edebilirsiniz.
          </p>

        </div>

      </aside>


      {/* ===================================================
          ÜRÜNLER
      =================================================== */}

      <section className="parasut-products-card">


        <div className="parasut-products-header">

          <div className="product-header-title">
            HİZMET / ÜRÜN
          </div>

          <div>
            GİRİŞ DEPOSU
          </div>

          <div>
            MİKTAR
          </div>

          <div>
            BİRİM
          </div>

          <div>
            BR. FİYAT
          </div>

          <div>
            VERGİ
          </div>

          <div>
            İSKONTO
          </div>

          <div>
            TOPLAM
          </div>

          <div />

        </div>


        {/* ÜRÜN / HİZMET SATIRLARI */}

        {calculated.calculatedItems.map(
          (
            item
          ) => (

            <div
              className="parasut-product-row"
              key={
                item.id
              }
            >

              <div className="product-name-cell product-picker-cell">

                <div
                  className="parasut-product-search"
                >

                  <MdSearch />

                  <input
                    data-product-row={
                      item.id
                    }
                    value={
                      activeProductRowId === item.id
                        ? productSearch
                        : item.productName
                    }
                    onFocus={() => {
                      setActiveProductRowId(
                        item.id
                      );

                      setProductSearch(
                        item.productName ||
                        ""
                      );

                      setShowProductDropdown(
                        true
                      );
                    }}
                    onChange={(
                      event
                    ) => {

                      updateItem(
                        item.id,
                        "productName",
                        event.target.value
                      );

                      updateItem(
                        item.id,
                        "productId",
                        ""
                      );

                      updateItem(
                        item.id,
                        "productCode",
                        ""
                      );

                      setActiveProductRowId(
                        item.id
                      );

                      setProductSearch(
                        event.target.value
                      );

                      setShowProductDropdown(
                        true
                      );

                    }}
                    onBlur={() =>
                      window.setTimeout(
                        () =>
                          setShowProductDropdown(
                            false
                          ),
                        150
                      )
                    }
                    placeholder="Ürün / hizmet adı, kodu veya barkod..."
                  />

                </div>


                {showProductDropdown &&
                  activeProductRowId === item.id &&
                  productResults.length >
                    0 && (

                  <div className="parasut-product-dropdown">

                    <div className="parasut-dropdown-header">
                      Kayıtlı Ürünler
                    </div>

                    {productResults.map(
                      (
                        product
                      ) => (

                        <button
                          type="button"
                          key={
                            product.id
                          }
                          onMouseDown={(
                            event
                          ) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            addProductToRow(
                              item.id,
                              product
                            )
                          }
                        >

                          <div>

                            <strong>
                              {
                                productName(
                                  product
                                )
                              }
                            </strong>

                            <small>
                              {
                                productCode(
                                  product
                                ) ||
                                "Kayıtlı ürün"
                              }
                            </small>

                          </div>


                          <span>
                            ₺
                            {
                              money(
                                invoiceType ===
                                "purchase"
                                  ? productPurchasePrice(
                                      product
                                    )
                                  : productSalePrice(
                                      product
                                    )
                              )
                            }
                          </span>

                        </button>

                      )
                    )}

                  </div>

                )}

              </div>


              <div>

                <input
                  type="text"
                  className="product-warehouse-input"
                  value={
                    item.warehouse ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateItem(
                      item.id,
                      "warehouse",
                      event.target.value
                    )
                  }
                  placeholder="Depo"
                />

              </div>


              <div>

                <input
                  type="text"
                  inputMode="decimal"
                  className="product-quantity-input"
                  value={item.quantity === null || item.quantity === undefined ? "" : String(item.quantity)}
                  onKeyDown={(event) =>
                    handleNumberInputKeyDown(event, () =>
                      updateItem(item.id, "quantity", "")
                    )
                  }
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9,]/g, "");

                    if (value === "") {
                      updateItem(item.id, "quantity", "");
                      return;
                    }

                    if (/^\d*(?:,\d*)?$/.test(value)) {
                      updateItem(item.id, "quantity", value);
                    }
                  }}
                  onBlur={() => {
                    const raw = String(item.quantity ?? "").trim();
                    updateItem(
                      item.id,
                      "quantity",
                      raw === "" ? 1 : raw
                    );
                  }}
                />

              </div>


              <div>

                <input
                  type="text"
                  className="product-unit-input"
                  value={
                    item.unit ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateItem(
                      item.id,
                      "unit",
                      event.target.value
                    )
                  }
                  placeholder="Adet"
                />

              </div>


              <div>

                <input
                  type="text"
                  inputMode="decimal"
                  className="product-price-input"
                  value={item.unitPrice === "" ? "" : String(item.unitPrice)}
                  onKeyDown={(event) =>
                    insertDecimalSeparator(
                      event,
                      item.unitPrice,
                      (value) => updateItem(item.id, "unitPrice", value)
                    )
                  }
                  onChange={(event) => {
                    let value = event.target.value;

                    value = value.replace(/[^0-9,]/g, "");

                    const firstComma = value.indexOf(",");
                    if (firstComma !== -1) {
                      value =
                        value.slice(0, firstComma + 1) +
                        value.slice(firstComma + 1).replace(/,/g, "");

                      const decimals = value.slice(firstComma + 1);
                      if (decimals.length > 2) {
                        value =
                          value.slice(0, firstComma + 1) +
                          decimals.slice(0, 2);
                      }
                    }

                    updateItem(item.id, "unitPrice", value);
                  }}
                  onBlur={() => {
                    const raw = String(item.unitPrice ?? "").trim();

                    if (raw === "") {
                      updateItem(item.id, "unitPrice", "");
                      return;
                    }

                    updateItem(
                      item.id,
                      "unitPrice",
                      numberValue(raw).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    );
                  }}
                />

              </div>


              <div>

                <input
                  type="text"
                  inputMode="decimal"
                  className="product-vat-input"
                  value={item.vatRate === "" ? "" : String(item.vatRate)}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9,]/g, "");

                    if (value === "") {
                      updateItem(item.id, "vatRate", "");
                      return;
                    }

                    if (/^\d*(?:,\d*)?$/.test(value)) {
                      updateItem(item.id, "vatRate", value);
                    }
                  }}
                  onBlur={() => {
                    const raw = String(item.vatRate ?? "").trim();
                    if (raw === "") return;

                    updateItem(
                      item.id,
                      "vatRate",
                      numberValue(raw).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    );
                  }}
                />

              </div>


              <div className="product-discount-cell">
                <button
                  type="button"
                  className={
                    (item.discounts?.length || 0) > 0
                      ? "product-discount-button active"
                      : "product-discount-button"
                  }
                  onClick={() =>
                    setOpenItemDiscountId(
                      openItemDiscountId === item.id
                        ? null
                        : item.id
                    )
                  }
                >
                  {numberValue(item.lineDiscount) > 0
                    ? `-${money(item.lineDiscount)}₺`
                    : "+ İSKONTO"}
                </button>

                {openItemDiscountId === item.id && (
                  <div className="product-discount-popover">
                    <div className="product-discount-popover-header">
                      <strong>ÜRÜN İSKONTOSU</strong>
                      <button
                        type="button"
                        onClick={() =>
                          addItemDiscount(item.id)
                        }
                      >
                        + İSKONTO
                      </button>
                    </div>

                    {(item.calculatedDiscounts || item.discounts || []).length === 0 ? (
                      <div className="product-discount-empty">
                        Bu ürüne özel iskonto ekleyin.
                      </div>
                    ) : (
                      <div className="product-discount-list">
                        {(item.calculatedDiscounts || item.discounts || []).map(
                          (row, index) => (
                            <div
                              className="product-discount-row"
                              key={row.id}
                            >
                              <span>{index + 1}.</span>

                              <select
                                value={row.type}
                                onChange={(event) =>
                                  updateItemDiscount(
                                    item.id,
                                    row.id,
                                    "type",
                                    event.target.value
                                  )
                                }
                              >
                                <option value="percent">%</option>
                                <option value="amount">₺</option>
                              </select>

                              <input
                                type="text"
                                inputMode="decimal"
                                value={row.value === "" ? "" : String(row.value).replace(".", ",")}
                                onChange={(event) => {
                                  const value = normalizeNumericInput(event.target.value);

                                  updateItemDiscount(
                                    item.id,
                                    row.id,
                                    "value",
                                    value === "" ? "" : value.replace(",", ".")
                                  );
                                }}
                                placeholder="0,00"
                              />

                              <strong>
                                -{money(row.calculatedAmount || 0)}₺
                              </strong>

                              <button
                                type="button"
                                className="product-discount-remove"
                                onClick={() =>
                                  removeItemDiscount(
                                    item.id,
                                    row.id
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="product-discount-popover-total">
                      Toplam İskonto:
                      <strong>
                        -{money(item.lineDiscount || 0)}₺
                      </strong>
                    </div>
                  </div>
                )}
              </div>


              <div>

                <input
                  type="text"
                  inputMode="decimal"
                  className="product-total-input"
                  value={
                    item.lineTotal === "" || item.lineTotal === undefined
                      ? ""
                      : String(item.lineTotal)
                  }
                  onKeyDown={(event) =>
                    insertDecimalSeparator(
                      event,
                      item.lineTotal,
                      (value) => updateItem(item.id, "lineTotal", value)
                    )
                  }
                  onChange={(event) => {
                    let value = event.target.value;

                    value = value.replace(/[^0-9,]/g, "");

                    const firstComma = value.indexOf(",");
                    if (firstComma !== -1) {
                      value =
                        value.slice(0, firstComma + 1) +
                        value.slice(firstComma + 1).replace(/,/g, "");

                      const decimals = value.slice(firstComma + 1);
                      if (decimals.length > 2) {
                        value =
                          value.slice(0, firstComma + 1) +
                          decimals.slice(0, 2);
                      }
                    }

                    updateItem(item.id, "lineTotal", value);
                  }}
                  onBlur={() => {
                    const raw = String(item.lineTotal ?? "").trim();

                    if (raw === "") {
                      updateItem(item.id, "lineTotal", "");
                      return;
                    }

                    updateItem(
                      item.id,
                      "lineTotal",
                      numberValue(raw).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    );
                  }}
                />

              </div>


              <button
                className="product-delete-button"
                type="button"
                onClick={() =>
                  removeItem(
                    item.id
                  )
                }
                aria-label="Satırı sil"
              >

                <MdDeleteOutline />

              </button>

            </div>

          )
        )}


        {/* YENİ SATIR */}

        <button
          className="parasut-add-line"
          type="button"
          onClick={
            addBlankItem
          }
        >

          <MdAdd />

          YENİ SATIR EKLE

        </button>


        {/* =================================================
            TOPLAM
        ================================================= */}

        <div className="parasut-total-area">

          <div className="total-box">

            <div>
              <span>ARA TOPLAM</span>
              <strong>
                {money(calculated.subtotal)}₺
              </strong>
            </div>

            <div className="invoice-discount-total-row">
              <span>ÜRÜN İSKONTOLARI</span>
              <strong>
                -{money(calculated.invoiceDiscount)}₺
              </strong>
            </div>

            <div>
              <span>TOPLAM KDV</span>
              <strong>
                {money(calculated.vatTotal)}₺
              </strong>
            </div>

            <div className="grand-total">
              <span>GENEL TOPLAM</span>
              <strong>
                {money(calculated.total)}₺
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* ===================================================
          ALT BUTONLAR
      =================================================== */}

      <div className="parasut-bottom-actions">

        <button
          type="button"
          className="bottom-cancel"
          onClick={() =>
            window.location.href =
              "/invoices"
          }
        >
          VAZGEÇ
        </button>


        {isDetailInvoice &&
          isSalesInvoice && (
            <button
              type="button"
              className="bottom-save"
              onClick={() =>
                openFinanceModal(
                  "collection"
                )
              }
              disabled={
                currentRemaining <= 0
              }
            >
              {currentRemaining <= 0
                ? "TAHSİL EDİLDİ"
                : "+ TAHSİLAT EKLE"}
            </button>
          )}

        {isDetailInvoice &&
          isPurchaseInvoice && (
            <button
              type="button"
              className="bottom-save"
              onClick={() =>
                openFinanceModal(
                  "payment"
                )
              }
              disabled={
                currentRemaining <= 0
              }
            >
              {currentRemaining <= 0
                ? "ÖDENDİ"
                : "+ ÖDEME EKLE"}
            </button>
          )}

        <button
          type="button"
          className="bottom-save"
          disabled={
            saving
          }
          onClick={
            handleSave
          }
        >

          <MdSave />

          {saving
            ? "KAYDEDİLİYOR..."
            : "KAYDET"}

        </button>

      </div>

    </div>
      {/* ===================================================
          SİPARİŞ BİLGİSİ MODALI
      =================================================== */}

      {showOrderModal && (
        <div
          className="parasut-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowOrderModal(false);
            }
          }}
        >
          <div className="parasut-order-modal">
            <div className="parasut-order-modal-header">
              <div>
                <span>FATURA BAĞLANTISI</span>
                <h2>Sipariş Bilgisi</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setShowOrderModal(false)
                }
              >
                ×
              </button>
            </div>

            <div className="parasut-order-modal-body">
              <div className="parasut-order-field">
                <label>SİPARİŞ NO</label>
                <input
                  value={orderInfo.orderNo}
                  onChange={(event) =>
                    setOrderInfo((current) => ({
                      ...current,
                      orderNo: event.target.value,
                    }))
                  }
                  placeholder="Sipariş numarası"
                />
              </div>

              <div className="parasut-order-field">
                <label>SİPARİŞ TARİHİ</label>
                <input
                  type="date"
                  value={orderInfo.orderDate}
                  onChange={(event) =>
                    setOrderInfo((current) => ({
                      ...current,
                      orderDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="parasut-order-field">
                <label>TESLİM TARİHİ</label>
                <input
                  type="date"
                  value={orderInfo.deliveryDate}
                  onChange={(event) =>
                    setOrderInfo((current) => ({
                      ...current,
                      deliveryDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="parasut-order-field full">
                <label>AÇIKLAMA</label>
                <textarea
                  value={orderInfo.description}
                  onChange={(event) =>
                    setOrderInfo((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Siparişle ilgili not..."
                  rows={4}
                />
              </div>
            </div>

            <div className="parasut-order-modal-footer">
              <button
                type="button"
                className="order-modal-cancel"
                onClick={() =>
                  setShowOrderModal(false)
                }
              >
                VAZGEÇ
              </button>
              <button
                type="button"
                className="order-modal-save"
                onClick={() =>
                  setShowOrderModal(false)
                }
              >
                KAYDET
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ===================================================
          TAHSİLAT / ÖDEME MODALI
      =================================================== */}

      {showFinanceModal && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowFinanceModal(false);
            }
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "620px",
              background: "#fff",
              borderRadius: "10px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,.18)",
              overflow: "hidden",
            }}
          >

            <div
              style={{
                padding: "22px 24px",
                borderBottom:
                  "1px solid #eee",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
              }}
            >

              <div>

                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#8a95a3",
                    marginBottom: "5px",
                  }}
                >
                  {financeMode ===
                  "payment"
                    ? "FATURA ÖDEMESİ"
                    : "FATURA TAHSİLATI"}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    color: "#242b34",
                  }}
                >
                  {financeMode ===
                  "payment"
                    ? "Ödeme Ekle"
                    : "Tahsilat Ekle"}
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    fontSize:
                      "12px",
                    color:
                      "#8a95a3",
                  }}
                >
                  {
                    currentInvoice?.invoiceNo
                  } numaralı fatura
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowFinanceModal(
                    false
                  )
                }
                style={{
                  border: 0,
                  background:
                    "#f2f3f5",
                  width: "34px",
                  height: "34px",
                  borderRadius:
                    "50%",
                  fontSize: "20px",
                  cursor:
                    "pointer",
                }}
              >
                ×
              </button>

            </div>


            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3,1fr)",
                gap: "10px",
                padding:
                  "18px 24px",
                background:
                  "#fafbfc",
              }}
            >

              <div
                style={{
                  padding: "12px",
                  background:
                    "#fff",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "6px",
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    fontSize:
                      "9px",
                    color:
                      "#999",
                    fontWeight:
                      700,
                    marginBottom:
                      "4px",
                  }}
                >
                  FATURA
                </span>

                <strong>
                  {
                    money(
                      currentTotal
                    )
                  } TL
                </strong>
              </div>


              <div
                style={{
                  padding: "12px",
                  background:
                    "#fff",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "6px",
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    fontSize:
                      "9px",
                    color:
                      "#999",
                    fontWeight:
                      700,
                    marginBottom:
                      "4px",
                  }}
                >
                  {
                    financeMode ===
                    "payment"
                      ? "ÖDENEN"
                      : "TAHSİL EDİLEN"
                  }
                </span>

                <strong
                  style={{
                    color:
                      "#3f8f62",
                  }}
                >
                  {
                    money(
                      currentPaidAmount
                    )
                  } TL
                </strong>
              </div>


              <div
                style={{
                  padding: "12px",
                  background:
                    "#fff",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "6px",
                }}
              >
                <span
                  style={{
                    display:
                      "block",
                    fontSize:
                      "9px",
                    color:
                      "#999",
                    fontWeight:
                      700,
                    marginBottom:
                      "4px",
                  }}
                >
                  KALAN
                </span>

                <strong
                  style={{
                    color:
                      currentRemaining >
                      0
                        ? "#c84a43"
                        : "#3f8f62",
                  }}
                >
                  {
                    money(
                      currentRemaining
                    )
                  } TL
                </strong>
              </div>

            </div>


            <div
              style={{
                padding:
                  "22px 24px",
              }}
            >

              <div
                style={{
                  marginBottom:
                    "16px",
                }}
              >

                <label
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "7px",
                    fontSize:
                      "11px",
                    fontWeight:
                      700,
                    color:
                      "#666",
                  }}
                >
                  {
                    financeMode ===
                    "payment"
                      ? "Tedarikçi"
                      : "Müşteri"
                  }
                </label>

                <div
                  style={{
                    minHeight:
                      "42px",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    padding:
                      "0 12px",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "5px",
                    background:
                      "#f8f9fa",
                    fontSize:
                      "12px",
                  }}
                >
                  <strong>
                    {
                      currentInvoice?.customerName ||
                      currentInvoice?.supplierName ||
                      selectedCustomer?.name ||
                      "Cari"
                    }
                  </strong>
                </div>

              </div>


              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "14px",
                  marginBottom:
                    "16px",
                }}
              >

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      marginBottom:
                        "7px",
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                      color:
                        "#666",
                    }}
                  >
                    {
                      financeMode ===
                      "payment"
                        ? "Ödeme Tutarı"
                        : "Tahsilat Tutarı"
                    }
                  </label>

                  <div
                    style={{
                      position:
                        "relative",
                    }}
                  >

                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        financeAmount
                      }
                      onChange={(
                        event
                      ) =>
                        setFinanceAmount(
                          event.target
                            .value
                        )
                      }
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        height:
                          "42px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "5px",
                        padding:
                          "0 48px 0 12px",
                        fontSize:
                          "13px",
                        outline:
                          "none",
                      }}
                    />

                    <span
                      style={{
                        position:
                          "absolute",
                        right:
                          "12px",
                        top:
                          "50%",
                        transform:
                          "translateY(-50%)",
                        color:
                          "#888",
                        fontSize:
                          "11px",
                        fontWeight:
                          700,
                      }}
                    >
                      TL
                    </span>

                  </div>

                </div>


                <div>

                  <label
                    style={{
                      display:
                        "block",
                      marginBottom:
                        "7px",
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                      color:
                        "#666",
                    }}
                  >
                    Tarih
                  </label>

                  <input
                    type="date"
                    value={
                      financeDate
                    }
                    onChange={(
                      event
                    ) =>
                      setFinanceDate(
                        event.target
                          .value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      boxSizing:
                        "border-box",
                      height:
                        "42px",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "5px",
                      padding:
                        "0 12px",
                        fontSize:
                          "12px",
                    }}
                  />

                </div>

              </div>


              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "14px",
                  marginBottom:
                    "16px",
                }}
              >

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      marginBottom:
                        "7px",
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                      color:
                        "#666",
                    }}
                  >
                    Ödeme Yöntemi
                  </label>

                  <select
                    value={
                      financeMethod
                    }
                    onChange={(
                      event
                    ) =>
                      setFinanceMethod(
                        event.target
                          .value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "42px",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "5px",
                      padding:
                        "0 10px",
                      fontSize:
                        "12px",
                    }}
                  >

                    <option>
                      Nakit
                    </option>

                    <option>
                      Havale / EFT
                    </option>

                    <option>
                      Kredi Kartı
                    </option>

                    <option>
                      POS
                    </option>

                    <option>
                      Çek
                    </option>

                    <option>
                      Diğer
                    </option>

                  </select>

                </div>


                <div>

                  <label
                    style={{
                      display:
                        "block",
                      marginBottom:
                        "7px",
                      fontSize:
                        "11px",
                      fontWeight:
                        700,
                      color:
                        "#666",
                    }}
                  >
                    Kasa / Banka / POS
                  </label>

                  <select
                    value={
                      financeAccountId
                    }
                    onChange={(
                      event
                    ) =>
                      setFinanceAccountId(
                        event.target
                          .value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "42px",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "5px",
                      padding:
                        "0 10px",
                      fontSize:
                        "12px",
                    }}
                  >

                    <option value="">
                      Hesap seçin
                    </option>

                    {accounts
                      .filter(
                        (
                          account
                        ) =>
                          account.status !==
                          "Pasif"
                      )
                      .map(
                        (
                          account
                        ) => (

                          <option
                            key={
                              account.id
                            }
                            value={
                              account.id
                            }
                          >
                            {
                              account.name
                            }
                            {" — "}
                            {
                              account.type
                            }
                            {" — ₺"}
                            {
                              money(
                                account.balance
                              )
                            }
                          </option>
                        )
                      )}

                  </select>

                </div>

              </div>


              <div>

                <label
                  style={{
                    display:
                      "block",
                    marginBottom:
                      "7px",
                    fontSize:
                      "11px",
                    fontWeight:
                      700,
                    color:
                      "#666",
                  }}
                >
                  Açıklama
                </label>

                <textarea
                  rows="3"
                  value={
                    financeDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setFinanceDescription(
                      event.target
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    border:
                      "1px solid #ddd",
                    borderRadius:
                      "5px",
                    padding:
                      "10px 12px",
                    resize:
                      "vertical",
                    fontSize:
                      "12px",
                  }}
                />

              </div>

            </div>


            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "8px",
                padding:
                  "16px 24px",
                borderTop:
                  "1px solid #eee",
                background:
                  "#fafbfc",
              }}
            >

              <button
                type="button"
                onClick={() =>
                  setShowFinanceModal(
                    false
                  )
                }
                style={{
                  minHeight:
                    "40px",
                  padding:
                    "0 18px",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "5px",
                  background:
                    "#fff",
                  color:
                    "#666",
                  fontWeight:
                    700,
                  cursor:
                    "pointer",
                }}
              >
                Vazgeç
              </button>


              <button
                type="button"
                onClick={
                  saveFinanceTransaction
                }
                disabled={
                  financeSaving
                }
                style={{
                  minHeight:
                    "40px",
                  padding:
                    "0 20px",
                  border:
                    0,
                  borderRadius:
                    "5px",
                  background:
                    "#59534f",
                  color:
                    "#fff",
                  fontWeight:
                    700,
                  cursor:
                    "pointer",
                  opacity:
                    financeSaving
                      ? 0.6
                      : 1,
                }}
              >
                {financeSaving
                  ? "KAYDEDİLİYOR..."
                  : financeMode ===
                    "payment"
                  ? "ÖDEMEYİ KAYDET"
                  : "TAHSİLATI KAYDET"}
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}