import "./ProductToolbar.css";

function ProductToolbar({
  search,
  setSearch,
  category,
  setCategory,
  onNewProduct
}) {
  return (
    <div className="product-toolbar">

      <div className="toolbar-left">

        <input
          type="text"
          placeholder="🔍 Ürün adı veya barkod ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Tüm Kategoriler</option>
          <option>Temizlik</option>
          <option>Kağıt</option>
          <option>Hijyen</option>
          <option>Mutfak</option>
          <option>Diğer</option>
        </select>

      </div>

      <div className="toolbar-right">

        <button className="excel-btn">
          Excel Aktar
        </button>

        <button className="excel-btn">
          Excel Dışa Aktar
        </button>

        <button
          className="new-btn"
          onClick={onNewProduct}
        >
          + Yeni Ürün
        </button>

      </div>

    </div>
  );
}

export default ProductToolbar;