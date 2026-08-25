import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MdArrowDownward,
  MdArrowUpward,
  MdCalendarToday,
  MdClose,
  MdInventory2,
  MdRefresh,
  MdSearch,
  MdSwapVert,
  MdTrendingDown,
  MdTrendingUp,
} from "react-icons/md";

import "./StockMovements.css";


/* =========================================================
   REN ERP - STOK HAREKETLERİ
   Ortak kayıt:
   ren_erp_products
   ren_erp_stock_movements
========================================================= */

const PRODUCTS_KEY =
  "ren_erp_products";

const MOVEMENTS_KEY =
  "ren_erp_stock_movements";


/* =========================================================
   YARDIMCI
========================================================= */

function readStorage(
  key,
  fallback = []
) {
  try {
    const value =
      localStorage.getItem(
        key
      );

    if (!value) {
      return fallback;
    }

    const parsed =
      JSON.parse(value);

    return Array.isArray(
      parsed
    )
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}


function writeStorage(
  key,
  value
) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


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

  const number =
    Number(
      String(value)
        .replace(",", ".")
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


function formatNumber(
  value
) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    numberValue(value)
  );
}


function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}


/* =========================================================
   HAREKET TÜRLERİ
========================================================= */

function getMovementType(
  movement
) {
  const type =
    String(
      movement?.type ||
        movement?.movementType ||
        movement?.action ||
        ""
    ).toLocaleLowerCase(
      "tr-TR"
    );

  if (
    type.includes("giriş") ||
    type.includes("giris") ||
    type.includes("alış") ||
    type.includes("alis") ||
    type.includes("opening") ||
    type.includes("açılış") ||
    type.includes("acilis")
  ) {
    return "in";
  }

  if (
    type.includes("çıkış") ||
    type.includes("cikis") ||
    type.includes("satış") ||
    type.includes("satis")
  ) {
    return "out";
  }

  if (
    type.includes("düzelt") ||
    type.includes("duzelt") ||
    type.includes("sayım") ||
    type.includes("sayim")
  ) {
    return "adjustment";
  }

  const quantity =
    numberValue(
      movement?.quantity ??
        movement?.amount ??
        movement?.change
    );

  if (
    quantity > 0
  ) {
    return "in";
  }

  if (
    quantity < 0
  ) {
    return "out";
  }

  return "adjustment";
}


function getMovementLabel(
  movement
) {
  const type =
    getMovementType(
      movement
    );

  if (
    type === "in"
  ) {
    return "Stok Girişi";
  }

  if (
    type === "out"
  ) {
    return "Stok Çıkışı";
  }

  return "Stok Düzeltme";
}


/* =========================================================
   HAREKETİ NORMALLEŞTİR
========================================================= */

