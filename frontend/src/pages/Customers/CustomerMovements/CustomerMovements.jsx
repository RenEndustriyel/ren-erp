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


function money(value) {

  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Math.abs(
      Number(
        value
      ) || 0
    )
  );

}


function formatDate(value) {

  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );

}


export default function CustomerMovements() {

  const location =
    useLocation();


  const [
    customers,
    setCustomers,
  ] = useState(
    getCustomers
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


  const refresh =
    () => {

      const freshCustomers =
        getCustomers();

      setCustomers(
        freshCustomers
      );


      if (
        selectedCustomerId !==
        "all"
      ) {

        setMovements(
          getCustomerMovementsWithBalance(
            selectedCustomerId
          )
        );

      } else {

        setMovements(
          []
        );

      }

    };


  useEffect(() => {

    refresh();


    const onRefresh =
      () => {

        setCustomers(
          getCustomers()
        );


        if (
          selectedCustomerId !==
          "all"
        ) {

          setMovements(
            getCustomerMovementsWithBalance(
              selectedCustomerId
            )
          );

        }

      };


    window.addEventListener(
      "ren-customers-updated",
      onRefresh
    );

    window.addEventListener(
      "ren-customer-movements-updated",
      onRefresh
    );

    window.addEventListener(
      "ren-invoices-updated",
      onRefresh
    );

    window.addEventListener(
      "ren-cash-bank-updated",
      onRefresh
    );

    window.addEventListener(
      "storage",
      onRefresh
    );


    return () => {

      window.removeEventListener(
        "ren-customers-updated",
        onRefresh
      );

      window.removeEventListener(
        "ren-customer-movements-updated",
        onRefresh
      );

      window.removeEventListener(
        "ren-invoices-updated",
        onRefresh
      );

      window.removeEventListener(
        "ren-cash-bank-updated",
        onRefresh
      );

      window.removeEventListener(
        "storage",
        onRefresh
      );

    };

  }, [
    selectedCustomerId,
  ]);


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


          const matchesFrom =
            !dateFrom ||
            String(
              movement.date ||
              ""
            ) >=
              dateFrom;


          const matchesTo =
            !dateTo ||
            String(
              movement.date ||
              ""
            ) <=
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


  const totalDebt =
    filteredMovements.reduce(
      (
        total,
        movement
      ) =>
        total +
        Number(
          movement.debt ||
          0
        ),
      0
    );


  const totalCredit =
    filteredMovements.reduce(
      (
        total,
        movement
      ) =>
        total +
        Number(
          movement.credit ||
          0
        ),
      0
    );


  const currentBalance =
    movements.length > 0
      ? movements[
          movements.length - 1
        ]?.balance || 0
      : 0;


  const currentStatus =
    selectedCustomer
      ? getCustomerStatus({
          ...selectedCustomer,
          balance:
            currentBalance,
        })
      : "";


  const currentStatusClass =
    selectedCustomer
      ? getCustomerStatusClass({
          ...selectedCustomer,
          balance:
            currentBalance,
        })
      : "";


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


        {/* HEADER */}

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


        {/* CARİ SEÇİMİ */}

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


          {
            selectedCustomer && (

              <div className="customer-movements-selected">

                <span className="customer-movements-selected-avatar">

                  {
                    String(
                      selectedCustomer.name ||
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()
                  }

                </span>


                <div>

                  <strong>
                    {
                      selectedCustomer.name
                    }
                  </strong>

                  <small>
                    {
                      selectedCustomer.code
                    }
                  </small>

                </div>

              </div>

            )
          }

        </div>


        {/* ÖZET */}

        <div className="customer-movements-summary">

          <div className="customer-movement-summary-card">

            <span>
              TOPLAM BORÇ
            </span>

            <strong className="debt">
              {
                money(
                  totalDebt
                )
              }{" "}
              TL
            </strong>

          </div>


          <div className="customer-movement-summary-card">

            <span>
              TOPLAM ALACAK
            </span>

            <strong className="credit">
              {
                money(
                  totalCredit
                )
              }{" "}
              TL
            </strong>

          </div>


          <div className="customer-movement-summary-card">

            <span>
              CARİ DURUMU
            </span>

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


            <small
              style={{
                display:
                  "block",
                marginTop:
                  "4px",
              }}
            >
              {
                money(
                  currentBalance
                )
              } TL
            </small>

          </div>


          <div className="customer-movement-summary-card">

            <span>
              HAREKET SAYISI
            </span>

            <strong>
              {
                filteredMovements.length
              }
            </strong>

          </div>

        </div>


        {/* ANA KART */}

        <div className="customer-movements-card">


          {/* FİLTRE */}

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


          {/* SONUÇ */}

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

                  Durum:{" "}

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
                        currentBalance
                      )
                    } TL
                  </strong>

                </span>

              )
            }

          </div>


          {/* TABLO */}

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
                        movement
                      ) => (

                        <tr
                          key={
                            movement.id
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
                                  movement.customerName
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
                                movement.type
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
                              Number(
                                movement.debt ||
                                0
                              ) > 0 ? (

                                <strong className="debt">

                                  {
                                    money(
                                      movement.debt
                                    )
                                  }{" "}
                                  TL

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
                              Number(
                                movement.credit ||
                                0
                              ) > 0 ? (

                                <strong className="credit">

                                  {
                                    money(
                                      movement.credit
                                    )
                                  }{" "}
                                  TL

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
                              movement.balance !==
                                null &&
                              movement.balance !==
                                undefined ? (

                                <strong
                                  className={
                                    Number(
                                      movement.balance
                                    ) < 0
                                      ? "debt"
                                      : Number(
                                          movement.balance
                                        ) > 0
                                      ? "credit"
                                      : "neutral"
                                  }
                                >

                                  {
                                    Number(
                                      movement.balance
                                    ) < 0
                                      ? "-"
                                      : ""
                                  }

                                  {
                                    money(
                                      movement.balance
                                    )
                                  }{" "}
                                  TL

                                </strong>

                              ) : (

                                <span>
                                  —
                                </span>

                              )
                            }

                          </td>

                        </tr>

                      )
                    )

                  )
                }

              </tbody>

            </table>

          </div>


          {/* FOOTER */}

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
              25 / sayfa
            </span>

          </div>

        </div>

      </div>

    </div>

  );

}