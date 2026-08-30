import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  getCustomers,
  getCustomerStatus,
  getCustomerStatusClass,
} from "../../../lib/customerStore";

import {
  getCustomerMovementsWithBalance,
} from "../../../lib/movementStore";

import "./CustomerMovements.css";


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
  ).format(date);
}


/* =========================================================
   HAREKET TUTARI
========================================================= */

function getMovementAmount(
  movement
) {
  const debt =
    numberValue(
      movement?.debt
    );

  const credit =
    numberValue(
      movement?.credit
    );

  if (debt > 0) {
    return debt;
  }

  if (credit > 0) {
    return credit;
  }

  return numberValue(
    movement?.amount
  );
}


/* =========================================================
   CARİ HAREKET
========================================================= */

export default function CustomerMovements() {

  const location =
    useLocation();


  const [
    customers,
    setCustomers,
  ] = useState(
    () =>
      getCustomers() || []
  );


  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState(
    location.state?.customer?.id ||
    "all"
  );


  const [
    movements,
    setMovements,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    typeFilter,
    setTypeFilter,
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


  /* =======================================================
     YENİLE
  ======================================================= */

  const refresh =
    () => {

      const freshCustomers =
        getCustomers() || [];

      setCustomers(
        freshCustomers
      );


      if (
        selectedCustomerId !==
        "all"
      ) {

        const freshMovements =
          getCustomerMovementsWithBalance(
            selectedCustomerId
          ) || [];

        setMovements(
          Array.isArray(
            freshMovements
          )
            ? freshMovements
            : []
        );

      } else {

        setMovements(
          []
        );

      }

    };


  /* =======================================================
     EVENTLER
  ======================================================= */

  useEffect(() => {

    refresh();


    const onRefresh =
      () => {

        const freshCustomers =
          getCustomers() || [];

        setCustomers(
          freshCustomers
        );


        if (
          selectedCustomerId !==
          "all"
        ) {

          const freshMovements =
            getCustomerMovementsWithBalance(
              selectedCustomerId
            ) || [];

          setMovements(
            Array.isArray(
              freshMovements
            )
              ? freshMovements
              : []
          );

        }

      };


    const events = [
      "ren-customers-updated",
      "ren-customer-movements-updated",
      "ren-invoices-updated",
      "ren-cash-bank-updated",
      "ren-finance-updated",
    ];


    events.forEach(
      (eventName) => {

        window.addEventListener(
          eventName,
          onRefresh
        );

      }
    );


    return () => {

      events.forEach(
        (eventName) => {

          window.removeEventListener(
            eventName,
            onRefresh
          );

        }
      );

    };

  }, [
    selectedCustomerId,
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
          selectedCustomerId
        )
    );


  /* =======================================================
     FİLTRELENMİŞ HAREKETLER
  ======================================================= */

  const filteredMovements =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      return movements.filter(
        (movement) => {

          const matchesSearch =
            !query ||
            String(
              movement.customerName ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||
            String(
              movement.document ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||
            String(
              movement.description ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              );


          const matchesType =
            typeFilter ===
              "Tümü" ||
            movement.type ===
              typeFilter;


          const movementDate =
            String(
              movement.date ||
              ""
            ).slice(
              0,
              10
            );


          const matchesFrom =
            !dateFrom ||
            movementDate >=
              dateFrom;


          const matchesTo =
            !dateTo ||
            movementDate <=
              dateTo;


          return (
            matchesSearch &&
            matchesType &&
            matchesFrom &&
            matchesTo
          );

        }
      );

    }, [
      movements,
      search,
      typeFilter,
      dateFrom,
      dateTo,
    ]);


  /* =======================================================
     CARİ ÖZETLERİ
  ======================================================= */

  const summary =
    useMemo(() => {

      let totalDebt = 0;
      let totalCredit = 0;
      let totalCollection = 0;
      let totalPayment = 0;


      filteredMovements.forEach(
        (movement) => {

          const debt =
            numberValue(
              movement.debt
            );

          const credit =
            numberValue(
              movement.credit
            );

          totalDebt +=
            debt;

          totalCredit +=
            credit;


          if (
            movement.type ===
            "Tahsilat"
          ) {

            totalCollection +=
              getMovementAmount(
                movement
              );

          }


          if (
            movement.type ===
            "Ödeme"
          ) {

            totalPayment +=
              getMovementAmount(
                movement
              );

          }

        }
      );


      /*
        Cari kalan:

        Borç - Alacak

        Örnek:
        62.325 - 30.000
        = 32.325
      */

      const balance =
        totalDebt -
        totalCredit;


      return {
        totalDebt,
        totalCredit,
        totalCollection,
        totalPayment,
        balance,
      };

    }, [
      filteredMovements,
    ]);


  /* =======================================================
     CARİ DURUMU
  ======================================================= */

  const currentStatus =
    selectedCustomer
      ? getCustomerStatus({
          ...selectedCustomer,
          balance:
            summary.balance,
        })
      : "";


  const currentStatusClass =
    selectedCustomer
      ? getCustomerStatusClass({
          ...selectedCustomer,
          balance:
            summary.balance,
        })
      : "";


  /* =======================================================
     FİLTRE TEMİZLE
  ======================================================= */

  const clearFilters =
    () => {

      setSearch("");

      setTypeFilter(
        "Tümü"
      );

      setDateFrom("");

      setDateTo("");

    };


  return (

    <div className="customer-movements-page">

      <div className="customer-movements-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-movements-header">

          <div>

            <div className="customer-movements-breadcrumb">

              <span>
                Müşteri - Tedarikçi
              </span>

              <span>
                /
              </span>

              <strong>
                Cari Hareket
              </strong>

            </div>


            <h1>
              Cari Hareket
            </h1>


            <p>
              Cari hesapların tüm borç,
              alacak, tahsilat ve ödeme
              hareketlerini takip edin.
            </p>

          </div>


          <Link
            to="/customers"
            className="customer-movements-secondary"
          >
            Hesap Listesi
          </Link>

        </div>


        {/* =================================================
            CARİ SEÇİMİ
        ================================================= */}

        <div className="customer-movements-selector">

          <div className="customer-movements-selector-field">

            <label>
              Cari Hesap
            </label>


            <select
              value={
                selectedCustomerId
              }
              onChange={(
                event
              ) =>
                setSelectedCustomerId(
                  event.target.value
                )
              }
            >

              <option value="all">
                Tüm Cari Hesaplar
              </option>


              {customers.map(
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
                      customer.code ||
                      ""
                    }

                    {" — "}

                    {
                      customer.name ||
                      customer.title ||
                      customer.companyName ||
                      "Cari"
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {
            selectedCustomer && (

              <div className="customer-movements-selected">

                <span className="customer-movements-selected-avatar">

                  {
                    String(
                      selectedCustomer.name ||
                      selectedCustomer.title ||
                      "?"
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
                      selectedCustomer.name ||
                      selectedCustomer.title ||
                      selectedCustomer.companyName
                    }
                  </strong>

                  <small>
                    {
                      selectedCustomer.code ||
                      ""
                    }
                  </small>

                </div>

              </div>

            )
          }

        </div>


        {/* =================================================
            ÖZET KARTLARI
        ================================================= */}

        <div className="customer-movements-summary">


          {/* BORÇ */}

          <div className="customer-movement-summary-card">

            <span>
              TOPLAM BORÇ
            </span>

            <strong className="debt">

              {
                money(
                  summary.totalDebt
                )
              } TL

            </strong>

            <small>
              Faturalardan doğan borç
            </small>

          </div>


          {/* ALACAK */}

          <div className="customer-movement-summary-card">

            <span>
              TOPLAM ALACAK
            </span>

            <strong className="credit">

              {
                money(
                  summary.totalCredit
                )
              } TL

            </strong>

            <small>
              Cari lehine oluşan alacak
            </small>

          </div>


          {/* TAHSİLAT */}

          <div className="customer-movement-summary-card">

            <span>
              TOPLAM TAHSİLAT
            </span>

            <strong className="credit">

              {
                money(
                  summary.totalCollection
                )
              } TL

            </strong>

            <small>
              Müşteriden alınan
            </small>

          </div>


          {/* ÖDEME */}

          <div className="customer-movement-summary-card">

            <span>
              TOPLAM ÖDEME
            </span>

            <strong className="debt">

              {
                money(
                  summary.totalPayment
                )
              } TL

            </strong>

            <small>
              Tedarikçiye ödenen
            </small>

          </div>


          {/* KALAN */}

          <div className="customer-movement-summary-card">

            <span>
              KALAN CARİ
            </span>

            <strong
              className={
                summary.balance > 0
                  ? "debt"
                  : summary.balance < 0
                  ? "credit"
                  : "neutral"
              }
            >

              {
                summary.balance > 0
                  ? "-"
                  : summary.balance < 0
                  ? "+"
                  : ""
              }

              {
                money(
                  summary.balance
                )
              } TL

            </strong>

            <small>
              {
                summary.balance > 0
                  ? "Müşteriden alacak"
                  : summary.balance < 0
                  ? "Müşteriye borç"
                  : "Cari kapalı"
              }
            </small>

          </div>

        </div>


        {/* =================================================
            ANA KART
        ================================================= */}

        <div className="customer-movements-card">


          {/* TOOLBAR */}

          <div className="customer-movements-toolbar">

            <div className="customer-movements-search">

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
                placeholder="Belge no, açıklama veya cari ara..."
              />


              {
                search && (

                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    ×
                  </button>

                )
              }

            </div>


            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="customer-movements-filter"
            >

              <option value="Tümü">
                Tüm Hareketler
              </option>

              <option value="Satış">
                Satış
              </option>

              <option value="Tahsilat">
                Tahsilat
              </option>

              <option value="Alış">
                Alış
              </option>

              <option value="Ödeme">
                Ödeme
              </option>

              <option value="İade">
                İade
              </option>

              <option value="Virman">
                Virman
              </option>

              <option value="Açılış">
                Açılış
              </option>

            </select>


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
              className="customer-movements-date"
            />


            <span className="customer-movements-dash">
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
              className="customer-movements-date"
            />


            {
              (
                search ||
                typeFilter !==
                  "Tümü" ||
                dateFrom ||
                dateTo
              ) && (

                <button
                  type="button"
                  className="customer-movements-clear"
                  onClick={
                    clearFilters
                  }
                >
                  Temizle
                </button>

              )
            }

          </div>


          {/* SONUÇ BAR */}

          <div className="customer-movements-result">

            <span>

              <strong>
                {
                  filteredMovements.length
                }
              </strong>{" "}
              hareket gösteriliyor

            </span>


            {
              selectedCustomer && (

                <span>

                  Durum:

                  {" "}

                  <strong
                    className={
                      currentStatusClass
                    }
                  >
                    {
                      currentStatus ||
                      "Bakiyesi Yok"
                    }
                  </strong>

                  {" — "}

                  <strong>
                    {
                      money(
                        summary.balance
                      )
                    } TL
                  </strong>

                </span>

              )
            }

          </div>


          {/* =================================================
              TABLO
          ================================================= */}

          <div className="customer-movements-table-wrapper">

            <table className="customer-movements-table">

              <thead>

                <tr>

                  <th>
                    TARİH
                  </th>

                  <th>
                    CARİ
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

                  <th className="movement-money-head">
                    BORÇ
                  </th>

                  <th className="movement-money-head">
                    ALACAK
                  </th>

                  <th className="movement-money-head">
                    BAKİYE
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  filteredMovements.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="8"
                        className="customer-movements-empty"
                      >

                        <div>
                          ₺
                        </div>

                        <strong>
                          Cari hareket bulunamadı
                        </strong>

                        <span>
                          Seçtiğiniz cari hesapta
                          hareket bulunmuyor.
                        </span>

                      </td>

                    </tr>

                  ) : (

                    filteredMovements.map(
                      (
                        movement,
                        index
                      ) => {

                        const runningBalance =
                          filteredMovements
                            .slice(
                              0,
                              index + 1
                            )
                            .reduce(
                              (
                                balance,
                                current
                              ) =>
                                balance +
                                numberValue(
                                  current.debt
                                ) -
                                numberValue(
                                  current.credit
                                ),
                              0
                            );


                        return (

                          <tr
                            key={
                              movement.id ||
                              `${movement.document}-${index}`
                            }
                          >

                            <td>

                              <strong className="movement-date">

                                {
                                  formatDate(
                                    movement.date
                                  )
                                }

                              </strong>

                            </td>


                            <td>

                              <div className="movement-customer">

                                <span>

                                  {
                                    String(
                                      movement.customerName ||
                                      selectedCustomer?.name ||
                                      "?"
                                    )
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()
                                  }

                                </span>

                                <strong>

                                  {
                                    movement.customerName ||
                                    selectedCustomer?.name ||
                                    "Cari"
                                  }

                                </strong>

                              </div>

                            </td>


                            <td>

                              <span className="movement-document">

                                {
                                  movement.document ||
                                  "—"
                                }

                              </span>

                            </td>


                            <td>

                              <span
                                className={
                                  movement.type ===
                                  "Tahsilat"
                                    ? "movement-type collection"
                                    : movement.type ===
                                      "Ödeme"
                                    ? "movement-type payment"
                                    : "movement-type"
                                }
                              >

                                {
                                  movement.type ||
                                  "Hareket"
                                }

                              </span>

                            </td>


                            <td>

                              <span className="movement-description">

                                {
                                  movement.description ||
                                  "—"
                                }


                                {
                                  movement.method && (

                                    <small>
                                      {
                                        movement.method
                                      }
                                    </small>

                                  )
                                }

                              </span>

                            </td>


                            <td className="movement-money">

                              {
                                numberValue(
                                  movement.debt
                                ) > 0 ? (

                                  <strong className="debt">

                                    {
                                      money(
                                        movement.debt
                                      )
                                    } TL

                                  </strong>

                                ) : (

                                  <span>
                                    —
                                  </span>

                                )
                              }

                            </td>


                            <td className="movement-money">

                              {
                                numberValue(
                                  movement.credit
                                ) > 0 ? (

                                  <strong className="credit">

                                    {
                                      money(
                                        movement.credit
                                      )
                                    } TL

                                  </strong>

                                ) : (

                                  <span>
                                    —
                                  </span>

                                )
                              }

                            </td>


                            <td className="movement-money">

                              <strong
                                className={
                                  runningBalance > 0
                                    ? "debt"
                                    : runningBalance < 0
                                    ? "credit"
                                    : "neutral"
                                }
                              >

                                {
                                  runningBalance > 0
                                    ? "-"
                                    : runningBalance < 0
                                    ? "+"
                                    : ""
                                }

                                {
                                  money(
                                    runningBalance
                                  )
                                } TL

                              </strong>

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


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="customer-movements-footer">

            <span>

              Toplam{" "}

              <strong>
                {
                  filteredMovements.length
                }
              </strong>{" "}

              hareket

            </span>


            <span>

              Borç:

              {" "}

              <strong>
                {
                  money(
                    summary.totalDebt
                  )
                } TL
              </strong>

            </span>


            <span>

              Alacak:

              {" "}

              <strong>
                {
                  money(
                    summary.totalCredit
                  )
                } TL
              </strong>

            </span>

          </div>

        </div>

      </div>

    </div>

  );

}