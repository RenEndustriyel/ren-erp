import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  getCustomers,
  updateCustomerBalance,
} from "../../../lib/customerStore";

import "./CollectionsPayments.css";


/* =========================================================
   SABİTLER
========================================================= */

const paymentMethods = [
  "Nakit",
  "Kredi Kartı",
  "Havale / EFT",
  "Çek",
  "Diğer",
];


const collectionStorageKey =
  "ren-erp-collections";


const accountStorageKey =
  "ren-erp-cash-bank-accounts";


const movementStorageKey =
  "ren-erp-cash-bank-movements";


/* =========================================================
   YARDIMCILAR
========================================================= */

function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      `${value}T00:00:00`
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
  ).format(date);
}


function number(value) {
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
    return Number.isFinite(value)
      ? value
      : 0;
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

  const parsed =
    Number(text);

  return Number.isFinite(parsed)
    ? parsed
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
      number(value)
    )
  );
}


/* =========================================================
   TAHSİLATLAR
========================================================= */

function getInitialCollections() {

  try {

    const saved =
      localStorage.getItem(
        collectionStorageKey
      );


    if (saved) {

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

  } catch (error) {

    console.error(
      "REN ERP tahsilatları okunamadı:",
      error
    );

  }


  return [];
}


/* =========================================================
   FİNANS HESAPLARI
========================================================= */

function getAccounts() {

  try {

    const saved =
      localStorage.getItem(
        accountStorageKey
      );


    if (saved) {

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

  } catch (error) {

    console.error(
      "REN ERP finans hesapları okunamadı:",
      error
    );

  }


  return [];

}


function getMovements() {

  try {

    const saved =
      localStorage.getItem(
        movementStorageKey
      );


    if (saved) {

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

  } catch (error) {

    console.error(
      "REN ERP finans hareketleri okunamadı:",
      error
    );

  }


  return [];

}


function saveAccounts(
  accounts
) {

  localStorage.setItem(
    accountStorageKey,
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


function saveMovements(
  movements
) {

  localStorage.setItem(
    movementStorageKey,
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
   BELGE NUMARASI
========================================================= */

function createDocumentNumber(
  collections
) {

  const year =
    new Date().getFullYear();


  const numbers =
    collections
      .map(
        (item) => {

          const match =
            String(
              item.document ||
              ""
            ).match(
              /THS-\d{4}-(\d+)/
            );


          return match
            ? Number(
                match[1]
              )
            : 0;

        }
      )
      .filter(
        Boolean
      );


  const nextNumber =
    numbers.length > 0
      ? Math.max(
          ...numbers
        ) + 1
      : 1;


  return `THS-${year}-${String(
    nextNumber
  ).padStart(
    4,
    "0"
  )}`;

}


/* =========================================================
   COMPONENT
========================================================= */

export default function CollectionsPayments() {

  const [
    customers,
    setCustomers,
  ] = useState(
    getCustomers
  );


  const [
    collections,
    setCollections,
  ] = useState(
    getInitialCollections
  );


  const [
    accounts,
    setAccounts,
  ] = useState(
    getAccounts
  );


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    methodFilter,
    setMethodFilter,
  ] = useState(
    "Tümü"
  );


  const [
    dateFrom,
    setDateFrom,
  ] = useState("");


  const [
    dateTo,
    setDateTo,
  ] = useState("");


  const [
    showForm,
    setShowForm,
  ] = useState(false);


  const [
    form,
    setForm,
  ] = useState({

    customerId:
      "",

    date:
      today(),

    amount:
      "",

    method:
      "Nakit",

    accountId:
      "",

    description:
      "",

  });


  /* =======================================================
     VERİLERİ YENİLE
  ======================================================= */

  useEffect(() => {

    const refresh =
      () => {

        setCustomers(
          getCustomers()
        );

        setAccounts(
          getAccounts()
        );

      };


    window.addEventListener(
      "ren-customers-updated",
      refresh
    );


    window.addEventListener(
      "ren-cash-bank-updated",
      refresh
    );


    return () => {

      window.removeEventListener(
        "ren-customers-updated",
        refresh
      );


      window.removeEventListener(
        "ren-cash-bank-updated",
        refresh
      );

    };

  }, []);


  /* =======================================================
     MÜŞTERİLER
  ======================================================= */

  const customerList =
    useMemo(
      () =>
        customers.filter(
          (customer) =>
            customer.type ===
            "Müşteri"
        ),
      [customers]
    );


  /* =======================================================
     FİNANS HESAPLARI
  ======================================================= */

  const usableAccounts =
    useMemo(() => {

      return accounts.filter(
        (account) =>
          account.status !==
            "Pasif"
      );

    }, [
      accounts,
    ]);


  /* =======================================================
     FİLTRE
  ======================================================= */

  const filteredCollections =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      return collections.filter(
        (item) => {

          const customerName =
            String(
              item.customerName ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              );


          const document =
            String(
              item.document ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              );


          const description =
            String(
              item.description ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              );


          const matchesSearch =
            !query ||
            customerName.includes(
              query
            ) ||
            document.includes(
              query
            ) ||
            description.includes(
              query
            );


          const matchesMethod =
            methodFilter ===
              "Tümü" ||
            item.method ===
              methodFilter;


          const matchesFrom =
            !dateFrom ||
            item.date >=
              dateFrom;


          const matchesTo =
            !dateTo ||
            item.date <=
              dateTo;


          return (
            matchesSearch &&
            matchesMethod &&
            matchesFrom &&
            matchesTo
          );

        }
      );

    }, [
      collections,
      search,
      methodFilter,
      dateFrom,
      dateTo,
    ]);


  /* =======================================================
     SEÇİLİ CARİ
  ======================================================= */

  const selectedCustomer =
    customers.find(
      (customer) =>
        String(
          customer.id
        ) ===
        String(
          form.customerId
        )
    );


  /* =======================================================
     SEÇİLİ HESAP
  ======================================================= */

  const selectedAccount =
    accounts.find(
      (account) =>
        String(
          account.id
        ) ===
        String(
          form.accountId
        )
    );


  /* =======================================================
     TUTAR
  ======================================================= */

  const numericAmount =
    number(
      form.amount
    );


  /* =======================================================
     ÖZET
  ======================================================= */

  const todayTotal =
    collections
      .filter(
        (item) =>
          item.date ===
          today()
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          number(
            item.amount
          ),
        0
      );


  const currentDate =
    new Date();


  const currentMonth =
    `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(
      2,
      "0"
    )}`;


  const monthTotal =
    collections
      .filter(
        (item) =>
          String(
            item.date
          ).startsWith(
            currentMonth
          )
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          number(
            item.amount
          ),
        0
      );


  const filteredTotal =
    filteredCollections.reduce(
      (
        total,
        item
      ) =>
        total +
        number(
          item.amount
        ),
      0
    );


  /* =======================================================
     FORM
  ======================================================= */

  const resetForm =
    () => {

      setForm({

        customerId:
          "",

        date:
          today(),

        amount:
          "",

        method:
          "Nakit",

        accountId:
          accounts.length >
          0
            ? accounts[0].id
            : "",

        description:
          "",

      });

    };


  const openNewCollection =
    () => {

      const firstAccount =
        getAccounts()[0];


      setForm({

        customerId:
          "",

        date:
          today(),

        amount:
          "",

        method:
          "Nakit",

        accountId:
          firstAccount?.id ||
          "",

        description:
          "",

      });


      setShowForm(
        true
      );

    };


  const closeForm =
    () => {

      resetForm();

      setShowForm(
        false
      );

    };


  /* =======================================================
     TAHSİLAT KAYDET
  ======================================================= */

  const saveCollection =
    (event) => {

      event.preventDefault();


      if (
        !form.customerId
      ) {

        alert(
          "Lütfen cari hesap seçin."
        );

        return;
      }


      if (
        !numericAmount ||
        numericAmount <= 0
      ) {

        alert(
          "Lütfen geçerli bir tahsilat tutarı girin."
        );

        return;
      }


      if (
        !form.accountId
      ) {

        alert(
          "Lütfen kasa, banka veya POS hesabı seçin."
        );

        return;
      }


      const customer =
        customers.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              form.customerId
            )
        );


      const account =
        accounts.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              form.accountId
            )
        );


      if (!customer) {

        alert(
          "Cari hesap bulunamadı."
        );

        return;
      }


      if (!account) {

        alert(
          "Finans hesabı bulunamadı."
        );

        return;
      }


      /*
       * TAHSİLAT BELGESİ
       */

      const newCollection = {

        id:
          Date.now(),

        document:
          createDocumentNumber(
            collections
          ),

        customerId:
          customer.id,

        customerName:
          customer.name,

        customerCode:
          customer.code ||
          "",

        date:
          form.date,

        amount:
          numericAmount,

        method:
          form.method,

        accountId:
          account.id,

        account:
          account.name,

        accountType:
          account.type,

        description:
          form.description.trim() ||
          `${form.method} tahsilat`,

        source:
          "collection",

        createdAt:
          new Date().toISOString(),

      };


      /*
       * TAHSİLAT LİSTESİ
       */

      const updatedCollections =
        [
          newCollection,
          ...collections,
        ];


      /*
       * MÜŞTERİ CARİSİ
       *
       * Borç negatif tutulduğu için
       * tahsilat + olarak işleniyor.
       */

      updateCustomerBalance(
        customer.id,
        numericAmount
      );


      /*
       * KASA / BANKA / POS
       *
       * Para girişi.
       */

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
                    number(
                      item.balance
                    ) +
                    numericAmount,
                }
              : item
        );


      /*
       * FİNANS HAREKETİ
       */

      const currentMovements =
        getMovements();


      const newMovement = {

        id:
          `THS-${Date.now()}-${Math.random()
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
          numericAmount,

        description:
          `${newCollection.document} - ${customer.name} tahsilatı`,

        date:
          form.date,

        method:
          form.method,

        source:
          "collection",

        sourceId:
          newCollection.id,

        sourceDocument:
          newCollection.document,

        customerId:
          customer.id,

        customerName:
          customer.name,

        createdAt:
          new Date().toISOString(),

      };


      /*
       * KAYDET
       */

      localStorage.setItem(
        collectionStorageKey,
        JSON.stringify(
          updatedCollections
        )
      );


      saveAccounts(
        updatedAccounts
      );


      saveMovements([
        newMovement,
        ...currentMovements,
      ]);


      setCollections(
        updatedCollections
      );


      setAccounts(
        updatedAccounts
      );


      setCustomers(
        getCustomers()
      );


      window.dispatchEvent(
        new Event(
          "ren-customers-updated"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-collections-updated"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-cash-bank-updated"
        )
      );


      closeForm();


      alert(
        `${newCollection.document} numaralı tahsilat kaydedildi.`
      );

    };


  /* =======================================================
     TAHSİLAT SİL
  ======================================================= */

  const deleteCollection =
    (item) => {

      const confirmed =
        window.confirm(
          `${item.document} numaralı tahsilatı silmek istediğinize emin misiniz?\n\nCari ve kasa/banka bakiyesi geri alınacaktır.`
        );


      if (!confirmed) {
        return;
      }


      /*
       * CARİYİ GERİ AL
       */

      updateCustomerBalance(
        item.customerId,
        -number(
          item.amount
        )
      );


      /*
       * HESABI GERİ AL
       */

      const storedAccounts =
        getAccounts();


      const updatedAccounts =
        storedAccounts.map(
          (account) =>
            String(
              account.id
            ) ===
            String(
              item.accountId
            )
              ? {

                  ...account,

                  balance:
                    number(
                      account.balance
                    ) -
                    number(
                      item.amount
                    ),

                }
              : account
        );


      /*
       * FİNANS HAREKETİNİ SİL
       */

      const currentMovements =
        getMovements();


      const updatedMovements =
        currentMovements.filter(
          (movement) =>
            String(
              movement.sourceId
            ) !==
            String(
              item.id
            ) ||
            movement.source !==
              "collection"
        );


      /*
       * TAHSİLATI SİL
       */

      const updatedCollections =
        collections.filter(
          (collection) =>
            String(
              collection.id
            ) !==
            String(
              item.id
            )
        );


      localStorage.setItem(
        collectionStorageKey,
        JSON.stringify(
          updatedCollections
        )
      );


      saveAccounts(
        updatedAccounts
      );


      saveMovements(
        updatedMovements
      );


      setCollections(
        updatedCollections
      );


      setAccounts(
        updatedAccounts
      );


      setCustomers(
        getCustomers()
      );


      window.dispatchEvent(
        new Event(
          "ren-customers-updated"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-collections-updated"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-cash-bank-updated"
        )
      );

    };


  /* =======================================================
     FİLTRELERİ TEMİZLE
  ======================================================= */

  const clearFilters =
    () => {

      setSearch("");

      setMethodFilter(
        "Tümü"
      );

      setDateFrom("");

      setDateTo("");

    };


  return (
    <div className="collection-page">

      <div className="collection-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="collection-header">

          <div>

            <div className="collection-breadcrumb">

              <span>
                Müşteri - Tedarikçi
              </span>

              <span>
                /
              </span>

              <strong>
                Tahsilat
              </strong>

            </div>


            <h1>
              Tahsilat
            </h1>


            <p>
              Müşterilerden yapılan tahsilatları
              yönetin ve takip edin.
            </p>

          </div>


          <div className="collection-header-actions">

            <Link
              to="/customers"
              className="collection-secondary-button"
            >
              Hesap Listesi
            </Link>


            <button
              className="collection-primary-button"
              onClick={
                openNewCollection
              }
            >

              <span>
                +
              </span>

              Yeni Tahsilat

            </button>

          </div>

        </div>


        {/* =================================================
            ÖZET
        ================================================= */}

        <div className="collection-summary">

          <div className="collection-summary-card">

            <span>
              BUGÜNKÜ TAHSİLAT
            </span>

            <strong>
              {money(
                todayTotal
              )} TL
            </strong>

          </div>


          <div className="collection-summary-card">

            <span>
              BU AY TAHSİLAT
            </span>

            <strong>
              {money(
                monthTotal
              )} TL
            </strong>

          </div>


          <div className="collection-summary-card">

            <span>
              FİLTRELENEN TOPLAM
            </span>

            <strong>
              {money(
                filteredTotal
              )} TL
            </strong>

          </div>


          <div className="collection-summary-card">

            <span>
              TAHSİLAT SAYISI
            </span>

            <strong>
              {
                filteredCollections.length
              }
            </strong>

          </div>

        </div>


        {/* =================================================
            ANA KART
        ================================================= */}

        <div className="collection-card">


          <div className="collection-toolbar">

            <div className="collection-search">

              <span>
                ⌕
              </span>


              <input
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
                placeholder="Cari, belge no veya açıklama ara..."
              />


              {search && (

                <button
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>

              )}

            </div>


            <input
              type="date"
              value={
                dateFrom
              }
              onChange={(
                event
              ) =>
                setDateFrom(
                  event.target.value
                )
              }
              className="collection-date"
            />


            <span className="collection-date-separator">
              -
            </span>


            <input
              type="date"
              value={
                dateTo
              }
              onChange={(
                event
              ) =>
                setDateTo(
                  event.target.value
                )
              }
              className="collection-date"
            />


            <select
              value={
                methodFilter
              }
              onChange={(
                event
              ) =>
                setMethodFilter(
                  event.target.value
                )
              }
              className="collection-filter"
            >

              <option value="Tümü">
                Tüm Ödeme Yöntemleri
              </option>


              {paymentMethods.map(
                (
                  method
                ) => (

                  <option
                    key={method}
                    value={method}
                  >
                    {
                      method
                    }
                  </option>

                )
              )}

            </select>


            {(search ||
              methodFilter !==
                "Tümü" ||
              dateFrom ||
              dateTo) && (

              <button
                className="collection-clear"
                onClick={
                  clearFilters
                }
              >
                Temizle
              </button>

            )}

          </div>


          <div className="collection-result-bar">

            <span>

              <strong>
                {
                  filteredCollections.length
                }
              </strong>{" "}
              tahsilat gösteriliyor

            </span>


            <span>

              Toplam{" "}

              <strong>
                {
                  collections.length
                }
              </strong>{" "}

              kayıt

            </span>

          </div>


          <div className="collection-table-wrapper">

            <table className="collection-table">

              <thead>

                <tr>

                  <th>
                    CARİ
                  </th>

                  <th>
                    TARİH
                  </th>

                  <th>
                    BELGE NO
                  </th>

                  <th>
                    ÖDEME YÖNTEMİ
                  </th>

                  <th>
                    KASA / BANKA
                  </th>

                  <th>
                    AÇIKLAMA
                  </th>

                  <th className="collection-money-head">
                    TUTAR
                  </th>

                  <th className="collection-actions-head">
                    İŞLEMLER
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredCollections.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="collection-empty"
                    >

                      <div>
                        ₺
                      </div>

                      <strong>
                        Tahsilat bulunamadı
                      </strong>

                      <span>
                        Yeni tahsilat ekleyebilir
                        veya filtreleri değiştirebilirsiniz.
                      </span>

                    </td>

                  </tr>

                ) : (

                  filteredCollections.map(
                    (
                      item
                    ) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>

                          <div className="collection-customer">

                            <span className="collection-avatar">

                              {
                                String(
                                  item.customerName ||
                                  "C"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()
                              }

                            </span>


                            <div>

                              <strong>
                                {
                                  item.customerName
                                }
                              </strong>

                              <small>
                                Cari Tahsilat
                              </small>

                            </div>

                          </div>

                        </td>


                        <td>

                          <div className="collection-date-cell">

                            <strong>
                              {
                                formatDate(
                                  item.date
                                )
                              }
                            </strong>

                          </div>

                        </td>


                        <td>

                          <span className="collection-document">
                            {
                              item.document
                            }
                          </span>

                        </td>


                        <td>

                          <span className="collection-method">
                            {
                              item.method
                            }
                          </span>

                        </td>


                        <td>

                          <span className="collection-account">
                            {
                              item.account ||
                              "—"
                            }
                          </span>

                        </td>


                        <td>

                          <span className="collection-description">
                            {
                              item.description
                            }
                          </span>

                        </td>


                        <td className="collection-money">

                          <strong>
                            {
                              money(
                                item.amount
                              )
                            } TL
                          </strong>

                        </td>


                        <td className="collection-actions">

                          <button
                            className="collection-more"
                            onClick={() =>
                              deleteCollection(
                                item
                              )
                            }
                            title="Tahsilatı sil"
                          >
                            🗑
                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>


          <div className="collection-footer">

            <span>

              Toplam{" "}

              <strong>
                {
                  filteredCollections.length
                }
              </strong>{" "}

              tahsilat

            </span>


            <div className="collection-pagination">

              <button disabled>
                ‹
              </button>

              <button className="active">
                1
              </button>

              <button disabled>
                ›
              </button>

            </div>


            <span>
              25 / sayfa
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          YENİ TAHSİLAT
      ===================================================== */}

      {showForm && (

        <div
          className="collection-modal-overlay"
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }

          }}
        >

          <div className="collection-modal">


            <div className="collection-modal-header">

              <div>

                <span>
                  REN ERP
                </span>

                <h2>
                  Yeni Tahsilat
                </h2>

                <p>
                  Müşteriden yapılan ödemeyi
                  cari ve finans hesabına kaydedin.
                </p>

              </div>


              <button
                className="collection-modal-close"
                onClick={
                  closeForm
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                saveCollection
              }
            >

              <div className="collection-form-grid">


                {/* CARİ */}

                <div className="collection-form-field full">

                  <label>

                    Cari Hesap

                    <span>
                      *
                    </span>

                  </label>


                  <select
                    value={
                      form.customerId
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          prev
                        ) => ({
                          ...prev,

                          customerId:
                            event.target.value,

                        })
                      )
                    }
                    required
                  >

                    <option value="">
                      Cari hesap seçin
                    </option>


                    {customerList.map(
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
                            customer.code
                          }{" "}
                          —{" "}
                          {
                            customer.name
                          }

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* CARİ BAKİYESİ */}

                {selectedCustomer && (

                  <div className="collection-customer-balance">

                    <div>

                      <span>
                        MEVCUT CARİ BAKİYESİ
                      </span>

                      <strong
                        className={
                          selectedCustomer.balance <
                          0
                            ? "negative"
                            : selectedCustomer.balance >
                              0
                            ? "positive"
                            : ""
                        }
                      >

                        {
                          selectedCustomer.balance <
                          0
                            ? "Borç "
                            : selectedCustomer.balance >
                              0
                            ? "Alacak "
                            : ""
                        }


                        {
                          money(
                            selectedCustomer.balance
                          )
                        }{" "}
                        TL

                      </strong>

                    </div>


                    <div className="collection-balance-preview">

                      <span>
                        TAHSİLAT SONRASI
                      </span>


                      <strong
                        className={
                          selectedCustomer.balance +
                            numericAmount <
                          0
                            ? "negative"
                            : selectedCustomer.balance +
                                numericAmount >
                              0
                            ? "positive"
                            : ""
                        }
                      >

                        {
                          selectedCustomer.balance +
                            numericAmount <
                          0
                            ? "Borç "
                            : selectedCustomer.balance +
                                numericAmount >
                              0
                            ? "Alacak "
                            : ""
                        }


                        {
                          money(
                            selectedCustomer.balance +
                              numericAmount
                          )
                        }{" "}
                        TL

                      </strong>

                    </div>

                  </div>

                )}


                {/* TARİH */}

                <div className="collection-form-field">

                  <label>

                    Tarih

                    <span>
                      *
                    </span>

                  </label>


                  <input
                    type="date"
                    value={
                      form.date
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          prev
                        ) => ({

                          ...prev,

                          date:
                            event.target.value,

                        })
                      )
                    }
                    required
                  />

                </div>


                {/* TUTAR */}

                <div className="collection-form-field">

                  <label>

                    Tahsilat Tutarı

                    <span>
                      *
                    </span>

                  </label>


                  <div className="collection-money-input">

                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        form.amount
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            prev
                          ) => ({

                            ...prev,

                            amount:
                              event.target.value,

                          })
                        )
                      }
                      placeholder="0,00"
                      required
                    />


                    <span>
                      TL
                    </span>

                  </div>

                </div>


                {/* ÖDEME YÖNTEMİ */}

                <div className="collection-form-field">

                  <label>

                    Ödeme Yöntemi

                    <span>
                      *
                    </span>

                  </label>


                  <select
                    value={
                      form.method
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          prev
                        ) => ({

                          ...prev,

                          method:
                            event.target.value,

                        })
                      )
                    }
                  >

                    {paymentMethods.map(
                      (
                        method
                      ) => (

                        <option
                          key={
                            method
                          }
                          value={
                            method
                          }
                        >
                          {
                            method
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* GERÇEK FİNANS HESABI */}

                <div className="collection-form-field">

                  <label>

                    Kasa / Banka / POS

                    <span>
                      *
                    </span>

                  </label>


                  <select
                    value={
                      form.accountId
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          prev
                        ) => ({

                          ...prev,

                          accountId:
                            event.target.value,

                        })
                      )
                    }
                    required
                  >

                    <option value="">
                      Finans hesabı seçin
                    </option>


                    {usableAccounts.map(
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


                  {usableAccounts.length ===
                    0 && (

                    <small
                      style={{
                        color:
                          "#b85c00",
                        marginTop:
                          "5px",
                      }}
                    >
                      Önce Nakit → Kasa ve Bankalar
                      bölümünden en az bir finans hesabı
                      oluşturun.
                    </small>

                  )}

                </div>


                {/* AÇIKLAMA */}

                <div className="collection-form-field full">

                  <label>
                    Açıklama
                  </label>


                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          prev
                        ) => ({

                          ...prev,

                          description:
                            event.target.value,

                        })
                      )
                    }
                    placeholder="Tahsilat açıklaması..."
                    rows="3"
                  />

                </div>

              </div>


              {/* FOOTER */}

              <div className="collection-modal-footer">

                <button
                  type="button"
                  className="collection-modal-cancel"
                  onClick={
                    closeForm
                  }
                >
                  Vazgeç
                </button>


                <button
                  type="submit"
                  className="collection-modal-save"
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