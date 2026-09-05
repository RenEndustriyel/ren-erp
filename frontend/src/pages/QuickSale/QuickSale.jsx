import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdAdd,
  MdBarcodeReader,
  MdDelete,
  MdRemove,
  MdSearch,
  MdShoppingCart,
} from "react-icons/md";

import {
  getProducts,
  updateProduct,
} from "../../lib/stockStore";

import {
  addCustomer,
  getCustomers,
} from "../../lib/customerStore";

import {
  addCustomerMovement,
} from "../../lib/movementStore";

import "./QuickSale.css";


/* =========================================================
   STORAGE
========================================================= */

const ACCOUNT_STORAGE_KEY =
  "ren-erp-cash-bank-accounts";

const FINANCE_MOVEMENT_STORAGE_KEY =
  "ren-erp-cash-bank-movements";

const QUICK_SALE_STORAGE_KEY =
  "ren_erp_quick_sales";

const STOCK_MOVEMENT_STORAGE_KEY =
  "ren_erp_stock_movements";


/* =========================================================
   YARDIMCI
========================================================= */

function numberValue(value) {

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
    return Number.isFinite(
      value
    )
      ? value
      : 0;
  }

  let text =
    String(value)
      .trim()
      .replace(/\s/g, "");

  if (
    text.includes(",") &&
    text.includes(".")
  ) {

    text =
      text
        .replace(/\./g, "")
        .replace(",", ".");

  } else {

    text =
      text.replace(",", ".");

  }

  const result =
    Number(text);

  return Number.isFinite(result)
    ? result
    : 0;

}


function money(value) {

  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    numberValue(value)
  );

}


function today() {

  return new Date()
    .toISOString()
    .slice(
      0,
      10
    );

}


function nowTime() {

  return new Date()
    .toLocaleTimeString(
      "tr-TR",
      {
        hour:
          "2-digit",
        minute:
          "2-digit",
      }
    );

}


/* =========================================================
   ÜRÜN FİYATLARI
========================================================= */

function getProductVat(
  product
) {

  return numberValue(
    product?.salesVat ??
    product?.vatRate ??
    product?.vat ??
    20
  );

}


function getProductGrossSalePrice(
  product
) {

  const mode =
    product?.salesMode ||
    "exclusive";


  const net =
    numberValue(
      product?.salesNet ??
      product?.salePrice ??
      product?.salesPrice ??
      0
    );


  const gross =
    numberValue(
      product?.salesGross
    );


  const vat =
    getProductVat(
      product
    );


  if (
    mode ===
    "inclusive"
  ) {

    return (
      gross > 0
        ? gross
        : net *
          (
            1 +
            vat /
            100
          )
    );

  }


  return (
    net *
    (
      1 +
      vat /
      100
    )
  );

}


/* =========================================================
   KASA / POS
========================================================= */

function readAccounts() {

  try {

    const saved =
      localStorage.getItem(
        ACCOUNT_STORAGE_KEY
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

        return parsed;

      }

    }

  } catch (
    error
  ) {

    console.error(
      "Hesaplar okunamadı:",
      error
    );

  }

  return [];

}


