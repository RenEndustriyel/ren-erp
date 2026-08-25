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

import {
  addCustomerMovement,
} from "../../../lib/movementStore";

import "./Payments.css";


/* =========================================================
   SABİTLER
========================================================= */

const PAYMENT_STORAGE_KEY =
  "ren-erp-payments";

const ACCOUNT_STORAGE_KEY =
  "ren-erp-cash-bank-accounts";

const MOVEMENT_STORAGE_KEY =
  "ren-erp-cash-bank-movements";


const paymentMethods = [
  "Nakit",
  "Kredi Kartı",
  "Havale / EFT",
  "Çek",
  "Diğer",
];


/* =========================================================
   YARDIMCI
========================================================= */

function today() {
  return new Date()
    .toISOString()
    .slice(0, 10);
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
   PAYMENTS
========================================================= */

function getInitialPayments() {

  try {

    const saved =
      localStorage.getItem(
        PAYMENT_STORAGE_KEY
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
      "REN ERP ödemeleri okunamadı:",
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
        ACCOUNT_STORAGE_KEY
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
        MOVEMENT_STORAGE_KEY
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
   BELGE NUMARASI
========================================================= */

function createDocumentNumber(
  payments
) {

  const year =
    new Date().getFullYear();


  const numbers =
    payments
      .map(
        (item) => {

          const match =
            String(
              item.document ||
              ""
            ).match(
              /ÖDE-\d{4}-(\d+)/
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


  return `ÖDE-${year}-${String(
    nextNumber
  ).padStart(
    4,
    "0"
  )}`;
}


/* =========================================================
   COMPONENT
========================================================= */

export default function Payments() {

  const [
    customers,
    setCustomers,
  ] = useState(
    getCustomers
  );


  const [
    payments,
    setPayments,
  ] = useState(
    getInitialPayments
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
     TEDARİKÇİLER
  ======================================================= */

  const supplierList =
    useMemo(
      () =>
        customers.filter(
          (customer) =>
            customer.type ===
            "Tedarikçi"
        ),
      [customers]
    );


  /* =======================================================
     AKTİF FİNANS HESAPLARI
  ======================================================= */

  const usableAccounts =
    useMemo(
      () =>
        accounts.filter(
          (account) =>
            account.status !==
            "Pasif"
        ),
      [accounts]
    );


  /* =======================================================
     FİLTRE
  ======================================================= */

  const filteredPayments =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      return payments.filter(
        (item) => {

          const customerName =
            String(
              item.customerName ||
              ""
            ).toLocaleLowerCase(
              "tr-TR"
            );


          const document =
            String(
              item.document ||
              ""
            ).toLocaleLowerCase(
              "tr-TR"
            );


          const description =
            String(
              item.description ||
              ""
            ).toLocaleLowerCase(
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
      payments,
      search,
      methodFilter,
      dateFrom,
      dateTo,
    ]);


  /* =======================================================
     SEÇİLİ TEDARİKÇİ
  ======================================================= */

  const selectedSupplier =
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
    payments
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
    payments
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
    filteredPayments.reduce(
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

    };


  const openNewPayment =
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
     ÖDEME KAYDET
  ======================================================= */

  const savePayment =
    (event) => {

      event.preventDefault();


      if (
        !form.customerId
      ) {

        alert(
          "Lütfen tedarikçi seçin."
        );

        return;
      }


      if (
        !numericAmount ||
        numericAmount <= 0
      ) {

        alert(
          "Lütfen geçerli bir ödeme tutarı girin."
        );

        return;
      }


      if (
        !form.accountId
      ) {

        alert(
          "Lütfen hangi kasa veya banka hesabından ödeme yapıldığını seçin."
        );

        return;
      }


      const supplier =
        customers.find(
          (customer) =>
            String(
              customer.id
            ) ===
            String(
              form.customerId
            )
        );


      const account =
        accounts.find(
          (accountItem) =>
            String(
              accountItem.id
            ) ===
            String(
              form.accountId
            )
        );


      if (!supplier) {

        alert(
          "Tedarikçi bulunamadı."
        );

        return;
      }


      if (!account) {

        alert(
          "Seçilen finans hesabı bulunamadı."
        );

        return;
      }


      /*
       * BAKİYE KONTROLÜ
       *
       * Özellikle kasa/banka hesabında
       * mevcut paradan fazla çıkış
       * yapılmasını engelliyoruz.
       */

      const accountBalance =
        number(
          account.balance
        );


      if (
        numericAmount >
        accountBalance
      ) {

        const proceed =
          window.confirm(
            `${account.name} hesabında ${money(
              accountBalance
            )} TL bulunuyor.\n\n${money(
              numericAmount
            )} TL ödeme yapmak üzeresiniz.\n\nHesap bakiyesi eksiye düşebilir. Devam edilsin mi?`
          );


        if (!proceed) {
          return;
        }

      }


      /*
       * ÖDEME BELGESİ
       */

      const newPayment = {

        id:
          Date.now(),

        document:
          createDocumentNumber(
            payments
          ),

        customerId:
          supplier.id,

        customerName:
          supplier.name,

        customerCode:
          supplier.code ||
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
          `${form.method} ödeme`,

        source:
          "payment",

        createdAt:
          new Date().toISOString(),

      };


      const updatedPayments =
        [
          newPayment,
          ...payments,
        ];


      /*
       * TEDARİKÇİ CARİSİ
       *
       * Tedarikçiye borcumuzu
       * azalttığımız için
       * bakiye - ödeme
       */

      updateCustomerBalance(
        supplier.id,
        -numericAmount
      );


      /*
       * CARİ HAREKET
       */

      addCustomerMovement({

        id:
          `payment-${newPayment.id}`,

        customerId:
          supplier.id,

        customerName:
          supplier.name,

        date:
          form.date,

        document:
          newPayment.document,

        type:
          "Ödeme",

        description:
          newPayment.description,

        debt:
          numericAmount,

        credit:
          0,

        balance:
          null,

        method:
          newPayment.method,

        account:
          account.name,

        accountId:
          account.id,

        source:
          "payment",

      });


      /*
       * KASA / BANKA / POS
       *
       * PARA ÇIKIŞI
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
                    ) -
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
          `ODE-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,

        accountId:
          account.id,

        accountName:
          account.name,

        accountType:
          account.type,

        direction:
          "Çıkış",

        amount:
          numericAmount,

        description:
          `${newPayment.document} - ${supplier.name} ödemesi`,

        date:
          form.date,

        method:
          form.method,

        source:
          "payment",

        sourceId:
          newPayment.id,

        sourceDocument:
          newPayment.document,

        customerId:
          supplier.id,

        customerName:
          supplier.name,

        createdAt:
          new Date().toISOString(),

      };


      /*
       * KAYDET
       */

      localStorage.setItem(
        PAYMENT_STORAGE_KEY,
        JSON.stringify(
          updatedPayments
        )
      );


      saveAccounts(
        updatedAccounts
      );


      saveMovements([
        newMovement,
        ...currentMovements,
      ]);


      setPayments(
        updatedPayments
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
          "ren-payments-updated"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-cash-bank-updated"
        )
      );


      closeForm();


      alert(
        `${newPayment.document} numaralı ödeme kaydedildi.`
      );

    };


  /* =======================================================
     ÖDEME SİL
  ======================================================= */

  const deletePayment =
    (item) => {

      const confirmed =
        window.confirm(
          `${item.document} numaralı ödemeyi silmek istediğinize emin misiniz?\n\nTedarikçi cari bakiyesi ve finans hesabı geri alınacaktır.`
        );


      if (!confirmed) {
        return;
      }


      /*
       * TEDARİKÇİ CARİSİNİ GERİ AL
       */

      updateCustomerBalance(
        item.customerId,
        number(
          item.amount
        )
      );


      /*
       * FİNANS HESABINI GERİ AL
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
                    ) +
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
            !(
              movement.source ===
                "payment" &&
              String(
                movement.sourceId
              ) ===
                String(
                  item.id
                )
            )
        );


      /*
       * ÖDEMEYİ SİL
       */

      const updatedPayments =
        payments.filter(
          (payment) =>
            String(
              payment.id
            ) !==
            String(
              item.id
            )
        );


      localStorage.setItem(
        PAYMENT_STORAGE_KEY,
        JSON.stringify(
          updatedPayments
        )
      );


      saveAccounts(
        updatedAccounts
      );


      saveMovements(
        updatedMovements
      );


      setPayments(
        updatedPayments
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
          "ren-payments-updated"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-cash-bank-updated"
        )
      );

    };


  /* =======================================================
     FİLTRELER
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
    <div className="payment-page">

      <div className="payment-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="payment-header">

          <div>

            <div className="payment-breadcrumb">

              <span>
                Müşteri - Tedarikçi
              </span>

              <span>
                /
              </span>

              <strong>
                Ödeme
              </strong>

            </div>


            <h1>
              Ödeme
            </h1>


            <p>
              Tedarikçilere yapılan
              ödemeleri yönetin ve takip edin.
            </p>

          </div>


          <div className="payment-header-actions">

            <Link
              to="/customers"
              className="payment-secondary-button"
            >
              Hesap Listesi
            </Link>


            <button
              className="payment-primary-button"
              onClick={
                openNewPayment
              }
            >

              <span>
                +
              </span>

              Yeni Ödeme

            </button>

          </div>

        </div>


        {/* =================================================
            ÖZET
        ================================================= */}

        <div className="payment-summary">

          <div className="payment-summary-card">

            <span>
              BUGÜNKÜ ÖDEME
            </span>

            <strong>
              {money(
                todayTotal
              )}{" "}
              TL
            </strong>

          </div>


          <div className="payment-summary-card">

            <span>
              BU AY ÖDEME
            </span>

            <strong>
              {money(
                monthTotal
              )}{" "}
              TL
            </strong>

          </div>


          <div className="payment-summary-card">

            <span>
              FİLTRELENEN TOPLAM
            </span>

            <strong>
              {money(
                filteredTotal
              )}{" "}
              TL
            </strong>

          </div>


          <div className="payment-summary-card">

            <span>
              ÖDEME SAYISI
            </span>

            <strong>
              {
                filteredPayments.length
              }
            </strong>

          </div>

        </div>


        {/* =================================================
            ANA KART
        ================================================= */}

        <div className="payment-card">


          <div className="payment-toolbar">

            <div className="payment-search">

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
                placeholder="Tedarikçi, belge no veya açıklama ara..."
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
              className="payment-date"
            />


            <span className="payment-date-separator">
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
              className="payment-date"
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
              className="payment-filter"
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


            {(search ||
              methodFilter !==
                "Tümü" ||
              dateFrom ||
              dateTo) && (

              <button
                className="payment-clear"
                onClick={
                  clearFilters
                }
              >
                Temizle
              </button>

            )}

          </div>


          <div className="payment-result-bar">

            <span>

              <strong>
                {
                  filteredPayments.length
                }
              </strong>{" "}
              ödeme gösteriliyor

            </span>


            <span>

              Toplam{" "}

              <strong>
                {
                  payments.length
                }
              </strong>{" "}

              kayıt

            </span>

          </div>


          <div className="payment-table-wrapper">

            <table className="payment-table">

              <thead>

                <tr>

                  <th>
                    TEDARİKÇİ
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
                    HESAP
                  </th>

                  <th>
                    AÇIKLAMA
                  </th>

                  <th className="payment-money-head">
                    TUTAR
                  </th>

                  <th className="payment-actions-head">
                    İŞLEMLER
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredPayments.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="payment-empty"
                    >

                      <div>
                        ₺
                      </div>

                      <strong>
                        Ödeme bulunamadı
                      </strong>

                      <span>
                        Yeni ödeme ekleyebilir
                        veya filtreleri değiştirebilirsiniz.
                      </span>

                    </td>

                  </tr>

                ) : (

                  filteredPayments.map(
                    (
                      item
                    ) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>

                          <div className="payment-customer">

                            <span className="payment-avatar">

                              {String(
                                item.customerName ||
                                "T"
                              )
                                .charAt(
                                  0
                                )
                                .toUpperCase()}

                            </span>


                            <div>

                              <strong>
                                {
                                  item.customerName
                                }
                              </strong>

                              <small>
                                Tedarikçi
                              </small>

                            </div>

                          </div>

                        </td>


                        <td>

                          <strong className="payment-date-cell">
                            {
                              formatDate(
                                item.date
                              )
                            }
                          </strong>

                        </td>


                        <td>

                          <span className="payment-document">
                            {
                              item.document
                            }
                          </span>

                        </td>


                        <td>

                          <span className="payment-method">
                            {
                              item.method
                            }
                          </span>

                        </td>


                        <td>

                          <span className="payment-account">
                            {
                              item.account ||
                              "—"
                            }
                          </span>

                        </td>


                        <td>

                          <span className="payment-description">
                            {
                              item.description
                            }
                          </span>

                        </td>


                        <td className="payment-money">

                          <strong>
                            {
                              money(
                                item.amount
                              )
                            }{" "}
                            TL
                          </strong>

                        </td>


                        <td className="payment-actions">

                          <button
                            className="payment-more"
                            onClick={() =>
                              deletePayment(
                                item
                              )
                            }
                            title="Ödemeyi sil"
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


          <div className="payment-footer">

            <span>

              Toplam{" "}

              <strong>
                {
                  filteredPayments.length
                }
              </strong>{" "}

              ödeme

            </span>


            <span>
              25 / sayfa
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          YENİ ÖDEME MODALI
      ===================================================== */}

      {showForm && (

        <div
          className="payment-modal-overlay"
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

          <div className="payment-modal">


            <div className="payment-modal-header">

              <div>

                <span>
                  REN ERP
                </span>

                <h2>
                  Yeni Ödeme
                </h2>

                <p>
                  Tedarikçiye yapılan ödemeyi
                  cari ve finans hesabına kaydedin.
                </p>

              </div>


              <button
                className="payment-modal-close"
                onClick={
                  closeForm
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                savePayment
              }
            >

              <div className="payment-form-grid">


                {/* TEDARİKÇİ */}

                <div className="payment-form-field full">

                  <label>

                    Tedarikçi

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
                      Tedarikçi seçin
                    </option>


                    {supplierList.map(
                      (
                        supplier
                      ) => (

                        <option
                          key={
                            supplier.id
                          }
                          value={
                            supplier.id
                          }
                        >

                          {
                            supplier.code
                          }{" "}
                          —{" "}
                          {
                            supplier.name
                          }

                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* CARİ BAKİYESİ */}

                {selectedSupplier && (

                  <div className="payment-customer-balance">

                    <div>

                      <span>
                        MEVCUT CARİ BAKİYESİ
                      </span>


                      <strong
                        className={
                          selectedSupplier.balance >
                          0
                            ? "positive"
                            : selectedSupplier.balance <
                              0
                            ? "negative"
                            : ""
                        }
                      >

                        {
                          selectedSupplier.balance >
                          0
                            ? "Alacak "
                            : selectedSupplier.balance <
                              0
                            ? "Borç "
                            : ""
                        }


                        {
                          money(
                            selectedSupplier.balance
                          )
                        }{" "}
                        TL

                      </strong>

                    </div>


                    <div>

                      <span>
                        ÖDEME SONRASI
                      </span>


                      <strong
                        className={
                          selectedSupplier.balance -
                            numericAmount >
                          0
                            ? "positive"
                            : selectedSupplier.balance -
                                numericAmount <
                              0
                            ? "negative"
                            : ""
                        }
                      >

                        {
                          selectedSupplier.balance -
                            numericAmount >
                          0
                            ? "Alacak "
                            : selectedSupplier.balance -
                                numericAmount <
                              0
                            ? "Borç "
                            : ""
                        }


                        {
                          money(
                            selectedSupplier.balance -
                              numericAmount
                          )
                        }{" "}
                        TL

                      </strong>

                    </div>

                  </div>

                )}


                {/* TARİH */}

                <div className="payment-form-field">

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

                <div className="payment-form-field">

                  <label>

                    Ödeme Tutarı

                    <span>
                      *
                    </span>

                  </label>


                  <div className="payment-money-input">

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

                <div className="payment-form-field">

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


                {/* GERÇEK HESAP */}

                <div className="payment-form-field">

                  <label>

                    Ödeme Hesabı

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
                      Kasa / banka / POS seçin
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
                      bölümünden bir Kasa veya Banka hesabı
                      oluşturun.
                    </small>

                  )}

                </div>


                {/* AÇIKLAMA */}

                <div className="payment-form-field full">

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
                    placeholder="Ödeme açıklaması..."
                    rows="3"
                  />

                </div>

              </div>


              <div className="payment-modal-footer">

                <button
                  type="button"
                  className="payment-modal-cancel"
                  onClick={
                    closeForm
                  }
                >
                  Vazgeç
                </button>


                <button
                  type="submit"
                  className="payment-modal-save"
                >
                  Ödemeyi Kaydet
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}