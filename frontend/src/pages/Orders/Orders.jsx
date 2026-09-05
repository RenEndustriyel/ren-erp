import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  addInvoice,
  getNextInvoiceNumber,
} from "../../lib/invoiceStore";

import {
  getCustomers,
  updateCustomerBalance,
} from "../../lib/customerStore";

import {
  addCustomerMovement,
} from "../../lib/movementStore";

import {
  getProducts,
  changeStock,
} from "../../lib/stockStore";

import "./Orders.css";


const ORDERS_KEY =
  "ren-erp-orders";

const CASH_ACCOUNTS_KEY =
  "ren-erp-cash-bank-accounts";

const CASH_MOVEMENTS_KEY =
  "ren-erp-cash-bank-movements";


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


function num(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  const text =
    String(value)
      .trim()
      .replace(/\s/g, "");

  const normalized =
    text.includes(",") &&
    text.includes(".")
      ? text
          .replace(/\./g, "")
          .replace(",", ".")
      : text.replace(",", ".");

  const result =
    Number(normalized);

  return Number.isFinite(result)
    ? result
    : 0;
}


function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function readArray(key) {
  try {
    const raw =
      localStorage.getItem(
        key
      );

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


function saveArray(
  key,
  value
) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


function readOrders() {
  return readArray(
    ORDERS_KEY
  );
}


function saveOrders(
  orders
) {
  saveArray(
    ORDERS_KEY,
    orders
  );

  window.dispatchEvent(
    new Event(
      "ren-orders-updated"
    )
  );
}


function readCashAccounts() {
  return readArray(
    CASH_ACCOUNTS_KEY
  );
}


function saveCashAccounts(
  accounts
) {
  saveArray(
    CASH_ACCOUNTS_KEY,
    accounts
  );

  window.dispatchEvent(
    new Event(
      "ren-cash-bank-updated"
    )
  );
}


function readCashMovements() {
  return readArray(
    CASH_MOVEMENTS_KEY
  );
}


function saveCashMovements(
  movements
) {
  saveArray(
    CASH_MOVEMENTS_KEY,
    movements
  );

  window.dispatchEvent(
    new Event(
      "ren-cash-bank-updated"
    )
  );
}


function customerLabel(
  customer
) {
  return (
    customer?.name ||
    customer?.title ||
    customer?.companyName ||
    "İsimsiz Cari"
  );
}


function productLabel(
  product
) {
  return (
    product?.name ||
    product?.productName ||
    product?.title ||
    "İsimsiz Ürün"
  );
}


function productCode(
  product
) {
  return (
    product?.code ||
    product?.stockCode ||
    product?.barcode ||
    ""
  );
}


function productUnit(
  product
) {
  return (
    product?.unit ||
    product?.unitName ||
    product?.sellingUnit ||
    "Adet"
  );
}


function productPrice(
  product
) {
  return num(
    product?.salesNet ??
      product?.salePrice ??
      product?.sellingPrice ??
      product?.retailPrice ??
      product?.price ??
      0
  );
}


function productVat(
  product
) {
  return num(
    product?.salesVat ??
      product?.vatRate ??
      product?.vat ??
      product?.kdv ??
      20
  );
}


function createItem() {
  return {
    id:
      Date.now() +
      Math.random(),

    productId:
      "",

    productName:
      "",

    productCode:
      "",

    unit:
      "Adet",

    quantity:
      1,

    unitPrice:
      "",

    discount:
      0,

    vat:
      20,
  };
}


function createForm(
  type = "Teklif"
) {
  return {
    type,

    customerId:
      "",

    customerName:
      "",

    customerCode:
      "",

    date:
      today(),

    validUntil:
      "",

    dueDate:
      "",

    status:
      "Taslak",

    paymentMethod:
      "Vadeli",

    paymentAccountId:
      "",

    notes:
      "",

    items: [
      createItem(),
    ],
  };
}


function calculateTotals(
  items
) {
  let gross = 0;
  let discount = 0;
  let subtotal = 0;
  let vat = 0;


  items.forEach(
    (item) => {

      const quantity =
        num(
          item.quantity
        );

      const unitPrice =
        num(
          item.unitPrice
        );

      const lineGross =
        quantity *
        unitPrice;

      const lineDiscount =
        lineGross *
        (
          num(
            item.discount
          ) /
          100
        );

      const lineSubtotal =
        lineGross -
        lineDiscount;

      const lineVat =
        lineSubtotal *
        (
          num(
            item.vat
          ) /
          100
        );

      gross +=
        lineGross;

      discount +=
        lineDiscount;

      subtotal +=
        lineSubtotal;

      vat +=
        lineVat;

    }
  );


  return {
    gross,
    discount,
    subtotal,
    vat,
    total:
      subtotal +
      vat,
  };
}


function nextOrderNumber(
  type,
  orders
) {
  const prefix =
    type === "Teklif"
      ? "TEK"
      : "SIP";

  let max = 0;


  orders.forEach(
    (order) => {

      const value =
        String(
          order.number ||
          ""
        );


      if (
        !value.startsWith(
          `${prefix}-`
        )
      ) {
        return;
      }


      const match =
        value.match(
          /(\d+)$/
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
        number > max
      ) {
        max =
          number;
      }

    }
  );


  return `${prefix}-${String(
    max + 1
  ).padStart(
    5,
    "0"
  )}`;
}


function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      String(value).includes("T")
        ? value
        : `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(
    date
  );
}


function modeFromQuery(
  value
) {
  switch (value) {

    case "offer":
    case "new-offer":
    case "order":
    case "new-order":
    case "converted":
    case "invoice":
    case "reports":
      return value;

    default:
      return "all";
  }
}


/* =========================================================
   COMPONENT
========================================================= */

export default function Orders() {

  const navigate =
    useNavigate();


  const [
    searchParams,
  ] = useSearchParams();


  const [
    orders,
    setOrders,
  ] = useState(
    readOrders
  );


  const [
    customers,
    setCustomers,
  ] = useState(
    () =>
      getCustomers() || []
  );


  const [
    products,
    setProducts,
  ] = useState(
    () =>
      getProducts() || []
  );


  const [
    accounts,
    setAccounts,
  ] = useState(
    readCashAccounts
  );


  const [
    mode,
    setMode,
  ] = useState(
    "list"
  );


  const [
    filter,
    setFilter,
  ] = useState(
    "Tümü"
  );


  const [
    search,
    setSearch,
  ] = useState(
    ""
  );


  const [
    editingId,
    setEditingId,
  ] = useState(
    null
  );


  const [
    form,
    setForm,
  ] = useState(
    () =>
      createForm()
  );


  const [
    processingInvoice,
    setProcessingInvoice,
  ] = useState(
    false
  );


  const queryMode =
    modeFromQuery(
      searchParams.get(
        "type"
      )
    );


  /* =======================================================
     VERİLERİ YENİLE
  ======================================================= */

  const refreshData =
    () => {

      setOrders(
        readOrders()
      );


      try {

        setCustomers(
          getCustomers() ||
          []
        );

      } catch {

        setCustomers(
          []
        );

      }


      try {

        setProducts(
          getProducts() ||
          []
        );

      } catch {

        setProducts(
          []
        );

      }


      setAccounts(
        readCashAccounts()
      );

    };


  useEffect(() => {

    refreshData();


    const events = [
      "ren-orders-updated",
      "ren-products-changed",
      "ren-stock-updated",
      "ren-stock-movements-changed",
      "ren-customers-updated",
      "ren-cash-bank-updated",
      "ren-invoices-updated",
    ];


    events.forEach(
      (event) => {

        window.addEventListener(
          event,
          refreshData
        );

      }
    );


    return () => {

      events.forEach(
        (event) => {

          window.removeEventListener(
            event,
            refreshData
          );

        }
      );

    };

  }, []);


  /* =======================================================
     URL MODLARI
  ======================================================= */

  useEffect(() => {

    if (
      queryMode ===
      "new-offer"
    ) {

      openNew(
        "Teklif"
      );

      return;
    }


    if (
      queryMode ===
      "new-order"
    ) {

      openNew(
        "Sipariş"
      );

      return;
    }


    if (
      queryMode ===
      "offer"
    ) {

      setMode(
        "list"
      );

      setFilter(
        "Teklif"
      );

      return;
    }


    if (
      queryMode ===
      "order"
    ) {

      setMode(
        "list"
      );

      setFilter(
        "Sipariş"
      );

      return;
    }


    if (
      queryMode ===
      "converted"
    ) {

      setMode(
        "list"
      );

      setFilter(
        "Sipariş"
      );

      setSearch(
        "Siparişe Dönüştürüldü"
      );

      return;
    }


    if (
      queryMode ===
      "invoice"
    ) {

      setMode(
        "list"
      );

      setFilter(
        "Sipariş"
      );

      return;
    }


    if (
      queryMode ===
      "reports"
    ) {

      setMode(
        "reports"
      );

      return;
    }


    setMode(
      "list"
    );

  }, [
    queryMode,
  ]);


  /* =======================================================
     FORM
  ======================================================= */

  function openNew(
    type
  ) {

    setEditingId(
      null
    );

    setForm(
      createForm(
        type
      )
    );

    setMode(
      "form"
    );

  }


  function closeForm() {

    setEditingId(
      null
    );

    setForm(
      createForm()
    );

    setMode(
      "list"
    );


    navigate(
      "/orders",
      {
        replace:
          true,
      }
    );

  }


  function updateForm(
    field,
    value
  ) {

    setForm(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );

  }


  function selectCustomer(
    customerId
  ) {

    const customer =
      customers.find(
        (item) =>
          String(
            item.id
          ) ===
          String(
            customerId
          )
      );


    setForm(
      (
        current
      ) => ({
        ...current,

        customerId,

        customerName:
          customer
            ? customerLabel(
                customer
              )
            : "",

        customerCode:
          customer?.code ||
          customer?.customerCode ||
          "",
      })
    );

  }


  function selectProduct(
    itemId,
    productId
  ) {

    const product =
      products.find(
        (item) =>
          String(
            item.id
          ) ===
            String(
              productId
            ) ||
          String(
            item.productId
          ) ===
            String(
              productId
            )
      );


    setForm(
      (
        current
      ) => ({
        ...current,

        items:
          current.items.map(
            (item) => {

              if (
                item.id !==
                itemId
              ) {
                return item;
              }


              if (
                !product
              ) {

                return {
                  ...item,
                  productId,
                };

              }


              return {
                ...item,

                productId,

                productName:
                  productLabel(
                    product
                  ),

                productCode:
                  productCode(
                    product
                  ),

                unit:
                  productUnit(
                    product
                  ),

                unitPrice:
                  productPrice(
                    product
                  ),

                vat:
                  productVat(
                    product
                  ),
              };

            }
          ),
      })
    );

  }


  function updateItem(
    itemId,
    field,
    value
  ) {

    setForm(
      (
        current
      ) => ({
        ...current,

        items:
          current.items.map(
            (item) =>
              item.id ===
              itemId
                ? {
                    ...item,
                    [field]:
                      value,
                  }
                : item
          ),
      })
    );

  }


  function addItem() {

    setForm(
      (
        current
      ) => ({
        ...current,

        items: [
          ...current.items,
          createItem(),
        ],
      })
    );

  }


  function removeItem(
    itemId
  ) {

    setForm(
      (
        current
      ) => ({
        ...current,

        items:
          current.items.length <=
          1
            ? current.items
            : current.items.filter(
                (item) =>
                  item.id !==
                  itemId
              ),
      })
    );

  }


  /* =======================================================
     EDIT
  ======================================================= */

  function openEdit(
    order
  ) {

    setEditingId(
      order.id
    );


    setForm({
      type:
        order.type ||
        "Teklif",

      customerId:
        order.customerId ||
        "",

      customerName:
        order.customerName ||
        "",

      customerCode:
        order.customerCode ||
        "",

      date:
        order.date ||
        today(),

      validUntil:
        order.validUntil ||
        "",

      dueDate:
        order.dueDate ||
        "",

      status:
        order.status ||
        "Taslak",

      paymentMethod:
        order.paymentMethod ||
        "Vadeli",

      paymentAccountId:
        order.paymentAccountId ||
        "",

      notes:
        order.notes ||
        "",

      items:
        Array.isArray(
          order.items
        ) &&
        order.items.length
          ? order.items.map(
              (item) => ({
                id:
                  item.id ??
                  Date.now() +
                    Math.random(),

                productId:
                  item.productId ||
                  "",

                productName:
                  item.productName ||
                  "",

                productCode:
                  item.productCode ||
                  "",

                unit:
                  item.unit ||
                  "Adet",

                quantity:
                  item.quantity ??
                  1,

                unitPrice:
                  item.unitPrice ??
                  "",

                discount:
                  item.discount ??
                  0,

                vat:
                  item.vat ??
                  20,
              })
            )
          : [
              createItem(),
            ],
    });


    setMode(
      "form"
    );

  }


  /* =======================================================
     KAYDET
  ======================================================= */

  function saveForm(
    event
  ) {

    event.preventDefault();


    if (
      !form.customerId &&
      !form.customerName.trim()
    ) {

      alert(
        "Lütfen müşteri seçin."
      );

      return;
    }


    const validItems =
      form.items.filter(
        (item) =>
          item.productName.trim() &&
          num(
            item.quantity
          ) > 0 &&
          num(
            item.unitPrice
          ) >= 0
      );


    if (
      validItems.length ===
      0
    ) {

      alert(
        "En az bir ürün eklemelisiniz."
      );

      return;
    }


    const items =
      validItems.map(
        (item) => ({
          ...item,

          quantity:
            num(
              item.quantity
            ),

          unitPrice:
            num(
              item.unitPrice
            ),

          discount:
            num(
              item.discount
            ),

          vat:
            num(
              item.vat
            ),
        })
      );


    const totals =
      calculateTotals(
        items
      );


    const timestamp =
      new Date()
        .toISOString();


    if (
      editingId !==
      null
    ) {

      const updated =
        orders.map(
          (order) =>
            String(
              order.id
            ) ===
            String(
              editingId
            )
              ? {
                  ...order,

                  ...form,

                  items,

                  gross:
                    totals.gross,

                  discount:
                    totals.discount,

                  subtotal:
                    totals.subtotal,

                  vat:
                    totals.vat,

                  total:
                    totals.total,

                  updatedAt:
                    timestamp,
                }
              : order
        );


      saveOrders(
        updated
      );

      setOrders(
        updated
      );

    } else {

      const newOrder = {

        id:
          Date.now() +
          Math.random(),

        number:
          nextOrderNumber(
            form.type,
            orders
          ),

        ...form,

        items,

        gross:
          totals.gross,

        discount:
          totals.discount,

        subtotal:
          totals.subtotal,

        vat:
          totals.vat,

        total:
          totals.total,

        createdAt:
          timestamp,

        updatedAt:
          timestamp,
      };


      const updated = [
        newOrder,
        ...orders,
      ];


      saveOrders(
        updated
      );

      setOrders(
        updated
      );

    }


    closeForm();

  }


  /* =======================================================
     TEKLİF → SİPARİŞ
  ======================================================= */

  function convertOfferToOrder(
    order
  ) {

    if (
      order.type !==
      "Teklif"
    ) {
      return;
    }


    const updated =
      orders.map(
        (item) =>
          String(
            item.id
          ) ===
          String(
            order.id
          )
            ? {
                ...item,

                type:
                  "Sipariş",

                number:
                  nextOrderNumber(
                    "Sipariş",
                    orders
                  ),

                status:
                  "Siparişe Dönüştürüldü",

                convertedFrom:
                  order.number,

                updatedAt:
                  new Date()
                    .toISOString(),
              }
            : item
      );


    saveOrders(
      updated
    );

    setOrders(
      updated
    );

  }


  /* =======================================================
     YAZDIR / PDF
  ======================================================= */

  function buildPrintableDocument({
    documentNo,
    type,
    date,
    validUntil,
    dueDate,
    customerName,
    customerCode,
    items,
    notes,
    totals: summaryTotals,
  }) {
    const rows = (items || []).map((item, index) => {
      const quantity = num(item.quantity);
      const unitPrice = num(item.unitPrice);
      const discountRate = num(item.discount);
      const vatRate = num(item.vat);
      const gross = quantity * unitPrice;
      const discountAmount = gross * (discountRate / 100);
      const net = gross - discountAmount;
      const vatAmount = net * (vatRate / 100);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${productLabel(item)}</strong>
            ${item.productCode ? `<div class="muted">${item.productCode}</div>` : ""}
          </td>
          <td>${quantity}</td>
          <td>${item.unit || "Adet"}</td>
          <td class="right">₺${money(unitPrice)}</td>
          <td class="right">${discountRate}%</td>
          <td class="right">${vatRate}%</td>
          <td class="right"><strong>₺${money(net + vatAmount)}</strong></td>
        </tr>
      `;
    }).join("");

    const secondaryDate =
      type === "Teklif"
        ? validUntil
        : dueDate;

    return `
      <!doctype html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>${documentNo || type}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 34px;
            color: #172033;
            font-family: Arial, "Segoe UI", sans-serif;
            background: #fff;
          }
          .sheet {
            max-width: 980px;
            margin: 0 auto;
          }
          .top {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            padding-bottom: 22px;
            border-bottom: 2px solid #286fc7;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #286fc7;
          }
          .subtitle {
            margin-top: 5px;
            color: #6f7b8b;
            font-size: 12px;
          }
          .document {
            text-align: right;
          }
          .document h1 {
            margin: 0;
            font-size: 27px;
            font-weight: 800;
          }
          .document .no {
            margin-top: 6px;
            color: #286fc7;
            font-size: 14px;
            font-weight: 800;
          }
          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin: 24px 0;
          }
          .box {
            padding: 15px;
            border: 1px solid #dfe5ec;
            border-radius: 8px;
          }
          .label {
            margin-bottom: 6px;
            color: #8994a3;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .4px;
            text-transform: uppercase;
          }
          .value {
            color: #263247;
            font-size: 14px;
            font-weight: 700;
          }
          .muted {
            margin-top: 3px;
            color: #8b96a5;
            font-size: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
          }
          th {
            padding: 11px 8px;
            background: #f5f7fa;
            border-bottom: 1px solid #dfe5ec;
            color: #6b7686;
            text-align: left;
            font-size: 10px;
          }
          td {
            padding: 12px 8px;
            border-bottom: 1px solid #edf0f3;
            font-size: 12px;
          }
          .right { text-align: right; }
          .bottom {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 22px;
            margin-top: 26px;
          }
          .notes {
            min-height: 130px;
            padding: 15px;
            border: 1px solid #dfe5ec;
            border-radius: 8px;
          }
          .notes-text {
            margin-top: 8px;
            color: #526073;
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-wrap;
          }
          .totals {
            border: 1px solid #dfe5ec;
            border-radius: 8px;
            overflow: hidden;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 11px 14px;
            border-bottom: 1px solid #edf0f3;
            font-size: 12px;
          }
          .total-row span { color: #718092; }
          .total-row strong { color: #263247; }
          .grand {
            display: flex;
            justify-content: space-between;
            padding: 15px 14px;
            background: #286fc7;
            color: #fff;
            font-size: 14px;
            font-weight: 800;
          }
          .footer {
            margin-top: 36px;
            padding-top: 12px;
            border-top: 1px solid #e5eaf0;
            color: #919aa7;
            font-size: 10px;
            text-align: center;
          }
          @media print {
            body { padding: 0; }
            .sheet { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="top">
            <div>
              <div class="brand">REN ERP</div>
              <div class="subtitle">İşletme Yönetim Sistemi</div>
            </div>
            <div class="document">
              <h1>${type || "Belge"}</h1>
              <div class="no">${documentNo || "Taslak"}</div>
            </div>
          </div>

          <div class="meta">
            <div class="box">
              <div class="label">Müşteri</div>
              <div class="value">${customerName || "—"}</div>
              ${customerCode ? `<div class="muted">Cari Kodu: ${customerCode}</div>` : ""}
            </div>
            <div class="box">
              <div class="label">Belge Bilgileri</div>
              <div class="value">Tarih: ${formatDate(date)}</div>
              ${secondaryDate ? `<div class="muted">${type === "Teklif" ? "Geçerlilik" : "Vade"}: ${formatDate(secondaryDate)}</div>` : ""}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ÜRÜN</th>
                <th>MİKTAR</th>
                <th>BİRİM</th>
                <th class="right">BİRİM FİYAT</th>
                <th class="right">İSKONTO</th>
                <th class="right">KDV</th>
                <th class="right">TOPLAM</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="bottom">
            <div class="notes">
              <div class="label">Açıklama / Not</div>
              <div class="notes-text">${notes || "—"}</div>
            </div>
            <div class="totals">
              <div class="total-row"><span>Brüt Toplam</span><strong>₺${money(summaryTotals.gross)}</strong></div>
              <div class="total-row"><span>İskonto</span><strong>- ₺${money(summaryTotals.discount)}</strong></div>
              <div class="total-row"><span>Ara Toplam</span><strong>₺${money(summaryTotals.subtotal)}</strong></div>
              <div class="total-row"><span>KDV</span><strong>₺${money(summaryTotals.vat)}</strong></div>
              <div class="grand"><span>GENEL TOPLAM</span><span>₺${money(summaryTotals.total)}</span></div>
            </div>
          </div>

          <div class="footer">
            REN ERP · ${new Date().toLocaleString("tr-TR")}
          </div>
        </div>
      </body>
      </html>
    `;
  }


  function openPrintableHtml(html, title = "REN ERP Belgesi") {
    const printWindow =
      window.open(
        "",
        "_blank",
        "width=1100,height=800"
      );

    if (!printWindow) {
      alert(
        "Yazdırma penceresi açılamadı. Tarayıcı açılır pencereyi engelliyor olabilir."
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.document.title = title;

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  }


  function printOrder(order) {
    const orderTotals = calculateTotals(
      Array.isArray(order.items)
        ? order.items
        : []
    );

    openPrintableHtml(
      buildPrintableDocument({
        documentNo: order.number,
        type: order.type || "Belge",
        date: order.date,
        validUntil: order.validUntil,
        dueDate: order.dueDate,
        customerName: order.customerName,
        customerCode: order.customerCode,
        items: order.items || [],
        notes: order.notes || "",
        totals: {
          gross: num(order.gross ?? orderTotals.gross),
          discount: num(order.discount ?? orderTotals.discount),
          subtotal: num(order.subtotal ?? orderTotals.subtotal),
          vat: num(order.vat ?? orderTotals.vat),
          total: num(order.total ?? orderTotals.total),
        },
      }),
      order.number || "REN ERP Belgesi"
    );
  }


  function printCurrentForm() {
    const orderTotals = calculateTotals(
      form.items || []
    );

    const documentNo =
      editingId !== null
        ? (
            orders.find(
              (order) =>
                String(order.id) ===
                String(editingId)
            )?.number ||
            `${form.type || "Belge"} - Önizleme`
          )
        : `${form.type || "Belge"} - Taslak`;

    printOrder({
      number: documentNo,
      type: form.type,
      date: form.date,
      validUntil: form.validUntil,
      dueDate: form.dueDate,
      customerName: form.customerName,
      customerCode: form.customerCode,
      items: form.items,
      notes: form.notes,
      ...orderTotals,
    });
  }


  function viewOrder(order) {
    printOrder(order);
  }


  function createPdf(order) {
    // Tarayıcıdaki yazdırma penceresinden "PDF olarak kaydet" kullanılabilir.
    printOrder(order);
  }


  function createPdfFromForm() {
    // Tarayıcıdaki yazdırma penceresinden "PDF olarak kaydet" kullanılabilir.
    printCurrentForm();
  }


  /* =======================================================
     SİL
  ======================================================= */

  function deleteOrder(
    order
  ) {

    const confirmed =
      window.confirm(
        `${order.number} numaralı kaydı silmek istediğinize emin misiniz?`
      );


    if (!confirmed) {
      return;
    }


    const updated =
      orders.filter(
        (item) =>
          String(
            item.id
          ) !==
          String(
            order.id
          )
      );


    saveOrders(
      updated
    );

    setOrders(
      updated
    );

  }


  /* =======================================================
     CARİ HAREKET
  ======================================================= */

  function createCustomerMovement(
    invoice
  ) {

    if (
      invoice.paymentMethod !==
      "Vadeli"
    ) {
      return;
    }


    if (
      !invoice.customerId
    ) {
      return;
    }


    const amount =
      num(
        invoice.total
      );


    if (
      amount <=
      0
    ) {
      return;
    }


    updateCustomerBalance(
      invoice.customerId,
      -amount
    );


    addCustomerMovement({
      id:
        `order-invoice-${invoice.id}`,

      customerId:
        invoice.customerId,

      customerName:
        invoice.customerName,

      date:
        invoice.date,

      document:
        invoice.invoiceNo,

      type:
        "Satış",

      description:
        `${invoice.invoiceNo} satış faturası.`,

      debt:
        amount,

      credit:
        0,

      balance:
        null,

      method:
        invoice.paymentMethod,

      account:
        "",

      source:
        "invoice",

      sourceId:
        invoice.id,
    });

  }


  /* =======================================================
     STOK HAREKETLERİ
  ======================================================= */

  function createStockMovements(
    invoice
  ) {

    invoice.items.forEach(
      (item) => {

        if (
          !item.productId
        ) {
          return;
        }


        const quantity =
          num(
            item.quantity
          );


        if (
          quantity <=
          0
        ) {
          return;
        }


        try {

          changeStock(
            item.productId,
            -quantity,
            {

              type:
                "Stok Çıkışı",

              source:
                "Sipariş / Fatura",

              sourceId:
                invoice.id,

              description:
                `${invoice.invoiceNo} numaralı satış faturası.`,

            }
          );

        } catch (
          error
        ) {

          /*
            Stok bulunamazsa faturalama
            işlemini durdurmuyoruz.
          */

          console.warn(
            "REN ERP stok hareketi oluşturulamadı:",
            item.productId,
            error
          );

        }

      }
    );

  }


  /* =======================================================
     KASA / BANKA
  ======================================================= */

  function createCashMovement(
    invoice,
    paymentAccountId
  ) {

    if (
      invoice.paymentMethod ===
      "Vadeli"
    ) {
      return;
    }


    const account =
      accounts.find(
        (item) =>
          String(
            item.id
          ) ===
          String(
            paymentAccountId
          )
      );


    if (!account) {

      throw new Error(
        "Ödeme hesabı bulunamadı."
      );

    }


    const amount =
      num(
        invoice.total
      );


    if (
      amount <=
      0
    ) {
      return;
    }


    const updatedAccounts =
      accounts.map(
        (item) =>
          String(
            item.id
          ) ===
          String(
            account.id
          )
            ? {
                ...item,

                balance:
                  num(
                    item.balance
                  ) +
                  amount,
              }
            : item
      );


    saveCashAccounts(
      updatedAccounts
    );


    setAccounts(
      updatedAccounts
    );


    const movement = {

      id:
        `ORD-FIN-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      accountId:
        account.id,

      accountName:
        account.name,

      accountType:
        account.type,

      direction:
        "Giriş",

      amount,

      description:
        `${invoice.invoiceNo} satış tahsilatı.`,

      date:
        invoice.date,

      method:
        invoice.paymentMethod,

      source:
        "invoice",

      sourceId:
        invoice.id,

      sourceDocument:
        invoice.invoiceNo,

      createdAt:
        new Date()
          .toISOString(),
    };


    const existing =
      readCashMovements();


    saveCashMovements([
      movement,
      ...existing,
    ]);

  }


  /* =======================================================
     SİPARİŞ → FATURA
  ======================================================= */

  async function convertOrderToInvoice(
    order
  ) {

    if (
      processingInvoice
    ) {
      return;
    }


    if (
      order.type !==
      "Sipariş"
    ) {

      alert(
        "Sadece siparişler faturaya dönüştürülebilir."
      );

      return;
    }


    if (
      order.invoiceId
    ) {

      alert(
        `${order.number} zaten faturalanmış.`
      );

      return;
    }


    if (
      !Array.isArray(
        order.items
      ) ||
      order.items.length ===
      0
    ) {

      alert(
        "Siparişte ürün bulunmuyor."
      );

      return;
    }


    const total =
      num(
        order.total
      );


    if (
      total <=
      0
    ) {

      alert(
        "Sipariş toplamı 0 TL olamaz."
      );

      return;
    }


    if (
      order.paymentMethod !==
        "Vadeli" &&
      !order.paymentAccountId
    ) {

      alert(
        "Peşin işlem için kasa/banka hesabı seçilmelidir."
      );

      return;
    }


    setProcessingInvoice(
      true
    );


    try {

      const invoiceData = {

        id:
          `INV-ORD-${order.id}`,

        type:
          "sales",

        invoiceNo:
          getNextInvoiceNumber(
            "sales"
          ),

        date:
          order.date ||
          today(),

        dueDate:
          order.dueDate ||
          "",

        customerId:
          order.customerId ||
          "",

        customerName:
          order.customerName ||
          "",

        customerCode:
          order.customerCode ||
          "",

        supplierId:
          "",

        supplierName:
          "",

        supplierCode:
          "",

        title:
          "Siparişten oluşturulan satış faturası",

        description:
          `${order.number} numaralı siparişten oluşturuldu.`,

        paymentMethod:
          order.paymentMethod ||
          "Vadeli",

        paymentStatus:
          order.paymentMethod ===
          "Vadeli"
            ? "Bekliyor"
            : "Ödendi",

        status:
          order.paymentMethod ===
          "Vadeli"
            ? "open"
            : "paid",

        subtotal:
          num(
            order.subtotal
          ),

        discount:
          num(
            order.discount
          ),

        discountTotal:
          num(
            order.discount
          ),

        vatTotal:
          num(
            order.vat
          ),

        total,

        items:
          order.items.map(
            (item) => ({
              ...item,

              quantity:
                num(
                  item.quantity
                ),

              unitPrice:
                num(
                  item.unitPrice
                ),

              discount:
                num(
                  item.discount
                ),

              vat:
                num(
                  item.vat
                ),
            })
          ),

        notes:
          order.notes ||
          "",

        orderId:
          order.id,

        orderNumber:
          order.number,

        source:
          "order",

        sourceType:
          "order",
      };


      const invoice =
        addInvoice(
          invoiceData
        );


      if (!invoice) {

        throw new Error(
          "Fatura oluşturulamadı."
        );

      }


      createStockMovements(
        invoice
      );


      createCustomerMovement(
        invoice
      );


      createCashMovement(
        invoice,
        order.paymentAccountId
      );


      const updated =
        orders.map(
          (item) =>
            String(
              item.id
            ) ===
            String(
              order.id
            )
              ? {

                  ...item,

                  status:
                    "Faturalandı",

                  invoiceId:
                    invoice.id,

                  invoiceNo:
                    invoice.invoiceNo,

                  invoicedAt:
                    new Date()
                      .toISOString(),

                  updatedAt:
                    new Date()
                      .toISOString(),

                }
              : item
        );


      saveOrders(
        updated
      );


      setOrders(
        updated
      );


      alert(
        `${order.number} → ${invoice.invoiceNo}\n\nFatura oluşturuldu.`
      );


    } catch (
      error
    ) {

      console.error(
        "REN ERP sipariş faturalama hatası:",
        error
      );


      alert(
        error?.message ||
        "Sipariş faturaya dönüştürülürken hata oluştu."
      );


    } finally {

      setProcessingInvoice(
        false
      );

    }

  }


  /* =======================================================
     TOPLAMLAR
  ======================================================= */

  const totals =
    useMemo(
      () =>
        calculateTotals(
          form.items
        ),
      [
        form.items,
      ]
    );


  /* =======================================================
     LİSTE FİLTRESİ
  ======================================================= */

  const displayOrders =
    useMemo(() => {

      let result =
        [
          ...orders,
        ];


      if (
        filter !==
        "Tümü"
      ) {

        result =
          result.filter(
            (order) =>
              order.type ===
              filter
          );

      }


      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      if (query) {

        result =
          result.filter(
            (order) => {

              return (

                String(
                  order.number ||
                  ""
                )
                  .toLocaleLowerCase(
                    "tr-TR"
                  )
                  .includes(
                    query
                  ) ||

                String(
                  order.customerName ||
                  ""
                )
                  .toLocaleLowerCase(
                    "tr-TR"
                  )
                  .includes(
                    query
                  ) ||

                String(
                  order.status ||
                  ""
                )
                  .toLocaleLowerCase(
                    "tr-TR"
                  )
                  .includes(
                    query
                  )

              );

            }
          );

      }


      return result;

    }, [
      orders,
      filter,
      search,
    ]);


  /* =======================================================
     ÖZET
  ======================================================= */

  const offerCount =
    orders.filter(
      (order) =>
        order.type ===
        "Teklif"
    ).length;


  const orderCount =
    orders.filter(
      (order) =>
        order.type ===
        "Sipariş"
    ).length;


  const offerTotal =
    orders
      .filter(
        (order) =>
          order.type ===
          "Teklif"
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          num(
            order.total
          ),
        0
      );


  const orderTotal =
    orders
      .filter(
        (order) =>
          order.type ===
          "Sipariş"
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          num(
            order.total
          ),
        0
      );


  const invoiceReady =
    orders.filter(
      (order) =>
        order.type ===
          "Sipariş" &&
        !order.invoiceId
    );


  const invoiced =
    orders.filter(
      (order) =>
        order.type ===
          "Sipariş" &&
        order.invoiceId
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="orders-page">

      <div className="orders-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <header className="orders-header">

          <div>

            <div className="orders-breadcrumb">

              <span>
                Satışlar
              </span>

              <span>
                /
              </span>

              <strong>
                Sipariş - Teklif
              </strong>

            </div>


            <h1>
              Sipariş - Teklif
            </h1>


            <p>
              Teklif, sipariş ve faturaya dönüşüm
              sürecini yönetin.
            </p>

          </div>


          <div className="orders-header-actions">

            <button
              type="button"
              className="orders-secondary-button"
              onClick={() =>
                openNew(
                  "Teklif"
                )
              }
            >
              + Yeni Teklif
            </button>


            <button
              type="button"
              className="orders-primary-button"
              onClick={() =>
                openNew(
                  "Sipariş"
                )
              }
            >
              + Yeni Sipariş
            </button>

          </div>

        </header>


        {/* =================================================
            LİSTE
        ================================================= */}

        {mode === "list" && (

          <>

            <section className="orders-summary">

              <div className="orders-summary-card">

                <span>
                  TOPLAM KAYIT
                </span>

                <strong>
                  {
                    orders.length
                  }
                </strong>

                <small>
                  Sipariş + teklif
                </small>

              </div>


              <div className="orders-summary-card">

                <span>
                  TEKLİFLER
                </span>

                <strong>
                  {
                    offerCount
                  }
                </strong>

                <small>
                  ₺
                  {
                    money(
                      offerTotal
                    )
                  }
                </small>

              </div>


              <div className="orders-summary-card">

                <span>
                  SİPARİŞLER
                </span>

                <strong>
                  {
                    orderCount
                  }
                </strong>

                <small>
                  ₺
                  {
                    money(
                      orderTotal
                    )
                  }
                </small>

              </div>


              <div className="orders-summary-card highlight">

                <span>
                  FATURALANMAYAN
                </span>

                <strong>
                  {
                    invoiceReady.length
                  }
                </strong>

                <small>
                  Sipariş
                </small>

              </div>

            </section>


            <section className="orders-card">


              {/* TOOLBAR */}

              <div className="orders-toolbar">

                <div className="orders-tabs">

                  {
                    [
                      "Tümü",
                      "Teklif",
                      "Sipariş",
                    ].map(
                      (item) => (

                        <button
                          type="button"
                          key={
                            item
                          }
                          className={
                            filter ===
                            item
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setFilter(
                              item
                            )
                          }
                        >
                          {
                            item
                          }
                        </button>

                      )
                    )
                  }

                </div>


                <div className="orders-search">

                  <input
                    type="text"
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Belge, müşteri veya durum ara..."
                  />

                </div>

              </div>


              {/* TABLO */}

              <div className="orders-table-wrapper">

                <table className="orders-table">

                  <thead>

                    <tr>

                      <th>
                        BELGE NO
                      </th>

                      <th>
                        TÜR
                      </th>

                      <th>
                        TARİH
                      </th>

                      <th>
                        MÜŞTERİ
                      </th>

                      <th>
                        DURUM
                      </th>

                      <th>
                        FATURA
                      </th>

                      <th>
                        TUTAR
                      </th>

                      <th>
                        İŞLEM
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      displayOrders.length ===
                      0 ? (

                        <tr>

                          <td
                            colSpan="8"
                            className="orders-empty"
                          >

                            <div>
                              ≡
                            </div>

                            <strong>
                              Kayıt bulunamadı
                            </strong>

                            <span>
                              Yeni teklif veya
                              sipariş oluşturabilirsiniz.
                            </span>

                          </td>

                        </tr>

                      ) : (

                        displayOrders.map(
                          (
                            order
                          ) => (

                            <tr
                              key={
                                order.id
                              }
                            >


                              {/* =================================
                                  BELGE NO — TIKLANABİLİR
                              ================================= */}

                              <td>

                                <button
                                  type="button"
                                  onClick={(
                                    event
                                  ) => {

                                    event.stopPropagation();

                                    openEdit(
                                      order
                                    );

                                  }}
                                  style={{
                                    border:
                                      "0",
                                    background:
                                      "transparent",
                                    padding:
                                      "0",
                                    margin:
                                      "0",
                                    color:
                                      "#286fc7",
                                    fontWeight:
                                      700,
                                    cursor:
                                      "pointer",
                                    textDecoration:
                                      "none",
                                  }}
                                  title={`${order.type || "Belge"} detayını aç`}
                                >
                                  {
                                    order.number
                                  }
                                </button>

                              </td>


                              <td>

                                <span
                                  className={`orders-type ${
                                    order.type ===
                                    "Sipariş"
                                      ? "order"
                                      : "offer"
                                  }`}
                                >
                                  {
                                    order.type
                                  }
                                </span>

                              </td>


                              <td>
                                {
                                  formatDate(
                                    order.date
                                  )
                                }
                              </td>


                              <td>
                                {
                                  order.customerName
                                }
                              </td>


                              <td>

                                <span className="orders-status">

                                  {
                                    order.status ||
                                    "Taslak"
                                  }

                                </span>

                              </td>


                              <td>

                                {
                                  order.invoiceNo ||
                                  "—"
                                }

                              </td>


                              <td className="orders-money">

                                ₺
                                {
                                  money(
                                    order.total
                                  )
                                }

                              </td>


                              <td>

                                <div className="orders-actions">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      viewOrder(
                                        order
                                      )
                                    }
                                  >
                                    Görüntüle
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      printOrder(
                                        order
                                      )
                                    }
                                  >
                                    Yazdır
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      createPdf(
                                        order
                                      )
                                    }
                                  >
                                    PDF
                                  </button>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEdit(
                                        order
                                      )
                                    }
                                  >
                                    Düzenle
                                  </button>


                                  {
                                    order.type ===
                                    "Teklif" && (

                                      <button
                                        type="button"
                                        onClick={() =>
                                          convertOfferToOrder(
                                            order
                                          )
                                        }
                                      >
                                        Siparişe Çevir
                                      </button>

                                    )
                                  }


                                  {
                                    order.type ===
                                      "Sipariş" &&
                                    !order.invoiceId && (

                                      <button
                                        type="button"
                                        onClick={() =>
                                          convertOrderToInvoice(
                                            order
                                          )
                                        }
                                        disabled={
                                          processingInvoice
                                        }
                                      >
                                        {
                                          processingInvoice
                                            ? "İşleniyor..."
                                            : "Faturaya Çevir"
                                        }
                                      </button>

                                    )
                                  }


                                  {
                                    order.invoiceId && (

                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate(
                                            `/invoices/detail?id=${encodeURIComponent(
                                              order.invoiceId
                                            )}`
                                          )
                                        }
                                      >
                                        Faturayı Gör
                                      </button>

                                    )
                                  }


                                  <button
                                    type="button"
                                    className="danger"
                                    onClick={() =>
                                      deleteOrder(
                                        order
                                      )
                                    }
                                  >
                                    Sil
                                  </button>

                                </div>

                              </td>

                            </tr>

                          )
                        )

                      )
                    }

                  </tbody>

                </table>

              </div>

            </section>

          </>

        )}


        {/* =================================================
            FORM
        ================================================= */}

        {
          mode ===
          "form" && (

            <form
              className="orders-form-card"
              onSubmit={
                saveForm
              }
            >

              <div className="orders-form-header">

                <div>

                  <strong>
                    {
                      editingId !==
                      null
                        ? "Kaydı Düzenle"
                        : `Yeni ${form.type}`
                    }
                  </strong>

                  <span>
                    Belge bilgilerini, ürünleri ve ödeme bilgilerini girin.
                  </span>

                </div>


                <button
                  type="button"
                  className="orders-close-button"
                  onClick={
                    closeForm
                  }
                >
                  ×
                </button>

              </div>


              {/* GENEL BİLGİ */}

              <div className="orders-form-section">

                <div className="orders-form-grid">


                  <div className="orders-form-group">

                    <label>
                      Belge Türü
                    </label>

                    <select
                      value={
                        form.type
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "type",
                          event.target.value
                        )
                      }
                    >

                      <option value="Teklif">
                        Teklif
                      </option>

                      <option value="Sipariş">
                        Sipariş
                      </option>

                    </select>

                  </div>


                  <div className="orders-form-group">

                    <label>
                      Tarih
                    </label>

                    <input
                      type="date"
                      value={
                        form.date
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "date",
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div className="orders-form-group">

                    <label>
                      {
                        form.type ===
                        "Teklif"
                          ? "Geçerlilik Tarihi"
                          : "Vade Tarihi"
                      }
                    </label>

                    <input
                      type="date"
                      value={
                        form.type ===
                        "Teklif"
                          ? form.validUntil
                          : form.dueDate
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          form.type ===
                          "Teklif"
                            ? "validUntil"
                            : "dueDate",
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div className="orders-form-group">

                    <label>
                      Müşteri
                    </label>

                    {
                      customers.length >
                      0 ? (

                        <select
                          value={
                            form.customerId
                          }
                          onChange={(
                            event
                          ) =>
                            selectCustomer(
                              event.target.value
                            )
                          }
                          required
                        >

                          <option value="">
                            Müşteri seçin
                          </option>


                          {
                            customers.map(
                              (
                                customer
                              ) => (

                                <option
                                  key={
                                    customer.id
                                  }
                                  value={
                                    customer.id
                                  }
                                >
                                  {
                                    customerLabel(
                                      customer
                                    )
                                  }
                                </option>

                              )
                            )
                          }

                        </select>

                      ) : (

                        <input
                          type="text"
                          value={
                            form.customerName
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "customerName",
                              event.target.value
                            )
                          }
                          placeholder="Müşteri adı"
                          required
                        />

                      )
                    }

                  </div>

                </div>


                {
                  form.type ===
                  "Sipariş" && (

                    <div className="orders-form-grid">

                      <div className="orders-form-group">

                        <label>
                          Ödeme Yöntemi
                        </label>

                        <select
                          value={
                            form.paymentMethod
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "paymentMethod",
                              event.target.value
                            )
                          }
                        >

                          <option value="Vadeli">
                            Vadeli
                          </option>

                          <option value="Nakit">
                            Nakit
                          </option>

                          <option value="Kredi Kartı">
                            Kredi Kartı
                          </option>

                          <option value="Havale / EFT">
                            Havale / EFT
                          </option>

                        </select>

                      </div>


                      <div className="orders-form-group">

                        <label>
                          Kasa / Banka
                        </label>

                        <select
                          value={
                            form.paymentAccountId
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "paymentAccountId",
                              event.target.value
                            )
                          }
                          disabled={
                            form.paymentMethod ===
                            "Vadeli"
                          }
                        >

                          <option value="">

                            {
                              form.paymentMethod ===
                              "Vadeli"
                                ? "Vadeli işlem"
                                : "Hesap seçin"
                            }

                          </option>


                          {
                            accounts.map(
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

                                </option>

                              )
                            )
                          }

                        </select>

                      </div>


                      <div className="orders-form-group">

                        <label>
                          Cari Kodu
                        </label>

                        <input
                          type="text"
                          value={
                            form.customerCode
                          }
                          readOnly
                        />

                      </div>


                      <div className="orders-form-group">

                        <label>
                          Sipariş Durumu
                        </label>

                        <select
                          value={
                            form.status
                          }
                          onChange={(
                            event
                          ) =>
                            updateForm(
                              "status",
                              event.target.value
                            )
                          }
                        >

                          <option>
                            Taslak
                          </option>

                          <option>
                            Onaylandı
                          </option>

                          <option>
                            Hazırlanıyor
                          </option>

                          <option>
                            Sevk Edildi
                          </option>

                        </select>

                      </div>

                    </div>

                  )
                }

              </div>


              {/* ÜRÜNLER */}

              <div className="orders-items-section">

                <div className="orders-items-header">

                  <div>

                    <strong>
                      Ürünler
                    </strong>

                    <span>
                      Ürün, miktar, fiyat, iskonto ve KDV bilgileri.
                    </span>

                  </div>


                  <button
                    type="button"
                    className="orders-small-primary"
                    onClick={
                      addItem
                    }
                  >
                    + Ürün Ekle
                  </button>

                </div>


                <div className="orders-item-list">

                  {
                    form.items.map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          className="orders-item-row"
                          key={
                            item.id
                          }
                        >

                          <div className="orders-item-index">
                            {
                              index + 1
                            }
                          </div>


                          <div className="orders-form-group product">

                            <label>
                              Ürün
                            </label>

                            {
                              products.length >
                              0 ? (

                                <select
                                  value={
                                    item.productId
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    selectProduct(
                                      item.id,
                                      event.target.value
                                    )
                                  }
                                  required
                                >

                                  <option value="">
                                    Ürün seçin
                                  </option>


                                  {
                                    products.map(
                                      (
                                        product
                                      ) => (

                                        <option
                                          key={
                                            product.id
                                          }
                                          value={
                                            product.id
                                          }
                                        >
                                          {
                                            productLabel(
                                              product
                                            )
                                          }
                                        </option>

                                      )
                                    )
                                  }

                                </select>

                              ) : (

                                <input
                                  type="text"
                                  value={
                                    item.productName
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateItem(
                                      item.id,
                                      "productName",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Ürün adı"
                                  required
                                />

                              )
                            }

                          </div>


                          <div className="orders-form-group small">

                            <label>
                              Miktar
                            </label>

                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                item.quantity
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  event.target.value
                                )
                              }
                              required
                            />

                          </div>


                          <div className="orders-form-group small">

                            <label>
                              Birim
                            </label>

                            <input
                              type="text"
                              value={
                                item.unit
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
                            />

                          </div>


                          <div className="orders-form-group price">

                            <label>
                              Birim Fiyat
                            </label>

                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                item.unitPrice
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  item.id,
                                  "unitPrice",
                                  event.target.value
                                )
                              }
                              placeholder="0,00"
                              required
                            />

                          </div>


                          <div className="orders-form-group small">

                            <label>
                              İskonto %
                            </label>

                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                item.discount
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  item.id,
                                  "discount",
                                  event.target.value
                                )
                              }
                            />

                          </div>


                          <div className="orders-form-group small">

                            <label>
                              KDV %
                            </label>

                            <select
                              value={
                                item.vat
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  item.id,
                                  "vat",
                                  event.target.value
                                )
                              }
                            >

                              <option value="1">
                                1
                              </option>

                              <option value="10">
                                10
                              </option>

                              <option value="20">
                                20
                              </option>

                            </select>

                          </div>


                          <button
                            type="button"
                            className="orders-remove-item"
                            onClick={() =>
                              removeItem(
                                item.id
                              )
                            }
                            disabled={
                              form.items.length ===
                              1
                            }
                          >
                            ×
                          </button>

                        </div>

                      )
                    )
                  }

                </div>

              </div>


              {/* ALT */}

              <div className="orders-bottom-grid">

                <div className="orders-form-group">

                  <label>
                    Açıklama / Not
                  </label>

                  <textarea
                    rows="5"
                    value={
                      form.notes
                    }
                    onChange={(
                      event
                    ) =>
                      updateForm(
                        "notes",
                        event.target.value
                      )
                    }
                    placeholder="Sipariş veya teklif notu..."
                  />

                </div>


                <div className="orders-total-box">

                  <div>

                    <span>
                      Brüt Toplam
                    </span>

                    <strong>
                      ₺
                      {
                        money(
                          totals.gross
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      İskonto
                    </span>

                    <strong>
                      - ₺
                      {
                        money(
                          totals.discount
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      Ara Toplam
                    </span>

                    <strong>
                      ₺
                      {
                        money(
                          totals.subtotal
                        )
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      KDV
                    </span>

                    <strong>
                      ₺
                      {
                        money(
                          totals.vat
                        )
                      }
                    </strong>

                  </div>


                  <div className="grand">

                    <span>
                      GENEL TOPLAM
                    </span>

                    <strong>
                      ₺
                      {
                        money(
                          totals.total
                        )
                      }
                    </strong>

                  </div>

                </div>

              </div>


              {/* FOOTER */}

              <div className="orders-form-footer">

                <div className="orders-form-footer-left">

                  {
                    editingId !== null && (

                      <>

                        <button
                          type="button"
                          className="orders-secondary-button"
                          onClick={
                            printCurrentForm
                          }
                        >
                          Yazdır
                        </button>


                        <button
                          type="button"
                          className="orders-secondary-button"
                          onClick={
                            createPdfFromForm
                          }
                        >
                          PDF
                        </button>


                        {
                          form.type ===
                          "Teklif" && (

                            <button
                              type="button"
                              className="orders-secondary-button"
                              onClick={() => {

                                const current =
                                  orders.find(
                                    (order) =>
                                      String(
                                        order.id
                                      ) ===
                                      String(
                                        editingId
                                      )
                                  );

                                if (
                                  current
                                ) {
                                  convertOfferToOrder(
                                    current
                                  );
                                  closeForm();
                                }

                              }}
                            >
                              Siparişe Çevir
                            </button>

                          )
                        }


                        {
                          form.type ===
                          "Sipariş" && (() => {

                            const current =
                              orders.find(
                                (order) =>
                                  String(
                                    order.id
                                  ) ===
                                  String(
                                    editingId
                                  )
                              );

                            if (
                              !current ||
                              current.invoiceId
                            ) {
                              return null;
                            }

                            return (
                              <button
                                type="button"
                                className="orders-secondary-button"
                                onClick={() => {

                                  convertOrderToInvoice(
                                    current
                                  );

                                }}
                              >
                                Faturaya Çevir
                              </button>
                            );

                          })()
                        }


                        <button
                          type="button"
                          className="orders-secondary-button danger"
                          onClick={() => {

                            const current =
                              orders.find(
                                (order) =>
                                  String(
                                    order.id
                                  ) ===
                                  String(
                                    editingId
                                  )
                              );

                            if (
                              current
                            ) {
                              deleteOrder(
                                current
                              );
                              closeForm();
                            }

                          }}
                        >
                          Sil
                        </button>

                      </>

                    )
                  }

                </div>


                <div className="orders-form-footer-right">

                  <button
                    type="button"
                    className="orders-modal-cancel"
                    onClick={
                      closeForm
                    }
                  >
                    Kapat
                  </button>


                  <button
                    type="submit"
                    className="orders-modal-submit"
                  >
                    {
                      editingId !==
                      null
                        ? "Değişiklikleri Kaydet"
                        : `${form.type}yi Kaydet`
                    }
                  </button>

                </div>

              </div>

            </form>

          )
        }


        {/* =================================================
            RAPORLAR
        ================================================= */}

        {
          mode ===
          "reports" && (

            <section className="orders-card">

              <div className="orders-toolbar">

                <div>

                  <strong>
                    Sipariş / Teklif Raporu
                  </strong>

                </div>


                <button
                  type="button"
                  className="orders-secondary-button"
                  onClick={() =>
                    setMode(
                      "list"
                    )
                  }
                >
                  Listeye Dön
                </button>

              </div>


              <div className="orders-table-wrapper">

                <table className="orders-table">

                  <thead>

                    <tr>

                      <th>
                        DURUM
                      </th>

                      <th>
                        ADET
                      </th>

                      <th>
                        TUTAR
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    <tr>

                      <td>
                        Teklif
                      </td>

                      <td>
                        {
                          offerCount
                        }
                      </td>

                      <td>
                        ₺
                        {
                          money(
                            offerTotal
                          )
                        }
                      </td>

                    </tr>


                    <tr>

                      <td>
                        Sipariş
                      </td>

                      <td>
                        {
                          orderCount
                        }
                      </td>

                      <td>
                        ₺
                        {
                          money(
                            orderTotal
                          )
                        }
                      </td>

                    </tr>


                    <tr>

                      <td>
                        Faturalanmaya Hazır
                      </td>

                      <td>
                        {
                          invoiceReady.length
                        }
                      </td>

                      <td>

                        ₺
                        {
                          money(
                            invoiceReady.reduce(
                              (
                                sum,
                                order
                              ) =>
                                sum +
                                num(
                                  order.total
                                ),
                              0
                            )
                          )
                        }

                      </td>

                    </tr>


                    <tr>

                      <td>
                        Faturalanmış
                      </td>

                      <td>
                        {
                          invoiced.length
                        }
                      </td>

                      <td>

                        ₺
                        {
                          money(
                            invoiced.reduce(
                              (
                                sum,
                                order
                              ) =>
                                sum +
                                num(
                                  order.total
                                ),
                              0
                            )
                          )
                        }

                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            </section>

          )
        }

      </div>

    </div>

  );
}