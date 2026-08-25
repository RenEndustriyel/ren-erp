import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StockList.css";

const STORAGE_KEY = "ren_erp_products";

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    code: "STK-0001",
    name: "Örnek Temizlik Ürünü",
    category: "Temizlik",
    brand: "REN",
    unit: "Adet",
    stock: 25,
    minStock: 5,
    purchasePrice: 100,
    salePrice: 150,
    vat: 20,
    status: "Aktif",
  },
];


/* =========================================================
   SAYISAL DEĞER
========================================================= */

const safeNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
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
    text = text.replace(",", ".");
  }

  const number =
    Number(text);

  return Number.isFinite(number)
    ? number
    : 0;
};


/* =========================================================
   PARA FORMAT
========================================================= */

const formatMoney = (value) => {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    safeNumber(value)
  );
};


/* =========================================================
   ALIŞ FİYATI
========================================================= */

const getPurchasePrice = (
  product
) => {
  return safeNumber(
    product?.purchaseNet ??
    product?.purchasePrice ??
    product?.buyPrice ??
    product?.cost ??
    product?.purchase ??
    product?.buyingPrice ??
    0
  );
};


/* =========================================================
   SATIŞ FİYATI
========================================================= */

const getSalePrice = (
  product
) => {
  return safeNumber(
    product?.salesNet ??
    product?.salePrice ??
    product?.sellingPrice ??
    product?.salesPrice ??
    product?.price ??
    product?.retailPrice ??
    0
  );
};


/* =========================================================
   KDV
========================================================= */

const getVat = (
  product
) => {
  return safeNumber(
    product?.salesVat ??
    product?.vatRate ??
    product?.vat ??
    product?.kdv ??
    0
  );
};


/* =========================================================
   ÜRÜN FOTOĞRAFI
========================================================= */

const getProductImage = (
  product
) => {
  return (
    product?.image ||
    product?.imageUrl ||
    product?.photo ||
    product?.photoUrl ||
    product?.imageBase64 ||
    ""
  );
};


/* =========================================================
   STOK DURUMU
========================================================= */

const getStockStatus = (
  product
) => {
  const stock =
    safeNumber(
      product.stock
    );

  const minStock =
    safeNumber(
      product.minStock
    );

  if (
    product.status ===
    "Pasif"
  ) {
    return "passive";
  }

  if (
    stock <= 0
  ) {
    return "empty";
  }

  if (
    stock <= minStock
  ) {
    return "low";
  }

  return "normal";
};


