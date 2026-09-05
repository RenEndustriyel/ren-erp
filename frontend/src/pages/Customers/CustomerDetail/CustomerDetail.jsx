import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  getCustomerById,
  getCustomers,
  updateCustomerBalance,
} from "../../../lib/customerStore";

import {
  getCustomerMovementsByCustomerId,
} from "../../../lib/movementStore";

import {
  getInvoices,
} from "../../../lib/invoiceStore";

import "./CustomerDetail.css";


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
    return Number.isFinite(value)
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
    Math.abs(
      numberValue(value)
    )
  );
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const text =
    String(value);

  const date =
    new Date(
      text.includes("T")
        ? text
        : `${text}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(
    date
  );
}


function getCustomerName(
  customer
) {
  return (
    customer?.name ||
    customer?.title ||
    customer?.companyName ||
    customer?.unvan ||
    "Cari"
  );
}


function isSalesInvoice(
  invoice
) {
  const type =
    String(
      invoice?.type ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  return (
    type === "sales" ||
    type === "sale" ||
    type === "satış" ||
    type === "satis"
  );
}


function isPurchaseInvoice(
  invoice
) {
  const type =
    String(
      invoice?.type ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  return (
    type === "purchase" ||
    type === "purchases" ||
    type === "alış" ||
    type === "alis"
  );
}


const collectionStorageKey =
  "ren-erp-collections";

const accountStorageKey =
  "ren-erp-cash-bank-accounts";

const movementStorageKey =
  "ren-erp-cash-bank-movements";

const paymentMethods = [
  "Nakit",
  "Kredi Kartı",
  "Havale / EFT",
  "Çek",
  "Diğer",
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("REN ERP veri okunamadı:", error);
    return [];
  }
}

function createCollectionDocumentNumber(collections) {
  const year = new Date().getFullYear();
  const numbers = collections
    .map((item) => {
      const match = String(item?.document || "").match(/THS-\d{4}-(\d+)/);
      return match ? Number(match[1]) : 0;
    })
    .filter(Boolean);
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `THS-${year}-${String(next).padStart(4, "0")}`;
}


/* =========================================================
   HAREKETİ NORMALLEŞTİR
========================================================= */

function normalizeMovement(
  movement
) {
  const type =
    String(
      movement?.type ||
      ""
    ).trim();

  let debt =
    numberValue(
      movement?.debt
    );

  let credit =
    numberValue(
      movement?.credit
    );


  if (
    type === "Satış"
  ) {
    if (
      debt <= 0 &&
      credit > 0
    ) {
      debt =
        credit;
    }

    credit = 0;
  }


  if (
    type === "Tahsilat"
  ) {
    if (
      credit <= 0 &&
      debt > 0
    ) {
      credit =
        debt;
    }

    debt = 0;
  }


  return {
    ...movement,
    debt,
    credit,
  };
}


/* =========================================================
   COMPONENT
========================================================= */

export default function CustomerDetail() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    searchParams,
  ] = useSearchParams();


  const customerId =
    searchParams.get(
      "id"
    ) ||
    location.state?.customer?.id ||
    "";


  const [
    customer,
    setCustomer,
  ] = useState(
    location.state?.customer ||
    null
  );


  const [
    movements,
    setMovements,
  ] = useState([]);


  const [
    invoices,
    setInvoices,
  ] = useState([]);


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "overview"
  );


  const [
    invoiceFilter,
    setInvoiceFilter,
  ] = useState(
    "Açık"
  );


  const [
    activeMenu,
    setActiveMenu,
  ] = useState(null);


  const [
    showCollection,
    setShowCollection,
  ] = useState(false);

  const [
    collectionForm,
    setCollectionForm,
  ] = useState({
    date: today(),
    amount: "",
    method: "Nakit",
    accountId: "",
    description: "",
  });


  /* =======================================================
     VERİLERİ YENİLE
  ======================================================= */

  const refreshData =
    () => {

      if (!customerId) {
        return;
      }


      const freshCustomer =
        getCustomerById(
          customerId
        );


      if (freshCustomer) {
        setCustomer(
          freshCustomer
        );
      }


      const freshMovements =
        getCustomerMovementsByCustomerId(
          customerId
        ) || [];


      setMovements(
        Array.isArray(
          freshMovements
        )
          ? freshMovements
          : []
      );


      const allInvoices =
        getInvoices() || [];


      setInvoices(
        allInvoices.filter(
          (invoice) =>
            String(
              invoice?.customerId ||
              invoice?.supplierId ||
              ""
            ) ===
            String(
              customerId
            )
        )
      );

    };


  useEffect(() => {

    refreshData();


    const events = [
      "ren-customers-updated",
      "ren-customer-movements-updated",
      "ren-invoices-updated",
      "ren-cash-bank-updated",
      "ren-finance-updated",
    ];


    const refresh =
      () => {
        refreshData();
      };


    events.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          refresh
        );
      }
    );


    return () => {

      events.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            refresh
          );
        }
      );

    };

  }, [
    customerId,
  ]);


  useEffect(() => {
    if (!showCollection) return;
    const accounts = getStoredArray(accountStorageKey);
    if (!collectionForm.accountId && accounts.length) {
      setCollectionForm((prev) => ({
        ...prev,
        accountId: accounts[0].id,
      }));
    }
  }, [showCollection, collectionForm.accountId]);


  /* =======================================================
     HAREKETLER
  ======================================================= */

  const normalizedMovements =
    useMemo(() => {

      return (
        movements || []
      )
        .map(
          normalizeMovement
        )
        .sort(
          (
            a,
            b
          ) => {

            const dateA =
              new Date(
                String(
                  a.date ||
                  ""
                ).includes("T")
                  ? a.date
                  : `${a.date || "1900-01-01"}T00:00:00`
              );


            const dateB =
              new Date(
                String(
                  b.date ||
                  ""
                ).includes("T")
                  ? b.date
                  : `${b.date || "1900-01-01"}T00:00:00`
              );


            const timeA =
              Number.isNaN(
                dateA.getTime()
              )
                ? 0
                : dateA.getTime();


            const timeB =
              Number.isNaN(
                dateB.getTime()
              )
                ? 0
                : dateB.getTime();


            if (
              timeA !==
              timeB
            ) {
              return (
                timeA -
                timeB
              );
            }


            return String(
              a.createdAt ||
              ""
            ).localeCompare(
              String(
                b.createdAt ||
                ""
              )
            );

          }
        );

    }, [
      movements,
    ]);



  /* =======================================================
     CARİ TÜRÜ
  ======================================================= */

  const customerType =
    String(
      customer?.type ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );


  const isSupplier =
    customerType ===
      "tedarikçi" ||
    customerType ===
      "tedarikci";


  /* =======================================================
     CARİ HESAPLARI
  ======================================================= */

  const movementTotals =
    useMemo(() => {

      let debt =
        0;

      let credit =
        0;

      let collection =
        0;

      let payment =
        0;


      normalizedMovements.forEach(
        (movement) => {

          const movementDebt =
            numberValue(
              movement.debt
            );

          const movementCredit =
            numberValue(
              movement.credit
            );


          debt +=
            movementDebt;

          credit +=
            movementCredit;


          if (
            movement.type ===
            "Tahsilat"
          ) {

            collection +=
              Math.max(
                movementCredit,
                numberValue(
                  movement.amount
                ),
                movementDebt
              );

          }


          if (
            movement.type ===
            "Ödeme"
          ) {

            payment +=
              Math.max(
                movementCredit,
                numberValue(
                  movement.amount
                ),
                movementDebt
              );

          }

        }
      );


      return {
        debt,
        credit,
        collection,
        payment,
        balance:
          Math.max(
            0,
            debt -
              credit
          ),
      };

    }, [
      normalizedMovements,
    ]);


  /* =======================================================
     FATURALAR
  ======================================================= */

  const invoiceSummary =
    useMemo(() => {

      let salesTotal =
        0;

      let purchaseTotal =
        0;

      let openSales =
        0;

      let openSalesCount =
        0;

      let totalPaid =
        0;


      invoices.forEach(
        (invoice) => {

          const total =
            numberValue(
              invoice.total
            );


          const paid =
            numberValue(
              invoice.paidAmount
            );


          const remaining =
            Math.max(
              0,
              total -
                paid
            );


          if (
            isSalesInvoice(
              invoice
            )
          ) {

            salesTotal +=
              total;


            totalPaid +=
              paid;


            if (
              remaining >
              0.005
            ) {

              openSales +=
                remaining;

              openSalesCount +=
                1;

            }

          }


          if (
            isPurchaseInvoice(
              invoice
            )
          ) {

            purchaseTotal +=
              total;

          }

        }
      );


      return {
        salesTotal,
        purchaseTotal,
        openSales,
        openSalesCount,
        totalPaid,
      };

    }, [
      invoices,
    ]);


  /* =======================================================
     MÜŞTERİDE GÖSTERİLECEK TAHSİLAT
  ======================================================= */

  const customerReceivable =
    Math.max(
      invoiceSummary.openSales,
      movementTotals.balance
    );


  /* =======================================================
     AÇIK FATURALAR
  ======================================================= */

  const openInvoices =
    useMemo(() => {

      return invoices
        .map(
          (invoice) => {

            const total =
              numberValue(
                invoice.total
              );

            const paid =
              numberValue(
                invoice.paidAmount
              );

            const remaining =
              Math.max(
                0,
                total -
                  paid
              );

            return {
              ...invoice,
              remaining,
            };

          }
        )
        .filter(
          (invoice) => {

            if (
              !isSalesInvoice(
                invoice
              )
            ) {
              return false;
            }


            if (
              invoiceFilter ===
              "Açık"
            ) {

              return (
                invoice.remaining >
                0.005
              );

            }


            if (
              invoiceFilter ===
              "Kapalı"
            ) {

              return (
                invoice.remaining <=
                0.005
              );

            }


            return true;

          }
        )
        .sort(
          (
            a,
            b
          ) => {

            const dateA =
              new Date(
                String(
                  a.date ||
                  ""
                ).includes("T")
                  ? a.date
                  : `${a.date || "1900-01-01"}T00:00:00`
              );


            const dateB =
              new Date(
                String(
                  b.date ||
                  ""
                ).includes("T")
                  ? b.date
                  : `${b.date || "1900-01-01"}T00:00:00`
              );


            const aTime =
              Number.isNaN(
                dateA.getTime()
              )
                ? 0
                : dateA.getTime();


            const bTime =
              Number.isNaN(
                dateB.getTime()
              )
                ? 0
                : dateB.getTime();


            return (
              aTime -
              bTime
            );

          }
        );

    }, [
      invoices,
      invoiceFilter,
    ]);




  /* =======================================================
     CARİ YOK
  ======================================================= */

  if (!customer) {

    return (
      <div className="customer-detail-page">

        <div className="customer-detail-container">

          <div
            className="customer-detail-card customer-detail-full-card"
            style={{
              padding: "40px",
            }}
          >

            <h2>
              Cari bulunamadı
            </h2>

            <p>
              Görüntülemek istediğiniz cari kayıt bulunamadı.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/customers"
                )
              }
            >
              CARİ LİSTESİNE DÖN
            </button>

          </div>

        </div>

      </div>
    );

  }

  /* =======================================================
     SON HAREKETLER
  ======================================================= */

  const recentMovements =
    normalizedMovements
      .slice()
      .reverse()
      .slice(
        0,
        8
      );


  /* =======================================================
     DURUM
  ======================================================= */

  const isSettled =
    customerReceivable <=
    0.005;


  const statusLabel =
    isSettled
      ? "Bakiyesi Yok"
      : isSupplier
      ? "Borçlu"
      : "Alacaklı";


  const statusClass =
    isSettled
      ? "cari-status-zero"
      : isSupplier
      ? "cari-status-borclu"
      : "cari-status-alacakli";


  /* =======================================================
     BUTONLAR
  ======================================================= */

  const goBack =
    () => {
      navigate(
        "/customers"
      );
    };


  const editCustomer =
    () => {

      navigate(
        `/customers/edit/${encodeURIComponent(
          customer.id
        )}`,
        {
          state: {
            customer,
          },
        }
      );

    };


  const newSale =
    () => {

      navigate(
        `/invoices/new?type=sales&customerId=${encodeURIComponent(
          customer.id
        )}`,
        {
          state: {
            customer,
          },
        }
      );

    };


  const newPurchase =
    () => {

      navigate(
        `/invoices/new?type=purchase&customerId=${encodeURIComponent(
          customer.id
        )}`,
        {
          state: {
            customer,
          },
        }
      );

    };


  const saveDirectCollection =
    (event) => {

      event.preventDefault();

      const amount = numberValue(collectionForm.amount);

      if (!amount || amount <= 0) {
        alert("Lütfen geçerli bir tahsilat tutarı girin.");
        return;
      }

      if (!collectionForm.accountId) {
        alert("Lütfen kasa, banka veya POS hesabı seçin.");
        return;
      }

      const accounts = getStoredArray(accountStorageKey);
      const account = accounts.find(
        (item) => String(item.id) === String(collectionForm.accountId)
      );

      if (!account) {
        alert("Finans hesabı bulunamadı.");
        return;
      }

      const collections = getStoredArray(collectionStorageKey);
      const document = createCollectionDocumentNumber(collections);
      const newCollectionRecord = {
        id: Date.now(),
        document,
        customerId: customer.id,
        customerName: getCustomerName(customer),
        customerCode: customer.code || "",
        date: collectionForm.date,
        amount,
        method: collectionForm.method,
        accountId: account.id,
        account: account.name,
        accountType: account.type,
        description:
          collectionForm.description.trim() ||
          `${collectionForm.method} tahsilat`,
        source: "collection",
        createdAt: new Date().toISOString(),
      };

      const updatedCollections = [newCollectionRecord, ...collections];

      const updatedAccounts = accounts.map((item) =>
        String(item.id) === String(account.id)
          ? { ...item, balance: numberValue(item.balance) + amount }
          : item
      );

      const movements = getStoredArray(movementStorageKey);
      const newMovement = {
        id: `THS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        direction: "Giriş",
        amount,
        description: `${document} - ${getCustomerName(customer)} tahsilatı`,
        date: collectionForm.date,
        method: collectionForm.method,
        source: "collection",
        sourceId: newCollectionRecord.id,
        sourceDocument: document,
        customerId: customer.id,
        customerName: getCustomerName(customer),
        createdAt: new Date().toISOString(),
      };

      updateCustomerBalance(customer.id, amount);

      localStorage.setItem(
        collectionStorageKey,
        JSON.stringify(updatedCollections)
      );
      localStorage.setItem(
        accountStorageKey,
        JSON.stringify(updatedAccounts)
      );
      localStorage.setItem(
        movementStorageKey,
        JSON.stringify([newMovement, ...movements])
      );

      [
        "ren-customers-updated",
        "ren-customer-movements-updated",
        "ren-collections-updated",
        "ren-cash-bank-updated",
        "ren-finance-updated",
      ].forEach((name) => window.dispatchEvent(new Event(name)));

      setCustomer(getCustomerById(customer.id) || customer);
      setCollectionForm({
        date: today(),
        amount: "",
        method: "Nakit",
        accountId: account.id,
        description: "",
      });
      setShowCollection(false);

      alert(`${document} numaralı tahsilat kaydedildi.`);

    };


  const newCollection =
    () => {

      const accounts = getStoredArray(
        accountStorageKey
      );

      setCollectionForm({
        date: today(),
        amount: "",
        method: "Nakit",
        accountId: accounts[0]?.id || "",
        description: "",
      });

      setShowCollection(true);

    };


  const newPayment =
    () => {

      navigate(
        "/customers/payments",
        {
          state: {
            customer,
          },
        }
      );

    };


  const openInvoice =
    (invoice) => {

      navigate(
        `/invoices/detail?id=${encodeURIComponent(
          invoice.id
        )}`
      );

    };


  const detailMovement =
    (movement) => {

      alert(
        `Hareket Detayı\n\n` +
        `Belge: ${
          movement.document ||
          "—"
        }\n` +
        `Tarih: ${
          formatDate(
            movement.date
          )
        }\n` +
        `İşlem: ${
          movement.type ||
          "—"
        }\n` +
        `Açıklama: ${
          movement.description ||
          "—"
        }\n` +
        `Borç: ${
          money(
            movement.debt
          )
        } TL\n` +
        `Alacak: ${
          money(
            movement.credit
          )
        } TL`
      );

      setActiveMenu(
        null
      );

    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div
      className="customer-detail-page"
      onClick={() =>
        setActiveMenu(
          null
        )
      }
      style={{
        background:
          "#f5f6f8",
        minHeight:
          "100vh",
      }}
    >

      <div
        className="customer-detail-container"
        style={{
          maxWidth:
            "1280px",
          margin:
            "0 auto",
        }}
      >


        {/* =================================================
            ÜST BAŞLIK
        ================================================= */}

        <div
          className="customer-detail-header"
          style={{
            background:
              "#fff",
            border:
              "1px solid #e1e5e9",
            borderRadius:
              "8px",
            padding:
              "20px 22px",
            marginBottom:
              "16px",
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              "20px",
          }}
        >

          <div
            className="customer-detail-heading"
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "14px",
            }}
          >

            <button
              type="button"
              className="customer-detail-back"
              onClick={
                goBack
              }
            >
              ←
            </button>


            <div>

              <div
                className="customer-detail-breadcrumb"
                style={{
                  fontSize:
                    "11px",
                  marginBottom:
                    "6px",
                  color:
                    "#9aa1a9",
                }}
              >

                Müşteriler

                <span
                  style={{
                    margin:
                      "0 7px",
                  }}
                >
                  ›
                </span>

                {
                  isSupplier
                    ? "Tedarikçi"
                    : "Müşteri"
                }

              </div>


              <div
                className="customer-detail-title-row"
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "12px",
                }}
              >

                <div
                  className="customer-detail-avatar"
                  style={{
                    width:
                      "46px",
                    height:
                      "46px",
                    minWidth:
                      "46px",
                    borderRadius:
                      "4px",
                    background:
                      "#f0f2f4",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    color:
                      "#8b939c",
                    fontSize:
                      "21px",
                    fontWeight:
                      700,
                  }}
                >
                  {
                    String(
                      getCustomerName(
                        customer
                      )
                    )
                      .charAt(
                        0
                      )
                      .toUpperCase()
                  }
                </div>


                <div>

                  <h1
                    style={{
                      margin:
                        0,
                      fontSize:
                        "24px",
                      color:
                        "#26303a",
                      lineHeight:
                        1.2,
                    }}
                  >
                    {
                      getCustomerName(
                        customer
                      )
                    }
                  </h1>


                  <div
                    className="customer-detail-meta"
                    style={{
                      marginTop:
                        "5px",
                      display:
                        "flex",
                      gap:
                        "8px",
                      alignItems:
                        "center",
                      fontSize:
                        "11px",
                      color:
                        "#929aa4",
                    }}
                  >

                    <span>
                      {
                        customer.code ||
                        "—"
                      }
                    </span>

                    <span>
                      •
                    </span>

                    <span>
                      {
                        isSupplier
                          ? "Tedarikçi"
                          : "Müşteri"
                      }
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>


          {/* ÜST BUTONLAR */}

          <div
            className="customer-detail-actions"
            style={{
              display:
                "flex",
              gap:
                "8px",
              alignItems:
                "center",
            }}
          >

            {
              isSupplier ? (

                <>
                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newPayment
                    }
                  >
                    Ödeme Ekle
                  </button>

                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newPurchase
                    }
                  >
                    Alış Faturası
                  </button>
                </>

              ) : (

                <>
                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newCollection
                    }
                  >
                    Tahsilat Ekle
                  </button>

                  <button
                    type="button"
                    className="customer-detail-secondary"
                    onClick={
                      newSale
                    }
                  >
                    Satış Faturası
                  </button>
                </>

              )
            }


            <button
              type="button"
              className="customer-detail-primary"
              onClick={
                editCustomer
              }
            >
              Düzenle
            </button>

          </div>

        </div>


        {/* =================================================
            ANA GÖVDE
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 300px",
            gap:
              "16px",
            alignItems:
              "start",
          }}
        >


          {/* =================================================
              SOL ANA ALAN
          ================================================= */}

          <div>


            {/* TABLAR */}

            <div
              className="customer-detail-tabs"
              style={{
                background:
                  "#fff",
                border:
                  "1px solid #e1e5e9",
                borderRadius:
                  "8px 8px 0 0",
                borderBottom:
                  "0",
                padding:
                  "0 8px",
              }}
            >

              <button
                type="button"
                className={
                  activeTab ===
                  "overview"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    "overview"
                  )
                }
              >
                Genel Bakış
              </button>

              <button
                type="button"
                className={
                  activeTab ===
                  "invoices"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    "invoices"
                  )
                }
              >
                Açık Faturalar
              </button>

              <button
                type="button"
                className={
                  activeTab ===
                  "movements"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    "movements"
                  )
                }
              >
                İşlem Geçmişi
              </button>

              <button
                type="button"
                className={
                  activeTab ===
                  "info"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    "info"
                  )
                }
              >
                Hesap Bilgileri
              </button>

            </div>


            {/* =================================================
                GENEL BAKIŞ
            ================================================= */}

            {
              activeTab ===
              "overview" && (

                <div>

                  {/* AÇIK FATURALAR */}

                  <div
                    className="customer-detail-card customer-detail-full-card"
                    style={{
                      borderRadius:
                        "0 0 8px 8px",
                      borderTop:
                        "0",
                      marginBottom:
                        "16px",
                    }}
                  >

                    <div
                      className="customer-detail-card-header"
                      style={{
                        alignItems:
                          "center",
                      }}
                    >

                      <div>

                        <strong>
                          Açık Faturalar
                        </strong>

                        <span>
                          Tahsil edilmesi gereken faturalar
                        </span>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            "invoices"
                          )
                        }
                      >
                        Tümünü Gör
                      </button>

                    </div>


                    {/* AÇIK FATURA LİSTESİ */}

                    <div>

                      {
                        openInvoices
                          .filter(
                            (invoice) =>
                              invoice.remaining >
                              0.005
                          )
                          .slice(
                            0,
                            8
                          )
                          .map(
                            (
                              invoice
                            ) => (

                              <div
                                key={
                                  invoice.id
                                }
                                style={{
                                  display:
                                    "grid",
                                  gridTemplateColumns:
                                    "32px minmax(0,1fr) 150px 130px",
                                  alignItems:
                                    "center",
                                  gap:
                                    "12px",
                                  minHeight:
                                    "62px",
                                  borderTop:
                                    "1px solid #f0f1f3",
                                  cursor:
                                    "pointer",
                                }}
                                onClick={() =>
                                  openInvoice(
                                    invoice
                                  )
                                }
                              >

                                <div
                                  style={{
                                    width:
                                      "28px",
                                    height:
                                      "28px",
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    border:
                                      "1px solid #dfe3e8",
                                    borderRadius:
                                      "3px",
                                    color:
                                      "#98a0a8",
                                    fontSize:
                                      "13px",
                                  }}
                                >
                                  ▤
                                </div>


                                <div>

                                  <strong
                                    style={{
                                      display:
                                        "block",
                                      color:
                                        "#38414b",
                                      fontSize:
                                        "12px",
                                    }}
                                  >
                                    {
                                      invoice.invoiceNo ||
                                      invoice.number ||
                                      "Satış Faturası"
                                    }
                                  </strong>

                                  <small
                                    style={{
                                      display:
                                        "block",
                                      color:
                                        "#9aa1a9",
                                      marginTop:
                                        "4px",
                                    }}
                                  >
                                    {
                                      formatDate(
                                        invoice.date
                                      )
                                    }
                                  </small>

                                </div>


                                <div
                                  style={{
                                    color:
                                      "#7b838c",
                                    fontSize:
                                      "11px",
                                  }}
                                >

                                  {
                                    invoice.dueDate
                                      ? (
                                        <>
                                          Vade{" "}
                                          {
                                            formatDate(
                                              invoice.dueDate
                                            )
                                          }
                                        </>
                                      )
                                      : "Vade belirtilmemiş"
                                  }

                                </div>


                                <div
                                  style={{
                                    textAlign:
                                      "right",
                                  }}
                                >

                                  <strong
                                    style={{
                                      color:
                                        "#2c6bb2",
                                      fontSize:
                                        "13px",
                                    }}
                                  >
                                    {
                                      money(
                                        invoice.remaining
                                      )
                                    } TL
                                  </strong>

                                  <small
                                    style={{
                                      display:
                                        "block",
                                      marginTop:
                                        "3px",
                                      color:
                                        "#a0a7ae",
                                      fontSize:
                                        "10px",
                                    }}
                                  >
                                    Kalan
                                  </small>

                                </div>

                              </div>

                            )
                          )
                      }


                      {
                        openInvoices.filter(
                          (invoice) =>
                            invoice.remaining >
                            0.005
                        ).length ===
                        0 && (

                          <div
                            style={{
                              padding:
                                "30px 10px",
                              textAlign:
                                "center",
                              color:
                                "#9299a2",
                            }}
                          >

                            <strong
                              style={{
                                display:
                                  "block",
                                color:
                                  "#67707a",
                                marginBottom:
                                  "5px",
                              }}
                            >
                              Açık fatura yok
                            </strong>

                            <span>
                              Bu cari için bekleyen satış faturası bulunmuyor.
                            </span>

                          </div>

                        )
                      }

                    </div>


                    {/* İŞLEM GEÇMİŞİ */}

                    <div
                      style={{
                        borderTop:
                          "1px solid #e8eaed",
                        paddingTop:
                          "13px",
                        marginTop:
                          "4px",
                      }}
                    >

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            "movements"
                          )
                        }
                        style={{
                          border:
                            "1px solid #d9dde2",
                          background:
                            "#fff",
                          borderRadius:
                            "4px",
                          padding:
                            "7px 11px",
                          fontSize:
                            "10px",
                          fontWeight:
                            700,
                          color:
                            "#7a828a",
                          cursor:
                            "pointer",
                        }}
                      >
                        ↻ İŞLEM GEÇMİŞİNİ GÖSTER
                      </button>

                    </div>

                  </div>


                  {/* SON HAREKETLER */}

                  <div
                    className="customer-detail-card customer-detail-full-card"
                  >

                    <div className="customer-detail-card-header">

                      <div>

                        <strong>
                          Son İşlemler
                        </strong>

                        <span>
                          Bu cari hesapta gerçekleşen son hareketler
                        </span>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            "movements"
                          )
                        }
                      >
                        Tüm Hareketler
                      </button>

                    </div>


                    {
                      recentMovements.length ===
                      0 ? (

                        <div
                          style={{
                            padding:
                              "35px",
                            textAlign:
                              "center",
                            color:
                              "#9299a2",
                          }}
                        >
                          Henüz işlem bulunmuyor.
                        </div>

                      ) : (

                        <div>

                          {
                            recentMovements.map(
                              (
                                movement
                              ) => (

                                <div
                                  key={
                                    movement.id
                                  }
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap:
                                      "12px",
                                    padding:
                                      "13px 0",
                                    borderTop:
                                      "1px solid #f0f1f3",
                                  }}
                                >

                                  <div
                                    style={{
                                      width:
                                        "30px",
                                      height:
                                        "30px",
                                      minWidth:
                                        "30px",
                                      borderRadius:
                                        "50%",
                                      background:
                                        "#f2f4f6",
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "center",
                                      color:
                                        "#7a838d",
                                      fontSize:
                                        "12px",
                                    }}
                                  >
                                    {
                                      movement.type ===
                                      "Tahsilat"
                                        ? "₺"
                                        : movement.type ===
                                          "Ödeme"
                                        ? "₺"
                                        : movement.type ===
                                          "Alış"
                                        ? "A"
                                        : "S"
                                    }
                                  </div>


                                  <div
                                    style={{
                                      flex:
                                        1,
                                      minWidth:
                                        0,
                                    }}
                                  >

                                    <strong
                                      style={{
                                        display:
                                          "block",
                                        fontSize:
                                          "12px",
                                        color:
                                          "#3d464f",
                                      }}
                                    >
                                      {
                                        movement.type ||
                                        "Hareket"
                                      }
                                    </strong>

                                    <span
                                      style={{
                                        display:
                                          "block",
                                        fontSize:
                                          "10px",
                                        color:
                                          "#9aa1a9",
                                        marginTop:
                                          "3px",
                                      }}
                                    >
                                      {
                                        movement.description ||
                                        movement.document ||
                                        "—"
                                      }
                                    </span>

                                  </div>


                                  <div
                                    style={{
                                      textAlign:
                                        "right",
                                    }}
                                  >

                                    <strong
                                      style={{
                                        color:
                                          numberValue(
                                            movement.debt
                                          ) > 0
                                            ? "#c84d48"
                                            : "#3e8a64",
                                        fontSize:
                                          "12px",
                                      }}
                                    >

                                      {
                                        numberValue(
                                          movement.debt
                                        ) > 0
                                          ? `-${money(
                                              movement.debt
                                            )}`
                                          : `+${money(
                                              movement.credit
                                            )}`
                                      } TL

                                    </strong>

                                    <small
                                      style={{
                                        display:
                                          "block",
                                        marginTop:
                                          "3px",
                                        color:
                                          "#a2a8ae",
                                        fontSize:
                                          "9px",
                                      }}
                                    >
                                      {
                                        formatDate(
                                          movement.date
                                        )
                                      }
                                    </small>

                                  </div>

                                </div>

                              )
                            )
                          }

                        </div>

                      )
                    }

                  </div>

                </div>

              )
            }


            {/* =================================================
                AÇIK FATURALAR SEKMESİ
            ================================================= */}

            {
              activeTab ===
              "invoices" && (

                <div
                  className="customer-detail-card customer-detail-full-card"
                >

                  <div className="customer-detail-card-header">

                    <div>

                      <strong>
                        Satış Faturaları
                      </strong>

                      <span>
                        {
                          getCustomerName(
                            customer
                          )
                        }
                      </span>

                    </div>


                    <div
                      style={{
                        display:
                          "flex",
                        gap:
                          "6px",
                      }}
                    >

                      {
                        [
                          "Açık",
                          "Kapalı",
                          "Tümü",
                        ].map(
                          (filter) => (

                            <button
                              type="button"
                              key={
                                filter
                              }
                              onClick={() =>
                                setInvoiceFilter(
                                  filter
                                )
                              }
                              className={
                                invoiceFilter ===
                                filter
                                  ? "active"
                                  : ""
                              }
                            >
                              {
                                filter
                              }
                            </button>

                          )
                        )
                      }

                    </div>

                  </div>


                  <div className="customer-detail-table-wrapper">

                    <table className="customer-detail-table">

                      <thead>

                        <tr>

                          <th>
                            TARİH
                          </th>

                          <th>
                            FATURA NO
                          </th>

                          <th>
                            VADE
                          </th>

                          <th>
                            DURUM
                          </th>

                          <th>
                            FATURA
                          </th>

                          <th>
                            ÖDENEN
                          </th>

                          <th>
                            KALAN
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          openInvoices.length ===
                          0 ? (

                            <tr>

                              <td
                                colSpan="7"
                                style={{
                                  textAlign:
                                    "center",
                                  padding:
                                    "40px",
                                }}
                              >
                                Fatura bulunamadı.
                              </td>

                            </tr>

                          ) : (

                            openInvoices.map(
                              (
                                invoice
                              ) => {

                                const remaining =
                                  numberValue(
                                    invoice.remaining
                                  );

                                const closed =
                                  remaining <=
                                  0.005;

                                return (

                                  <tr
                                    key={
                                      invoice.id
                                    }
                                    onClick={() =>
                                      openInvoice(
                                        invoice
                                      )
                                    }
                                    style={{
                                      cursor:
                                        "pointer",
                                    }}
                                  >

                                    <td>
                                      {
                                        formatDate(
                                          invoice.date
                                        )
                                      }
                                    </td>

                                    <td>

                                      <strong>
                                        {
                                          invoice.invoiceNo ||
                                          invoice.number ||
                                          "—"
                                        }
                                      </strong>

                                    </td>

                                    <td>
                                      {
                                        invoice.dueDate
                                          ? formatDate(
                                              invoice.dueDate
                                            )
                                          : "—"
                                      }
                                    </td>

                                    <td>

                                      <span
                                        className={
                                          closed
                                            ? "customer-detail-type payment"
                                            : "customer-detail-type sale"
                                        }
                                      >
                                        {
                                          closed
                                            ? "Kapalı"
                                            : "Açık"
                                        }
                                      </span>

                                    </td>

                                    <td>
                                      {
                                        money(
                                          invoice.total
                                        )
                                      } TL
                                    </td>

                                    <td>
                                      {
                                        money(
                                          invoice.paidAmount
                                        )
                                      } TL
                                    </td>

                                    <td
                                      className="detail-debt"
                                    >
                                      {
                                        money(
                                          remaining
                                        )
                                      } TL
                                    </td>

                                  </tr>

                                );

                              }
                            )

                          )
                        }

                      </tbody>

                    </table>

                  </div>

                </div>

              )
            }


            {/* =================================================
                İŞLEM GEÇMİŞİ
            ================================================= */}

            {
              activeTab ===
              "movements" && (

                <div
                  className="customer-detail-card customer-detail-full-card"
                >

                  <div className="customer-detail-card-header">

                    <div>

                      <strong>
                        İşlem Geçmişi
                      </strong>

                      <span>
                        Cari hesabın tüm hareketleri
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "overview"
                        )
                      }
                    >
                      Genel Bakış
                    </button>

                  </div>


                  <div className="customer-detail-table-wrapper">

                    <table className="customer-detail-table">

                      <thead>

                        <tr>

                          <th>
                            TARİH
                          </th>

                          <th>
                            BELGE NO
                          </th>

                          <th>
                            İŞLEM
                          </th>

                          <th>
                            AÇIKLAMA
                          </th>

                          <th>
                            BORÇ
                          </th>

                          <th>
                            ALACAK
                          </th>

                          <th>
                            BAKİYE
                          </th>

                          <th>
                            İŞLEM
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          normalizedMovements.length ===
                          0 ? (

                            <tr>

                              <td
                                colSpan="8"
                                style={{
                                  textAlign:
                                    "center",
                                  padding:
                                    "40px",
                                }}
                              >
                                Henüz cari hareket bulunmuyor.
                              </td>

                            </tr>

                          ) : (

                            (() => {

                              let balance =
                                0;


                              return normalizedMovements.map(
                                (
                                  movement
                                ) => {

                                  balance +=
                                    numberValue(
                                      movement.debt
                                    ) -
                                    numberValue(
                                      movement.credit
                                    );


                                  return (

                                    <tr
                                      key={
                                        movement.id
                                      }
                                    >

                                      <td>
                                        {
                                          formatDate(
                                            movement.date
                                          )
                                        }
                                      </td>

                                      <td>
                                        {
                                          movement.document ||
                                          "—"
                                        }
                                      </td>

                                      <td>

                                        <span
                                          className={
                                            movement.type ===
                                              "Tahsilat" ||
                                            movement.type ===
                                              "Ödeme"
                                              ? "customer-detail-type payment"
                                              : "customer-detail-type sale"
                                          }
                                        >
                                          {
                                            movement.type ||
                                            "Hareket"
                                          }
                                        </span>

                                      </td>

                                      <td>
                                        {
                                          movement.description ||
                                          "—"
                                        }
                                      </td>

                                      <td className="detail-debt">

                                        {
                                          numberValue(
                                            movement.debt
                                          ) > 0
                                            ? money(
                                                movement.debt
                                              )
                                            : "—"
                                        }

                                      </td>

                                      <td className="detail-credit">

                                        {
                                          numberValue(
                                            movement.credit
                                          ) > 0
                                            ? money(
                                                movement.credit
                                              )
                                            : "—"
                                        }

                                      </td>

                                      <td>

                                        <strong
                                          className={
                                            balance >
                                            0
                                              ? "cari-status-borclu"
                                              : "cari-status-alacakli"
                                          }
                                        >

                                          {
                                            money(
                                              balance
                                            )
                                          } TL

                                        </strong>

                                      </td>

                                      <td>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            detailMovement(
                                              movement
                                            )
                                          }
                                        >
                                          Detay
                                        </button>

                                      </td>

                                    </tr>

                                  );

                                }
                              );

                            })()

                          )
                        }

                      </tbody>

                    </table>

                  </div>

                </div>

              )
            }


            {/* =================================================
                HESAP BİLGİLERİ
            ================================================= */}

            {
              activeTab ===
              "info" && (

                <div
                  className="customer-detail-card customer-detail-full-card"
                >

                  <div className="customer-detail-card-header">

                    <div>

                      <strong>
                        Hesap Bilgileri
                      </strong>

                      <span>
                        Cari kayıt bilgileri
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={
                        editCustomer
                      }
                    >
                      Düzenle
                    </button>

                  </div>


                  <div className="customer-detail-information-grid">

                    <div>

                      <span>
                        Hesap Türü
                      </span>

                      <strong>
                        {
                          isSupplier
                            ? "Tedarikçi"
                            : "Müşteri"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Cari Kodu
                      </span>

                      <strong>
                        {
                          customer.code ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Hesap Adı / Ünvan
                      </span>

                      <strong>
                        {
                          getCustomerName(
                            customer
                          )
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Yetkili
                      </span>

                      <strong>
                        {
                          customer.contact ||
                          customer.contactPerson ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Telefon
                      </span>

                      <strong>
                        {
                          customer.phone ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        E-posta
                      </span>

                      <strong>
                        {
                          customer.email ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Vergi Dairesi
                      </span>

                      <strong>
                        {
                          customer.taxOffice ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Vergi No
                      </span>

                      <strong>
                        {
                          customer.taxNumber ||
                          customer.taxNo ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        Vade
                      </span>

                      <strong>
                        {
                          customer.term ||
                          (
                            customer.dueDays
                              ? `${customer.dueDays} Gün`
                              : "—"
                          )
                        }
                      </strong>

                    </div>

                    <div className="customer-detail-address">

                      <span>
                        Adres
                      </span>

                      <strong>

                        {
                          customer.address ||
                          "—"
                        }

                        <br />

                        {
                          customer.district ||
                          "—"
                        }

                        {" / "}

                        {
                          customer.city ||
                          "—"
                        }

                      </strong>

                    </div>

                  </div>

                </div>

              )
            }

          </div>


          {/* =================================================
              SAĞ FİNANS PANELİ
          ================================================= */}

          <aside>

            <div
              style={{
                background:
                  "#fff",
                border:
                  "1px solid #e1e5e9",
                borderRadius:
                  "8px",
                overflow:
                  "hidden",
                marginBottom:
                  "14px",
              }}
            >

              {/* TAHSİLAT BUTONU */}

              <button
                type="button"
                onClick={
                  isSupplier
                    ? newPayment
                    : newCollection
                }
                style={{
                  width:
                    "100%",
                  border:
                    "0",
                  borderRadius:
                    0,
                  minHeight:
                    "46px",
                  background:
                    "#2eaac8",
                  color:
                    "#fff",
                  fontSize:
                    "11px",
                  fontWeight:
                    700,
                  cursor:
                    "pointer",
                }}
              >
                {
                  isSupplier
                    ? "ÖDEME EKLE"
                    : "TAHSİLAT EKLE"
                }
              </button>


              {/* HESAP ÖZETİ */}

              <div
                style={{
                  padding:
                    "16px",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding:
                      "8px 0",
                    borderBottom:
                      "1px solid #f0f1f3",
                  }}
                >

                  <span
                    style={{
                      color:
                        "#7d858e",
                      fontSize:
                        "10px",
                    }}
                  >
                    {
                      isSupplier
                        ? "YAPILACAK ÖDEME"
                        : "YAPILACAK TAHSİLAT"
                    }
                  </span>

                  <strong
                    style={{
                      color:
                        customerReceivable >
                        0
                          ? "#8e959d"
                          : "#3f8f62",
                      fontSize:
                        "13px",
                    }}
                  >
                    {
                      money(
                        customerReceivable
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
                    alignItems:
                      "center",
                    padding:
                      "12px 0 4px",
                  }}
                >

                  <span
                    style={{
                      fontSize:
                        "10px",
                      fontWeight:
                        700,
                      color:
                        "#39424b",
                    }}
                  >
                    {
                      isSupplier
                        ? "TOPLAM ÖDEME"
                        : "TOPLAM TAHSİLAT"
                    }
                  </span>

                  <strong
                    style={{
                      color:
                        "#2eaac8",
                      fontSize:
                        "14px",
                    }}
                  >
                    {
                      money(
                        isSupplier
                          ? movementTotals.payment
                          : movementTotals.collection
                      )
                    } TL
                  </strong>

                </div>

              </div>

            </div>


            {/* CARİ DURUM */}

            <div
              style={{
                background:
                  "#fff",
                border:
                  "1px solid #e1e5e9",
                borderRadius:
                  "8px",
                padding:
                  "16px",
                marginBottom:
                  "14px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "10px",
                  color:
                    "#979ea7",
                  marginBottom:
                    "8px",
                  fontWeight:
                    700,
                }}
              >
                CARİ DURUM
              </div>


              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                }}
              >

                <strong
                  className={
                    statusClass
                  }
                  style={{
                    fontSize:
                      "12px",
                  }}
                >
                  {
                    statusLabel
                  }
                </strong>

                <strong
                  style={{
                    fontSize:
                      "18px",
                    color:
                      "#38414a",
                  }}
                >
                  {
                    money(
                      customerReceivable
                    )
                  } TL
                </strong>

              </div>


              <div
                style={{
                  height:
                    "4px",
                  background:
                    "#eef0f2",
                  borderRadius:
                    "10px",
                  marginTop:
                    "12px",
                  overflow:
                    "hidden",
                }}
              >

                <div
                  style={{
                    width:
                      invoiceSummary.salesTotal >
                      0
                        ? `${Math.min(
                            100,
                            (
                              invoiceSummary.totalPaid /
                              invoiceSummary.salesTotal
                            ) *
                              100
                          )}%`
                        : "0%",
                    height:
                      "100%",
                    background:
                      "#2eaac8",
                  }}
                />

              </div>

            </div>


            {/* HIZLI İŞLEMLER */}

            <div
              style={{
                background:
                  "#fff",
                border:
                  "1px solid #e1e5e9",
                borderRadius:
                  "8px",
                padding:
                  "16px",
              }}
            >

              <div
                style={{
                  fontSize:
                    "10px",
                  fontWeight:
                    700,
                  color:
                    "#979ea7",
                  marginBottom:
                    "10px",
                }}
              >
                HIZLI İŞLEMLER
              </div>


              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "invoices"
                  )
                }
                style={{
                  width:
                    "100%",
                  textAlign:
                    "left",
                  border:
                    "1px solid #e6e8ea",
                  background:
                    "#fff",
                  borderRadius:
                    "4px",
                  padding:
                    "10px",
                  marginBottom:
                    "7px",
                  cursor:
                    "pointer",
                  color:
                    "#59616a",
                  fontSize:
                    "11px",
                }}
              >
                ▤ Açık Faturaları Gör
              </button>


              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "movements"
                  )
                }
                style={{
                  width:
                    "100%",
                  textAlign:
                    "left",
                  border:
                    "1px solid #e6e8ea",
                  background:
                    "#fff",
                  borderRadius:
                    "4px",
                  padding:
                    "10px",
                  marginBottom:
                    "7px",
                  cursor:
                    "pointer",
                  color:
                    "#59616a",
                  fontSize:
                    "11px",
                }}
              >
                ↻ İşlem Geçmişi
              </button>


              <button
                type="button"
                onClick={
                  editCustomer
                }
                style={{
                  width:
                    "100%",
                  textAlign:
                    "left",
                  border:
                    "1px solid #e6e8ea",
                  background:
                    "#fff",
                  borderRadius:
                    "4px",
                  padding:
                    "10px",
                  cursor:
                    "pointer",
                  color:
                    "#59616a",
                  fontSize:
                    "11px",
                }}
              >
                ✎ Cari Bilgilerini Düzenle
              </button>

            </div>

          </aside>

        </div>

      </div>


      {showCollection && (

        <div
          className="customer-detail-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCollection(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(24, 32, 38, 0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >

          <div
            style={{
              width: "min(640px, 100%)",
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #e2e6e9",
              boxShadow: "0 22px 60px rgba(0,0,0,.18)",
              overflow: "hidden",
            }}
          >

            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #edf0f2",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#39a978", marginBottom: "6px" }}>
                  REN ERP · TAHSİLAT
                </div>
                <h2 style={{ margin: 0, fontSize: "21px", color: "#263238" }}>Tahsilat Ekle</h2>
                <div style={{ marginTop: "5px", color: "#68727b", fontSize: "13px" }}>
                  {getCustomerName(customer)} {customer.code ? `· ${customer.code}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCollection(false)}
                style={{
                  width: "34px",
                  height: "34px",
                  border: "1px solid #e2e6e9",
                  borderRadius: "8px",
                  background: "#fff",
                  fontSize: "22px",
                  color: "#66717a",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveDirectCollection}>
              <div
                style={{
                  padding: "22px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div style={{ gridColumn: "1 / -1", background: "#f7faf8", border: "1px solid #dcefe5", borderRadius: "8px", padding: "12px 14px" }}>
                  <div style={{ fontSize: "11px", color: "#78838b", marginBottom: "4px", fontWeight: 700 }}>CARİ HESAP</div>
                  <strong style={{ fontSize: "14px", color: "#2d3a42" }}>{getCustomerName(customer)}</strong>
                </div>

                <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px", fontWeight: 700, color: "#56616a" }}>
                  Tarih
                  <input
                    type="date"
                    value={collectionForm.date}
                    onChange={(event) => setCollectionForm((prev) => ({ ...prev, date: event.target.value }))}
                    required
                    style={{ height: "42px", border: "1px solid #d8dee2", borderRadius: "7px", padding: "0 11px", fontSize: "14px" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px", fontWeight: 700, color: "#56616a" }}>
                  Tahsilat Tutarı
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={collectionForm.amount}
                      onChange={(event) => setCollectionForm((prev) => ({ ...prev, amount: event.target.value }))}
                      placeholder="0,00"
                      required
                      style={{ width: "100%", height: "42px", border: "1px solid #d8dee2", borderRadius: "7px", padding: "0 45px 0 11px", fontSize: "15px", fontWeight: 700, boxSizing: "border-box" }}
                    />
                    <span style={{ position: "absolute", right: "12px", top: "12px", color: "#7a848c", fontSize: "12px" }}>TL</span>
                  </div>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px", fontWeight: 700, color: "#56616a" }}>
                  Ödeme Yöntemi
                  <select
                    value={collectionForm.method}
                    onChange={(event) => setCollectionForm((prev) => ({ ...prev, method: event.target.value }))}
                    style={{ height: "42px", border: "1px solid #d8dee2", borderRadius: "7px", padding: "0 11px", fontSize: "14px" }}
                  >
                    {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px", fontWeight: 700, color: "#56616a" }}>
                  Kasa / Banka / POS
                  <select
                    value={collectionForm.accountId}
                    onChange={(event) => setCollectionForm((prev) => ({ ...prev, accountId: event.target.value }))}
                    required
                    style={{ height: "42px", border: "1px solid #d8dee2", borderRadius: "7px", padding: "0 11px", fontSize: "14px" }}
                  >
                    <option value="">Hesap seçin</option>
                    {getStoredArray(accountStorageKey).filter((a) => a.status !== "Pasif").map((account) => (
                      <option key={account.id} value={account.id}>{account.name} · {account.type}</option>
                    ))}
                  </select>
                </label>

                <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px", fontWeight: 700, color: "#56616a" }}>
                  Açıklama
                  <textarea
                    value={collectionForm.description}
                    onChange={(event) => setCollectionForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Tahsilat açıklaması..."
                    rows="3"
                    style={{ border: "1px solid #d8dee2", borderRadius: "7px", padding: "10px 11px", fontSize: "14px", resize: "vertical" }}
                  />
                </label>
              </div>

              <div style={{ padding: "0 22px 20px", display: "flex", justifyContent: "flex-end", gap: "9px" }}>
                <button
                  type="button"
                  onClick={() => setShowCollection(false)}
                  style={{ height: "40px", padding: "0 16px", border: "1px solid #d8dee2", borderRadius: "7px", background: "#fff", color: "#59636b", fontWeight: 700, cursor: "pointer" }}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  style={{ height: "40px", padding: "0 18px", border: "0", borderRadius: "7px", background: "#39a978", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                >
                  Tahsilatı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}