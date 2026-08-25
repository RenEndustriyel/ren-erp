import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdArrowBack,
  MdContentCopy,
  MdDeleteOutline,
  MdEdit,
  MdMoreVert,
  MdPrint,
  MdReceiptLong,
} from "react-icons/md";

import {
  deleteInvoice,
  getInvoiceById,
} from "../../../lib/invoiceStore";

import "./InvoiceDetail.css";


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


function dateFormat(value) {

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
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(
    date
  );
}


function getInvoiceType(invoice) {

  const type =
    invoice?.type ||
    "";

  if (
    type === "purchase" ||
    type === "purchases"
  ) {
    return "purchase";
  }

  if (
    type === "return" ||
    type === "sales-return" ||
    type === "purchase-return" ||
    type === "returnInvoice"
  ) {
    return "return";
  }

  return "sales";
}


function getTypeLabel(invoice) {

  const type =
    getInvoiceType(
      invoice
    );

  if (
    type === "purchase"
  ) {
    return "Alış Faturası";
  }

  if (
    type === "return"
  ) {
    return "İade Faturası";
  }

  return "Satış Faturası";
}


function getStatus(invoice) {

  if (
    invoice?.status ===
    "İptal"
  ) {
    return {
      label: "İptal",
      className: "cancelled",
    };
  }

  if (
    invoice?.status ===
    "Onaylandı"
  ) {
    return {
      label: "Onaylandı",
      className: "approved",
    };
  }

  if (
    invoice?.paymentStatus ===
      "Tahsil Edildi" ||
    invoice?.paymentStatus ===
      "Ödendi"
  ) {
    return {
      label:
        invoice.paymentStatus,
      className: "paid",
    };
  }

  return {
    label:
      invoice?.status ||
      invoice?.paymentStatus ||
      "Taslak",
    className: "draft",
  };
}


function getCustomerName(invoice) {

  return (
    invoice?.customerName ||
    invoice?.supplierName ||
    "Cari belirtilmemiş"
  );

}


/* =========================================================
   COMPONENT
========================================================= */

