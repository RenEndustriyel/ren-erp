import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdd,
  MdArrowBack,
  MdArrowDownward,
  MdArrowUpward,
  MdInventory2,
  MdRefresh,
  MdSearch,
  MdSwapVert,
  MdWarning,
} from "react-icons/md";
import { supabase } from "../../lib/supabase";
import "./StockMovements.css";

const money = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const number = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  });

const movementMeta = {
  entry: {
    label: "Giriş",
    icon: MdArrowDownward,
    className: "entry",
  },
  in: {
    label: "Giriş",
    icon: MdArrowDownward,
    className: "entry",
  },
  purchase: {
    label: "Alış",
    icon: MdArrowDownward,
    className: "entry",
  },
  sale: {
    label: "Satış",
    icon: MdArrowUpward,
    className: "exit",
  },
  exit: {
    label: "Çıkış",
    icon: MdArrowUpward,
    className: "exit",
  },
  return: {
    label: "İade",
    icon: MdArrowDownward,
    className: "return",
  },
  count: {
    label: "Sayım",
    icon: MdSwapVert,
    className: "count",
  },
  adjustment: {
    label: "Düzeltme",
    icon: MdSwapVert,
    className: "count",
  },
};

function getMovementMeta(type) {
  const key = String(type || "adjustment")
    .toLowerCase()
    .trim();

  return (
    movementMeta[key] || {
      label: type || "Hareket",
      icon: MdSwapVert,
      className: "count",
    }
  );
}

