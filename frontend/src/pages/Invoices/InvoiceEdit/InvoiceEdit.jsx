import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdAdd,
  MdArrowBack,
  MdDeleteOutline,
  MdSave,
  MdPrint,
  MdPictureAsPdf,
  MdPayments,
} from "react-icons/md";

import {
  getInvoiceById,
  updateInvoice,
} from "../../../lib/invoiceStore";

import "./InvoiceEdit.css";


function money(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}


function getInvoiceType(invoice) {
  const type = invoice?.type || "";

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
  const type = getInvoiceType(invoice);

  if (type === "purchase") {
    return "Alış Faturası";
  }

  if (type === "return") {
    return "İade Faturası";
  }

  return "Satış Faturası";
}


function getInitialItems(invoice) {
  if (Array.isArray(invoice?.items)) {
    return invoice.items.map((item, index) => ({
      id: item.id || `line-${index}-${Date.now()}`,
      productId: item.productId || "",
      productName:
        item.productName ||
        item.name ||
        item.description ||
        "",
      code: item.code || "",
      quantity:
        item.quantity ??
        item.qty ??
        1,
      unit:
        item.unit ||
        "Adet",
      unitPrice:
        item.unitPrice ??
        item.price ??
        0,
      discount:
        item.discount ??
        item.discountAmount ??
        0,
      vatRate:
        item.vatRate ??
        item.kdvRate ??
        20,
      total:
        item.total ??
        item.lineTotal ??
        0,
    }));
  }

  if (Array.isArray(invoice?.lines)) {
    return invoice.lines.map((item, index) => ({
      id: item.id || `line-${index}-${Date.now()}`,
      productId: item.productId || "",
      productName:
        item.productName ||
        item.name ||
        item.description ||
        "",
      code: item.code || "",
      quantity:
        item.quantity ??
        item.qty ??
        1,
      unit:
        item.unit ||
        "Adet",
      unitPrice:
        item.unitPrice ??
        item.price ??
        0,
      discount:
        item.discount ??
        item.discountAmount ??
        0,
      vatRate:
        item.vatRate ??
        item.kdvRate ??
        20,
      total:
        item.total ??
        item.lineTotal ??
        0,
    }));
  }

  return [];
}


