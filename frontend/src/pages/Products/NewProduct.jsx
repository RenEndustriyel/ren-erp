import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  MdArrowBack,
  MdSave,
  MdInventory2,
  MdBarcodeReader,
  MdCategory,
  MdPercent,
  MdPriceChange,
} from "react-icons/md";

import productService from "../../services/productService";
import { supabase } from "../../lib/supabase";

import "./NewProduct.css";

const emptyForm = {
  name: "",
  barcode: "",
  categoryId: "",
  brand: "",
  unit: "Adet",

  purchasePrice: "",
  purchasePriceType: "exclusive",

  profitRate: "",

  salePrice: "",
  salePriceType: "inclusive",

  vatRate: "20",

  stockQuantity: "",
  criticalStock: "",

  minSalePrice: "",

  description: "",
};

function normalizeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  return Number(
    String(value)
      .replace(",", ".")
  ) || 0;
}

function calculateSalePrice({
  purchasePrice,
  purchasePriceType,
  profitRate,
  salePriceType,
  vatRate,
}) {
  const buy =
    normalizeNumber(
      purchasePrice
    );

  const profit =
    normalizeNumber(
      profitRate
    );

  const vat =
    normalizeNumber(
      vatRate
    );

  if (buy <= 0) {
    return 0;
  }

  const purchaseNet =
    purchasePriceType === "inclusive" &&
    vat > 0
      ? buy /
        (1 + vat / 100)
      : buy;

  const saleNet =
    purchaseNet *
    (1 + profit / 100);

  if (
    salePriceType ===
      "inclusive" &&
    vat > 0
  ) {
    return (
      saleNet *
      (1 + vat / 100)
    );
  }

  return saleNet;
}

function calculateProfitRate({
  purchasePrice,
  purchasePriceType,
  salePrice,
  salePriceType,
  vatRate,
}) {
  const buy =
    normalizeNumber(
      purchasePrice
    );

  const sale =
    normalizeNumber(
      salePrice
    );

  const vat =
    normalizeNumber(
      vatRate
    );

  if (
    buy <= 0 ||
    sale <= 0
  ) {
    return 0;
  }

  const purchaseNet =
    purchasePriceType === "inclusive" &&
    vat > 0
      ? buy /
        (1 + vat / 100)
      : buy;

  const saleNet =
    salePriceType === "inclusive" &&
    vat > 0
      ? sale /
        (1 + vat / 100)
      : sale;

  if (
    purchaseNet <= 0
  ) {
    return 0;
  }

  return (
    (
      saleNet /
      purchaseNet
    ) - 1
  ) * 100;
}

