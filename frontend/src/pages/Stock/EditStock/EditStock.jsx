import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getProductById,
  updateProduct,
} from "../../../lib/stockStore";

import "./EditStock.css";


/* =========================================================
   SAYI
========================================================= */

function numberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  let text =
    String(value)
      .trim()
      .replace(/\s/g, "");

  if (
    text.includes(",") &&
    text.includes(".")
  ) {
    text =
      text
        .replace(/\./g, "")
        .replace(",", ".");
  } else {
    text =
      text.replace(",", ".");
  }

  const result =
    Number(text);

  return Number.isFinite(result)
    ? result
    : 0;
}


/* =========================================================
   KDV HESAP
========================================================= */

function grossFromNet(
  net,
  vat
) {
  return (
    numberValue(net) *
    (
      1 +
      numberValue(vat) /
      100
    )
  );
}


function netFromGross(
  gross,
  vat
) {
  const rate =
    numberValue(vat) /
    100;

  return rate > 0
    ? numberValue(gross) /
        (1 + rate)
    : numberValue(gross);
}


/* =========================================================
   KÂR
========================================================= */

function calculateProfitRate(
  purchaseNet,
  salesNet
) {
  const purchase =
    numberValue(
      purchaseNet
    );

  const sale =
    numberValue(
      salesNet
    );

  if (
    purchase <= 0
  ) {
    return 0;
  }

  return (
    (
      (
        sale -
        purchase
      ) /
      purchase
    ) *
    100
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function EditStock() {

  const {
    id,
  } =
    useParams();

  const navigate =
    useNavigate();


  const [
    product,
    setProduct,
  ] =
    useState(null);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  /* =======================================================
     ÜRÜNÜ YÜKLE
  ======================================================= */

  useEffect(() => {

    const found =
      getProductById(
        id
      );

    if (
      found
    ) {

      const purchaseVat =
        numberValue(
          found.purchaseVat ??
          20
        );

      const salesVat =
        numberValue(
          found.salesVat ??
          found.vatRate ??
          20
        );

      const purchaseNet =
        numberValue(
          found.purchaseNet ??
          found.purchasePrice ??
          0
        );

      const salesNet =
        numberValue(
          found.salesNet ??
          found.salePrice ??
          0
        );

      const purchaseGross =
        numberValue(
          found.purchaseGross ??
          grossFromNet(
            purchaseNet,
            purchaseVat
          )
        );

      const salesGross =
        numberValue(
          found.salesGross ??
          grossFromNet(
            salesNet,
            salesVat
          )
        );

      setProduct({

        ...found,

        purchasePrice:
          purchaseNet,

        salePrice:
          salesNet,

        purchaseMode:
          found.purchaseMode ||
          "exclusive",

        salesMode:
          found.salesMode ||
          "inclusive",

        purchaseVat,

        salesVat,

        vatRate:
          salesVat,

        purchaseNet,

        purchaseGross,

        salesNet,

        salesGross,

        profitRate:
          calculateProfitRate(
            purchaseNet,
            salesNet
          ),

      });

    }

  }, [
    id,
  ]);


  /* =======================================================
     BULUNAMADI
  ======================================================= */

  if (
    !product
  ) {

    return (

      <div className="edit-stock-page">

        <div className="edit-stock-card">

          <h2>
            Ürün bulunamadı
          </h2>

          <p>
            Düzenlemek istediğiniz stok
            kaydı bulunamadı.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/stock/list"
              )
            }
          >
            STOK LİSTESİNE DÖN
          </button>

        </div>

      </div>

    );

  }


  /* =======================================================
     FIELD
  ======================================================= */

  const updateField =
    (
      field,
      value
    ) => {

      setProduct(
        (
          current
        ) => ({

          ...current,

          [field]:
            value,

        })
      );

    };


  /* =======================================================
     GÜNCEL DEĞERLER
  ======================================================= */

  const purchaseVat =
    numberValue(
      product.purchaseVat ??
      20
    );

  const salesVat =
    numberValue(
      product.salesVat ??
      product.vatRate ??
      20
    );


  const purchaseMode =
    product.purchaseMode ||
    "exclusive";

  const salesMode =
    product.salesMode ||
    "exclusive";


  const purchaseNet =
    purchaseMode ===
    "inclusive"

      ? netFromGross(
          product.purchasePrice ??
          product.purchaseGross ??
          0,
          purchaseVat
        )

      : numberValue(
          product.purchasePrice ??
          product.purchaseNet ??
          0
        );


  const salesNet =
    salesMode ===
    "inclusive"

      ? netFromGross(
          product.salePrice ??
          product.salesGross ??
          0,
          salesVat
        )

      : numberValue(
          product.salePrice ??
          product.salesNet ??
          0
        );


  const purchaseGross =
    grossFromNet(
      purchaseNet,
      purchaseVat
    );


  const salesGross =
    grossFromNet(
      salesNet,
      salesVat
    );


  const profitRate =
    calculateProfitRate(
      purchaseNet,
      salesNet
    );


  const grossProfit =
    salesNet -
    purchaseNet;


  /* =======================================================
     ALIŞ DAHİL / HARİÇ
  ======================================================= */

  const setPurchaseMode =
    (
      mode
    ) => {

      const currentNet =
        purchaseNet;


      const displayPrice =
        mode ===
        "inclusive"

          ? grossFromNet(
              currentNet,
              purchaseVat
            )

          : currentNet;


      setProduct(
        (
          current
        ) => ({

          ...current,

          purchaseMode:
            mode,

          purchasePrice:
            Number(
              displayPrice.toFixed(
                4
              )
            ),

          purchaseNet:
            Number(
              currentNet.toFixed(
                4
              )
            ),

          purchaseGross:
            Number(
              grossFromNet(
                currentNet,
                purchaseVat
              ).toFixed(
                4
              )
            ),

        })
      );

    };


  /* =======================================================
     SATIŞ DAHİL / HARİÇ
  ======================================================= */

  const setSalesMode =
    (
      mode
    ) => {

      const currentNet =
        salesNet;


      const displayPrice =
        mode ===
        "inclusive"

          ? grossFromNet(
              currentNet,
              salesVat
            )

          : currentNet;


      setProduct(
        (
          current
        ) => ({

          ...current,

          salesMode:
            mode,

          salePrice:
            Number(
              displayPrice.toFixed(
                4
              )
            ),

          salesNet:
            Number(
              currentNet.toFixed(
                4
              )
            ),

          salesGross:
            Number(
              grossFromNet(
                currentNet,
                salesVat
              ).toFixed(
                4
              )
            ),

        })
      );

    };


  /* =======================================================
     ALIŞ FİYATINI DEĞİŞTİR
  ======================================================= */

  const handlePurchaseChange =
    (
      value
    ) => {

      const displayValue =
        numberValue(
          value
        );


      const newNet =
        purchaseMode ===
        "inclusive"

          ? netFromGross(
              displayValue,
              purchaseVat
            )

          : displayValue;


      const newGross =
        grossFromNet(
          newNet,
          purchaseVat
        );


      const newSalesNet =
        calculateSaleFromProfit(
          newNet,
          profitRate
        );


      const newSalesDisplay =
        salesMode ===
        "inclusive"

          ? grossFromNet(
              newSalesNet,
              salesVat
            )

          : newSalesNet;


      setProduct(
        (
          current
        ) => ({

          ...current,

          purchasePrice:
            displayValue,

          purchaseNet:
            Number(
              newNet.toFixed(
                4
              )
            ),

          purchaseGross:
            Number(
              newGross.toFixed(
                4
              )
            ),

          salePrice:
            Number(
              newSalesDisplay.toFixed(
                4
              )
            ),

          salesNet:
            Number(
              newSalesNet.toFixed(
                4
              )
            ),

          salesGross:
            Number(
              grossFromNet(
                newSalesNet,
                salesVat
              ).toFixed(
                4
              )
            ),

        })
      );

    };


  /* =======================================================
     KÂR ORANINI DEĞİŞTİR
  ======================================================= */

  const handleProfitChange =
    (
      value
    ) => {

      const rate =
        numberValue(
          value
        );

      const newSalesNet =
        calculateSaleFromProfit(
          purchaseNet,
          rate
        );

      const newSalesGross =
        grossFromNet(
          newSalesNet,
          salesVat
        );

      const displayPrice =
        salesMode ===
        "inclusive"
          ? newSalesGross
          : newSalesNet;

      setProduct(
        (
          current
        ) => ({

          ...current,

          profitRate:
            value,

          salePrice:
            Number(
              displayPrice.toFixed(
                4
              )
            ),

          salesNet:
            Number(
              newSalesNet.toFixed(
                4
              )
            ),

          salesGross:
            Number(
              newSalesGross.toFixed(
                4
              )
            ),

        })
      );

    };


  /* =======================================================
     SATIŞ FİYATINI DEĞİŞTİR
  ======================================================= */

  const handleSalesChange =
    (
      value
    ) => {

      const displayValue =
        numberValue(
          value
        );


      const newNet =
        salesMode ===
        "inclusive"

          ? netFromGross(
              displayValue,
              salesVat
            )

          : displayValue;


      const newGross =
        grossFromNet(
          newNet,
          salesVat
        );


      const newProfitRate =
        calculateProfitRate(
          purchaseNet,
          newNet
        );


      setProduct(
        (
          current
        ) => ({

          ...current,

          salePrice:
            displayValue,

          salesNet:
            Number(
              newNet.toFixed(
                4
              )
            ),

          salesGross:
            Number(
              newGross.toFixed(
                4
              )
            ),

          profitRate:
            Number(
              newProfitRate.toFixed(
                2
              )
            ),

        })
      );

    };


  /* =======================================================
     ALIŞ KDV
  ======================================================= */

  const handlePurchaseVatChange =
    (
      value
    ) => {

      const vat =
        numberValue(
          value
        );


      const newGross =
        grossFromNet(
          purchaseNet,
          vat
        );


      const displayPrice =
        purchaseMode ===
        "inclusive"
          ? newGross
          : purchaseNet;


      setProduct(
        (
          current
        ) => ({

          ...current,

          purchaseVat:
            vat,

          purchasePrice:
            Number(
              displayPrice.toFixed(
                4
              )
            ),

          purchaseNet:
            Number(
              purchaseNet.toFixed(
                4
              )
            ),

          purchaseGross:
            Number(
              newGross.toFixed(
                4
              )
            ),

        })
      );

    };


  /* =======================================================
     SATIŞ KDV
  ======================================================= */

  const handleSalesVatChange =
    (
      value
    ) => {

      const vat =
        numberValue(
          value
        );


      const newGross =
        grossFromNet(
          salesNet,
          vat
        );


      const displayPrice =
        salesMode ===
        "inclusive"
          ? newGross
          : salesNet;


      setProduct(
        (
          current
        ) => ({

          ...current,

          salesVat:
            vat,

          vatRate:
            vat,

          salePrice:
            Number(
              displayPrice.toFixed(
                4
              )
            ),

          salesNet:
            Number(
              salesNet.toFixed(
                4
              )
            ),

          salesGross:
            Number(
              newGross.toFixed(
                4
              )
            ),

        })
      );

    };


  /* =======================================================
     SATIŞ HESAPLA
  ======================================================= */

  function calculateSaleFromProfit(
    purchaseNetValue,
    rate
  ) {

    return (
      numberValue(
        purchaseNetValue
      ) *
      (
        1 +
        numberValue(rate) /
        100
      )
    );

  }


  /* =======================================================
     STOK
  ======================================================= */

  const handleStockChange =
    (
      value
    ) => {

      updateField(
        "stock",
        numberValue(
          value
        )
      );

    };


  /* =======================================================
     KAYDET
  ======================================================= */

  const handleSave =
    () => {

      if (
        saving
      ) {
        return;
      }


      if (
        !product.name?.trim()
      ) {

        alert(
          "Ürün adı boş bırakılamaz."
        );

        return;

      }


      setSaving(
        true
      );


      try {

        const finalPurchaseNet =
          purchaseNet;


        const finalSalesNet =
          salesNet;


        const finalPurchaseVat =
          purchaseVat;


        const finalSalesVat =
          salesVat;


        const finalPurchaseGross =
          grossFromNet(
            finalPurchaseNet,
            finalPurchaseVat
          );


        const finalSalesGross =
          grossFromNet(
            finalSalesNet,
            finalSalesVat
          );


        const finalProfitRate =
          calculateProfitRate(
            finalPurchaseNet,
            finalSalesNet
          );


        const finalGrossProfit =
          finalSalesNet -
          finalPurchaseNet;


        updateProduct(
          product.id,
          {

            ...product,

            purchaseMode:
              purchaseMode,

            purchaseVat:
              finalPurchaseVat,

            purchaseNet:
              Number(
                finalPurchaseNet.toFixed(
                  4
                )
              ),

            purchaseGross:
              Number(
                finalPurchaseGross.toFixed(
                  4
                )
              ),

            /*
             * Eski alanı da koru.
             */

            purchasePrice:
              Number(
                (
                  purchaseMode ===
                  "inclusive"
                    ? finalPurchaseGross
                    : finalPurchaseNet
                ).toFixed(
                  4
                )
              ),


            salesMode:
              salesMode,

            salesVat:
              finalSalesVat,

            vatRate:
              finalSalesVat,

            salesNet:
              Number(
                finalSalesNet.toFixed(
                  4
                )
              ),

            salesGross:
              Number(
                finalSalesGross.toFixed(
                  4
                )
              ),

            salePrice:
              Number(
                (
                  salesMode ===
                  "inclusive"
                    ? finalSalesGross
                    : finalSalesNet
                ).toFixed(
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
                finalGrossProfit.toFixed(
                  4
                )
              ),


            stock:
              numberValue(
                product.stock
              ),

            name:
              product.name.trim(),

            code:
              String(
                product.code ||
                ""
              ).trim(),

            barcode:
              product.barcode ||
              "",

            category:
              product.category ||
              "",

            brand:
              product.brand ||
              "",

            unit:
              product.unit ||
              "Adet",

            description:
              product.description ||
              "",

            updatedAt:
              new Date()
                .toISOString(),

          }
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


        navigate(
          "/stock/list"
        );


      } catch (
        error
      ) {

        console.error(
          "Ürün güncelleme hatası:",
          error
        );


        alert(
          error?.message ||
          "Ürün güncellenemedi."
        );


      } finally {

        setSaving(
          false
        );

      }

    };


  return (

    <div className="edit-stock-page">


      {/* HEADER */}

      <div className="edit-stock-header">

        <div>

          <div className="edit-stock-breadcrumb">

            Stok

            <span>
              ›
            </span>

            Stok Listesi

            <span>
              ›
            </span>

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
            disabled={
              saving
            }
            onClick={
              handleSave
            }
          >

            {
              saving
                ? "KAYDEDİLİYOR..."
                : "KAYDET"
            }

          </button>

        </div>

      </div>


      {/* CARD */}

      <div className="edit-stock-card">


        <div className="edit-stock-section-title">
          Ürün Bilgileri
        </div>


        <div className="edit-stock-grid">


          {/* ÜRÜN ADI */}

          <div className="edit-stock-field full">

            <label>
              Ürün Adı
            </label>


            <input
              value={
                product.name ||
                ""
              }
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value
                )
              }
            />

          </div>


          {/* KOD */}

          <div className="edit-stock-field">

            <label>
              Stok Kodu
            </label>


            <input
              value={
                product.code ||
                ""
              }
              onChange={(event) =>
                updateField(
                  "code",
                  event.target.value
                )
              }
            />

          </div>


          {/* BARKOD */}

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


          {/* KATEGORİ */}

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


          {/* MARKA */}

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


          {/* BİRİM */}

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


          {/* STOK */}

          <div className="edit-stock-field">

            <label>
              Mevcut Stok
            </label>


            <input
              type="number"
              step="0.01"
              value={
                product.stock ??
                0
              }
              onChange={(event) =>
                handleStockChange(
                  event.target.value
                )
              }
            />

          </div>


          {/* =================================================
              ALIŞ TÜRÜ
          ================================================= */}

          <div className="edit-stock-field full">

            <label>
              Alış Fiyatı Türü
            </label>


            <div
              style={{
                display:
                  "flex",
                gap:
                  "8px",
                marginBottom:
                  "10px",
              }}
            >

              <button
                type="button"
                onClick={() =>
                  setPurchaseMode(
                    "exclusive"
                  )
                }
                style={{
                  flex:
                    1,
                  padding:
                    "10px 12px",
                  border:
                    purchaseMode ===
                    "exclusive"
                      ? "2px solid #57514d"
                      : "1px solid #ddd",
                  background:
                    purchaseMode ===
                    "exclusive"
                      ? "#f7f5f3"
                      : "#fff",
                  borderRadius:
                    "6px",
                  cursor:
                    "pointer",
                  fontWeight:
                    purchaseMode ===
                    "exclusive"
                      ? 700
                      : 500,
                }}
              >
                KDV Hariç
              </button>


              <button
                type="button"
                onClick={() =>
                  setPurchaseMode(
                    "inclusive"
                  )
                }
                style={{
                  flex:
                    1,
                  padding:
                    "10px 12px",
                  border:
                    purchaseMode ===
                    "inclusive"
                      ? "2px solid #57514d"
                      : "1px solid #ddd",
                  background:
                    purchaseMode ===
                    "inclusive"
                      ? "#f7f5f3"
                      : "#fff",
                  borderRadius:
                    "6px",
                  cursor:
                    "pointer",
                  fontWeight:
                    purchaseMode ===
                    "inclusive"
                      ? 700
                      : 500,
                }}
              >
                KDV Dahil
              </button>

            </div>

          </div>


          {/* ALIŞ */}

          <div className="edit-stock-field">

            <label>
              Alış Fiyatı
            </label>


            <input
              type="number"
              step="0.01"
              value={
                purchaseMode ===
                "inclusive"
                  ? Number(
                      purchaseGross.toFixed(
                        2
                      )
                    )
                  : Number(
                      purchaseNet.toFixed(
                        2
                      )
                    )
              }
              onChange={(event) =>
                handlePurchaseChange(
                  event.target.value
                )
              }
            />


            <small>

              {
                purchaseMode ===
                "inclusive"
                  ? "Girilen değer KDV Dahil"
                  : "Girilen değer KDV Hariç"
              }

            </small>

          </div>


          {/* ALIŞ KDV */}

          <div className="edit-stock-field">

            <label>
              Alış KDV Oranı
            </label>


            <select
              value={
                purchaseVat
              }
              onChange={(event) =>
                handlePurchaseVatChange(
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

          </div>


          {/* ALIŞ ÖZET */}

          <div className="edit-stock-field">

            <label>
              Alış KDV Hariç
            </label>


            <input
              value={
                purchaseNet.toFixed(
                  2
                )
              }
              readOnly
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Alış KDV Dahil
            </label>


            <input
              value={
                purchaseGross.toFixed(
                  2
                )
              }
              readOnly
            />

          </div>


          {/* =================================================
              SATIŞ TÜRÜ
          ================================================= */}

          <div className="edit-stock-field full">

            <label>
              Satış Fiyatı Türü
            </label>


            <div
              style={{
                display:
                  "flex",
                gap:
                  "8px",
                marginBottom:
                  "10px",
              }}
            >

              <button
                type="button"
                onClick={() =>
                  setSalesMode(
                    "exclusive"
                  )
                }
                style={{
                  flex:
                    1,
                  padding:
                    "10px 12px",
                  border:
                    salesMode ===
                    "exclusive"
                      ? "2px solid #57514d"
                      : "1px solid #ddd",
                  background:
                    salesMode ===
                    "exclusive"
                      ? "#f7f5f3"
                      : "#fff",
                  borderRadius:
                    "6px",
                  cursor:
                    "pointer",
                  fontWeight:
                    salesMode ===
                    "exclusive"
                      ? 700
                      : 500,
                }}
              >
                KDV Hariç
              </button>


              <button
                type="button"
                onClick={() =>
                  setSalesMode(
                    "inclusive"
                  )
                }
                style={{
                  flex:
                    1,
                  padding:
                    "10px 12px",
                  border:
                    salesMode ===
                    "inclusive"
                      ? "2px solid #57514d"
                      : "1px solid #ddd",
                  background:
                    salesMode ===
                    "inclusive"
                      ? "#f7f5f3"
                      : "#fff",
                  borderRadius:
                    "6px",
                  cursor:
                    "pointer",
                  fontWeight:
                    salesMode ===
                    "inclusive"
                      ? 700
                      : 500,
                }}
              >
                KDV Dahil
              </button>

            </div>

          </div>


          {/* SATIŞ */}

          <div className="edit-stock-field">

            <label>
              Satış Fiyatı
            </label>


            <input
              type="number"
              step="0.01"
              value={
                salesMode ===
                "inclusive"
                  ? Number(
                      salesGross.toFixed(
                        2
                      )
                    )
                  : Number(
                      salesNet.toFixed(
                        2
                      )
                    )
              }
              onChange={(event) =>
                handleSalesChange(
                  event.target.value
                )
              }
            />


            <small>

              {
                salesMode ===
                "inclusive"
                  ? "Girilen değer KDV Dahil"
                  : "Girilen değer KDV Hariç"
              }

            </small>

          </div>


          {/* SATIŞ KDV */}

          <div className="edit-stock-field">

            <label>
              Satış KDV Oranı
            </label>


            <select
              value={
                salesVat
              }
              onChange={(event) =>
                handleSalesVatChange(
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

          </div>


          {/* SATIŞ ÖZET */}

          <div className="edit-stock-field">

            <label>
              Satış KDV Hariç
            </label>


            <input
              value={
                salesNet.toFixed(
                  2
                )
              }
              readOnly
            />

          </div>


          <div className="edit-stock-field">

            <label>
              Satış KDV Dahil
            </label>


            <input
              value={
                salesGross.toFixed(
                  2
                )
              }
              readOnly
            />

          </div>


          {/* KÂR */}

          <div className="edit-stock-field">

            <label>
              Kâr Oranı
            </label>


            <div className="edit-stock-percent-input">

              <input
                type="text"
                inputMode="decimal"
                value={
                  Number.isFinite(profitRate)
                    ? profitRate.toFixed(2)
                    : "0,00"
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

            <small>
              Kâr oranını değiştirince satış fiyatı otomatik hesaplanır.
            </small>

          </div>


          <div className="edit-stock-field">

            <label>
              Brüt Kâr
            </label>


            <input
              value={
                grossProfit.toFixed(
                  2
                )
              }
              readOnly
            />

          </div>

        </div>


        <div className="edit-stock-price-chain-note">
          <strong>Fiyatlandırma bağlıdır</strong>
          <span>
            Alış fiyatı KDV hariç, satış fiyatı KDV dahil tutulur.
            Alış, kâr oranı veya satış fiyatından birini değiştirdiğinizde
            diğer değerler otomatik güncellenir.
          </span>
        </div>

        {/* AÇIKLAMA */}

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


        {/* FOOTER */}

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
            disabled={
              saving
            }
            onClick={
              handleSave
            }
          >

            {
              saving
                ? "KAYDEDİLİYOR..."
                : "KAYDET"
            }

          </button>

        </div>

      </div>

    </div>

  );
}