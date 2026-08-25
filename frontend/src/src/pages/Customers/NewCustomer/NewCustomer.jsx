import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NewCustomer() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    code: "CR-0001",
    name: "",
    type: "Müşteri",
    phone: "",
    email: "",
    taxOffice: "",
    taxNumber: "",
    due: "Peşin",
    openingBalance: "",
    balanceDirection: "Borç",
    note: "",
  });

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    console.log("Yeni cari:", form);

    navigate("/customers");
  };

  return (
    <div className="customer-page">
      <div className="customer-container">

        <div className="customer-header">
          <div>
            <div className="customer-breadcrumb">
              Müşteri - Tedarikçi
              <span>/</span>
              Yeni Hesap
            </div>

            <h1>Yeni Hesap</h1>

            <p>
              Yeni müşteri veya tedarikçi hesabı oluşturun.
            </p>
          </div>

          <Link
            to="/customers"
            className="customer-primary-button"
          >
            Hesap Listesine Dön
          </Link>
        </div>

        <form
          onSubmit={submit}
          style={{
            background: "#fff",
            border: "1px solid #e1e7ee",
            borderRadius: "10px",
            padding: "24px",
            maxWidth: "1000px",
          }}
        >

          <h3>Hesap Bilgileri</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "18px",
              marginTop: "20px",
            }}
          >

            <label>
              Cari Kodu
              <input
                value={form.code}
                onChange={(e) =>
                  update("code", e.target.value)
                }
              />
            </label>

            <label>
              Cari Tipi
              <select
                value={form.type}
                onChange={(e) =>
                  update("type", e.target.value)
                }
              >
                <option>Müşteri</option>
                <option>Tedarikçi</option>
                <option>Müşteri + Tedarikçi</option>
              </select>
            </label>

            <label>
              Hesap Adı / Ünvan
              <input
                required
                value={form.name}
                onChange={(e) =>
                  update("name", e.target.value)
                }
                placeholder="Örn. ABC Temizlik Ltd. Şti."
              />
            </label>

            <label>
              Telefon
              <input
                value={form.phone}
                onChange={(e) =>
                  update("phone", e.target.value)
                }
                placeholder="05xx xxx xx xx"
              />
            </label>

            <label>
              E-posta
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  update("email", e.target.value)
                }
              />
            </label>

            <label>
              Vergi Dairesi
              <input
                value={form.taxOffice}
                onChange={(e) =>
                  update("taxOffice", e.target.value)
                }
              />
            </label>

            <label>
              Vergi No / T.C. Kimlik No
              <input
                value={form.taxNumber}
                onChange={(e) =>
                  update("taxNumber", e.target.value)
                }
              />
            </label>

            <label>
              Vade
              <select
                value={form.due}
                onChange={(e) =>
                  update("due", e.target.value)
                }
              >
                <option>Peşin</option>
                <option>7 Gün</option>
                <option>15 Gün</option>
                <option>30 Gün</option>
                <option>45 Gün</option>
                <option>60 Gün</option>
                <option>90 Gün</option>
              </select>
            </label>

            <label>
              Açılış Bakiyesi
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) =>
                  update(
                    "openingBalance",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Bakiye Yönü
              <select
                value={form.balanceDirection}
                onChange={(e) =>
                  update(
                    "balanceDirection",
                    e.target.value
                  )
                }
              >
                <option>Borç</option>
                <option>Alacak</option>
              </select>
            </label>

          </div>

          <label
            style={{
              display: "block",
              marginTop: "18px",
            }}
          >
            Not

            <textarea
              rows="4"
              value={form.note}
              onChange={(e) =>
                update("note", e.target.value)
              }
              placeholder="Cari hakkında not..."
            />
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "24px",
            }}
          >

            <Link
              to="/customers"
              style={{
                padding: "11px 18px",
                border: "1px solid #dce3eb",
                borderRadius: "7px",
                color: "#526073",
                textDecoration: "none",
                fontSize: "12px",
              }}
            >
              Vazgeç
            </Link>

            <button
              type="submit"
              className="customer-primary-button"
            >
              Hesabı Kaydet
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}