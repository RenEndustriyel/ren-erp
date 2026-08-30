import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./StockList.css";


const STORAGE_KEY =
  "ren_erp_products";


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
   SAYI
========================================================= */

const safeNumber = (
  value
) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }


  if (
    typeof value ===
    "number"
  ) {

    return Number.isFinite(
      value
    )
      ? value
      : 0;

  }


  let text =
    String(
      value
    ).trim();


  if (
    text.includes(",") &&
    text.includes(".")
  ) {

    text =
      text
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );

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
    Number(
      text
    );


  return Number.isFinite(
    number
  )
    ? number
    : 0;

};


/* =========================================================
   PARA
========================================================= */

const formatMoney = (
  value
) => {

  return new Intl.NumberFormat(
    "tr-TR",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    safeNumber(
      value
    )
  );

};


/* =========================================================
   ALIŞ
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
   SATIŞ
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
      product.minStock ??
      product.criticalStock
    );


  if (
    product.status ===
    "Pasif"
  ) {

    return "passive";

  }


  if (
    stock <=
    0
  ) {

    return "empty";

  }


  if (
    minStock > 0 &&
    stock <=
    minStock
  ) {

    return "low";

  }


  return "normal";

};


/* =========================================================
   COMPONENT
========================================================= */

export default function StockList() {

  const navigate =
    useNavigate();


  const fileInputRef =
    useRef(
      null
    );


  const [
    products,
    setProducts,
  ] = useState(
    []
  );


  const [
    search,
    setSearch,
  ] = useState(
    ""
  );


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "all"
  );


  const [
    selectedIds,
    setSelectedIds,
  ] = useState(
    []
  );


  const [
    showFilters,
    setShowFilters,
  ] = useState(
    false
  );


  const [
    showActions,
    setShowActions,
  ] = useState(
    false
  );


  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState(
    ""
  );


  const [
    brandFilter,
    setBrandFilter,
  ] = useState(
    ""
  );


  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    ""
  );


  /* =======================================================
     ÜRÜNLERİ OKU
  ======================================================= */

  useEffect(() => {

    const loadProducts =
      () => {

        try {

          const saved =
            localStorage.getItem(
              STORAGE_KEY
            );


          if (
            saved
          ) {

            const parsed =
              JSON.parse(
                saved
              );


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
            []
          );

        } catch (
          error
        ) {

          console.error(
            "REN ERP stok listesi okunamadı:",
            error
          );


          setProducts(
            []
          );

        }

      };


    loadProducts();


    window.addEventListener(
      "ren-products-changed",
      loadProducts
    );


    window.addEventListener(
      "ren-stock-updated",
      loadProducts
    );


    window.addEventListener(
      "storage",
      loadProducts
    );


    return () => {

      window.removeEventListener(
        "ren-products-changed",
        loadProducts
      );


      window.removeEventListener(
        "ren-stock-updated",
        loadProducts
      );


      window.removeEventListener(
        "storage",
        loadProducts
      );

    };

  }, []);


  /* =======================================================
     DEĞİŞİNCE KAYDET
  ======================================================= */

  useEffect(() => {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        products
      )
    );

  }, [
    products,
  ]);


  /* =======================================================
     KATEGORİLER
  ======================================================= */

  const categories =
    useMemo(() => {

      return [
        ...new Set(

          products
            .map(
              (
                product
              ) =>
                product.category
            )
            .filter(
              Boolean
            )

        ),
      ];

    }, [
      products,
    ]);


  /* =======================================================
     MARKALAR
  ======================================================= */

  const brands =
    useMemo(() => {

      return [
        ...new Set(

          products
            .map(
              (
                product
              ) =>
                product.brand
            )
            .filter(
              Boolean
            )

        ),
      ];

    }, [
      products,
    ]);


  /* =======================================================
     ÖZET
  ======================================================= */

  const stats =
    useMemo(() => {

      let totalStock =
        0;

      let lowStock =
        0;

      let emptyStock =
        0;

      let activeProducts =
        0;


      products.forEach(
        (
          product
        ) => {

          const stock =
            safeNumber(
              product.stock
            );


          const minStock =
            safeNumber(
              product.minStock ??
              product.criticalStock
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
            stock <=
            0
          ) {

            emptyStock +=
              1;

          } else if (
            minStock > 0 &&
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

    }, [
      products,
    ]);


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
        (
          product
        ) => {

          const matchesSearch =
            !query ||

            String(
              product.name ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              product.code ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              product.category ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              ) ||

            String(
              product.brand ||
              ""
            )
              .toLocaleLowerCase(
                "tr-TR"
              )
              .includes(
                query
              );


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


  /* =======================================================
     TÜMÜNÜ SEÇ
  ======================================================= */

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


  const toggleSelectAll =
    () => {

      if (
        allVisibleSelected
      ) {

        setSelectedIds(
          (prev) =>
            prev.filter(
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

      } else {

        setSelectedIds(
          (prev) => [

            ...new Set([

              ...prev,

              ...filteredProducts.map(
                (
                  product
                ) =>
                  product.id
              ),

            ]),

          ]
        );

      }

    };


  /* =======================================================
     SEÇ
  ======================================================= */

  const toggleSelect =
    (
      id
    ) => {

      setSelectedIds(
        (prev) =>

          prev.includes(
            id
          )

            ? prev.filter(
                (
                  item
                ) =>
                  item !==
                  id
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

      setCategoryFilter(
        ""
      );

      setBrandFilter(
        ""
      );

      setStatusFilter(
        ""
      );

      setSearch(
        ""
      );

      setActiveTab(
        "all"
      );

    };


  /* =======================================================
     ÜRÜN DETAY
  ======================================================= */

  const openProductDetail =
    (
      product
    ) => {

      /*
        Projede mevcut ürün düzenleme route'u:
        /stock/edit/:id

        Ayrı bir detay route'u bulunmadığı için
        ürün adına tıklama doğrudan mevcut ürün
        detay/düzenleme ekranını açar.
      */

      navigate(
        `/stock/edit/${encodeURIComponent(
          product.id
        )}`
      );

    };


  /* =======================================================
     SİL
  ======================================================= */

  const handleDelete =
    (
      product
    ) => {

      const confirmed =
        window.confirm(
          `"${product.name}" ürününü silmek istediğinize emin misiniz?`
        );


      if (
        !confirmed
      ) {
        return;
      }


      setProducts(
        (prev) =>
          prev.filter(
            (
              item
            ) =>
              item.id !==
              product.id
          )
      );


      setSelectedIds(
        (prev) =>
          prev.filter(
            (
              id
            ) =>
              id !==
              product.id
          )
      );

    };


  /* =======================================================
     AKTİF / PASİF
  ======================================================= */

  const handleDeactivate =
    (
      product
    ) => {

      setProducts(
        (prev) =>
          prev.map(
            (
              item
            ) =>

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
    (
      product
    ) => {

      const copy = {

        ...product,

        id:
          Date.now(),

        code:
          `${
            product.code ||
            "STK"
          }-KOPYA`,

        name:
          `${product.name} - Kopya`,

      };


      setProducts(
        (prev) => [

          copy,

          ...prev,

        ]
      );

    };


  /* =======================================================
     EXCEL İÇE AKTAR
  ======================================================= */

  const handleExcelImport =
    (
      event
    ) => {

      const file =
        event.target.files?.[0];


      if (
        !file
      ) {
        return;
      }


      alert(
        `"${file.name}" seçildi. Excel aktarım modülü mevcut yapıya göre ayrıca işlenecek.`
      );


      event.target.value =
        "";

    };


  /* =======================================================
     EXPORT
  ======================================================= */

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
          (
            product
          ) => [

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
              product.minStock ??
              product.criticalStock
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
          (
            row
          ) =>

            row
              .map(
                (
                  value
                ) =>
                  `"${String(
                    value
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(
                ";"
              )

        )
        .join(
          "\n"
        );


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


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );

    };


  /* =======================================================
     YAZDIR
  ======================================================= */

  const handlePrint =
    () => {

      window.print();

    };


  /* =======================================================
     YENİ ÜRÜN
  ======================================================= */

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


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="ren-stock-list-header">

        <div>

          <div className="ren-stock-breadcrumb">

            Stok

            <span>
              /
            </span>

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
            ref={
              fileInputRef
            }
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
                  (
                    prev
                  ) =>
                    !prev
                )
              }
            >
              İşlemler ▾
            </button>


            {
              showActions && (

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

              )
            }

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


      {/* =================================================
          SUMMARY
      ================================================= */}

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
              {
                stats.totalProducts
              }
            </strong>

            <small>
              {
                stats.activeProducts
              }
              {" "}
              aktif ürün
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
              {
                formatMoney(
                  stats.totalStock
                )
              }
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
              {
                stats.lowStock
              }
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
              {
                stats.emptyStock
              }
            </strong>

            <small>
              ürün
            </small>

          </div>

        </div>

      </div>


      {/* =================================================
          TABS
      ================================================= */}

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
          Kritik
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
          Stok Yok
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
          Pasif
        </button>

      </div>


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="ren-stock-toolbar">

        <div className="ren-stock-search">

          <span>
            ⌕
          </span>


          <input
            type="text"
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Ürün adı, kodu, marka veya kategori ara..."
          />


          {
            search && (

              <button
                type="button"
                onClick={() =>
                  setSearch(
                    ""
                  )
                }
                title="Temizle"
              >
                ×
              </button>

            )
          }

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
              (
                prev
              ) =>
                !prev
            )
          }
        >
          ⚙ Filtrele
        </button>


        {
          selectedIds.length >
          0 && (

            <div className="ren-selected-info">
              {
                selectedIds.length
              }
              {" "}
              ürün seçildi
            </div>

          )
        }

      </div>


      {/* =================================================
          FILTERS
      ================================================= */}

      {
        showFilters && (

          <div className="ren-filter-panel">


            <div>

              <label>
                Kategori
              </label>


              <select
                value={
                  categoryFilter
                }
                onChange={(
                  event
                ) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Tüm Kategoriler
                </option>


                {
                  categories.map(
                    (
                      category
                    ) => (

                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>

                    )
                  )
                }

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
                onChange={(
                  event
                ) =>
                  setBrandFilter(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Tüm Markalar
                </option>


                {
                  brands.map(
                    (
                      brand
                    ) => (

                      <option
                        key={
                          brand
                        }
                        value={
                          brand
                        }
                      >
                        {
                          brand
                        }
                      </option>

                    )
                  )
                }

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
                onChange={(
                  event
                ) =>
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

        )
      }


      {/* =================================================
          TABLO
      ================================================= */}

      <div className="ren-stock-table-card">

        <div className="ren-stock-table-wrapper">

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

              {
                filteredProducts.length ===
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
                    (
                      product
                    ) => {

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


                          {/* CHECK */}

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


                          {/* ÜRÜN */}

                          <td>

                            <div
                              className="ren-product-cell"
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                              }}
                            >

                              <div>

                                <button
                                  type="button"
                                  className="stock-product-name-link"
                                  onClick={() =>
                                    openProductDetail(
                                      product
                                    )
                                  }
                                  title="Ürün detayını aç"
                                >

                                  {
                                    product.name ||
                                    "İsimsiz Ürün"
                                  }

                                </button>


                                {
                                  product.model && (

                                    <small
                                      style={{
                                        display:
                                          "block",
                                        marginTop:
                                          "3px",
                                        color:
                                          "#98a0a8",
                                      }}
                                    >
                                      {
                                        product.model
                                      }
                                    </small>

                                  )
                                }

                              </div>

                            </div>

                          </td>


                          {/* KOD */}

                          <td>

                            <span className="ren-code">
                              {
                                product.code ||
                                "-"
                              }
                            </span>

                          </td>


                          {/* KATEGORİ */}

                          <td>
                            {
                              product.category ||
                              "-"
                            }
                          </td>


                          {/* MARKA */}

                          <td>
                            {
                              product.brand ||
                              "-"
                            }
                          </td>


                          {/* STOK */}

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

                              {
                                formatMoney(
                                  product.stock
                                )
                              }

                            </strong>


                            {
                              product.unit && (

                                <small>
                                  {" "}
                                  {
                                    product.unit
                                  }
                                </small>

                              )
                            }

                          </td>


                          {/* ALIŞ */}

                          <td>

                            <strong>
                              ₺
                              {
                                formatMoney(
                                  purchasePrice
                                )
                              }
                            </strong>

                          </td>


                          {/* SATIŞ */}

                          <td>

                            <strong>
                              ₺
                              {
                                formatMoney(
                                  salePrice
                                )
                              }
                            </strong>

                          </td>


                          {/* KDV */}

                          <td>

                            %
                            {
                              vat
                            }

                          </td>


                          {/* DURUM */}

                          <td>

                            <span
                              className={
                                `ren-status ${stockStatus}`
                              }
                            >

                              <i />

                              {
                                stockStatus ===
                                "normal"

                                  ? "Normal"

                                  : stockStatus ===
                                    "low"

                                  ? "Kritik"

                                  : stockStatus ===
                                    "empty"

                                  ? "Stok Yok"

                                  : "Pasif"
                              }

                            </span>

                          </td>


                          {/* İŞLEMLER */}

                          <td>

                            <div className="ren-row-actions">


                              <button
                                type="button"
                                title="Detay / Düzenle"
                                onClick={() =>
                                  openProductDetail(
                                    product
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
                                ×
                              </button>

                            </div>

                          </td>

                        </tr>

                      );

                    }
                  )

                )
              }

            </tbody>

          </table>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="ren-stock-list-footer">

          <span>

            Toplam{" "}

            <strong>
              {
                filteredProducts.length
              }
            </strong>

            {" "}
            ürün

          </span>


          <span>

            Seçili:

            {" "}

            <strong>
              {
                selectedIds.length
              }
            </strong>

          </span>

        </div>

      </div>


    </div>

  );
}