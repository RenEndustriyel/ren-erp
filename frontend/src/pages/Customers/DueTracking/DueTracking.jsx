import {
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import "./DueTracking.css";

const demoDueItems = [
  {
    id: 1,
    customer: "Akın Ambalaj",
    type: "Müşteri",
    document: "SAT-2026-0048",
    date: "2026-08-18",
    amount: 3250,
  },
  {
    id: 2,
    customer: "Yörsan Tedarik",
    type: "Tedarikçi",
    document: "ALI-2026-0031",
    date: "2026-08-15",
    amount: 5800,
  },
  {
    id: 3,
    customer: "ABC Gıda",
    type: "Müşteri",
    document: "SAT-2026-0045",
    date: "2026-08-20",
    amount: 4200,
  },
  {
    id: 4,
    customer: "Susurluk Cafe",
    type: "Müşteri",
    document: "SAT-2026-0042",
    date: "2026-08-24",
    amount: 1850,
  },
  {
    id: 5,
    customer: "Poyraz Gıda",
    type: "Tedarikçi",
    document: "ALI-2026-0028",
    date: "2026-08-27",
    amount: 6900,
  },
];

function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("tr-TR").format(
    new Date(`${value}T00:00:00`)
  );
}

function getDayDifference(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${date}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target - today) /
      (1000 * 60 * 60 * 24)
  );
}

function getStatus(days) {
  if (days < 0) {
    return {
      label: "Gecikmiş",
      className: "due-status overdue",
    };
  }

  if (days === 0) {
    return {
      label: "Bugün",
      className: "due-status today",
    };
  }

  if (days <= 7) {
    return {
      label: "Yaklaşıyor",
      className: "due-status soon",
    };
  }

  return {
    label: "Planlandı",
    className: "due-status planned",
  };
}

