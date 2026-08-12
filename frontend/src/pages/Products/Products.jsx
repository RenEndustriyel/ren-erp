import { useEffect, useMemo, useState } from "react";
import productService from "../../services/productService";
import { supabase } from "../../lib/supabase";
import "./Products.css";

const emptyForm = {
  name: "",
  barcode: "",
  categoryId: "",
  brand: "",
  unit: "Adet",

  purchasePrice: "",
  purchasePriceType: "exclusive",

  profitRate: "",

  salePrice: "",
  salePriceType: "exclusive",

  vatRate: "20",

  stockQuantity: "",
  criticalStock: "",
  description: "",
};

function formatMoney(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getStockStatus(stock, critical) {
  const quantity = Number(stock || 0);
  const criticalLevel = Number(critical || 0);

  if (quantity <= 0) {
    return {
      label: "Stok Yok",
      className: "stock-danger",
    };
  }

  if (quantity <= criticalLevel) {
    return {
      label: "Kritik",
      className: "stock-warning",
    };
  }

  return {
    label: "Yeterli",
    className: "stock-success",
  };
}

/*
 * ALIŞ FİYATINI KDV HARİÇ MALİYETE ÇEVİRİR
 *
 * Örnek:
 * 100 TL KDV Hariç -> 100 TL
 * 120 TL KDV Dahil -> 100 TL (%20 KDV)
 */
function getNetPurchasePrice(
  purchasePrice,
  purchasePriceType,
  vatRate
) {
  const price = Number(purchasePrice || 0);
  const vat = Number(vatRate || 0);

  if (price <= 0) {
    return 0;
  }

  if (purchasePriceType === "inclusive") {
    return price / (1 + vat / 100);
  }

  return price;
}

/*
 * KDV HARİÇ SATIŞI,
 * SEÇİLEN SATIŞ TİPİNE ÇEVİRİR.
 */
function getDisplayedSalePrice(
  netSalePrice,
  salePriceType,
  vatRate
) {
  const price = Number(netSalePrice || 0);
  const vat = Number(vatRate || 0);

  if (price <= 0) {
    return 0;
  }

  if (salePriceType === "inclusive") {
    return price * (1 + vat / 100);
  }

  return price;
}

/*
 * SATIŞ FİYATINI KDV HARİÇ HALE GETİRİR.
 *
 * KDV Hariç satış:
 * 135 -> 135
 *
 * KDV Dahil satış:
 * 162 -> 135 (%20)
 */
function getNetSalePrice(
  salePrice,
  salePriceType,
  vatRate
) {
  const price = Number(salePrice || 0);
  const vat = Number(vatRate || 0);

  if (price <= 0) {
    return 0;
  }

  if (salePriceType === "inclusive") {
    return price / (1 + vat / 100);
  }

  return price;
}

/*
 * ALIŞ + KÂR -> SATIŞ
 *
 * ANA REN ERP FİYAT MANTIĞI:
 *
 * ALIŞ
 * ↓
 * Alış KDV'sini ayır
 * ↓
 * Kâr uygula
 * ↓
 * Satış KDV'sini uygula
 * ↓
 * SATIŞ
 */
function calculateSalePrice({
  purchasePrice,
  purchasePriceType,
  profitRate,
  salePriceType,
  vatRate,
}) {
  const netPurchase = getNetPurchasePrice(
    purchasePrice,
    purchasePriceType,
    vatRate
  );

  const profit = Number(profitRate || 0);

  if (netPurchase <= 0) {
    return "";
  }

  const netSale =
    netPurchase * (1 + profit / 100);

  const finalSale =
    getDisplayedSalePrice(
      netSale,
      salePriceType,
      vatRate
    );

  return finalSale.toFixed(2);
}

/*
 * ALIŞ + SATIŞ -> KÂR %
 *
 * Önce:
 * Alış KDV'si ayrılır.
 *
 * Sonra:
 * Satış KDV'si ayrılır.
 *
 * Daha sonra:
 * (Net Satış - Net Alış) / Net Alış
 */
function calculateProfitRate({
  purchasePrice,
  purchasePriceType,
  salePrice,
  salePriceType,
  vatRate,
}) {
  const netPurchase =
    getNetPurchasePrice(
      purchasePrice,
      purchasePriceType,
      vatRate
    );

  const netSale =
    getNetSalePrice(
      salePrice,
      salePriceType,
      vatRate
    );

  if (
    netPurchase <= 0 ||
    netSale <= 0
  ) {
    return "";
  }

  const profitRate =
    ((netSale - netPurchase) /
      netPurchase) *
    100;

  return profitRate.toFixed(2);
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("");
  const [stockFilter, setStockFilter] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] = useState({
    ...emptyForm,
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        productData,
        categoryResult,
      ] = await Promise.all([
        productService.getAll(),

        supabase
          .from("categories")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
      ]);

      setProducts(productData || []);

      if (categoryResult.error) {
        console.error(
          "Kategoriler alınamadı:",
          categoryResult.error
        );
      }

      setCategories(
        categoryResult.data || []
      );
    } catch (error) {
      console.error(
        "Ürün verileri yüklenemedi:",
        error
      );

      alert(
        "Ürün verileri yüklenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchText = search
        .trim()
        .toLocaleLowerCase("tr-TR");

      const matchesSearch =
        !searchText ||
        product.name
          .toLocaleLowerCase("tr-TR")
          .includes(searchText) ||
        String(product.barcode || "")
          .toLocaleLowerCase("tr-TR")
          .includes(searchText) ||
        String(product.brand || "")
          .toLocaleLowerCase("tr-TR")
          .includes(searchText);

      const matchesCategory =
        !categoryFilter ||
        product.categoryId ===
          categoryFilter;

      const stock = Number(
        product.stock || 0
      );

      const critical = Number(
        product.criticalStock || 0
      );

      let matchesStock = true;

      if (
        stockFilter === "available"
      ) {
        matchesStock = stock > critical;
      }

      if (
        stockFilter === "critical"
      ) {
        matchesStock =
          stock > 0 &&
          stock <= critical;
      }

      if (
        stockFilter === "empty"
      ) {
        matchesStock = stock <= 0;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStock
      );
    });
  }, [
    products,
    search,
    categoryFilter,
    stockFilter,
  ]);

  const openNewProduct = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setShowModal(true);
  };

  const openEditProduct = (product) => {
    setEditingId(product.id);

    const purchasePrice =
      product.buy !== undefined
        ? Number(product.buy)
        : 0;

    const salePrice =
      product.sale !== undefined
        ? Number(product.sale)
        : 0;

    const purchasePriceType =
      product.purchasePriceType ||
      product.purchase_price_type ||
      "exclusive";

    const salePriceType =
      product.salePriceType ||
      product.sale_price_type ||
      "exclusive";

    const vatRate =
      product.vatRate !== undefined
        ? Number(product.vatRate)
        : 20;

    const profitRate =
      calculateProfitRate({
        purchasePrice,
        purchasePriceType,
        salePrice,
        salePriceType,
        vatRate,
      });

    setForm({
      name: product.name || "",
      barcode: product.barcode || "",
      categoryId:
        product.categoryId || "",
      brand: product.brand || "",
      unit:
        product.unit || "Adet",

      purchasePrice:
        product.buy !== undefined
          ? String(product.buy)
          : "",

      purchasePriceType,

      profitRate,

      salePrice:
        product.sale !== undefined
          ? String(product.sale)
          : "",

      salePriceType,

      vatRate: String(vatRate),

      stockQuantity:
        product.stock !== undefined
          ? String(product.stock)
          : "",

      criticalStock:
        product.criticalStock !==
        undefined
          ? String(
              product.criticalStock
            )
          : "",

      description:
        product.description || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingId(null);

    setForm({
      ...emptyForm,
    });
  };

  /*
   * ÇİFT YÖNLÜ FİYAT HESAPLAMA
   *
   * ALIŞ DEĞİŞİRSE:
   *   satış yeniden hesaplanır.
   *
   * KÂR DEĞİŞİRSE:
   *   satış yeniden hesaplanır.
   *
   * SATIŞ DEĞİŞİRSE:
   *   kâr yeniden hesaplanır.
   *
   * TİP / KDV DEĞİŞİRSE:
   *   uygun taraf yeniden hesaplanır.
   */
  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => {
      const updatedForm = {
        ...current,
        [name]: value,
      };

      /*
       * 1 — ALIŞ DEĞİŞTİ
       *
       * Eğer kullanıcı kâr girmişse
       * satış otomatik hesaplanır.
       *
       * Eğer kâr boşsa ve satış zaten
       * varsa kâr otomatik hesaplanır.
       */
      if (
        name === "purchasePrice"
      ) {
        if (
          current.profitRate !== "" &&
          current.profitRate !== null
        ) {
          updatedForm.salePrice =
            calculateSalePrice({
              purchasePrice: value,
              purchasePriceType:
                current.purchasePriceType,
              profitRate:
                current.profitRate,
              salePriceType:
                current.salePriceType,
              vatRate:
                current.vatRate,
            });
        } else if (
          current.salePrice !== ""
        ) {
          updatedForm.profitRate =
            calculateProfitRate({
              purchasePrice: value,
              purchasePriceType:
                current.purchasePriceType,
              salePrice:
                current.salePrice,
              salePriceType:
                current.salePriceType,
              vatRate:
                current.vatRate,
            });
        }
      }

      /*
       * 2 — ALIŞ KDV TİPİ DEĞİŞTİ
       */
      if (
        name === "purchasePriceType"
      ) {
        if (
          current.profitRate !== ""
        ) {
          updatedForm.salePrice =
            calculateSalePrice({
              purchasePrice:
                current.purchasePrice,
              purchasePriceType:
                value,
              profitRate:
                current.profitRate,
              salePriceType:
                current.salePriceType,
              vatRate:
                current.vatRate,
            });
        } else if (
          current.salePrice !== ""
        ) {
          updatedForm.profitRate =
            calculateProfitRate({
              purchasePrice:
                current.purchasePrice,
              purchasePriceType: value,
              salePrice:
                current.salePrice,
              salePriceType:
                current.salePriceType,
              vatRate:
                current.vatRate,
            });
        }
      }

      /*
       * 3 — KÂR DEĞİŞTİ
       *
       * Kâr girildiğinde satış otomatik.
       */
      if (
        name === "profitRate"
      ) {
        updatedForm.salePrice =
          calculateSalePrice({
            purchasePrice:
              current.purchasePrice,
            purchasePriceType:
              current.purchasePriceType,
            profitRate: value,
            salePriceType:
              current.salePriceType,
            vatRate:
              current.vatRate,
          });
      }

      /*
       * 4 — SATIŞ FİYATI DEĞİŞTİ
       *
       * Satış elle girildiyse
       * kâr otomatik hesaplanır.
       */
      if (
        name === "salePrice"
      ) {
        updatedForm.profitRate =
          calculateProfitRate({
            purchasePrice:
              current.purchasePrice,
            purchasePriceType:
              current.purchasePriceType,
            salePrice: value,
            salePriceType:
              current.salePriceType,
            vatRate:
              current.vatRate,
          });
      }

      /*
       * 5 — SATIŞ KDV TİPİ DEĞİŞTİ
       *
       * Satış mevcutsa kâr yeniden
       * hesaplanır.
       *
       * Kâr mevcutsa satış da yeniden
       * hesaplanır.
       */
      if (
        name === "salePriceType"
      ) {
        if (
          current.salePrice !== ""
        ) {
          updatedForm.profitRate =
            calculateProfitRate({
              purchasePrice:
                current.purchasePrice,
              purchasePriceType:
                current.purchasePriceType,
              salePrice:
                current.salePrice,
              salePriceType: value,
              vatRate:
                current.vatRate,
            });
        } else if (
          current.profitRate !== ""
        ) {
          updatedForm.salePrice =
            calculateSalePrice({
              purchasePrice:
                current.purchasePrice,
              purchasePriceType:
                current.purchasePriceType,
              profitRate:
                current.profitRate,
              salePriceType: value,
              vatRate:
                current.vatRate,
            });
        }
      }

      /*
       * 6 — KDV ORANI DEĞİŞTİ
       *
       * Öncelik:
       *   Kâr varsa → satış hesapla
       *   Kâr yoksa + satış varsa → kâr hesapla
       */
      if (
        name === "vatRate"
      ) {
        if (
          current.profitRate !== ""
        ) {
          updatedForm.salePrice =
            calculateSalePrice({
              purchasePrice:
                current.purchasePrice,
              purchasePriceType:
                current.purchasePriceType,
              profitRate:
                current.profitRate,
              salePriceType:
                current.salePriceType,
              vatRate: value,
            });
        } else if (
          current.salePrice !== ""
        ) {
          updatedForm.profitRate =
            calculateProfitRate({
              purchasePrice:
                current.purchasePrice,
              purchasePriceType:
                current.purchasePriceType,
              salePrice:
                current.salePrice,
              salePriceType:
                current.salePriceType,
              vatRate: value,
            });
        }
      }

      return updatedForm;
    });
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Ürün adı zorunludur.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),

        barcode:
          form.barcode.trim() ||
          null,

        category_id:
          form.categoryId || null,

        brand:
          form.brand.trim() ||
          null,

        unit:
          form.unit.trim() ||
          "Adet",

        purchase_price:
          Number(
            form.purchasePrice || 0
          ),

        purchase_price_type:
          form.purchasePriceType,

        sale_price:
          Number(
            form.salePrice || 0
          ),

        sale_price_type:
          form.salePriceType,

        vat_rate:
          Number(
            form.vatRate || 0
          ),

        stock_quantity:
          Number(
            form.stockQuantity || 0
          ),

        critical_stock:
          Number(
            form.criticalStock || 0
          ),

        description:
          form.description.trim() ||
          null,

        is_active: true,
      };

      if (editingId) {
        const { error } =
          await supabase
            .from("products")
            .update(payload)
            .eq(
              "id",
              editingId
            );

        if (error) {
          throw error;
        }
      } else {
        const { error } =
          await supabase
            .from("products")
            .insert(payload);

        if (error) {
          throw error;
        }
      }

      closeModal();

      await loadData();
    } catch (error) {
      console.error(
        "Ürün kaydedilemedi:",
        error
      );

      if (
        error?.code ===
        "23505"
      ) {
        alert(
          "Bu barkod veya ürün kodu zaten kayıtlı."
        );
      } else {
        console.error(
          "Supabase detay:",
          error
        );

        alert(
          "Ürün kaydedilirken bir hata oluştu."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    product
  ) => {
    const confirmed =
      window.confirm(
        `"${product.name}" ürününü silmek istediğine emin misin?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("products")
          .delete()
          .eq(
            "id",
            product.id
          );

      if (error) {
        throw error;
      }

      await loadData();
    } catch (error) {
      console.error(
        "Ürün silinemedi:",
        error
      );

      alert(
        "Ürün silinirken bir hata oluştu."
      );
    }
  };

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (total, product) =>
        total +
        Number(
          product.stock || 0
        ),
      0
    );

  const criticalProducts =
    products.filter(
      (product) =>
        Number(
          product.stock || 0
        ) <=
        Number(
          product.criticalStock ||
            0
        )
    ).length;

  const stockValue =
    products.reduce(
      (total, product) =>
        total +
        Number(
          product.stock || 0
        ) *
          Number(
            product.buy || 0
          ),
      0
    );

  return (
    <div className="products-page">
      <header className="products-header">
        <div>
          <div className="products-eyebrow">
            STOK & ÜRÜNLER
          </div>

          <h1>Ürünler</h1>

          <p>
            İşletmenizdeki ürünleri,
            stokları ve fiyatları tek
            ekrandan yönetin.
          </p>
        </div>

        <button
          className="products-primary-button"
          onClick={
            openNewProduct
          }
        >
          <span>＋</span>
          Yeni Ürün
        </button>
      </header>

      <section className="products-stats">
        <div className="product-stat-card">
          <div className="product-stat-icon blue">
            ▦
          </div>

          <div>
            <span>
              TOPLAM ÜRÜN
            </span>

            <strong>
              {totalProducts}
            </strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon green">
            📦
          </div>

          <div>
            <span>
              TOPLAM STOK
            </span>

            <strong>
              {totalStock.toLocaleString(
                "tr-TR"
              )}
            </strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon orange">
            ⚠
          </div>

          <div>
            <span>
              KRİTİK STOK
            </span>

            <strong>
              {criticalProducts}
            </strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="product-stat-icon purple">
            ₺
          </div>

          <div>
            <span>
              STOK MALİYETİ
            </span>

            <strong>
              {formatMoney(
                stockValue
              )}
            </strong>
          </div>
        </div>
      </section>

      <section className="products-card">
        <div className="products-toolbar">
          <div className="products-search">
            <span>⌕</span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Ürün, barkod veya marka ara..."
            />
          </div>

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
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {category.name}
                </option>
              )
            )}
          </select>

          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Tüm Stoklar
            </option>

            <option value="available">
              Yeterli Stok
            </option>

            <option value="critical">
              Kritik Stok
            </option>

            <option value="empty">
              Stok Yok
            </option>
          </select>
        </div>

        <div className="products-table-wrap">
          {loading ? (
            <div className="products-loading">
              <div className="products-spinner" />

              Ürünler yükleniyor...
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <div className="products-empty">
              <div className="products-empty-icon">
                📦
              </div>

              <h3>
                Henüz ürün bulunamadı
              </h3>

              <p>
                İlk ürününüzü
                ekleyerek stok
                yönetimine
                başlayabilirsiniz.
              </p>

              <button
                className="products-primary-button"
                onClick={
                  openNewProduct
                }
              >
                ＋ Yeni Ürün
              </button>
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>ÜRÜN</th>
                  <th>BARKOD</th>
                  <th>KATEGORİ</th>
                  <th>MARKA</th>
                  <th>ALIŞ</th>
                  <th>SATIŞ</th>
                  <th>STOK</th>
                  <th>DURUM</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => {
                    const status =
                      getStockStatus(
                        product.stock,
                        product.criticalStock
                      );

                    return (
                      <tr
                        key={
                          product.id
                        }
                      >
                        <td>
                          <div className="product-name-cell">
                            <div className="product-avatar">
                              {product.name
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase() ||
                                "Ü"}
                            </div>

                            <div>
                              <strong>
                                {
                                  product.name
                                }
                              </strong>

                              <span>
                                {product.unit ||
                                  "Adet"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="muted-cell">
                          {product.barcode ||
                            "—"}
                        </td>

                        <td>
                          <span className="category-badge">
                            {product.category ||
                              "Diğer"}
                          </span>
                        </td>

                        <td className="muted-cell">
                          {product.brand ||
                            "—"}
                        </td>

                        <td className="money-cell">
                          {formatMoney(
                            product.buy
                          )}
                        </td>

                        <td className="money-cell sale-price">
                          {formatMoney(
                            product.sale
                          )}
                        </td>

                        <td>
                          <strong className="stock-number">
                            {Number(
                              product.stock ||
                                0
                            ).toLocaleString(
                              "tr-TR"
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`stock-badge ${status.className}`}
                          >
                            <i />

                            {
                              status.label
                            }
                          </span>
                        </td>

                        <td>
                          <div className="product-actions">
                            <button
                              title="Düzenle"
                              onClick={() =>
                                openEditProduct(
                                  product
                                )
                              }
                            >
                              ✎
                            </button>

                            <button
                              title="Sil"
                              className="delete"
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
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading &&
          filteredProducts.length >
            0 && (
            <div className="products-footer">
              <span>
                {
                  filteredProducts.length
                }{" "}
                ürün gösteriliyor
              </span>
            </div>
          )}
      </section>

      {showModal && (
        <div
          className="product-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="product-modal">
            <div className="product-modal-header">
              <div>
                <span>
                  ÜRÜN YÖNETİMİ
                </span>

                <h2>
                  {editingId
                    ? "Ürünü Düzenle"
                    : "Yeni Ürün"}
                </h2>
              </div>

              <button
                className="product-modal-close"
                onClick={
                  closeModal
                }
              >
                ×
              </button>
            </div>

            <form
              className="product-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="product-form-grid">
                <label>
                  <span>
                    Ürün Adı *
                  </span>

                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Örn. Tex Jel Bulaşık 35 KG"
                    required
                  />
                </label>

                <label>
                  <span>
                    Barkod
                  </span>

                  <input
                    name="barcode"
                    value={
                      form.barcode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="869..."
                  />
                </label>

                <label>
                  <span>
                    Kategori
                  </span>

                  <select
                    name="categoryId"
                    value={
                      form.categoryId
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Kategori seçin
                    </option>

                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Marka
                  </span>

                  <input
                    name="brand"
                    value={
                      form.brand
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Örn. Tex"
                  />
                </label>

                <label>
                  <span>
                    Birim
                  </span>

                  <select
                    name="unit"
                    value={
                      form.unit
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="Adet">
                      Adet
                    </option>

                    <option value="Koli">
                      Koli
                    </option>

                    <option value="Paket">
                      Paket
                    </option>

                    <option value="Kg">
                      Kg
                    </option>

                    <option value="Lt">
                      Lt
                    </option>

                    <option value="Mt">
                      Mt
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    KDV
                  </span>

                  <select
                    name="vatRate"
                    value={
                      form.vatRate
                    }
                    onChange={
                      handleChange
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
                </label>

                {/* ALIŞ */}
                <label>
                  <span>
                    Alış Fiyatı
                  </span>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 145px",
                      gap: "8px",
                    }}
                  >
                    <input
                      name="purchasePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        form.purchasePrice
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0,00"
                    />

                    <select
                      name="purchasePriceType"
                      value={
                        form.purchasePriceType
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="exclusive">
                        KDV Hariç
                      </option>

                      <option value="inclusive">
                        KDV Dahil
                      </option>
                    </select>
                  </div>
                </label>

                {/* KÂR */}
                <label>
                  <span>
                    % Kâr
                  </span>

                  <div
                    style={{
                      position:
                        "relative",
                    }}
                  >
                    <input
                      name="profitRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        form.profitRate
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Örn. 35"
                      style={{
                        paddingRight:
                          "40px",
                      }}
                    />

                    <span
                      style={{
                        position:
                          "absolute",
                        right: "14px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",
                        opacity: 0.6,
                        pointerEvents:
                          "none",
                      }}
                    >
                      %
                    </span>
                  </div>
                </label>

                {/* SATIŞ */}
                <label>
                  <span>
                    Satış Fiyatı
                  </span>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "1fr 145px",
                      gap: "8px",
                    }}
                  >
                    <input
                      name="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        form.salePrice
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="0,00"
                    />

                    <select
                      name="salePriceType"
                      value={
                        form.salePriceType
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="exclusive">
                        KDV Hariç
                      </option>

                      <option value="inclusive">
                        KDV Dahil
                      </option>
                    </select>
                  </div>
                </label>

                <label>
                  <span>
                    Mevcut Stok
                  </span>

                  <input
                    name="stockQuantity"
                    type="number"
                    step="0.001"
                    min="0"
                    value={
                      form.stockQuantity
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                  />
                </label>

                <label>
                  <span>
                    Kritik Stok
                  </span>

                  <input
                    name="criticalStock"
                    type="number"
                    step="0.001"
                    min="0"
                    value={
                      form.criticalStock
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="0"
                  />
                </label>
              </div>

              {/* FİYAT ÖZETİ */}
              <div
                style={{
                  marginTop: "18px",
                  padding:
                    "14px 16px",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(127, 127, 127, 0.08)",
                  border:
                    "1px solid rgba(127, 127, 127, 0.12)",
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "20px",
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <small
                    style={{
                      display:
                        "block",
                      opacity: 0.6,
                      marginBottom:
                        "4px",
                    }}
                  >
                    KDV Hariç Alış
                  </small>

                  <strong>
                    {formatMoney(
                      getNetPurchasePrice(
                        form.purchasePrice,
                        form.purchasePriceType,
                        form.vatRate
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <small
                    style={{
                      display:
                        "block",
                      opacity: 0.6,
                      marginBottom:
                        "4px",
                    }}
                  >
                    Kâr
                  </small>

                  <strong>
                    %
                    {Number(
                      form.profitRate ||
                        0
                    ).toLocaleString(
                      "tr-TR"
                    )}
                  </strong>
                </div>

                <div>
                  <small
                    style={{
                      display:
                        "block",
                      opacity: 0.6,
                      marginBottom:
                        "4px",
                    }}
                  >
                    Satış
                  </small>

                  <strong
                    style={{
                      fontSize:
                        "17px",
                    }}
                  >
                    {formatMoney(
                      form.salePrice
                    )}
                  </strong>
                </div>

                <div>
                  <small
                    style={{
                      display:
                        "block",
                      opacity: 0.6,
                      marginBottom:
                        "4px",
                    }}
                  >
                    Satış Tipi
                  </small>

                  <strong>
                    {form.salePriceType ===
                    "inclusive"
                      ? "KDV Dahil"
                      : "KDV Hariç"}
                  </strong>
                </div>
              </div>

              <label className="product-description">
                <span>
                  Açıklama
                </span>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Ürün hakkında not..."
                  rows="3"
                />
              </label>

              <div className="product-form-footer">
                <button
                  type="button"
                  className="product-secondary-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Vazgeç
                </button>

                <button
                  type="submit"
                  className="products-primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Kaydediliyor..."
                    : editingId
                    ? "Değişiklikleri Kaydet"
                    : "Ürünü Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}