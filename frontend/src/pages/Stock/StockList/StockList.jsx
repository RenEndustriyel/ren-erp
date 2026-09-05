import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  saveProducts,
  deleteProduct,
  updateProduct,
} from "../../../lib/stockStore";
import "./StockList.css";

const COLUMN_KEY = "ren_erp_stock_list_columns";

const safeNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let text = String(value).trim();
  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber(value));

const purchasePrice = (product) =>
  safeNumber(
    product?.purchaseNet ??
      product?.purchasePrice ??
      product?.buyPrice ??
      product?.cost ??
      product?.purchase ??
      product?.buyingPrice ??
      0
  );

const vatRate = (product) =>
  safeNumber(
    product?.salesVat ??
      product?.vatRate ??
      product?.vat ??
      product?.kdv ??
      0
  );

const saleNet = (product) =>
  safeNumber(
    product?.salesNet ??
      product?.saleNet ??
      product?.salePriceNet ??
      product?.sellingPriceNet ??
      product?.sellingNet ??
      product?.salePrice ??
      product?.sellingPrice ??
      product?.salesPrice ??
      product?.price ??
      product?.retailPrice ??
      0
  );

const saleGross = (product) => {
  const direct =
    product?.salesGross ??
    product?.salePriceWithVat ??
    product?.salePriceVatIncluded ??
    product?.sellingPriceWithVat ??
    product?.retailPriceWithVat;

  if (direct !== undefined && direct !== null && direct !== "") {
    return safeNumber(direct);
  }

  const net = saleNet(product);
  const vat = vatRate(product);
  return net + (net * vat) / 100;
};

const profitPercent = (product) => {
  const buy = purchasePrice(product);
  const net = saleNet(product);
  if (buy <= 0) return 0;
  return ((net - buy) / buy) * 100;
};

const stockStatus = (product) => {
  const stock = safeNumber(product?.stock);
  const minimum = safeNumber(
    product?.minStock ?? product?.criticalStock
  );

  if (product?.status === "Pasif" || product?.active === false) return "passive";
  if (stock <= 0) return "empty";
  if (minimum > 0 && stock <= minimum) return "low";
  return "normal";
};

const DEFAULT_COLUMNS = {
  product: true,
  code: true,
  category: true,
  brand: true,
  stock: true,
  purchase: true,
  profit: true,
  sale: true,
  vat: true,
  status: true,
  actions: true,
};

const COLUMN_OPTIONS = [
  ["product", "Ürün"],
  ["code", "Kod"],
  ["category", "Kategori"],
  ["brand", "Marka"],
  ["stock", "Stok"],
  ["purchase", "Alış Fiyatı"],
  ["profit", "% Kâr"],
  ["sale", "Satış Fiyatı (KDV Dahil)"],
  ["vat", "KDV"],
  ["status", "Durum"],
  ["actions", "İşlemler"],
];

