import "./ProductStats.css";

function ProductStats({ products = [] }) {
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, item) => sum + Number(item.stock || 0),
    0
  );

  const stockValue = products.reduce(
    (sum, item) =>
      sum +
      Number(item.stock || 0) *
        Number(item.purchasePrice || 0),
    0
  );

  const criticalStock = products.filter(
    (item) =>
      Number(item.stock || 0) <=
      Number(item.minStock || 0)
  ).length;

  return (
    <div className="product-stats">

      <div className="stat-card">

        <span className="stat-title">
          Toplam Ürün
        </span>

        <h2>{totalProducts}</h2>

      </div>

      <div className="stat-card">

        <span className="stat-title">
          Toplam Stok
        </span>

        <h2>{totalStock}</h2>

      </div>

      <div className="stat-card">

        <span className="stat-title">
          Stok Değeri
        </span>

        <h2>
          {stockValue.toLocaleString("tr-TR")} TL
        </h2>

      </div>

      <div className="stat-card danger">

        <span className="stat-title">
          Kritik Stok
        </span>

        <h2>{criticalStock}</h2>

      </div>

    </div>
  );
}

export default ProductStats;