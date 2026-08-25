import {
  useMemo,
  useState,
} from "react";

import {
  MdAdd,
  MdArrowBack,
  MdDeleteOutline,
  MdEdit,
  MdOpenInNew,
  MdSearch,
  MdReceiptLong,
} from "react-icons/md";

import {
  getSalesInvoices,
  deleteInvoice,
} from "../../../lib/invoiceStore";

import "./SalesInvoices.css";


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
    Number(value) || 0
  );
}


function formatDate(value) {

  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "tr-TR"
  ).format(
    date
  );
}


function getCustomerName(invoice) {

  return (
    invoice.customerName ||
    invoice.customer?.name ||
    "Cari belirtilmemiş"
  );
}


function getStatusClass(invoice) {

  if (
    invoice.status === "paid" ||
    invoice.paymentStatus === "Ödendi" ||
    invoice.paymentStatus === "Tahsil Edildi"
  ) {
    return "paid";
  }

  if (
    invoice.status === "cancelled" ||
    invoice.status === "canceled"
  ) {
    return "cancelled";
  }

  return "open";
}


function getStatusLabel(invoice) {

  const status =
    getStatusClass(
      invoice
    );

  if (
    status === "paid"
  ) {
    return "Ödendi";
  }

  if (
    status === "cancelled"
  ) {
    return "İptal";
  }

  return "Açık";
}


/* =========================================================
   COMPONENT
========================================================= */

