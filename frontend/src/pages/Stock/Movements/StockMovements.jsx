import { useEffect, useMemo, useState } from "react";
import {
  MdArrowDownward,
  MdArrowUpward,
  MdClose,
  MdFilterAlt,
  MdRefresh,
  MdSearch,
  MdSwapVert,
  MdTrendingDown,
  MdTrendingUp,
  MdVisibility,
} from "react-icons/md";

import "./StockMovements.css";

const MOVEMENTS_KEY = "ren_erp_stock_movements";

function readMovements() {
  try {
    const saved = localStorage.getItem(MOVEMENTS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Stok hareketleri okunamadı:", error);
    return [];
  }
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOnly(value) {
  if (!value) return "";
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function formatDate(value) {
  const raw = dateOnly(value);
  if (!raw) return "-";

  const parts = raw.split("-");
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  return raw;
}

function formatQuantity(value) {
  const n = num(value);
  return Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("tr-TR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
}

function normalizeMovementType(movement) {
  const value = String(
    movement?.type ||
      movement?.movementType ||
      movement?.direction ||
      ""
  ).toLowerCase();

  if (
    value.includes("alış") ||
    value.includes("giriş") ||
    value.includes("devir") ||
    value.includes("sayım")
  ) {
    return "Giriş";
  }

  if (
    value.includes("satış") ||
    value.includes("çıkış") ||
    value.includes("fire")
  ) {
    return "Çıkış";
  }

  if (value.includes("iade")) {
    return "İade";
  }

  const quantity = num(
    movement?.quantity ??
      movement?.movement ??
      movement?.amount
  );

  return quantity >= 0 ? "Giriş" : "Çıkış";
}

function movementClass(movement) {
  const type = normalizeMovementType(movement);
  if (type === "İade") return "return";
  return type === "Giriş" ? "in" : "out";
}

export default function StockMovements() {
  const [movements, setMovements] = useState(() => readMovements());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tümü");
  const [sourceFilter, setSourceFilter] = useState("Tümü");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMovement, setSelectedMovement] = useState(null);

  const loadMovements = () => {
    setMovements(readMovements());
  };


  const handleDeleteMovement = (movement) => {
    const productName =
      movement?.productName ||
      movement?.product ||
      "Bu stok hareketi";

    const confirmed = window.confirm(
      `"${productName}" stok hareketi silinsin mi?\n\n` +
        "Bu işlem sadece hareket geçmişini siler. " +
        "Mevcut stok miktarı değiştirilmez."
    );

    if (!confirmed) return;

    const currentMovements = readMovements();

    let nextMovements;

    if (movement?.id != null) {
      nextMovements = currentMovements.filter(
        (item) => String(item?.id ?? "") !== String(movement.id)
      );
    } else {
      const index = currentMovements.findIndex(
        (item) => item === movement
      );

      nextMovements = [...currentMovements];

      if (index >= 0) {
        nextMovements.splice(index, 1);
      }
    }

    localStorage.setItem(
      MOVEMENTS_KEY,
      JSON.stringify(nextMovements)
    );

    setMovements(nextMovements);
    setSelectedMovement(null);

    window.dispatchEvent(
      new Event("ren-stock-movements-changed")
    );
  };

  useEffect(() => {
    const handler = () => loadMovements();

    window.addEventListener("storage", handler);
    window.addEventListener("ren-stock-updated", handler);
    window.addEventListener("ren-stock-movements-changed", handler);
    window.addEventListener("ren-products-changed", handler);

    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("ren-stock-updated", handler);
      window.removeEventListener("ren-stock-movements-changed", handler);
      window.removeEventListener("ren-products-changed", handler);
    };
  }, []);

  const sourceOptions = useMemo(() => {
    const values = movements
      .map(
        (item) =>
          item?.source ||
          item?.sourceDocument ||
          item?.documentNo
      )
      .filter(Boolean)
      .map(String);

    return ["Tümü", ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "tr"))];
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");

    return [...movements]
      .sort((a, b) => {
        const ad = String(a?.date || a?.createdAt || "");
        const bd = String(b?.date || b?.createdAt || "");
        return bd.localeCompare(ad);
      })
      .filter((movement) => {
        const type = normalizeMovementType(movement);

        if (typeFilter !== "Tümü" && type !== typeFilter) {
          return false;
        }

        const source = String(movement?.source || "");
        if (sourceFilter !== "Tümü" && source !== sourceFilter) {
          return false;
        }

        const date = dateOnly(
          movement?.date || movement?.createdAt
        );

        if (dateFrom && date < dateFrom) return false;
        if (dateTo && date > dateTo) return false;

        if (!q) return true;

        const haystack = [
          movement?.productName,
          movement?.product,
          movement?.productCode,
          movement?.source,
          movement?.sourceDocument,
          movement?.documentNo,
          movement?.description,
          movement?.category,
          movement?.brand,
          movement?.unit,
          movement?.user,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        return haystack.includes(q);
      });
  }, [
    movements,
    search,
    typeFilter,
    sourceFilter,
    dateFrom,
    dateTo,
  ]);

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalReturn = 0;

    filteredMovements.forEach((movement) => {
      const quantity = Math.abs(
        num(
          movement?.quantity ??
            movement?.movement ??
            movement?.amount
        )
      );

      const type = normalizeMovementType(movement);

      if (type === "İade") {
        totalReturn += quantity;
      } else if (type === "Giriş") {
        totalIn += quantity;
      } else {
        totalOut += quantity;
      }
    });

    return {
      totalIn,
      totalOut,
      totalReturn,
      net: totalIn + totalReturn - totalOut,
    };
  }, [filteredMovements]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("Tümü");
    setSourceFilter("Tümü");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="stock-movements-page">
      <div className="stock-movements-header">
        <div>
          <div className="stock-movements-breadcrumb">
            Stok <span>›</span> Stok Hareketleri
          </div>

          <h1>Stok Hareketleri</h1>

          <p>
            Ürünlerin tüm giriş, çıkış ve iade hareketlerini
            tek ekrandan takip edin.
          </p>
        </div>

        <button
          type="button"
          className="stock-movements-refresh"
          onClick={loadMovements}
        >
          <MdRefresh />
          YENİLE
        </button>
      </div>

      <div className="stock-movements-summary">
        <div className="movement-summary-card green">
          <span>TOPLAM GİRİŞ</span>
          <strong>
            +{formatQuantity(summary.totalIn)}
          </strong>
          <small>
            {filteredMovements.filter(
              (item) => normalizeMovementType(item) === "Giriş"
            ).length}{" "}
            hareket
          </small>
        </div>

        <div className="movement-summary-card red">
          <span>TOPLAM ÇIKIŞ</span>
          <strong>
            -{formatQuantity(summary.totalOut)}
          </strong>
          <small>
            {filteredMovements.filter(
              (item) => normalizeMovementType(item) === "Çıkış"
            ).length}{" "}
            hareket
          </small>
        </div>

        <div className="movement-summary-card orange">
          <span>TOPLAM İADE</span>
          <strong>
            +{formatQuantity(summary.totalReturn)}
          </strong>
          <small>
            {filteredMovements.filter(
              (item) => normalizeMovementType(item) === "İade"
            ).length}{" "}
            hareket
          </small>
        </div>

        <div
          className={`movement-summary-card ${
            summary.net >= 0 ? "green" : "red"
          }`}
        >
          <span>NET HAREKET</span>
          <strong>
            {summary.net >= 0 ? "+" : "-"}
            {formatQuantity(Math.abs(summary.net))}
          </strong>
          <small>Filtrelenen kayıtlar</small>
        </div>
      </div>

      <div className="stock-movements-filter-card">
        <div className="filter-card-title">
          <div className="filter-card-icon">
            <MdFilterAlt />
          </div>
          <div>
            <strong>Hareketleri Filtrele</strong>
            <span>Ürün, tarih ve işlem kaynağına göre daraltın.</span>
          </div>
        </div>

        <div className="stock-movements-filters">
          <label className="movement-search">
            <MdSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ürün, kod, belge veya açıklama ara..."
            />
          </label>

          <label>
            <span>Hareket Türü</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="Tümü">Tümü</option>
              <option value="Giriş">Giriş</option>
              <option value="Çıkış">Çıkış</option>
              <option value="İade">İade</option>
            </select>
          </label>

          <label>
            <span>Kaynak</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
            >
              {sourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Başlangıç</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label>
            <span>Bitiş</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="clear-filter-button"
            onClick={clearFilters}
          >
            TEMİZLE
          </button>
        </div>
      </div>

      <div className="stock-movements-table-card">
        <div className="stock-movements-table-top">
          <div>
            <strong>Hareket Listesi</strong>
            <span>{filteredMovements.length} kayıt</span>
          </div>

          <div className="table-help">
            <MdSwapVert />
            En yeni hareketler üstte
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="stock-movements-empty">
            <MdSwapVert />
            <h3>Hareket bulunamadı</h3>
            <p>
              Seçtiğiniz filtrelere uygun stok hareketi bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="stock-movements-table-wrap">
            <table className="stock-movements-table">
              <thead>
                <tr>
                  <th>TARİH</th>
                  <th>ÜRÜN</th>
                  <th>HAREKET</th>
                  <th>MİKTAR</th>
                  <th>ÖNCEKİ STOK</th>
                  <th>SONRAKİ STOK</th>
                  <th>KAYNAK / BELGE</th>
                  <th>CARİ / AÇIKLAMA</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredMovements.map((movement, index) => {
                  const type = normalizeMovementType(movement);
                  const className = movementClass(movement);
                  const quantity = Math.abs(
                    num(
                      movement?.quantity ??
                        movement?.movement ??
                        movement?.amount
                    )
                  );
                  const previousStock =
                    movement?.previousStock ??
                    movement?.beforeStock;
                  const nextStock =
                    movement?.nextStock ??
                    movement?.afterStock;

                  const productName =
                    movement?.productName ||
                    movement?.product ||
                    "Ürün bulunamadı";

                  const source =
                    movement?.source ||
                    movement?.sourceDocument ||
                    "-";

                  const documentNo =
                    movement?.sourceDocument ||
                    movement?.documentNo ||
                    "";

                  return (
                    <tr key={movement?.id || `${movement?.createdAt}-${index}`}>
                      <td>
                        <div className="date-cell">
                          <strong>
                            {formatDate(
                              movement?.date ||
                                movement?.createdAt
                            )}
                          </strong>
                          <small>{movement?.time || ""}</small>
                        </div>
                      </td>

                      <td>
                        <div className="product-cell">
                          <strong>{productName}</strong>
                          <small>
                            {movement?.productCode || "-"}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span className={`movement-badge ${className}`}>
                          {className === "in" ? (
                            <MdArrowDownward />
                          ) : className === "out" ? (
                            <MdArrowUpward />
                          ) : (
                            <MdSwapVert />
                          )}
                          {type}
                        </span>
                      </td>

                      <td>
                        <strong className={`quantity-cell ${className}`}>
                          {className === "out" ? "-" : "+"}
                          {formatQuantity(quantity)}
                        </strong>
                      </td>

                      <td className="stock-number">
                        {previousStock == null
                          ? "-"
                          : formatQuantity(previousStock)}
                      </td>

                      <td className="stock-number emphasis">
                        {nextStock == null
                          ? "-"
                          : formatQuantity(nextStock)}
                      </td>

                      <td>
                        <div className="source-cell">
                          <strong>{source}</strong>
                          {documentNo && documentNo !== source ? (
                            <small>{documentNo}</small>
                          ) : null}
                        </div>
                      </td>

                      <td>
                        <div className="description-cell">
                          <strong>
                            {movement?.customerName ||
                              movement?.supplierName ||
                              movement?.description ||
                              "-"}
                          </strong>
                          {movement?.description &&
                          (movement?.customerName ||
                            movement?.supplierName) ? (
                            <small>{movement.description}</small>
                          ) : null}
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            type="button"
                            className="movement-detail-button"
                            onClick={() => setSelectedMovement(movement)}
                            title="Hareket detayını görüntüle"
                          >
                            <MdVisibility />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMovement(movement)}
                            title="Stok hareketini sil"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "32px",
                              height: "30px",
                              padding: "0 8px",
                              border: "1px solid #6a3038",
                              borderRadius: "6px",
                              background: "#3a2328",
                              color: "#e97786",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMovement && (
        <div
          className="movement-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMovement(null);
            }
          }}
        >
          <div className="movement-modal">
            <div className="movement-modal-header">
              <div>
                <span>STOK HAREKETİ</span>
                <h2>
                  {selectedMovement.productName ||
                    selectedMovement.product ||
                    "Ürün"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMovement(null)}
                aria-label="Kapat"
              >
                <MdClose />
              </button>
            </div>

            <div className="movement-modal-body">
              <div className="movement-detail-grid">
                <div>
                  <span>HAREKET TÜRÜ</span>
                  <strong>
                    {normalizeMovementType(selectedMovement)}
                  </strong>
                </div>

                <div>
                  <span>MİKTAR</span>
                  <strong>
                    {formatQuantity(
                      Math.abs(
                        num(
                          selectedMovement.quantity ??
                            selectedMovement.movement ??
                            selectedMovement.amount
                        )
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <span>ÖNCEKİ STOK</span>
                  <strong>
                    {selectedMovement.previousStock ??
                      selectedMovement.beforeStock ??
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>SONRAKİ STOK</span>
                  <strong>
                    {selectedMovement.nextStock ??
                      selectedMovement.afterStock ??
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>TARİH</span>
                  <strong>
                    {formatDate(
                      selectedMovement.date ||
                        selectedMovement.createdAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>KAYNAK</span>
                  <strong>
                    {selectedMovement.source || "-"}
                  </strong>
                </div>

                <div>
                  <span>BELGE NO</span>
                  <strong>
                    {selectedMovement.sourceDocument ||
                      selectedMovement.documentNo ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>KULLANICI</span>
                  <strong>
                    {selectedMovement.user || "Sistem"}
                  </strong>
                </div>
              </div>

              <div className="movement-detail-description">
                <span>AÇIKLAMA</span>
                <p>
                  {selectedMovement.description ||
                    "Açıklama bulunmuyor."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
