import { Finance } from "../../../lib/finance";

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
  updateProduct,
  addProductPriceHistory,
} from "../../../lib/stockStore";

import "./NewInvoice.css";


/* =========================================================
   GENEL YARDIMCILAR
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
    String(
      value
    ).trim();

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text =
      text
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );
  } else if (
    text.includes(",")
  ) {
    text =
      text.replace(
        ",",
        "."
      );
  }

  const result =
    Number(
      text
    );

  return Number.isFinite(
    result
  )
    ? result
    : 0;
}


function today() {
  return new Date()
    .toISOString()
    .slice(
      0,
      10
    );
}


function safeDateWithDays(
  baseDateValue,
  days = 0
) {
  const fallback =
    new Date();

  const parsed =
    baseDateValue
      ? new Date(
          `${baseDateValue}T12:00:00`
        )
      : fallback;

  const date =
    Number.isNaN(
      parsed.getTime()
    )
      ? fallback
      : parsed;

  date.setDate(
    date.getDate() +
    Number(days || 0)
  );

  return date;
}


function safeIsoDate(
  baseDateValue,
  days = 0
) {
  return safeDateWithDays(
    baseDateValue,
    days
  )
    .toISOString()
    .slice(
      0,
      10
    );
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
    type ===
    "purchase"
  ) {
    return "Yeni Alış Faturası";
  }

  if (
    type ===
    "return"
  ) {
    return "Yeni İade Faturası";
  }

  return "Yeni Satış Faturası";
}


/* =========================================================
   ÜRÜN
========================================================= */

