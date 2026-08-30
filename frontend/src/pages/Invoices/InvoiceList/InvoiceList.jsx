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
  MdShoppingCart,
  MdLocalShipping,
  MdReplay,
} from "react-icons/md";

import {
  useNavigate,
} from "react-router-dom";

import {
  getInvoices,
  deleteInvoice,
} from "../../../lib/invoiceStore";

import "./InvoiceList.css";


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


  const text =
    String(value);


  const date =
    new Date(
      text.includes("T")
        ? text
        : `${text}T12:00:00`
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


function normalizeType(type) {

  const value =
    String(
      type || ""
    )
      .trim()
      .toLowerCase();


  if (
    value === "purchase" ||
    value === "purchases" ||
    value === "alış" ||
    value === "alis"
  ) {
    return "purchase";
  }


  if (
    value === "return" ||
    value === "returns" ||
    value === "iade"
  ) {
    return "return";
  }


  return "sales";

}


function getTypeLabel(type) {

  const normalized =
    normalizeType(
      type
    );


  if (
    normalized ===
    "purchase"
  ) {
    return "Alış";
  }


  if (
    normalized ===
    "return"
  ) {
    return "İade";
  }


  return "Satış";

}


function getTypeClass(type) {

  const normalized =
    normalizeType(
      type
    );


  if (
    normalized ===
    "purchase"
  ) {
    return "purchase";
  }


  if (
    normalized ===
    "return"
  ) {
    return "return";
  }


  return "sales";

}


function getCustomerName(
  invoice
) {

  return (
    invoice.customerName ||
    invoice.supplierName ||
    "Cari belirtilmemiş"
  );

}


function getCustomerCode(
  invoice
) {

  return (
    invoice.customerCode ||
    invoice.supplierCode ||
    "-"
  );

}


function getCustomerId(
  invoice
) {

  return (
    invoice.customerId ||
    invoice.supplierId ||
    ""
  );

}


function getStatusClass(
  invoice
) {

  if (
    invoice.status ===
      "paid" ||
    invoice.paymentStatus ===
      "Ödendi" ||
    invoice.paymentStatus ===
      "Tahsil Edildi"
  ) {
    return "paid";
  }


  if (
    invoice.status ===
      "cancelled" ||
    invoice.status ===
      "canceled" ||
    invoice.status ===
      "iptal"
  ) {
    return "cancelled";
  }


  return "open";

}


function getStatusLabel(
  invoice
) {

  const status =
    getStatusClass(
      invoice
    );


  if (
    status ===
    "paid"
  ) {
    return "Ödendi";
  }


  if (
    status ===
    "cancelled"
  ) {
    return "İptal";
  }


  return "Açık";

}


/* =========================================================
   COMPONENT
========================================================= */

export default function InvoiceList() {

  const navigate =
    useNavigate();


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    typeFilter,
    setTypeFilter,
  ] = useState(
    "all"
  );


  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "all"
  );


  const [
    invoices,
    setInvoices,
  ] = useState(
    () =>
      getInvoices() || []
  );


  /* =======================================================
     FİLTRE
  ======================================================= */

  const filteredInvoices =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      return invoices.filter(
        (
          invoice
        ) => {

          const invoiceNo =
            String(
              invoice.invoiceNo ||
              invoice.number ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              );


          const customer =
            getCustomerName(
              invoice
            )
              .toLocaleLowerCase(
                "tr-TR"
              );


          const code =
            getCustomerCode(
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
            customer.includes(
              query
            ) ||
            code.includes(
              query
            );


          const type =
            normalizeType(
              invoice.type
            );


          const matchesType =
            typeFilter ===
              "all" ||
            type ===
              typeFilter;


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
            matchesType &&
            matchesStatus
          );

        }
      );

    }, [
      invoices,
      search,
      typeFilter,
      statusFilter,
    ]);


  /* =======================================================
     ÖZET
  ======================================================= */

  const totalAmount =
    filteredInvoices.reduce(
      (
        total,
        invoice
      ) =>
        total +
        (
          Number(
            invoice.total
          ) || 0
        ),
      0
    );


  const salesCount =
    filteredInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) ===
        "sales"
    ).length;


  const purchaseCount =
    filteredInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) ===
        "purchase"
    ).length;


  const returnCount =
    filteredInvoices.filter(
      (invoice) =>
        normalizeType(
          invoice.type
        ) ===
        "return"
    ).length;


  /* =======================================================
     YENİ FATURA
  ======================================================= */

  const handleNewInvoice =
    () => {

      navigate(
        "/invoices/new"
      );

    };


  const handleNewByType =
    (type) => {

      navigate(
        `/invoices/new?type=${encodeURIComponent(
          type
        )}`
      );

    };


  /* =======================================================
     FATURA DETAYI
  ======================================================= */

  const handleDetail =
    (invoice) => {

      navigate(
        `/invoices/detail?id=${encodeURIComponent(
          invoice.id
        )}`
      );

    };


  /* =======================================================
     DÜZENLE
  ======================================================= */

  const handleEdit =
    (invoice) => {

      navigate(
        `/invoices/new?id=${encodeURIComponent(
          invoice.id
        )}`
      );

    };


  /* =======================================================
     CARİ DETAYI
  ======================================================= */

  const handleCustomerDetail =
    (invoice) => {

      const customerId =
        getCustomerId(
          invoice
        );


      if (!customerId) {

        return;

      }


      navigate(
        `/customers/detail?id=${encodeURIComponent(
          customerId
        )}`
      );

    };


  /* =======================================================
     SİL
  ======================================================= */

  const handleDelete =
    (invoice) => {

      const confirmed =
        window.confirm(
          `${
            invoice.invoiceNo ||
            "Bu fatura"
          } silinsin mi?`
        );


      if (!confirmed) {
        return;
      }


      deleteInvoice(
        invoice.id
      );


      setInvoices(
        getInvoices() ||
        []
      );

    };


  return (

    <div className="ren-invoice-list">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ren-invoice-list-header">

        <div>

          <button
            type="button"
            className="ren-invoice-list-back"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >

            <MdArrowBack />

            Ana Sayfa

          </button>


          <div className="ren-invoice-list-breadcrumb">

            <span>
              Finans
            </span>

            <span>
              /
            </span>

            <strong>
              Faturalar
            </strong>

          </div>


          <h1>
            Faturalar
          </h1>


          <p>
            Satış, alış ve iade faturalarınızı
            tek ekrandan yönetin.
          </p>

        </div>


        <button
          type="button"
          className="ren-invoice-list-new"
          onClick={
            handleNewInvoice
          }
        >

          <MdAdd />

          Yeni Fatura

        </button>

      </header>


      {/* =====================================================
          ÖZET
      ===================================================== */}

      <section className="ren-invoice-list-summary">


        <button
          type="button"
          className={
            `ren-invoice-summary-card ${
              typeFilter === "all"
                ? "active"
                : ""
            }`
          }
          onClick={() =>
            setTypeFilter(
              "all"
            )
          }
        >

          <div className="summary-icon">

            <MdReceiptLong />

          </div>


          <div>

            <span>
              TÜM FATURALAR
            </span>

            <strong>
              {
                filteredInvoices.length
              }
            </strong>

          </div>

        </button>


        <button
          type="button"
          className={
            `ren-invoice-summary-card ${
              typeFilter === "sales"
                ? "active"
                : ""
            }`
          }
          onClick={() =>
            setTypeFilter(
              "sales"
            )
          }
        >

          <div className="summary-icon">

            <MdShoppingCart />

          </div>


          <div>

            <span>
              SATIŞ
            </span>

            <strong>
              {
                salesCount
              }
            </strong>

          </div>

        </button>


        <button
          type="button"
          className={
            `ren-invoice-summary-card ${
              typeFilter === "purchase"
                ? "active"
                : ""
            }`
          }
          onClick={() =>
            setTypeFilter(
              "purchase"
            )
          }
        >

          <div className="summary-icon">

            <MdLocalShipping />

          </div>


          <div>

            <span>
              ALIŞ
            </span>

            <strong>
              {
                purchaseCount
              }
            </strong>

          </div>

        </button>


        <button
          type="button"
          className={
            `ren-invoice-summary-card ${
              typeFilter === "return"
                ? "active"
                : ""
            }`
          }
          onClick={() =>
            setTypeFilter(
              "return"
            )
          }
        >

          <div className="summary-icon">

            <MdReplay />

          </div>


          <div>

            <span>
              İADE
            </span>

            <strong>
              {
                returnCount
              }
            </strong>

          </div>

        </button>


      </section>


      {/* =====================================================
          HIZLI İŞLEMLER
      ===================================================== */}

      <section className="ren-invoice-list-quick">

        <button
          type="button"
          onClick={() =>
            handleNewByType(
              "sales"
            )
          }
        >

          <MdShoppingCart />

          <span>
            Yeni Satış Faturası
          </span>

        </button>


        <button
          type="button"
          onClick={() =>
            handleNewByType(
              "purchase"
            )
          }
        >

          <MdLocalShipping />

          <span>
            Yeni Alış Faturası
          </span>

        </button>


        <button
          type="button"
          onClick={() =>
            handleNewByType(
              "return"
            )
          }
        >

          <MdReplay />

          <span>
            Yeni İade Faturası
          </span>

        </button>

      </section>


      {/* =====================================================
          LİSTE
      ===================================================== */}

      <section className="ren-invoice-list-card">


        {/* TOOLBAR */}

        <div className="ren-invoice-list-toolbar">

          <div className="ren-invoice-list-search">

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
              placeholder="Fatura no, cari adı veya kodu ara..."
            />

          </div>


          <div className="ren-invoice-list-filters">

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
            >

              <option value="all">
                Tüm Fatura Türleri
              </option>

              <option value="sales">
                Satış Faturaları
              </option>

              <option value="purchase">
                Alış Faturaları
              </option>

              <option value="return">
                İade Faturaları
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


        {/* TABLO */}

        <div className="ren-invoice-list-table-wrapper">

          <table className="ren-invoice-list-table">

            <thead>

              <tr>

                <th>
                  FATURA NO
                </th>

                <th>
                  TÜR
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

              {
                filteredInvoices.length >
                0 ? (

                  filteredInvoices.map(
                    (
                      invoice
                    ) => {

                      const type =
                        normalizeType(
                          invoice.type
                        );


                      return (

                        <tr
                          key={
                            invoice.id
                          }
                        >


                          {/* FATURA NO */}

                          <td>

                            <button
                              type="button"
                              className="ren-invoice-list-number"
                              onClick={() =>
                                handleDetail(
                                  invoice
                                )
                              }
                              title="Fatura detayını aç"
                            >

                              <MdReceiptLong />

                              {
                                invoice.invoiceNo ||
                                "-"
                              }

                            </button>

                          </td>


                          {/* TÜR */}

                          <td>

                            <span
                              className={
                                `ren-invoice-type-badge ${
                                  getTypeClass(
                                    type
                                  )
                                }`
                              }
                            >

                              {
                                getTypeLabel(
                                  type
                                )
                              }

                            </span>

                          </td>


                          {/* CARİ */}

                          <td>

                            <button
                              type="button"
                              className="ren-invoice-list-customer-link"
                              onClick={() =>
                                handleCustomerDetail(
                                  invoice
                                )
                              }
                              disabled={
                                !getCustomerId(
                                  invoice
                                )
                              }
                              title={
                                getCustomerId(
                                  invoice
                                )
                                  ? "Cari detayı aç"
                                  : "Cari kaydı bağlı değil"
                              }
                            >

                              <div className="ren-invoice-list-customer">

                                <div className="ren-invoice-list-avatar">

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
                                      getCustomerCode(
                                        invoice
                                      )
                                    }
                                  </span>

                                </div>

                              </div>

                            </button>

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
                                `ren-invoice-list-status ${
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

                            <strong className="ren-invoice-list-total">

                              ₺
                              {
                                money(
                                  invoice.total
                                )
                              }

                            </strong>

                          </td>


                          {/* İŞLEM */}

                          <td>

                            <div className="ren-invoice-list-actions">


                              {/* DÜZENLE */}

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


                              {/* DETAY */}

                              <button
                                type="button"
                                title="Detay"
                                onClick={() =>
                                  handleDetail(
                                    invoice
                                  )
                                }
                              >

                                <MdOpenInNew />

                              </button>


                              {/* SİL */}

                              <button
                                type="button"
                                title="Sil"
                                className="danger"
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

                      );

                    }
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="9"
                      className="ren-invoice-list-empty"
                    >

                      <div>

                        <MdReceiptLong />

                        <strong>
                          Fatura bulunamadı
                        </strong>

                        <span>
                          Seçtiğiniz filtrelere uygun
                          fatura bulunmuyor.
                        </span>


                        <button
                          type="button"
                          onClick={
                            handleNewInvoice
                          }
                        >

                          <MdAdd />

                          Yeni Fatura

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              }

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

        <footer className="ren-invoice-list-footer">

          <span>

            Gösterilen:

            {" "}

            <strong>
              {
                filteredInvoices.length
              }
            </strong>

            {" "}

            fatura

          </span>


          <span>

            Toplam:

            {" "}

            <strong>
              ₺
              {
                money(
                  totalAmount
                )
              }
            </strong>

          </span>

        </footer>

      </section>

    </div>

  );

}