function normalizeMovement(
  movement,
  products
) {
  const productId =
    movement?.productId ??
    movement?.product_id ??
    movement?.product;

  const product =
    products.find(
      (item) =>
        String(
          item.id
        ) ===
        String(
          productId
        )
    );

  const rawQuantity =
    numberValue(
      movement?.quantity ??
        movement?.amount ??
        movement?.change
    );

  const type =
    getMovementType(
      movement
    );

  let quantity =
    Math.abs(
      rawQuantity
    );

  if (
    type === "adjustment" &&
    rawQuantity === 0
  ) {
    quantity =
      numberValue(
        movement?.quantity
      );
  }

  return {
    ...movement,

    id:
      movement?.id ??
      `MOV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

    productId,

    productName:
      movement?.productName ||
      product?.name ||
      "Bilinmeyen Ürün",

    productCode:
      movement?.productCode ||
      product?.code ||
      "-",

    category:
      movement?.category ||
      product?.category ||
      "-",

    brand:
      movement?.brand ||
      product?.brand ||
      "-",

    unit:
      movement?.unit ||
      product?.unit ||
      "Adet",

    type,

    typeLabel:
      getMovementLabel(
        movement
      ),

    quantity,

    signedQuantity:
      type === "out"
        ? -quantity
        : quantity,

    previousStock:
      numberValue(
        movement?.previousStock ??
          movement?.beforeStock
      ),

    newStock:
      numberValue(
        movement?.newStock ??
          movement?.afterStock
      ),

    date:
      movement?.date ||
      movement?.createdAt ||
      movement?.timestamp ||
      new Date().toISOString(),

    source:
      movement?.source ||
      "REN ERP",

    description:
      movement?.description ||
      movement?.note ||
      "-",

    user:
      movement?.user ||
      "Sistem",
  };
}


/* =========================================================
   COMPONENT
========================================================= */

export default function StockMovements() {

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    movements,
    setMovements,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("all");

  const [
    productFilter,
    setProductFilter,
  ] = useState("");

  const [
    dateFilter,
    setDateFilter,
  ] = useState("");

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =========================================================
     URL PRODUCT ID
  ========================================================= */

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const productId =
      params.get(
        "productId"
      );

    if (
      productId
    ) {
      setSelectedProduct(
        productId
      );

      setProductFilter(
        productId
      );
    }

  }, []);


  /* =========================================================
     VERİLERİ YÜKLE
  ========================================================= */

  const loadData =
    () => {

      setLoading(true);

      const storedProducts =
        readStorage(
          PRODUCTS_KEY
        );

      const storedMovements =
        readStorage(
          MOVEMENTS_KEY
        );

      setProducts(
        storedProducts
      );

      const normalized =
        storedMovements
          .map(
            (movement) =>
              normalizeMovement(
                movement,
                storedProducts
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.date
              ) -
              new Date(
                a.date
              )
          );

      setMovements(
        normalized
      );

      setLoading(false);
    };


  useEffect(() => {

    loadData();

    const refresh =
      () => {
        loadData();
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
      "ren-stock-movements-changed",
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
        "ren-stock-movements-changed",
        refresh
      );

      window.removeEventListener(
        "ren-stock-changed",
        refresh
      );

    };

  }, []);


  /* =========================================================
     FİLTRELENMİŞ HAREKETLER
  ========================================================= */

  const filteredMovements =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return movements.filter(
        (movement) => {

          const matchesSearch =
            !query ||
            String(
              movement.productName
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query) ||
            String(
              movement.productCode
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query) ||
            String(
              movement.source
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query) ||
            String(
              movement.description
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query);

          const matchesType =
            typeFilter ===
              "all" ||
            movement.type ===
              typeFilter;

          const matchesProduct =
            !productFilter ||
            String(
              movement.productId
            ) ===
              String(
                productFilter
              );

          let matchesDate =
            true;

          if (
            dateFilter
          ) {

            const movementDate =
              new Date(
                movement.date
              );

            const localDate =
              `${movementDate.getFullYear()}-${String(
                movementDate.getMonth() +
                  1
              ).padStart(
                2,
                "0"
              )}-${String(
                movementDate.getDate()
              ).padStart(
                2,
                "0"
              )}`;

            matchesDate =
              localDate ===
              dateFilter;
          }

          return (
            matchesSearch &&
            matchesType &&
            matchesProduct &&
            matchesDate
          );
        }
      );

    }, [
      movements,
      search,
      typeFilter,
      productFilter,
      dateFilter,
    ]);


  /* =========================================================
     ÖZET
  ========================================================= */

  const summary =
    useMemo(() => {

      let totalIn = 0;
      let totalOut = 0;

      filteredMovements.forEach(
        (movement) => {

          if (
            movement.type ===
            "in"
          ) {
            totalIn +=
              numberValue(
                movement.quantity
              );
          }

          if (
            movement.type ===
            "out"
          ) {
            totalOut +=
              numberValue(
                movement.quantity
              );
          }

        }
      );

      return {
        count:
          filteredMovements.length,

        totalIn,

        totalOut,

        net:
          totalIn -
          totalOut,
      };

    }, [
      filteredMovements,
    ]);


  /* =========================================================
     ÜRÜN SEÇ
  ========================================================= */

  const handleProductChange =
    (productId) => {

      setProductFilter(
        productId
      );

      setSelectedProduct(
        productId ||
          null
      );

    };


  /* =========================================================
     FİLTRELERİ TEMİZLE
  ========================================================= */

  const clearFilters =
    () => {

      setSearch("");
      setTypeFilter(
        "all"
      );
      setProductFilter(
        ""
      );
      setSelectedProduct(
        null
      );
      setDateFilter("");

    };


  /* =========================================================
     ÜRÜNÜN GÜNCEL STOĞU
  ========================================================= */

  const selectedProductData =
    useMemo(() => {

      if (
        !productFilter
      ) {
        return null;
      }

      return products.find(
        (product) =>
          String(
            product.id
          ) ===
          String(
            productFilter
          )
      ) || null;

    }, [
      products,
      productFilter,
    ]);


  /* =========================================================
     HAREKET KAYDI YOKSA
  ========================================================= */

  const createOpeningMovements =
    () => {

      const currentProducts =
        readStorage(
          PRODUCTS_KEY
        );

      const currentMovements =
        readStorage(
          MOVEMENTS_KEY
        );

      const existingProductIds =
        new Set(
          currentMovements
            .filter(
              (movement) =>
                String(
                  movement.type
                )
                  .toLocaleLowerCase(
                    "tr-TR"
                  )
                  .includes(
                    "açılış"
                  ) ||
                String(
                  movement.type
                )
                  .toLocaleLowerCase(
                    "tr-TR"
                  )
                  .includes(
                    "acilis"
                  )
            )
            .map(
              (movement) =>
                String(
                  movement.productId
                )
            )
        );

      const openingMovements =
        [];

      currentProducts.forEach(
        (product) => {

          const stock =
            numberValue(
              product.stock ??
                product.openingStock
            );

          if (
            stock <= 0
          ) {
            return;
          }

          if (
            existingProductIds.has(
              String(
                product.id
              )
            )
          ) {
            return;
          }

          openingMovements.push({
            id:
              `OPEN-${product.id}-${Date.now()}`,

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
              "Açılış Stoku",

            quantity:
              stock,

            previousStock:
              0,

            newStock:
              stock,

            date:
              product.createdAt ||
              new Date().toISOString(),

            source:
              "Yeni Stok",

            description:
              "Ürün oluşturulurken tanımlanan başlangıç stoğu.",

            user:
              "Sistem",
          });

        }
      );

      if (
        openingMovements.length
      ) {

        writeStorage(
          MOVEMENTS_KEY,
          [
            ...openingMovements,
            ...currentMovements,
          ]
        );

        window.dispatchEvent(
          new Event(
            "ren-stock-movements-changed"
          )
        );

        loadData();

      }

    };


  /* =========================================================
     TARİH BUGÜN
  ========================================================= */

  const setToday =
    () => {

      const today =
        new Date();

      const value =
        `${today.getFullYear()}-${String(
          today.getMonth() +
            1
        ).padStart(
          2,
          "0"
        )}-${String(
          today.getDate()
        ).padStart(
          2,
          "0"
        )}`;

      setDateFilter(
        value
      );

    };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="ren-stock-movements">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="ren-stock-movements-header">

        <div>

          <div className="ren-breadcrumb">

            <span>
              Stok
            </span>

            <span>
              ›
            </span>

            <strong>
              Stok Hareketleri
            </strong>

          </div>


          <h1>
            Stok Hareketleri
          </h1>


          <p>
            Ürünlerin giriş, çıkış ve stok
            değişimlerini takip edin.
          </p>

        </div>


        <div className="ren-header-actions">

          <button
            type="button"
            className="ren-button secondary"
            onClick={
              loadData
            }
          >

            <MdRefresh />

            Yenile

          </button>


          <button
            type="button"
            className="ren-button secondary"
            onClick={
              createOpeningMovements
            }
          >

            <MdInventory2 />

            Açılış Stoklarını Kontrol Et

          </button>

        </div>

      </header>


      {/* =====================================================
          ÖZET KARTLARI
      ===================================================== */}

      <section className="ren-movement-summary">


        <div className="ren-movement-summary-card">

          <div className="summary-icon blue">

            <MdSwapVert />

          </div>

          <div>

            <span>
              Toplam Hareket
            </span>

            <strong>
              {summary.count}
            </strong>

            <small>
              Filtrelenen kayıt
            </small>

          </div>

        </div>


        <div className="ren-movement-summary-card">

          <div className="summary-icon green">

            <MdArrowUpward />

          </div>

          <div>

            <span>
              Toplam Giriş
            </span>

            <strong>
              +
              {formatNumber(
                summary.totalIn
              )}
            </strong>

            <small>
              Stok artışı
            </small>

          </div>

        </div>


        <div className="ren-movement-summary-card">

          <div className="summary-icon red">

            <MdArrowDownward />

          </div>

          <div>

            <span>
              Toplam Çıkış
            </span>

            <strong>
              -
              {formatNumber(
                summary.totalOut
              )}
            </strong>

            <small>
              Stok azalışı
            </small>

          </div>

        </div>


        <div className="ren-movement-summary-card">

          <div className="summary-icon orange">

            <MdTrendingUp />

          </div>

          <div>

            <span>
              Net Hareket
            </span>

            <strong
              className={
                summary.net >=
                0
                  ? "green-text"
                  : "red-text"
              }
            >
              {summary.net >=
              0
                ? "+"
                : ""}
              {formatNumber(
                summary.net
              )}
            </strong>

            <small>
              Giriş - çıkış
            </small>

          </div>

        </div>

      </section>


      {/* =====================================================
          SEÇİLİ ÜRÜN
      ===================================================== */}

      {selectedProductData && (
        <section className="ren-selected-product">

          <div className="ren-selected-product-icon">

            <MdInventory2 />

          </div>


          <div>

            <span>
              Seçili Ürün
            </span>

            <strong>
              {
                selectedProductData.name
              }
            </strong>

            <small>
              Kod:{" "}
              {
                selectedProductData.code ||
                "-"
              }
            </small>

          </div>


          <div className="ren-selected-product-stock">

            <span>
              Güncel Stok
            </span>

            <strong>
              {
                formatNumber(
                  selectedProductData.stock
                )
              }

              {" "}

              {
                selectedProductData.unit ||
                "Adet"
              }

            </strong>

          </div>


          <button
            type="button"
            onClick={() => {

              setProductFilter(
                ""
              );

              setSelectedProduct(
                null
              );

            }}
          >

            <MdClose />

          </button>

        </section>
      )}


      {/* =====================================================
          FİLTRELER
      ===================================================== */}

      <section className="ren-movement-filters">


        <div className="ren-stock-search">

          <MdSearch />

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
            placeholder="Ürün, kod, kaynak veya açıklama ara..."
          />


          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
            >

              <MdClose />

            </button>
          )}

        </div>


        <div className="ren-filter-field">

          <MdInventory2 />

          <select
            value={
              productFilter
            }
            onChange={(event) =>
              handleProductChange(
                event.target.value
              )
            }
          >

            <option value="">
              Tüm Ürünler
            </option>

            {products.map(
              (product) => (
                <option
                  key={
                    product.id
                  }
                  value={
                    product.id
                  }
                >
                  {
                    product.name
                  }

                  {" - "}

                  {
                    product.code ||
                    "-"
                  }
                </option>
              )
            )}

          </select>

        </div>


        <div className="ren-filter-field">

          <MdSwapVert />

          <select
            value={
              typeFilter
            }
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              Tüm Hareketler
            </option>

            <option value="in">
              Stok Girişleri
            </option>

            <option value="out">
              Stok Çıkışları
            </option>

            <option value="adjustment">
              Stok Düzeltmeleri
            </option>

          </select>

        </div>


        <div className="ren-filter-date">

          <MdCalendarToday />

          <input
            type="date"
            value={
              dateFilter
            }
            onChange={(event) =>
              setDateFilter(
                event.target.value
              )
            }
          />

        </div>


        <button
          type="button"
          className="ren-today-button"
          onClick={
            setToday
          }
        >
          Bugün
        </button>


        {(search ||
          productFilter ||
          typeFilter !==
            "all" ||
          dateFilter) && (
          <button
            type="button"
            className="ren-clear-filter"
            onClick={
              clearFilters
            }
          >

            <MdClose />

            Temizle

          </button>
        )}

      </section>


      {/* =====================================================
          TABS
      ===================================================== */}

      <section className="ren-movement-tabs">

        <button
          type="button"
          className={
            typeFilter ===
            "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "all"
            )
          }
        >

          Tümü

        </button>


        <button
          type="button"
          className={
            typeFilter ===
            "in"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "in"
            )
          }
        >

          <MdArrowUpward />

          Girişler

        </button>


        <button
          type="button"
          className={
            typeFilter ===
            "out"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "out"
            )
          }
        >

          <MdArrowDownward />

          Çıkışlar

        </button>


        <button
          type="button"
          className={
            typeFilter ===
            "adjustment"
              ? "active"
              : ""
          }
          onClick={() =>
            setTypeFilter(
              "adjustment"
            )
          }
        >

          <MdSwapVert />

          Düzeltmeler

        </button>

      </section>


      {/* =====================================================
          TABLO
      ===================================================== */}

      <section className="ren-stock-movements-table-card">


        <div className="ren-table-topbar">

          <div>

            <strong>
              {
                filteredMovements.length
              }
            </strong>

            <span>
              hareket listeleniyor
            </span>

          </div>

        </div>


        <div className="ren-table-scroll">

          <table className="ren-stock-movements-table">

            <thead>

              <tr>

                <th>
                  Tarih / Saat
                </th>

                <th>
                  Ürün
                </th>

                <th>
                  İşlem
                </th>

                <th>
                  Önceki Stok
                </th>

                <th>
                  Hareket
                </th>

                <th>
                  Sonraki Stok
                </th>

                <th>
                  Kaynak
                </th>

                <th>
                  Açıklama
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="ren-empty-table"
                  >

                    Veriler yükleniyor...

                  </td>

                </tr>

              ) : filteredMovements.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="ren-empty-table"
                  >

                    <MdInventory2 />

                    <strong>
                      Stok hareketi bulunamadı
                    </strong>

                    <span>
                      Seçtiğiniz filtrelere uygun
                      bir hareket kaydı yok.
                    </span>

                  </td>

                </tr>

              ) : (

                filteredMovements.map(
                  (movement) => (

                    <tr
                      key={
                        movement.id
                      }
                    >

                      {/* TARİH */}

                      <td>

                        <div className="ren-movement-date">

                          <strong>
                            {
                              formatDate(
                                movement.date
                              )
                            }
                          </strong>

                        </div>

                      </td>


                      {/* ÜRÜN */}

                      <td>

                        <div className="ren-movement-product">

                          <div className="ren-movement-product-icon">

                            <MdInventory2 />

                          </div>

                          <div>

                            <strong>
                              {
                                movement.productName
                              }
                            </strong>

                            <span>
                              {
                                movement.productCode
                              }
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* İŞLEM */}

                      <td>

                        <span
                          className={`ren-movement-badge ${movement.type}`}
                        >

                          {movement.type ===
                            "in" && (
                            <MdArrowUpward />
                          )}

                          {movement.type ===
                            "out" && (
                            <MdArrowDownward />
                          )}

                          {movement.type ===
                            "adjustment" && (
                            <MdSwapVert />
                          )}

                          {
                            movement.typeLabel
                          }

                        </span>

                      </td>


                      {/* ÖNCEKİ */}

                      <td>

                        <strong>
                          {
                            formatNumber(
                              movement.previousStock
                            )
                          }
                        </strong>

                        <small>
                          {" "}
                          {
                            movement.unit
                          }
                        </small>

                      </td>


                      {/* HAREKET */}

                      <td>

                        <strong
                          className={
                            movement.type ===
                            "in"
                              ? "movement-positive"
                              : movement.type ===
                                "out"
                              ? "movement-negative"
                              : "movement-neutral"
                          }
                        >

                          {movement.type ===
                          "in"
                            ? "+"
                            : movement.type ===
                              "out"
                            ? "-"
                            : ""}

                          {
                            formatNumber(
                              movement.quantity
                            )
                          }

                        </strong>

                        <small>
                          {" "}
                          {
                            movement.unit
                          }
                        </small>

                      </td>


                      {/* SONRAKİ */}

                      <td>

                        <strong className="new-stock-value">

                          {
                            formatNumber(
                              movement.newStock
                            )
                          }

                        </strong>

                        <small>
                          {" "}
                          {
                            movement.unit
                          }
                        </small>

                      </td>


                      {/* KAYNAK */}

                      <td>

                        <span className="ren-source">

                          {
                            movement.source
                          }

                        </span>

                      </td>


                      {/* AÇIKLAMA */}

                      <td>

                        <span className="ren-movement-description">

                          {
                            movement.description
                          }

                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="ren-table-footer">

          <span>

            Toplam{" "}

            <strong>
              {
                filteredMovements.length
              }
            </strong>

            {" "}
            kayıt

          </span>

        </div>

      </section>


      {/* =====================================================
          BİLGİ
      ===================================================== */}

      <div className="ren-movement-info">

        <MdTrendingUp />

        <span>
          Stok hareketleri Yeni Stok,
          Stok Listesi ve Toplu İşlemler
          üzerinden yapılan değişikliklerle
          birlikte güncellenir.
        </span>

      </div>

    </div>
  );
}