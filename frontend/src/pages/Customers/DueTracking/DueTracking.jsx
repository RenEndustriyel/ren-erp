import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  getInvoices,
} from "../../../lib/invoiceStore";

import {
  getCustomers,
} from "../../../lib/customerStore";

import "./DueTracking.css";


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
  } else if (
    text.includes(",")
  ) {
    text =
      text.replace(",", ".");
  }

  const result =
    Number(text);

  return Number.isFinite(
    result
  )
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


function normalizeType(type) {
  const value =
    String(type || "")
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    value === "purchase" ||
    value === "purchases" ||
    value === "alış" ||
    value === "alis" ||
    value.includes("alış") ||
    value.includes("alis")
  ) {
    return "purchase";
  }

  if (
    value === "return" ||
    value === "returns" ||
    value === "iade" ||
    value.includes("iade")
  ) {
    return "return";
  }

  return "sales";
}


function normalizeDate(value) {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}


function formatDate(value) {
  const normalized =
    normalizeDate(value);

  if (!normalized) {
    return "—";
  }

  const date =
    new Date(
      `${normalized}T12:00:00`
    );

  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(
    date
  );
}


function getTodayString() {
  const date =
    new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    ),
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}


function getDayDifference(date) {
  const today =
    new Date(
      `${getTodayString()}T00:00:00`
    );

  const targetDate =
    new Date(
      `${date}T00:00:00`
    );

  if (
    Number.isNaN(
      targetDate.getTime()
    )
  ) {
    return 0;
  }

  return Math.round(
    (
      targetDate.getTime() -
      today.getTime()
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  );
}


function getStatus(days) {
  if (
    days < 0
  ) {
    return {
      label:
        "Gecikmiş",

      className:
        "due-status overdue",
    };
  }

  if (
    days === 0
  ) {
    return {
      label:
        "Bugün",

      className:
        "due-status today",
    };
  }

  if (
    days <= 7
  ) {
    return {
      label:
        "Yaklaşıyor",

      className:
        "due-status soon",
    };
  }

  return {
    label:
      "Planlandı",

    className:
      "due-status planned",
  };
}


function customerName(
  invoice,
  customer
) {
  return (
    customer?.name ||
    customer?.title ||
    customer?.companyName ||
    invoice?.customerName ||
    invoice?.supplierName ||
    "Cari belirtilmemiş"
  );
}


function customerId(
  invoice
) {
  return (
    invoice?.customerId ||
    invoice?.supplierId ||
    ""
  );
}


function customerType(
  invoice,
  customer
) {
  const raw =
    String(
      customer?.type ||
      ""
    )
      .trim()
      .toLocaleLowerCase(
        "tr-TR"
      );

  if (
    raw.includes(
      "tedarik"
    )
  ) {
    return "Tedarikçi";
  }

  return normalizeType(
    invoice?.type
  ) ===
    "purchase"
    ? "Tedarikçi"
    : "Müşteri";
}


function invoiceNumber(
  invoice
) {
  return (
    invoice?.invoiceNo ||
    invoice?.number ||
    invoice?.documentNo ||
    "-"
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function DueTracking() {

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
    statusFilter,
    setStatusFilter,
  ] = useState(
    "Tümü"
  );


  const [
    invoices,
    setInvoices,
  ] = useState(
    () =>
      getInvoices() || []
  );


  const [
    customers,
    setCustomers,
  ] = useState(
    () =>
      getCustomers() || []
  );


  /* =======================================================
     YENİLEME
  ======================================================= */

  const refresh =
    () => {

      setInvoices(
        getInvoices() || []
      );

      setCustomers(
        getCustomers() || []
      );

    };


  useEffect(() => {

    refresh();


    const events = [
      "ren-invoices-updated",
      "ren-customers-updated",
      "ren-customer-movements-updated",
      "ren-cash-bank-updated",
      "storage",
    ];


    events.forEach(
      (
        eventName
      ) => {

        window.addEventListener(
          eventName,
          refresh
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
            refresh
          );

        }
      );

    };

  }, []);


  /* =======================================================
     CARİ HARİTASI
  ======================================================= */

  const customerMap =
    useMemo(() => {

      const map =
        new Map();


      customers.forEach(
        (
          customer
        ) => {

          map.set(
            String(
              customer.id
            ),
            customer
          );

        }
      );


      return map;

    }, [
      customers,
    ]);


  /* =======================================================
     GERÇEK VADE KAYITLARI
  ======================================================= */

  const dueItems =
    useMemo(() => {

      return invoices
        .map(
          (
            invoice
          ) => {

            const type =
              normalizeType(
                invoice.type
              );


            /*
             * Sadece satış ve alış faturaları
             * vade takibine girer.
             */
            if (
              type !== "sales" &&
              type !== "purchase"
            ) {
              return null;
            }


            const dueDate =
              normalizeDate(
                invoice.dueDate
              );


            if (
              !dueDate
            ) {
              return null;
            }


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


            /*
             * Tamamen tahsil edilmiş /
             * ödenmiş faturayı gösterme.
             */
            if (
              remaining <=
              0
            ) {
              return null;
            }


            const id =
              customerId(
                invoice
              );


            const customer =
              customerMap.get(
                String(id)
              );


            const days =
              getDayDifference(
                dueDate
              );


            return {

              id:
                invoice.id,

              customer:
                customerName(
                  invoice,
                  customer
                ),

              customerId:
                id,

              type:
                type ===
                "purchase"
                  ? "Tedarikçi"
                  : "Müşteri",

              document:
                invoiceNumber(
                  invoice
                ),

              date:
                dueDate,

              amount:
                remaining,

              total,

              paid,

              days,

              status:
                getStatus(
                  days
                ),

              invoice,

            };

          }
        )
        .filter(
          Boolean
        )
        .sort(
          (
            a,
            b
          ) => {

            const dateA =
              a.date;

            const dateB =
              b.date;

            return dateA.localeCompare(
              dateB
            );

          }
        );

    }, [
      invoices,
      customerMap,
    ]);


  /* =======================================================
     FİLTRELENMİŞ
  ======================================================= */

  const filteredItems =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      return dueItems.filter(
        (
          item
        ) => {

          const matchesSearch =
            !query ||
            item.customer
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||
            item.document
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              );


          const matchesType =
            typeFilter ===
              "Tümü" ||
            item.type ===
              typeFilter;


          const matchesStatus =
            statusFilter ===
              "Tümü" ||
            item.status.label ===
              statusFilter;


          return (
            matchesSearch &&
            matchesType &&
            matchesStatus
          );

        }
      );

    }, [
      dueItems,
      search,
      typeFilter,
      statusFilter,
    ]);


  /* =======================================================
     ÖZETLER
  ======================================================= */

  const totalOpen =
    dueItems.reduce(
      (
        total,
        item
      ) =>
        total +
        item.amount,
      0
    );


  const overdueTotal =
    dueItems
      .filter(
        (
          item
        ) =>
          item.days <
          0
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.amount,
        0
      );


  const todayTotal =
    dueItems
      .filter(
        (
          item
        ) =>
          item.days ===
          0
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.amount,
        0
      );


  const nextSevenTotal =
    dueItems
      .filter(
        (
          item
        ) =>
          item.days >
            0 &&
          item.days <=
            7
      )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.amount,
        0
      );


  return (

    <div className="due-page">

      <div className="due-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="due-header">

          <div>

            <div className="due-breadcrumb">

              <span>
                Müşteri - Tedarikçi
              </span>

              <span>
                /
              </span>

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


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="due-summary">

          <div className="due-summary-card">

            <span>
              TOPLAM AÇIK VADESİZ
            </span>

            <strong>
              {
                money(
                  totalOpen
                )
              } TL
            </strong>

          </div>


          <div className="due-summary-card overdue-card">

            <span>
              TOPLAM GECİKEN
            </span>

            <strong>
              {
                money(
                  overdueTotal
                )
              } TL
            </strong>

          </div>


          <div className="due-summary-card today-card">

            <span>
              BUGÜN VADESİ GELEN
            </span>

            <strong>
              {
                money(
                  todayTotal
                )
              } TL
            </strong>

          </div>


          <div className="due-summary-card soon-card">

            <span>
              7 GÜN İÇİNDE
            </span>

            <strong>
              {
                money(
                  nextSevenTotal
                )
              } TL
            </strong>

          </div>

        </div>


        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div className="due-card">


          {/* TOOLBAR */}

          <div className="due-toolbar">

            <div className="due-search">

              <span>
                ⌕
              </span>


              <input
                type="text"
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
                placeholder="Cari veya belge no ara..."
              />


              {
                search && (

                  <button
                    type="button"
                    onClick={() =>
                      setSearch(
                        ""
                      )
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
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
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


            {
              (
                search ||
                typeFilter !== "Tümü" ||
                statusFilter !== "Tümü"
              ) && (

                <button
                  type="button"
                  className="due-clear"
                  onClick={() => {

                    setSearch(
                      ""
                    );

                    setTypeFilter(
                      "Tümü"
                    );

                    setStatusFilter(
                      "Tümü"
                    );

                  }}
                >
                  Temizle
                </button>

              )
            }

          </div>


          {/* RESULT BAR */}

          <div className="due-result-bar">

            <span>

              <strong>
                {
                  filteredItems.length
                }
              </strong>

              {" "}
              vade gösteriliyor

            </span>


            <span>

              Açık toplam:{" "}

              <strong>

                {
                  money(
                    filteredItems.reduce(
                      (
                        total,
                        item
                      ) =>
                        total +
                        item.amount,
                      0
                    )
                  )
                }

                {" "}
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

                {
                  filteredItems.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="due-empty"
                      >

                        <div>
                          ◷
                        </div>


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
                      (
                        item
                      ) => (

                        <tr
                          key={
                            item.id
                          }
                        >

                          {/* CARİ */}

                          <td>

                            <Link
                              to={
                                item.customerId
                                  ? `/customers/detail?id=${encodeURIComponent(
                                      item.customerId
                                    )}`
                                  : "/customers"
                              }
                              className="due-customer"
                              style={{
                                textDecoration:
                                  "none",
                              }}
                            >

                              <span className="due-avatar">

                                {
                                  item.customer
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()
                                }

                              </span>


                              <div>

                                <strong>
                                  {
                                    item.customer
                                  }
                                </strong>

                                <small>
                                  {
                                    item.type
                                  }
                                </small>

                              </div>

                            </Link>

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
                              {
                                item.type
                              }
                            </span>

                          </td>


                          {/* BELGE */}

                          <td>

                            <Link
                              to={
                                `/invoices/detail?id=${encodeURIComponent(
                                  item.invoice.id
                                )}`
                              }
                              className="due-document"
                              style={{
                                textDecoration:
                                  "none",
                              }}
                            >

                              {
                                item.document
                              }

                            </Link>

                          </td>


                          {/* TARİH */}

                          <td>

                            <strong className="due-date">

                              {
                                formatDate(
                                  item.date
                                )
                              }

                            </strong>

                          </td>


                          {/* DURUM */}

                          <td>

                            <div className="due-status-wrap">

                              <span
                                className={
                                  item.status.className
                                }
                              >

                                {
                                  item.status.label
                                }

                              </span>


                              <small>

                                {
                                  item.days < 0
                                    ? `${Math.abs(
                                        item.days
                                      )} gün gecikmiş`
                                    : item.days ===
                                      0
                                    ? "Vadesi bugün"
                                    : `${item.days} gün kaldı`
                                }

                              </small>

                            </div>

                          </td>


                          {/* TUTAR */}

                          <td className="due-money">

                            <strong
                              className={
                                item.days <
                                0
                                  ? "danger"
                                  : ""
                              }
                            >

                              {
                                money(
                                  item.amount
                                )
                              }

                              {" "}
                              TL

                            </strong>

                          </td>


                          {/* İŞLEM */}

                          <td className="due-actions">

                            <Link
                              to={
                                item.customerId
                                  ? `/customers/detail?id=${encodeURIComponent(
                                      item.customerId
                                    )}`
                                  : "/customers"
                              }
                              className="due-detail-button"
                            >

                              Cariyi Gör

                            </Link>

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

          <div className="due-footer">

            <span>

              Toplam{" "}

              <strong>
                {
                  filteredItems.length
                }
              </strong>

              {" "}
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