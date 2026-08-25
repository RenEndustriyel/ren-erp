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

function getBalanceClass(balance) {
  const value =
    Number(balance) || 0;

  if (value < 0) {
    return "cari-money-borclu";
  }

  if (value > 0) {
    return "cari-money-alacakli";
  }

  return "cari-money-zero";
}

function getBalanceLabel(balance) {
  const value =
    Number(balance) || 0;

  if (value < 0) {
    return "Borçlu";
  }

  if (value > 0) {
    return "Alacaklı";
  }

  return "Bakiyesi Yok";
}

export default function CustomerList() {
  const navigate =
    useNavigate();

  const [
    customers,
    setCustomers,
  ] = useState(
    getCustomers
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
  ] = useState(null);

  useEffect(() => {
    const refreshCustomers =
      () => {
        setCustomers(
          getCustomers()
        );
      };

    window.addEventListener(
      "ren-customers-updated",
      refreshCustomers
    );

    return () => {
      window.removeEventListener(
        "ren-customers-updated",
        refreshCustomers
      );
    };
  }, []);

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
            String(
              customer.name ||
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

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("Tümü");
    setBalanceFilter("Tümü");
  };

  const openDetail = (
    customer
  ) => {
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

    setActiveMenu(null);
  };

  const openMovements = (
    customer
  ) => {
    navigate(
      "/customers/movements",
      {
        state: {
          customer,
        },
      }
    );

    setActiveMenu(null);
  };

  const openEdit = (
    customer
  ) => {
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

    setActiveMenu(null);
  };

  const deleteCustomer = (
    customer
  ) => {
    const confirmed =
      window.confirm(
        `"${customer.name}" hesabını silmek istediğinize emin misiniz?`
      );

    if (!confirmed) {
      setActiveMenu(null);
      return;
    }

    deleteCustomerFromStore(
      customer.id
    );

    setCustomers(
      getCustomers()
    );

    setActiveMenu(null);
  };

  return (
    <div
      className="customer-list-page"
      onClick={() =>
        setActiveMenu(null)
      }
    >
      <div className="customer-list-container">

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
              Müşteri ve tedarikçi
              hesaplarınızı tek
              yerden yönetin.
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

        <div className="customer-summary">

          <div className="customer-summary-card">
            <span>
              TÜM HESAPLAR
            </span>

            <strong>
              {customers.length}
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

        <div className="customer-list-card">

          <div className="customer-filter-area">

            <div className="customer-search">

              <span>
                ⌕
              </span>

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Hesap adı, cari kodu veya telefon ara..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}

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

            {(search ||
              typeFilter !==
                "Tümü" ||
              balanceFilter !==
                "Tümü") && (
              <button
                type="button"
                className="customer-clear-button"
                onClick={
                  clearFilters
                }
              >
                Temizle
              </button>
            )}

          </div>

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
                {customers.length}
              </strong>{" "}
              hesap
            </span>

          </div>

          <div className="customer-table-wrapper">

            <table className="customer-table">

              <thead>

                <tr>
                  <th>
                    HESAP
                  </th>

                  <th>
                    TÜR
                  </th>

                  <th>
                    TELEFON
                  </th>

                  <th>
                    KONUM
                  </th>

                  <th className="customer-money-head">
                    BAKİYE
                  </th>

                  <th>
                    DURUM
                  </th>

                  <th className="customer-actions-head">
                    İŞLEMLER
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredCustomers.length ===
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
                        Arama veya
                        filtreleri
                        değiştirerek
                        tekrar
                        deneyin.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(
                    (customer) => {

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
                        >

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
                                {String(
                                  customer.name ||
                                  "C"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </span>

                              <div>

                                <strong>
                                  {
                                    customer.name
                                  }
                                </strong>

                                <small>
                                  {
                                    customer.code
                                  }
                                </small>

                              </div>

                            </div>
                          </td>

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

                          <td>
                            {
                              customer.phone ||
                              "—"
                            }
                          </td>

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

                          <td className="customer-money">

                            <strong
                              className={
                                balanceClass
                              }
                            >
                              {Number(
                                customer.balance
                              ) < 0
                                ? "-"
                                : Number(
                                    customer.balance
                                  ) > 0
                                ? "+"
                                : ""}

                              {
                                money(
                                  customer.balance
                                )
                              }{" "}
                              TL
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

                          <td>

                            <span className="customer-status">

                              <i />

                              {
                                customer.status ||
                                "Aktif"
                              }

                            </span>

                          </td>

                          <td className="customer-actions">

                            <div className="customer-action-wrapper">

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
                              >
                                ⋮
                              </button>

                              {activeMenu ===
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

                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

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