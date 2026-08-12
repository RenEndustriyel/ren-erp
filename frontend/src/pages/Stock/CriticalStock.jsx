import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdArrowForward,
  MdInventory2,
  MdRefresh,
  MdSearch,
  MdWarning,
} from "react-icons/md";
import { supabase } from "../../lib/supabase";
import "./CriticalStock.css";

const number = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  });

export default function CriticalStock() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("critical");

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: supabaseError } =
        await supabase
          .from("products")
          .select(
            [
              "id",
              "product_code",
              "barcode",
              "name",
              "brand",
              "unit",
              "purchase_price",
              "sale_price",
              "stock_quantity",
              "critical_stock",
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("stock_quantity", {
            ascending: true,
          });

      if (supabaseError) {
        throw supabaseError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error(
        "Kritik stoklar yüklenemedi:",
        err
      );

      setError(
        err?.message ||
          "Kritik stoklar yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const rows = useMemo(() => {
    return products
      .map((product) => {
        const stock = Number(
          product.stock_quantity ?? 0
        );

        const criticalStock = Number(
          product.critical_stock ?? 0
        );

        let status = "normal";

        if (stock <= 0) {
          status = "out";
        } else if (
          criticalStock > 0 &&
          stock <= criticalStock
        ) {
          status = "critical";
        }

        const deficit =
          criticalStock > stock
            ? criticalStock - stock
            : 0;

        const estimatedNeed =
          criticalStock > 0
            ? Math.max(
                criticalStock * 2 -
                  stock,
                0
              )
            : 0;

        return {
          ...product,
          stock,
          criticalStock,
          deficit,
          estimatedNeed,
          status,
        };
      })
      .filter((product) => {
        if (filter === "out") {
          return product.status === "out";
        }

        if (filter === "critical") {
          return (
            product.status === "critical" ||
            product.status === "out"
          );
        }

        return true;
      })
      .filter((product) => {
        const query = search
          .trim()
          .toLocaleLowerCase("tr-TR");

        if (!query) return true;

        return (
          String(product.name || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(product.brand || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(product.product_code || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(product.barcode || "")
            .toLocaleLowerCase("tr-TR")
            .includes(query)
        );
      })
      .sort(
        (a, b) => {
          if (a.status === "out" && b.status !== "out") {
            return -1;
          }

          if (a.status !== "out" && b.status === "out") {
            return 1;
          }

          return a.stock - b.stock;
        }
      );
  }, [products, search, filter]);

  const stats = useMemo(() => {
    const all = products.map((product) => {
      const stock = Number(
        product.stock_quantity ?? 0
      );

      const criticalStock = Number(
        product.critical_stock ?? 0
      );

      return {
        stock,
        criticalStock,
        out: stock <= 0,
        critical:
          stock > 0 &&
          criticalStock > 0 &&
          stock <= criticalStock,
      };
    });

    return {
      totalProducts: products.length,
      criticalCount: all.filter(
        (item) => item.critical
      ).length,
      outCount: all.filter(
        (item) => item.out
      ).length,
      criticalQuantity: all
        .filter((item) => item.critical || item.out)
        .reduce(
          (sum, item) => sum + item.stock,
          0
        ),
    };
  }, [products]);

  return (
    <div className="critical-stock-page">

      <div className="critical-stock-header">

        <div>
          <div className="critical-stock-eyebrow">
            REN ERP • STOK UYARILARI
          </div>

          <h1>
            Kritik Stoklar
          </h1>

          <p>
            Stok seviyesi kritik veya sıfır olan ürünleri
            hızlıca tespit edin.
          </p>
        </div>

        <div className="critical-stock-actions">

          <button
            type="button"
            className="critical-stock-secondary"
            onClick={loadProducts}
            disabled={loading}
          >
            <MdRefresh />
            Yenile
          </button>

          <button
            type="button"
            className="critical-stock-primary"
            onClick={() =>
              navigate("/stock/count")
            }
          >
            <MdInventory2 />
            Stok Sayımı
          </button>

        </div>

      </div>

      <div className="critical-stock-summary">

        <div>
          <span>KRİTİK</span>
          <strong>{stats.criticalCount}</strong>
          <small>Kritik seviyedeki ürün</small>
        </div>

        <div className="danger">
          <span>STOK YOK</span>
          <strong>{stats.outCount}</strong>
          <small>Mevcut stok 0</small>
        </div>

        <div>
          <span>KRİTİK TOPLAM</span>
          <strong>
            {number(stats.criticalQuantity)}
          </strong>
          <small>Kalan toplam miktar</small>
        </div>

        <div>
          <span>AKTİF ÜRÜN</span>
          <strong>
            {stats.totalProducts}
          </strong>
          <small>Ürün kartı</small>
        </div>

      </div>

      {error && (
        <div className="critical-stock-error">
          <MdWarning />
          {error}
        </div>
      )}

      <div className="critical-stock-panel">

        <div className="critical-stock-toolbar">

          <div className="critical-stock-search">
            <MdSearch />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Ürün, marka, kod veya barkod ara..."
            />
          </div>

          <div className="critical-stock-filters">

            <button
              type="button"
              className={
                filter === "critical"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("critical")
              }
            >
              Kritikler
            </button>

            <button
              type="button"
              className={
                filter === "out"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("out")
              }
            >
              Stok Yok
            </button>

            <button
              type="button"
              className={
                filter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("all")
              }
            >
              Tümü
            </button>

          </div>

        </div>

        {loading ? (
          <div className="critical-stock-empty">
            <MdInventory2 />
            <strong>
              Stoklar kontrol ediliyor...
            </strong>
          </div>
        ) : rows.length === 0 ? (
          <div className="critical-stock-empty">
            <MdWarning />
            <strong>
              Kritik stok bulunmuyor.
            </strong>
            <span>
              Şu anda kritik veya stokta olmayan ürün yok.
            </span>
          </div>
        ) : (
          <div className="critical-stock-table-wrap">

            <table className="critical-stock-table">

              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Mevcut</th>
                  <th>Kritik Seviye</th>
                  <th>Eksik</th>
                  <th>Tahmini Alım</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {rows.map((product) => (
                  <tr key={product.id}>

                    <td>
                      <div className="critical-product">

                        <div className="critical-product-icon">
                          <MdInventory2 />
                        </div>

                        <div>
                          <strong>
                            {product.name ||
                              "İsimsiz Ürün"}
                          </strong>

                          <small>
                            {product.brand ||
                              product.product_code ||
                              product.barcode ||
                              "-"}
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <strong>
                        {number(product.stock)}
                      </strong>
                      <small>
                        {product.unit || "Adet"}
                      </small>
                    </td>

                    <td>
                      {product.criticalStock > 0
                        ? number(
                            product.criticalStock
                          )
                        : "-"}
                    </td>

                    <td>
                      {product.deficit > 0 ? (
                        <span className="critical-deficit">
                          -{number(product.deficit)}
                        </span>
                      ) : (
                        <span className="critical-zero">
                          -
                        </span>
                      )}
                    </td>

                    <td>
                      <strong>
                        {product.estimatedNeed > 0
                          ? number(
                              product.estimatedNeed
                            )
                          : "-"}
                      </strong>
                    </td>

                    <td>
                      {product.status === "out" ? (
                        <span className="critical-badge out">
                          Stok Yok
                        </span>
                      ) : (
                        <span className="critical-badge">
                          Kritik
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="critical-row-button"
                        onClick={() =>
                          navigate(
                            `/products/${product.id}`
                          )
                        }
                      >
                        Ürünü Aç
                        <MdArrowForward />
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      <div className="critical-stock-footer">

        <button
          type="button"
          className="critical-stock-back"
          onClick={() =>
            navigate("/stock")
          }
        >
          <MdArrowBack />
          Stok Listesine Dön
        </button>

        <span>
          {rows.length} ürün gösteriliyor
        </span>

      </div>

    </div>
  );
}
