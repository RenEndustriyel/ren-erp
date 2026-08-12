import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdd,
  MdArrowBack,
  MdDelete,
  MdPointOfSale,
  MdSearch,
  MdSave,
} from "react-icons/md";
import { supabase } from "../../lib/supabase";
import "./QuickSale.css";

const money = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const saleNo = () => {
  const d = new Date();
  return `HIZ-${d.getFullYear()}${String(
    d.getMonth() + 1
  ).padStart(2, "0")}${String(d.getDate()).padStart(
    2,
    "0"
  )}-${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes()
  ).padStart(2, "0")}${String(d.getSeconds()).padStart(
    2,
    "0"
  )}`;
};

export default function QuickSale() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);

  const [discountType, setDiscountType] =
    useState("amount");
  const [globalDiscount, setGlobalDiscount] =
    useState(0);
  const [globalVat, setGlobalVat] =
    useState(20);
  const [paymentType, setPaymentType] =
    useState("Nakit");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } =
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
              "sale_price",
              "vat_rate",
              "stock_quantity",
              "is_active",
            ].join(", ")
          )
          .eq("is_active", true)
          .order("name");

      if (queryError) throw queryError;
      setProducts(data || []);
    } catch (err) {
      console.error("Hızlı satış ürünleri yüklenemedi:", err);
      setError(
        err?.message ||
          "Ürünler yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!query) return products.slice(0, 16);

    return products
      .filter((product) =>
        [
          product.name,
          product.brand,
          product.product_code,
          product.barcode,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLocaleLowerCase("tr-TR")
              .includes(query)
          )
      )
      .slice(0, 16);
  }, [products, search]);

  const addProduct = (product) => {
    setItems((current) => {
      const existing = current.find(
        (item) =>
          item.productId === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit || "Adet",
          stock: Number(
            product.stock_quantity || 0
          ),
          quantity: 1,
          unitPrice: Number(
            product.sale_price || 0
          ),
          vatRate: Number(
            product.vat_rate ?? globalVat ?? 20
          ),
        },
      ];
    });

    setSearch("");
    setError("");
    setSuccess("");
  };

  const updateItem = (
    productId,
    field,
    value
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              [field]:
                field === "quantity" ||
                field === "unitPrice" ||
                field === "vatRate"
                  ? Number(value) || 0
                  : value,
            }
          : item
      )
    );
  };

  const removeItem = (productId) => {
    setItems((current) =>
      current.filter(
        (item) =>
          item.productId !== productId
      )
    );
  };

  const lineGross = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) *
            Number(item.unitPrice || 0),
        0
      ),
    [items]
  );

  const discountAmount = useMemo(() => {
    const value = Number(globalDiscount || 0);

    if (discountType === "percent") {
      return Math.min(
        lineGross,
        (lineGross * value) / 100
      );
    }

    return Math.min(
      lineGross,
      Math.max(value, 0)
    );
  }, [lineGross, globalDiscount, discountType]);

  const netSubtotal = Math.max(
    lineGross - discountAmount,
    0
  );

  const weightedVatBase = useMemo(() => {
    if (!netSubtotal || !items.length) {
      return 0;
    }

    const grossByItem = items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );

    return grossByItem > 0
      ? netSubtotal / grossByItem
      : 1;
  }, [items, netSubtotal]);

  const vatAmount = useMemo(() => {
    if (!items.length) {
      return (netSubtotal * Number(globalVat || 0)) / 100;
    }

    const result = items.reduce(
      (sum, item) => {
        const gross =
          Number(item.quantity || 0) *
          Number(item.unitPrice || 0);

        const itemNet =
          gross * weightedVatBase;

        return (
          sum +
          (itemNet *
            Number(
              item.vatRate ??
                globalVat ??
                0
            )) /
            100
        );
      },
      0
    );

    return result;
  }, [items, weightedVatBase, netSubtotal, globalVat]);

  const grandTotal =
    netSubtotal + vatAmount;

  const changeGlobalVat = (value) => {
    const next = Number(value) || 0;
    setGlobalVat(next);

    setItems((current) =>
      current.map((item) => ({
        ...item,
        vatRate: next,
      }))
    );
  };

  const completeSale = async () => {
    if (!items.length) {
      setError(
        "Hızlı satış için en az bir ürün eklemelisiniz."
      );
      return;
    }

    for (const item of items) {
      if (
        Number(item.quantity) <= 0
      ) {
        setError(
          `${item.name} için geçerli miktar girin.`
        );
        return;
      }

      if (
        Number(item.quantity) >
        Number(item.stock)
      ) {
        setError(
          `${item.name} için yeterli stok yok. Mevcut: ${item.stock}`
        );
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const saleId =
      crypto.randomUUID();
    const now = new Date().toISOString();
    const number = saleNo();

    try {
      const { error: saleError } =
        await supabase.from("sales").insert({
          id: saleId,
          sale_no: number,
          customer_id: null,
          customer_name:
            "Perakende Müşteri",
          payment_type: paymentType,
          sale_status: "Tamamlandı",
          subtotal: netSubtotal,
          discount_amount: discountAmount,
          vat_amount: vatAmount,
          total: grandTotal,
          received_amount: grandTotal,
          remaining_amount: 0,
          due_date: null,
          note: "Hızlı Satış",
          created_at: now,
          updated_at: now,
        });

      if (saleError) throw saleError;

      for (const item of items) {
        const gross =
          Number(item.quantity) *
          Number(item.unitPrice);

        const itemDiscount =
          lineGross > 0
            ? (discountAmount *
                gross) /
              lineGross
            : 0;

        const itemNet = Math.max(
          gross - itemDiscount,
          0
        );

        const itemVat =
          (itemNet *
            Number(item.vatRate || globalVat || 0)) /
          100;

        const { error: itemError } =
          await supabase
            .from("sale_items")
            .insert({
              id:
                crypto.randomUUID(),
              sale_id: saleId,
              product_id:
                item.productId,
              product_name:
                item.name,
              quantity:
                item.quantity,
              unit_price:
                item.unitPrice,
              vat_rate:
                item.vatRate,
              discount_amount:
                itemDiscount,
              line_total:
                itemNet + itemVat,
              created_at: now,
            });

        if (itemError) {
          throw itemError;
        }

        const nextStock =
          Number(item.stock) -
          Number(item.quantity);

        const {
          error: stockError,
        } = await supabase
          .from("products")
          .update({
            stock_quantity: nextStock,
            updated_at: now,
          })
          .eq(
            "id",
            item.productId
          );

        if (stockError) {
          throw stockError;
        }

        const {
          error: movementError,
        } = await supabase
          .from("stock_movements")
          .insert({
            id:
              crypto.randomUUID(),
            product_id:
              item.productId,
            movement_type: "sale",
            quantity:
              item.quantity,
            unit_cost: 0,
            reference_type:
              "quick_sale",
            reference_id:
              saleId,
            note:
              `${number} hızlı satış çıkışı`,
            created_at: now,
          });

        if (movementError) {
          throw movementError;
        }
      }

      const {
        error: collectionError,
      } = await supabase
        .from("collections")
        .insert({
          id:
            crypto.randomUUID(),
          sale_id: saleId,
          customer_id: null,
          amount: grandTotal,
          payment_type: paymentType,
          note:
            `${number} hızlı satış tahsilatı`,
          created_at: now,
        });

      if (collectionError) {
        throw collectionError;
      }

      setItems([]);
      setGlobalDiscount(0);
      setDiscountType("amount");
      setGlobalVat(20);
      setPaymentType("Nakit");

      setSuccess(
        `${number} tamamlandı. Toplam: ₺ ${money(
          grandTotal
        )}`
      );

      await loadProducts();
    } catch (err) {
      console.error(
        "Hızlı satış kaydedilemedi:",
        err
      );

      setError(
        err?.message ||
          "Hızlı satış kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quick-sale-page">

      <div className="quick-sale-header">

        <div>
          <div className="quick-sale-eyebrow">
            REN ERP • SATIŞ
          </div>

          <h1>
            Hızlı Satış
          </h1>

          <p>
            Kasada hızlı ürün ekleyin,
            KDV ve iskonto uygulayın,
            satışı anında tamamlayın.
          </p>
        </div>

        <button
          type="button"
          className="quick-sale-back"
          onClick={() =>
            navigate("/sales")
          }
        >
          <MdArrowBack />
          Satışlara Dön
        </button>

      </div>

      {success && (
        <div className="quick-sale-success">
          {success}
        </div>
      )}

      {error && (
        <div className="quick-sale-error">
          {error}
        </div>
      )}

      <div className="quick-sale-layout">

        <main className="quick-sale-main">

          <section className="quick-sale-card">

            <div className="quick-sale-card-header">

              <div>
                <span>
                  ÜRÜN
                </span>

                <h2>
                  Hızlı Ürün Ekle
                </h2>
              </div>

              <MdPointOfSale />

            </div>

            <div className="quick-sale-search">

              <MdSearch />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Ürün adı, kod veya barkod ara..."
                autoFocus
              />

            </div>

            {search && (
              <div className="quick-sale-dropdown">

                {filteredProducts.length ===
                0 ? (
                  <div className="quick-sale-empty">
                    Ürün bulunamadı.
                  </div>
                ) : (
                  filteredProducts.map(
                    (product) => (
                      <button
                        type="button"
                        key={
                          product.id
                        }
                        onClick={() =>
                          addProduct(
                            product
                          )
                        }
                      >
                        <div>
                          <strong>
                            {
                              product.name
                            }
                          </strong>

                          <span>
                            {product.product_code ||
                              product.barcode ||
                              product.brand ||
                              "-"}
                          </span>
                        </div>

                        <div className="quick-sale-product-right">
                          <b>
                            ₺{" "}
                            {money(
                              product.sale_price
                            )}
                          </b>

                          <small>
                            Stok:{" "}
                            {product.stock_quantity ??
                              0}
                          </small>
                        </div>
                      </button>
                    )
                  )
                )}

              </div>
            )}

          </section>

          <section className="quick-sale-card">

            <div className="quick-sale-card-header">

              <div>
                <span>
                  SATIŞ
                </span>

                <h2>
                  Ürünler
                </h2>
              </div>

              <span className="quick-sale-count">
                {items.length} kalem
              </span>

            </div>

            {items.length === 0 ? (
              <div className="quick-sale-large-empty">
                <MdPointOfSale />
                <strong>
                  Henüz ürün eklenmedi.
                </strong>
                <span>
                  Yukarıdan ürün arayıp satışa ekleyin.
                </span>
              </div>
            ) : (
              <div className="quick-sale-lines">

                {items.map((item) => (
                  <div
                    className="quick-sale-line"
                    key={
                      item.productId
                    }
                  >

                    <div className="quick-sale-line-main">
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        Stok: {item.stock}{" "}
                        {item.unit}
                      </span>
                    </div>

                    <div className="quick-sale-qty">

                      <button
                        type="button"
                        onClick={() =>
                          updateItem(
                            item.productId,
                            "quantity",
                            Math.max(
                              Number(
                                item.quantity
                              ) - 1,
                              1
                            )
                          )
                        }
                      >
                        −
                      </button>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          item.quantity
                        }
                        onChange={(event) =>
                          updateItem(
                            item.productId,
                            "quantity",
                            event.target
                              .value
                          )
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateItem(
                            item.productId,
                            "quantity",
                            Number(
                              item.quantity
                            ) + 1
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                    <div className="quick-sale-unit-price">
                      <span>Birim</span>
                      <strong>
                        ₺{" "}
                        {money(
                          item.unitPrice
                        )}
                      </strong>
                    </div>

                    <div className="quick-sale-line-total">
                      ₺{" "}
                      {money(
                        Number(
                          item.quantity
                        ) *
                          Number(
                            item.unitPrice
                          )
                      )}
                    </div>

                    <button
                      type="button"
                      className="quick-sale-delete"
                      onClick={() =>
                        removeItem(
                          item.productId
                        )
                      }
                    >
                      <MdDelete />
                    </button>

                  </div>
                ))}

              </div>
            )}

          </section>

        </main>

        <aside className="quick-sale-side">

          <section className="quick-sale-card">

            <div className="quick-sale-card-header">
              <div>
                <span>
                  HESAPLAMA
                </span>

                <h2>
                  KDV & İskonto
                </h2>
              </div>
            </div>

            <div className="quick-sale-field">
              <label>
                İskonto Tipi
              </label>

              <div className="quick-sale-toggle">
                <button
                  type="button"
                  className={
                    discountType === "amount"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setDiscountType(
                      "amount"
                    )
                  }
                >
                  ₺ Tutar
                </button>

                <button
                  type="button"
                  className={
                    discountType === "percent"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setDiscountType(
                      "percent"
                    )
                  }
                >
                  % Yüzde
                </button>
              </div>
            </div>

            <div className="quick-sale-field">
              <label>
                İskonto
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  globalDiscount
                }
                onChange={(event) =>
                  setGlobalDiscount(
                    event.target.value
                  )
                }
                placeholder="0"
              />
            </div>

            <div className="quick-sale-field">
              <label>
                KDV
              </label>

              <select
                value={globalVat}
                onChange={(event) =>
                  changeGlobalVat(
                    event.target.value
                  )
                }
              >
                <option value="0">
                  %0
                </option>

                <option value="1">
                  %1
                </option>

                <option value="10">
                  %10
                </option>

                <option value="20">
                  %20
                </option>
              </select>
            </div>

            <div className="quick-sale-calculation">

              <div>
                <span>
                  Ara Toplam
                </span>

                <strong>
                  ₺{" "}
                  {money(
                    lineGross
                  )}
                </strong>
              </div>

              <div>
                <span>
                  İskonto
                </span>

                <strong className="discount">
                  - ₺{" "}
                  {money(
                    discountAmount
                  )}
                </strong>
              </div>

              <div>
                <span>
                  KDV
                </span>

                <strong>
                  ₺{" "}
                  {money(
                    vatAmount
                  )}
                </strong>
              </div>

              <div className="quick-sale-total">
                <span>
                  GENEL TOPLAM
                </span>

                <strong>
                  ₺{" "}
                  {money(
                    grandTotal
                  )}
                </strong>
              </div>

            </div>

          </section>

          <section className="quick-sale-card">

            <div className="quick-sale-card-header">
              <div>
                <span>
                  ÖDEME
                </span>

                <h2>
                  Ödeme Yöntemi
                </h2>
              </div>
            </div>

            <div className="quick-sale-payment-grid">

              {[
                "Nakit",
                "Kredi Kartı",
                "Havale/EFT",
              ].map((type) => (
                <button
                  type="button"
                  key={type}
                  className={
                    paymentType === type
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPaymentType(type)
                  }
                >
                  {type}
                </button>
              ))}

            </div>

          </section>

          <button
            type="button"
            className="quick-sale-complete"
            onClick={completeSale}
            disabled={
              saving ||
              loading ||
              !items.length
            }
          >
            <MdSave />

            {saving
              ? "Satış Kaydediliyor..."
              : `Satışı Tamamla • ₺ ${money(
                  grandTotal
                )}`}
          </button>

        </aside>

      </div>
    </div>
  );
}
