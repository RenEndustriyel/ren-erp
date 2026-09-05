import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getCustomers,
  deleteCustomer as deleteCustomerFromStore,
} from "../../../lib/customerStore";

import "./CustomerList.css";


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
    Math.abs(
      Number(value) || 0
    )
  );
}


function getBalanceClass(
  balance
) {
  const value =
    Number(balance) || 0;

  if (
    value < 0
  ) {
    return "cari-money-borclu";
  }

  if (
    value > 0
  ) {
    return "cari-money-alacakli";
  }

  return "cari-money-zero";
}


function getBalanceLabel(
  balance
) {
  const value =
    Number(balance) || 0;

  if (
    value < 0
  ) {
    return "Borçlu";
  }

  if (
    value > 0
  ) {
    return "Alacaklı";
  }

  return "Bakiyesi Yok";
}


function customerName(
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


/* =========================================================
   COMPONENT
========================================================= */

export default function CustomerList() {

  const navigate =
    useNavigate();


  const [
    customers,
    setCustomers,
  ] = useState(
    () =>
      getCustomers() || []
  );


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
    balanceFilter,
    setBalanceFilter,
  ] = useState(
    "Tümü"
  );


  const [
    activeMenu,
    setActiveMenu,
  ] = useState(
    null
  );

  const [
    sortConfig,
    setSortConfig,
  ] = useState({
    key: null,
    direction: "asc",
  });


  /* =======================================================
     YENİLE
  ======================================================= */

  useEffect(() => {

    const refreshCustomers =
      () => {
        setCustomers(
          getCustomers() || []
        );
      };


    refreshCustomers();


    const events = [
      "ren-customers-updated",
      "ren-customer-movements-updated",
      "ren-invoices-updated",
      "ren-finance-updated",
    ];


    events.forEach(
      (eventName) => {

        window.addEventListener(
          eventName,
          refreshCustomers
        );

      }
    );


    return () => {

      events.forEach(
        (eventName) => {

          window.removeEventListener(
            eventName,
            refreshCustomers
          );

        }
      );

    };

  }, []);


  /* =======================================================
     FİLTRE
  ======================================================= */

  const filteredCustomers =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      return customers.filter(
        (customer) => {

          const name =
            customerName(
              customer
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


          const phone =
            String(
              customer.phone ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              );


          const matchesSearch =
            !query ||
            name.includes(
              query
            ) ||
            code.includes(
              query
            ) ||
            phone.includes(
              query
            );


          const matchesType =
            typeFilter ===
              "Tümü" ||
            customer.type ===
              typeFilter;


          let matchesBalance =
            true;


          if (
            balanceFilter ===
            "Borçlular"
          ) {

            matchesBalance =
              Number(
                customer.balance
              ) < 0;

          }


          if (
            balanceFilter ===
            "Alacaklılar"
          ) {

            matchesBalance =
              Number(
                customer.balance
              ) > 0;

          }


          if (
            balanceFilter ===
            "Bakiyesi Olmayanlar"
          ) {

            matchesBalance =
              Number(
                customer.balance
              ) === 0;

          }


          return (
            matchesSearch &&
            matchesType &&
            matchesBalance
          );

        }
      );

    }, [
      customers,
      search,
      typeFilter,
      balanceFilter,
    ]);


  /* =======================================================
     SIRALAMA
  ======================================================= */

  const getSortValue = (
    customer,
    key
  ) => {
    if (key === "account") {
      return customerName(customer).toLocaleLowerCase("tr-TR");
    }

    if (key === "type") {
      return String(customer?.type || "").toLocaleLowerCase("tr-TR");
    }

    if (key === "phone") {
      return String(customer?.phone || "").toLocaleLowerCase("tr-TR");
    }

    if (key === "location") {
      return `${customer?.district || ""} ${customer?.city || ""}`.toLocaleLowerCase("tr-TR");
    }

    if (key === "balance") {
      return Number(customer?.balance) || 0;
    }

    if (key === "status") {
      return String(customer?.status || "Aktif").toLocaleLowerCase("tr-TR");
    }

    return "";
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) {
      return filteredCustomers;
    }

    return [...filteredCustomers].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue), "tr")
        : String(bValue).localeCompare(String(aValue), "tr");
    });
  }, [filteredCustomers, sortConfig]);

  /* =======================================================
     FİLTRE TEMİZLE
  ======================================================= */

  const clearFilters =
    () => {

      setSearch("");

      setTypeFilter(
        "Tümü"
      );

      setBalanceFilter(
        "Tümü"
      );

    };


  /* =======================================================
     DETAY
  ======================================================= */

  const openDetail =
    (customer) => {

      setActiveMenu(
        null
      );


      navigate(
        `/customers/detail?id=${encodeURIComponent(
          customer.id
        )}`,
        {
          state: {
            customer,
          },
        }
      );

    };


  /* =======================================================
     HAREKET
  ======================================================= */

  const openMovements =
    (customer) => {

      setActiveMenu(
        null
      );


      navigate(
        "/customers/movements",
        {
          state: {
            customer,
          },
        }
      );

    };


  /* =======================================================
     DÜZENLE
  ======================================================= */

  const openEdit =
    (customer) => {

      setActiveMenu(
        null
      );


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


  /* =======================================================
     SİL
  ======================================================= */

  const deleteCustomer =
    (customer) => {

      const confirmed =
        window.confirm(
          `"${customerName(
            customer
          )}" hesabını silmek istediğinize emin misiniz?`
        );


      if (!confirmed) {

        setActiveMenu(
          null
        );

        return;

      }


      deleteCustomerFromStore(
        customer.id
      );


      setCustomers(
        getCustomers() || []
      );


      setActiveMenu(
        null
      );

    };


  return (

    <div
      className="customer-list-page"
      onClick={() =>
        setActiveMenu(
          null
        )
      }
    >

      <div className="customer-list-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="customer-list-header">

          <div>

            <div className="customer-list-breadcrumb">

              <span>
                Müşteri - Tedarikçi
              </span>

              <span>
                /
              </span>

              <span>
                Hesap Listesi
              </span>

            </div>


            <h1>
              Hesap Listesi
            </h1>


            <p>
              Müşteri ve tedarikçi hesaplarınızı
              tek yerden yönetin.
            </p>

          </div>


          <button
            className="customer-new-button"
            onClick={() =>
              navigate(
                "/customers/new"
              )
            }
          >
            + Yeni Hesap
          </button>

        </div>


        {/* =================================================
            ÖZET
        ================================================= */}

        <div className="customer-summary">

          <div className="customer-summary-card">

            <span>
              TÜM HESAPLAR
            </span>

            <strong>
              {
                customers.length
              }
            </strong>

          </div>


          <div className="customer-summary-card">

            <span>
              MÜŞTERİLER
            </span>

            <strong>
              {
                customers.filter(
                  (item) =>
                    item.type ===
                    "Müşteri"
                ).length
              }
            </strong>

          </div>


          <div className="customer-summary-card">

            <span>
              TEDARİKÇİLER
            </span>

            <strong>
              {
                customers.filter(
                  (item) =>
                    item.type ===
                    "Tedarikçi"
                ).length
              }
            </strong>

          </div>


          <div className="customer-summary-card">

            <span>
              BORÇLU HESAPLAR
            </span>

            <strong className="cari-status-borclu">

              {
                customers.filter(
                  (item) =>
                    Number(
                      item.balance
                    ) < 0
                ).length
              }

            </strong>

          </div>

        </div>


        {/* =================================================
            LİSTE
        ================================================= */}

        <div className="customer-list-card">


          {/* FİLTRE */}

          <div className="customer-filter-area">

            <div className="customer-search">

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
                placeholder="Hesap adı, cari kodu veya telefon ara..."
              />


              {
                search && (

                  <button
                    type="button"
                    onClick={(
                      event
                    ) => {

                      event.stopPropagation();

                      setSearch("");

                    }}
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
              className="customer-filter-select"
            >

              <option value="Tümü">
                Tüm Hesaplar
              </option>

              <option value="Müşteri">
                Müşteriler
              </option>

              <option value="Tedarikçi">
                Tedarikçiler
              </option>

            </select>


            <select
              value={
                balanceFilter
              }
              onChange={(
                event
              ) =>
                setBalanceFilter(
                  event.target.value
                )
              }
              className="customer-filter-select"
            >

              <option value="Tümü">
                Tüm Bakiyeler
              </option>

              <option value="Borçlular">
                Borçlular
              </option>

              <option value="Alacaklılar">
                Alacaklılar
              </option>

              <option value="Bakiyesi Olmayanlar">
                Bakiyesi Olmayanlar
              </option>

            </select>


            {
              (
                search ||
                typeFilter !==
                  "Tümü" ||
                balanceFilter !==
                  "Tümü"
              ) && (

                <button
                  type="button"
                  className="customer-clear-button"
                  onClick={(
                    event
                  ) => {

                    event.stopPropagation();

                    clearFilters();

                  }}
                >
                  Temizle
                </button>

              )
            }

          </div>


          {/* SONUÇ */}

          <div className="customer-result-bar">

            <span>

              <strong>
                {
                  filteredCustomers.length
                }
              </strong>{" "}
              hesap gösteriliyor

            </span>


            <span>

              Toplam{" "}

              <strong>
                {
                  customers.length
                }
              </strong>{" "}

              hesap

            </span>

          </div>


          {/* =================================================
              TABLO
          ================================================= */}

          <div className="customer-table-wrapper">

            <table className="customer-table">

              <thead>

                <tr>

                  {[
                    ["account", "HESAP"],
                    ["type", "TÜR"],
                    ["phone", "TELEFON"],
                    ["location", "KONUM"],
                    ["balance", "BAKİYE"],
                    ["status", "DURUM"],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      className={
                        key === "balance"
                          ? "customer-money-head customer-sortable"
                          : "customer-sortable"
                      }
                      onClick={() => handleSort(key)}
                      title={`${label} sütununu sırala`}
                    >
                      <span className="customer-th-content">
                        {label}
                        <span className="customer-sort-icon">
                          {sortConfig.key === key
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : "↕"}
                        </span>
                      </span>
                    </th>
                  ))}

                  <th className="customer-actions-head">
                    İŞLEMLER
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  sortedCustomers.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="customer-empty"
                      >

                        <div>
                          ⌕
                        </div>

                        <strong>
                          Hesap bulunamadı
                        </strong>

                        <span>
                          Arama veya filtreleri
                          değiştirerek tekrar deneyin.
                        </span>

                      </td>

                    </tr>

                  ) : (

                    sortedCustomers.map(
                      (
                        customer
                      ) => {

                        const balanceClass =
                          getBalanceClass(
                            customer.balance
                          );


                        const balanceLabel =
                          getBalanceLabel(
                            customer.balance
                          );


                        return (

                          <tr
                            key={
                              customer.id
                            }

                            onClick={() =>
                              openDetail(
                                customer
                              )
                            }

                            style={{
                              cursor:
                                "pointer",
                            }}

                            title="Cari detayını aç"
                          >


                            {/* HESAP */}

                            <td>

                              <div className="customer-account">

                                <span
                                  className={
                                    customer.type ===
                                    "Tedarikçi"
                                      ? "customer-avatar supplier"
                                      : "customer-avatar"
                                  }
                                >

                                  {
                                    customerName(
                                      customer
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
                                      customerName(
                                        customer
                                      )
                                    }
                                  </strong>

                                  <small>
                                    {
                                      customer.code ||
                                      ""
                                    }
                                  </small>

                                </div>

                              </div>

                            </td>


                            {/* TÜR */}

                            <td>

                              <span
                                className={
                                  customer.type ===
                                  "Tedarikçi"
                                    ? "customer-type supplier"
                                    : "customer-type"
                                }
                              >
                                {
                                  customer.type
                                }
                              </span>

                            </td>


                            {/* TELEFON */}

                            <td>

                              {
                                customer.phone ||
                                "—"
                              }

                            </td>


                            {/* KONUM */}

                            <td>

                              <div className="customer-location">

                                <strong>
                                  {
                                    customer.district ||
                                    "—"
                                  }
                                </strong>

                                <small>
                                  {
                                    customer.city ||
                                    "—"
                                  }
                                </small>

                              </div>

                            </td>


                            {/* BAKİYE */}

                            <td className="customer-money">

                              <strong
                                className={
                                  balanceClass
                                }
                              >

                                {
                                  Number(
                                    customer.balance
                                  ) < 0
                                    ? "-"
                                    : Number(
                                        customer.balance
                                      ) > 0
                                    ? "+"
                                    : ""
                                }

                                {
                                  money(
                                    customer.balance
                                  )
                                } TL

                              </strong>


                              <div
                                className={
                                  balanceClass
                                }
                                style={{
                                  fontSize:
                                    "10px",
                                  marginTop:
                                    "3px",
                                }}
                              >

                                {
                                  balanceLabel
                                }

                              </div>

                            </td>


                            {/* DURUM */}

                            <td>

                              <span className="customer-status">

                                <i />

                                {
                                  customer.status ||
                                  "Aktif"
                                }

                              </span>

                            </td>


                            {/* İŞLEMLER */}

                            <td className="customer-actions">

                              <div
                                className="customer-action-wrapper"
                                onClick={(
                                  event
                                ) =>
                                  event.stopPropagation()
                                }
                              >

                                <button
                                  type="button"
                                  className="customer-more"
                                  onClick={(
                                    event
                                  ) => {

                                    event.stopPropagation();

                                    setActiveMenu(
                                      activeMenu ===
                                        customer.id
                                        ? null
                                        : customer.id
                                    );

                                  }}
                                  title="İşlemler"
                                >
                                  ⋮
                                </button>


                                {
                                  activeMenu ===
                                  customer.id && (

                                    <div
                                      className="customer-row-menu"
                                      onClick={(
                                        event
                                      ) =>
                                        event.stopPropagation()
                                      }
                                    >

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openDetail(
                                            customer
                                          )
                                        }
                                      >
                                        <span>
                                          ↗
                                        </span>

                                        Detay

                                      </button>


                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEdit(
                                            customer
                                          )
                                        }
                                      >
                                        <span>
                                          ✎
                                        </span>

                                        Düzenle

                                      </button>


                                      <button
                                        type="button"
                                        onClick={() =>
                                          openMovements(
                                            customer
                                          )
                                        }
                                      >
                                        <span>
                                          ₺
                                        </span>

                                        Cari Hareket

                                      </button>


                                      <div className="customer-menu-divider" />


                                      <button
                                        type="button"
                                        onClick={() => {

                                          setActiveMenu(
                                            null
                                          );

                                          navigate(
                                            "/customers/transfer",
                                            {
                                              state: {
                                                customer,
                                              },
                                            }
                                          );

                                        }}
                                      >
                                        <span>
                                          ⇄
                                        </span>

                                        Cari Virman

                                      </button>


                                      <div className="customer-menu-divider" />


                                      <button
                                        type="button"
                                        className="customer-delete"
                                        onClick={() =>
                                          deleteCustomer(
                                            customer
                                          )
                                        }
                                      >
                                        <span>
                                          ×
                                        </span>

                                        Sil

                                      </button>

                                    </div>

                                  )
                                }

                              </div>

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


          {/* FOOTER */}

          <div className="customer-list-footer">

            <span>

              Toplam{" "}

              <strong>
                {
                  filteredCustomers.length
                }
              </strong>{" "}

              hesap

            </span>


            <div className="customer-pagination">

              <button
                type="button"
                disabled
              >
                ‹
              </button>

              <button
                type="button"
                className="active"
              >
                1
              </button>

              <button
                type="button"
                disabled
              >
                ›
              </button>

            </div>


            <span>
              25 / sayfa
            </span>

          </div>

        </div>

      </div>

    </div>

  );
}