export default function DueTracking() {
  const [search, setSearch] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("Tümü");

  const [statusFilter, setStatusFilter] =
    useState("Tümü");

  const filteredItems = useMemo(() => {
    return demoDueItems.filter((item) => {
      const days = getDayDifference(
        item.date
      );

      const status =
        days < 0
          ? "Gecikmiş"
          : days === 0
          ? "Bugün"
          : days <= 7
          ? "Yaklaşıyor"
          : "Planlandı";

      const query =
        search
          .trim()
          .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !query ||
        item.customer
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        item.document
          .toLocaleLowerCase("tr-TR")
          .includes(query);

      const matchesType =
        typeFilter === "Tümü" ||
        item.type === typeFilter;

      const matchesStatus =
        statusFilter === "Tümü" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    search,
    typeFilter,
    statusFilter,
  ]);

  const totalOpen = demoDueItems.reduce(
    (total, item) =>
      total + item.amount,
    0
  );

  const overdueTotal =
    demoDueItems
      .filter(
        (item) =>
          getDayDifference(item.date) < 0
      )
      .reduce(
        (total, item) =>
          total + item.amount,
        0
      );

  const todayTotal =
    demoDueItems
      .filter(
        (item) =>
          getDayDifference(item.date) === 0
      )
      .reduce(
        (total, item) =>
          total + item.amount,
        0
      );

  const nextSevenTotal =
    demoDueItems
      .filter((item) => {
        const days = getDayDifference(
          item.date
        );

        return days > 0 && days <= 7;
      })
      .reduce(
        (total, item) =>
          total + item.amount,
        0
      );

  return (
    <div className="due-page">
      <div className="due-container">

        {/* HEADER */}

        <div className="due-header">
          <div>
            <div className="due-breadcrumb">
              <span>
                Müşteri - Tedarikçi
              </span>

              <span>/</span>

              <strong>
                Vade Takibi
              </strong>
            </div>

            <h1>
              Vade Takibi
            </h1>

            <p>
              Yaklaşan ve geciken cari
              vadeleri tek ekrandan takip edin.
            </p>
          </div>

          <Link
            to="/customers"
            className="due-secondary-button"
          >
            Hesap Listesi
          </Link>
        </div>


        {/* SUMMARY */}

        <div className="due-summary">

          <div className="due-summary-card">
            <span>
              TOPLAM AÇIK VADESİZ
            </span>

            <strong>
              {money(totalOpen)} TL
            </strong>
          </div>

          <div className="due-summary-card overdue-card">
            <span>
              TOPLAM GECİKEN
            </span>

            <strong>
              {money(overdueTotal)} TL
            </strong>
          </div>

          <div className="due-summary-card today-card">
            <span>
              BUGÜN VADESİ GELEN
            </span>

            <strong>
              {money(todayTotal)} TL
            </strong>
          </div>

          <div className="due-summary-card soon-card">
            <span>
              7 GÜN İÇİNDE
            </span>

            <strong>
              {money(nextSevenTotal)} TL
            </strong>
          </div>

        </div>


        {/* MAIN CARD */}

        <div className="due-card">

          {/* TOOLBAR */}

          <div className="due-toolbar">

            <div className="due-search">
              <span>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Cari veya belge no ara..."
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
              className="due-filter"
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


            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="due-filter"
            >
              <option value="Tümü">
                Tüm Durumlar
              </option>

              <option value="Gecikmiş">
                Gecikmiş
              </option>

              <option value="Bugün">
                Bugün
              </option>

              <option value="Yaklaşıyor">
                Yaklaşıyor
              </option>

              <option value="Planlandı">
                Planlandı
              </option>
            </select>


            {(search ||
              typeFilter !== "Tümü" ||
              statusFilter !== "Tümü") && (
              <button
                className="due-clear"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("Tümü");
                  setStatusFilter("Tümü");
                }}
              >
                Temizle
              </button>
            )}

          </div>


          {/* RESULT BAR */}

          <div className="due-result-bar">
            <span>
              <strong>
                {filteredItems.length}
              </strong>{" "}
              vade gösteriliyor
            </span>

            <span>
              Açık toplam:{" "}
              <strong>
                {money(
                  filteredItems.reduce(
                    (total, item) =>
                      total + item.amount,
                    0
                  )
                )}{" "}
                TL
              </strong>
            </span>
          </div>


          {/* TABLE */}

          <div className="due-table-wrapper">

            <table className="due-table">

              <thead>
                <tr>
                  <th>
                    CARİ
                  </th>

                  <th>
                    TÜR
                  </th>

                  <th>
                    BELGE NO
                  </th>

                  <th>
                    VADE TARİHİ
                  </th>

                  <th>
                    DURUM
                  </th>

                  <th className="due-money-head">
                    AÇIK TUTAR
                  </th>

                  <th className="due-actions-head">
                    İŞLEM
                  </th>
                </tr>
              </thead>


              <tbody>

                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="due-empty"
                    >
                      <div>◷</div>

                      <strong>
                        Vade bulunamadı
                      </strong>

                      <span>
                        Seçtiğiniz filtrelere
                        uygun kayıt bulunmuyor.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(
                    (item) => {
                      const days =
                        getDayDifference(
                          item.date
                        );

                      const status =
                        getStatus(days);

                      return (
                        <tr key={item.id}>

                          {/* CARİ */}

                          <td>
                            <div className="due-customer">

                              <span className="due-avatar">
                                {item.customer
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                              <div>
                                <strong>
                                  {item.customer}
                                </strong>

                                <small>
                                  {item.type}
                                </small>
                              </div>

                            </div>
                          </td>


                          {/* TÜR */}

                          <td>
                            <span
                              className={
                                item.type ===
                                "Müşteri"
                                  ? "due-type customer"
                                  : "due-type supplier"
                              }
                            >
                              {item.type}
                            </span>
                          </td>


                          {/* BELGE */}

                          <td>
                            <span className="due-document">
                              {item.document}
                            </span>
                          </td>


                          {/* TARİH */}

                          <td>
                            <strong className="due-date">
                              {formatDate(
                                item.date
                              )}
                            </strong>
                          </td>


                          {/* DURUM */}

                          <td>

                            <div className="due-status-wrap">

                              <span
                                className={
                                  status.className
                                }
                              >
                                {status.label}
                              </span>

                              <small>
                                {days < 0
                                  ? `${Math.abs(
                                      days
                                    )} gün gecikmiş`
                                  : days === 0
                                  ? "Vadesi bugün"
                                  : `${days} gün kaldı`}
                              </small>

                            </div>

                          </td>


                          {/* TUTAR */}

                          <td className="due-money">

                            <strong>
                              {money(
                                item.amount
                              )}{" "}
                              TL
                            </strong>

                          </td>


                          {/* İŞLEM */}

                          <td className="due-actions">

                            <Link
                              to="/customers/detail"
                              state={{
                                customer: {
                                  name: item.customer,
                                },
                              }}
                              className="due-detail-button"
                            >
                              Cariyi Gör
                            </Link>

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>


          {/* FOOTER */}

          <div className="due-footer">

            <span>
              Toplam{" "}
              <strong>
                {filteredItems.length}
              </strong>{" "}
              kayıt
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