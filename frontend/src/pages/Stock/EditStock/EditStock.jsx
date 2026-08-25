import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getProductById,
  updateProduct,
} from "../../../lib/stockStore";

import "./EditStock.css";


export default function EditStock() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    const found =
      getProductById(id);

    if (found) {
      setProduct(found);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="edit-stock-page">
        <div className="edit-stock-card">
          <h2>Ürün bulunamadı</h2>

          <p>
            Düzenlemek istediğiniz stok
            kaydı bulunamadı.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/stock/list")
            }
          >
            STOK LİSTESİNE DÖN
          </button>
        </div>
      </div>
    );
  }

  const updateField =
    (field, value) => {
      setProduct((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const handleSave = () => {
    if (saving) return;

    if (!product.name?.trim()) {
      alert(
        "Ürün adı boş bırakılamaz."
      );
      return;
    }

    setSaving(true);

    try {
      updateProduct(
        product.id,
        product
      );

      window.dispatchEvent(
        new Event(
          "ren-stock-updated"
        )
      );

      window.dispatchEvent(
        new Event(
          "ren-products-changed"
        )
      );

      alert(
        "Ürün başarıyla güncellendi."
      );

      navigate("/stock/list");
    } catch (error) {
      console.error(
        "Ürün güncelleme hatası:",
        error
      );

      alert(
        error?.message ||
        "Ürün güncellenemedi."
      );

      setSaving(false);
    }
  };

  return (
    <div className="edit-stock-page">

      <div className="edit-stock-header">

        <div>
          <div className="edit-stock-breadcrumb">
            Stok
            <span>›</span>
            Stok Listesi
            <span>›</span>
            Düzenle
          </div>

          <h1>
            Stok Düzenle
          </h1>
        </div>

        <div className="edit-stock-actions">

          <button
            type="button"
            className="edit-stock-cancel"
            onClick={() =>
              navigate(
                "/stock/list"
              )
            }
          >
            VAZGEÇ
          </button>

          <button
            type="button"
            className="edit-stock-save"
            disabled={saving}
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


      <div className="edit-stock-card">

        <div className="edit-stock-section-title">
          Ürün Bilgileri
        </div>


        <div className="edit-stock-grid">

          <div className="edit-stock-field full">

            <label>
              Ürün Adı
            </label>

            <input
              value={
                product.name || ""
              }
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Stok Kodu
            </label>

            <input
              value={
                product.code || ""
              }
              onChange={(event) =>
                updateField(
                  "code",
                  event.target.value
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Barkod
            </label>

            <input
              value={
                product.barcode ||
                ""
              }
              onChange={(event) =>
                updateField(
                  "barcode",
                  event.target.value
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Kategori
            </label>

            <input
              value={
                product.category ||
                ""
              }
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Marka
            </label>

            <input
              value={
                product.brand ||
                ""
              }
              onChange={(event) =>
                updateField(
                  "brand",
                  event.target.value
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Birim
            </label>

            <input
              value={
                product.unit ||
                "Adet"
              }
              onChange={(event) =>
                updateField(
                  "unit",
                  event.target.value
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Mevcut Stok
            </label>

            <input
              type="number"
              value={
                product.stock ??
                0
              }
              onChange={(event) =>
                updateField(
                  "stock",
                  Number(
                    event.target.value
                  )
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Alış Fiyatı
            </label>

            <input
              type="number"
              step="0.01"
              value={
                product.purchasePrice ??
                product.purchaseNet ??
                0
              }
              onChange={(event) =>
                updateField(
                  "purchasePrice",
                  Number(
                    event.target.value
                  )
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Satış Fiyatı
            </label>

            <input
              type="number"
              step="0.01"
              value={
                product.salePrice ??
                product.salesNet ??
                0
              }
              onChange={(event) =>
                updateField(
                  "salePrice",
                  Number(
                    event.target.value
                  )
                )
              }
            />

          </div>


          <div className="edit-stock-field">

            <label>
              KDV Oranı
            </label>

            <select
              value={
                product.vatRate ??
                product.salesVat ??
                20
              }
              onChange={(event) =>
                updateField(
                  "vatRate",
                  Number(
                    event.target.value
                  )
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

          </div>

        </div>


        <div className="edit-stock-section-title">
          Açıklama
        </div>

        <div className="edit-stock-field">

          <textarea
            value={
              product.description ||
              ""
            }
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
            rows="4"
            placeholder="Ürün açıklaması..."
          />

        </div>


        <div className="edit-stock-bottom">

          <button
            type="button"
            className="edit-stock-cancel"
            onClick={() =>
              navigate(
                "/stock/list"
              )
            }
          >
            VAZGEÇ
          </button>

          <button
            type="button"
            className="edit-stock-save"
            disabled={saving}
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

    </div>
  );
}