export default function StockList() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [columns, setColumns] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COLUMN_KEY) || "null");
      return { ...DEFAULT_COLUMNS, ...(saved && typeof saved === "object" ? saved : {}) };
    } catch {
      return { ...DEFAULT_COLUMNS };
    }
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_KEY, JSON.stringify(columns));
  }, [columns]);

  const loadProducts = () => {
    try {
      const value = getProducts();
      setProducts(Array.isArray(value) ? value : []);
    } catch (error) {
      console.error("REN ERP stok listesi okunamadı:", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts();

    const events = [
      "ren-products-changed",
      "ren-stock-updated",
      "storage",
    ];

    events.forEach((event) => window.addEventListener(event, loadProducts));
    return () => {
      events.forEach((event) => window.removeEventListener(event, loadProducts));
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((x) => x?.category).filter(Boolean))],
    [products]
  );

  const brands = useMemo(
    () => [...new Set(products.map((x) => x?.brand).filter(Boolean))],
    [products]
  );

  const stats = useMemo(() => {
    let totalStock = 0;
    let low = 0;
    let empty = 0;
    let active = 0;

    products.forEach((product) => {
      const stock = safeNumber(product?.stock);
      const minimum = safeNumber(product?.minStock ?? product?.criticalStock);

      totalStock += stock;

      if (product?.status !== "Pasif" && product?.active !== false) active += 1;
      if (stock <= 0) empty += 1;
      else if (minimum > 0 && stock <= minimum) low += 1;
    });

    return {
      totalProducts: products.length,
      activeProducts: active,
      totalStock,
      lowStock: low,
      emptyStock: empty,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return products.filter((product) => {
      const haystack = [
        product?.name,
        product?.code,
        product?.category,
        product?.brand,
        product?.barcode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      const status = stockStatus(product);

      const matchesSearch = !query || haystack.includes(query);
      const matchesCategory = !categoryFilter || product?.category === categoryFilter;
      const matchesBrand = !brandFilter || product?.brand === brandFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "Aktif"
          ? product?.status !== "Pasif" && product?.active !== false
          : product?.status === "Pasif" || product?.active === false);

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "normal" && status === "normal") ||
        (activeTab === "low" && status === "low") ||
        (activeTab === "empty" && status === "empty") ||
        (activeTab === "passive" && status === "passive");

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesStatus &&
        matchesTab
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    brandFilter,
    statusFilter,
    activeTab,
  ]);

  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedIds.includes(product.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) =>
        prev.filter(
          (id) => !filteredProducts.some((product) => product.id === id)
        )
      );
    } else {
      setSelectedIds((prev) => [
        ...new Set([
          ...prev,
          ...filteredProducts.map((product) => product.id),
        ]),
      ]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("");
    setActiveTab("all");
  };

  const openProduct = (product) => {
    if (product?.id === undefined || product?.id === null) return;
    navigate(`/stock/edit/${encodeURIComponent(product.id)}`);
  };

  const handleDelete = (product) => {
    if (
      !window.confirm(
        `"${product?.name || "Ürün"}" ürününü silmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    try {
      deleteProduct(product.id);
      loadProducts();
      setSelectedIds((prev) => prev.filter((id) => id !== product.id));
    } catch (error) {
      console.error(error);
      alert(error?.message || "Ürün silinemedi.");
    }
  };

  const handleActive = (product) => {
    try {
      const active = product?.active === false;
      updateProduct(product.id, {
        active,
        status: active ? "Aktif" : "Pasif",
      });
      loadProducts();
    } catch (error) {
      console.error(error);
      alert(error?.message || "Ürün durumu değiştirilemedi.");
    }
  };

  const handleDuplicate = (product) => {
    const baseCode = String(product?.code || "STK").trim();
    const all = getProducts() || [];
    let code = `${baseCode}-KOPYA`;
    let counter = 2;

    while (
      all.some(
        (item) =>
          String(item?.code || "").toLocaleLowerCase("tr-TR") ===
          code.toLocaleLowerCase("tr-TR")
      )
    ) {
      code = `${baseCode}-KOPYA-${counter++}`;
    }

    saveProducts([
      {
        ...product,
        id: `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        code,
        name: `${product?.name || "Ürün"} - Kopya`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...all,
    ]);

    loadProducts();
  };

  const handleExport = () => {
    const headers = [
      "Kod",
      "Ürün",
      "Kategori",
      "Marka",
      "Birim",
      "Stok",
      "Alış Fiyatı KDV Hariç",
      "% Kâr",
      "Satış Fiyatı KDV Dahil",
      "KDV",
      "Durum",
    ];

    const rows = filteredProducts.map((product) => [
      product?.code || "",
      product?.name || "",
      product?.category || "",
      product?.brand || "",
      product?.unit || "",
      safeNumber(product?.stock),
      purchasePrice(product),
      profitPercent(product),
      saleGross(product),
      vatRate(product),
      product?.status || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "REN-ERP-Stok-Listesi.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const activeColumnCount = Object.values(columns).filter(Boolean).length;
  const tableColumnCount = activeColumnCount + 1;

  return (
    <div className="ren-stock-list">
      <div className="ren-stock-list-header">
        <div>
          <div className="ren-stock-breadcrumb">
            <span>Stok</span>
            <b>/</b>
            <strong>Stok Listesi</strong>
          </div>
          <h1>Stok Listesi</h1>
          <p>Ürünlerinizi, stok durumlarını ve fiyatlarını yönetin.</p>
        </div>

        <div className="ren-stock-header-actions">
          <button className="ren-outline-button" type="button" onClick={() => window.print()}>
            🖨 Yazdır
          </button>
          <button className="ren-outline-button" type="button" onClick={handleExport}>
            ⇩ Excel
          </button>
          <button
            className="ren-outline-button"
            type="button"
            onClick={() => fileRef.current?.click()}
          >
            ⇧ Excel Yükle
          </button>
          <input
            ref={fileRef}
            className="ren-hidden-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                alert(`"${file.name}" seçildi. Excel aktarım modülü ayrıca işlenecek.`);
              }
              event.target.value = "";
            }}
          />

          <div className="ren-action-dropdown">
            <button
              className="ren-outline-button"
              type="button"
              onClick={() => setShowActions((prev) => !prev)}
            >
              İşlemler ▾
            </button>

            {showActions && (
              <div className="ren-action-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowActions(false);
                    alert(`${selectedIds.length} ürün seçildi.`);
                  }}
                >
                  ✓ Seçilenleri İşle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowActions(false);
                    setSelectedIds([]);
                  }}
                >
                  Seçimleri Temizle
                </button>
              </div>
            )}
          </div>

          <button
            className="ren-new-stock-button"
            type="button"
            onClick={() => navigate("/stock/new")}
          >
            + Yeni Stok
          </button>
        </div>
      </div>

      <div className="ren-stock-summary">
        <div className="ren-stock-summary-card">
          <div className="summary-icon blue">▦</div>
          <div>
            <span>Toplam Ürün</span>
            <strong>{stats.totalProducts}</strong>
            <small>{stats.activeProducts} aktif ürün</small>
          </div>
        </div>

        <div className="ren-stock-summary-card">
          <div className="summary-icon green">✓</div>
          <div>
            <span>Toplam Stok</span>
            <strong>{money(stats.totalStock)}</strong>
            <small>adet / birim</small>
          </div>
        </div>

        <div className="ren-stock-summary-card">
          <div className="summary-icon orange">!</div>
          <div>
            <span>Kritik Stok</span>
            <strong className="orange-text">{stats.lowStock}</strong>
            <small>yenileme bekliyor</small>
          </div>
        </div>

        <div className="ren-stock-summary-card">
          <div className="summary-icon red">×</div>
          <div>
            <span>Stok Yok</span>
            <strong className="red-text">{stats.emptyStock}</strong>
            <small>ürün</small>
          </div>
        </div>
      </div>

      <div className="ren-stock-tabs">
        {[
          ["all", "Tümü"],
          ["normal", "Normal"],
          ["low", "Kritik"],
          ["empty", "Stok Yok"],
          ["passive", "Pasif"],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={activeTab === key ? "active" : ""}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ren-stock-toolbar">
        <div className="ren-stock-search">
          <span>⌕</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ürün adı, kodu, marka veya kategori ara..."
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")}>
              ×
            </button>
          ) : null}
        </div>

        <button
          className={`ren-filter-button ${showFilters ? "active" : ""}`}
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          ⚙ Filtrele
        </button>

        <div className="ren-column-selector-wrap">
          <button
            className={`ren-column-button ${showColumns ? "active" : ""}`}
            type="button"
            onClick={() => setShowColumns((prev) => !prev)}
          >
            ☷ Sütunlar
          </button>

          {showColumns ? (
            <div className="ren-column-menu">
              <div className="ren-column-menu-header">
                <strong>Sütunları göster / gizle</strong>
                <button type="button" onClick={() => setColumns({ ...DEFAULT_COLUMNS })}>
                  Varsayılan
                </button>
              </div>

              {COLUMN_OPTIONS.map(([key, label]) => (
                <label className="ren-column-option" key={key}>
                  <input
                    type="checkbox"
                    checked={Boolean(columns[key])}
                    onChange={() =>
                      setColumns((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        {selectedIds.length ? (
          <div className="ren-selected-info">
            {selectedIds.length} ürün seçildi
          </div>
        ) : null}
      </div>

      {showFilters ? (
        <div className="ren-filter-panel">
          <div>
            <label>Kategori</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Tüm Kategoriler</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Marka</label>
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
              <option value="">Tüm Markalar</option>
              {brands.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Durum</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              <option value="Aktif">Aktif</option>
              <option value="Pasif">Pasif</option>
            </select>
          </div>

          <button type="button" onClick={clearFilters}>Filtreleri Temizle</button>
        </div>
      ) : null}

      <div className="ren-stock-table-card">
        <div className="ren-stock-table-wrapper">
          <table className="ren-stock-table">
            <thead>
              <tr>
                <th className="check-column">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                {columns.product ? <th>ÜRÜN</th> : null}
                {columns.code ? <th>KOD</th> : null}
                {columns.category ? <th>KATEGORİ</th> : null}
                {columns.brand ? <th>MARKA</th> : null}
                {columns.stock ? <th>STOK</th> : null}
                {columns.purchase ? (
                  <th>ALIŞ FİYATI<br /><small>KDV Hariç</small></th>
                ) : null}
                {columns.profit ? <th>% KÂR</th> : null}
                {columns.sale ? (
                  <th>SATIŞ FİYATI<br /><small>KDV Dahil</small></th>
                ) : null}
                {columns.vat ? <th>KDV</th> : null}
                {columns.status ? <th>DURUM</th> : null}
                {columns.actions ? <th>İŞLEMLER</th> : null}
              </tr>
            </thead>

            <tbody>
              {!filteredProducts.length ? (
                <tr>
                  <td className="ren-empty-table" colSpan={tableColumnCount}>
                    <strong>Ürün bulunamadı</strong>
                    <span>Arama veya filtre kriterlerini değiştirin.</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = stockStatus(product);
                  const selected = selectedIds.includes(product.id);
                  const buy = purchasePrice(product);
                  const sale = saleGross(product);
                  const profit = profitPercent(product);
                  const vat = vatRate(product);

                  return (
                    <tr key={product.id} className={selected ? "selected-row" : ""}>
                      <td className="check-column">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(product.id)}
                        />
                      </td>

                      {columns.product ? (
                        <td>
                          <button
                            type="button"
                            className="stock-product-name-link"
                            onClick={() => openProduct(product)}
                          >
                            {product?.name || "İsimsiz Ürün"}
                          </button>
                          {product?.model ? (
                            <small className="ren-product-model">{product.model}</small>
                          ) : null}
                        </td>
                      ) : null}

                      {columns.code ? <td><span className="ren-code">{product?.code || "-"}</span></td> : null}
                      {columns.category ? <td>{product?.category || "-"}</td> : null}
                      {columns.brand ? <td>{product?.brand || "-"}</td> : null}

                      {columns.stock ? (
                        <td>
                          <strong className={`stock-value ${status}`}>
                            {money(product?.stock)}
                          </strong>
                          {product?.unit ? <small> {product.unit}</small> : null}
                        </td>
                      ) : null}

                      {columns.purchase ? (
                        <td>
                          <strong className="ren-price-main">₺{money(buy)}</strong>
                          <small className="ren-price-sub">KDV hariç</small>
                        </td>
                      ) : null}

                      {columns.profit ? (
                        <td>
                          <strong className={`ren-profit ${profit < 0 ? "negative" : ""}`}>
                            %{profit.toFixed(2).replace(".", ",")}
                          </strong>
                        </td>
                      ) : null}

                      {columns.sale ? (
                        <td>
                          <strong className="ren-price-main ren-sale-price">₺{money(sale)}</strong>
                          <small className="ren-price-sub">KDV dahil</small>
                        </td>
                      ) : null}

                      {columns.vat ? <td>%{money(vat)}</td> : null}

                      {columns.status ? (
                        <td>
                          <span className={`ren-status ${status}`}>
                            <i />
                            {status === "normal"
                              ? "Normal"
                              : status === "low"
                              ? "Kritik"
                              : status === "empty"
                              ? "Stok Yok"
                              : "Pasif"}
                          </span>
                        </td>
                      ) : null}

                      {columns.actions ? (
                        <td>
                          <div className="ren-row-actions">
                            <button type="button" title="Detay / Düzenle" onClick={() => openProduct(product)}>✎</button>
                            <button type="button" title="Kopyala" onClick={() => handleDuplicate(product)}>⧉</button>
                            <button type="button" title={product?.active === false ? "Aktifleştir" : "Pasife Al"} onClick={() => handleActive(product)}>◐</button>
                            <button type="button" title="Sil" onClick={() => handleDelete(product)}>×</button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ren-stock-list-footer">
          <span>Toplam <strong>{filteredProducts.length}</strong> ürün</span>
          <span>Seçili: <strong>{selectedIds.length}</strong></span>
        </div>
      </div>
    </div>
  );
}
