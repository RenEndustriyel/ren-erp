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
  getReturnInvoices,
  deleteInvoice,
} from "../../../lib/invoiceStore";

import "./ReturnInvoices.css";


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


function getPartyName(invoice) {

  return (
    invoice.customerName ||
    invoice.supplierName ||
    "Cari belirtilmemiş"
  );
}


function getPartyCode(invoice) {

  return (
    invoice.customerCode ||
    invoice.supplierCode ||
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


export default function ReturnInvoices() {

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
      getReturnInvoices()
  );


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

            const party =
              getPartyName(
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


            const partyCode =
              getPartyCode(
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
              party.includes(
                query
              ) ||
              partyCode.includes(
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


  const handleNew =
    () => {

      window.location.href =
        "/invoices/new?type=return";

    };


  const handleEdit =
    (invoice) => {

      window.location.href =
        `/invoices/new?id=${encodeURIComponent(
          invoice.id
        )}`;

    };


  const handleDelete =
    (invoice) => {

      const confirmed =
        window.confirm(
          `${invoice.invoiceNo || "Bu iade faturası"} silinsin mi?`
        );


      if (!confirmed) {
        return;
      }


      deleteInvoice(
        invoice.id
      );


      setInvoices(
        getReturnInvoices()
      );

    };


  return (
    <div className="ren-return-invoices">


      {/* HEADER */}

      <header className="ren-return-invoices-header">

        <div>

          <button
            type="button"
            className="ren-return-invoices-back"
            onClick={() =>
              window.location.href =
                "/invoices"
            }
          >

            <MdArrowBack />

            Faturalara Dön

          </button>


          <div className="ren-return-invoices-breadcrumb">

            <span>
              Faturalar
            </span>

            <span>
              /
            </span>

            <strong>
              İade Faturaları
            </strong>

          </div>


          <h1>
            İade Faturaları
          </h1>


          <p>
            Satış veya alış işlemlerine ait iade
            faturalarını yönetin.
          </p>

        </div>


        <button
          type="button"
          className="ren-return-invoices-new"
          onClick={
            handleNew
          }
        >

          <MdAdd />

          Yeni İade Faturası

        </button>

      </header>


      {/* SUMMARY */}

      <section className="ren-return-invoices-summary">

        <div>

          <span>
            TOPLAM İADE
          </span>

          <strong>
            {filteredInvoices.length}
          </strong>

        </div>


        <div>

          <span>
            İADE TUTARI
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


      {/* TABLE CARD */}

      <section className="ren-return-invoices-card">


        {/* TOOLBAR */}

        <div className="ren-return-invoices-toolbar">

          <div className="ren-return-invoices-search">

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
              placeholder="İade fatura no, cari veya kod ara..."
            />

          </div>


          <div className="ren-return-invoices-filters">

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

        <div className="ren-return-invoices-table-wrapper">

          <table className="ren-return-invoices-table">

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
                  ORİJİNAL FATURA
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

                      <td>

                        <button
                          type="button"
                          className="ren-return-invoice-no"
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


                      <td>

                        <div className="ren-return-invoice-party">

                          <div className="ren-return-invoice-avatar">

                            {
                              getPartyName(
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
                                getPartyName(
                                  invoice
                                )
                              }
                            </strong>

                            <span>
                              {
                                getPartyCode(
                                  invoice
                                )
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      <td>

                        {
                          formatDate(
                            invoice.date
                          )
                        }

                      </td>


                      <td>

                        <span className="ren-return-original">

                          {
                            invoice.originalInvoiceNo ||
                            invoice.originalInvoiceId ||
                            "-"
                          }

                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            `ren-return-invoice-status ${
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


                      <td>

                        <strong className="ren-return-invoice-total">

                          ₺{money(
                            invoice.total
                          )}

                        </strong>

                      </td>


                      <td>

                        <div className="ren-return-invoice-actions">

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
                    colSpan="7"
                    className="ren-return-invoices-empty"
                  >

                    <div>

                      <MdReceiptLong />

                      <strong>
                        İade faturası bulunamadı
                      </strong>

                      <span>
                        Henüz iade faturası oluşturulmamış
                        veya seçtiğiniz filtrelere uygun kayıt yok.
                      </span>


                      <button
                        type="button"
                        onClick={
                          handleNew
                        }
                      >

                        <MdAdd />

                        Yeni İade Faturası

                      </button>

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

        <footer className="ren-return-invoices-footer">

          <span>
            Gösterilen:
            {" "}
            <strong>
              {filteredInvoices.length}
            </strong>
            {" "}
            iade faturası
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