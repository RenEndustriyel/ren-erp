import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addCustomer,
  getCustomers,
} from "../../../lib/customerStore";
import "./NewCustomer.css";

function getNextCustomerCode() {
  const customers = getCustomers();

  let maxNumber = 0;

  customers.forEach((customer) => {
    const match = String(customer.code || "").match(
      /CR-(\d+)/i
    );

    if (match) {
      maxNumber = Math.max(
        maxNumber,
        Number(match[1])
      );
    }
  });

  return `CR-${String(maxNumber + 1).padStart(4, "0")}`;
}

function getOpeningBalance(form) {
  const amount = Number(
    String(form.openingBalance || "")
      .replace(/\./g, "")
      .replace(",", ".")
  );

  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (form.balanceDirection === "Alacak") {
    return -Math.abs(amount);
  }

  return Math.abs(amount);
}

export default function NewCustomer() {
  const navigate = useNavigate();

  const [accountType, setAccountType] =
    useState("Müşteri");

  const [form, setForm] = useState(() => ({
    code: getNextCustomerCode(),
    name: "",
    contact: "",
    phone: "",
    email: "",
    taxOffice: "",
    taxNumber: "",
    address: "",
    city: "",
    district: "",
    term: "Peşin",
    openingBalance: "",
    balanceDirection: "Borç",
    note: "",
  }));

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setAccountType("Müşteri");

    setForm({
      code: getNextCustomerCode(),
      name: "",
      contact: "",
      phone: "",
      email: "",
      taxOffice: "",
      taxNumber: "",
      address: "",
      city: "",
      district: "",
      term: "Peşin",
      openingBalance: "",
      balanceDirection: "Borç",
      note: "",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert(
        "Hesap adı / ünvan alanı zorunludur."
      );
      return;
    }

    const customers = getCustomers();

    const exists = customers.some(
      (customer) =>
        String(customer.name || "")
          .trim()
          .toLocaleLowerCase("tr-TR") ===
        name.toLocaleLowerCase("tr-TR")
    );

    if (exists) {
      alert(
        "Bu isimde bir cari hesap zaten bulunuyor."
      );
      return;
    }

    const customer = {
      id: Date.now(),

      code: form.code,

      name,

      type: accountType,

      contact: form.contact.trim(),

      phone: form.phone.trim(),

      email: form.email.trim(),

      taxOffice: form.taxOffice.trim(),

      taxNumber: form.taxNumber.trim(),

      address: form.address.trim(),

      city: form.city.trim(),

      district: form.district.trim(),

      term: form.term,

      openingBalance:
        Number(
          String(form.openingBalance || "")
            .replace(/\./g, "")
            .replace(",", ".")
        ) || 0,

      balanceDirection:
        form.balanceDirection,

      balance:
        getOpeningBalance(form),

      note: form.note.trim(),

      status: "Aktif",

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    };

    addCustomer(customer);

    window.dispatchEvent(
      new Event("ren-customers-updated")
    );

    alert(
      `${accountType} hesabı başarıyla kaydedildi.\n\n` +
      `Cari Kodu: ${customer.code}\n` +
      `Hesap: ${customer.name}`
    );

    navigate("/customers");
  };

  return (
    <div className="new-customer-page">
      <div className="new-customer-container">

        <div className="new-customer-header">
          <div>
            <div className="new-customer-breadcrumb">
              Müşteri - Tedarikçi
              <span>/</span>
              Yeni Hesap
            </div>

            <h1>
              Yeni Hesap
            </h1>

            <p>
              Yeni müşteri veya tedarikçi hesabı
              oluşturun.
            </p>
          </div>
        </div>

        <form
          className="new-customer-form"
          onSubmit={handleSubmit}
        >

          <div className="new-customer-card">

            <div className="new-customer-card-header">
              <div>
                <strong>
                  Hesap Bilgileri
                </strong>

                <span>
                  Cari hesap temel bilgilerini girin.
                </span>
              </div>
            </div>

            <div className="new-customer-card-body">

              <div className="customer-type-switch">

                <button
                  type="button"
                  className={
                    accountType === "Müşteri"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setAccountType("Müşteri")
                  }
                >
                  Müşteri
                </button>

                <button
                  type="button"
                  className={
                    accountType === "Tedarikçi"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setAccountType("Tedarikçi")
                  }
                >
                  Tedarikçi
                </button>

              </div>

              <div className="new-customer-grid">

                <div className="customer-field">

                  <label>
                    Cari Kodu
                  </label>

                  <input
                    value={form.code}
                    readOnly
                  />

                  <small>
                    Otomatik oluşturulur.
                  </small>

                </div>

                <div className="customer-field customer-field-wide">

                  <label>
                    Hesap Adı / Ünvan
                    <span>*</span>
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Firma veya kişi adı"
                  />

                </div>

                <div className="customer-field">

                  <label>
                    Yetkili
                  </label>

                  <input
                    value={form.contact}
                    onChange={(event) =>
                      updateField(
                        "contact",
                        event.target.value
                      )
                    }
                    placeholder="Yetkili kişi"
                  />

                </div>

                <div className="customer-field">

                  <label>
                    Telefon
                  </label>

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="05XX XXX XX XX"
                  />

                </div>

                <div className="customer-field">

                  <label>
                    E-posta
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="ornek@mail.com"
                  />

                </div>

              </div>

            </div>

          </div>


          <div className="new-customer-card">

            <div className="new-customer-card-header">
              <div>
                <strong>
                  Vergi Bilgileri
                </strong>

                <span>
                  Vergi ve resmi hesap bilgileri.
                </span>
              </div>
            </div>

            <div className="new-customer-card-body">

              <div className="new-customer-grid">

                <div className="customer-field">

                  <label>
                    Vergi Dairesi
                  </label>

                  <input
                    value={form.taxOffice}
                    onChange={(event) =>
                      updateField(
                        "taxOffice",
                        event.target.value
                      )
                    }
                    placeholder="Vergi dairesi"
                  />

                </div>

                <div className="customer-field">

                  <label>
                    Vergi No / T.C.
                  </label>

                  <input
                    value={form.taxNumber}
                    onChange={(event) =>
                      updateField(
                        "taxNumber",
                        event.target.value
                      )
                    }
                    placeholder="Vergi no veya T.C."
                  />

                </div>

              </div>

            </div>

          </div>


          <div className="new-customer-card">

            <div className="new-customer-card-header">
              <div>
                <strong>
                  Adres Bilgileri
                </strong>

                <span>
                  Cari adres bilgilerini girin.
                </span>
              </div>
            </div>

            <div className="new-customer-card-body">

              <div className="new-customer-grid">

                <div className="customer-field customer-field-wide">

                  <label>
                    Adres
                  </label>

                  <input
                    value={form.address}
                    onChange={(event) =>
                      updateField(
                        "address",
                        event.target.value
                      )
                    }
                    placeholder="Açık adres"
                  />

                </div>

                <div className="customer-field">

                  <label>
                    İl
                  </label>

                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField(
                        "city",
                        event.target.value
                      )
                    }
                    placeholder="İl"
                  />

                </div>

                <div className="customer-field">

                  <label>
                    İlçe
                  </label>

                  <input
                    value={form.district}
                    onChange={(event) =>
                      updateField(
                        "district",
                        event.target.value
                      )
                    }
                    placeholder="İlçe"
                  />

                </div>

              </div>

            </div>

          </div>


          <div className="new-customer-card">

            <div className="new-customer-card-header">
              <div>
                <strong>
                  Vade ve Açılış Bakiyesi
                </strong>

                <span>
                  Cari hesabın başlangıç finansal
                  bilgileri.
                </span>
              </div>
            </div>

            <div className="new-customer-card-body">

              <div className="new-customer-grid">

                <div className="customer-field">

                  <label>
                    Vade
                  </label>

                  <select
                    value={form.term}
                    onChange={(event) =>
                      updateField(
                        "term",
                        event.target.value
                      )
                    }
                  >
                    <option value="Peşin">
                      Peşin
                    </option>

                    <option value="7 Gün">
                      7 Gün
                    </option>

                    <option value="15 Gün">
                      15 Gün
                    </option>

                    <option value="30 Gün">
                      30 Gün
                    </option>

                    <option value="45 Gün">
                      45 Gün
                    </option>

                    <option value="60 Gün">
                      60 Gün
                    </option>

                    <option value="90 Gün">
                      90 Gün
                    </option>
                  </select>

                </div>

                <div className="customer-field">

                  <label>
                    Açılış Bakiyesi
                  </label>

                  <div className="customer-money-input">

                    <input
                      value={form.openingBalance}
                      onChange={(event) =>
                        updateField(
                          "openingBalance",
                          event.target.value
                        )
                      }
                      placeholder="0,00"
                    />

                    <span>
                      TL
                    </span>

                  </div>

                </div>

                <div className="customer-field">

                  <label>
                    Bakiye Yönü
                  </label>

                  <select
                    value={
                      form.balanceDirection
                    }
                    onChange={(event) =>
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

              </div>

            </div>

          </div>


          <div className="new-customer-card">

            <div className="new-customer-card-header">
              <div>
                <strong>
                  Not
                </strong>

                <span>
                  Bu cari hesapla ilgili özel
                  açıklamalar.
                </span>
              </div>
            </div>

            <div className="new-customer-card-body">

              <textarea
                className="customer-note"
                value={form.note}
                onChange={(event) =>
                  updateField(
                    "note",
                    event.target.value
                  )
                }
                placeholder="Cari hesap hakkında not..."
              />

            </div>

          </div>


          <div className="new-customer-actions">

            <button
              type="button"
              className="customer-cancel-button"
              onClick={resetForm}
            >
              Temizle
            </button>

            <button
              type="submit"
              className="customer-save-button"
            >
              Hesabı Kaydet
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}