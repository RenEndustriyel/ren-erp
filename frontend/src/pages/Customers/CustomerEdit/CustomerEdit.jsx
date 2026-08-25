import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getCustomerById,
  updateCustomer,
} from "../../../lib/customerStore";

import "./CustomerEdit.css";


export default function CustomerEdit() {

  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();


  const [
    customer,
    setCustomer,
  ] = useState(null);


  const [
    saving,
    setSaving,
  ] = useState(false);


  /* =====================================================
     CARİYİ GETİR
  ===================================================== */

  useEffect(() => {

    const found =
      getCustomerById(
        id
      );

    if (found) {
      setCustomer(
        found
      );
    }

  }, [id]);


  /* =====================================================
     BULUNAMADI
  ===================================================== */

  if (!customer) {

    return (
      <div className="customer-edit-page">

        <div className="customer-edit-card customer-edit-empty">

          <h2>
            Cari bulunamadı
          </h2>

          <p>
            Düzenlemek istediğiniz cari kayıt bulunamadı.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/customers"
              )
            }
          >
            CARİ LİSTESİNE DÖN
          </button>

        </div>

      </div>
    );

  }


  /* =====================================================
     ALAN GÜNCELLE
  ===================================================== */

  const updateField =
    (
      field,
      value
    ) => {

      setCustomer(
        (current) => ({
          ...current,
          [field]:
            value,
        })
      );

    };


  /* =====================================================
     KAYDET
  ===================================================== */

  const handleSave =
    () => {

      if (saving) {
        return;
      }


      const name =
        String(
          customer.name ||
          ""
        ).trim();


      if (!name) {

        alert(
          "Cari adı / ünvanı boş bırakılamaz."
        );

        return;
      }


      setSaving(
        true
      );


      try {

        updateCustomer(
          customer.id,
          customer
        );


        window.dispatchEvent(
          new Event(
            "ren-customers-updated"
          )
        );


        alert(
          "Cari bilgileri başarıyla güncellendi."
        );


        navigate(
          "/customers"
        );

      } catch (
        error
      ) {

        console.error(
          "Cari güncelleme hatası:",
          error
        );


        alert(
          error?.message ||
          "Cari güncellenemedi."
        );


        setSaving(
          false
        );

      }

    };


  return (
    <div className="customer-edit-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="customer-edit-header">

        <div>

          <div className="customer-edit-breadcrumb">

            <span>
              Müşteri - Tedarikçi
            </span>

            <b>
              /
            </b>

            <span>
              Hesap Listesi
            </span>

            <b>
              /
            </b>

            <strong>
              Düzenle
            </strong>

          </div>


          <h1>
            Cari Düzenle
          </h1>


          <p>
            Cari hesabın bilgilerini güncelleyin.
          </p>

        </div>


        <div className="customer-edit-actions">

          <button
            type="button"
            className="customer-edit-cancel"
            onClick={() =>
              navigate(
                "/customers"
              )
            }
          >
            VAZGEÇ
          </button>


          <button
            type="button"
            className="customer-edit-save"
            disabled={
              saving
            }
            onClick={
              handleSave
            }
          >
            {saving
              ? "KAYDEDİLİYOR..."
              : "KAYDET"}
          </button>

        </div>

      </div>


      {/* =================================================
          ANA KART
      ================================================= */}

      <div className="customer-edit-card">


        {/* =================================================
            TEMEL BİLGİLER
        ================================================= */}

        <div className="customer-edit-section-title">
          Temel Bilgiler
        </div>


        <div className="customer-edit-grid">


          {/* CARİ KODU */}

          <div className="customer-edit-field">

            <label>
              Cari Kodu
            </label>

            <input
              value={
                customer.code ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "code",
                  event.target.value
                )
              }
            />

          </div>


          {/* TİP */}

          <div className="customer-edit-field">

            <label>
              Cari Tipi
            </label>

            <select
              value={
                customer.type ||
                "Müşteri"
              }
              onChange={(
                event
              ) =>
                updateField(
                  "type",
                  event.target.value
                )
              }
            >

              <option value="Müşteri">
                Müşteri
              </option>

              <option value="Tedarikçi">
                Tedarikçi
              </option>

            </select>

          </div>


          {/* ÜNVAN */}

          <div className="customer-edit-field full">

            <label>
              Ünvan / Ad Soyad
            </label>

            <input
              value={
                customer.name ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              placeholder="Cari adı veya şirket ünvanı"
            />

          </div>


          {/* TELEFON */}

          <div className="customer-edit-field">

            <label>
              Telefon
            </label>

            <input
              value={
                customer.phone ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              placeholder="05xx xxx xx xx"
            />

          </div>


          {/* E-POSTA */}

          <div className="customer-edit-field">

            <label>
              E-posta
            </label>

            <input
              type="email"
              value={
                customer.email ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              placeholder="ornek@firma.com"
            />

          </div>


          {/* VERGİ DAİRESİ */}

          <div className="customer-edit-field">

            <label>
              Vergi Dairesi
            </label>

            <input
              value={
                customer.taxOffice ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "taxOffice",
                  event.target.value
                )
              }
            />

          </div>


          {/* VKN */}

          <div className="customer-edit-field">

            <label>
              Vergi No / T.C. Kimlik No
            </label>

            <input
              value={
                customer.taxNumber ||
                customer.taxNo ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "taxNumber",
                  event.target.value
                )
              }
            />

          </div>


          {/* İL */}

          <div className="customer-edit-field">

            <label>
              İl
            </label>

            <input
              value={
                customer.city ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "city",
                  event.target.value
                )
              }
            />

          </div>


          {/* İLÇE */}

          <div className="customer-edit-field">

            <label>
              İlçe
            </label>

            <input
              value={
                customer.district ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "district",
                  event.target.value
                )
              }
            />

          </div>


          {/* ADRES */}

          <div className="customer-edit-field full">

            <label>
              Adres
            </label>

            <textarea
              value={
                customer.address ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
              rows="3"
              placeholder="Açık adres"
            />

          </div>

        </div>


        {/* =================================================
            TİCARİ BİLGİLER
        ================================================= */}

        <div className="customer-edit-section-title">
          Ticari Bilgiler
        </div>


        <div className="customer-edit-grid">


          {/* VADE */}

          <div className="customer-edit-field">

            <label>
              Vade
            </label>

            <input
              type="number"
              min="0"
              value={
                customer.dueDays ??
                customer.vade ??
                0
              }
              onChange={(
                event
              ) =>
                updateField(
                  "dueDays",
                  Number(
                    event.target.value
                  )
                )
              }
            />

            <small>
              Gün
            </small>

          </div>


          {/* DURUM */}

          <div className="customer-edit-field">

            <label>
              Durum
            </label>

            <select
              value={
                customer.status ||
                "Aktif"
              }
              onChange={(
                event
              ) =>
                updateField(
                  "status",
                  event.target.value
                )
              }
            >

              <option value="Aktif">
                Aktif
              </option>

              <option value="Pasif">
                Pasif
              </option>

            </select>

          </div>


          {/* AÇILIŞ BAKİYESİ */}

          <div className="customer-edit-field">

            <label>
              Açılış Bakiyesi
            </label>

            <input
              type="number"
              step="0.01"
              value={
                customer.openingBalance ??
                0
              }
              onChange={(
                event
              ) =>
                updateField(
                  "openingBalance",
                  Number(
                    event.target.value
                  )
                )
              }
            />

          </div>


          {/* BAKİYE YÖNÜ */}

          <div className="customer-edit-field">

            <label>
              Açılış Bakiye Yönü
            </label>

            <select
              value={
                customer.balanceDirection ||
                (
                  Number(
                    customer.balance
                  ) >= 0
                    ? "Alacak"
                    : "Borç"
                )
              }
              onChange={(
                event
              ) =>
                updateField(
                  "balanceDirection",
                  event.target.value
                )
              }
            >

              <option value="Borç">
                Borç
              </option>

              <option value="Alacak">
                Alacak
              </option>

            </select>

          </div>


          {/* CARİ BAKİYE */}

          <div className="customer-edit-current-balance">

            <span>
              GÜNCEL CARİ BAKİYESİ
            </span>

            <strong
              className={
                Number(
                  customer.balance
                ) < 0
                  ? "negative"
                  : Number(
                      customer.balance
                    ) > 0
                  ? "positive"
                  : ""
              }
            >

              {Number(
                customer.balance
              ) < 0
                ? "Borç "
                : Number(
                    customer.balance
                  ) > 0
                ? "Alacak "
                : ""}

              {new Intl.NumberFormat(
                "tr-TR",
                {
                  minimumFractionDigits:
                    2,
                  maximumFractionDigits:
                    2,
                }
              ).format(
                Math.abs(
                  Number(
                    customer.balance
                  ) || 0
                )
              )}

              {" "}TL

            </strong>

          </div>


          {/* NOT */}

          <div className="customer-edit-field full">

            <label>
              Not
            </label>

            <textarea
              value={
                customer.notes ||
                customer.note ||
                ""
              }
              onChange={(
                event
              ) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              rows="4"
              placeholder="Cari ile ilgili notlar..."
            />

          </div>

        </div>


        {/* =================================================
            ALT BUTONLAR
        ================================================= */}

        <div className="customer-edit-bottom">

          <button
            type="button"
            className="customer-edit-cancel"
            onClick={() =>
              navigate(
                "/customers"
              )
            }
          >
            VAZGEÇ
          </button>


          <button
            type="button"
            className="customer-edit-save"
            disabled={
              saving
            }
            onClick={
              handleSave
            }
          >
            {saving
              ? "KAYDEDİLİYOR..."
              : "DEĞİŞİKLİKLERİ KAYDET"}
          </button>

        </div>

      </div>

    </div>
  );
}