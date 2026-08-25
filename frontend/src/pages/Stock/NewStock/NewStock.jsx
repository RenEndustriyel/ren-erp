import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdArrowForward,
  MdCheckCircle,
  MdCloudUpload,
  MdInfo,
  MdInventory2,
  MdPercent,
  MdSave,
  MdSell,
  MdTag,
} from "react-icons/md";

import {
  createProduct,
  getProducts,
  getCategories,
  getBrands,
  getUnits,
} from "../../../lib/stockStore";

import "./NewStock.css";

const VAT_OPTIONS = [
  0,
  1,
  10,
  20,
];

const INITIAL_FORM = {
  name: "",
  code: "",
  barcode: "",
  category: "",
  brand: "",
  model: "",
  unit: "Adet",
  purchaseUnit: "Adet",

  stockTracking: true,
  openingStock: "0",
  criticalStockEnabled: false,
  criticalStock: "0",

  purchaseMode: "exclusive",
  purchasePrice: "",
  purchaseVat: 20,

  profitRate: "25",

  salesMode: "exclusive",
  salesPrice: "",
  salesVat: 20,

  supplier: "",
  origin: "",
  description: "",
  active: true,
};


/* =========================================================
   OTOMATİK STOK KODU
========================================================= */

function getNextStockCode() {
  const products =
    getProducts();

  let highestNumber = 0;

  products.forEach(
    (product) => {
      const code =
        String(
          product?.code || ""
        )
          .trim()
          .toUpperCase();

      const match =
        code.match(
          /^STK-(\d{4})$/
        );

      if (!match) {
        return;
      }

      const number =
        Number(
          match[1]
        );

      if (
        Number.isFinite(
          number
        ) &&
        number >
          highestNumber
      ) {
        highestNumber =
          number;
      }
    }
  );

  return `STK-${String(
    highestNumber + 1
  ).padStart(4, "0")}`;
}


/* =========================================================
   SAYI
========================================================= */

function parseNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  let text =
    String(value).trim();

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (
    text.includes(",")
  ) {
    text =
      text.replace(
        ",",
        "."
      );
  }

  const number =
    Number(text);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


/* =========================================================
   PARA
========================================================= */

function formatMoney(
  value
) {
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


/* =========================================================
   KDV HESAPLARI
========================================================= */

function getNetPrice(
  price,
  mode,
  vat
) {
  const value =
    parseNumber(price);

  const rate =
    Number(vat) / 100;

  if (
    mode === "inclusive"
  ) {
    return rate > 0
      ? value /
          (1 + rate)
      : value;
  }

  return value;
}


function getGrossPrice(
  netPrice,
  vat
) {
  return (
    Number(netPrice || 0) *
    (
      1 +
      Number(vat || 0) /
        100
    )
  );
}


/* =========================================================
   KÂR
========================================================= */

function calculateSaleFromProfit(
  purchaseNet,
  profitRate
) {
  return (
    Number(
      purchaseNet || 0
    ) *
    (
      1 +
      Number(
        profitRate || 0
      ) / 100
    )
  );
}


function calculateProfitRate(
  purchaseNet,
  saleNet
) {
  if (
    !purchaseNet ||
    purchaseNet <= 0
  ) {
    return 0;
  }

  return (
    (
      (
        Number(
          saleNet || 0
        ) -
        purchaseNet
      ) /
      purchaseNet
    ) *
    100
  );
}


/* =========================================================
   LABEL
========================================================= */

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <label className="ren-field-label">

      {children}

      {required && (
        <b>*</b>
      )}

    </label>
  );
}


/* =========================================================
   KDV TÜRÜ
========================================================= */

function PriceTypeSelector({
  value,
  onChange,
}) {
  return (
    <div className="ren-price-type-selector">

      <button
        type="button"
        className={
          value ===
          "exclusive"
            ? "selected"
            : ""
        }
        onClick={() =>
          onChange(
            "exclusive"
          )
        }
      >

        <span className="ren-radio-dot" />

        KDV Hariç

      </button>


      <button
        type="button"
        className={
          value ===
          "inclusive"
            ? "selected"
            : ""
        }
        onClick={() =>
          onChange(
            "inclusive"
          )
        }
      >

        <span className="ren-radio-dot" />

        KDV Dahil

      </button>

    </div>
  );
}