export default function InvoiceEdit() {
  const invoiceId = useMemo(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("id");
  }, []);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [taxNumber, setTaxNumber] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Vadeli");

  const [paymentStatus, setPaymentStatus] =
    useState("");

  const [status, setStatus] =
    useState("Taslak");

  const [note, setNote] = useState("");

  const [items, setItems] = useState([]);


  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    if (!invoiceId) {
      setLoading(false);
      return;
    }

    const result =
      getInvoiceById(invoiceId);

    if (result) {
      setInvoice(result);

      setInvoiceNo(
        result.invoiceNo || ""
      );

      setDate(
        result.date || ""
      );

      setDueDate(
        result.dueDate || ""
      );

      setCustomerName(
        result.customerName ||
        result.supplierName ||
        ""
      );

      setCustomerCode(
        result.customerCode ||
        result.supplierCode ||
        ""
      );

      setTaxNumber(
        result.taxNumber ||
        ""
      );

      setPaymentMethod(
        result.paymentMethod ||
        "Vadeli"
      );

      setPaymentStatus(
        result.paymentStatus ||
        ""
      );

      setStatus(
        result.status ||
        "Taslak"
      );

      setNote(
        result.note ||
        ""
      );

      setItems(
        getInitialItems(result)
      );
    }

    setLoading(false);
  }, [invoiceId]);


  /* =====================================================
     SATIR HESABI
  ===================================================== */

  const calculateLine = (item) => {
    const quantity =
      Number(item.quantity) || 0;

    const unitPrice =
      Number(item.unitPrice) || 0;

    const discount =
      Number(item.discount) || 0;

    const vatRate =
      Number(item.vatRate) || 0;

    const gross =
      quantity * unitPrice;

    const net =
      Math.max(
        0,
        gross - discount
      );

    const vat =
      net * vatRate / 100;

    const total =
      net + vat;

    return {
      ...item,
      total,
      net,
      vat,
    };
  };


  /* =====================================================
     SATIRLARI GÜNCELLE
  ===================================================== */

  const updateItem = (
    id,
    field,
    value
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return calculateLine({
          ...item,
          [field]: value,
        });
      })
    );
  };


  /* =====================================================
     SATIR EKLE
  ===================================================== */

  const addItem = () => {
    setItems((current) => [
      ...current,
      calculateLine({
        id: `line-${Date.now()}`,
        productId: "",
        productName: "",
        code: "",
        quantity: 1,
        unit: "Adet",
        unitPrice: 0,
        discount: 0,
        vatRate: 20,
        total: 0,
      }),
    ]);
  };


  /* =====================================================
     SATIR SİL
  ===================================================== */

  const removeItem = (id) => {
    setItems((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    );
  };


  /* =====================================================
     TOPLAMLAR
  ===================================================== */

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let vat = 0;

    items.forEach((item) => {
      const quantity =
        Number(item.quantity) || 0;

      const unitPrice =
        Number(item.unitPrice) || 0;

      const lineDiscount =
        Number(item.discount) || 0;

      const net =
        Math.max(
          0,
          quantity * unitPrice -
            lineDiscount
        );

      const lineVat =
        net *
        (Number(item.vatRate) || 0) /
        100;

      subtotal +=
        quantity * unitPrice;

      discount +=
        lineDiscount;

      vat +=
        lineVat;
    });

    return {
      subtotal,
      discount,
      vat,
      total:
        subtotal -
        discount +
        vat,
    };
  }, [items]);


  /* =====================================================
     KAYDET
  ===================================================== */

  const handleSave = () => {
    if (!invoice) {
      return;
    }

    if (!invoiceNo.trim()) {
      window.alert(
        "Fatura numarası girin."
      );
      return;
    }

    if (!date) {
      window.alert(
        "Fatura tarihini girin."
      );
      return;
    }

    setSaving(true);

    const updated = {
      ...invoice,

      invoiceNo:
        invoiceNo.trim(),

      date,

      dueDate,

      customerName:
        customerName.trim(),

      supplierName:
        getInvoiceType(invoice) ===
        "purchase"
          ? customerName.trim()
          : invoice.supplierName,

      customerCode:
        customerCode.trim(),

      taxNumber:
        taxNumber.trim(),

      paymentMethod,

      paymentStatus,

      status,

      note,

      items: items.map(
        (item) =>
          calculateLine(item)
      ),

      subtotal:
        totals.subtotal,

      subTotal:
        totals.subtotal,

      discountTotal:
        totals.discount,

      discount:
        totals.discount,

      vatTotal:
        totals.vat,

      kdvTotal:
        totals.vat,

      total:
        totals.total,

      updatedAt:
        new Date().toISOString(),
    };

    try {
      updateInvoice(
        invoice.id,
        updated
      );

      window.location.href =
        `/invoices/detail?id=${encodeURIComponent(
          invoice.id
        )}`;
    } catch (error) {
      console.error(error);

      window.alert(
        "Fatura kaydedilirken bir hata oluştu."
      );

      setSaving(false);
    }
  };


  /* =====================================================
     GERİ
  ===================================================== */

  const handlePrint = () => window.print();

  const handlePdf = () => window.print();

  const handlePayment = () => {
    window.alert("Tahsilat ekranı sonraki adımda cari hareketine bağlanacak.");
  };

  const handleBack = () => {
    if (invoiceId) {
      window.location.href =
        `/invoices/detail?id=${encodeURIComponent(
          invoiceId
        )}`;
    } else {
      window.location.href =
        "/invoices";
    }
  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="ren-invoice-edit-loading">
        Fatura yükleniyor...
      </div>
    );
  }


  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!invoice) {
    return (
      <div className="ren-invoice-edit">
        <div className="ren-invoice-edit-empty">

          <h2>
            Fatura bulunamadı
          </h2>

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


  const typeLabel =
    getTypeLabel(invoice);


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="ren-invoice-edit">

      {/* HEADER */}

      <header className="ren-invoice-edit-header">

        <div>

          <button
            type="button"
            className="ren-invoice-edit-back"
            onClick={handleBack}
          >
            <MdArrowBack />
            Fatura Detayı
          </button>

          <div className="ren-invoice-edit-breadcrumb">
            <span>Faturalar</span>
            <span>›</span>
            <span>{typeLabel}</span>
            <span>›</span>
            <strong>Düzenle</strong>
          </div>

          <h1>
            Faturayı Düzenle
          </h1>

          <p>
            {invoiceNo || "Yeni fatura"}
          </p>

        </div>

        <div className="ren-invoice-edit-header-actions">

          <button type="button" className="secondary" onClick={handlePrint}>
            <MdPrint />
            Yazdır
          </button>

          <button type="button" className="secondary" onClick={handlePdf}>
            <MdPictureAsPdf />
            PDF
          </button>

          <button type="button" className="secondary" onClick={handlePayment}>
            <MdPayments />
            Tahsilat
          </button>

          <button
            type="button"
            className="secondary"
            onClick={handleBack}
          >
            Vazgeç
          </button>

          <button
            type="button"
            className="primary"
            onClick={handleSave}
            disabled={saving}
          >
            <MdSave />
            {saving
              ? "Kaydediliyor..."
              : "Kaydet & Düzenlemeye Devam"}
          </button>

        </div>

      </header>


      {/* FORM */}

      <main className="ren-invoice-edit-layout">

        {/* SOL */}

        <section className="ren-invoice-edit-main">

          {/* BELGE BİLGİLERİ */}

          <div className="ren-invoice-edit-card">

            <div className="ren-invoice-edit-card-title">
              <div>
                <strong>
                  Fatura Bilgileri
                </strong>
                <span>
                  Belge ve cari bilgileri
                </span>
              </div>
            </div>


            <div className="ren-invoice-edit-fields">

              <label>
                <span>
                  Fatura No
                </span>

                <input
                  value={invoiceNo}
                  onChange={(event) =>
                    setInvoiceNo(
                      event.target.value
                    )
                  }
                  placeholder="Fatura numarası"
                />
              </label>


              <label>
                <span>
                  Fatura Tarihi
                </span>

                <input
                  type="date"
                  value={date}
                  onChange={(event) =>
                    setDate(
                      event.target.value
                    )
                  }
                />
              </label>


              <label>
                <span>
                  Vade Tarihi
                </span>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value
                    )
                  }
                />
              </label>


              <label>
                <span>
                  Durum
                </span>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                >
                  <option value="Taslak">
                    Taslak
                  </option>

                  <option value="Onaylandı">
                    Onaylandı
                  </option>

                  <option value="İptal">
                    İptal
                  </option>
                </select>
              </label>

            </div>

          </div>


          {/* CARİ */}

          <div className="ren-invoice-edit-card">

            <div className="ren-invoice-edit-card-title">
              <div>
                <strong>
                  Cari Bilgileri
                </strong>
                <span>
                  {getInvoiceType(invoice) ===
                  "purchase"
                    ? "Tedarikçi"
                    : "Müşteri"}
                </span>
              </div>
            </div>


            <div className="ren-invoice-edit-fields">

              <label className="wide">
                <span>
                  Cari Adı
                </span>

                <input
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(
                      event.target.value
                    )
                  }
                  placeholder="Cari adı"
                />
              </label>


              <label>
                <span>
                  Cari Kodu
                </span>

                <input
                  value={customerCode}
                  onChange={(event) =>
                    setCustomerCode(
                      event.target.value
                    )
                  }
                  placeholder="CR-0001"
                />
              </label>


              <label>
                <span>
                  Vergi No
                </span>

                <input
                  value={taxNumber}
                  onChange={(event) =>
                    setTaxNumber(
                      event.target.value
                    )
                  }
                  placeholder="Vergi numarası"
                />
              </label>

            </div>

          </div>


          {/* ÖDEME */}

          <div className="ren-invoice-edit-card">

            <div className="ren-invoice-edit-card-title">
              <div>
                <strong>
                  Ödeme Bilgileri
                </strong>
                <span>
                  Ödeme yöntemi ve durumu
                </span>
              </div>
            </div>


            <div className="ren-invoice-edit-fields">

              <label>
                <span>
                  Ödeme Yöntemi
                </span>

                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                >
                  <option>
                    Vadeli
                  </option>

                  <option>
                    Nakit
                  </option>

                  <option>
                    Kredi Kartı
                  </option>

                  <option>
                    Havale / EFT
                  </option>

                  <option>
                    Çek
                  </option>

                  <option>
                    Senet
                  </option>
                </select>
              </label>


              <label>
                <span>
                  Ödeme Durumu
                </span>

                <select
                  value={paymentStatus}
                  onChange={(event) =>
                    setPaymentStatus(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Belirtilmedi
                  </option>

                  {getInvoiceType(invoice) ===
                  "purchase" ? (
                    <>
                      <option>
                        Ödendi
                      </option>

                      <option>
                        Ödenmedi
                      </option>
                    </>
                  ) : (
                    <>
                      <option>
                        Tahsil Edildi
                      </option>

                      <option>
                        Tahsil Edilmedi
                      </option>
                    </>
                  )}

                </select>
              </label>

            </div>

          </div>


          {/* ÜRÜNLER */}

          <div className="ren-invoice-edit-card">

            <div className="ren-invoice-edit-card-title products">

              <div>
                <strong>
                  Ürün / Hizmetler
                </strong>

                <span>
                  Fatura satırlarını düzenleyin
                </span>
              </div>

              <button
                type="button"
                onClick={addItem}
              >
                <MdAdd />
                Satır Ekle
              </button>

            </div>


            <div className="ren-invoice-edit-table-wrapper">

              <table className="ren-invoice-edit-table">

                <thead>
                  <tr>

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

                    <th />

                  </tr>
                </thead>


                <tbody>

                  {items.map((item) => (
                    <tr
                      key={item.id}
                    >

                      <td>
                        <input
                          value={
                            item.productName
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "productName",
                              event.target.value
                            )
                          }
                          placeholder="Ürün / hizmet"
                        />
                      </td>


                      <td>
                        <input
                          type="number"
                          min="0"
                          value={
                            item.quantity
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "quantity",
                              event.target.value
                            )
                          }
                        />
                      </td>


                      <td>
                        <select
                          value={
                            item.unit
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "unit",
                              event.target.value
                            )
                          }
                        >
                          <option>
                            Adet
                          </option>
                          <option>
                            Kg
                          </option>
                          <option>
                            Lt
                          </option>
                          <option>
                            Koli
                          </option>
                          <option>
                            Paket
                          </option>
                          <option>
                            Metre
                          </option>
                        </select>
                      </td>


                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.unitPrice
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              event.target.value
                            )
                          }
                        />
                      </td>


                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            item.discount
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "discount",
                              event.target.value
                            )
                          }
                        />
                      </td>


                      <td>
                        <select
                          value={
                            item.vatRate
                          }
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "vatRate",
                              event.target.value
                            )
                          }
                        >
                          <option value="0">
                            %0
                          </option>

                          <option value="1">
                            %1
                          </option>

                          <option value="10">
                            %10
                          </option>

                          <option value="20">
                            %20
                          </option>
                        </select>
                      </td>


                      <td>
                        <strong>
                          ₺
                          {money(
                            calculateLine(
                              item
                            ).total
                          )}
                        </strong>
                      </td>


                      <td>

                        <button
                          type="button"
                          className="ren-edit-delete-line"
                          onClick={() =>
                            removeItem(
                              item.id
                            )
                          }
                          title="Satırı sil"
                        >
                          <MdDeleteOutline />
                        </button>

                      </td>

                    </tr>
                  ))}


                  {items.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="ren-edit-no-items"
                      >
                        Faturada ürün / hizmet satırı
                        bulunmuyor.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>


          {/* NOT */}

          <div className="ren-invoice-edit-card">

            <div className="ren-invoice-edit-card-title">
              <div>
                <strong>
                  Açıklama / Not
                </strong>

                <span>
                  Faturaya ait ek açıklama
                </span>
              </div>
            </div>


            <textarea
              className="ren-invoice-edit-note"
              value={note}
              onChange={(event) =>
                setNote(
                  event.target.value
                )
              }
              placeholder="Fatura açıklaması..."
              rows="4"
            />

          </div>

        </section>


        {/* SAĞ ÖZET */}

        <aside className="ren-invoice-edit-sidebar">

          <div className="ren-invoice-edit-summary">

            <div className="ren-invoice-edit-summary-head">
              <strong>
                Fatura Özeti
              </strong>

              <span>
                {typeLabel}
              </span>
            </div>


            <div className="ren-invoice-edit-summary-row">

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


            <div className="ren-invoice-edit-summary-row">

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


            <div className="ren-invoice-edit-summary-row">

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


            <div className="ren-invoice-edit-grand-total">

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


            <button
              type="button"
              className="ren-invoice-edit-save"
              onClick={handleSave}
              disabled={saving}
            >

              <MdSave />

              {saving
                ? "Kaydediliyor..."
                : "Faturayı Kaydet"}

            </button>

          </div>


          <div className="ren-invoice-edit-info">

            <strong>
              Fatura Bilgisi
            </strong>

            <div>
              <span>
                Fatura No
              </span>

              <b>
                {invoiceNo || "-"}
              </b>
            </div>

            <div>
              <span>
                Tarih
              </span>

              <b>
                {date || "-"}
              </b>
            </div>

            <div>
              <span>
                Cari
              </span>

              <b>
                {customerName || "-"}
              </b>
            </div>

          </div>

        </aside>

      </main>

    </div>
  );
}