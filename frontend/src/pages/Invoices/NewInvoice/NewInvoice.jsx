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

  const result =
    Number(text);

  return Number.isFinite(result)
    ? result
    : 0;
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
    value === "alÄ±ÅŸ" ||
    value === "alis" ||
    value === "alÄ±ÅŸ faturasÄ±" ||
    value === "alis faturasi"
  ) {
    return "purchase";
  }

  if (
    value === "return" ||
    value === "returns" ||
    value === "iade" ||
    value === "iade faturasÄ±" ||
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
    return "Yeni AlÄ±ÅŸ FaturasÄ±";
  }

  if (
    type === "return"
  ) {
    return "Yeni Ä°ade FaturasÄ±";
  }

  return "Yeni SatÄ±ÅŸ FaturasÄ±";
}


function productName(product) {
  return (
    product?.name ||
    product?.productName ||
    product?.title ||
    "ÃœrÃ¼n"
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
    productSearch,
    setProductSearch,
  ] = useState("");


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
  ] = useState([]);


  const [
    discount,
    setDiscount,
  ] = useState(0);


  const [
    stockTracking,
    setStockTracking,
  ] = useState(true);


  const [
    saving,
    setSaving,
  ] = useState(false);


  /* =======================================================
     FATURA TAHSÄ°LAT / Ã–DEME
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
  ] = useState("");


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
     VERÄ°LERÄ° YENÄ°LE
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
     DÃœZENLEME
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


    setDiscount(
      numberValue(
        invoice.discountTotal ??
        invoice.discount ??
        0
      )
    );


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


    setItems(
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
                `item-${index}-${Date.now()}`,

              productId:
                item.productId ||
                "",

              productName:
                item.productName ||
                item.name ||
                "ÃœrÃ¼n",

              productCode:
                item.productCode ||
                item.code ||
                "",

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
        : []
    );

  }, [
    editId,
    customers,
  ]);


  /* =======================================================
     CARÄ° ARAMA
  ======================================================= */

  const customerResults =
    useMemo(() => {

      const query =
        customerSearch
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      if (!query) {
        return [];
      }


      return customers
        .filter(
          (customer) => {

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
     ÃœRÃœN ARAMA
  ======================================================= */

  const productResults =
    useMemo(() => {

      const query =
        productSearch
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      if (!query) {
        return [];
      }


      return products
        .filter(
          (product) => {

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
          10
        );

    }, [
      products,
      productSearch,
    ]);


  /* =======================================================
     ÃœRÃœN EKLE
  ======================================================= */

  const addProduct =
    (product) => {

      const existing =
        items.find(
          (item) =>
            String(
              item.productId
            ) ===
            String(
              product.id
            )
        );


      if (existing) {

        setItems(
          items.map(
            (item) =>
              String(
                item.productId
              ) ===
              String(
                product.id
              )
                ? {
                    ...item,

                    quantity:
                      numberValue(
                        item.quantity
                      ) + 1,
                  }
                : item
          )
        );

      } else {

        const price =
          invoiceType ===
          "purchase"
            ? productPurchasePrice(
                product
              )
            : productSalePrice(
                product
              );


        setItems([
          ...items,

          {
            id:
              `${Date.now()}-${Math.random()}`,

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

            quantity:
              1,

            unitPrice:
              price,

            vatRate:
              productVat(
                product
              ),

            discount:
              0,
          },
        ]);

      }


      setProductSearch("");

    };


  /* =======================================================
     SATIR GÃœNCELLE
  ======================================================= */

  const updateItem =
    (
      id,
      field,
      value
    ) => {

      setItems(
        items.map(
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


  /* =======================================================
     SATIR SÄ°L
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


            const lineDiscount =
              numberValue(
                item.discount
              );


            const lineGross =
              quantity *
              unitPrice;


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
        subtotal > 0 &&
        invoiceDiscount > 0
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
     FATURA FÄ°NANS DURUMU
  ======================================================= */

  const currentInvoice =
    editId
      ? getInvoices().find(
          (invoice) =>
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
     FÄ°NANS MODALINI AÃ‡
  ======================================================= */

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


      if (
        remaining <= 0
      ) {

        alert(
          mode ===
          "payment"
            ? "Bu alÄ±ÅŸ faturasÄ± tamamen Ã¶denmiÅŸtir."
            : "Bu satÄ±ÅŸ faturasÄ± tamamen tahsil edilmiÅŸtir."
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
          ? `${currentInvoice.invoiceNo} numaralÄ± alÄ±ÅŸ faturasÄ± Ã¶demesi`
          : `${currentInvoice.invoiceNo} numaralÄ± satÄ±ÅŸ faturasÄ± tahsilatÄ±`
      );


      setShowFinanceModal(
        true
      );

    };


  /* =======================================================
     FÄ°NANS DETAYINI YENÄ°LE
  ======================================================= */

  const refreshFinanceDetail =
    () => {

      if (!editId) {
        return;
      }


      const fresh =
        getInvoices().find(
          (invoice) =>
            String(
              invoice.id
            ) ===
            String(
              editId
            )
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


  /* =======================================================
     FÄ°NANS KAYDET
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
          "Fatura bulunamadÄ±."
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
        amount <= 0
      ) {

        alert(
          financeMode ===
          "payment"
            ? "Ã–deme tutarÄ± 0'dan bÃ¼yÃ¼k olmalÄ±dÄ±r."
            : "Tahsilat tutarÄ± 0'dan bÃ¼yÃ¼k olmalÄ±dÄ±r."
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
          "LÃ¼tfen kasa, banka veya POS hesabÄ± seÃ§in."
        );

        return;
      }


      const account =
        readAccounts().find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              financeAccountId
            )
        );


      if (!account) {

        alert(
          "Finans hesabÄ± bulunamadÄ±."
        );

        return;
      }


      if (
        !currentInvoice.customerId
      ) {

        alert(
          financeMode ===
          "payment"
            ? "Bu alÄ±ÅŸ faturasÄ±na baÄŸlÄ± tedarikÃ§i bulunamadÄ±."
            : "Bu satÄ±ÅŸ faturasÄ±na baÄŸlÄ± mÃ¼ÅŸteri bulunamadÄ±."
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
                        ? "Ã–dendi"
                        : "Tahsil Edildi"
                    )
                  : (
                      financeMode ===
                      "payment"
                        ? "KÄ±smi Ã–deme"
                        : "KÄ±smi Tahsilat"
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
            "Fatura Ã¶deme/tahsilat bilgisi gÃ¼ncellenemedi."
          );

        }


        /* =================================================
           CARÄ°
        ================================================= */

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


        /* =================================================
           FÄ°NANS HESABI
        ================================================= */

        const currentAccounts =
          readAccounts();


        const updatedAccounts =
          currentAccounts.map(
            (item) => {

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


        /* =================================================
           FÄ°NANS HAREKETÄ°
        ================================================= */

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
              ? "Ã‡Ä±kÄ±ÅŸ"
              : "GiriÅŸ",

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
              ? "Ã¶deme"
              : "tahsilat"
          } baÅŸarÄ±yla kaydedildi.`
        );


      } catch (
        error
      ) {

        console.error(
          "REN ERP finans iÅŸlemi hatasÄ±:",
          error
        );


        alert(
          error?.message ||
          "Ä°ÅŸlem kaydedilirken bir hata oluÅŸtu."
        );


      } finally {

        setFinanceSaving(
          false
        );

      }

    };


  /* =======================================================
     STOK KONTROLÃœ
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
     STOK HAREKETÄ°
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


            if (
              type ===
              "sales"
            ) {

              changeStock(
                item.productId,
                -quantity,
                {

                  type:
                    "SatÄ±ÅŸ FaturasÄ±",

                  source:
                    "Fatura",

                  sourceId:
                    invoice.id,

                  description:
                    `${invoice.invoiceNo} numaralÄ± satÄ±ÅŸ faturasÄ±.`,

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
                    "AlÄ±ÅŸ FaturasÄ±",

                  source:
                    "Fatura",

                  sourceId:
                    invoice.id,

                  description:
                    `${invoice.invoiceNo} numaralÄ± alÄ±ÅŸ faturasÄ±.`,

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
                    "Ä°ade FaturasÄ±",

                  source:
                    "Fatura",

                  sourceId:
                    invoice.id,

                  description:
                    `${invoice.invoiceNo} numaralÄ± iade faturasÄ±.`,

                }
              );

            }

          }
        );

    };


  /* =======================================================
     CARÄ° HAREKET
  ======================================================= */

  const applyCustomerMovement =
    (
      invoice
    ) => {

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
     KAYDET
  ======================================================= */

  const handleSave =
    () => {

      if (saving) {
        return;
      }


      if (
        !selectedCustomer
      ) {

        alert(
          invoiceType ===
          "purchase"
            ? "LÃ¼tfen tedarikÃ§i seÃ§in."
            : "LÃ¼tfen cari seÃ§in."
        );

        return;
      }


      if (
        items.length ===
        0
      ) {

        alert(
          "LÃ¼tfen faturaya en az bir Ã¼rÃ¼n ekleyin."
        );

        return;
      }


      if (
        calculated.total <=
        0
      ) {

        alert(
          "Fatura toplamÄ± 0 TL olamaz."
        );

        return;
      }


      const invalidStock =
        checkSalesStock();


      if (
        invalidStock
      ) {

        alert(
          `"${invalidStock.productName}" iÃ§in mevcut stok yetersiz.\n\nMevcut stok: ${money(
            invalidStock.currentStock
          )}\nÄ°stenen Ã§Ä±kÄ±ÅŸ: ${money(
            invalidStock.requested
          )}`
        );

        return;
      }


      setSaving(true);


      try {

        const normalizedType =
          normalizeType(
            invoiceType
          );
      // REN ERP Finans Senkronizasyonu
      const financeInvoice = {
        id: Date.now(),
        customerId: selectedCustomer.id,
        customerName:
          selectedCustomer.unvan ||
          selectedCustomer.name ||
          selectedCustomer.firmaAdi ||
          "",
        total: Number(calculated.total),
        subtotal: Number(calculated.subtotal || 0),
        vat: Number(calculated.vat || 0),
        discount: Number(calculated.discount || 0),
        type: normalizedType,
        invoiceNo: invoiceNumber,
        date: invoiceDate,
        items: items.map((item) => ({
          productId: item.id,
          productName: item.productName || item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice || item.price),
          total: Number(item.total),
        })),
      };

      Finance.saveInvoice(financeInvoice);
      window.dispatchEvent(new Event("ren-finance-updated"));


        const customerName =
          selectedCustomer.name ||
          selectedCustomer.title ||
          selectedCustomer.companyName ||
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
            "PeÅŸin"
              ? "Ã–dendi"
              : "Bekliyor",

          status:
            paymentMethod ===
            "PeÅŸin"
              ? "paid"
              : "open",


          stockTracking,

          items:
            calculated.calculatedItems,

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


        if (!editId) {

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


        alert(
          `${saved.invoiceNo} numaralÄ± fatura baÅŸarÄ±yla kaydedildi.`
        );


        window.location.href =
          `/invoices/detail?id=${encodeURIComponent(
            saved.id
          )}`;

      } catch (
        error
      ) {

        console.error(
          "REN ERP fatura kaydetme hatasÄ±:",
          error
        );


        alert(
          error?.message ||
          "Fatura kaydedilirken bir hata oluÅŸtu."
        );


        setSaving(
          false
        );

      }

    };


  /* =======================================================
     GÃ–RÃœNÃœM
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
              â€º
            </b>

            <span>
              {
                invoiceType ===
                "purchase"
                  ? "AlÄ±ÅŸ"
                  : invoiceType ===
                    "return"
                    ? "Ä°ade"
                    : "SatÄ±ÅŸ"
              }
            </span>

          </div>


          <h1>
            {
              editId
                ? "Fatura DÃ¼zenle"
                : getTypeTitle(
                    invoiceType
                  )
            }
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
                  currentRemaining <=
                  0
                }
              >
                {
                  currentRemaining <=
                  0
                    ? "TAHSÄ°L EDÄ°LDÄ°"
                    : "+ TAHSÄ°LAT EKLE"
                }
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
                  currentRemaining <=
                  0
                }
              >
                {
                  currentRemaining <=
                  0
                    ? "Ã–DENDÄ°"
                    : "+ Ã–DEME EKLE"
                }
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
            VAZGEÃ‡
          </button>


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
                ? "KAYDEDÄ°LÄ°YOR..."
                : "KAYDET"
            }

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

        {/* FATURA Ä°SMÄ° */}

        <div className="parasut-row parasut-invoice-name-row">

          <div className="parasut-row-icon document-icon">
            â–¤
          </div>

          <div className="parasut-label">
            FATURA Ä°SMÄ°
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
              placeholder="Fatura adÄ±"
            />

          </div>

        </div>


        {/* MÃœÅTERÄ° / TEDARÄ°KÃ‡Ä° */}

        <div className="parasut-row customer-row">

          <div className="parasut-row-icon">
            â–¦
          </div>

          <div className="parasut-label">
            {
              invoiceType ===
              "purchase"
                ? "TEDARÄ°KÃ‡Ä°"
                : "MÃœÅTERÄ°"
            }
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

                  }}
                >
                  DeÄŸiÅŸtir
                </button>

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
                      ? "TedarikÃ§i ara..."
                      : "MÃ¼ÅŸteri ara..."
                  }
                />


                {customerResults.length >
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
                            onClick={() => {

                              setSelectedCustomer(
                                customer
                              );

                              setCustomerSearch(
                                ""
                              );

                            }}
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

                )}

              </div>

            )}


            <div className="parasut-help-text">

              <span>
                â“˜
              </span>

              KayÄ±tlÄ± bir cari seÃ§ebilir veya arama yapabilirsiniz.

            </div>

          </div>

        </div>


        {/* CARÄ° BÄ°LGÄ°LERÄ° */}

        <div className="parasut-row customer-info-row">

          <div className="parasut-row-icon">
            â–¤
          </div>

          <div className="parasut-label">
            CARÄ° BÄ°LGÄ°LERÄ°
          </div>

          <div className="parasut-control">

            {
              selectedCustomer ? (
                <div className="customer-information">

                  {
                    selectedCustomer.phone ||
                    selectedCustomer.email ||
                    selectedCustomer.city ||
                    "â€”"
                  }

                </div>
              ) : (
                <div className="empty-value">
                  â€”
                </div>
              )
            }

          </div>

        </div>


        {/* TAHSÄ°LAT DURUMU */}

        <div className="parasut-row payment-status-row">

          <div className="parasut-row-icon">
            ?
          </div>

          <div className="parasut-label">
            TAHSÄ°LAT DURUMU
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
                  âœ“
                </span>

                TAHSÄ°L EDÄ°LECEK

              </button>


              <button
                type="button"
                className={
                  paymentMethod ===
                  "PeÅŸin"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setPaymentMethod(
                    "PeÅŸin"
                  )
                }
              >

                <span className="radio-dot">
                  âœ“
                </span>

                TAHSÄ°L EDÄ°LDÄ°

              </button>

            </div>

          </div>

        </div>


        {/* TARÄ°H */}

        <div className="parasut-row">

          <div className="parasut-row-icon">
            <MdCalendarToday />
          </div>

          <div className="parasut-label">
            DÃœZENLEME TARÄ°HÄ°
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
            â—
          </div>

          <div className="parasut-label">
            VADE TARÄ°HÄ°
          </div>

          <div className="parasut-control">

            <div className="parasut-due-buttons">

              {
                [
                  {
                    label:
                      "AYNI GÃœN",
                    days:
                      0,
                  },
                  {
                    label:
                      "7 GÃœN",
                    days:
                      7,
                  },
                  {
                    label:
                      "14 GÃœN",
                    days:
                      14,
                  },
                  {
                    label:
                      "30 GÃœN",
                    days:
                      30,
                  },
                  {
                    label:
                      "60 GÃœN",
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
              />

              <MdCalendarToday />

            </div>

          </div>

        </div>


        {/* EK BUTONLAR */}

        <div className="parasut-extra-buttons">

          <button
            type="button"
          >
            + FATURA NO EKLE
          </button>

          <button
            type="button"
          >
            â‚º DÃ–VÄ°Z DEÄÄ°ÅTÄ°R
          </button>

          <button
            type="button"
          >
            + SÄ°PARÄ°Å BÄ°LGÄ°SÄ° EKLE
          </button>

        </div>


        {/* STOK TAKÄ°BÄ° */}

        <div className="parasut-stock-section">

          <div className="parasut-row-icon">
            â–¦
          </div>

          <div className="parasut-label">
            STOK TAKÄ°BÄ°
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
                    ? "âœ“"
                    : "â—‹"
                }
              </span>

              <div>

                <strong>
                  STOK Ã‡IKIÅI YAPILSIN
                </strong>

                <small>
                  Fatura kaydedildiÄŸinde stok hareketi oluÅŸturulur.
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
                    ? "âœ“"
                    : "â—‹"
                }
              </span>

              <div>

                <strong>
                  STOK Ã‡IKIÅI YAPILMASIN
                </strong>

                <small>
                  Fatura stok miktarÄ±nÄ± deÄŸiÅŸtirmeden kaydedilir.
                </small>

              </div>

            </button>

          </div>

        </div>

      </div>


      {/* ===================================================
          SAÄ PANEL
      =================================================== */}

      <aside className="parasut-side-column">

        <div className="parasut-side-card">

          <div className="side-card-title">
            ğŸ“ FATURA KATEGORÄ°SÄ°
          </div>

          <div className="side-select">

            <span>
              KATEGORÄ°SÄ°Z
            </span>

            <MdKeyboardArrowDown />

          </div>

          <p>
            FaturalarÄ±n kategorilere gÃ¶re
            daÄŸÄ±lÄ±mÄ±nÄ± raporlarda takip edebilirsiniz.
          </p>

        </div>


        <div className="parasut-side-card">

          <div className="side-card-title">
            ğŸ· ETÄ°KETLER
          </div>

          <div className="side-select">

            <span>
              ETÄ°KETSÄ°Z
            </span>

            <MdKeyboardArrowDown />

          </div>

          <p>
            FaturalarÄ± etiket bazÄ±nda takip edebilirsiniz.
          </p>

        </div>

      </aside>


      {/* ===================================================
          ÃœRÃœNLER
      =================================================== */}

      <section className="parasut-products-card">

        <div className="parasut-products-header">

          <div className="product-header-title">
            HÄ°ZMET / ÃœRÃœN
          </div>

          <div>
            MÄ°KTAR
          </div>

          <div>
            BÄ°RÄ°M
          </div>

          <div>
            BR. FÄ°YAT
          </div>

          <div>
            VERGÄ°
          </div>

          <div>
            TOPLAM
          </div>

          <div />

        </div>


        {/* ÃœRÃœN ARAMA */}

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
              placeholder="ÃœrÃ¼n adÄ±, kodu veya barkod ara..."
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
                            addProduct(
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
                            â‚º
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


          <input
            className="product-quantity-input"
            value="1"
            readOnly
          />


          <div className="product-unit">
            Adet
          </div>


          <input
            className="product-price-input"
            value="0,00"
            readOnly
          />


          <div className="product-vat">

            KDV

            <span>
              %20
            </span>

          </div>


          <div className="product-total">
            0,00â‚º
          </div>


          <button
            className="product-plus-button"
            type="button"
            onClick={() =>
              setProductSearch("")
            }
          >
            +
          </button>

        </div>


        {/* ÃœRÃœN SATIRLARI */}

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

                <div className="product-name-cell">

                  <strong>
                    {
                      item.productName
                    }
                  </strong>

                  <small>
                    {
                      item.productCode ||
                      ""
                    }
                  </small>

                </div>


                <div>

                  <input
                    type="number"
                    min="1"
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
                  />

                </div>


                <div>
                  Adet
                </div>


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
                  />

                </div>


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


                <div className="product-total strong">

                  {
                    money(
                      item.lineTotal
                    )
                  }â‚º

                </div>


                <button
                  className="product-delete-button"
                  type="button"
                  onClick={() =>
                    removeItem(
                      item.id
                    )
                  }
                >

                  <MdDeleteOutline />

                </button>

              </div>

            )
          )
        }


        {/* YENÄ° SATIR */}

        <button
          className="parasut-add-line"
          type="button"
          onClick={() =>
            setProductSearch("")
          }
        >

          <MdAdd />

          YENÄ° SATIR EKLE

        </button>


        {/* TOPLAM */}

        <div className="parasut-total-area">

          <div className="total-profit">

            Toplam KÃ¢r:

            <strong>
              â€”
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
                }â‚º
              </strong>

            </div>


            <div>

              <span>
                Ä°SKONTO
              </span>


              <div className="discount-field">

                <input
                  type="number"
                  min="0"
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
                />

                <span>
                  â‚º
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
                }â‚º
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
                }â‚º
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
                          ? "#c84a43"
                          : "#3f8f62",
                    }}
                  >
                    {
                      money(
                        currentRemaining
                      )
                    }â‚º
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
          onClick={() =>
            window.location.href =
              "/invoices"
          }
        >
          VAZGEÃ‡
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
                  ? "TAHSÄ°L EDÄ°LDÄ°"
                  : "+ TAHSÄ°LAT EKLE"
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
                  ? "Ã–DENDÄ°"
                  : "+ Ã–DEME EKLE"
              }
            </button>

          )
        }


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
              ? "KAYDEDÄ°LÄ°YOR..."
              : "KAYDET"
          }

        </button>

      </div>


      {/* ===================================================
          TAHSÄ°LAT / Ã–DEME MODALI
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

              {/* HEADER */}

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
                        ? "FATURA Ã–DEMESÄ°"
                        : "FATURA TAHSÄ°LATI"
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
                        ? "Ã–deme Ekle"
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
                    } numaralÄ± fatura
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
                  Ã—
                </button>

              </div>


              {/* Ã–ZET */}

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
                        ? "Ã–DENEN"
                        : "TAHSÄ°L EDÄ°LEN"
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
                        ? "TedarikÃ§i"
                        : "MÃ¼ÅŸteri"
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
                          ? "Ã–deme TutarÄ±"
                          : "Tahsilat TutarÄ±"
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
                      Ã–deme YÃ¶ntemi
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
                        Kredi KartÄ±
                      </option>

                      <option>
                        POS
                      </option>

                      <option>
                        Ã‡ek
                      </option>

                      <option>
                        DiÄŸer
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
                        Hesap seÃ§in
                      </option>


                      {
                        accounts
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
                                {" â€” "}
                                {
                                  account.type
                                }
                                {" â€” â‚º"}
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
                    AÃ§Ä±klama
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
                  VAZGEÃ‡
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
                      ? "KAYDEDÄ°LÄ°YOR..."
                      : financeMode ===
                        "payment"
                      ? "Ã–DEMEYÄ° KAYDET"
                      : "TAHSÄ°LATI KAYDET"
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
