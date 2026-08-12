import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdArrowBack,
  MdCheckCircle,
  MdInventory2,
  MdRefresh,
  MdSearch,
  MdWarning,
} from "react-icons/md";
import { supabase } from "../../lib/supabase";
import "./StockCount.css";

const number = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  });

export default function StockCount() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

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
              "unit",
              "stock_quantity",
              "critical_stock",
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("name");

      if (supabaseError) {
        throw supabaseError;
      }

      setProducts(data || []);

      setCounts((current) => {
        const next = { ...current };

        for (const product of data || []) {
          if (
            next[product.id] === undefined
          ) {
            next[product.id] = String(
              product.stock_quantity ?? 0
            );
          }
        }

        return next;
      });
    } catch (err) {
      console.error(
        "Stok sayımı yüklenemedi:",
        err
      );

      setError(
        err?.message ||
          "Stok sayımı yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const rows = useMemo(
    () =>
      products.map((product) => {
        const systemStock = Number(
          product.stock_quantity ?? 0
        );

        const countedRaw =
          counts[product.id];

        const counted =
          countedRaw === undefined ||
          countedRaw === ""
            ? systemStock
            : Number(countedRaw);

        const difference =
          counted - systemStock;

        const criticalStock = Number(
          product.critical_stock ?? 0
        );

        let status = "same";

        if (difference > 0) {
          status = "plus";
        } else if (difference < 0) {
          status = "minus";
        }

        return {
          ...product,
          systemStock,
          counted,
          difference,
          criticalStock,
          status,
        };
      }),
    [products, counts]
  );

  const filteredRows = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        String(row.name || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(row.product_code || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query) ||
        String(row.barcode || "")
          .toLocaleLowerCase("tr-TR")
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "changed" &&
          row.difference !== 0) ||
        (filter === "same" &&
          row.difference === 0) ||
        (filter === "plus" &&
          row.difference > 0) ||
        (filter === "minus" &&
          row.difference < 0);

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [rows, search, filter]);

  const changedRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          Number.isFinite(row.counted) &&
          row.difference !== 0
      ),
    [rows]
  );

  const totalDifference = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum + row.difference,
        0
      ),
    [rows]
  );

  const updateCount = (
    productId,
    value
  ) => {
    setCounts((current) => ({
      ...current,
      [productId]: value,
    }));
    setSuccess("");
  };

  const resetCounts = () => {
    const next = {};

    for (const product of products) {
      next[product.id] = String(
        product.stock_quantity ?? 0
      );
    }

    setCounts(next);
    setSuccess("");
    setError("");
  };

  const saveOne = async (row) => {
    if (
      !Number.isFinite(row.counted) ||
      row.counted < 0
    ) {
      setError(
        "Geçerli bir sayım miktarı girin."
      );
      return;
    }

    if (row.difference === 0) {
      setSuccess(
        `${row.name} için fark bulunmuyor.`
      );
      return;
    }

    setSavingId(row.id);
    setError("");
    setSuccess("");

    try {
      const now =
        new Date().toISOString();

      const { error: updateError } =
        await supabase
          .from("products")
          .update({
            stock_quantity: row.counted,
            updated_at: now,
          })
          .eq("id", row.id);

      if (updateError) {
        throw updateError;
      }

      const { error: movementError } =
        await supabase
          .from("stock_movements")
          .insert({
            product_id: row.id,
            movement_type: "count",
            quantity: Math.abs(
              row.difference
            ),
            unit_cost: 0,
            reference_type: "stock_count",
            note:
              row.difference > 0
                ? `Stok sayımı düzeltmesi: +${number(
                    row.difference
                  )}`
                : `Stok sayımı düzeltmesi: ${number(
                    row.difference
                  )}`,
          });

      if (movementError) {
        // Hareket kaydı başarısızsa stok değerini
        // eski haline döndürmeye çalış.
        await supabase
          .from("products")
          .update({
            stock_quantity:
              row.systemStock,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", row.id);

        throw movementError;
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === row.id
            ? {
                ...product,
                stock_quantity:
                  row.counted,
              }
            : product
        )
      );

      setCounts((current) => ({
        ...current,
        [row.id]: String(row.counted),
      }));

      setSuccess(
        `${row.name} sayımı kaydedildi. Yeni stok: ${number(
          row.counted
        )}.`
      );
    } catch (err) {
      console.error(
        "Stok sayımı kaydedilemedi:",
        err
      );

      setError(
        err?.message ||
          "Stok sayımı kaydedilemedi."
      );
    } finally {
      setSavingId(null);
    }
  };

  const saveAll = async () => {
    const changed = rows.filter(
      (row) =>
        Number.isFinite(row.counted) &&
        row.counted >= 0 &&
        row.difference !== 0
    );

    if (changed.length === 0) {
      setSuccess(
        "Kaydedilecek bir stok farkı bulunmuyor."
      );
      return;
    }

    setSavingAll(true);
    setError("");
    setSuccess("");

    try {
      for (const row of changed) {
        const now =
          new Date().toISOString();

        const { error: updateError } =
          await supabase
            .from("products")
            .update({
              stock_quantity:
                row.counted,
              updated_at: now,
            })
            .eq("id", row.id);

        if (updateError) {
          throw updateError;
        }

        const { error: movementError } =
          await supabase
            .from("stock_movements")
            .insert({
              product_id: row.id,
              movement_type: "count",
              quantity: Math.abs(
                row.difference
              ),
              unit_cost: 0,
              reference_type:
                "stock_count",
              note:
                row.difference > 0
                  ? `Toplu stok sayımı: +${number(
                      row.difference
                    )}`
                  : `Toplu stok sayımı: ${number(
                      row.difference
                    )}`,
            });

        if (movementError) {
          throw movementError;
        }
      }

      setProducts((current) =>
        current.map((product) => {
          const row = rows.find(
            (item) =>
              item.id === product.id
          );

          return row
            ? {
                ...product,
                stock_quantity:
                  row.counted,
              }
            : product;
        })
      );

      setSuccess(
        `${changed.length} ürünün sayımı kaydedildi.`
      );
    } catch (err) {
      console.error(
        "Toplu stok sayımı kaydedilemedi:",
        err
      );

      setError(
        err?.message ||
          "Toplu stok sayımı sırasında hata oluştu."
      );
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="stock-count-page">

      <div className="stock-count-header">

        <div>
          <div className="stock-count-eyebrow">
            REN ERP • STOK
          </div>

          <h1>
            Stok Sayımı
          </h1>

          <p>
            Sistem stoğu ile fiziksel sayımı
            karşılaştırın ve farkları kaydedin.
          </p>
        </div>

        <div className="stock-count-actions">

          <button
            type="button"
            className="stock-count-secondary"
            onClick={resetCounts}
            disabled={loading || savingAll}
          >
            Sıfırla
          </button>

          <button
            type="button"
            className="stock-count-secondary"
            onClick={loadProducts}
            disabled={loading || savingAll}
          >
            <MdRefresh />
            Yenile
          </button>

          <button
            type="button"
            className="stock-count-primary"
            onClick={saveAll}
            disabled={
              loading ||
              savingAll ||
              changedRows.length === 0
            }
          >
            {savingAll
              ? "Kaydediliyor..."
              : `Farkları Kaydet (${changedRows.length})`}
          </button>

        </div>

      </div>

      <div className="stock-count-summary">

        <div>
          <span>ÜRÜN</span>
          <strong>{rows.length}</strong>
          <small>Sayılacak ürün</small>
        </div>

        <div className="changed">
          <span>FARKLI</span>
          <strong>
            {changedRows.length}
          </strong>
          <small>Kontrol gereken</small>
        </div>

        <div className="plus">
          <span>FAZLA</span>
          <strong>
            {number(
              rows
                .filter(
                  (row) =>
                    row.difference > 0
                )
                .reduce(
                  (sum, row) =>
                    sum + row.difference,
                  0
                )
            )}
          </strong>
          <small>Ekstra stok</small>
        </div>

        <div className="minus">
          <span>EKSİK</span>
          <strong>
            {number(
              Math.abs(
                rows
                  .filter(
                    (row) =>
                      row.difference < 0
                  )
                  .reduce(
                    (sum, row) =>
                      sum + row.difference,
                    0
                  )
              )
            )}
          </strong>
          <small>Eksik stok</small>
        </div>

      </div>

      {success && (
        <div className="stock-count-success">
          <MdCheckCircle />
          {success}
        </div>
      )}

      {error && (
        <div className="stock-count-error">
          <MdWarning />
          {error}
        </div>
      )}

      <div className="stock-count-panel">

        <div className="stock-count-toolbar">

          <div className="stock-count-search">
            <MdSearch />
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Ürün, kod veya barkod ara..."
            />
          </div>

          <div className="stock-count-filters">

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

            <button
              type="button"
              className={
                filter === "changed"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("changed")
              }
            >
              Farklı
            </button>

            <button
              type="button"
              className={
                filter === "plus"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("plus")
              }
            >
              Fazla
            </button>

            <button
              type="button"
              className={
                filter === "minus"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("minus")
              }
            >
              Eksik
            </button>

            <button
              type="button"
              className={
                filter === "same"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("same")
              }
            >
              Aynı
            </button>

          </div>

        </div>

        {loading ? (
          <div className="stock-count-empty">
            <MdInventory2 />
            <strong>
              Ürünler yükleniyor...
            </strong>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="stock-count-empty">
            <MdInventory2 />
            <strong>
              Gösterilecek ürün bulunamadı.
            </strong>
          </div>
        ) : (
          <div className="stock-count-table-wrap">

            <table className="stock-count-table">

              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Sistem</th>
                  <th>Fiziki Sayım</th>
                  <th>Fark</th>
                  <th>Birim</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>

                {filteredRows.map(
                  (row) => (
                    <tr
                      key={row.id}
                      className={
                        row.difference !== 0
                          ? "has-difference"
                          : ""
                      }
                    >

                      <td>
                        <div className="stock-count-product">

                          <div className="stock-count-product-icon">
                            <MdInventory2 />
                          </div>

                          <div>
                            <strong>
                              {row.name}
                            </strong>

                            <small>
                              {row.product_code ||
                                row.barcode ||
                                "-"}
                            </small>
                          </div>

                        </div>
                      </td>

                      <td>
                        <strong>
                          {number(
                            row.systemStock
                          )}
                        </strong>
                      </td>

                      <td>
                        <input
                          className="stock-count-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            counts[
                              row.id
                            ] ?? ""
                          }
                          onChange={(event) =>
                            updateCount(
                              row.id,
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        {row.difference === 0 ? (
                          <span className="count-difference same">
                            0
                          </span>
                        ) : row.difference > 0 ? (
                          <span className="count-difference plus">
                            +{number(
                              row.difference
                            )}
                          </span>
                        ) : (
                          <span className="count-difference minus">
                            {number(
                              row.difference
                            )}
                          </span>
                        )}
                      </td>

                      <td>
                        {row.unit || "Adet"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="stock-count-save-one"
                          onClick={() =>
                            saveOne(row)
                          }
                          disabled={
                            savingAll ||
                            savingId === row.id ||
                            row.difference === 0
                          }
                        >
                          {savingId === row.id
                            ? "..."
                            : "Kaydet"}
                        </button>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      <div className="stock-count-footer">

        <button
          type="button"
          className="stock-count-back"
          onClick={() =>
            navigate("/stock")
          }
        >
          <MdArrowBack />
          Stok Listesine Dön
        </button>

        <span>
          Toplam fark:{" "}
          <strong>
            {totalDifference > 0
              ? `+${number(totalDifference)}`
              : number(totalDifference)}
          </strong>
        </span>

      </div>

    </div>
  );
}