export default function SalesInvoices() {

  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");


  const [
    invoices,
    setInvoices,
  ] = useState(
    () =>
      getSalesInvoices()
  );


  /* =========================================================
     FİLTRE
  ========================================================= */

  const filteredInvoices =
    useMemo(
      () => {

        const query =
          search
            .trim()
            .toLocaleLowerCase(
              "tr-TR"
            );


        return invoices.filter(
          (invoice) => {

            const customer =
              getCustomerName(
                invoice
              )
                .toLocaleLowerCase(
                  "tr-TR"
                );


            const invoiceNo =
              String(
                invoice.invoiceNo ||
                ""
              )
                .toLocaleLowerCase(
                  "tr-TR"
                );


            const matchesSearch =
              !query ||
              invoiceNo.includes(
                query
              ) ||
              customer.includes(
                query
              );


            const status =
              getStatusClass(
                invoice
              );


            const matchesStatus =
              statusFilter ===
                "all" ||
              status ===
                statusFilter;


            return (
              matchesSearch &&
              matchesStatus
            );

          }
        );

      },
      [
        invoices,
        search,
        statusFilter,
      ]
    );


  /* =========================================================
     TOPLAM
  ========================================================= */

  const total =
    filteredInvoices.reduce(
      (
        sum,
        invoice
      ) =>
        sum +
        (
          Number(
            invoice.total
          ) || 0
        ),
      0
    );


  /* =========================================================
     SİL
  ========================================================= */

  const handleDelete =
    (invoice) => {

      const confirmed =
        window.confirm(
          `${invoice.invoiceNo || "Bu fatura"} silinsin mi?`
        );


      if (!confirmed) {
        return;
      }


      deleteInvoice(
        invoice.id
      );


      setInvoices(
        getSalesInvoices()
      );

    };


  /* =========================================================
     DÜZENLE
  ========================================================= */

  const handleEdit =
    (invoice) => {

      window.location.href =
        `/invoices/new?id=${encodeURIComponent(
          invoice.id
        )}`;

    };


  /* =========================================================
     YENİ
  ========================================================= */

  const handleNew =
    () => {

      window.location.href =
        "/invoices/new?type=sales";

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="ren-sales-invoices">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ren-sales-invoices-header">

        <div>

          <button
            type="button"
            className="ren-sales-invoices-back"
            onClick={() =>
              window.location.href =
                "/invoices"
            }
          >

            <MdArrowBack />

            Faturalara Dön

          </button>


          <div className="ren-sales-invoices-breadcrumb">

            <span>
              Faturalar
            </span>

            <span>
              /
            </span>

            <strong>
              Satış Faturaları
            </strong>

          </div>


          <h1>
            Satış Faturaları
          </h1>


          <p>
            Müşterilerinize düzenlediğiniz satış
            faturalarını yönetin.
          </p>

        </div>


        <button
          type="button"
          className="ren-sales-invoices-new"
          onClick={
            handleNew
          }
        >

          <MdAdd />

          Yeni Satış Faturası

        </button>

      </header>


      {/* =====================================================
          ÖZET
      ===================================================== */}

      <section className="ren-sales-invoices-summary">

        <div>

          <span>
            TOPLAM FATURA
          </span>

          <strong>
            {filteredInvoices.length}
          </strong>

        </div>


        <div>

          <span>
            TOPLAM SATIŞ
          </span>

          <strong>
            ₺{money(
              total
            )}
          </strong>

        </div>


        <div>

          <span>
            ÖDENEN
          </span>

          <strong>
            {
              filteredInvoices.filter(
                (invoice) =>
                  getStatusClass(
                    invoice
                  ) ===
                  "paid"
              ).length
            }
          </strong>

        </div>


        <div>

          <span>
            AÇIK
          </span>

          <strong>
            {
              filteredInvoices.filter(
                (invoice) =>
                  getStatusClass(
                    invoice
                  ) ===
                  "open"
              ).length
            }
          </strong>

        </div>

      </section>


      {/* =====================================================
          TABLO KARTI
      ===================================================== */}

      <section className="ren-sales-invoices-card">


        {/* TOOLBAR */}

        <div className="ren-sales-invoices-toolbar">

          <div className="ren-sales-invoices-search">

            <MdSearch />

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
              placeholder="Fatura no veya cari ara..."
            />

          </div>


          <div className="ren-sales-invoices-filters">

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
            >

              <option value="all">
                Tüm Durumlar
              </option>

              <option value="paid">
                Ödendi
              </option>

              <option value="open">
                Açık
              </option>

              <option value="cancelled">
                İptal
              </option>

            </select>

          </div>

        </div>


        {/* TABLE */}

        <div className="ren-sales-invoices-table-wrapper">

          <table className="ren-sales-invoices-table">

            <thead>

              <tr>

                <th>
                  FATURA NO
                </th>

                <th>
                  CARİ
                </th>

                <th>
                  TARİH
                </th>

                <th>
                  VADE
                </th>

                <th>
                  ÖDEME
                </th>

                <th>
                  DURUM
                </th>

                <th>
                  TUTAR
                </th>

                <th>
                  İŞLEM
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredInvoices.length >
              0 ? (

                filteredInvoices.map(
                  (
                    invoice
                  ) => (

                    <tr
                      key={
                        invoice.id
                      }
                    >

                      {/* FATURA NO */}

                      <td>

                        <button
                          type="button"
                          className="ren-sales-invoice-no"
                          onClick={() =>
                            handleEdit(
                              invoice
                            )
                          }
                        >

                          <MdReceiptLong />

                          {
                            invoice.invoiceNo ||
                            "-"
                          }

                        </button>

                      </td>


                      {/* CARİ */}

                      <td>

                        <div className="ren-sales-invoice-customer">

                          <div className="ren-sales-invoice-avatar">

                            {
                              getCustomerName(
                                invoice
                              )
                                .charAt(
                                  0
                                )
                                .toLocaleUpperCase(
                                  "tr-TR"
                                )
                            }

                          </div>


                          <div>

                            <strong>
                              {
                                getCustomerName(
                                  invoice
                                )
                              }
                            </strong>

                            <span>
                              {
                                invoice.customerCode ||
                                "-"
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* TARİH */}

                      <td>

                        {
                          formatDate(
                            invoice.date
                          )
                        }

                      </td>


                      {/* VADE */}

                      <td>

                        {
                          formatDate(
                            invoice.dueDate
                          )
                        }

                      </td>


                      {/* ÖDEME */}

                      <td>

                        {
                          invoice.paymentMethod ||
                          "-"
                        }

                      </td>


                      {/* DURUM */}

                      <td>

                        <span
                          className={
                            `ren-sales-invoice-status ${
                              getStatusClass(
                                invoice
                              )
                            }`
                          }
                        >

                          {
                            getStatusLabel(
                              invoice
                            )
                          }

                        </span>

                      </td>


                      {/* TUTAR */}

                      <td>

                        <strong className="ren-sales-invoice-total">

                          ₺{money(
                            invoice.total
                          )}

                        </strong>

                      </td>


                      {/* İŞLEM */}

                      <td>

                        <div className="ren-sales-invoice-actions">

                          <button
                            type="button"
                            title="Düzenle"
                            onClick={() =>
                              handleEdit(
                                invoice
                              )
                            }
                          >

                            <MdEdit />

                          </button>


                          <button
                            type="button"
                            title="Detay"
                            onClick={() =>
                              handleEdit(
                                invoice
                              )
                            }
                          >

                            <MdOpenInNew />

                          </button>


                          <button
                            type="button"
                            className="danger"
                            title="Sil"
                            onClick={() =>
                              handleDelete(
                                invoice
                              )
                            }
                          >

                            <MdDeleteOutline />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="ren-sales-invoices-empty"
                  >

                    <div>

                      <MdReceiptLong />

                      <strong>
                        Satış faturası bulunamadı
                      </strong>

                      <span>
                        Henüz satış faturası oluşturulmamış
                        veya seçtiğiniz filtrelere uygun kayıt yok.
                      </span>


                      <button
                        type="button"
                        onClick={
                          handleNew
                        }
                      >

                        <MdAdd />

                        Yeni Satış Faturası

                      </button>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

        <footer className="ren-sales-invoices-footer">

          <span>
            Gösterilen:
            {" "}
            <strong>
              {filteredInvoices.length}
            </strong>
            {" "}
            fatura
          </span>


          <span>
            Toplam:
            {" "}
            <strong>
              ₺{money(
                total
              )}
            </strong>
          </span>

        </footer>

      </section>

    </div>
  );
}