export default function StockMovements() {
  const navigate = useNavigate();

  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    movementType: "entry",
    quantity: "",
    unitCost: "",
    note: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        movementResponse,
        productResponse,
      ] = await Promise.all([
        supabase
          .from("stock_movements")
          .select(
            [
              "id",
              "product_id",
              "movement_type",
              "quantity",
              "unit_cost",
              "reference_type",
              "reference_id",
              "note",
              "created_at",
            ].join(", ")
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("products")
          .select(
            [
              "id",
              "product_code",
              "barcode",
              "name",
              "unit",
              "purchase_price",
              "sale_price",
              "stock_quantity",
              "critical_stock",
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("name"),
      ]);

      if (movementResponse.error) {
        throw movementResponse.error;
      }

      if (productResponse.error) {
        throw productResponse.error;
      }

      setMovements(movementResponse.data || []);
      setProducts(productResponse.data || []);
    } catch (err) {
      console.error(
        "Stok hareketleri yüklenemedi:",
        err
      );

      setError(
        err?.message ||
          "Stok hareketleri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const productMap = useMemo(() => {
    return new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );
  }, [products]);

  const normalizedMovements = useMemo(() => {
    return movements.map((movement) => {
      const product =
        productMap.get(
          movement.product_id
        );

      return {
        ...movement,
        product,
        quantity: Number(
          movement.quantity || 0
        ),
        unitCost: Number(
          movement.unit_cost || 0
        ),
      };
    });
  }, [movements, productMap]);

  const filteredMovements = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return normalizedMovements.filter(
      (movement) => {
        const meta = getMovementMeta(
          movement.movement_type
        );

        const matchesSearch =
          !query ||
          String(
            movement.product?.name || ""
          )
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(
            movement.product?.product_code || ""
          )
            .toLocaleLowerCase("tr-TR")
            .includes(query) ||
          String(
            movement.product?.barcode || ""
          )
            .toLocaleLowerCase("tr-TR")
            .includes(query);

        const matchesFilter =
          filter === "all" ||
          (filter === "entry" &&
            meta.className === "entry") ||
          (filter === "exit" &&
            meta.className === "exit") ||
          (filter === "return" &&
            meta.className === "return") ||
          (filter === "count" &&
            meta.className === "count");

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [
    normalizedMovements,
    search,
    filter,
  ]);

  const stats = useMemo(() => {
    return normalizedMovements.reduce(
      (acc, movement) => {
        const meta = getMovementMeta(
          movement.movement_type
        );

        if (meta.className === "entry") {
          acc.entries += movement.quantity;
        }

        if (meta.className === "exit") {
          acc.exits += movement.quantity;
        }

        if (meta.className === "return") {
          acc.returns += movement.quantity;
        }

        if (meta.className === "count") {
          acc.adjustments += movement.quantity;
        }

        return acc;
      },
      {
        entries: 0,
        exits: 0,
        returns: 0,
        adjustments: 0,
      }
    );
  }, [normalizedMovements]);

  const openNewMovement = () => {
    setForm({
      productId: "",
      movementType: "entry",
      quantity: "",
      unitCost: "",
      note: "",
    });

    setError("");
    setShowForm(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.productId) {
      setError("Ürün seçmelisiniz.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Geçerli bir miktar girin.");
      return;
    }

    const selectedProduct =
      productMap.get(form.productId);

    if (!selectedProduct) {
      setError("Seçilen ürün bulunamadı.");
      return;
    }

    const currentStock = Number(
      selectedProduct.stock_quantity || 0
    );

    const increases =
      form.movementType === "entry" ||
      form.movementType === "return";

    const decreases =
      form.movementType === "exit";

    let newStock = currentStock;

    if (increases) {
      newStock =
        currentStock + quantity;
    } else if (decreases) {
      newStock =
        currentStock - quantity;

      if (newStock < 0) {
        setError(
          "Stok miktarı eksiye düşemez."
        );
        return;
      }
    } else {
      newStock = quantity;
    }

    setSaving(true);
    setError("");

    try {
      const { error: updateError } =
        await supabase
          .from("products")
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedProduct.id);

      if (updateError) {
        throw updateError;
      }

      const {
        error: movementError,
      } = await supabase
        .from("stock_movements")
        .insert({
          product_id:
            selectedProduct.id,
          movement_type:
            form.movementType,
          quantity,
          unit_cost:
            Number(form.unitCost) || 0,
          note:
            form.note.trim() || null,
        });

      if (movementError) {
        // Hareket kaydı başarısız olursa stok güncellemesini
        // eski değerine döndürmeye çalış.
        await supabase
          .from("products")
          .update({
            stock_quantity: currentStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedProduct.id);

        throw movementError;
      }

      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error(
        "Stok hareketi kaydedilemedi:",
        err
      );

      setError(
        err?.message ||
          "Stok hareketi kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stock-movements-page">

      <div className="stock-movements-header">

        <div>
          <div className="stock-movements-eyebrow">
            REN ERP • STOK
          </div>

          <h1>
            Stok Hareketleri
          </h1>

          <p>
            Ürünlerin tüm stok giriş, çıkış,
            iade ve düzeltme hareketlerini takip edin.
          </p>
        </div>

        <div className="stock-movements-actions">

          <button
            type="button"
            className="stock-movement-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <MdRefresh />
            Yenile
          </button>

          <button
            type="button"
            className="stock-movement-primary"
            onClick={openNewMovement}
          >
            <MdAdd />
            Yeni Hareket
          </button>

        </div>

      </div>

      <div className="stock-movement-summary">

        <div>
          <span>GİRİŞ</span>
          <strong>{number(stats.entries)}</strong>
          <small>Toplam giriş</small>
        </div>

        <div>
          <span>ÇIKIŞ</span>
          <strong>{number(stats.exits)}</strong>
          <small>Toplam çıkış</small>
        </div>

        <div>
          <span>İADE</span>
          <strong>{number(stats.returns)}</strong>
          <small>Toplam iade</small>
        </div>

        <div>
          <span>DÜZELTME / SAYIM</span>
          <strong>
            {number(stats.adjustments)}
          </strong>
          <small>Diğer hareketler</small>
        </div>

      </div>

      {showForm && (
        <form
          className="stock-movement-form"
          onSubmit={handleSave}
        >
          <div className="stock-movement-form-head">
            <div>
              <span>STOK İŞLEMİ</span>
              <h2>Yeni Stok Hareketi</h2>
            </div>

            <button
              type="button"
              className="stock-form-close"
              onClick={() =>
                setShowForm(false)
              }
            >
              ×
            </button>
          </div>

          <div className="stock-movement-form-grid">

            <label>
              <span>Ürün</span>

              <select
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productId:
                      event.target.value,
                  }))
                }
                required
              >
                <option value="">
                  Ürün seçin
                </option>

                {products.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {" — mevcut: "}
                      {product.stock_quantity || 0}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>Hareket Türü</span>

              <select
                value={form.movementType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    movementType:
                      event.target.value,
                  }))
                }
              >
                <option value="entry">
                  Giriş
                </option>

                <option value="exit">
                  Çıkış
                </option>

                <option value="return">
                  İade
                </option>

                <option value="count">
                  Sayım / Düzeltme
                </option>
              </select>
            </label>

            <label>
              <span>Miktar</span>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quantity:
                      event.target.value,
                  }))
                }
                placeholder="0"
                required
              />
            </label>

            <label>
              <span>Birim Maliyet</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.unitCost}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unitCost:
                      event.target.value,
                  }))
                }
                placeholder="0,00"
              />
            </label>

            <label className="stock-form-full">
              <span>Açıklama</span>

              <input
                type="text"
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Örn. Depo sayımı düzeltmesi"
              />
            </label>

          </div>

          {error && (
            <div className="stock-movement-error">
              <MdWarning />
              {error}
            </div>
          )}

          <div className="stock-movement-form-actions">

            <button
              type="button"
              className="stock-movement-secondary"
              onClick={() =>
                setShowForm(false)
              }
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="stock-movement-primary"
              disabled={saving}
            >
              {saving
                ? "Kaydediliyor..."
                : "Hareketi Kaydet"}
            </button>

          </div>
        </form>
      )}

      {!showForm && error && (
        <div className="stock-movement-error standalone">
          <MdWarning />
          {error}
        </div>
      )}

      <div className="stock-movement-panel">

        <div className="stock-movement-toolbar">

          <div className="stock-movement-search">
            <MdSearch />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Ürün, kod veya barkod ara..."
            />
          </div>

          <div className="stock-movement-filters">

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
                filter === "entry"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("entry")
              }
            >
              Giriş
            </button>

            <button
              type="button"
              className={
                filter === "exit"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("exit")
              }
            >
              Çıkış
            </button>

            <button
              type="button"
              className={
                filter === "return"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("return")
              }
            >
              İade
            </button>

            <button
              type="button"
              className={
                filter === "count"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("count")
              }
            >
              Düzeltme
            </button>

          </div>

        </div>

        {loading ? (
          <div className="stock-movement-empty">
            <MdInventory2 />
            <strong>
              Stok hareketleri yükleniyor...
            </strong>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="stock-movement-empty">
            <MdInventory2 />
            <strong>
              Hareket bulunamadı.
            </strong>
            <span>
              Yeni stok hareketi ekleyerek başlayabilirsiniz.
            </span>
          </div>
        ) : (
          <div className="stock-movement-table-wrap">

            <table className="stock-movement-table">

              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Ürün</th>
                  <th>Hareket</th>
                  <th>Miktar</th>
                  <th>Birim Maliyet</th>
                  <th>Referans</th>
                  <th>Açıklama</th>
                </tr>
              </thead>

              <tbody>

                {filteredMovements.map(
                  (movement) => {

                    const meta =
                      getMovementMeta(
                        movement.movement_type
                      );

                    const Icon =
                      meta.icon;

                    return (
                      <tr
                        key={movement.id}
                      >

                        <td>
                          <strong>
                            {new Date(
                              movement.created_at
                            ).toLocaleDateString(
                              "tr-TR"
                            )}
                          </strong>

                          <small>
                            {new Date(
                              movement.created_at
                            ).toLocaleTimeString(
                              "tr-TR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </small>
                        </td>

                        <td>
                          <div className="stock-movement-product">

                            <div className="stock-movement-product-icon">
                              <MdInventory2 />
                            </div>

                            <div>
                              <strong>
                                {movement.product?.name ||
                                  "Ürün bulunamadı"}
                              </strong>

                              <small>
                                {movement.product?.product_code ||
                                  movement.product?.barcode ||
                                  "-"}
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span
                            className={`movement-badge ${meta.className}`}
                          >
                            <Icon />
                            {meta.label}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {number(
                              movement.quantity
                            )}
                          </strong>

                          <small>
                            {movement.product?.unit ||
                              "Adet"}
                          </small>
                        </td>

                        <td>
                          ₺{" "}
                          {money(
                            movement.unitCost
                          )}
                        </td>

                        <td>
                          {movement.reference_type ? (
                            <span className="movement-reference">
                              {movement.reference_type}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td>
                          {movement.note || "-"}
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      <div className="stock-movement-footer">

        <button
          type="button"
          className="stock-movement-back"
          onClick={() =>
            navigate("/stock")
          }
        >
          <MdArrowBack />
          Stok Listesine Dön
        </button>

        <span>
          {filteredMovements.length} hareket
          gösteriliyor
        </span>

      </div>

    </div>
  );
}