function writeAccounts(
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


function readFinanceMovements() {

  try {

    const saved =
      localStorage.getItem(
        FINANCE_MOVEMENT_STORAGE_KEY
      );


    if (
      !saved
    ) {

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

  } catch (
    error
  ) {

    console.error(
      "Finans hareketleri okunamadı:",
      error
    );

    return [];

  }

}


function writeFinanceMovements(
  movements
) {

  localStorage.setItem(
    FINANCE_MOVEMENT_STORAGE_KEY,
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
   STOK HAREKETLERİ
========================================================= */

function readStockMovements() {

  try {

    const saved =
      localStorage.getItem(
        STOCK_MOVEMENT_STORAGE_KEY
      );


    if (
      !saved
    ) {

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

  } catch (
    error
  ) {

    console.error(
      "Stok hareketleri okunamadı:",
      error
    );

    return [];

  }

}


function writeStockMovements(
  movements
) {

  localStorage.setItem(
    STOCK_MOVEMENT_STORAGE_KEY,
    JSON.stringify(
      movements
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

}


function readQuickSales() {
  try {
    const saved =
      localStorage.getItem(
        QUICK_SALE_STORAGE_KEY
      );

    const parsed =
      saved
        ? JSON.parse(saved)
        : [];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "Hızlı satış geçmişi okunamadı:",
      error
    );
    return [];
  }
}


function writeQuickSales(
  sales
) {
  localStorage.setItem(
    QUICK_SALE_STORAGE_KEY,
    JSON.stringify(sales)
  );

  window.dispatchEvent(
    new Event(
      "ren-invoices-updated"
    )
  );

  window.dispatchEvent(
    new Event(
      "ren-quick-sales-updated"
    )
  );
}


/* =========================================================
   CARİ KODU
========================================================= */

function getNextCustomerCode() {

  const customers =
    getCustomers() || [];


  let max =
    0;


  customers.forEach(
    (
      customer
    ) => {

      const code =
        String(
          customer?.code ||
          ""
        );


      const crmMatch =
        code.match(
          /CRM-(\d+)/i
        );


      if (
        crmMatch
      ) {

        max =
          Math.max(
            max,
            Number(
              crmMatch[1]
            )
          );

      }


      const crMatch =
        code.match(
          /CR-(\d+)/i
        );


      if (
        crMatch
      ) {

        max =
          Math.max(
            max,
            Number(
              crMatch[1]
            )
          );

      }

    }
  );


  return `CRM-${String(
    max + 1
  ).padStart(
    4,
    "0"
  )}`;

}


/* =========================================================
   COMPONENT
========================================================= */

export default function QuickSale() {

  const [
    products,
    setProducts,
  ] =
    useState(
      () =>
        getProducts() || []
    );


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    cart,
    setCart,
  ] =
    useState([]);


  const [
    paymentType,
    setPaymentType,
  ] =
    useState(
      "cash"
    );


  const [
    accounts,
    setAccounts,
  ] =
    useState(
      readAccounts
    );


  const [
    selectedAccountId,
    setSelectedAccountId,
  ] =
    useState("");


  const [
    customers,
    setCustomers,
  ] =
    useState(
      () =>
        getCustomers() || []
    );


  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] =
    useState("");


  const [
    cashAmount,
    setCashAmount,
  ] =
    useState("");


  const [
    cardAmount,
    setCardAmount,
  ] =
    useState("");


  const [
    creditAmount,
    setCreditAmount,
  ] =
    useState("");


  const [
    saleMessage,
    setSaleMessage,
  ] =
    useState("");


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    quickSalesHistory,
    setQuickSalesHistory,
  ] =
    useState(
      () =>
        readQuickSales()
    );


  const [
    showQuickSalesHistory,
    setShowQuickSalesHistory,
  ] =
    useState(false);


  const [
    showNewCustomer,
    setShowNewCustomer,
  ] =
    useState(false);


  const [
    newCustomerName,
    setNewCustomerName,
  ] =
    useState("");


  const [
    newCustomerPhone,
    setNewCustomerPhone,
  ] =
    useState("");


  const [
    newCustomerCode,
    setNewCustomerCode,
  ] =
    useState(
      getNextCustomerCode()
    );


  /* =======================================================
     YENİLE
  ======================================================= */

  const reloadData = () => {

    setProducts(
      getProducts() || []
    );

    setAccounts(
      readAccounts()
    );

    setCustomers(
      getCustomers() || []
    );

    setQuickSalesHistory(
      readQuickSales()
    );

  };


  useEffect(() => {

    const events = [
      "ren-products-changed",
      "ren-stock-updated",
      "ren-cash-bank-updated",
      "ren-customers-updated",
      "ren-invoices-updated",
      "ren-quick-sales-updated",
      "storage",
    ];


    events.forEach(
      (
        eventName
      ) => {

        window.addEventListener(
          eventName,
          reloadData
        );

      }
    );


    return () => {

      events.forEach(
        (
          eventName
        ) => {

          window.removeEventListener(
            eventName,
            reloadData
          );

        }
      );

    };

  }, []);


  /* =======================================================
     ÜRÜNLER
  ======================================================= */

  const availableProducts =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            );


        const list =
          products.filter(
            (
              product
            ) => {

              const active =
                product?.active !==
                  false &&
                product?.status !==
                  "Pasif";


              if (
                !active
              ) {

                return false;

              }


              if (
                !query
              ) {

                return true;

              }


              return (

                String(
                  product?.name ||
                  ""
                )
                  .toLocaleLowerCase(
                    "tr-TR"
                  )
                  .includes(
                    query
                  ) ||

                String(
                  product?.code ||
                  ""
                )
                  .toLocaleLowerCase(
                    "tr-TR"
                  )
                  .includes(
                    query
                  ) ||

                String(
                  product?.barcode ||
                  ""
                )
                  .trim() ===
                search.trim()

              );

            }
          );


        return query
          ? list.slice(
              0,
              20
            )
          : list.slice(
              0,
              12
            );

      },
      [
        products,
        search,
      ]
    );


  /* =======================================================
     ÜRÜN EKLE
  ======================================================= */

  const addToCart =
    (
      product
    ) => {

      setSaleMessage("");


      const existing =
        cart.find(
          (
            item
          ) =>
            String(
              item.product.id
            ) ===
            String(
              product.id
            )
        );


      if (
        existing
      ) {

        setCart(
          (
            current
          ) =>
            current.map(
              (
                item
              ) => {

                if (
                  String(
                    item.product.id
                  ) !==
                  String(
                    product.id
                  )
                ) {

                  return item;

                }


                const stock =
                  numberValue(
                    product.stock
                  );


                const nextQty =
                  item.quantity +
                  1;


                if (
                  stock >
                    0 &&
                  nextQty >
                    stock
                ) {

                  setSaleMessage(
                    `Stok yetersiz. Mevcut stok: ${stock}`
                  );


                  return item;

                }


                return {

                  ...item,

                  quantity:
                    nextQty,

                };

              }
            )
        );

        return;

      }


      const stock =
        numberValue(
          product.stock
        );


      if (
        stock <=
        0
      ) {

        setSaleMessage(
          "Bu ürünün stoğu yok."
        );

        return;

      }


      setCart(
        (
          current
        ) => [

          ...current,

          {

            product,

            quantity:
              1,

            unitPrice:
              getProductGrossSalePrice(
                product
              ),

          },

        ]
      );

    };


  /* =======================================================
     MİKTAR
  ======================================================= */

  const changeQuantity =
    (
      productId,
      delta
    ) => {

      setSaleMessage("");


      setCart(
        (
          current
        ) =>

          current.map(
            (
              item
            ) => {

              if (
                String(
                  item.product.id
                ) !==
                String(
                  productId
                )
              ) {

                return item;

              }


              const stock =
                numberValue(
                  item.product.stock
                );


              const next =
                Math.max(
                  1,
                  item.quantity +
                  delta
                );


              if (
                stock >
                  0 &&
                next >
                  stock
              ) {

                setSaleMessage(
                  `Stok yetersiz. Mevcut stok: ${stock}`
                );


                return item;

              }


              return {

                ...item,

                quantity:
                  next,

              };

            }
          )

      );

    };


  /* =======================================================
     MANUEL FİYAT
  ======================================================= */

  const changeUnitPrice =
    (
      productId,
      value
    ) => {

      setSaleMessage("");


      setCart(
        (
          current
        ) =>

          current.map(
            (
              item
            ) =>

              String(
                item.product.id
              ) ===
              String(
                productId
              )

                ? {

                    ...item,

                    unitPrice:
                      Math.max(
                        0,
                        numberValue(
                          value
                        )
                      ),

                  }

                : item

          )

      );

    };


  /* =======================================================
     SİL
  ======================================================= */

  const removeFromCart =
    (
      productId
    ) => {

      setCart(
        (
          current
        ) =>
          current.filter(
            (
              item
            ) =>
              String(
                item.product.id
              ) !==
              String(
                productId
              )
          )
      );

    };


  /* =======================================================
     TEMİZLE
  ======================================================= */

  const clearCart =
    () => {

      setCart([]);

      setSaleMessage("");

      setCashAmount("");

      setCardAmount("");

      setCreditAmount("");

      setSelectedCustomerId("");

      setSelectedAccountId("");

    };


  /* =======================================================
     SATIR
  ======================================================= */

  const getLineTotal =
    (
      item
    ) => {

      return (
        numberValue(
          item.unitPrice
        ) *
        numberValue(
          item.quantity
        )
      );

    };


  const getLineVat =
    (
      item
    ) => {

      const totalLine =
        getLineTotal(
          item
        );


      const vat =
        getProductVat(
          item.product
        );


      return (
        totalLine -
        (
          totalLine /
          (
            1 +
            vat /
            100
          )
        )
      );

    };


  /* =======================================================
     TOPLAMLAR
  ======================================================= */

  const subtotal =
    useMemo(
      () =>

        cart.reduce(
          (
            sum,
            item
          ) =>

            sum +
            (
              getLineTotal(
                item
              ) -
              getLineVat(
                item
              )
            ),
          0
        ),

      [
        cart,
      ]
    );


  const totalVat =
    useMemo(
      () =>

        cart.reduce(
          (
            sum,
            item
          ) =>

            sum +
            getLineVat(
              item
            ),

          0
        ),

      [
        cart,
      ]
    );


  const total =
    useMemo(
      () =>

        cart.reduce(
          (
            sum,
            item
          ) =>

            sum +
            getLineTotal(
              item
            ),

          0
        ),

      [
        cart,
      ]
    );


  const totalQuantity =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum +
        numberValue(
          item.quantity
        ),
      0
    );


  /* =======================================================
     ÖDEME
  ======================================================= */

  const cash =
    numberValue(
      cashAmount
    );


  const card =
    numberValue(
      cardAmount
    );


  const explicitCredit =
    numberValue(
      creditAmount
    );


  /*
   * BOŞ ALAN = TAM ÖDEME
   *
   * Nakit seçili + boş
   * => tamamı nakit
   *
   * Kart seçili + boş
   * => tamamı kart
   */

  const effectiveCash =
    paymentType ===
      "cash" &&
    String(
      cashAmount
    ).trim() ===
      ""
      ? total
      : cash;


  const effectiveCard =
    paymentType ===
      "card" &&
    String(
      cardAmount
    ).trim() ===
      ""
      ? total
      : card;


  /*
   * Parçalı ödemede açıkça girilen
   * nakit + kart + veresiye.
   */

  const splitEnteredTotal =
    cash +
    card +
    explicitCredit;


  /*
   * Otomatik veresiye:
   *
   * Nakit/Kart eksikse fark
   * otomatik cariye gider.
   *
   * Veresiye seçiliyse tüm tutar.
   *
   * Parçalı ödemede eksik kalan tutar.
   */

  const finalCreditAmount =
    paymentType ===
      "credit"

      ? total

      : paymentType ===
          "cash"

      ? Math.max(
          0,
          total -
            effectiveCash
        )

      : paymentType ===
          "card"

      ? Math.max(
          0,
          total -
            effectiveCard
        )

      : Math.max(
          0,
          total -
            splitEnteredTotal
        );


  /*
   * Gerçek tahsil edilen para.
   */

  const paidTotal =
    paymentType ===
      "cash"

      ? effectiveCash

      : paymentType ===
          "card"

      ? effectiveCard

      : paymentType ===
          "credit"

      ? 0

      : cash +
        card;


  /*
   * Kalan = otomatik cariye gidecek tutar.
   */

  const remaining =
    finalCreditAmount;


  /* =======================================================
     ÖDEME HESAPLARINI DEĞİŞTİR
  ======================================================= */

  const selectPaymentType =
    (
      type
    ) => {

      setPaymentType(
        type
      );

      setSaleMessage("");

      setSelectedAccountId("");

      /*
       * Tür değiştirince eski tutarların
       * diğer moda taşınmasını istemiyoruz.
       */

      if (
        type ===
        "cash"
      ) {

        setCardAmount("");

        setCreditAmount("");

      }


      if (
        type ===
        "card"
      ) {

        setCashAmount("");

        setCreditAmount("");

      }


      if (
        type ===
        "credit"
      ) {

        setCashAmount("");

        setCardAmount("");

        setCreditAmount(
          ""
        );

      }


      if (
        type ===
        "split"
      ) {

        setCashAmount("");

        setCardAmount("");

        setCreditAmount("");

      }

    };


  /* =======================================================
     BARKOD
  ======================================================= */

  const handleBarcodeKeyDown =
    (
      event
    ) => {

      if (
        event.key !==
        "Enter"
      ) {

        return;

      }


      const value =
        search.trim();


      if (
        !value
      ) {

        return;

      }


      const product =
        products.find(
          (
            item
          ) =>

            String(
              item?.barcode ||
              ""
            ).trim() ===
              value ||

            String(
              item?.code ||
              ""
            )
              .trim()
              .toLocaleLowerCase(
                "tr-TR"
              ) ===
              value
                .toLocaleLowerCase(
                  "tr-TR"
                )
        );


      if (
        product
      ) {

        addToCart(
          product
        );

        setSearch("");

      } else {

        setSaleMessage(
          "Barkod / ürün bulunamadı."
        );

      }

    };


  /* =======================================================
     YENİ CARİ
  ======================================================= */

  const createQuickCustomer =
    () => {

      const name =
        newCustomerName.trim();


      if (
        !name
      ) {

        alert(
          "Cari adı zorunludur."
        );

        return;

      }


      const currentCustomers =
        getCustomers() || [];


      const exists =
        currentCustomers.some(
          (
            customer
          ) =>
            String(
              customer?.name ||
              ""
            )
              .trim()
              .toLocaleLowerCase(
                "tr-TR"
              ) ===
            name
              .toLocaleLowerCase(
                "tr-TR"
              )
        );


      if (
        exists
      ) {

        alert(
          "Bu isimde bir cari zaten bulunuyor."
        );

        return;

      }


      const customer = {

        id:
          Date.now(),

        code:
          newCustomerCode,

        name,

        type:
          "Müşteri",

        phone:
          newCustomerPhone.trim(),

        email:
          "",

        contact:
          "",

        taxOffice:
          "",

        taxNumber:
          "",

        address:
          "",

        city:
          "",

        district:
          "",

        term:
          "Peşin",

        openingBalance:
          0,

        balanceDirection:
          "Borç",

        balance:
          0,

        note:
          "Hızlı Satış ekranından oluşturuldu.",

        status:
          "Aktif",

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),

      };


      addCustomer(
        customer
      );


      window.dispatchEvent(
        new Event(
          "ren-customers-updated"
        )
      );


      setCustomers(
        getCustomers() || []
      );


      setSelectedCustomerId(
        customer.id
      );


      setShowNewCustomer(
        false
      );


      setNewCustomerName(
        ""
      );


      setNewCustomerPhone(
        ""
      );


      setNewCustomerCode(
        getNextCustomerCode()
      );


      setSaleMessage(
        `${customer.code} — ${customer.name} cari hesabı oluşturuldu.`
      );

    };


  /* =======================================================
     HESAPLAR
  ======================================================= */

  const cashAccounts =
    accounts.filter(
      (
        account
      ) =>
        account.type ===
          "Kasa" &&
        account.status !==
          "Pasif"
    );


  const cardAccounts =
    accounts.filter(
      (
        account
      ) =>
        (
          account.type ===
            "POS" ||
          account.type ===
            "Banka"
        ) &&
        account.status !==
          "Pasif"
    );


  const customerAccounts =
    customers.filter(
      (
        customer
      ) =>
        customer.type !==
        "Tedarikçi"
    );


  /* =======================================================
     FİNANS HAREKETİ
  ======================================================= */

  const createFinanceMovement =
    ({
      account,
      amount,
      method,
      saleNumber,
    }) => {

      if (
        !account ||
        amount <=
          0
      ) {

        return;

      }


      const movements =
        readFinanceMovements();


      const movement = {

        id:
          `CB-HS-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        accountId:
          account.id,

        accountName:
          account.name,

        accountType:
          account.type,

        direction:
          "Giriş",

        amount:
          Number(
            amount.toFixed(
              2
            )
          ),

        description:
          `${saleNumber} — Hızlı satış`,

        date:
          today(),

        method,

        source:
          "quick-sale",

        sourceDocument:
          saleNumber,

        createdAt:
          new Date().toISOString(),

      };


      writeFinanceMovements(
        [
          movement,
          ...movements,
        ]
      );

    };


  /* =======================================================
     STOK HAREKETİ
  ======================================================= */

  const createStockMovement =
    ({
      item,
      saleNumber,
    }) => {

      const product =
        item.product;


      const previousStock =
        numberValue(
          product.stock
        );


      const quantity =
        numberValue(
          item.quantity
        );


      const nextStock =
        previousStock -
        quantity;


      updateProduct(
        product.id,
        {
          stock:
            nextStock,

          updatedAt:
            new Date().toISOString(),
        }
      );


      const movements =
        readStockMovements();


      const movement = {

        id:
          `MOV-HS-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        date:
          today(),

        time:
          nowTime(),

        productId:
          product.id,

        productCode:
          product.code,

        product:
          product.name,

        productName:
          product.name,

        type:
          "Stok Çıkışı",

        movementType:
          "Stok Çıkışı",

        previousStock,

        beforeStock:
          previousStock,

        quantity:
          -quantity,

        movement:
          -quantity,

        amount:
          -quantity,

        nextStock,

        afterStock:
          nextStock,

        source:
          "Hızlı Satış",

        sourceDocument:
          saleNumber,

        documentNo:
          saleNumber,

        description:
          `${saleNumber} numaralı hızlı satış.`,

        createdAt:
          new Date().toISOString(),

      };


      writeStockMovements(
        [
          movement,
          ...movements,
        ]
      );

    };


  /* =======================================================
     CARİ BORÇ
  ======================================================= */

  const createCustomerDebt =
    ({
      customer,
      amount,
      saleNumber,
    }) => {

      if (
        !customer ||
        amount <=
          0
      ) {

        return;

      }


      addCustomerMovement({

        id:
          `CM-HS-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        customerId:
          customer.id,

        customerName:
          customer.name,

        date:
          today(),

        document:
          saleNumber,

        type:
          "Satış",

        description:
          `${saleNumber} — Hızlı satış veresiye`,

        debt:
          Number(
            amount.toFixed(
              2
            )
          ),

        credit:
          0,

        balance:
          null,

        method:
          "Veresiye",

        source:
          "quick-sale",

        sourceId:
          saleNumber,

        createdAt:
          new Date().toISOString(),

      });

    };


  /* =======================================================
     HIZLI SATIŞ SİL
  ======================================================= */

  const handleDeleteQuickSale =
    (
      sale
    ) => {

      if (
        !sale
      ) {
        return;
      }

      const saleNumber =
        sale.number ||
        sale.saleNumber ||
        sale.invoiceNo ||
        sale.id;

      const confirmed =
        window.confirm(
          `${saleNumber} numaralı hızlı satış silinsin mi?\\n\\n` +
          "Bu işlem satış kaydını siler, ilgili stok hareketini geri alır, " +
          "kasa/POS hareketini ve varsa cari hareketini tersine çevirir."
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {

        /*
         * HIZLI SATIŞ KAYDI
         */

        const allQuickSales =
          readQuickSales();

        const nextQuickSales =
          allQuickSales.filter(
            (item) =>
              String(
                item?.id
              ) !==
              String(
                sale?.id
              )
          );

        writeQuickSales(
          nextQuickSales
        );


        /*
         * STOK HAREKETİ
         * Hızlı satışta eksi miktar
         * stoktan düşülmüştü.
         * Silerken mevcut stoğa geri ekliyoruz.
         */

        const stockMovements =
          readStockMovements();

        const relatedStockMovements =
          stockMovements.filter(
            (movement) =>
              String(
                movement?.sourceDocument ||
                movement?.documentNo ||
                ""
              ) ===
              String(
                saleNumber
              )
          );

        if (
          relatedStockMovements.length
        ) {

          relatedStockMovements.forEach(
            (
              movement
            ) => {

              const quantity =
                numberValue(
                  movement?.quantity ??
                  movement?.movement ??
                  movement?.amount
                );

              if (
                !movement?.productId ||
                quantity ===
                  0
              ) {
                return;
              }

              const currentProducts =
                getProducts() || [];

              const product =
                currentProducts.find(
                  (item) =>
                    String(
                      item?.id
                    ) ===
                    String(
                      movement.productId
                    )
                );

              if (
                !product
              ) {
                return;
              }

              updateProduct(
                product.id,
                {
                  stock:
                    numberValue(
                      product.stock
                    ) -
                    quantity,

                  updatedAt:
                    new Date().toISOString(),
                }
              );

            }
          );

        }


        const nextStockMovements =
          stockMovements.filter(
            (movement) =>
              String(
                movement?.sourceDocument ||
                movement?.documentNo ||
                ""
              ) !==
              String(
                saleNumber
              )
          );

        writeStockMovements(
          nextStockMovements
        );


        /*
         * KASA / POS
         * Satışta giriş olarak eklenen
         * ilgili hareketler geri alınır.
         */

        const financeMovements =
          readFinanceMovements();

        const relatedFinanceMovements =
          financeMovements.filter(
            (movement) =>
              String(
                movement?.source ||
                ""
              ) ===
                "quick-sale" &&
              String(
                movement?.sourceDocument ||
                ""
              ) ===
                String(
                  saleNumber
                )
          );

        if (
          relatedFinanceMovements.length
        ) {

          const currentAccounts =
            readAccounts();

          const updatedAccounts =
            currentAccounts.map(
              (
                account
              ) => {

                const totalToReverse =
                  relatedFinanceMovements
                    .filter(
                      (movement) =>
                        String(
                          movement?.accountId
                        ) ===
                        String(
                          account?.id
                        )
                    )
                    .reduce(
                      (
                        sum,
                        movement
                      ) =>
                        sum +
                        numberValue(
                          movement?.amount
                        ),
                      0
                    );

                if (
                  totalToReverse ===
                  0
                ) {
                  return account;
                }

                return {
                  ...account,
                  balance:
                    numberValue(
                      account?.balance
                    ) -
                    totalToReverse,
                };

              }
            );

          writeAccounts(
            updatedAccounts
          );

        }

        writeFinanceMovements(
          financeMovements.filter(
            (movement) =>
              !(
                String(
                  movement?.source ||
                  ""
                ) ===
                  "quick-sale" &&
                String(
                  movement?.sourceDocument ||
                  ""
                ) ===
                  String(
                    saleNumber
                  )
              )
          )
        );


        /*
         * CARİ HAREKET
         */

        try {

          const customerMovementKey =
            "ren-erp-customer-movements";

          const savedCustomerMovements =
            JSON.parse(
              localStorage.getItem(
                customerMovementKey
              ) ||
              "[]"
            );

          const nextCustomerMovements =
            Array.isArray(
              savedCustomerMovements
            )
              ? savedCustomerMovements.filter(
                  (
                    movement
                  ) =>
                    !(
                      String(
                        movement?.source ||
                        ""
                      ) ===
                        "quick-sale" &&
                      String(
                        movement?.sourceId ||
                        movement?.document ||
                        ""
                      ) ===
                        String(
                          saleNumber
                        )
                    )
                )
              : [];

          localStorage.setItem(
            customerMovementKey,
            JSON.stringify(
              nextCustomerMovements
            )
          );

          window.dispatchEvent(
            new Event(
              "ren-customer-movements-updated"
            )
          );

        } catch (
          customerError
        ) {
          console.error(
            "Hızlı satış cari hareketi silinemedi:",
            customerError
          );
        }


        /*
         * GENEL YENİLEME
         */

        window.dispatchEvent(
          new Event(
            "ren-products-changed"
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
            "ren-cash-bank-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "ren-customers-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "ren-invoices-updated"
          )
        );

        window.dispatchEvent(
          new Event(
            "ren-quick-sales-updated"
          )
        );

        setQuickSalesHistory(
          nextQuickSales
        );

        setProducts(
          getProducts() || []
        );

        setAccounts(
          readAccounts()
        );

        setCustomers(
          getCustomers() || []
        );

        setSaleMessage(
          `${saleNumber} numaralı hızlı satış silindi.`
        );

      } catch (
        error
      ) {

        console.error(
          "Hızlı satış silme hatası:",
          error
        );

        setSaleMessage(
          error?.message ||
          "Hızlı satış silinemedi."
        );

      }

    };


  /* =======================================================
     SATIŞI TAMAMLA
  ======================================================= */

  const handleCompleteSale =
    () => {

      setSaleMessage("");


      if (
        saving
      ) {

        return;

      }


      if (
        cart.length ===
        0
      ) {

        setSaleMessage(
          "Sepet boş."
        );

        return;

      }


      /*
       * Otomatik veresiye varsa cari gerekir.
       */

      if (
        finalCreditAmount >
          0.01 &&
        !selectedCustomerId
      ) {

        setSaleMessage(
          `Kalan ${money(
            finalCreditAmount
          )} TL için müşteri/cari seçmelisiniz.`
        );

        return;

      }


      /*
       * Veresiye seçildiyse müşteri şart.
       */

      if (
        paymentType ===
          "credit" &&
        !selectedCustomerId
      ) {

        setSaleMessage(
          "Veresiye satış için müşteri seçmelisiniz."
        );

        return;

      }


      /*
       * Fazla ödeme.
       */

      if (
        paymentType !==
          "credit" &&
        paymentType !==
          "split" &&
        paidTotal >
          total +
          0.01
      ) {

        setSaleMessage(
          `Ödeme satış toplamından fazla. Fazla: ${money(
            paidTotal -
            total
          )} TL`
        );

        return;

      }


      /*
       * Parçalı ödeme fazla olamaz.
       */

      if (
        paymentType ===
          "split" &&
        splitEnteredTotal >
          total +
          0.01
      ) {

        setSaleMessage(
          `Parçalı ödeme toplamı fazla. Fazla: ${money(
            splitEnteredTotal -
            total
          )} TL`
        );

        return;

      }


      /*
       * Nakit/kart alınacaksa hesap şart.
       */

      if (
        (
          paymentType ===
            "cash" &&
          effectiveCash >
            0
        ) &&
        !selectedAccountId
      ) {

        setSaleMessage(
          "Nakit satış için kasa seçmelisiniz."
        );

        return;

      }


      if (
        (
          paymentType ===
            "card" &&
          effectiveCard >
            0
        ) &&
        !selectedAccountId
      ) {

        setSaleMessage(
          "Kredi kartı satışı için POS hesabı seçmelisiniz."
        );

        return;

      }


      /*
       * Parçalı nakit varsa en az bir kasa,
       * kart varsa POS/Banka olmalı.
       */

      if (
        paymentType ===
          "split"
      ) {

        if (
          cash >
            0 &&
          cashAccounts.length ===
            0
        ) {

          setSaleMessage(
            "Nakit ödeme için kasa hesabı bulunamadı."
          );

          return;

        }


        if (
          card >
            0 &&
          cardAccounts.length ===
            0
        ) {

          setSaleMessage(
            "Kredi kartı ödeme için POS/Banka hesabı bulunamadı."
          );

          return;

        }

      }


      setSaving(
        true
      );


      try {

        const saleNumber =
          `HS-${new Date()
            .getFullYear()}-${String(
            Date.now()
          ).slice(
            -6
          )}`;


        const customer =
          customers.find(
            (
              item
            ) =>
              String(
                item.id
              ) ===
              String(
                selectedCustomerId
              )
          );


        let cashAccount =
          null;

        let cardAccount =
          null;


        /*
         * NAKİT
         */

        if (
          paymentType ===
          "cash"
        ) {

          cashAccount =
            accounts.find(
              (
                account
              ) =>
                String(
                  account.id
                ) ===
                String(
                  selectedAccountId
                )
            );

        }


        /*
         * KART
         */

        if (
          paymentType ===
          "card"
        ) {

          cardAccount =
            accounts.find(
              (
                account
              ) =>
                String(
                  account.id
                ) ===
                String(
                  selectedAccountId
                )
            );

        }


        /*
         * PARÇALI
         *
         * İlk uygun kasa/POS hesabını kullanır.
         */

        if (
          paymentType ===
          "split"
        ) {

          if (
            cash >
              0
          ) {

            cashAccount =
              cashAccounts[0] ||
              null;

          }


          if (
            card >
              0
          ) {

            cardAccount =
              cardAccounts[0] ||
              null;

          }

        }


        /*
         * STOK KONTROL
         */

        const invalidStock =
          cart.find(
            (
              item
            ) => {

              const stock =
                numberValue(
                  item.product.stock
                );

              return (
                item.quantity >
                stock
              );

            }
          );


        if (
          invalidStock
        ) {

          setSaleMessage(
            `${invalidStock.product.name} için yeterli stok yok.`
          );

          setSaving(
            false
          );

          return;

        }


        /*
         * STOK DÜŞ
         */

        cart.forEach(
          (
            item
          ) => {

            createStockMovement({
              item,
              saleNumber,
            });

          }
        );


        /*
         * HESAP BAKİYELERİ
         */

        const updatedAccounts =
          accounts.map(
            (
              account
            ) => {

              let addition =
                0;


              if (
                cashAccount &&
                String(
                  account.id
                ) ===
                String(
                  cashAccount.id
                )
              ) {

                addition +=
                  paymentType ===
                    "cash"
                    ? effectiveCash
                    : cash;

              }


              if (
                cardAccount &&
                String(
                  account.id
                ) ===
                String(
                  cardAccount.id
                )
              ) {

                addition +=
                  paymentType ===
                    "card"
                    ? effectiveCard
                    : card;

              }


              if (
                paymentType ===
                  "cash" &&
                String(
                  account.id
                ) ===
                String(
                  selectedAccountId
                )
              ) {

                addition =
                  effectiveCash;

              }


              if (
                paymentType ===
                  "card" &&
                String(
                  account.id
                ) ===
                String(
                  selectedAccountId
                )
              ) {

                addition =
                  effectiveCard;

              }


              return {

                ...account,

                balance:
                  numberValue(
                    account.balance
                  ) +
                  addition,

              };

            }
          );


        /*
         * NAKİT FİNANS
         */

        if (
          paymentType ===
            "cash" &&
          effectiveCash >
            0
        ) {

          createFinanceMovement({

            account:
              cashAccount,

            amount:
              effectiveCash,

            method:
              "Nakit",

            saleNumber,

          });

        }


        /*
         * KART FİNANS
         */

        if (
          paymentType ===
            "card" &&
          effectiveCard >
            0
        ) {

          createFinanceMovement({

            account:
              cardAccount,

            amount:
              effectiveCard,

            method:
              "Kredi Kartı",

            saleNumber,

          });

        }


        /*
         * PARÇALI NAKİT
         */

        if (
          paymentType ===
            "split" &&
          cash >
            0
        ) {

          createFinanceMovement({

            account:
              cashAccount,

            amount:
              cash,

            method:
              "Nakit",

            saleNumber,

          });

        }


        /*
         * PARÇALI KART
         */

        if (
          paymentType ===
            "split" &&
          card >
            0
        ) {

          createFinanceMovement({

            account:
              cardAccount,

            amount:
              card,

            method:
              "Kredi Kartı",

            saleNumber,

          });

        }


        /*
         * CARİ BORCU
         */

        if (
          finalCreditAmount >
            0.01
        ) {

          createCustomerDebt({

            customer,

            amount:
              finalCreditAmount,

            saleNumber,

          });

        }


        /*
         * HESAPLARI KAYDET
         */

        writeAccounts(
          updatedAccounts
        );


        /*
         * HIZLI SATIŞ KAYDI
         */

        const quickSales =
          JSON.parse(
            localStorage.getItem(
              QUICK_SALE_STORAGE_KEY
            ) ||
            "[]"
          );


        const saleRecord = {

          id:
            `QSL-${Date.now()}`,

          number:
            saleNumber,

          type:
            "Hızlı Satış",

          date:
            today(),

          time:
            nowTime(),

          items:
            cart.map(
              (
                item
              ) => ({

                productId:
                  item.product.id,

                productCode:
                  item.product.code,

                productName:
                  item.product.name,

                quantity:
                  numberValue(
                    item.quantity
                  ),

                unitPrice:
                  numberValue(
                    item.unitPrice
                  ),

                vat:
                  getProductVat(
                    item.product
                  ),

                lineTotal:
                  getLineTotal(
                    item
                  ),

              })
            ),

          subtotal:
            Number(
              subtotal.toFixed(
                2
              )
            ),

          totalVat:
            Number(
              totalVat.toFixed(
                2
              )
            ),

          total:
            Number(
              total.toFixed(
                2
              )
            ),

          paymentType,

          payments: {

            cash:
              Number(
                (
                  paymentType ===
                    "cash"
                    ? effectiveCash
                    : paymentType ===
                      "split"
                    ? cash
                    : 0
                ).toFixed(
                  2
                )
              ),

            card:
              Number(
                (
                  paymentType ===
                    "card"
                    ? effectiveCard
                    : paymentType ===
                      "split"
                    ? card
                    : 0
                ).toFixed(
                  2
                )
              ),

            credit:
              Number(
                finalCreditAmount.toFixed(
                  2
                )
              ),

          },

          customerId:
            customer?.id ||
            null,

          customerName:
            customer?.name ||
            null,

          createdAt:
            new Date().toISOString(),

        };


        writeQuickSales([
          saleRecord,
          ...quickSales,
        ]);

        setQuickSalesHistory([
          saleRecord,
          ...quickSales,
        ]);


        /*
         * EVENTLER
         */

        window.dispatchEvent(
          new Event(
            "ren-products-changed"
          )
        );

        window.dispatchEvent(
          new Event(
            "ren-stock-updated"
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

        window.dispatchEvent(
          new Event(
            "ren-customer-movements-updated"
          )
        );


        /*
         * TEMİZLE
         */

        setCart([]);

        setCashAmount("");

        setCardAmount("");

        setCreditAmount("");

        setSelectedCustomerId("");

        setSelectedAccountId("");


        setSaleMessage(
          `${saleNumber} başarıyla tamamlandı. Toplam ${money(
            total
          )} TL`
        );


        setProducts(
          getProducts() || []
        );

        setAccounts(
          readAccounts()
        );

        setCustomers(
          getCustomers() || []
        );


      } catch (
        error
      ) {

        console.error(
          "Hızlı satış hatası:",
          error
        );


        setSaleMessage(
          error?.message ||
          "Satış tamamlanamadı."
        );

      } finally {

        setSaving(
          false
        );

      }

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="quick-sale-page">


      {/* HEADER */}

      <div className="quick-sale-header">

        <div>

          <div className="quick-sale-breadcrumb">

            Satış

            <span>
              ›
            </span>

            <strong>
              Hızlı Satış
            </strong>

          </div>


          <h1>
            Hızlı Satış
          </h1>


          <p>
            Barkod okutun veya ürün arayın,
            satışınızı hızlıca oluşturun.
          </p>

        </div>

      </div>


      {/* HIZLI SATIŞ GEÇMİŞİ */}

      <section
        style={{
          marginBottom:
            "16px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowQuickSalesHistory(
              (value) =>
                !value
            )
          }
          style={{
            display:
              "inline-flex",
            alignItems:
              "center",
            gap:
              "8px",
            padding:
              "10px 14px",
            border:
              "1px solid #dfe3e7",
            borderRadius:
              "7px",
            background:
              "var(--qs-inline-surface)",
            color:
              "#3f474d",
            cursor:
              "pointer",
            fontSize:
              "12px",
            fontWeight:
              700,
          }}
        >
          Son Hızlı Satışlar
          <span>
            ({quickSalesHistory.length})
          </span>
        </button>

        {showQuickSalesHistory && (
          <div
            style={{
              marginTop:
                "10px",
              padding:
                "12px",
              border:
                "1px solid #e3e7ea",
              borderRadius:
                "8px",
              background:
                "var(--qs-inline-surface)",
              maxHeight:
                "280px",
              overflowY:
                "auto",
            }}
          >
            {quickSalesHistory.length === 0 ? (
              <div
                style={{
                  padding:
                    "12px",
                  color:
                    "#858d94",
                  fontSize:
                    "12px",
                }}
              >
                Henüz hızlı satış kaydı bulunmuyor.
              </div>
            ) : (
              quickSalesHistory
                .slice(
                  0,
                  12
                )
                .map(
                  (
                    sale
                  ) => (
                    <div
                      key={
                        sale.id
                      }
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap:
                          "12px",
                        padding:
                          "10px 4px",
                        borderBottom:
                          "1px solid #eef0f2",
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            display:
                              "block",
                            color:
                              "#384047",
                            fontSize:
                              "12px",
                          }}
                        >
                          {sale.number ||
                            sale.id}
                        </strong>

                        <span
                          style={{
                            display:
                              "block",
                            marginTop:
                              "3px",
                            color:
                              "#838b91",
                            fontSize:
                              "11px",
                          }}
                        >
                          {sale.customerName ||
                            "Hızlı Satış"}{" "}
                          · ₺
                          {money(
                            sale.total
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteQuickSale(
                            sale
                          )
                        }
                        style={{
                          flexShrink:
                            0,
                          padding:
                            "7px 10px",
                          border:
                            "1px solid #efb7bd",
                          borderRadius:
                            "6px",
                          background:
                            "#fff5f6",
                          color:
                            "#d95767",
                          cursor:
                            "pointer",
                          fontSize:
                            "11px",
                          fontWeight:
                            700,
                        }}
                      >
                        SİL
                      </button>
                    </div>
                  )
                )
            )}
          </div>
        )}
      </section>


      {/* MESAJ */}

      {
        saleMessage && (

          <div
            style={{
              whiteSpace:
                "pre-line",

              marginBottom:
                "16px",

              padding:
                "12px 15px",

              border:
                "1px solid #dfe3e7",

              borderRadius:
                "8px",

              background:
                  "var(--qs-inline-surface)",

              color:
                "#4f575e",

              fontSize:
                "13px",

            }}
          >

            {
              saleMessage
            }

          </div>

        )
      }


      <div className="quick-sale-layout">


        {/* =================================================
            ÜRÜNLER
        ================================================= */}

        <section className="quick-sale-products">

          <div className="quick-sale-search">

            <MdBarcodeReader />


            <input
              autoFocus
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={
                handleBarcodeKeyDown
              }
              placeholder="Barkod okutun veya ürün adı / kodu arayın..."
            />


            <MdSearch />

          </div>


          <div className="quick-sale-product-grid">

            {
              availableProducts.length ===
              0 ? (

                <div className="quick-sale-empty">

                  Ürün bulunamadı.

                </div>

              ) : (

                availableProducts.map(
                  (
                    product
                  ) => {

                    const price =
                      getProductGrossSalePrice(
                        product
                      );


                    const vat =
                      getProductVat(
                        product
                      );


                    return (

                      <button
                        type="button"
                        key={
                          product.id
                        }
                        className="quick-sale-product-card"
                        onClick={() =>
                          addToCart(
                            product
                          )
                        }
                      >

                        <div className="quick-sale-product-top">

                          <span className="quick-sale-product-code">

                            {
                              product.code ||
                              "—"
                            }

                          </span>


                          <MdAdd />

                        </div>


                        <strong>

                          {
                            product.name ||
                            "İsimsiz Ürün"
                          }

                        </strong>


                        <small>

                          Stok:

                          {" "}

                          {
                            numberValue(
                              product.stock
                            )
                          }

                          {" "}

                          {
                            product.unit ||
                            "Adet"
                          }

                        </small>


                        <div className="quick-sale-product-price">

                          <strong>

                            ₺

                            {
                              money(
                                price
                              )
                            }

                          </strong>


                          <span>

                            KDV dahil

                            {" "}

                            %{
                              vat
                            }

                          </span>

                        </div>

                      </button>

                    );

                  }
                )

              )
            }

          </div>

        </section>


        {/* =================================================
            SEPET
        ================================================= */}

        <aside className="quick-sale-cart">


          <div className="quick-sale-cart-header">

            <div>

              <h2>

                <MdShoppingCart />

                Sepet

              </h2>


              <span>

                {
                  totalQuantity
                }

                {" "}
                ürün

              </span>

            </div>


            {
              cart.length >
              0 && (

                <button
                  type="button"
                  onClick={
                    clearCart
                  }
                >
                  Temizle
                </button>

              )
            }

          </div>


          <div className="quick-sale-cart-body">

            {
              cart.length ===
              0 ? (

                <div className="quick-sale-cart-empty">

                  <MdShoppingCart />

                  <strong>
                    Sepet boş
                  </strong>

                  <span>
                    Satmak istediğiniz ürüne
                    tıklayın veya barkod okutun.
                  </span>

                </div>

              ) : (

                cart.map(
                  (
                    item
                  ) => {

                    const lineTotal =
                      getLineTotal(
                        item
                      );


                    const lineVat =
                      getLineVat(
                        item
                      );


                    const lineNet =
                      lineTotal -
                      lineVat;


                    const vatRate =
                      getProductVat(
                        item.product
                      );


                    return (

                      <div
                        className="quick-sale-cart-item"
                        key={
                          item.product.id
                        }
                      >

                        <div className="quick-sale-cart-item-info">

                          <strong>
                            {
                              item.product.name
                            }
                          </strong>


                          <small>

                            {
                              item.product.code
                            }

                            {" · KDV %"}

                            {
                              vatRate
                            }

                          </small>

                        </div>


                        {/* MANUEL FİYAT */}

                        <div
                          style={{
                            margin:
                              "8px 0",
                          }}
                        >

                          <label
                            style={{
                              display:
                                "block",
                              fontSize:
                                "11px",
                              color:
                                "#8a9298",
                              marginBottom:
                                "4px",
                            }}
                          >
                            Birim Fiyat
                          </label>


                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              border:
                                "1px solid #dfe3e6",
                              borderRadius:
                                "6px",
                              overflow:
                                "hidden",
                              background:
                  "var(--qs-inline-surface)",
                            }}
                          >

                            <span
                              style={{
                                padding:
                                  "0 8px",
                                color:
                                  "#707980",
                              }}
                            >
                              ₺
                            </span>


                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.unitPrice
                              }
                              onChange={(event) =>
                                changeUnitPrice(
                                  item.product.id,
                                  event.target.value
                                )
                              }
                              style={{
                                width:
                                  "100%",
                                border:
                                  0,
                                outline:
                                  0,
                                padding:
                                  "8px",
                                fontSize:
                                  "13px",
                              }}
                            />

                          </div>

                        </div>


                        {/* MİKTAR */}

                        <div className="quick-sale-cart-item-actions">

                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(
                                item.product.id,
                                -1
                              )
                            }
                          >
                            <MdRemove />
                          </button>


                          <strong>
                            {
                              item.quantity
                            }
                          </strong>


                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(
                                item.product.id,
                                1
                              )
                            }
                          >
                            <MdAdd />
                          </button>


                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              removeFromCart(
                                item.product.id
                              )
                            }
                          >
                            <MdDelete />
                          </button>

                        </div>


                        <div
                          style={{
                            marginTop:
                              "7px",
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            fontSize:
                              "12px",
                            color:
                              "#80888e",
                          }}
                        >

                          <span>
                            KDV hariç
                          </span>


                          <strong>

                            ₺

                            {
                              money(
                                lineNet
                              )
                            }

                          </strong>

                        </div>


                        <strong className="quick-sale-cart-item-total">

                          ₺

                          {
                            money(
                              lineTotal
                            )
                          }

                        </strong>

                      </div>

                    );

                  }
                )

              )
            }

          </div>


          {/* =================================================
              ÖDEME
          ================================================= */}

          <div
            style={{
              padding:
                "18px",

              borderTop:
                "1px solid #eceeef",
            }}
          >

            <strong
              style={{
                display:
                  "block",

                marginBottom:
                  "10px",

                color:
                  "#3d4449",
              }}
            >
              Ödeme Yöntemi
            </strong>


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(4,1fr)",

                gap:
                  "6px",

                marginBottom:
                  "12px",
              }}
            >

              {
                [
                  [
                    "cash",
                    "Nakit",
                  ],
                  [
                    "card",
                    "Kredi Kartı",
                  ],
                  [
                    "credit",
                    "Veresiye",
                  ],
                  [
                    "split",
                    "Parçalı",
                  ],
                ].map(
                  (
                    item
                  ) => (

                    <button
                      key={
                        item[0]
                      }
                      type="button"
                      onClick={() =>
                        selectPaymentType(
                          item[0]
                        )
                      }
                      style={{
                        padding:
                          "9px 6px",

                        border:
                          paymentType ===
                          item[0]
                            ? "2px solid #57514d"
                            : "1px solid #dfe3e7",

                        borderRadius:
                          "6px",

                        background:
                          paymentType ===
                          item[0]
                            ? "var(--qs-payment-active)"
                            : "#fff",

                        cursor:
                          "pointer",

                        fontSize:
                          "11px",

                        fontWeight:
                          paymentType ===
                          item[0]
                            ? 700
                            : 500,
                      }}
                    >

                      {
                        item[1]
                      }

                    </button>

                  )
                )
              }

            </div>


            {/* NAKİT */}

            {
              paymentType ===
                "cash" && (

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      color:
                        "#7d858c",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Kasa
                  </label>


                  <select
                    value={
                      selectedAccountId
                    }
                    onChange={(event) =>
                      setSelectedAccountId(
                        event.target.value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      marginBottom:
                        "8px",
                    }}
                  >

                    <option value="">
                      Kasa seçin
                    </option>


                    {
                      cashAccounts.map(
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

                          </option>

                        )
                      )
                    }

                  </select>


                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      cashAmount
                    }
                    onChange={(event) =>
                      setCashAmount(
                        event.target.value
                      )
                    }
                    placeholder={
                      `Boş = ${money(
                        total
                      )} TL`
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      boxSizing:
                        "border-box",
                    }}
                  />


                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        "#90979d",
                      fontSize:
                        "10px",
                    }}
                  >
                    Daha düşük tutar girerseniz kalan
                    otomatik cariye veresiye işlenir.
                  </small>

                </div>

              )
            }


            {/* KART */}

            {
              paymentType ===
                "card" && (

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      color:
                        "#7d858c",
                      marginBottom:
                        "5px",
                    }}
                  >
                    POS / Banka
                  </label>


                  <select
                    value={
                      selectedAccountId
                    }
                    onChange={(event) =>
                      setSelectedAccountId(
                        event.target.value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      marginBottom:
                        "8px",
                    }}
                  >

                    <option value="">
                      POS hesabı seçin
                    </option>


                    {
                      cardAccounts.map(
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


                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      cardAmount
                    }
                    onChange={(event) =>
                      setCardAmount(
                        event.target.value
                      )
                    }
                    placeholder={
                      `Boş = ${money(
                        total
                      )} TL`
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      boxSizing:
                        "border-box",
                    }}
                  />


                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        "#90979d",
                      fontSize:
                        "10px",
                    }}
                  >
                    Daha düşük tutar girerseniz kalan
                    otomatik cariye veresiye işlenir.
                  </small>

                </div>

              )
            }


            {/* VERESİYE */}

            {
              paymentType ===
                "credit" && (

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      color:
                        "#7d858c",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Müşteri / Cari
                  </label>


                  <select
                    value={
                      selectedCustomerId
                    }
                    onChange={(event) =>
                      setSelectedCustomerId(
                        event.target.value
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      marginBottom:
                        "8px",
                    }}
                  >

                    <option value="">
                      Müşteri seçin
                    </option>


                    {
                      customerAccounts.map(
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
                              customer.name
                            }

                            {" — "}

                            {
                              customer.code
                            }

                          </option>

                        )
                      )
                    }

                  </select>


                  <button
                    type="button"
                    onClick={() => {

                      setNewCustomerCode(
                        getNextCustomerCode()
                      );

                      setShowNewCustomer(
                        true
                      );

                    }}
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      marginBottom:
                        "8px",
                      border:
                        "1px solid #dfe3e7",
                      background:
                  "var(--qs-inline-surface)",
                      borderRadius:
                        "6px",
                      cursor:
                        "pointer",
                    }}
                  >
                    + Yeni Cari Oluştur
                  </button>


                  <div
                    style={{
                      padding:
                        "9px",

                      background:
                  "var(--qs-success-soft)",

                      borderRadius:
                        "6px",

                      color:
                        "var(--qs-success-text)",

                      fontSize:
                        "11px",
                    }}
                  >

                    Bu satışta ödeme alınmaz.
                    Tamamı seçilen cariye borç yazılır.

                  </div>

                </div>

              )
            }


            {/* PARÇALI */}

            {
              paymentType ===
                "split" && (

                <div>

                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      color:
                        "#7d858c",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Nakit
                  </label>


                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      cashAmount
                    }
                    onChange={(event) =>
                      setCashAmount(
                        event.target.value
                      )
                    }
                    placeholder="0,00"
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      boxSizing:
                        "border-box",
                      marginBottom:
                        "8px",
                    }}
                  />


                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      color:
                        "#7d858c",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Kredi Kartı
                  </label>


                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      cardAmount
                    }
                    onChange={(event) =>
                      setCardAmount(
                        event.target.value
                      )
                    }
                    placeholder="0,00"
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      boxSizing:
                        "border-box",
                      marginBottom:
                        "8px",
                    }}
                  />


                  <label
                    style={{
                      display:
                        "block",
                      fontSize:
                        "11px",
                      color:
                        "#7d858c",
                      marginBottom:
                        "5px",
                    }}
                  >
                    Veresiye
                  </label>


                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      creditAmount
                    }
                    onChange={(event) =>
                      setCreditAmount(
                        event.target.value
                      )
                    }
                    placeholder="0,00"
                    style={{
                      width:
                        "100%",
                      padding:
                        "9px",
                      boxSizing:
                        "border-box",
                      marginBottom:
                        "8px",
                    }}
                  />


                  {
                    finalCreditAmount >
                      0.01 && (

                      <>

                        <select
                          value={
                            selectedCustomerId
                          }
                          onChange={(event) =>
                            setSelectedCustomerId(
                              event.target.value
                            )
                          }
                          style={{
                            width:
                              "100%",
                            padding:
                              "9px",
                            marginBottom:
                              "8px",
                          }}
                        >

                          <option value="">
                            Kalan veresiye için cari seçin
                          </option>


                          {
                            customerAccounts.map(
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
                                    customer.name
                                  }

                                  {" — "}

                                  {
                                    customer.code
                                  }

                                </option>

                              )
                            )
                          }

                        </select>


                        <button
                          type="button"
                          onClick={() => {

                            setNewCustomerCode(
                              getNextCustomerCode()
                            );

                            setShowNewCustomer(
                              true
                            );

                          }}
                          style={{
                            width:
                              "100%",
                            padding:
                              "9px",
                            border:
                              "1px solid #dfe3e7",
                            background:
                  "var(--qs-inline-surface)",
                            borderRadius:
                              "6px",
                            cursor:
                              "pointer",
                            marginBottom:
                              "8px",
                          }}
                        >
                          + Yeni Cari Oluştur
                        </button>

                      </>

                    )
                  }


                </div>

              )
            }


            {/* ÖDEME ÖZETİ */}

            <div
              style={{
                marginTop:
                  "12px",

                padding:
                  "11px",

                borderRadius:
                  "7px",

                background:
                  "var(--qs-success-soft)",

                color:
                  "var(--qs-success-text)",

                fontSize:
                  "12px",

              }}
            >

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                }}
              >

                <span>
                  Ödenen
                </span>


                <strong>
                  ₺
                  {
                    money(
                      paidTotal
                    )
                  }
                </strong>

              </div>


              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginTop:
                    "5px",
                }}
              >

                <span>
                  Kalan / Veresiye
                </span>


                <strong
                  style={{
                    color:
                      "var(--qs-success-text)",
                  }}
                >
                  ₺
                  {
                    money(
                      remaining
                    )
                  }
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              TOPLAMLAR
          ================================================= */}

          <div className="quick-sale-cart-footer">

            <div>

              <span>
                Ara Toplam
              </span>


              <strong>
                ₺
                {
                  money(
                    subtotal
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
                    totalVat
                  )
                }
              </strong>

            </div>


            <div className="quick-sale-total">

              <span>
                GENEL TOPLAM
              </span>


              <strong>
                ₺
                {
                  money(
                    total
                  )
                }
              </strong>

            </div>


            <button
              type="button"
              className="quick-sale-complete"
              disabled={
                saving ||
                cart.length ===
                  0
              }
              onClick={
                handleCompleteSale
              }
            >

              {
                saving
                  ? "İŞLENİYOR..."
                  : "SATIŞI TAMAMLA"
              }

            </button>

          </div>

        </aside>

      </div>


      {/* =================================================
          YENİ CARİ
      ================================================= */}

      {
        showNewCustomer && (

          <div
            style={{
              position:
                "fixed",

              inset:
                0,

              background:
                  "rgba(20,25,30,.38)",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              zIndex:
                9999,

              padding:
                "20px",
            }}
          >

            <div
              style={{
                width:
                  "100%",

                maxWidth:
                  "420px",

                background:
                  "var(--qs-inline-surface)",

                borderRadius:
                  "10px",

                boxShadow:
                  "0 18px 50px rgba(0,0,0,.18)",

                overflow:
                  "hidden",
              }}
            >

              <div
                style={{
                  padding:
                    "18px",

                  borderBottom:
                    "1px solid #eceeef",
                }}
              >

                <strong>
                  Yeni Müşteri
                </strong>


                <div
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#858d94",
                    marginTop:
                      "4px",
                  }}
                >
                  Veresiye satış için yeni cari oluştur
                </div>

              </div>


              <div
                style={{
                  padding:
                    "18px",
                }}
              >

                <label
                  style={{
                    display:
                      "block",
                    fontSize:
                      "11px",
                    color:
                      "#7c858c",
                    marginBottom:
                      "5px",
                  }}
                >
                  Cari Kodu
                </label>


                <input
                  value={
                    newCustomerCode
                  }
                  readOnly
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "9px",
                    marginBottom:
                      "12px",
                    background:
                  "var(--qs-input-muted)",
                    border:
                      "1px solid #e0e3e6",
                    borderRadius:
                      "6px",
                  }}
                />


                <label
                  style={{
                    display:
                      "block",
                    fontSize:
                      "11px",
                    color:
                      "#7c858c",
                    marginBottom:
                      "5px",
                  }}
                >
                  Müşteri Adı / Ünvan
                </label>


                <input
                  autoFocus
                  value={
                    newCustomerName
                  }
                  onChange={(event) =>
                    setNewCustomerName(
                      event.target.value
                    )
                  }
                  placeholder="Firma veya kişi adı"
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "9px",
                    marginBottom:
                      "12px",
                    border:
                      "1px solid #dfe3e7",
                    borderRadius:
                      "6px",
                  }}
                />


                <label
                  style={{
                    display:
                      "block",
                    fontSize:
                      "11px",
                    color:
                      "#7c858c",
                    marginBottom:
                      "5px",
                  }}
                >
                  Telefon
                </label>


                <input
                  value={
                    newCustomerPhone
                  }
                  onChange={(event) =>
                    setNewCustomerPhone(
                      event.target.value
                    )
                  }
                  placeholder="05XX XXX XX XX"
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                    padding:
                      "9px",
                    border:
                      "1px solid #dfe3e7",
                    borderRadius:
                      "6px",
                  }}
                />

              </div>


              <div
                style={{
                  padding:
                    "14px 18px",

                  borderTop:
                    "1px solid #eceeef",

                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "8px",
                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    setShowNewCustomer(
                      false
                    )
                  }
                  style={{
                    padding:
                      "9px 15px",
                    border:
                      "1px solid #dfe3e7",
                    background:
                  "var(--qs-inline-surface)",
                    borderRadius:
                      "6px",
                    cursor:
                      "pointer",
                  }}
                >
                  Vazgeç
                </button>


                <button
                  type="button"
                  onClick={
                    createQuickCustomer
                  }
                  style={{
                    padding:
                      "9px 15px",
                    border:
                      "0",
                    background:
                  "var(--qs-primary-action)",
                    color:
                      "#fff",
                    borderRadius:
                      "6px",
                    cursor:
                      "pointer",
                    fontWeight:
                      700,
                  }}
                >
                  Cariyi Oluştur
                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

}