export default function InvoiceDetail() {

  const [
    invoice,
    setInvoice,
  ] = useState(null);

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =======================================================
     URL ID
  ======================================================= */

  const invoiceId =
    useMemo(() => {

      const params =
        new URLSearchParams(
          window.location.search
        );

      return params.get(
        "id"
      );

    }, []);


  /* =======================================================
     YÜKLE
  ======================================================= */

  const loadInvoice =
    () => {

      if (!invoiceId) {

        setInvoice(
          null
        );

        setLoading(
          false
        );

        return;
      }

      const result =
        getInvoiceById(
          invoiceId
        );

      setInvoice(
        result || null
      );

      setLoading(
        false
      );

    };


  useEffect(() => {

    loadInvoice();

    const listener =
      () =>
        loadInvoice();

    window.addEventListener(
      "ren-invoices-changed",
      listener
    );

    return () => {

      window.removeEventListener(
        "ren-invoices-changed",
        listener
      );

    };

  }, [invoiceId]);


  /* =======================================================
     SATIRLAR
  ======================================================= */

  const items =
    useMemo(() => {

      if (
        !invoice
      ) {
        return [];
      }

      if (
        Array.isArray(
          invoice.items
        )
      ) {
        return invoice.items;
      }

      if (
        Array.isArray(
          invoice.lines
        )
      ) {
        return invoice.lines;
      }

      return [];

    }, [
      invoice,
    ]);


  /* =======================================================
     HESAPLAMALAR
  ======================================================= */

  const totals =
    useMemo(() => {

      if (!invoice) {

        return {
          subtotal: 0,
          discount: 0,
          vat: 0,
          total: 0,
        };

      }


      const subtotal =
        Number(
          invoice.subtotal ||
          invoice.subTotal ||
          invoice.netTotal ||
          0
        );


      const discount =
        Number(
          invoice.discountTotal ||
          invoice.discount ||
          0
        );


      const vat =
        Number(
          invoice.vatTotal ||
          invoice.kdvTotal ||
          invoice.taxTotal ||
          invoice.vat ||
          0
        );


      const total =
        Number(
          invoice.total ||
          invoice.grandTotal ||
          invoice.amount ||
          0
        );


      return {
        subtotal,
        discount,
        vat,
        total,
      };

    }, [
      invoice,
    ]);


  /* =======================================================
     GERİ
  ======================================================= */

  const handleBack =
    () => {

      window.history.back();

    };


  /* =======================================================
     DÜZENLE
  ======================================================= */

  const handleEdit =
    () => {

      if (!invoice) {
        return;
      }

      window.location.href =
        `/invoices/edit?id=${encodeURIComponent(
          invoice.id
        )}`;

    };


  /* =======================================================
     YAZDIR
  ======================================================= */

  const handlePrint =
    () => {

      window.print();

    };


  /* =======================================================
     KOPYALA
  ======================================================= */

  const handleCopy =
    async () => {

      if (!invoice) {
        return;
      }

      const text =
        [
          `Fatura No: ${invoice.invoiceNo || "-"}`,
          `Tarih: ${dateFormat(invoice.date)}`,
          `Cari: ${getCustomerName(invoice)}`,
          `Toplam: ₺${money(totals.total)}`,
        ].join(
          "\n"
        );


      try {

        await navigator.clipboard.writeText(
          text
        );

        window.alert(
          "Fatura bilgileri kopyalandı."
        );

      } catch {

        window.alert(
          "Fatura bilgileri kopyalanamadı."
        );

      }

    };


  /* =======================================================
     SİL
  ======================================================= */

  const handleDelete =
    () => {

      if (!invoice) {
        return;
      }

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

      window.location.href =
        "/invoices";

    };


  /* =======================================================
     YÜKLENİYOR
  ======================================================= */

  if (loading) {

    return (
      <div className="ren-invoice-detail-loading">

        Fatura yükleniyor...

      </div>
    );

  }


  /* =======================================================
     BULUNAMADI
  ======================================================= */

  if (!invoice) {

    return (
      <div className="ren-invoice-detail">

        <div className="ren-invoice-not-found">

          <div className="ren-invoice-not-found-icon">

            <MdReceiptLong />

          </div>

          <h2>
            Fatura bulunamadı
          </h2>

          <p>
            Görüntülemek istediğiniz fatura
            bulunamadı veya silinmiş olabilir.
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.href =
                "/invoices"
            }
          >

            <MdArrowBack />

            Faturalara Dön

          </button>

        </div>

      </div>
    );

  }


  const status =
    getStatus(
      invoice
    );

  const typeLabel =
    getTypeLabel(
      invoice
    );

  const customerName =
    getCustomerName(
      invoice
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="ren-invoice-detail">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="ren-invoice-detail-header">

        <div>

          <button
            type="button"
            className="ren-invoice-detail-back"
            onClick={
              handleBack
            }
          >

            <MdArrowBack />

            Faturalara Dön

          </button>


          <div className="ren-invoice-detail-breadcrumb">

            <span>
              Faturalar
            </span>

            <span>
              ›
            </span>

            <strong>
              {typeLabel}
            </strong>

          </div>


          <div className="ren-invoice-title-row">

            <div>

              <h1>
                {
                  invoice.invoiceNo ||
                  "Fatura"
                }
              </h1>

              <span>
                {typeLabel}
              </span>

            </div>


            <span
              className={`ren-invoice-detail-status ${status.className}`}
            >

              <i />

              {
                status.label
              }

            </span>

          </div>

        </div>


        <div className="ren-invoice-detail-actions">

          <button
            type="button"
            onClick={
              handlePrint
            }
          >

            <MdPrint />

            Yazdır

          </button>


          <button
            type="button"
            onClick={
              handleCopy
            }
          >

            <MdContentCopy />

            Kopyala

          </button>


          <button
            type="button"
            className="primary"
            onClick={
              handleEdit
            }
          >

            <MdEdit />

            Düzenle

          </button>


          <div className="ren-invoice-more">

            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  !menuOpen
                )
              }
            >

              <MdMoreVert />

            </button>


            {menuOpen && (
              <div className="ren-invoice-more-menu">

                <button
                  type="button"
                  onClick={
                    handleDelete
                  }
                >

                  <MdDeleteOutline />

                  Faturayı Sil

                </button>

              </div>
            )}

          </div>

        </div>

      </header>


      {/* =================================================
          DOCUMENT
      ================================================= */}

      <main className="ren-invoice-document">

        {/* =================================================
            DOCUMENT HEADER
        ================================================= */}

        <section className="ren-invoice-document-head">

          <div className="ren-invoice-company">

            <div className="ren-invoice-company-mark">
              REN
            </div>

            <div>

              <strong>
                REN ERP
              </strong>

              <span>
                Endüstriyel Temizlik Ürünleri
              </span>

            </div>

          </div>


          <div className="ren-invoice-document-meta">

            <div>

              <span>
                Belge No
              </span>

              <strong>
                {
                  invoice.invoiceNo ||
                  "-"
                }
              </strong>

            </div>


            <div>

              <span>
                Fatura Tarihi
              </span>

              <strong>
                {
                  dateFormat(
                    invoice.date
                  )
                }
              </strong>

            </div>


            <div>

              <span>
                Vade Tarihi
              </span>

              <strong>
                {
                  dateFormat(
                    invoice.dueDate
                  )
                }
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            CUSTOMER
        ================================================= */}

        <section className="ren-invoice-parties">

          <div className="ren-invoice-party">

            <span className="ren-invoice-party-label">
              {getInvoiceType(invoice) ===
              "purchase"
                ? "TEDARİKÇİ"
                : "MÜŞTERİ"}
            </span>

            <strong>
              {customerName}
            </strong>

            <span>
              {
                invoice.customerCode ||
                invoice.supplierCode ||
                "Cari kodu belirtilmemiş"
              }
            </span>

            {invoice.taxNumber && (
              <span>
                Vergi No:
                {" "}
                {
                  invoice.taxNumber
                }
              </span>
            )}

          </div>


          <div className="ren-invoice-party">

            <span className="ren-invoice-party-label">
              ÖDEME BİLGİSİ
            </span>

            <strong>
              {
                invoice.paymentMethod ||
                "Vadeli"
              }
            </strong>

            <span>
              Ödeme Durumu:
              {" "}
              {
                invoice.paymentStatus ||
                status.label
              }
            </span>

            {invoice.dueDate && (
              <span>
                Vade:
                {" "}
                {
                  dateFormat(
                    invoice.dueDate
                  )
                }
              </span>
            )}

          </div>


          {invoice.referenceInvoiceNo && (
            <div className="ren-invoice-party">

              <span className="ren-invoice-party-label">
                REFERANS
              </span>

              <strong>
                {
                  invoice.referenceInvoiceNo
                }
              </strong>

              <span>
                Referans fatura numarası
              </span>

            </div>
          )}

        </section>


        {/* =================================================
            ITEMS
        ================================================= */}

        <section className="ren-invoice-items">

          <div className="ren-invoice-items-title">

            Ürün / Hizmet Detayları

          </div>


          <div className="ren-invoice-table-wrapper">

            <table className="ren-invoice-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    ÜRÜN / HİZMET
                  </th>

                  <th>
                    ADET
                  </th>

                  <th>
                    BİRİM
                  </th>

                  <th>
                    BİRİM FİYAT
                  </th>

                  <th>
                    İSKONTO
                  </th>

                  <th>
                    KDV
                  </th>

                  <th>
                    TOPLAM
                  </th>

                </tr>

              </thead>


              <tbody>

                {items.length >
                  0 &&
                  items.map(
                    (
                      item,
                      index
                    ) => {

                      const quantity =
                        Number(
                          item.quantity ||
                          item.qty ||
                          item.amount ||
                          0
                        );

                      const unitPrice =
                        Number(
                          item.unitPrice ||
                          item.price ||
                          0
                        );

                      const discount =
                        Number(
                          item.discount ||
                          item.discountAmount ||
                          0
                        );

                      const vat =
                        Number(
                          item.vatRate ||
                          item.kdvRate ||
                          0
                        );

                      const lineTotal =
                        Number(
                          item.total ||
                          item.lineTotal ||
                          (
                            quantity *
                            unitPrice
                          ) -
                            discount
                        );


                      return (
                        <tr
                          key={
                            item.id ||
                            index
                          }
                        >

                          <td>
                            {index + 1}
                          </td>

                          <td>

                            <div className="ren-invoice-product">

                              <strong>
                                {
                                  item.productName ||
                                  item.name ||
                                  item.description ||
                                  "Ürün"
                                }
                              </strong>

                              {item.code && (
                                <span>
                                  Kod:
                                  {" "}
                                  {
                                    item.code
                                  }
                                </span>
                              )}

                            </div>

                          </td>

                          <td>
                            {money(
                              quantity
                            )}
                          </td>

                          <td>
                            {
                              item.unit ||
                              "Adet"
                            }
                          </td>

                          <td>
                            ₺
                            {money(
                              unitPrice
                            )}
                          </td>

                          <td>
                            ₺
                            {money(
                              discount
                            )}
                          </td>

                          <td>
                            %
                            {money(
                              vat
                            )}
                          </td>

                          <td>

                            <strong>
                              ₺
                              {money(
                                lineTotal
                              )}
                            </strong>

                          </td>

                        </tr>
                      );

                    }
                  )}


                {items.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan={
                        8
                      }
                      className="ren-invoice-no-items"
                    >

                      Bu faturada ürün veya hizmet
                      satırı bulunmuyor.

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* =================================================
            TOTALS
        ================================================= */}

        <section className="ren-invoice-bottom">

          <div className="ren-invoice-note">

            <span>
              NOT
            </span>

            <p>
              {
                invoice.note ||
                "Bu fatura REN ERP tarafından oluşturulmuştur."
              }
            </p>

          </div>


          <div className="ren-invoice-totals">

            <div>

              <span>
                Ara Toplam
              </span>

              <strong>
                ₺
                {money(
                  totals.subtotal
                )}
              </strong>

            </div>


            <div>

              <span>
                İskonto
              </span>

              <strong>
                ₺
                {money(
                  totals.discount
                )}
              </strong>

            </div>


            <div>

              <span>
                KDV
              </span>

              <strong>
                ₺
                {money(
                  totals.vat
                )}
              </strong>

            </div>


            <div className="grand-total">

              <span>
                GENEL TOPLAM
              </span>

              <strong>
                ₺
                {money(
                  totals.total
                )}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="ren-invoice-document-footer">

          <span>
            REN ERP
          </span>

          <span>
            {
              invoice.createdAt
                ? `Oluşturulma: ${dateFormat(
                    String(
                      invoice.createdAt
                    ).slice(
                      0,
                      10
                    )
                  )}`
                : "Elektronik kayıt"
            }
          </span>

        </footer>

      </main>

    </div>
  );
}