export default function StockList() {

  const navigate =
    useNavigate();

  const fileInputRef =
    useRef(null);


  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    activeTab,
    setActiveTab,
  ] = useState("all");


  const [
    selectedIds,
    setSelectedIds,
  ] = useState([]);


  const [
    showFilters,
    setShowFilters,
  ] = useState(false);


  const [
    showActions,
    setShowActions,
  ] = useState(false);


  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("");


  const [
    brandFilter,
    setBrandFilter,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");


  /* =======================================================
     ÜRÜNLERİ OKU
  ======================================================= */

  useEffect(() => {

    try {

      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (saved) {

        const parsed =
          JSON.parse(saved);

        if (
          Array.isArray(
            parsed
          )
        ) {

          setProducts(
            parsed
          );

          return;
        }
      }

      setProducts(
        DEFAULT_PRODUCTS
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          DEFAULT_PRODUCTS
        )
      );

    } catch {

      setProducts(
        DEFAULT_PRODUCTS
      );

    }

  }, []);


  /* =======================================================
     DEĞİŞİNCE KAYDET
  ======================================================= */

  useEffect(() => {

    if (
      products.length > 0
    ) {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          products
        )
      );

    }

  }, [products]);


  /* =======================================================
     KATEGORİLER
  ======================================================= */

  const categories =
    useMemo(() => {

      return [
        ...new Set(
          products
            .map(
              (product) =>
                product.category
            )
            .filter(Boolean)
        ),
      ];

    }, [products]);


  /* =======================================================
     MARKALAR
  ======================================================= */

  const brands =
    useMemo(() => {

      return [
        ...new Set(
          products
            .map(
              (product) =>
                product.brand
            )
            .filter(Boolean)
        ),
      ];

    }, [products]);


  /* =======================================================
     ÖZET
  ======================================================= */

  const stats =
    useMemo(() => {

      let totalStock = 0;
      let lowStock = 0;
      let emptyStock = 0;
      let activeProducts = 0;

      products.forEach(
        (product) => {

          const stock =
            safeNumber(
              product.stock
            );

          const minStock =
            safeNumber(
              product.minStock
            );

          totalStock +=
            stock;

          if (
            product.status !==
            "Pasif"
          ) {
            activeProducts +=
              1;
          }

          if (
            stock <= 0
          ) {
            emptyStock +=
              1;
          } else if (
            stock <=
            minStock
          ) {
            lowStock +=
              1;
          }

        }
      );

      return {
        totalProducts:
          products.length,

        activeProducts,

        totalStock,

        lowStock,

        emptyStock,
      };

    }, [products]);


  /* =======================================================
     FİLTRE
  ======================================================= */

  const filteredProducts =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return products.filter(
        (product) => {

          const matchesSearch =
            !query ||
            String(
              product.name || ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query) ||
            String(
              product.code || ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query) ||
            String(
              product.category || ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query) ||
            String(
              product.brand || ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(query);

          const matchesCategory =
            !categoryFilter ||
            product.category ===
              categoryFilter;

          const matchesBrand =
            !brandFilter ||
            product.brand ===
              brandFilter;

          const matchesStatus =
            !statusFilter ||
            product.status ===
              statusFilter;

          const stockStatus =
            getStockStatus(
              product
            );

          const matchesTab =
            activeTab ===
              "all" ||
            (
              activeTab ===
                "normal" &&
              stockStatus ===
                "normal"
            ) ||
            (
              activeTab ===
                "low" &&
              stockStatus ===
                "low"
            ) ||
            (
              activeTab ===
                "empty" &&
              stockStatus ===
                "empty"
            ) ||
            (
              activeTab ===
                "passive" &&
              stockStatus ===
                "passive"
            );

          return (
            matchesSearch &&
            matchesCategory &&
            matchesBrand &&
            matchesStatus &&
            matchesTab
          );
        }
      );

    }, [
      products,
      search,
      categoryFilter,
      brandFilter,
      statusFilter,
      activeTab,
    ]);


  const allVisibleSelected =
    filteredProducts.length >
      0 &&
    filteredProducts.every(
      (product) =>
        selectedIds.includes(
          product.id
        )
    );


  /* =======================================================
     SEÇİM
  ======================================================= */

  const toggleSelectAll =
    () => {

      if (
        allVisibleSelected
      ) {

        setSelectedIds(
          (prev) =>
            prev.filter(
              (id) =>
                !filteredProducts.some(
                  (product) =>
                    product.id ===
                    id
                )
            )
        );

      } else {

        setSelectedIds(
          (prev) => [
            ...new Set([
              ...prev,
              ...filteredProducts.map(
                (product) =>
                  product.id
              ),
            ]),
          ]
        );

      }

    };


  const toggleSelect =
    (id) => {

      setSelectedIds(
        (prev) =>
          prev.includes(id)
            ? prev.filter(
                (item) =>
                  item !== id
              )
            : [
                ...prev,
                id,
              ]
      );

    };


  /* =======================================================
     FİLTRE TEMİZLE
  ======================================================= */

  const clearFilters =
    () => {

      setCategoryFilter("");
      setBrandFilter("");
      setStatusFilter("");
      setSearch("");
      setActiveTab("all");

    };


  /* =======================================================
     SİL
  ======================================================= */

  const handleDelete =
    (product) => {

      const confirmed =
        window.confirm(
          `"${product.name}" ürününü silmek istediğinize emin misiniz?`
        );

      if (!confirmed) {
        return;
      }

      setProducts(
        (prev) =>
          prev.filter(
            (item) =>
              item.id !==
              product.id
          )
      );

      setSelectedIds(
        (prev) =>
          prev.filter(
            (id) =>
              id !==
              product.id
          )
      );

    };


  /* =======================================================
     AKTİF / PASİF
  ======================================================= */

  const handleDeactivate =
    (product) => {

      setProducts(
        (prev) =>
          prev.map(
            (item) =>
              item.id ===
              product.id
                ? {
                    ...item,
                    status:
                      item.status ===
                      "Pasif"
                        ? "Aktif"
                        : "Pasif",
                  }
                : item
          )
      );

    };


  /* =======================================================
     KOPYALA
  ======================================================= */

  const handleDuplicate =
    (product) => {

      const copy = {
        ...product,
        id: Date.now(),
        code: `${
          product.code ||
          "STK"
        }-KOPYA`,
        name: `${
          product.name
        } - Kopya`,
      };

      setProducts(
        (prev) => [
          copy,
          ...prev,
        ]
      );

    };


  /* =======================================================
     EXCEL
  ======================================================= */

  const handleExcelImport =
    (event) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      alert(
        `"${file.name}" seçildi. Excel aktarımı için dosya işleme modülü hazır olduğunda kayıtlar otomatik aktarılacaktır.`
      );

      event.target.value =
        "";

    };


  const handleExport =
    () => {

      const headers = [
        "Kod",
        "Ürün",
        "Kategori",
        "Marka",
        "Birim",
        "Stok",
        "Min. Stok",
        "Alış Fiyatı",
        "Satış Fiyatı",
        "KDV",
        "Durum",
      ];


      const rows =
        filteredProducts.map(
          (product) => [

            product.code ||
              "",

            product.name ||
              "",

            product.category ||
              "",

            product.brand ||
              "",

            product.unit ||
              "",

            safeNumber(
              product.stock
            ),

            safeNumber(
              product.minStock
            ),

            getPurchasePrice(
              product
            ),

            getSalePrice(
              product
            ),

            getVat(
              product
            ),

            product.status ||
              "",

          ]
        );


      const csv = [
        headers,
        ...rows,
      ]
        .map(
          (row) =>
            row
              .map(
                (value) =>
                  `"${String(
                    value
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(";")
        )
        .join("\n");


      const blob =
        new Blob(
          [
            "\ufeff" +
              csv,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        "REN-ERP-Stok-Listesi.csv";

      link.click();

      URL.revokeObjectURL(
        url
      );

    };


  const handlePrint =
    () => {
      window.print();
    };


  const goNewProduct =
    () => {
      navigate(
        "/stock/new"
      );
    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="ren-stock-list">


      {/* HEADER */}

      <div className="ren-stock-list-header">

        <div>

          <div className="ren-stock-breadcrumb">
            Stok
            <span>/</span>
            <strong>
              Stok Listesi
            </strong>
          </div>

          <h1>
            Stok Listesi
          </h1>

          <p>
            Ürünlerinizi, stok durumlarını ve
            fiyatlarını yönetin.
          </p>

        </div>


        <div className="ren-stock-header-actions">

          <button
            type="button"
            className="ren-outline-button"
            onClick={
              handlePrint
            }
          >
            🖨 Yazdır
          </button>


          <button
            type="button"
            className="ren-excel-button"
            onClick={
              handleExport
            }
          >
            ⇩ Excel
          </button>


          <button
            type="button"
            className="ren-import-button"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            ⇧ Excel Yükle
          </button>


          <input
            ref={fileInputRef}
            type="file"
            className="ren-hidden-file"
            accept=".xlsx,.xls,.csv"
            onChange={
              handleExcelImport
            }
          />


          <div className="ren-action-dropdown">

            <button
              type="button"
              className="ren-outline-button"
              onClick={() =>
                setShowActions(
                  (prev) =>
                    !prev
                )
              }
            >
              İşlemler ▾
            </button>


            {showActions && (

              <div className="ren-action-menu">

                <button
                  type="button"
                  onClick={() => {

                    setShowActions(
                      false
                    );

                    alert(
                      `${selectedIds.length} ürün seçildi.`
                    );

                  }}
                >
                  ✓ Seçilenleri İşle
                </button>


                <button
                  type="button"
                  onClick={() => {

                    setShowActions(
                      false
                    );

                    setSelectedIds(
                      []
                    );

                  }}
                >
                  Seçimleri Temizle
                </button>

              </div>

            )}

          </div>


          <button
            type="button"
            className="ren-new-stock-button"
            onClick={
              goNewProduct
            }
          >
            + Yeni Stok
          </button>

        </div>

      </div>


      {/* SUMMARY */}

      <div className="ren-stock-summary">

        <div className="ren-stock-summary-card">

          <div className="summary-icon blue">
            ▦
          </div>

          <div>

            <span>
              Toplam Ürün
            </span>

            <strong>
              {stats.totalProducts}
            </strong>

            <small>
              {stats.activeProducts} aktif ürün
            </small>

          </div>

        </div>


        <div className="ren-stock-summary-card">

          <div className="summary-icon green">
            ✓
          </div>

          <div>

            <span>
              Toplam Stok
            </span>

            <strong>
              {formatMoney(
                stats.totalStock
              )}
            </strong>

            <small>
              adet / birim
            </small>

          </div>

        </div>


        <div className="ren-stock-summary-card">

          <div className="summary-icon orange">
            !
          </div>

          <div>

            <span>
              Kritik Stok
            </span>

            <strong className="orange-text">
              {stats.lowStock}
            </strong>

            <small>
              yenileme bekliyor
            </small>

          </div>

        </div>


        <div className="ren-stock-summary-card">

          <div className="summary-icon red">
            ×
          </div>

          <div>

            <span>
              Stok Yok
            </span>

            <strong className="red-text">
              {stats.emptyStock}
            </strong>

            <small>
              ürün
            </small>

          </div>

        </div>

      </div>


      {/* TOOLBAR */}

      <div className="ren-stock-toolbar">

        <div className="ren-stock-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Ürün adı, kodu, marka veya kategori ara..."
          />


          {search && (

            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              title="Temizle"
            >
              ×
            </button>

          )}

        </div>


        <button
          type="button"
          className={
            showFilters
              ? "ren-filter-button active"
              : "ren-filter-button"
          }
          onClick={() =>
            setShowFilters(
              (prev) =>
                !prev
            )
          }
        >
          ⚙ Filtrele
        </button>


        {selectedIds.length >
          0 && (

          <div className="ren-selected-info">
            {selectedIds.length} ürün seçildi
          </div>

        )}

      </div>


      {/* FILTERS */}

      {showFilters && (

        <div className="ren-filter-panel">

          <div>

            <label>
              Kategori
            </label>

            <select
              value={
                categoryFilter
              }
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                Tüm Kategoriler
              </option>

              {categories.map(
                (category) => (

                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label>
              Marka
            </label>

            <select
              value={
                brandFilter
              }
              onChange={(event) =>
                setBrandFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                Tüm Markalar
              </option>

              {brands.map(
                (brand) => (

                  <option
                    key={brand}
                    value={brand}
                  >
                    {brand}
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label>
              Durum
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                Tüm Durumlar
              </option>

              <option value="Aktif">
                Aktif
              </option>

              <option value="Pasif">
                Pasif
              </option>

            </select>

          </div>


          <button
            type="button"
            onClick={
              clearFilters
            }
          >
            Filtreleri Temizle
          </button>

        </div>

      )}


      {/* TABS */}

      <div className="ren-stock-tabs">

        <button
          type="button"
          className={
            activeTab ===
            "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "all"
            )
          }
        >
          Tümü

          <b>
            {stats.totalProducts}
          </b>

        </button>


        <button
          type="button"
          className={
            activeTab ===
            "normal"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "normal"
            )
          }
        >
          <i className="dot green" />

          Normal

        </button>


        <button
          type="button"
          className={
            activeTab ===
            "low"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "low"
            )
          }
        >
          <i className="dot orange" />

          Kritik

          <b>
            {stats.lowStock}
          </b>

        </button>


        <button
          type="button"
          className={
            activeTab ===
            "empty"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "empty"
            )
          }
        >
          <i className="dot red" />

          Stok Yok

          <b>
            {stats.emptyStock}
          </b>

        </button>


        <button
          type="button"
          className={
            activeTab ===
            "passive"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "passive"
            )
          }
        >
          <i className="dot gray" />

          Pasif

        </button>

      </div>


      {/* TABLE */}

      <div className="ren-stock-table-card">

        <div className="ren-table-topbar">

          <div>

            <strong>
              Ürünler
            </strong>

            <span>
              {filteredProducts.length} kayıt
            </span>

          </div>


          <button
            type="button"
            className="ren-table-pdf-button"
            onClick={
              handlePrint
            }
          >
            🖨 PDF / Yazdır
          </button>

        </div>


        <div className="ren-table-scroll">

          <table className="ren-stock-table">

            <thead>

              <tr>

                <th className="check-column">
                  <input
                    type="checkbox"
                    checked={
                      allVisibleSelected
                    }
                    onChange={
                      toggleSelectAll
                    }
                  />
                </th>

                <th>
                  ÜRÜN
                </th>

                <th>
                  KOD
                </th>

                <th>
                  KATEGORİ
                </th>

                <th>
                  MARKA
                </th>

                <th>
                  STOK
                </th>

                <th>
                  ALIŞ FİYATI
                </th>

                <th>
                  SATIŞ FİYATI
                </th>

                <th>
                  KDV
                </th>

                <th>
                  DURUM
                </th>

                <th>
                  İŞLEMLER
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredProducts.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="11"
                    className="ren-empty-table"
                  >

                    <strong>
                      Ürün bulunamadı
                    </strong>

                    <span>
                      Arama veya filtre kriterlerini
                      değiştirin.
                    </span>

                  </td>

                </tr>

              ) : (

                filteredProducts.map(
                  (product) => {

                    const stockStatus =
                      getStockStatus(
                        product
                      );

                    const isSelected =
                      selectedIds.includes(
                        product.id
                      );

                    const purchasePrice =
                      getPurchasePrice(
                        product
                      );

                    const salePrice =
                      getSalePrice(
                        product
                      );

                    const vat =
                      getVat(
                        product
                      );

                    const productImage =
                      getProductImage(
                        product
                      );

                    return (

                      <tr
                        key={
                          product.id
                        }
                        className={
                          isSelected
                            ? "selected-row"
                            : ""
                        }
                      >

                        <td className="check-column">

                          <input
                            type="checkbox"
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              toggleSelect(
                                product.id
                              )
                            }
                          />

                        </td>


                        <td>

                          <div className="ren-product-cell">

                            <div className="ren-product-image">

                              {productImage ? (

                                <img
                                  src={
                                    productImage
                                  }
                                  alt={
                                    product.name ||
                                    "Ürün"
                                  }
                                />

                              ) : (

                                String(
                                  product.name ||
                                  "Ü"
                                ).charAt(0)

                              )}

                            </div>


                            <div>

                              <strong>
                                {
                                  product.name ||
                                  "İsimsiz Ürün"
                                }
                              </strong>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span className="ren-code">
                            {
                              product.code ||
                              "-"
                            }
                          </span>

                        </td>


                        <td>
                          {
                            product.category ||
                            "-"
                          }
                        </td>


                        <td>
                          {
                            product.brand ||
                            "-"
                          }
                        </td>


                        <td>

                          <strong
                            className={
                              stockStatus ===
                              "empty"
                                ? "stock-empty"
                                : stockStatus ===
                                  "low"
                                ? "stock-low"
                                : "stock-normal"
                            }
                          >
                            {formatMoney(
                              product.stock
                            )}
                          </strong>


                          {product.unit && (

                            <small>
                              {" "}
                              {
                                product.unit
                              }
                            </small>

                          )}

                        </td>


                        <td>

                          {formatMoney(
                            purchasePrice
                          )}{" "}
                          ₺

                        </td>


                        <td>

                          <strong>

                            {formatMoney(
                              salePrice
                            )}{" "}
                            ₺

                          </strong>

                        </td>


                        <td>

                          %
                          {
                            vat
                          }

                        </td>


                        <td>

                          <span
                            className={`ren-status ${stockStatus}`}
                          >

                            <i />

                            {stockStatus ===
                            "normal"
                              ? "Normal"
                              : stockStatus ===
                                "low"
                              ? "Kritik"
                              : stockStatus ===
                                "empty"
                              ? "Stok Yok"
                              : "Pasif"}

                          </span>

                        </td>


                        <td>

                          <div className="ren-row-actions">

                            <button
                              type="button"
                              title="Düzenle"
                              onClick={() =>
                                navigate(
                                  `/stock/edit/${product.id}`
                                )
                              }
                            >
                              ✎
                            </button>


                            <button
                              type="button"
                              title="Kopyala"
                              onClick={() =>
                                handleDuplicate(
                                  product
                                )
                              }
                            >
                              ⧉
                            </button>


                            <button
                              type="button"
                              title={
                                product.status ===
                                "Pasif"
                                  ? "Aktifleştir"
                                  : "Pasife Al"
                              }
                              onClick={() =>
                                handleDeactivate(
                                  product
                                )
                              }
                            >
                              ◐
                            </button>


                            <button
                              type="button"
                              title="Sil"
                              onClick={() =>
                                handleDelete(
                                  product
                                )
                              }
                            >
                              🗑
                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>


        {/* FOOTER */}

        <div className="ren-table-footer">

          <span>

            <strong>
              {
                filteredProducts.length
              }
            </strong>{" "}
            kayıt gösteriliyor

          </span>


          <div className="ren-pagination">

            <button
              type="button"
              disabled
            >
              ‹
            </button>

            <button
              type="button"
              className="active"
            >
              1
            </button>

            <button
              type="button"
              disabled
            >
              ›
            </button>

          </div>


          <select
            defaultValue="25"
          >

            <option value="25">
              25 / sayfa
            </option>

            <option value="50">
              50 / sayfa
            </option>

            <option value="100">
              100 / sayfa
            </option>

          </select>

        </div>

      </div>

    </div>

  );
}