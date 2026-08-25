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
  MdReceiptLong,
  MdSearch,
} from "react-icons/md";

import {
  getPurchaseInvoices,
  deleteInvoice,
} from "../../../lib/invoiceStore";

import "./PurchaseInvoices.css";


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


function getSupplierName(invoice) {
  return (
    invoice.supplierName ||
    invoice.customerName ||
    invoice.supplier?.name ||
    "Tedarikçi belirtilmemiş"
  );
}


function getSupplierCode(invoice) {
  return (
    invoice.supplierCode ||
    invoice.customerCode ||
    "-"
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

export default function PurchaseInvoices() {

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
      getPurchaseInvoices()
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

            const supplier =
              getSupplierName(
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


            const supplierCode =
              getSupplierCode(
                invoice
              )
                .toLocaleLowerCase(
                  "tr-TR"
                );


            const matchesSearch =
              !query ||
              invoiceNo.includes(
                query
              ) ||
              supplier.includes(
                query
              ) ||
              supplierCode.includes(
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
        getPurchaseInvoices()
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
     YENİ ALIŞ
  ========================================================= */

  const handleNew =
    () => {

      window.location.href =
        "/invoices/new?type=purchase";

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="ren-purchase-invoices">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ren-purchase-invoices-header">

        <div>

          <button
            type="button"
            className="ren-purchase-invoices-back"
            onClick={() =>
              window.location.href =
                "/invoices"
            }
          >

            <MdArrowBack />

            Faturalara Dön

          </button>


          <div className="ren-purchase-invoices-breadcrumb">

            <span>
              Faturalar
            </span>

            <span>
              /
            </span>

            <strong>
              Alış Faturaları
            </strong>

          </div>


          <h1>
            Alış Faturaları
          </h1>


          <p>
            Tedarikçilerinizden aldığınız ürün ve
            hizmet faturalarını yönetin.
          </p>

        </div>


        <button
          type="button"
          className="ren-purchase-invoices-new"
          onClick={
            handleNew
          }
        >

          <MdAdd />

          Yeni Alış Faturası

        </button>

      </header>


      {/* =====================================================
          ÖZET
      ===================================================== */}

      <section className="ren-purchase-invoices-summary">

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
            TOPLAM ALIŞ
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
          TABLO
      ===================================================== */}

      <section className="ren-purchase-invoices-card">


        <div className="ren-purchase-invoices-toolbar">

          <div className="ren-purchase-invoices-search">

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
              placeholder="Fatura no, tedarikçi veya cari kodu ara..."
            />

          </div>


          <div className="ren-purchase-invoices-filters">

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


        <div className="ren-purchase-invoices-table-wrapper">

          <table className="ren-purchase-invoices-table">

            <thead>

              <tr>

                <th>
                  FATURA NO
                </th>

                <th>
                  TEDARİKÇİ
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
                          className="ren-purchase-invoice-no"
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


                      {/* TEDARİKÇİ */}

                      <td>

                        <div className="ren-purchase-invoice-supplier">

                          <div className="ren-purchase-invoice-avatar">

                            {
                              getSupplierName(
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
                                getSupplierName(
                                  invoice
                                )
                              }
                            </strong>

                            <span>
                              {
                                getSupplierCode(
                                  invoice
                                )
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
                            `ren-purchase-invoice-status ${
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

                        <strong className="ren-purchase-invoice-total">

                          ₺{money(
                            invoice.total
                          )}

                        </strong>

                      </td>


                      {/* AKSİYON */}

                      <td>

                        <div className="ren-purchase-invoice-actions">

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
                    className="ren-purchase-invoices-empty"
                  >

                    <div>

                      <MdReceiptLong />

                      <strong>
                        Alış faturası bulunamadı
                      </strong>

                      <span>
                        Henüz alış faturası oluşturulmamış
                        veya seçtiğiniz filtrelere uygun kayıt yok.
                      </span>


                      <button
                        type="button"
                        onClick={
                          handleNew
                        }
                      >

                        <MdAdd />

                        Yeni Alış Faturası

                      </button>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        <footer className="ren-purchase-invoices-footer">

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