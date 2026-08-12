import { useMemo, useState } from "react";
import "./Sales.css";

const customers = [
  { id: "retail", name: "Perakende Müşteri", type: "Perakende" },
  { id: "cash", name: "Peşin Müşteri", type: "Peşin" },
];

const products = [
  { id: 1, name: "Endüstriyel Temizlik Ürünü 5 L", price: 350, vat: 20 },
  { id: 2, name: "Z Katlama Kağıt Havlu", price: 420, vat: 20 },
  { id: 3, name: "Masa Servis Peçetesi", price: 280, vat: 20 },
  { id: 4, name: "Çöp Torbası Büyük Boy", price: 250, vat: 20 },
];

function Sales() {
  const [customer, setCustomer] = useState("retail");
  const [productSearch, setProductSearch] = useState("");
  const [vatRate, setVatRate] = useState(20);

  const [discountPercent, setDiscountPercent] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  const [cart, setCart] = useState([]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;

    return products.filter((product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [cart]);

  const percentDiscount = useMemo(() => {
    const percent = Number(discountPercent) || 0;
    return subtotal * (percent / 100);
  }, [subtotal, discountPercent]);

  const manualDiscount = Number(discountAmount) || 0;

  const totalDiscount = Math.min(
    subtotal,
    percentDiscount + manualDiscount
  );

  const taxableAmount = Math.max(subtotal - totalDiscount, 0);

  const vatAmount = taxableAmount * (Number(vatRate) / 100);

  const grandTotal = taxableAmount + vatAmount;

  const addProduct = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setProductSearch("");
  };

  const updateQuantity = (id, quantity) => {
    const value = Math.max(1, Number(quantity) || 1);

    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: value }
          : item
      )
    );
  };

  const removeProduct = (id) => {
    setCart((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const clearSale = () => {
    setCart([]);
    setCustomer("retail");
    setVatRate(20);
    setDiscountPercent("");
    setDiscountAmount("");
  };

  const saveSale = () => {
    if (cart.length === 0) {
      alert("Satışa en az bir ürün ekleyin.");
      return;
    }

    const sale = {
      customer,
      items: cart,
      subtotal,
      discountPercent: Number(discountPercent) || 0,
      discountAmount: manualDiscount,
      totalDiscount,
      vatRate: Number(vatRate),
      vatAmount,
      grandTotal,
      createdAt: new Date().toISOString(),
    };

    console.log("SATIŞ KAYDI:", sale);

    alert(
      `Satış kaydedildi.\n\nGenel Toplam: ${formatCurrency(
        grandTotal
      )}`
    );
  };

  return (
    <div className="sales-page">
      <div className="sales-header">
        <div>
          <span className="sales-eyebrow">SATIŞ</span>
          <h1>Yeni Satış</h1>
          <p>Hızlı ve profesyonel satış oluşturun.</p>
        </div>

        <button className="secondary-button" onClick={clearSale}>
          Temizle
        </button>
      </div>

      <div className="sales-grid">
        <main className="sales-main">
          <section className="sales-card">
            <div className="card-title">
              <div>
                <h2>Müşteri</h2>
                <span>Satış yapılacak cari</span>
              </div>
            </div>

            <select
              className="form-control"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            >
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </section>

          <section className="sales-card">
            <div className="card-title">
              <div>
                <h2>Ürün Ekle</h2>
                <span>Ürün adı ile arayın</span>
              </div>
            </div>

            <div className="product-search">
              <input
                className="form-control"
                value={productSearch}
                onChange={(e) =>
                  setProductSearch(e.target.value)
                }
                placeholder="Ürün adı veya barkod..."
              />

              {productSearch && (
                <div className="product-results">
                  {filteredProducts.length === 0 ? (
                    <div className="empty-result">
                      Ürün bulunamadı.
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        type="button"
                        className="product-result"
                        key={product.id}
                        onClick={() => addProduct(product)}
                      >
                        <div>
                          <strong>{product.name}</strong>
                          <span>
                            KDV %{product.vat}
                          </span>
                        </div>

                        <b>
                          {formatCurrency(product.price)}
                        </b>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="sales-card">
            <div className="card-title">
              <div>
                <h2>Satış Kalemleri</h2>
                <span>{cart.length} ürün</span>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-icon">+</div>
                <strong>Henüz ürün eklenmedi</strong>
                <span>
                  Yukarıdaki arama alanından ürün ekleyin.
                </span>
              </div>
            ) : (
              <div className="cart-table">
                <div className="cart-head">
                  <span>Ürün</span>
                  <span>Miktar</span>
                  <span>Birim Fiyat</span>
                  <span>Toplam</span>
                  <span></span>
                </div>

                {cart.map((item) => (
                  <div className="cart-row" key={item.id}>
                    <div className="product-name">
                      <strong>{item.name}</strong>
                      <span>KDV %{item.vat}</span>
                    </div>

                    <input
                      className="quantity-input"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.id,
                          e.target.value
                        )
                      }
                    />

                    <span>
                      {formatCurrency(item.price)}
                    </span>

                    <strong>
                      {formatCurrency(
                        item.price * item.quantity
                      )}
                    </strong>

                    <button
                      className="remove-button"
                      onClick={() =>
                        removeProduct(item.id)
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="sales-card">
            <div className="card-title">
              <div>
                <h2>Vergi ve İskonto</h2>
                <span>
                  Satış toplamına uygulanacak değerler
                </span>
              </div>
            </div>

            <div className="settings-grid">
              <div className="field">
                <label>KDV Oranı</label>

                <select
                  className="form-control"
                  value={vatRate}
                  onChange={(e) =>
                    setVatRate(Number(e.target.value))
                  }
                >
                  <option value={0}>%0 KDV</option>
                  <option value={1}>%1 KDV</option>
                  <option value={10}>%10 KDV</option>
                  <option value={20}>%20 KDV</option>
                </select>
              </div>

              <div className="field">
                <label>İskonto %</label>

                <input
                  className="form-control"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) =>
                    setDiscountPercent(e.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="field">
                <label>İskonto TL</label>

                <input
                  className="form-control"
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) =>
                    setDiscountAmount(e.target.value)
                  }
                  placeholder="0,00"
                />
              </div>
            </div>
          </section>
        </main>

        <aside className="sales-summary">
          <div className="summary-card">
            <div className="summary-header">
              <span>Satış Özeti</span>
              <span className="summary-status">
                Hazır
              </span>
            </div>

            <div className="summary-line">
              <span>Ara Toplam</span>
              <strong>
                {formatCurrency(subtotal)}
              </strong>
            </div>

            <div className="summary-line discount-line">
              <span>İskonto</span>
              <strong>
                -{formatCurrency(totalDiscount)}
              </strong>
            </div>

            <div className="summary-line">
              <span>KDV Matrahı</span>
              <strong>
                {formatCurrency(taxableAmount)}
              </strong>
            </div>

            <div className="summary-line">
              <span>KDV (%{vatRate})</span>
              <strong>
                {formatCurrency(vatAmount)}
              </strong>
            </div>

            <div className="summary-total">
              <span>Genel Toplam</span>
              <strong>
                {formatCurrency(grandTotal)}
              </strong>
            </div>

            <button
              className="save-sale-button"
              onClick={saveSale}
            >
              SATIŞI KAYDET
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export default Sales;