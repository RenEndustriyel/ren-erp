import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./BulkOperations.css";

const STORAGE_KEY =
  "ren_erp_products";

const MOVEMENTS_KEY =
  "ren_erp_stock_movements";


/* =========================================================
   İŞLEM TİPLERİ
========================================================= */

const OPERATIONS = [
  {
    value: "salePrice",
    label: "Satış Fiyatı",
  },
  {
    value: "purchasePrice",
    label: "Alış Fiyatı",
  },
  {
    value: "profit",
    label: "Kâr Oranı",
  },
  {
    value: "stock",
    label: "Stok Miktarı",
  },
];


const METHODS = [
  {
    value: "set",
    label: "Sabit Değer",
  },
  {
    value: "increase",
    label: "Artır",
  },
  {
    value: "decrease",
    label: "Azalt",
  },
  {
    value: "percentage",
    label: "Yüzde Değiştir",
  },
];


/* =========================================================
   SAYI
========================================================= */

function numberValue(
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
  } else {
    text =
      text.replace(",", ".");
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

function money(
  value
) {
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


/* =========================================================
   KÂR
========================================================= */

function calculateProfit(
  purchase,
  sale
) {
  const purchaseValue =
    numberValue(
      purchase
    );

  const saleValue =
    numberValue(
      sale
    );

  if (
    purchaseValue <= 0
  ) {
    return 0;
  }

  return (
    (
      (
        saleValue -
        purchaseValue
      ) /
      purchaseValue
    ) *
    100
  );
}


/* =========================================================
   ÜRÜN FİYATLARI
========================================================= */

function getPurchaseNet(
  product
) {
  if (
    product?.purchaseNet !==
      undefined &&
    product?.purchaseNet !==
      null
  ) {
    return numberValue(
      product.purchaseNet
    );
  }

  return numberValue(
    product?.purchasePrice
  );
}


function getSaleNet(
  product
) {
  if (
    product?.salesNet !==
      undefined &&
    product?.salesNet !==
      null
  ) {
    return numberValue(
      product.salesNet
    );
  }

  if (
    product?.saleNet !==
      undefined &&
    product?.saleNet !==
      null
  ) {
    return numberValue(
      product.saleNet
    );
  }

  return numberValue(
    product?.salePrice
  );
}


function getSaleVat(
  product
) {
  return numberValue(
    product?.salesVat ??
      product?.saleVat ??
      20
  );
}


function getPurchaseVat(
  product
) {
  return numberValue(
    product?.purchaseVat ??
      20
  );
}


/* =========================================================
   YENİ DEĞER HESAPLA
========================================================= */

function calculateNewValue(
  product,
  operation,
  method,
  value
) {
  const numericValue =
    numberValue(value);


  /* SATIŞ FİYATI */

  if (
    operation ===
    "salePrice"
  ) {
    const current =
      getSaleNet(
        product
      );

    if (
      method ===
      "set"
    ) {
      return numericValue;
    }

    if (
      method ===
      "increase"
    ) {
      return (
        current +
        numericValue
      );
    }

    if (
      method ===
      "decrease"
    ) {
      return Math.max(
        0,
        current -
          numericValue
      );
    }

    if (
      method ===
      "percentage"
    ) {
      return (
        current *
        (
          1 +
          numericValue /
            100
        )
      );
    }

    return current;
  }


  /* ALIŞ FİYATI */

  if (
    operation ===
    "purchasePrice"
  ) {
    const current =
      getPurchaseNet(
        product
      );

    if (
      method ===
      "set"
    ) {
      return numericValue;
    }

    if (
      method ===
      "increase"
    ) {
      return (
        current +
        numericValue
      );
    }

    if (
      method ===
      "decrease"
    ) {
      return Math.max(
        0,
        current -
          numericValue
      );
    }

    if (
      method ===
      "percentage"
    ) {
      return (
        current *
        (
          1 +
          numericValue /
            100
        )
      );
    }

    return current;
  }


  /* KÂR */

  if (
    operation ===
    "profit"
  ) {
    const purchase =
      getPurchaseNet(
        product
      );

    if (
      purchase <= 0
    ) {
      return null;
    }

    const currentProfit =
      calculateProfit(
        purchase,
        getSaleNet(
          product
        )
      );

    let newProfit =
      currentProfit;

    if (
      method ===
      "set"
    ) {
      newProfit =
        numericValue;
    }

    if (
      method ===
      "increase"
    ) {
      newProfit =
        currentProfit +
        numericValue;
    }

    if (
      method ===
      "decrease"
    ) {
      newProfit =
        currentProfit -
        numericValue;
    }

    if (
      method ===
      "percentage"
    ) {
      newProfit =
        currentProfit *
        (
          1 +
          numericValue /
            100
        );
    }

    return (
      purchase *
      (
        1 +
        newProfit /
          100
      )
    );
  }


  /* STOK */

  if (
    operation ===
    "stock"
  ) {
    const current =
      numberValue(
        product?.stock
      );

    if (
      method ===
      "set"
    ) {
      return numericValue;
    }

    if (
      method ===
      "increase"
    ) {
      return (
        current +
        numericValue
      );
    }

    if (
      method ===
      "decrease"
    ) {
      return Math.max(
        0,
        current -
          numericValue
      );
    }

    if (
      method ===
      "percentage"
    ) {
      return (
        current *
        (
          1 +
          numericValue /
            100
        )
      );
    }

    return current;
  }


  return null;
}


/* =========================================================
   LABEL
========================================================= */

function getOperationLabel(
  operation
) {
  return (
    OPERATIONS.find(
      (item) =>
        item.value ===
        operation
    )?.label ||
    ""
  );
}


function getMethodLabel(
  method
) {
  return (
    METHODS.find(
      (item) =>
        item.value ===
        method
    )?.label ||
    ""
  );
}


/* =========================================================
   ANA COMPONENT
========================================================= */

export default function BulkOperations() {

  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);


  const [
    operation,
    setOperation,
  ] = useState(
    "salePrice"
  );


  const [
    method,
    setMethod,
  ] = useState(
    "set"
  );


  const [
    value,
    setValue,
  ] = useState("");


  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =======================================================
     ÜRÜNLERİ YÜKLE
  ======================================================= */

  const loadProducts =
    () => {

      setLoading(
        true
      );

      try {

        const saved =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (!saved) {

          setProducts([]);

          setLoading(
            false
          );

          return;
        }

        const parsed =
          JSON.parse(
            saved
          );

        setProducts(
          Array.isArray(
            parsed
          )
            ? parsed
            : []
        );

      } catch (
        error
      ) {

        console.error(
          "Toplu işlemler ürünleri yüklenemedi:",
          error
        );

        setProducts([]);

      } finally {

        setLoading(
          false
        );

      }

    };


  useEffect(() => {

    loadProducts();


    const refresh =
      () => {
        loadProducts();
      };


    window.addEventListener(
      "storage",
      refresh
    );


    window.addEventListener(
      "ren-products-changed",
      refresh
    );


    window.addEventListener(
      "ren-stock-changed",
      refresh
    );


    return () => {

      window.removeEventListener(
        "storage",
        refresh
      );


      window.removeEventListener(
        "ren-products-changed",
        refresh
      );


      window.removeEventListener(
        "ren-stock-changed",
        refresh
      );

    };

  }, []);


  /* =======================================================
     ARAMA
  ======================================================= */

  const filteredProducts =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );


      if (!query) {

        return products;

      }


      return products.filter(
        (
          product
        ) => {

          return (

            String(
              product?.name ||
                ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              product?.code ||
                ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              product?.brand ||
                ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              product?.category ||
                ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              )

          );

        }
      );

    }, [
      products,
      search,
    ]);


  /* =======================================================
     SEÇİLEN ÜRÜNLER
  ======================================================= */

  const selectedProducts =
    products.filter(
      (
        product
      ) =>
        selectedIds.includes(
          product.id
        )
    );


  const allVisibleSelected =
    filteredProducts.length >
      0 &&
    filteredProducts.every(
      (
        product
      ) =>
        selectedIds.includes(
          product.id
        )
    );


  /* =======================================================
     ÜRÜN SEÇ
  ======================================================= */

  const toggleProduct =
    (id) => {

      setSelectedIds(
        (
          current
        ) => {

          if (
            current.includes(
              id
            )
          ) {

            return current.filter(
              (
                item
              ) =>
                item !==
                id
            );

          }


          return [
            ...current,
            id,
          ];

        }
      );

    };


  /* =======================================================
     TÜMÜNÜ SEÇ
  ======================================================= */

  const toggleAllVisible =
    () => {

      if (
        allVisibleSelected
      ) {

        setSelectedIds(
          (
            current
          ) =>
            current.filter(
              (
                id
              ) =>
                !filteredProducts.some(
                  (
                    product
                  ) =>
                    product.id ===
                    id
                )
            )
        );

        return;

      }


      setSelectedIds(
        (
          current
        ) => [

          ...new Set([
            ...current,

            ...filteredProducts.map(
              (
                product
              ) =>
                product.id
            ),

          ]),

        ]
      );

    };


  /* =======================================================
     SEÇİMİ TEMİZLE
  ======================================================= */

  const clearSelection =
    () => {

      setSelectedIds(
        []
      );

    };


  /* =======================================================
     ÖNİZLEME
  ======================================================= */

  const previewRows =
    useMemo(() => {

      return selectedProducts.map(
        (
          product
        ) => {

          let newValue =
            calculateNewValue(
              product,
              operation,
              method,
              value
            );


          if (
            newValue ===
            null
          ) {

            newValue =
              operation ===
              "salePrice"

                ? getSaleNet(
                    product
                  )

                : operation ===
                  "purchasePrice"

                ? getPurchaseNet(
                    product
                  )

                : operation ===
                  "stock"

                ? numberValue(
                    product.stock
                  )

                : calculateProfit(
                    getPurchaseNet(
                      product
                    ),
                    getSaleNet(
                      product
                    )
                  );

          }


          const oldValue =
            operation ===
            "salePrice"

              ? getSaleNet(
                  product
                )

              : operation ===
                "purchasePrice"

              ? getPurchaseNet(
                  product
                )

              : operation ===
                "stock"

              ? numberValue(
                  product.stock
                )

              : calculateProfit(
                  getPurchaseNet(
                    product
                  ),
                  getSaleNet(
                    product
                  )
                );


          return {

            product,

            oldValue,

            newValue:
              operation ===
              "stock"

                ? Math.round(
                    Math.max(
                      0,
                      newValue
                    )
                  )

                : Number(
                    Math.max(
                      0,
                      newValue
                    ).toFixed(
                      2
                    )
                  ),

          };

        }
      );

    }, [
      selectedProducts,
      operation,
      method,
      value,
    ]);


  /* =======================================================
     UYGULA
  ======================================================= */

  const handleApply =
    () => {

      if (
        selectedProducts.length ===
        0
      ) {

        alert(
          "Lütfen en az bir ürün seçin."
        );

        return;

      }


      if (
        value === ""
      ) {

        alert(
          "Lütfen uygulanacak yeni değeri girin."
        );

        return;

      }


      const numeric =
        numberValue(
          value
        );


      if (
        !Number.isFinite(
          numeric
        )
      ) {

        alert(
          "Lütfen geçerli bir değer girin."
        );

        return;

      }


      setShowConfirm(
        true
      );

    };


  /* =======================================================
     ONAYLA
  ======================================================= */

  const confirmOperation =
    () => {

      const updatedProducts =
        products.map(
          (
            product
          ) => {

            if (
              !selectedIds.includes(
                product.id
              )
            ) {

              return product;

            }


            const newValue =
              calculateNewValue(
                product,
                operation,
                method,
                value
              );


            if (
              newValue ===
              null
            ) {

              return product;

            }


            /* =============================================
               SATIŞ FİYATI
            ============================================= */

            if (
              operation ===
              "salePrice"
            ) {

              const saleNet =
                Math.max(
                  0,
                  Number(
                    newValue.toFixed(
                      2
                    )
                  )
                );


              const vat =
                getSaleVat(
                  product
                );


              const saleGross =
                Number(
                  (
                    saleNet *
                    (
                      1 +
                      vat /
                        100
                    )
                  ).toFixed(
                    2
                  )
                );


              return {

                ...product,

                salePrice:
                  saleNet,

                saleNet:
                  saleNet,

                salesNet:
                  saleNet,

                saleGross:
                  saleGross,

                salesGross:
                  saleGross,

                profitRate:
                  Number(
                    calculateProfit(
                      getPurchaseNet(
                        product
                      ),
                      saleNet
                    ).toFixed(
                      2
                    )
                  ),

              };

            }


            /* =============================================
               ALIŞ FİYATI
            ============================================= */

            if (
              operation ===
              "purchasePrice"
            ) {

              const purchaseNet =
                Math.max(
                  0,
                  Number(
                    newValue.toFixed(
                      2
                    )
                  )
                );


              const vat =
                getPurchaseVat(
                  product
                );


              const purchaseGross =
                Number(
                  (
                    purchaseNet *
                    (
                      1 +
                      vat /
                        100
                    )
                  ).toFixed(
                    2
                  )
                );


              return {

                ...product,

                purchasePrice:
                  purchaseNet,

                purchaseNet:
                  purchaseNet,

                purchaseGross:
                  purchaseGross,

                profitRate:
                  Number(
                    calculateProfit(
                      purchaseNet,
                      getSaleNet(
                        product
                      )
                    ).toFixed(
                      2
                    )
                  ),

              };

            }


            /* =============================================
               KÂR ORANI
            ============================================= */

            if (
              operation ===
              "profit"
            ) {

              const saleNet =
                Math.max(
                  0,
                  Number(
                    newValue.toFixed(
                      2
                    )
                  )
                );


              const vat =
                getSaleVat(
                  product
                );


              const saleGross =
                Number(
                  (
                    saleNet *
                    (
                      1 +
                      vat /
                        100
                    )
                  ).toFixed(
                    2
                  )
                );


              const profitRate =
                calculateProfit(
                  getPurchaseNet(
                    product
                  ),
                  saleNet
                );


              return {

                ...product,

                salePrice:
                  saleNet,

                saleNet:
                  saleNet,

                salesNet:
                  saleNet,

                saleGross:
                  saleGross,

                salesGross:
                  saleGross,

                profitRate:
                  Number(
                    profitRate.toFixed(
                      2
                    )
                  ),

              };

            }


            /* =============================================
               STOK
            ============================================= */

            if (
              operation ===
              "stock"
            ) {

              const newStock =
                Math.max(
                  0,
                  Math.round(
                    newValue
                  )
                );


              return {

                ...product,

                stock:
                  newStock,

              };

            }


            return product;

          }
        );


      /* ===================================================
         ÜRÜNLERİ KAYDET
      =================================================== */

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          updatedProducts
        )
      );


      setProducts(
        updatedProducts
      );


      /* ===================================================
         DİĞER EKRANLARA HABER
      =================================================== */

      window.dispatchEvent(
        new Event(
          "ren-products-changed"
        )
      );


      window.dispatchEvent(
        new Event(
          "ren-stock-changed"
        )
      );


      /* ===================================================
         STOK HAREKETİ
      =================================================== */

      if (
        operation ===
        "stock"
      ) {

        let movements = [];


        try {

          movements =
            JSON.parse(
              localStorage.getItem(
                MOVEMENTS_KEY
              ) ||
                "[]"
            );

        } catch {

          movements =
            [];

        }


        const now =
          new Date().toISOString();


        selectedProducts.forEach(
          (
            product
          ) => {

            const oldStock =
              numberValue(
                product.stock
              );


            const updated =
              updatedProducts.find(
                (
                  item
                ) =>
                  item.id ===
                  product.id
              );


            const newStock =
              numberValue(
                updated?.stock
              );


            const difference =
              newStock -
              oldStock;


            if (
              difference ===
              0
            ) {

              return;

            }


            movements.unshift({

              id:
                `BULK-${Date.now()}-${product.id}-${Math.random()
                  .toString(36)
                  .slice(
                    2,
                    7
                  )}`,

              productId:
                product.id,

              productName:
                product.name,

              productCode:
                product.code,

              category:
                product.category,

              brand:
                product.brand,

              unit:
                product.unit ||
                "Adet",

              type:
                difference >
                0
                  ? "Stok Girişi"
                  : "Stok Çıkışı",

              quantity:
                Math.abs(
                  difference
                ),

              previousStock:
                oldStock,

              newStock:
                newStock,

              date:
                now,

              source:
                "Toplu İşlemler",

              description:
                "Toplu stok işlemi ile güncellendi.",

              user:
                "Sistem",

            });

          }
        );


        localStorage.setItem(
          MOVEMENTS_KEY,
          JSON.stringify(
            movements
          )
        );


        window.dispatchEvent(
          new Event(
            "ren-stock-movements-changed"
          )
        );

      }


      /* ===================================================
         TEMİZLE
      =================================================== */

      setShowConfirm(
        false
      );


      setMessage(
        `${selectedProducts.length} ürün başarıyla güncellendi.`
      );


      setSelectedIds(
        []
      );


      setValue(
        ""
      );


      setTimeout(
        () => {

          setMessage(
            ""
          );

        },
        3500
      );

    };


  /* =======================================================
     LABEL
  ======================================================= */

  const operationLabel =
    getOperationLabel(
      operation
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="bulk-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bulk-header">

        <div>

          <div className="breadcrumb">

            Stok

            <span>
              /
            </span>

            Toplu İşlemler

          </div>


          <h1>
            Toplu İşlemler
          </h1>


          <p>
            Birden fazla ürün üzerinde
            fiyat ve stok değişikliklerini
            tek seferde uygulayın.
          </p>

        </div>

      </div>


      {/* =================================================
          BAŞARI MESAJI
      ================================================= */}

      {message && (

        <div className="success-message">

          <span>
            ✓
          </span>

          {message}

        </div>

      )}


      {/* =================================================
          İŞLEM SEÇ
      ================================================= */}

      <div className="operation-card">


        <div className="section-title">

          <div className="section-icon">
            ↗
          </div>


          <div>

            <h2>
              İşlem Seç
            </h2>

            <p>
              Seçtiğiniz ürünlere
              uygulanacak değişikliği
              belirleyin.
            </p>

          </div>

        </div>


        <div className="operation-grid">


          {/* İŞLEM */}

          <div className="form-group">

            <label>
              İşlem
            </label>


            <select
              value={
                operation
              }
              onChange={(event) => {

                setOperation(
                  event.target.value
                );

                setValue(
                  ""
                );

              }}
            >

              {OPERATIONS.map(
                (
                  item
                ) => (

                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {
                      item.label
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {/* UYGULAMA */}

          <div className="form-group">

            <label>
              Uygulama Şekli
            </label>


            <select
              value={
                method
              }
              onChange={(event) =>
                setMethod(
                  event.target.value
                )
              }
            >

              {METHODS.map(
                (
                  item
                ) => (

                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {
                      item.label
                    }
                  </option>

                )
              )}

            </select>

          </div>


          {/* YENİ DEĞER */}

          <div className="form-group">

            <label>

              {operation ===
              "salePrice"

                ? "Yeni Satış Fiyatı"

                : operation ===
                  "purchasePrice"

                ? "Yeni Alış Fiyatı"

                : operation ===
                  "profit"

                ? "Yeni Kâr Oranı"

                : "Yeni Stok Miktarı"}

            </label>


            <div className="value-input">

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  value
                }
                onChange={(event) =>
                  setValue(
                    event.target.value
                  )
                }
                placeholder={
                  operation ===
                  "profit"

                    ? "Örn. 35"

                    : operation ===
                      "stock"

                    ? "Örn. 100"

                    : "Örn. 200"
                }
              />


              <span>

                {operation ===
                  "profit" ||
                method ===
                  "percentage"

                  ? "%"

                  : operation ===
                    "stock"

                  ? "adet"

                  : "₺"}

              </span>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          FİYAT ÖNİZLEME
      ================================================= */}

      {selectedProducts.length >
        0 && (

        <div className="bulk-price-preview">


          <div className="bulk-price-preview-header">

            <div>

              <strong>
                Fiyat Önizlemesi
              </strong>

              <span>
                {
                  selectedProducts.length
                } ürün
              </span>

            </div>


            <span>
              Eski değer → Yeni değer
            </span>

          </div>


          <div className="bulk-preview-list">

            {previewRows
              .slice(
                0,
                8
              )
              .map(
                ({
                  product,
                  oldValue,
                  newValue,
                }) => (

                  <div
                    className="bulk-preview-row"
                    key={
                      product.id
                    }
                  >


                    <div>

                      <strong>
                        {
                          product.name
                        }
                      </strong>

                      <small>
                        {
                          product.code ||
                          "-"
                        }
                      </small>

                    </div>


                    <span className="preview-old">

                      {operation ===
                      "profit"

                        ? `%${Number(
                            oldValue
                          ).toFixed(
                            2
                          )}`

                        : operation ===
                          "stock"

                        ? `${money(
                            oldValue
                          )} adet`

                        : `₺${money(
                            oldValue
                          )}`}

                    </span>


                    <span className="preview-arrow">
                      →
                    </span>


                    <strong className="preview-new">

                      {operation ===
                      "profit"

                        ? `%${Number(
                            newValue
                          ).toFixed(
                            2
                          )}`

                        : operation ===
                          "stock"

                        ? `${money(
                            newValue
                          )} adet`

                        : `₺${money(
                            newValue
                          )}`}

                    </strong>

                  </div>

                )
              )}

          </div>


          {selectedProducts.length >
            8 && (

            <div className="bulk-preview-more">

              +

              {
                selectedProducts.length -
                8
              }

              {" "}
              ürün daha

            </div>

          )}

        </div>

      )}


      {/* =================================================
          ÜRÜNLER
      ================================================= */}

      <div className="products-card">


        <div className="products-toolbar">

          <div>

            <h2>
              Ürünleri Seç
            </h2>

            <p>
              İşlem uygulanacak
              ürünleri seçin.
            </p>

          </div>


          <div className="selected-count">

            <strong>
              {
                selectedIds.length
              }
            </strong>

            <span>
              ürün seçildi
            </span>

          </div>

        </div>


        {/* ARAMA */}

        <div className="search-row">


          <div className="bulk-search">

            <span>
              ⌕
            </span>


            <input
              type="text"
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Ürün, kod, marka veya kategori ara..."
            />

          </div>


          <button
            type="button"
            className="select-all-button"
            onClick={
              toggleAllVisible
            }
          >

            {allVisibleSelected
              ? "Seçimi Kaldır"
              : "Tümünü Seç"}

          </button>


          {selectedIds.length >
            0 && (

            <button
              type="button"
              className="clear-selection"
              onClick={
                clearSelection
              }
            >

              Seçimi Temizle

            </button>

          )}

        </div>


        {/* TABLO */}

        <div className="product-table">


          <div className="product-table-header">


            <div className="checkbox-cell">

              <input
                type="checkbox"
                checked={
                  allVisibleSelected
                }
                onChange={
                  toggleAllVisible
                }
              />

            </div>


            <div>
              ÜRÜN
            </div>


            <div>
              MARKA
            </div>


            <div>
              ALIŞ
            </div>


            <div>
              SATIŞ
            </div>


            <div>
              KÂR
            </div>


            <div>
              STOK
            </div>


          </div>


          {loading ? (

            <div className="empty-products">

              Ürünler yükleniyor...

            </div>

          ) : filteredProducts.length ===
            0 ? (

            <div className="empty-products">

              Ürün bulunamadı.

            </div>

          ) : (

            filteredProducts.map(
              (
                product
              ) => {


                const purchase =
                  getPurchaseNet(
                    product
                  );


                const sale =
                  getSaleNet(
                    product
                  );


                const profit =
                  calculateProfit(
                    purchase,
                    sale
                  );


                const selected =
                  selectedIds.includes(
                    product.id
                  );


                return (

                  <div
                    className={`product-row ${
                      selected
                        ? "selected"
                        : ""
                    }`}
                    key={
                      product.id
                    }
                  >


                    <div className="checkbox-cell">

                      <input
                        type="checkbox"
                        checked={
                          selected
                        }
                        onChange={() =>
                          toggleProduct(
                            product.id
                          )
                        }
                      />

                    </div>


                    <div className="product-info">

                      <strong>
                        {
                          product.name
                        }
                      </strong>

                      <small>
                        {
                          product.code ||
                          "-"
                        }
                      </small>

                    </div>


                    <div className="brand-cell">

                      {
                        product.brand ||
                        "-"
                      }

                    </div>


                    <div className="price-cell">

                      ₺
                      {money(
                        purchase
                      )}

                    </div>


                    <div className="price-cell sale">

                      ₺
                      {money(
                        sale
                      )}

                    </div>


                    <div className="profit-cell">

                      %
                      {profit.toFixed(
                        1
                      )}

                    </div>


                    <div className="stock-cell">

                      {
                        numberValue(
                          product.stock
                        )
                      }

                    </div>


                  </div>

                );

              }
            )

          )}

        </div>


        {/* FOOTER */}

        <div className="products-footer">


          <div>

            {
              filteredProducts.length
            }

            {" "}
            ürün listeleniyor

          </div>


          <button
            type="button"
            className="apply-button"
            disabled={
              selectedIds.length ===
                0 ||
              !value
            }
            onClick={
              handleApply
            }
          >

            Değişikliği Uygula

          </button>


        </div>

      </div>


      {/* =================================================
          ONAY MODALI
      ================================================= */}

      {showConfirm && (

        <div
          className="modal-overlay"
          onMouseDown={() =>
            setShowConfirm(
              false
            )
          }
        >


          <div
            className="confirm-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >


            <div className="confirm-icon">
              !
            </div>


            <h2>
              Toplu işlemi
              onaylıyor musunuz?
            </h2>


            <p>

              <strong>
                {
                  selectedProducts.length
                }
              </strong>

              {" "}
              ürün üzerinde{" "}

              <strong>
                {
                  operationLabel
                }
              </strong>

              {" "}
              için{" "}

              <strong>
                {
                  getMethodLabel(
                    method
                  )
                }
              </strong>

              {" "}
              işlemi uygulanacak.

            </p>


            {/* İLK ÜRÜNÜN ÖZETİ */}

            {previewRows.length >
              0 && (

              <div className="confirm-price-change">


                <span>
                  İlk ürün
                </span>


                <strong>

                  {operation ===
                  "profit"

                    ? `%${Number(
                        previewRows[0]
                          .oldValue
                      ).toFixed(
                        2
                      )}`

                    : operation ===
                      "stock"

                    ? `${money(
                        previewRows[0]
                          .oldValue
                      )} adet`

                    : `₺${money(
                        previewRows[0]
                          .oldValue
                      )}`}

                </strong>


                <b>
                  →
                </b>


                <strong className="new">

                  {operation ===
                  "profit"

                    ? `%${Number(
                        previewRows[0]
                          .newValue
                      ).toFixed(
                        2
                      )}`

                    : operation ===
                      "stock"

                    ? `${money(
                        previewRows[0]
                          .newValue
                      )} adet`

                    : `₺${money(
                        previewRows[0]
                          .newValue
                      )}`}

                </strong>


              </div>

            )}


            <div className="confirm-value">

              {value}

              {operation ===
                "profit" ||
              method ===
                "percentage"

                ? "%"

                : operation ===
                  "stock"

                ? " adet"

                : " ₺"}

            </div>


            <div className="confirm-actions">


              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setShowConfirm(
                    false
                  )
                }
              >

                Vazgeç

              </button>


              <button
                type="button"
                className="confirm-button"
                onClick={
                  confirmOperation
                }
              >

                Evet, Uygula

              </button>


            </div>


          </div>


        </div>

      )}

    </div>
  );
}