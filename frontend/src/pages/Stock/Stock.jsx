import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdd,
  MdArrowBack,
  MdInventory2,
  MdRefresh,
  MdSearch,
  MdWarning,
} from "react-icons/md";
import { supabase } from "../../lib/supabase";
import "./Stock.css";

const money = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Stock() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: supabaseError } = await supabase
        .from("products")
        .select(
          [
            "id",
            "name",
            "purchase_price",
            "purchase_price_type",
            "sale_price",
            "sale_price_type",
            "vat_rate",
            "stock_quantity",
            "critical_stock",
            "is_active",
          ].join(", ")
        )
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error("Stok listesi yüklenemedi:", err);
      setError(
        err?.message ||
          "Stok listesi yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const normalizedProducts = useMemo(
    () =>
      products.map((product) => {
        const stock = Number(
          product.stock_quantity ?? 0
        );

        const criticalStock = Number(
          product.critical_stock ?? 0
        );

        const purchasePrice = Number(
          product.purchase_price ?? 0
        );

        const salePrice = Number(
          product.sale_price ?? 0
        );

        let status = "normal";

        if (stock <= 0) {
          status = "out";
        } else if (criticalStock > 0 && stock <= criticalStock) {
          status = "critical";
        }

        return {
          ...product,
          stock,
          criticalStock,
          purchasePrice,
          salePrice,
          status,
        };
      }),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return normalizedProducts.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.name || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(product.id || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "normal" && product.status === "normal") ||
        (filter === "critical" && product.status === "critical") ||
        (filter === "out" && product.status === "out");

      return matchesSearch && matchesFilter;
    });
  }, [normalizedProducts, search, filter]);

  const totals = useMemo(() => {
    return normalizedProducts.reduce(
      (acc, product) => {
        acc.productCount += 1;
        acc.stockQuantity += product.stock;
        acc.stockValue += product.stock * product.purchasePrice;

        if (product.status === "critical") {
          acc.criticalCount += 1;
        }

        if (product.status === "out") {
          acc.outCount += 1;
        }

        return acc;
      },
      {
        productCount: 0,
        stockQuantity: 0,
        stockValue: 0,
        criticalCount: 0,
        outCount: 0,
      }
    );
  }, [normalizedProducts]);

  return (
    <div className="stock-page">
      <div className="stock-header">
        <div>
          <div className="stock-eyebrow">
            REN ERP • STOK
          </div>

          <h1>Stok Listesi</h1>

          <p>
            Ürünlerin mevcut stok durumunu ve stok değerini
            tek ekrandan takip edin.
          </p>
        </div>

        <div className="stock-header-actions">
          <button
            type="button"
            className="stock-secondary-button"
            onClick={() => loadProducts()}
            disabled={loading}
          >
            <MdRefresh />
            Yenile
          </button>

          <button
            type="button"
            className="stock-primary-button"
            onClick={() => navigate("/products/new")}
          >
            <MdAdd />
            Yeni Ürün
          </button>
        </div>
      </div>

      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <span>TOPLAM ÜRÜN</span>
          <strong>{totals.productCount}</strong>
          <small>Aktif ürün</small>
        </div>

        <div className="stock-summary-card">
          <span>TOPLAM ADET</span>
          <strong>{totals.stockQuantity}</strong>
          <small>Depodaki miktar</small>
        </div>

        <div className="stock-summary-card">
          <span>STOK DEĞERİ</span>
          <strong>₺ {money(totals.stockValue)}</strong>
          <small>Alış maliyetine göre</small>
        </div>

        <div className="stock-summary-card warning">
          <span>KRİTİK STOK</span>
          <strong>{totals.criticalCount}</strong>
          <small>{totals.outCount} ürün stokta yok</small>
        </div>
      </div>

      <div className="stock-panel">
        <div className="stock-toolbar">
          <div className="stock-search">
            <MdSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ürün ara..."
            />
          </div>

          <div className="stock-filters">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              Tümü
            </button>

            <button
              type="button"
              className={filter === "normal" ? "active" : ""}
              onClick={() => setFilter("normal")}
            >
              Normal
            </button>

            <button
              type="button"
              className={filter === "critical" ? "active" : ""}
              onClick={() => setFilter("critical")}
            >
              Kritik
            </button>

            <button
              type="button"
              className={filter === "out" ? "active" : ""}
              onClick={() => setFilter("out")}
            >
              Stok Yok
            </button>
          </div>
        </div>

        {error ? (
          <div className="stock-error">
            <MdWarning />
            <div>
              <strong>Stok verileri alınamadı</strong>
              <span>{error}</span>
            </div>
          </div>
        ) : loading ? (
          <div className="stock-empty">
            <MdInventory2 />
            <strong>Stoklar yükleniyor...</strong>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="stock-empty">
            <MdInventory2 />
            <strong>Gösterilecek ürün bulunamadı.</strong>
            <span>Arama veya filtreyi değiştirin.</span>
          </div>
        ) : (
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Alış</th>
                  <th>Satış</th>
                  <th>Mevcut</th>
                  <th>Kritik Seviye</th>
                  <th>Durum</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="stock-product">
                        <div className="stock-product-icon">
                          <MdInventory2 />
                        </div>

                        <div>
                          <strong>
                            {product.name || "İsimsiz Ürün"}
                          </strong>

                          <small>
                            ID: {product.id}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      ₺ {money(product.purchasePrice)}
                    </td>

                    <td>
                      ₺ {money(product.salePrice)}
                    </td>

                    <td>
                      <strong>{product.stock}</strong>
                    </td>

                    <td>
                      {product.criticalStock || "-"}
                    </td>

                    <td>
                      {product.status === "out" ? (
                        <span className="stock-status out">
                          Stok Yok
                        </span>
                      ) : product.status === "critical" ? (
                        <span className="stock-status critical">
                          Kritik
                        </span>
                      ) : (
                        <span className="stock-status normal">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stock-footer">
        <button
          type="button"
          className="stock-back-button"
          onClick={() => navigate("/products")}
        >
          <MdArrowBack />
          Ürünlere Dön
        </button>

        <span>
          {filteredProducts.length} ürün gösteriliyor
        </span>
      </div>
    </div>
  );
}
