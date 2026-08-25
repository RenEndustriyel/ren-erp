import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  getCustomers,
} from "../../../lib/customerStore";

import {
  getAllCustomerMovements,
} from "../../../lib/movementStore";

import "./CustomerReports.css";

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(
    Math.abs(Number(value) || 0)
  );
}

export default function CustomerReports() {
  const [customers, setCustomers] =
    useState(getCustomers);

  const [movements, setMovements] =
    useState(
      getAllCustomerMovements
    );

  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("Tümü");

  useEffect(() => {
    const refresh = () => {
      setCustomers(
        getCustomers()
      );

      setMovements(
        getAllCustomerMovements()
      );
    };

    window.addEventListener(
      "ren-customers-updated",
      refresh
    );

    window.addEventListener(
      "ren-customer-movements-updated",
      refresh
    );

    window.addEventListener(
      "storage",
      refresh
    );

    return () => {
      window.removeEventListener(
        "ren-customers-updated",
        refresh
      );

      window.removeEventListener(
        "ren-customer-movements-updated",
        refresh
      );

      window.removeEventListener(
        "storage",
        refresh
      );
    };
  }, []);

  const reportData = useMemo(() => {
    return customers.map(
      (customer) => {
        const customerMovements =
          movements.filter(
            (movement) =>
              String(
                movement.customerId
              ) ===
              String(customer.id)
          );

        const debt =
          customerMovements.reduce(
            (total, movement) =>
              total +
              Number(
                movement.debt || 0
              ),
            0
          );

        const credit =
          customerMovements.reduce(
            (total, movement) =>
              total +
              Number(
                movement.credit || 0
              ),
            0
          );

        const balance =
          Number(
            customer.balance || 0
          );

        const collections =
          customerMovements
            .filter(
              (movement) =>
                movement.type ===
                "Tahsilat"
            )
            .reduce(
              (total, movement) =>
                total +
                Number(
                  movement.credit ||
                    0
                ),
              0
            );

        const payments =
          customerMovements
            .filter(
              (movement) =>
                movement.type ===
                "Ödeme"
            )
            .reduce(
              (total, movement) =>
                total +
                Number(
                  movement.debt ||
                    0
                ),
              0
            );

        const sales =
          customerMovements
            .filter(
              (movement) =>
                movement.type ===
                "Satış" ||
                movement.type ===
                "Fatura"
            )
            .reduce(
              (total, movement) =>
                total +
                Number(
                  movement.debt ||
                    0
                ),
              0
            );

        return {
          ...customer,
          debt,
          credit,
          balance,
          collections,
          payments,
          sales,
          movementCount:
            customerMovements.length,
        };
      }
    );
  }, [
    customers,
    movements,
  ]);

  const filteredData =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return reportData.filter(
        (customer) => {
          const matchesSearch =
            !query ||
            String(
              customer.name || ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query) ||
            String(
              customer.code || ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query);

          const matchesType =
            typeFilter === "Tümü" ||
            customer.type ===
              typeFilter;

          return (
            matchesSearch &&
            matchesType
          );
        }
      );
    }, [
      reportData,
      search,
      typeFilter,
    ]);

  const totals =
    useMemo(() => {
      return filteredData.reduce(
        (result, customer) => {
          result.debt +=
            customer.debt;

          result.credit +=
            customer.credit;

          result.sales +=
            customer.sales;

          result.collections +=
            customer.collections;

          result.payments +=
            customer.payments;

          result.balance +=
            customer.balance;

          return result;
        },
        {
          debt: 0,
          credit: 0,
          sales: 0,
          collections: 0,
          payments: 0,
          balance: 0,
        }
      );
    }, [filteredData]);

  const debtorCount =
    filteredData.filter(
      (customer) =>
        Number(
          customer.balance
        ) < 0
    ).length;

  const creditorCount =
    filteredData.filter(
      (customer) =>
        Number(
          customer.balance
        ) > 0
    ).length;

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("Tümü");
  };

  return (
    <div className="customer-reports-page">

      <div className="customer-reports-container">

        {/* HEADER */}

        <div className="customer-reports-header">

          <div>

            <div className="customer-reports-breadcrumb">

              <span>
                Müşteri - Tedarikçi
              </span>

              <span>
                /
              </span>

              <strong>
                Cari Raporlar
              </strong>

            </div>

            <h1>
              Cari Raporlar
            </h1>

            <p>
              Cari hesaplarınızın finansal
              durumunu tek ekrandan analiz edin.
            </p>

          </div>

          <Link
            to="/customers"
            className="customer-reports-secondary"
          >
            Hesap Listesi
          </Link>

        </div>


        {/* KPI */}

        <div className="customer-reports-summary">

          <div className="customer-report-card">

            <span>
              TOPLAM BORÇ
            </span>

            <strong className="debt">
              {money(totals.debt)} TL
            </strong>

          </div>


          <div className="customer-report-card">

            <span>
              TOPLAM ALACAK
            </span>

            <strong className="credit">
              {money(totals.credit)} TL
            </strong>

          </div>


          <div className="customer-report-card">

            <span>
              TOPLAM TAHSİLAT
            </span>

            <strong>
              {money(
                totals.collections
              )} TL
            </strong>

          </div>


          <div className="customer-report-card">

            <span>
              TOPLAM ÖDEME
            </span>

            <strong>
              {money(
                totals.payments
              )} TL
            </strong>

          </div>

        </div>


        {/* SECOND SUMMARY */}

        <div className="customer-reports-mini-summary">

          <div>

            <span>
              SATIŞ / FATURA
            </span>

            <strong>
              {money(
                totals.sales
              )} TL
            </strong>

          </div>

          <div>

            <span>
              CARİ SAYISI
            </span>

            <strong>
              {filteredData.length}
            </strong>

          </div>

          <div>

            <span>
              BORÇLU CARİ
            </span>

            <strong className="debt">
              {debtorCount}
            </strong>

          </div>

          <div>

            <span>
              ALACAKLI CARİ
            </span>

            <strong className="credit">
              {creditorCount}
            </strong>

          </div>

        </div>


        {/* MAIN CARD */}

        <div className="customer-reports-card">

          {/* TOOLBAR */}

          <div className="customer-reports-toolbar">

            <div className="customer-reports-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Cari adı veya cari kodu ara..."
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


            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="customer-reports-filter"
            >

              <option value="Tümü">
                Tüm Cari Tipleri
              </option>

              <option value="Müşteri">
                Müşteri
              </option>

              <option value="Tedarikçi">
                Tedarikçi
              </option>

            </select>


            {(search ||
              typeFilter !==
                "Tümü") && (

              <button
                className="customer-reports-clear"
                onClick={
                  clearFilters
                }
              >
                Temizle
              </button>

            )}

          </div>


          {/* RESULT */}

          <div className="customer-reports-result">

            <span>
              <strong>
                {
                  filteredData.length
                }
              </strong>{" "}
              cari raporlanıyor
            </span>

            <span>
              Bakiye toplamı:{" "}
              <strong>
                {money(
                  totals.balance
                )} TL
              </strong>
            </span>

          </div>


          {/* TABLE */}

          <div className="customer-reports-table-wrapper">

            <table className="customer-reports-table">

              <thead>

                <tr>

                  <th>
                    CARİ
                  </th>

                  <th>
                    TÜR
                  </th>

                  <th className="report-money-head">
                    BORÇ
                  </th>

                  <th className="report-money-head">
                    ALACAK
                  </th>

                  <th className="report-money-head">
                    TAHSİLAT
                  </th>

                  <th className="report-money-head">
                    ÖDEME
                  </th>

                  <th className="report-money-head">
                    BAKİYE
                  </th>

                  <th>
                    HAREKET
                  </th>

                  <th className="report-action-head">
                    İŞLEM
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredData.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="customer-reports-empty"
                    >

                      <div>
                        ▥
                      </div>

                      <strong>
                        Cari raporu bulunamadı
                      </strong>

                      <span>
                        Seçtiğiniz filtrelere
                        uygun cari hesap bulunmuyor.
                      </span>

                    </td>

                  </tr>

                ) : (

                  filteredData.map(
                    (customer) => (

                      <tr
                        key={
                          customer.id
                        }
                      >

                        <td>

                          <div className="report-customer">

                            <span className="report-avatar">
                              {String(
                                customer.name ||
                                  "?"
                              )
                                .charAt(0)
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
                                  customer.code ||
                                  "—"
                                }
                              </small>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span
                            className={
                              customer.type ===
                              "Müşteri"
                                ? "report-type customer"
                                : "report-type supplier"
                            }
                          >
                            {
                              customer.type ||
                              "—"
                            }
                          </span>

                        </td>


                        <td className="report-money">

                          {customer.debt >
                          0 ? (
                            <strong className="debt">
                              {money(
                                customer.debt
                              )} TL
                            </strong>
                          ) : (
                            <span>—</span>
                          )}

                        </td>


                        <td className="report-money">

                          {customer.credit >
                          0 ? (
                            <strong className="credit">
                              {money(
                                customer.credit
                              )} TL
                            </strong>
                          ) : (
                            <span>—</span>
                          )}

                        </td>


                        <td className="report-money">

                          {customer.collections >
                          0 ? (
                            <strong className="credit">
                              {money(
                                customer.collections
                              )} TL
                            </strong>
                          ) : (
                            <span>—</span>
                          )}

                        </td>


                        <td className="report-money">

                          {customer.payments >
                          0 ? (
                            <strong>
                              {money(
                                customer.payments
                              )} TL
                            </strong>
                          ) : (
                            <span>—</span>
                          )}

                        </td>


                        <td className="report-money">

                          {customer.balance !==
                          0 ? (

                            <strong
                              className={
                                customer.balance <
                                0
                                  ? "debt"
                                  : "credit"
                              }
                            >

                              {customer.balance <
                              0
                                ? "Borç "
                                : "Alacak "}

                              {money(
                                customer.balance
                              )} TL

                            </strong>

                          ) : (

                            <span className="neutral">
                              0,00 TL
                            </span>

                          )}

                        </td>


                        <td>

                          <span className="movement-count">
                            {
                              customer.movementCount
                            }
                          </span>

                        </td>


                        <td className="report-action">

                          <Link
                            to="/customers/detail"
                            state={{
                              customer,
                            }}
                            className="report-detail-button"
                          >
                            Detay
                          </Link>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>


          {/* FOOTER */}

          <div className="customer-reports-footer">

            <span>
              Toplam{" "}
              <strong>
                {
                  filteredData.length
                }
              </strong>{" "}
              cari
            </span>

            <span>
              REN ERP
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}