function money(value) {
  return Number(
    value || 0
  ).toLocaleString(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

export default function NewProduct() {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] = useState(
    emptyForm
  );

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories =
    async () => {
      try {
        setLoading(true);

        const {
          data,
          error: categoryError,
        } = await supabase
          .from("categories")
          .select(
            "id, name"
          )
          .eq(
            "is_active",
            true
          )
          .order(
            "name",
            {
              ascending: true,
            }
          );

        if (categoryError) {
          throw categoryError;
        }

        setCategories(
          data || []
        );
      } catch (err) {
        console.error(
          "Kategoriler yüklenemedi:",
          err
        );

        setError(
          "Kategoriler yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    };

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setError("");
    setSuccess("");

    setForm(
      (current) => {
        const next = {
          ...current,
          [name]: value,
        };

        /*
         * SATIŞ FİYATI MANUEL DEĞİŞTİ
         * --------------------------------
         * Kullanıcı satış fiyatını elle
         * girerse kâr oranı otomatik
         * hesaplanır.
         */
        if (
          name ===
          "salePrice"
        ) {
          const calculatedProfit =
            calculateProfitRate({
              purchasePrice:
                next.purchasePrice,

              purchasePriceType:
                next.purchasePriceType,

              salePrice:
                value,

              salePriceType:
                next.salePriceType,

              vatRate:
                next.vatRate,
            });

          next.profitRate =
            calculatedProfit
              .toFixed(2);

          return next;
        }

        /*
         * ALIŞ / KDV / KÂR / SATIŞ TİPİ
         * değiştiğinde satış fiyatını
         * otomatik hesapla.
         */
        if (
          name ===
            "purchasePrice" ||
          name ===
            "purchasePriceType" ||
          name ===
            "profitRate" ||
          name ===
            "salePriceType" ||
          name ===
            "vatRate"
        ) {
          const calculatedSale =
            calculateSalePrice({
              purchasePrice:
                next.purchasePrice,

              purchasePriceType:
                next.purchasePriceType,

              profitRate:
                next.profitRate,

              salePriceType:
                next.salePriceType,

              vatRate:
                next.vatRate,
            });

          next.salePrice =
            calculatedSale > 0
              ? calculatedSale.toFixed(
                  2
                )
              : "";
        }

        return next;
      }
    );
  };

  /*
   * Ekrandaki gerçek satış fiyatı.
   * Artık burada eski %70 hesaplaması
   * gösterilmiyor.
   */
  const currentSalePrice =
    useMemo(() => {
      return normalizeNumber(
        form.salePrice
      );
    }, [
      form.salePrice,
    ]);

  const currentProfitRate =
    useMemo(() => {
      return normalizeNumber(
        form.profitRate
      );
    }, [
      form.profitRate,
    ]);

  const handleSave =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (
        !form.name.trim()
      ) {
        setError(
          "Ürün adı zorunludur."
        );
        return;
      }

      if (
        normalizeNumber(
          form.salePrice
        ) < 0
      ) {
        setError(
          "Satış fiyatı geçerli değil."
        );
        return;
      }

      try {
        setSaving(true);

        const payload = {
          name:
            form.name.trim(),

          barcode:
            form.barcode.trim(),

          categoryId:
            form.categoryId ||
            null,

          brand:
            form.brand.trim(),

          unit:
            form.unit ||
            "Adet",

          purchasePrice:
            normalizeNumber(
              form.purchasePrice
            ),

          purchasePriceType:
            form.purchasePriceType,

          profitRate:
            normalizeNumber(
              form.profitRate
            ),

          salePrice:
            normalizeNumber(
              form.salePrice
            ),

          salePriceType:
            form.salePriceType,

          vatRate:
            normalizeNumber(
              form.vatRate
            ),

          stockQuantity:
            normalizeNumber(
              form.stockQuantity
            ),

          criticalStock:
            normalizeNumber(
              form.criticalStock
            ),

          minSalePrice:
            normalizeNumber(
              form.minSalePrice
            ),

          description:
            form.description.trim(),
        };

        await productService.create(
          payload
        );

        setSuccess(
          "Ürün başarıyla kaydedildi."
        );

        setTimeout(() => {
          navigate(
            "/products"
          );
        }, 600);
      } catch (err) {
        console.error(
          "Ürün kaydedilemedi:",
          err
        );

        setError(
          err?.message ||
            "Ürün kaydedilirken bir hata oluştu."
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="new-product-page">

      {/* HEADER */}
      <div className="new-product-header">

        <div>
          <button
            type="button"
            className="new-product-back"
            onClick={() =>
              navigate(
                "/products"
              )
            }
          >
            <MdArrowBack />
            Ürünlere Dön
          </button>

          <div className="new-product-title">
            <span>
              Ürün Yönetimi
            </span>

            <h1>
              Yeni Ürün
            </h1>

            <p>
              Yeni ürün kartını
              oluştur ve stok
              bilgilerini tanımla.
            </p>
          </div>
        </div>

        <div className="new-product-header-icon">
          <MdInventory2 />
        </div>

      </div>

      {/* ALERT */}
      {error && (
        <div className="new-product-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="new-product-alert success">
          {success}
        </div>
      )}

      <form
        className="new-product-layout"
        onSubmit={
          handleSave
        }
      >

        <div className="new-product-main">

          {/* TEMEL BİLGİLER */}
          <section className="new-product-card">

            <div className="new-product-card-header">
              <div>
                <span>
                  Temel Bilgiler
                </span>

                <h2>
                  Ürün Tanımı
                </h2>
              </div>

              <MdInventory2 />
            </div>

            <div className="new-product-grid two">

              <div className="new-product-field full">
                <label>
                  Ürün Adı *
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Örn. Domestos Pro Çamaşır Suyu"
                  autoFocus
                />
              </div>

              <div className="new-product-field">
                <label>
                  Barkod
                </label>

                <div className="new-product-input-icon">
                  <MdBarcodeReader />

                  <input
                    type="text"
                    name="barcode"
                    value={
                      form.barcode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Barkod"
                  />
                </div>
              </div>

              <div className="new-product-field">
                <label>
                  Kategori
                </label>

                <div className="new-product-input-icon">
                  <MdCategory />

                  <select
                    name="categoryId"
                    value={
                      form.categoryId
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Kategori seçin
                    </option>

                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="new-product-field">
                <label>
                  Marka
                </label>

                <input
                  type="text"
                  name="brand"
                  value={
                    form.brand
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Marka"
                />
              </div>

              <div className="new-product-field">
                <label>
                  Birim
                </label>

                <select
                  name="unit"
                  value={
                    form.unit
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="Adet">
                    Adet
                  </option>

                  <option value="Koli">
                    Koli
                  </option>

                  <option value="Paket">
                    Paket
                  </option>

                  <option value="Kg">
                    Kg
                  </option>

                  <option value="Lt">
                    Lt
                  </option>

                  <option value="Metre">
                    Metre
                  </option>

                  <option value="Çuval">
                    Çuval
                  </option>
                </select>
              </div>

            </div>
          </section>

          {/* FİYATLANDIRMA */}
          <section className="new-product-card">

            <div className="new-product-card-header">
              <div>
                <span>
                  Fiyatlandırma
                </span>

                <h2>
                  Alış ve Satış Fiyatları
                </h2>
              </div>

              <MdPriceChange />
            </div>

            <div className="new-product-grid three">

              <div className="new-product-field">
                <label>
                  Alış Fiyatı
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="purchasePrice"
                  value={
                    form.purchasePrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="new-product-field">
                <label>
                  Alış Fiyatı Tipi
                </label>

                <select
                  name="purchasePriceType"
                  value={
                    form.purchasePriceType
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="exclusive">
                    KDV Hariç
                  </option>

                  <option value="inclusive">
                    KDV Dahil
                  </option>
                </select>
              </div>

              <div className="new-product-field">
                <label>
                  KDV Oranı
                </label>

                <div className="new-product-input-icon">
                  <MdPercent />

                  <select
                    name="vatRate"
                    value={
                      form.vatRate
                    }
                    onChange={
                      handleChange
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

              <div className="new-product-field">
                <label>
                  Kâr Oranı %
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="profitRate"
                  value={
                    form.profitRate
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Örn. 35"
                />
              </div>

              <div className="new-product-field">
                <label>
                  Satış Fiyatı
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="salePrice"
                  value={
                    form.salePrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="new-product-field">
                <label>
                  Satış Fiyatı Tipi
                </label>

                <select
                  name="salePriceType"
                  value={
                    form.salePriceType
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="inclusive">
                    KDV Dahil
                  </option>

                  <option value="exclusive">
                    KDV Hariç
                  </option>
                </select>
              </div>

            </div>

            <div className="new-product-price-preview">

              <div>
                <span>
                  Güncel Satış Fiyatı
                </span>

                <strong>
                  ₺{" "}
                  {money(
                    currentSalePrice
                  )}
                </strong>
              </div>

              <small>
                Kâr Oranı:{" "}
                {currentProfitRate.toLocaleString(
                  "tr-TR",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
                %
                {" • "}
                {form.salePriceType ===
                "inclusive"
                  ? "KDV Dahil"
                  : "KDV Hariç"}
              </small>

            </div>

          </section>

          {/* STOK */}
          <section className="new-product-card">

            <div className="new-product-card-header">
              <div>
                <span>
                  Stok
                </span>

                <h2>
                  Stok Bilgileri
                </h2>
              </div>

              <MdInventory2 />
            </div>

            <div className="new-product-grid three">

              <div className="new-product-field">
                <label>
                  Başlangıç Stoku
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="stockQuantity"
                  value={
                    form.stockQuantity
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0"
                />
              </div>

              <div className="new-product-field">
                <label>
                  Kritik Stok
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="criticalStock"
                  value={
                    form.criticalStock
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0"
                />
              </div>

              <div className="new-product-field">
                <label>
                  Minimum Satış Fiyatı
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="minSalePrice"
                  value={
                    form.minSalePrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0,00"
                />
              </div>

            </div>

          </section>

          {/* AÇIKLAMA */}
          <section className="new-product-card">

            <div className="new-product-card-header">
              <div>
                <span>
                  Notlar
                </span>

                <h2>
                  Açıklama
                </h2>
              </div>
            </div>

            <textarea
              name="description"
              value={
                form.description
              }
              onChange={
                handleChange
              }
              placeholder="Ürün hakkında not veya açıklama..."
              rows="5"
            />

          </section>

        </div>

        {/* SAĞ PANEL */}
        <aside className="new-product-side">

          <section className="new-product-summary">

            <div className="new-product-summary-head">
              <span>
                Ürün Özeti
              </span>

              <strong>
                Yeni Kart
              </strong>
            </div>

            <div className="new-product-summary-row">
              <span>
                Ürün
              </span>

              <strong>
                {form.name ||
                  "Yeni ürün"}
              </strong>
            </div>

            <div className="new-product-summary-row">
              <span>
                Birim
              </span>

              <strong>
                {form.unit}
              </strong>
            </div>

            <div className="new-product-summary-row">
              <span>
                KDV
              </span>

              <strong>
                %{form.vatRate}
              </strong>
            </div>

            <div className="new-product-summary-row">
              <span>
                Satış
              </span>

              <strong>
                {form.salePriceType ===
                "inclusive"
                  ? "KDV Dahil"
                  : "KDV Hariç"}
              </strong>
            </div>

            <div className="new-product-summary-total">
              <span>
                Satış Fiyatı
              </span>

              <strong>
                ₺{" "}
                {money(
                  currentSalePrice
                )}
              </strong>
            </div>

          </section>

          <button
            type="submit"
            className="new-product-save"
            disabled={
              saving ||
              loading
            }
          >
            <MdSave />

            <span>
              {saving
                ? "Kaydediliyor..."
                : "Ürünü Kaydet"}
            </span>
          </button>

          <button
            type="button"
            className="new-product-cancel"
            onClick={() =>
              navigate(
                "/products"
              )
            }
          >
            Vazgeç
          </button>

        </aside>

      </form>
    </div>
  );
}