/* =========================================================
   PARA INPUT
========================================================= */

function MoneyInput({
  value,
  onChange,
}) {
  return (
    <div className="ren-money-input">

      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder="0,00"
      />

      <span>
        TL
      </span>

    </div>
  );
}


/* =========================================================
   ANA COMPONENT
========================================================= */

export default function NewStock() {

  const [
    form,
    setForm,
  ] = useState(
    () => ({
      ...INITIAL_FORM,
      code:
        getNextStockCode(),
    })
  );


  const [
    imagePreview,
    setImagePreview,
  ] = useState("");


  const [
    saved,
    setSaved,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    brands,
    setBrands,
  ] = useState([]);


  const [
    units,
    setUnits,
  ] = useState([]);


  /* =========================================================
     TANIMLAR
  ========================================================= */

  const loadDefinitions =
    () => {

      try {

        setCategories(
          getCategories()
        );

        setBrands(
          getBrands()
        );

        setUnits(
          getUnits()
        );

      } catch (err) {

        console.error(
          "Stok tanımları yüklenemedi:",
          err
        );

      }

    };


  useEffect(() => {

    loadDefinitions();

    const refresh =
      () => {
        loadDefinitions();
      };

    window.addEventListener(
      "ren-categories-changed",
      refresh
    );

    window.addEventListener(
      "ren-brands-changed",
      refresh
    );

    window.addEventListener(
      "ren-units-changed",
      refresh
    );

    return () => {

      window.removeEventListener(
        "ren-categories-changed",
        refresh
      );

      window.removeEventListener(
        "ren-brands-changed",
        refresh
      );

      window.removeEventListener(
        "ren-units-changed",
        refresh
      );

    };

  }, []);


  /* =========================================================
     FIELD
  ========================================================= */

  const updateField = (
    field,
    value
  ) => {

    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setSaved(false);
    setError("");

  };


  /* =========================================================
     ALIŞ
  ========================================================= */

  const purchaseNet =
    useMemo(
      () =>
        getNetPrice(
          form.purchasePrice,
          form.purchaseMode,
          form.purchaseVat
        ),
      [
        form.purchasePrice,
        form.purchaseMode,
        form.purchaseVat,
      ]
    );


  const purchaseGross =
    useMemo(
      () =>
        getGrossPrice(
          purchaseNet,
          form.purchaseVat
        ),
      [
        purchaseNet,
        form.purchaseVat,
      ]
    );


  /* =========================================================
     SATIŞ
  ========================================================= */

  const saleNet =
    useMemo(
      () =>
        getNetPrice(
          form.salesPrice,
          form.salesMode,
          form.salesVat
        ),
      [
        form.salesPrice,
        form.salesMode,
        form.salesVat,
      ]
    );


  const saleGross =
    useMemo(
      () =>
        getGrossPrice(
          saleNet,
          form.salesVat
        ),
      [
        saleNet,
        form.salesVat,
      ]
    );


  /* =========================================================
     OTOMATİK SATIŞ
  ========================================================= */

  const calculatedSaleNet =
    useMemo(
      () =>
        calculateSaleFromProfit(
          purchaseNet,
          form.profitRate
        ),
      [
        purchaseNet,
        form.profitRate,
      ]
    );


  const calculatedSaleGross =
    getGrossPrice(
      calculatedSaleNet,
      form.salesVat
    );


  const actualProfitRate =
    calculateProfitRate(
      purchaseNet,
      saleNet
    );


  const actualGrossProfit =
    saleNet -
    purchaseNet;


  /* =========================================================
     ALIŞ FİYATI
  ========================================================= */

  const handlePurchasePriceChange =
    (value) => {

      const newPurchaseNet =
        getNetPrice(
          value,
          form.purchaseMode,
          form.purchaseVat
        );

      const newSaleNet =
        calculateSaleFromProfit(
          newPurchaseNet,
          form.profitRate
        );

      const newSalePrice =
        form.salesMode ===
        "inclusive"
          ? getGrossPrice(
              newSaleNet,
              form.salesVat
            )
          : newSaleNet;

      setForm(
        (current) => ({
          ...current,

          purchasePrice:
            value,

          salesPrice:
            newSaleNet > 0
              ? newSalePrice
              : "",
        })
      );

      setSaved(false);
      setError("");

    };


  /* =========================================================
     ALIŞ KDV TÜRÜ
  ========================================================= */

  const handlePurchaseModeChange =
    (mode) => {

      const currentNet =
        purchaseNet;

      setForm(
        (current) => ({
          ...current,

          purchaseMode:
            mode,

          purchasePrice:
            currentNet > 0
              ? mode ===
                "inclusive"
                ? getGrossPrice(
                    currentNet,
                    current.purchaseVat
                  )
                : currentNet
              : current.purchasePrice,
        })
      );

      setSaved(false);
      setError("");

    };


  /* =========================================================
     SATIŞ KDV TÜRÜ
  ========================================================= */

  const handleSalesModeChange =
    (mode) => {

      const currentNet =
        saleNet > 0
          ? saleNet
          : calculatedSaleNet;

      setForm(
        (current) => ({
          ...current,

          salesMode:
            mode,

          salesPrice:
            currentNet > 0
              ? mode ===
                "inclusive"
                ? getGrossPrice(
                    currentNet,
                    current.salesVat
                  )
                : currentNet
              : current.salesPrice,
        })
      );

      setSaved(false);
      setError("");

    };


  /* =========================================================
     ALIŞ KDV
  ========================================================= */

  const handlePurchaseVatChange =
    (vat) => {

      const currentNet =
        purchaseNet;

      setForm(
        (current) => ({
          ...current,

          purchaseVat:
            vat,

          purchasePrice:
            currentNet > 0
              ? current.purchaseMode ===
                "inclusive"
                ? getGrossPrice(
                    currentNet,
                    vat
                  )
                : currentNet
              : current.purchasePrice,
        })
      );

      setSaved(false);
      setError("");

    };


  /* =========================================================
     SATIŞ KDV
  ========================================================= */

  const handleSalesVatChange =
    (vat) => {

      const currentNet =
        saleNet > 0
          ? saleNet
          : calculatedSaleNet;

      setForm(
        (current) => ({
          ...current,

          salesVat:
            vat,

          salesPrice:
            currentNet > 0
              ? current.salesMode ===
                "inclusive"
                ? getGrossPrice(
                    currentNet,
                    vat
                  )
                : currentNet
              : current.salesPrice,
        })
      );

      setSaved(false);
      setError("");

    };


  /* =========================================================
     KÂR
  ========================================================= */

  const handleProfitChange =
    (value) => {

      const newSaleNet =
        calculateSaleFromProfit(
          purchaseNet,
          value
        );

      const newSalePrice =
        newSaleNet > 0
          ? form.salesMode ===
            "inclusive"
            ? getGrossPrice(
                newSaleNet,
                form.salesVat
              )
            : newSaleNet
          : "";

      setForm(
        (current) => ({
          ...current,

          profitRate:
            value,

          salesPrice:
            newSalePrice,
        })
      );

      setSaved(false);
      setError("");

    };


  /* =========================================================
     SATIŞ FİYATI
  ========================================================= */

  const handleSalesPriceChange =
    (value) => {

      const newSaleNet =
        getNetPrice(
          value,
          form.salesMode,
          form.salesVat
        );

      const newProfit =
        calculateProfitRate(
          purchaseNet,
          newSaleNet
        );

      setForm(
        (current) => ({
          ...current,

          salesPrice:
            value,

          profitRate:
            newProfit.toFixed(
              2
            ),
        })
      );

      setSaved(false);
      setError("");

    };


  /* =========================================================
     FOTOĞRAF
  ========================================================= */

  const handleImageChange =
    (event) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        file.size >
        2 * 1024 * 1024
      ) {

        alert(
          "Ürün fotoğrafı en fazla 2 MB olabilir."
        );

        return;
      }

      const url =
        URL.createObjectURL(
          file
        );

      setImagePreview(url);

      setSaved(false);
      setError("");

    };


  /* =========================================================
     KAYDET
  ========================================================= */

  const handleSave =
    () => {

      setError("");
      setSaved(false);

      if (
        !form.name.trim()
      ) {

        setError(
          "Ürün adı zorunludur."
        );

        return;
      }


      /*
       * Kod boş bırakılmışsa
       * otomatik oluştur.
       *
       * Kullanıcı elle değiştirdiyse
       * yazdığı kod korunur.
       */

      const finalCode =
        form.code.trim()
          ? form.code.trim()
          : getNextStockCode();


      setSaving(true);

      try {

        const finalSaleNet =
          saleNet > 0
            ? saleNet
            : calculatedSaleNet;

        const finalSaleGross =
          saleNet > 0
            ? saleGross
            : calculatedSaleGross;

        const finalProfitRate =
          finalSaleNet > 0
            ? calculateProfitRate(
                purchaseNet,
                finalSaleNet
              )
            : parseNumber(
                form.profitRate
              );

        const openingStock =
          parseNumber(
            form.openingStock
          );


        const product =
          createProduct({
            ...form,

            code:
              finalCode,

            stock:
              openingStock,

            openingStock:
              openingStock,

            criticalStock:
              parseNumber(
                form.criticalStock
              ),

            purchaseNet:
              Number(
                purchaseNet.toFixed(
                  4
                )
              ),

            purchaseGross:
              Number(
                purchaseGross.toFixed(
                  4
                )
              ),

            salesNet:
              Number(
                finalSaleNet.toFixed(
                  4
                )
              ),

            salesGross:
              Number(
                finalSaleGross.toFixed(
                  4
                )
              ),

            profitRate:
              Number(
                finalProfitRate.toFixed(
                  2
                )
              ),

            grossProfit:
              Number(
                (
                  finalSaleNet -
                  purchaseNet
                ).toFixed(
                  4
                )
              ),

            image:
              imagePreview ||
              null,
          });


        console.log(
          "REN ERP Ürün kaydedildi:",
          product
        );


        setSaved(true);


        /*
         * Yeni ürün formu temizleniyor.
         * Yeni ürün için bir sonraki STK kodu
         * otomatik oluşturuluyor.
         */

        setForm({
          ...INITIAL_FORM,
          code:
            getNextStockCode(),
        });


        setImagePreview("");

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


  /* =========================================================
     GÖSTERİM
  ========================================================= */

  const displaySaleNet =
    saleNet > 0
      ? saleNet
      : calculatedSaleNet;


  const displaySaleGross =
    saleNet > 0
      ? saleGross
      : calculatedSaleGross;


  const displayProfitRate =
    saleNet > 0
      ? actualProfitRate
      : parseNumber(
          form.profitRate
        );


  const displayGrossProfit =
    displaySaleNet -
    purchaseNet;


  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="ren-new-stock">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ren-new-stock-header">

        <div>

          <div className="ren-breadcrumb">

            <span>
              Stok
            </span>

            <MdArrowForward />

            <strong>
              Yeni Stok
            </strong>

          </div>


          <h1>
            Yeni Stok / Ürün Ekleme
          </h1>


          <p>
            Yeni ürün kartını oluşturun ve
            fiyatlandırmasını belirleyin.
          </p>

        </div>


        <div className="ren-header-actions">

          <button
            type="button"
            className="ren-button secondary"
            onClick={() =>
              window.history.back()
            }
          >
            Vazgeç
          </button>


          <button
            type="button"
            className="ren-button secondary"
          >
            Taslak Kaydet
          </button>


          <button
            type="button"
            className="ren-button primary"
            onClick={
              handleSave
            }
            disabled={
              saving
            }
          >

            <MdSave />

            {saving
              ? "Kaydediliyor..."
              : "Kaydet"}

          </button>

        </div>

      </header>


      {/* =====================================================
          MESAJ
      ===================================================== */}

      {saved && (
        <div className="ren-save-message">

          <MdCheckCircle />

          Ürün bilgileri kaydedildi.

        </div>
      )}


      {error && (
        <div
          className="ren-save-message"
          style={{
            color:
              "#c83d3d",
            background:
              "#fff3f3",
            borderColor:
              "#f0cccc",
          }}
        >

          <MdInfo />

          {error}

        </div>
      )}


      {/* =====================================================
          TEMEL BİLGİLER
      ===================================================== */}

      <section className="ren-card">

        <div className="ren-card-title">

          <div className="ren-section-icon blue">
            <MdInventory2 />
          </div>


          <div>

            <h2>
              Temel Bilgiler
            </h2>

            <span>
              Ürünün temel tanımlama bilgileri
            </span>

          </div>

        </div>


        <div className="ren-basic-layout">

          <div className="ren-basic-fields">


            <div className="ren-field">

              <FieldLabel required>
                Ürün Adı
              </FieldLabel>

              <input
                type="text"
                value={
                  form.name
                }
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Ürün adını giriniz"
              />

            </div>


            {/* =================================================
                OTOMATİK STOK KODU
            ================================================= */}

            <div className="ren-field">

              <FieldLabel required>
                Ürün Kodu
              </FieldLabel>

              <input
                type="text"
                value={
                  form.code
                }
                onChange={(event) =>
                  updateField(
                    "code",
                    event.target.value
                  )
                }
                placeholder="Otomatik oluşturulur"
              />

              <small
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                  color:
                    "#8a96a6",
                  fontSize:
                    "9px",
                }}
              >
                Yeni ürünlerde STK-0001
                formatında otomatik oluşturulur.
              </small>

            </div>


            <div className="ren-field">

              <FieldLabel>
                Barkod
              </FieldLabel>

              <input
                type="text"
                value={
                  form.barcode
                }
                onChange={(event) =>
                  updateField(
                    "barcode",
                    event.target.value
                  )
                }
                placeholder="Barkod numarasını giriniz"
              />

            </div>


            {/* =================================================
                KATEGORİ
            ================================================= */}

            <div className="ren-field">

              <FieldLabel required>
                Kategori
              </FieldLabel>

              <select
                value={
                  form.category
                }
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value
                  )
                }
              >

                <option value="">
                  Kategori seçiniz
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.name
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


            {/* =================================================
                MARKA
            ================================================= */}

            <div className="ren-field">

              <FieldLabel>
                Marka
              </FieldLabel>

              <select
                value={
                  form.brand
                }
                onChange={(event) =>
                  updateField(
                    "brand",
                    event.target.value
                  )
                }
              >

                <option value="">
                  Marka seçiniz
                </option>

                {brands.map(
                  (brand) => (
                    <option
                      key={
                        brand.id
                      }
                      value={
                        brand.name
                      }
                    >
                      {
                        brand.name
                      }
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="ren-field">

              <FieldLabel>
                Model
              </FieldLabel>

              <input
                type="text"
                value={
                  form.model
                }
                onChange={(event) =>
                  updateField(
                    "model",
                    event.target.value
                  )
                }
                placeholder="Model giriniz"
              />

            </div>


            {/* =================================================
                BİRİM
            ================================================= */}

            <div className="ren-field">

              <FieldLabel required>
                Birim
              </FieldLabel>

              <select
                value={
                  form.unit
                }
                onChange={(event) =>
                  updateField(
                    "unit",
                    event.target.value
                  )
                }
              >

                {units.length ===
                0 ? (
                  <option value="Adet">
                    Adet
                  </option>
                ) : (
                  units.map(
                    (unit) => (
                      <option
                        key={
                          unit.id
                        }
                        value={
                          unit.name
                        }
                      >
                        {
                          unit.name
                        }
                      </option>
                    )
                  )
                )}

              </select>

            </div>


            <div className="ren-field">

              <FieldLabel>
                Alış / Satış Birimi
              </FieldLabel>

              <select
                value={
                  form.purchaseUnit
                }
                onChange={(event) =>
                  updateField(
                    "purchaseUnit",
                    event.target.value
                  )
                }
              >

                {units.length ===
                0 ? (
                  <option value="Adet">
                    Adet
                  </option>
                ) : (
                  units.map(
                    (unit) => (
                      <option
                        key={
                          unit.id
                        }
                        value={
                          unit.name
                        }
                      >
                        {
                          unit.name
                        }
                      </option>
                    )
                  )
                )}

              </select>

            </div>

          </div>


          {/* =================================================
              FOTOĞRAF
          ================================================= */}

          <div className="ren-photo-box">

            <FieldLabel>
              Ürün Fotoğrafı
            </FieldLabel>

            <label className="ren-photo-upload">

              {imagePreview ? (
                <img
                  src={
                    imagePreview
                  }
                  alt="Ürün"
                />
              ) : (
                <>

                  <MdCloudUpload />

                  <strong>
                    Fotoğraf Yükle
                  </strong>

                  <span>
                    veya sürükleyip bırakın
                  </span>

                  <small>
                    JPG, PNG · Maks. 2 MB
                  </small>

                </>
              )}


              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={
                  handleImageChange
                }
              />

            </label>

          </div>

        </div>

      </section>


      {/* =====================================================
          STOK BİLGİLERİ
      ===================================================== */}

      <section className="ren-card">

        <div className="ren-card-title">

          <div className="ren-section-icon blue">
            <MdInventory2 />
          </div>

          <div>

            <h2>
              Stok Bilgileri
            </h2>

            <span>
              Stok takibi ve başlangıç miktarı
            </span>

          </div>

        </div>


        <div className="ren-stock-grid">

          <div className="ren-field">

            <FieldLabel>
              Stok Takibi
            </FieldLabel>

            <div className="ren-radio-box">

              <label>

                <input
                  type="radio"
                  checked={
                    form.stockTracking
                  }
                  onChange={() =>
                    updateField(
                      "stockTracking",
                      true
                    )
                  }
                />

                Yapılsın

              </label>


              <label>

                <input
                  type="radio"
                  checked={
                    !form.stockTracking
                  }
                  onChange={() =>
                    updateField(
                      "stockTracking",
                      false
                    )
                  }
                />

                Yapılmasın

              </label>

            </div>

          </div>


          <div className="ren-field">

            <FieldLabel>
              Başlangıç Stok Miktarı
            </FieldLabel>

            <input
              type="text"
              inputMode="decimal"
              value={
                form.openingStock
              }
              onChange={(event) =>
                updateField(
                  "openingStock",
                  event.target.value
                )
              }
              placeholder="0"
            />

          </div>


          <div className="ren-field">

            <FieldLabel>
              Kritik Stok Seviyesi
            </FieldLabel>

            <input
              type="text"
              inputMode="decimal"
              value={
                form.criticalStock
              }
              disabled={
                !form.criticalStockEnabled
              }
              onChange={(event) =>
                updateField(
                  "criticalStock",
                  event.target.value
                )
              }
              placeholder="0"
            />

          </div>


          <div className="ren-field">

            <FieldLabel>
              Kritik Stok Uyarısı
            </FieldLabel>

            <label className="ren-checkbox">

              <input
                type="checkbox"
                checked={
                  form.criticalStockEnabled
                }
                onChange={(event) =>
                  updateField(
                    "criticalStockEnabled",
                    event.target.checked
                  )
                }
              />

              Etkinleştir

            </label>

          </div>

        </div>

      </section>


      {/* =====================================================
          FİYATLANDIRMA
      ===================================================== */}

      <section className="ren-card pricing-card">

        <div className="ren-card-title">

          <div className="ren-section-icon teal">
            <MdSell />
          </div>

          <div>

            <h2>
              Fiyatlandırma
            </h2>

            <span>
              Alış, kâr ve satış fiyatını birlikte yönetin
            </span>

          </div>

        </div>


        <div className="ren-price-chain">


          {/* =================================================
              ALIŞ
          ================================================= */}

          <div className="ren-price-chain-item">

            <div className="ren-price-chain-title">

              <span>
                ALIŞ FİYATI
              </span>

              <small>
                Manuel
              </small>

            </div>


            <PriceTypeSelector
              value={
                form.purchaseMode
              }
              onChange={
                handlePurchaseModeChange
              }
            />


            <MoneyInput
              value={
                form.purchasePrice
              }
              onChange={
                handlePurchasePriceChange
              }
            />


            <div className="ren-price-vat">

              <span>
                KDV Oranı
              </span>

              <select
                value={
                  form.purchaseVat
                }
                onChange={(event) =>
                  handlePurchaseVatChange(
                    Number(
                      event.target.value
                    )
                  )
                }
              >

                {VAT_OPTIONS.map(
                  (vat) => (
                    <option
                      key={vat}
                      value={vat}
                    >
                      %{vat}
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="ren-price-secondary">

              <span>
                KDV Hariç
              </span>

              <strong>
                {
                  formatMoney(
                    purchaseNet
                  )
                } TL
              </strong>

            </div>


            <div className="ren-price-secondary">

              <span>
                KDV Dahil
              </span>

              <strong>
                {
                  formatMoney(
                    purchaseGross
                  )
                } TL
              </strong>

            </div>

          </div>


          <div className="ren-price-chain-arrow">

            <MdArrowForward />

          </div>


          {/* =================================================
              KÂR
          ================================================= */}

          <div className="ren-price-chain-item profit">

            <div className="ren-price-chain-title">

              <span>
                KÂR ORANI
              </span>

              <small>
                Manuel
              </small>

            </div>


            <div className="ren-profit-input">

              <input
                type="text"
                inputMode="decimal"
                value={
                  form.profitRate
                }
                onChange={(event) =>
                  handleProfitChange(
                    event.target.value
                  )
                }
              />

              <span>
                %
              </span>

            </div>


            <div className="ren-profit-result">

              <MdPercent />

              <div>

                <span>
                  Brüt Kâr
                </span>

                <strong>
                  {
                    formatMoney(
                      calculatedSaleNet -
                        purchaseNet
                    )
                  } TL
                </strong>

              </div>

            </div>


            <small className="ren-profit-help">

              Alış fiyatına uygulanacak
              kâr oranı.

            </small>

          </div>


          <div className="ren-price-chain-arrow">

            <MdArrowForward />

          </div>


          {/* =================================================
              SATIŞ
          ================================================= */}

          <div className="ren-price-chain-item sale">

            <div className="ren-price-chain-title">

              <span>
                SATIŞ FİYATI
              </span>

              <small>
                Manuel
              </small>

            </div>


            <PriceTypeSelector
              value={
                form.salesMode
              }
              onChange={
                handleSalesModeChange
              }
            />


            <MoneyInput
              value={
                form.salesPrice
              }
              onChange={
                handleSalesPriceChange
              }
            />


            <div className="ren-price-vat">

              <span>
                KDV Oranı
              </span>

              <select
                value={
                  form.salesVat
                }
                onChange={(event) =>
                  handleSalesVatChange(
                    Number(
                      event.target.value
                    )
                  )
                }
              >

                {VAT_OPTIONS.map(
                  (vat) => (
                    <option
                      key={vat}
                      value={vat}
                    >
                      %{vat}
                    </option>
                  )
                )}

              </select>

            </div>


            <div className="ren-price-secondary">

              <span>
                KDV Hariç
              </span>

              <strong>
                {
                  formatMoney(
                    displaySaleNet
                  )
                } TL
              </strong>

            </div>


            <div className="ren-price-secondary">

              <span>
                KDV Dahil
              </span>

              <strong>
                {
                  formatMoney(
                    displaySaleGross
                  )
                } TL
              </strong>

            </div>

          </div>

        </div>


        <div className="ren-price-calculation-note">

          <MdInfo />

          <span>
            Alış, kâr ve satış fiyatlarının üçü
            de manuel olarak değiştirilebilir.
            Alış veya kâr değiştiğinde satış,
            satış değiştiğinde gerçek kâr oranı
            otomatik hesaplanır.
          </span>

        </div>

      </section>


      {/* =====================================================
          FİYAT ÖZETİ
      ===================================================== */}

      <section className="ren-card ren-price-summary">

        <div className="ren-card-title">

          <div className="ren-section-icon blue">
            <MdSell />
          </div>

          <div>

            <h2>
              Fiyat Özeti
            </h2>

            <span>
              Güncel ürün fiyatlandırması
            </span>

          </div>

        </div>


        <div className="ren-summary-grid">


          <div className="ren-summary-box">

            <span>
              ALIŞ · KDV HARİÇ
            </span>

            <strong>
              {
                formatMoney(
                  purchaseNet
                )
              } TL
            </strong>

          </div>


          <div className="ren-summary-box">

            <span>
              ALIŞ · KDV DAHİL
            </span>

            <strong>
              {
                formatMoney(
                  purchaseGross
                )
              } TL
            </strong>

          </div>


          <div className="ren-summary-box profit">

            <span>
              KÂR ORANI
            </span>

            <strong>
              %
              {
                formatMoney(
                  displayProfitRate
                )
              }
            </strong>

          </div>


          <div className="ren-summary-box sale">

            <span>
              SATIŞ · KDV HARİÇ
            </span>

            <strong>
              {
                formatMoney(
                  displaySaleNet
                )
              } TL
            </strong>

          </div>


          <div className="ren-summary-box sale">

            <span>
              SATIŞ · KDV DAHİL
            </span>

            <strong>
              {
                formatMoney(
                  displaySaleGross
                )
              } TL
            </strong>

          </div>


          <div className="ren-summary-box gross">

            <span>
              BRÜT KÂR
            </span>

            <strong>
              {
                formatMoney(
                  displayGrossProfit
                )
              } TL
            </strong>

          </div>

        </div>

      </section>


      {/* =====================================================
          EK BİLGİLER
      ===================================================== */}

      <section className="ren-card">

        <div className="ren-card-title">

          <div className="ren-section-icon blue">
            <MdTag />
          </div>

          <div>

            <h2>
              Ek Bilgiler
            </h2>

            <span>
              Tedarikçi ve ürün açıklamaları
            </span>

          </div>

        </div>


        <div className="ren-extra-grid">


          <div className="ren-field">

            <FieldLabel>
              Tedarikçi
            </FieldLabel>

            <select
              value={
                form.supplier
              }
              onChange={(event) =>
                updateField(
                  "supplier",
                  event.target.value
                )
              }
            >

              <option value="">
                Tedarikçi seçiniz
              </option>

              <option>
                Poyraz Gıda
              </option>

              <option>
                FCS Tedarik
              </option>

              <option>
                Diğer
              </option>

            </select>

          </div>


          <div className="ren-field">

            <FieldLabel>
              Menşei
            </FieldLabel>

            <select
              value={
                form.origin
              }
              onChange={(event) =>
                updateField(
                  "origin",
                  event.target.value
                )
              }
            >

              <option value="">
                Menşei seçiniz
              </option>

              <option>
                Türkiye
              </option>

              <option>
                İthal
              </option>

            </select>

          </div>


          <div className="ren-field">

            <FieldLabel>
              Açıklama
            </FieldLabel>

            <textarea
              value={
                form.description
              }
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              placeholder="Ürün hakkında açıklama giriniz..."
              maxLength={500}
            />

            <small className="ren-character-count">

              {
                form.description.length
              }

              {" / 500"}

            </small>

          </div>

        </div>


        <label className="ren-active-switch">

          <input
            type="checkbox"
            checked={
              form.active
            }
            onChange={(event) =>
              updateField(
                "active",
                event.target.checked
              )
            }
          />

          <span />

          Aktif

        </label>

      </section>


      {/* =====================================================
          ALT BİLGİ
      ===================================================== */}

      <div className="ren-form-footer">

        <MdInfo />

        <span>
          Fiyatlar ürün kartında saklanacak ve
          ileride satış, teklif ve fatura
          işlemlerinde kullanılacaktır.
        </span>

      </div>

    </div>
  );
}