function productName(
  product
) {
  return (
    product?.name ||
    product?.productName ||
    product?.title ||
    "Ürün"
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


function productPurchasePrice(
  product
) {
  return numberValue(
    product?.purchaseNet ??
    product?.purchasePrice ??
    product?.buyPrice ??
    product?.cost ??
    product?.purchase ??
    0
  );
}


function productSalePrice(
  product
) {
  return numberValue(
    product?.salesNet ??
    product?.salePrice ??
    product?.sellingPrice ??
    product?.price ??
    product?.sale ??
    0
  );
}


function productVat(
  product
) {
  return numberValue(
    product?.salesVat ??
    product?.vatRate ??
    product?.vat ??
    product?.kdv ??
    20
  );
}


/* =========================================================
   KASA / BANKA / POS
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
      JSON.parse(
        saved
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


function saveAccounts(
  accounts
) {
  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify(
      accounts
    )
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
      JSON.parse(
        saved
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


function saveMovements(
  movements
) {
  localStorage.setItem(
    MOVEMENT_STORAGE_KEY,
    JSON.stringify(
      movements
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-cash-bank-updated"
    )
  );
}


/* =========================================================
   YENİ ÜRÜN SATIRI
========================================================= */

function createItem() {
  return {
    id:
      `INV-ITEM-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`,

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

    vatRate:
      20,

    discount:
      0,
  };
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
    params.get(
      "id"
    );


  const queryType =
    params.get(
      "type"
    );


  /* =======================================================
     TEMEL STATE
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
    customerSearch,
    setCustomerSearch,
  ] = useState("");


  const [
    productSearch,
    setProductSearch,
  ] = useState("");


  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(
    null
  );


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
  ] = useState(
    [
      createItem(),
    ]
  );


  const [
    discount,
    setDiscount,
  ] = useState(
    0
  );


  const [
    stockTracking,
    setStockTracking,
  ] = useState(
    true
  );


  const [
    saving,
    setSaving,
  ] = useState(
    false
  );


  /* =======================================================
     FİNANS
  ======================================================= */

  const [
    detailInvoice,
    setDetailInvoice,
  ] = useState(
    null
  );


  const [
    showFinanceModal,
    setShowFinanceModal,
  ] = useState(
    false
  );


  const [
    financeMode,
    setFinanceMode,
  ] = useState(
    "collection"
  );


  const [
    accounts,
    setAccounts,
  ] = useState(
    readAccounts
  );


  const [
    financeAmount,
    setFinanceAmount,
  ] = useState(
    ""
  );


  const [
    financeDate,
    setFinanceDate,
  ] = useState(
    today()
  );


  const [
    financeMethod,
    setFinanceMethod,
  ] = useState(
    "Havale / EFT"
  );


  const [
    financeAccountId,
    setFinanceAccountId,
  ] = useState(
    ""
  );


  const [
    financeDescription,
    setFinanceDescription,
  ] = useState(
    ""
  );


  const [
    financeSaving,
    setFinanceSaving,
  ] = useState(
    false
  );


  /* =======================================================
     FATURA NUMARASI
  ======================================================= */

  useEffect(() => {

    if (
      editId
    ) {
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
          getCustomers() ||
          []
        );

      };


    const refreshProducts =
      () => {

        setProducts(
          getProducts() ||
          []
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
     DÜZENLENEN FATURA
  ======================================================= */

  useEffect(() => {

    if (
      !editId
    ) {
      return;
    }


    const invoice =
      getInvoices().find(
        (item) =>
          String(
            item.id
          ) ===
          String(
            editId
          )
      );


    if (
      !invoice
    ) {
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


    setDiscount(
      numberValue(
        invoice.discountTotal ??
        invoice.discount ??
        0
      )
    );


    setStockTracking(
      invoice.stockTracking !==
      false
    );


    const customer =
      customers.find(
        (item) =>
          String(
            item.id
          ) ===
          String(
            invoice.customerId ||
            invoice.supplierId
          )
      );


    if (
      customer
    ) {
      setSelectedCustomer(
        customer
      );
    }


    const loadedItems =
      Array.isArray(
        invoice.items
      )
        ? invoice.items.map(
            (
              item,
              index
            ) => ({

              id:
                item.id ||
                `INV-EDIT-${index}-${Date.now()}`,

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

              unit:
                item.unit ||
                "Adet",

              quantity:
                numberValue(
                  item.quantity
                ) || 1,

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

              discount:
                numberValue(
                  item.discount
                ),

            })
          )
        : [];


    setItems(
      loadedItems.length >
      0
        ? loadedItems
        : [
            createItem(),
          ]
    );

  }, [
    editId,
    customers,
  ]);


  /* =======================================================
     CARİ ARAMA
  ======================================================= */

  const customerResults =
    useMemo(() => {

      const query =
        customerSearch
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      if (
        !query
      ) {
        return [];
      }


      return customers
        .filter(
          (
            customer
          ) => {

            const name =
              String(
                customer.name ||
                customer.title ||
                customer.companyName ||
                ""
              )
                .toLocaleLowerCase(
                  "tr-TR"
                );


            const code =
              String(
                customer.code ||
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
              )
            );

          }
        )
        .slice(
          0,
          8
        );

    }, [
      customers,
      customerSearch,
    ]);


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


      if (
        !query
      ) {
        return [];
      }


      return products
        .filter(
          (
            product
          ) => {

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
        )
        .slice(
          0,
          12
        );

    }, [
      products,
      productSearch,
    ]);


  /* =======================================================
     CARİ SEÇ
  ======================================================= */

  const selectCustomer =
    (
      customer
    ) => {

      setSelectedCustomer(
        customer
      );


      setCustomerSearch(
        ""
      );

    };


  /* =======================================================
     ÜRÜNÜ SATIRA EKLE
  ======================================================= */

  const addProductToInvoice =
    (product) => {

      /*
        Aynı ürün zaten varsa
        miktarını 1 artır.
      */

      const existing =
        items.find(
          (
            item
          ) =>
            String(
              item.productId
            ) ===
            String(
              product.id
            )
        );


      if (
        existing
      ) {

        setItems(
          items.map(
            (
              item
            ) =>
              item.id ===
              existing.id
                ? {
                    ...item,

                    quantity:
                      numberValue(
                        item.quantity
                      ) +
                      1,
                  }
                : item
          )
        );


      } else {

        const defaultPrice =
          invoiceType ===
          "purchase"
            ? productPurchasePrice(
                product
              )
            : productSalePrice(
                product
              );


        /*
          Boş bir satır varsa,
          önce o satırı doldur.
        */

        const emptyIndex =
          items.findIndex(
            (
              item
            ) =>
              !item.productId &&
              !item.productName
          );


        const newItem = {

          id:
            `INV-ITEM-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`,

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

          unit:
            productUnit(
              product
            ),

          quantity:
            1,

          unitPrice:
            defaultPrice,

          vatRate:
            productVat(
              product
            ),

          discount:
            0,
        };


        if (
          emptyIndex !==
          -1
        ) {

          setItems(
            items.map(
              (
                item,
                index
              ) =>
                index ===
                emptyIndex
                  ? newItem
                  : item
            )
          );

        } else {

          setItems([
            ...items,
            newItem,
          ]);

        }

      }


      setProductSearch(
        ""
      );

    };


  /* =======================================================
     BOŞ YENİ SATIR
  ======================================================= */

  const addEmptyLine =
    () => {

      setItems([
        ...items,
        createItem(),
      ]);

    };


  /* =======================================================
     SATIRDA ÜRÜN DEĞİŞTİR
  ======================================================= */

  const changeLineProduct =
    (
      itemId,
      productId
    ) => {

      if (
        !productId
      ) {

        setItems(
          items.map(
            (
              item
            ) =>
              item.id ===
              itemId
                ? {
                    ...item,

                    productId:
                      "",

                    productName:
                      "",

                    productCode:
                      "",

                    unit:
                      "Adet",

                    unitPrice:
                      "",

                    vatRate:
                      20,
                  }
                : item
          )
        );

        return;
      }


      const product =
        products.find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              productId
            )
        );


      if (
        !product
      ) {
        return;
      }


      const defaultPrice =
        invoiceType ===
        "purchase"
          ? productPurchasePrice(
              product
            )
          : productSalePrice(
              product
            );


      setItems(
        items.map(
          (
            item
          ) =>
            item.id ===
            itemId
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

                  unit:
                    productUnit(
                      product
                    ),

                  unitPrice:
                    defaultPrice,

                  vatRate:
                    productVat(
                      product
                    ),

                }
              : item
        )
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
        items.map(
          (
            item
          ) =>
            item.id ===
            id
              ? {
                  ...item,
                  [field]:
                    value,
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
          (
            item
          ) =>
            item.id !==
            id
        )
      );


      /*
        Tamamen boş kalmasın.
      */

      if (
        items.length ===
        1
      ) {

        setItems([
          createItem(),
        ]);

      }

    };


  /* =======================================================
     HESAPLAMA
  ======================================================= */

  const calculated =
    useMemo(() => {

      let subtotal =
        0;

      let vatTotal =
        0;


      const calculatedItems =
        items.map(
          (
            item
          ) => {

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


            const lineDiscount =
              lineGross *
              (
                numberValue(
                  item.discount
                ) /
                100
              );


            const lineNet =
              Math.max(
                0,
                lineGross -
                lineDiscount
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
        Math.max(
          0,
          numberValue(
            discount
          )
        );


      const taxableSubtotal =
        Math.max(
          0,
          subtotal -
          invoiceDiscount
        );


      let finalVat =
        vatTotal;


      if (
        subtotal >
          0 &&
        invoiceDiscount >
          0
      ) {

        finalVat =
          vatTotal *
          (
            taxableSubtotal /
            subtotal
          );

      }


      return {

        calculatedItems,

        subtotal,

        invoiceDiscount,

        vatTotal:
          finalVat,

        total:
          taxableSubtotal +
          finalVat,

      };

    }, [
      items,
      discount,
    ]);


  /* =======================================================
     MEVCUT FATURA FİNANSI
  ======================================================= */

  const currentInvoice =
    editId
      ? getInvoices().find(
          (
            invoice
          ) =>
            String(
              invoice.id
            ) ===
            String(
              editId
            )
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
    ) ===
    "sales";


  const isPurchaseInvoice =
    normalizeType(
      invoiceType
    ) ===
    "purchase";


  /* =======================================================
     FİYAT DEĞİŞİKLİĞİ BUL
  ======================================================= */

  const detectPriceChanges =
    () => {

      const priceChanges =
        [];


      calculated.calculatedItems.forEach(
        (
          item
        ) => {

          if (
            !item.productId
          ) {
            return;
          }


          const product =
            products.find(
              (
                productItem
              ) =>
                String(
                  productItem.id
                ) ===
                String(
                  item.productId
                )
            );


          if (
            !product
          ) {
            return;
          }


          const oldPrice =
            invoiceType ===
            "purchase"
              ? productPurchasePrice(
                  product
                )
              : productSalePrice(
                  product
                );


          const newPrice =
            numberValue(
              item.unitPrice
            );


          if (
            oldPrice <= 0 ||
            newPrice <= 0
          ) {
            return;
          }


          if (
            Math.abs(
              oldPrice -
              newPrice
            ) <
            0.005
          ) {
            return;
          }


          const difference =
            newPrice -
            oldPrice;


          const percent =
            (
              difference /
              oldPrice
            ) *
            100;


          priceChanges.push({

            item,

            product,

            oldPrice,

            newPrice,

            difference,

            percent,

          });

        }
      );


      return priceChanges;

    };


  /* =======================================================
     FİYAT UYARISI VE KAYDETME
  ======================================================= */

  const handlePriceChanges =
    (
      priceChanges
    ) => {

      if (
        priceChanges.length ===
        0
      ) {
        return;
      }


      const increaseCount =
        priceChanges.filter(
          (
            item
          ) =>
            item.difference >
            0
        ).length;


      const decreaseCount =
        priceChanges.filter(
          (
            item
          ) =>
            item.difference <
            0
        ).length;


      const detail =
        priceChanges
          .map(
            (
              change
            ) => {

              const arrow =
                change.difference >
                0
                  ? "↑"
                  : "↓";


              return (

                `${arrow} ${productName(
                  change.product
                )}\n` +

                `Eski ${
                  invoiceType ===
                  "purchase"
                    ? "alış"
                    : "satış"
                }: ${money(
                  change.oldPrice
                )} TL\n` +

                `Yeni ${
                  invoiceType ===
                  "purchase"
                    ? "alış"
                    : "satış"
                }: ${money(
                  change.newPrice
                )} TL\n` +

                `Değişim: ${
                  change.difference >
                  0
                    ? "+"
                    : ""
                }${money(
                  change.difference
                )} TL / %${Math.abs(
                  change.percent
                ).toFixed(
                  1
                )}`

              );

            }
          )
          .join(
            "\n\n"
          );


      const headline =
        invoiceType ===
        "purchase" &&
        increaseCount >
          0
          ? "🚨 TEDARİKÇİ FİYAT ARTIŞI TESPİT EDİLDİ"
          : "⚠️ FİYAT DEĞİŞİKLİĞİ TESPİT EDİLDİ";


      const message =
        `${headline}\n\n` +

        detail +

        "\n\n" +

        `${
          increaseCount
        } fiyat artışı` +

        (
          decreaseCount >
          0
            ? `, ${decreaseCount} fiyat düşüşü`
            : ""
        ) +

        ` bulundu.\n\n` +

        `Yeni fiyatları ürün kartına kaydetmek istiyor musunuz?\n\n` +

        `TAMAM = Yeni fiyatları kaydet\n` +

        `İPTAL = Eski ürün fiyatlarını koru`;

      const confirmed =
        window.confirm(
          message
        );


      if (
        !confirmed
      ) {
        return;
      }


      priceChanges.forEach(
        (
          change
        ) => {

          const product =
            change.product;


          const isPurchase =
            invoiceType ===
            "purchase";


          const vat =
            isPurchase
              ? numberValue(
                  product.purchaseVat
                )
              : numberValue(
                  product.salesVat
                );


          const grossPrice =
            change.newPrice *
            (
              1 +
              vat /
              100
            );


          if (
            isPurchase
          ) {

            updateProduct(
              product.id,
              {
                purchaseNet:
                  change.newPrice,

                purchaseGross:
                  grossPrice,
              }
            );

          } else {

            updateProduct(
              product.id,
              {
                salesNet:
                  change.newPrice,

                salesGross:
                  grossPrice,
              }
            );

          }


          addProductPriceHistory({
            productId:
              product.id,

            productCode:
              productCode(
                product
              ),

            productName:
              productName(
                product
              ),

            priceType:
              isPurchase
                ? "purchase"
                : "sales",

            oldPrice:
              change.oldPrice,

            newPrice:
              change.newPrice,

            supplierId:
              isPurchase
                ? selectedCustomer?.id ||
                  ""
                : "",

            supplierName:
              isPurchase
                ? (
                    selectedCustomer?.name ||
                    selectedCustomer?.title ||
                    selectedCustomer?.companyName ||
                    ""
                  )
                : "",

            invoiceId:
              editId ||
              "",

            invoiceNo:
              invoiceNo,

            date:
              invoiceDate,

          });

        }
      );


      setProducts(
        getProducts()
      );

    };


  /* =======================================================
     STOK YETERLİLİK KONTROLÜ
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


      return calculated.calculatedItems.find(
        (
          item
        ) => {

          if (
            !item.productId
          ) {
            return null;
          }


          const product =
            products.find(
              (
                p
              ) =>
                String(
                  p.id
                ) ===
                String(
                  item.productId
                )
            );


          if (
            !product
          ) {
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


          /*
            Burada artık satış
            stok nedeniyle engellenmiyor.

            Sadece bilgi amacıyla
            kontrol ediyoruz.
          */

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
     STOK UYGULA
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


      calculated.calculatedItems.forEach(
        (
          item
        ) => {

          const quantity =
            numberValue(
              item.quantity
            );


          if (
            quantity <=
              0 ||
            !item.productId
          ) {
            return;
          }


          if (
            type ===
            "sales"
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


          if (
            type ===
            "purchase"
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


          if (
            type ===
            "return"
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

      if (
        paymentMethod !==
        "Vadeli"
      ) {
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
        total <=
        0
      ) {
        return;
      }


      const type =
        normalizeType(
          invoiceType
        );


      if (
        type ===
        "sales"
      ) {

        updateCustomerBalance(
          selectedCustomer.id,
          -total
        );

        return;
      }


      if (
        type ===
        "purchase"
      ) {

        updateCustomerBalance(
          selectedCustomer.id,
          total
        );

        return;
      }


      if (
        type ===
        "return"
      ) {

        updateCustomerBalance(
          selectedCustomer.id,
          total
        );

      }

    };


  /* =======================================================
     FİNANS MODALI
  ======================================================= */

  const openFinanceModal =
    (
      mode
    ) => {

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


      if (
        remaining <=
        0
      ) {

        alert(
          mode ===
          "payment"
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
        "Havale / EFT"
      );


      setFinanceAccountId(
        availableAccounts[0]?.id ||
        ""
      );


      setFinanceDescription(
        mode ===
        "payment"
          ? `${currentInvoice.invoiceNo} numaralı alış faturası ödemesi`
          : `${currentInvoice.invoiceNo} numaralı satış faturası tahsilatı`
      );


      setShowFinanceModal(
        true
      );

    };


  /* =======================================================
     FİNANS DETAYINI YENİLE
  ======================================================= */

  const refreshFinanceDetail =
    () => {

      if (
        !editId
      ) {
        return;
      }


      const fresh =
        getInvoices().find(
          (
            invoice
          ) =>
            String(
              invoice.id
            ) ===
            String(
              editId
            )
        );


      if (
        fresh
      ) {

        setDetailInvoice(
          fresh
        );


        setAccounts(
          readAccounts()
        );

      }

    };


  /* =======================================================
     FİNANS İŞLEMİ KAYDET
  ======================================================= */

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


      if (
        amount <=
        0
      ) {

        alert(
          financeMode ===
          "payment"
            ? "Ödeme tutarı 0'dan büyük olmalıdır."
            : "Tahsilat tutarı 0'dan büyük olmalıdır."
        );

        return;
      }


      if (
        amount >
        remaining
      ) {

        alert(
          `Tutar kalan tutardan fazla olamaz.\n\nKalan: ${money(
            remaining
          )} TL`
        );

        return;
      }


      if (
        !financeAccountId
      ) {

        alert(
          "Lütfen kasa, banka veya POS hesabı seçin."
        );

        return;
      }


      const account =
        readAccounts().find(
          (
            item
          ) =>
            String(
              item.id
            ) ===
            String(
              financeAccountId
            )
        );


      if (
        !account
      ) {

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
                new Date()
                  .toISOString(),

            }
          );


        if (
          !updatedInvoice
        ) {

          throw new Error(
            "Fatura ödeme/tahsilat bilgisi güncellenemedi."
          );

        }


        /* CARİ */

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


        /* HESAP */

        const currentAccounts =
          readAccounts();


        const updatedAccounts =
          currentAccounts.map(
            (
              item
            ) => {

              if (
                String(
                  item.id
                ) !==
                String(
                  account.id
                )
              ) {

                return item;

              }


              const balance =
                numberValue(
                  item.balance
                );


              return {

                ...item,

                balance:
                  financeMode ===
                  "payment"
                    ? balance -
                      amount
                    : balance +
                      amount,

              };

            }
          );


        saveAccounts(
          updatedAccounts
        );


        /* FİNANS HAREKETİ */

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
            new Date()
              .toISOString(),

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
     FATURA KAYDET
  ======================================================= */

  const handleSave =
    () => {

      if (
        saving
      ) {
        return;
      }


      if (
        !selectedCustomer
      ) {

        alert(
          invoiceType ===
          "purchase"
            ? "Lütfen tedarikçi seçin."
            : "Lütfen cari seçin."
        );

        return;
      }


      /*
        Tamamen boş satırları
        fatura hesabından çıkarıyoruz.
      */

      const validItems =
        calculated.calculatedItems.filter(
          (
            item
          ) =>
            item.productId &&
            numberValue(
              item.quantity
            ) >
              0 &&
            numberValue(
              item.unitPrice
            ) >=
              0
        );


      if (
        validItems.length ===
        0
      ) {

        alert(
          "Lütfen faturaya en az bir ürün ekleyin."
        );

        return;
      }


      if (
        calculated.total <=
        0
      ) {

        alert(
          "Fatura toplamı 0 TL olamaz."
        );

        return;
      }


      /*
        Stok yalnızca uyarı için kontrol edilir.
        Artık stok yetersizliği fatura kaydını
        engellemez.
      */

      const stockWarning =
        checkSalesStock();


      if (
        stockWarning
      ) {

        const approved =
          window.confirm(
            `⚠️ STOK UYARISI\n\n` +

            `${stockWarning.productName}\n\n` +

            `Mevcut stok: ${
              money(
                stockWarning.currentStock
              )
            }\n` +

            `Faturadaki miktar: ${
              money(
                stockWarning.requested
              )
            }\n\n` +

            `Stok satış miktarını karşılamıyor.\n` +

            `Faturayı yine de kaydetmek ister misiniz?\n\n` +

            `Stok 0'ın altına düşmeyecek.`
          );


        if (
          !approved
        ) {
          return;
        }

      }


      /*
        FİYAT KONTROLÜ

        İlk kez kaydedilen faturada fiyat farklıysa
        kullanıcıya soruyoruz.

        Kullanıcı yeni fiyatı kabul ederse:
        - ürün kartı güncellenir
        - geçmişe kayıt düşer

        Reddederse:
        - fatura yeni fiyatıyla kaydolur
        - ürün kartındaki eski fiyat korunur
      */

      const priceChanges =
        detectPriceChanges();


      if (
        priceChanges.length >
        0
      ) {

        handlePriceChanges(
          priceChanges
        );

      }


      setSaving(
        true
      );


      try {

        const normalizedType =
          normalizeType(
            invoiceType
          );


        /* =================================================
           FİNANS SİSTEMİ
        ================================================= */

        const financeInvoice = {

          id:
            editId ||
            Date.now(),

          customerId:
            selectedCustomer.id,

          customerName:
            selectedCustomer.name ||
            selectedCustomer.unvan ||
            selectedCustomer.firmaAdi ||
            selectedCustomer.title ||
            "",

          total:
            Number(
              calculated.total
            ),

          subtotal:
            Number(
              calculated.subtotal ||
              0
            ),

          vat:
            Number(
              calculated.vatTotal ||
              0
            ),

          discount:
            Number(
              calculated.invoiceDiscount ||
              0
            ),

          type:
            normalizedType,

          invoiceNo:
            invoiceNo,

          date:
            invoiceDate,

          items:
            validItems.map(
              (
                item
              ) => ({
                productId:
                  item.productId,

                productName:
                  item.productName,

                quantity:
                  Number(
                    item.quantity
                  ),

                unitPrice:
                  Number(
                    item.unitPrice
                  ),

                total:
                  Number(
                    item.lineTotal
                  ),
              })
            ),

        };


        if (
          Finance &&
          typeof Finance.saveInvoice ===
            "function"
        ) {

          Finance.saveInvoice(
            financeInvoice
          );


          window.dispatchEvent(
            new Event(
              "ren-finance-updated"
            )
          );

        }


        /* =================================================
           FATURA KAYDI
        ================================================= */

        const customerName =
          selectedCustomer.name ||
          selectedCustomer.title ||
          selectedCustomer.companyName ||
          selectedCustomer.unvan ||
          "";


        const invoiceData = {

          type:
            normalizedType,

          invoiceNo,

          date:
            invoiceDate,

          dueDate,

          customerId:
            selectedCustomer.id,

          customerName,

          customerCode:
            selectedCustomer.code ||
            "",


          supplierId:
            normalizedType ===
            "purchase"
              ? selectedCustomer.id
              : "",

          supplierName:
            normalizedType ===
            "purchase"
              ? customerName
              : "",

          supplierCode:
            normalizedType ===
            "purchase"
              ? (
                  selectedCustomer.code ||
                  ""
                )
              : "",


          paymentMethod,

          paymentStatus:
            paymentMethod ===
            "Peşin"
              ? "Ödendi"
              : "Bekliyor",

          status:
            paymentMethod ===
            "Peşin"
              ? "paid"
              : "open",


          stockTracking,

          items:
            validItems,

          subtotal:
            calculated.subtotal,

          discountTotal:
            calculated.invoiceDiscount,

          discount:
            calculated.invoiceDiscount,

          vatTotal:
            calculated.vatTotal,

          total:
            calculated.total,

          notes,

          updatedAt:
            new Date()
              .toISOString(),

        };


        let saved;


        if (
          editId
        ) {

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


        if (
          !saved
        ) {

          throw new Error(
            "Fatura kaydedilemedi."
          );

        }


        /*
          Yeni faturada hareket oluştur.
          Mevcut faturayı düzenlerken
          tekrar stok/cari hareketi yaratma.
        */

        if (
          !editId
        ) {

          applyStockMovement(
            saved
          );


          applyCustomerMovement(
            saved
          );

        }


        window.dispatchEvent(
          new Event(
            "ren-invoices-updated"
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


        window.dispatchEvent(
          new Event(
            "ren-cash-bank-updated"
          )
        );


        alert(
          `${saved.invoiceNo} numaralı fatura başarıyla kaydedildi.`
        );


        window.location.href =
          `/invoices/detail?id=${encodeURIComponent(
            saved.id
          )}`;

      } catch (
        error
      ) {

        console.error(
          "REN ERP fatura kaydetme hatası:",
          error
        );


        alert(
          error?.message ||
          "Fatura kaydedilirken bir hata oluştu."
        );


        setSaving(
          false
        );

      }

    };


  /* =======================================================
     ÇIKIŞ
  ======================================================= */

  const closeInvoice =
    () => {

      window.location.href =
        "/invoices";

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

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
              {
                invoiceType ===
                "purchase"
                  ? "Alış"
                  : invoiceType ===
                    "return"
                    ? "İade"
                    : "Satış"
              }
            </span>

          </div>


          <h1>

            {
              editId
                ? "Fatura Detayı"
                : getTypeTitle(
                    invoiceType
                  )
            }

          </h1>

        </div>


        <div className="parasut-header-actions">

          {
            isDetailInvoice &&
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
                  currentRemaining <=
                  0
                }
              >
                {
                  currentRemaining <=
                  0
                    ? "TAHSİL EDİLDİ"
                    : "+ TAHSİLAT EKLE"
                }
              </button>

            )
          }


          {
            isDetailInvoice &&
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
                  currentRemaining <=
                  0
                }
              >
                {
                  currentRemaining <=
                  0
                    ? "ÖDENDİ"
                    : "+ ÖDEME EKLE"
                }
              </button>

            )
          }


          <button
            type="button"
            className="parasut-cancel-button"
            onClick={
              closeInvoice
            }
          >
            VAZGEÇ
          </button>


          {
            !isDetailInvoice && (

              <button
                type="button"
                className="parasut-save-button"
                disabled={
                  saving
                }
                onClick={
                  handleSave
                }
              >

                <MdSave />

                {
                  saving
                    ? "KAYDEDİLİYOR..."
                    : "KAYDET"
                }

              </button>

            )
          }


          <button
            type="button"
            className="parasut-save-arrow"
          >
            <MdKeyboardArrowDown />
          </button>

        </div>

      </div>


      {/* ===================================================
          ANA FATURA BİLGİLERİ
      =================================================== */}

      <div className="parasut-invoice-card">


        {/* FATURA NO */}

        <div className="parasut-row parasut-invoice-name-row">

          <div className="parasut-row-icon document-icon">
            ▤
          </div>

          <div className="parasut-label">
            FATURA NO
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
              readOnly={
                Boolean(
                  editId
                )
              }
            />

          </div>

        </div>


        {/* CARİ */}

        <div className="parasut-row customer-row">

          <div className="parasut-row-icon">
            ▦
          </div>

          <div className="parasut-label">

            {
              invoiceType ===
              "purchase"
                ? "TEDARİKÇİ"
                : "MÜŞTERİ"
            }

          </div>


          <div className="parasut-control customer-control">

            {
              selectedCustomer ? (

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


                  {
                    !editId && (

                      <button
                        type="button"
                        onClick={() => {

                          setSelectedCustomer(
                            null
                          );

                          setCustomerSearch(
                            ""
                          );

                        }}
                      >
                        Değiştir
                      </button>

                    )
                  }

                </div>

              ) : (

                <div className="parasut-search-box">

                  <MdSearch />

                  <input
                    value={
                      customerSearch
                    }
                    onChange={(
                      event
                    ) =>
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


                  {
                    customerResults.length >
                    0 && (

                      <div className="parasut-dropdown">

                        {
                          customerResults.map(
                            (
                              customer
                            ) => (

                              <button
                                type="button"
                                key={
                                  customer.id
                                }
                                onClick={() =>
                                  selectCustomer(
                                    customer
                                  )
                                }
                              >

                                <strong>
                                  {
                                    customer.name ||
                                    customer.title ||
                                    customer.companyName
                                  }
                                </strong>

                                <span>
                                  {
                                    customer.code ||
                                    ""
                                  }
                                </span>

                              </button>

                            )
                          )
                        }

                      </div>

                    )
                  }

                </div>

              )
            }


            <div className="parasut-help-text">

              <span>
                ⓘ
              </span>

              Kayıtlı bir cari seçebilirsiniz.

            </div>

          </div>

        </div>


        {/* CARİ BİLGİSİ */}

        <div className="parasut-row customer-info-row">

          <div className="parasut-row-icon">
            ▤
          </div>

          <div className="parasut-label">
            CARİ BİLGİLERİ
          </div>

          <div className="parasut-control">

            {
              selectedCustomer ? (

                <div className="customer-information">

                  {
                    selectedCustomer.phone ||
                    selectedCustomer.email ||
                    selectedCustomer.city ||
                    "—"
                  }

                </div>

              ) : (

                <div className="empty-value">
                  —
                </div>

              )
            }

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
                disabled={
                  Boolean(
                    editId
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
                disabled={
                  Boolean(
                    editId
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
                disabled={
                  Boolean(
                    editId
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

              {
                [
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
                        safeIsoDate(
                          invoiceDate,
                          option.days
                        )
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setDueDate(
                          safeIsoDate(
                            invoiceDate,
                            option.days
                          )
                        )
                      }
                      disabled={
                        Boolean(
                          editId
                        )
                      }
                    >
                      {
                        option.label
                      }
                    </button>

                  )
                )
              }

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
                disabled={
                  Boolean(
                    editId
                  )
                }
              />

              <MdCalendarToday />

            </div>

          </div>

        </div>


        {/* EXTRA */}

        <div className="parasut-extra-buttons">

          <button
            type="button"
          >
            + FATURA NO EKLE
          </button>

          <button
            type="button"
          >
            ₺ DÖVİZ DEĞİŞTİR
          </button>

          <button
            type="button"
          >
            + SİPARİŞ BİLGİSİ EKLE
          </button>

        </div>


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
              disabled={
                Boolean(
                  editId
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
                  STOK HAREKETİ OLUŞTUR
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
              disabled={
                Boolean(
                  editId
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
                  STOK HAREKETİ OLUŞTURMA
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
            📂 FATURA KATEGORİSİ
          </div>

          <div className="side-select">

            <span>
              KATEGORİSİZ
            </span>

            <MdKeyboardArrowDown />

          </div>

          <p>
            Faturalarınızı kategori bazında takip edebilirsiniz.
          </p>

        </div>


        <div className="parasut-side-card">

          <div className="side-card-title">
            🏷️ ETİKETLER
          </div>

          <div className="side-select">

            <span>
              ETİKETSİZ
            </span>

            <MdKeyboardArrowDown />

          </div>

          <p>
            Faturaları etiket bazında takip edebilirsiniz.
          </p>

        </div>


        {
          isDetailInvoice && (

            <div className="parasut-side-card">

              <div className="side-card-title">
                FATURA DURUMU
              </div>


              <div
                style={{
                  padding:
                    "12px 0",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >

                  <span>
                    Toplam
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
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "8px",
                  }}
                >

                  <span>
                    Ödenen
                  </span>

                  <strong
                    style={{
                      color:
                        "#3d8b63",
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
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    paddingTop:
                      "9px",
                    borderTop:
                      "1px solid #eee",
                  }}
                >

                  <span>
                    Kalan
                  </span>

                  <strong
                    style={{
                      color:
                        currentRemaining >
                        0
                          ? "#c84d48"
                          : "#3d8b63",
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

            </div>

          )
        }

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
            TOPLAM
          </div>

          <div />

        </div>


        {/* =================================================
            HIZLI ÜRÜN ARAMA
        ================================================= */}

        {
          !editId && (

            <div className="parasut-product-entry">

              <div className="parasut-product-search">

                <MdSearch />

                <input
                  value={
                    productSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setProductSearch(
                      event.target.value
                    )
                  }
                  placeholder="Ürün adı, kodu veya barkod ara..."
                />


                {
                  productResults.length >
                  0 && (

                    <div className="parasut-product-dropdown">

                      {
                        productResults.map(
                          (
                            product
                          ) => (

                            <button
                              type="button"
                              key={
                                product.id
                              }
                              onClick={() =>
                                addProductToInvoice(
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
                                    )
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
                        )
                      }

                    </div>

                  )
                }

              </div>


              <div
                className="product-quantity-input"
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color:
                    "#9a",
                }}
              >
                1
              </div>


              <div className="product-unit">
                Adet
              </div>


              <div className="product-price-input">
                0,00
              </div>


              <div className="product-vat">
                KDV
              </div>


              <div className="product-total">
                0,00₺
              </div>


              <button
                className="product-plus-button"
                type="button"
                onClick={
                  addEmptyLine
                }
                title="Yeni ürün satırı ekle"
              >
                +
              </button>

            </div>

          )
        }


        {/* =================================================
            ÜRÜN SATIRLARI
        ================================================= */}

        {
          calculated.calculatedItems.map(
            (
              item
            ) => (

              <div
                className="parasut-product-row"
                key={
                  item.id
                }
              >


                {/* ÜRÜN */}

                <div className="product-name-cell">

                  {
                    editId ? (

                      <div>

                        <strong>
                          {
                            item.productName ||
                            "Ürün"
                          }
                        </strong>

                        <small>
                          {
                            item.productCode ||
                            ""
                          }
                        </small>

                      </div>

                    ) : (

                      <select
                        value={
                          item.productId
                        }
                        onChange={(
                          event
                        ) =>
                          changeLineProduct(
                            item.id,
                            event.target.value
                          )
                        }
                        style={{
                          width:
                            "100%",
                          minHeight:
                            "36px",
                          border:
                            "1px solid #ddd",
                          borderRadius:
                            "4px",
                          background:
                            "#fff",
                          fontSize:
                            "11px",
                        }}
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
                                  productName(
                                    product
                                  )
                                }

                              </option>

                            )
                          )
                        }

                      </select>

                    )
                  }

                </div>


                {/* MİKTAR */}

                <div>

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
                    disabled={
                      Boolean(
                        editId
                      )
                    }
                  />

                </div>


                {/* BİRİM */}

                <div>

                  {
                    item.unit ||
                    "Adet"
                  }

                </div>


                {/* BİRİM FİYAT */}

                <div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
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
                    disabled={
                      Boolean(
                        editId
                      )
                    }
                  />

                </div>


                {/* KDV */}

                <div>

                  <select
                    value={
                      item.vatRate
                    }
                    onChange={(
                      event
                    ) =>
                      updateItem(
                        item.id,
                        "vatRate",
                        event.target.value
                      )
                    }
                    disabled={
                      Boolean(
                        editId
                      )
                    }
                  >

                    <option value="0">
                      KDV %0
                    </option>

                    <option value="1">
                      KDV %1
                    </option>

                    <option value="10">
                      KDV %10
                    </option>

                    <option value="20">
                      KDV %20
                    </option>

                  </select>

                </div>


                {/* TOPLAM */}

                <div className="product-total strong">

                  {
                    money(
                      item.lineTotal
                    )
                  }₺

                </div>


                {/* SİL */}

                <button
                  className="product-delete-button"
                  type="button"
                  onClick={() =>
                    removeItem(
                      item.id
                    )
                  }
                  disabled={
                    Boolean(
                      editId
                    )
                  }
                >

                  <MdDeleteOutline />

                </button>

              </div>

            )
          )
        }


        {/* =================================================
            YENİ SATIR
        ================================================= */}

        {
          !editId && (

            <button
              className="parasut-add-line"
              type="button"
              onClick={
                addEmptyLine
              }
            >

              <MdAdd />

              YENİ SATIR EKLE

            </button>

          )
        }


        {/* =================================================
            TOPLAMLAR
        ================================================= */}

        <div className="parasut-total-area">

          <div className="total-profit">

            {
              invoiceType ===
              "purchase"
                ? "Toplam Maliyet:"
                : "Toplam Kâr:"
            }

            <strong>
              —
            </strong>

          </div>


          <div className="total-box">

            <div>

              <span>
                ARA TOPLAM
              </span>

              <strong>
                {
                  money(
                    calculated.subtotal
                  )
                }₺
              </strong>

            </div>


            <div>

              <span>
                İSKONTO
              </span>


              <div className="discount-field">

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    discount
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscount(
                      event.target.value
                    )
                  }
                  disabled={
                    Boolean(
                      editId
                    )
                  }
                />

                <span>
                  ₺
                </span>

              </div>

            </div>


            <div>

              <span>
                TOPLAM KDV
              </span>

              <strong>
                {
                  money(
                    calculated.vatTotal
                  )
                }₺
              </strong>

            </div>


            <div className="grand-total">

              <span>
                GENEL TOPLAM
              </span>

              <strong>
                {
                  money(
                    calculated.total
                  )
                }₺
              </strong>

            </div>


            {
              isDetailInvoice && (

                <div
                  className="grand-total"
                  style={{
                    marginTop:
                      "8px",
                    borderTop:
                      "1px solid #eee",
                    paddingTop:
                      "8px",
                  }}
                >

                  <span>
                    KALAN
                  </span>


                  <strong
                    style={{
                      color:
                        currentRemaining >
                        0
                          ? "#c84d48"
                          : "#3d8b63",
                    }}
                  >

                    {
                      money(
                        currentRemaining
                      )
                    }₺

                  </strong>

                </div>

              )
            }

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
          onClick={
            closeInvoice
          }
        >
          VAZGEÇ
        </button>


        {
          isDetailInvoice &&
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
                currentRemaining <=
                0
              }
            >
              {
                currentRemaining <=
                0
                  ? "TAHSİL EDİLDİ"
                  : "+ TAHSİLAT EKLE"
              }
            </button>

          )
        }


        {
          isDetailInvoice &&
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
                currentRemaining <=
                0
              }
            >
              {
                currentRemaining <=
                0
                  ? "ÖDENDİ"
                  : "+ ÖDEME EKLE"
              }
            </button>

          )
        }


        {
          !isDetailInvoice && (

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

              {
                saving
                  ? "KAYDEDİLİYOR..."
                  : "KAYDET"
              }

            </button>

          )
        }

      </div>


      {/* ===================================================
          TAHSİLAT / ÖDEME MODALI
      =================================================== */}

      {
        showFinanceModal && (

          <div
            style={{
              position:
                "fixed",
              inset:
                0,
              zIndex:
                9999,
              background:
                "rgba(0,0,0,.45)",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding:
                "20px",
            }}
            onMouseDown={(
              event
            ) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                setShowFinanceModal(
                  false
                );

              }

            }}
          >

            <div
              style={{
                width:
                  "100%",
                maxWidth:
                  "620px",
                background:
                  "#fff",
                borderRadius:
                  "10px",
                boxShadow:
                  "0 20px 60px rgba(0,0,0,.18)",
                overflow:
                  "hidden",
              }}
            >

              <div
                style={{
                  padding:
                    "22px 24px",
                  borderBottom:
                    "1px solid #eee",
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize:
                        "10px",
                      fontWeight:
                        700,
                      color:
                        "#8a95a3",
                      marginBottom:
                        "5px",
                    }}
                  >

                    {
                      financeMode ===
                      "payment"
                        ? "FATURA ÖDEMESİ"
                        : "FATURA TAHSİLATI"
                    }

                  </div>


                  <h2
                    style={{
                      margin:
                        0,
                      fontSize:
                        "22px",
                      color:
                        "#242b34",
                    }}
                  >

                    {
                      financeMode ===
                      "payment"
                        ? "Ödeme Ekle"
                        : "Tahsilat Ekle"
                    }

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
                    border:
                      0,
                    background:
                      "#f2f3f5",
                    width:
                      "34px",
                    height:
                      "34px",
                    borderRadius:
                      "50%",
                    fontSize:
                      "20px",
                    cursor:
                      "pointer",
                  }}
                >
                  ×
                </button>

              </div>


              {/* ÖZET */}

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(3,1fr)",
                  gap:
                    "10px",
                  padding:
                    "18px 24px",
                  background:
                    "#fafbfc",
                }}
              >

                <div
                  style={{
                    padding:
                      "12px",
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
                    padding:
                      "12px",
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
                        "#3d8b63",
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
                    padding:
                      "12px",
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
                          : "#3d8b63",
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


              {/* FORM */}

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
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap:
                      "14px",
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
                          event.target.value
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
                          "13px",
                      }}
                    />

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
                          event.target.value
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
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap:
                      "14px",
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
                          event.target.value
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
                          event.target.value
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

                              {" — ₺"}

                              {
                                money(
                                  account.balance
                                )
                              }

                            </option>

                          )
                        )
                      }

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
                        event.target.value
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


              {/* FOOTER */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "8px",
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
                  VAZGEÇ
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

                  {
                    financeSaving
                      ? "KAYDEDİLİYOR..."
                      : financeMode ===
                        "payment"
                      ? "ÖDEMEYİ KAYDET"
                      : "TAHSİLATI KAYDET"
                  }

                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );
}