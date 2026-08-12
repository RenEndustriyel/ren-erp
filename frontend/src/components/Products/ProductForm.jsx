import "./ProductForm.css";

function ProductForm({
  form,
  setForm,
  onSave
}) {

  function change(e){

    setForm({
      ...form,
      [e.target.name]:e.target.value
    });

  }

  function barcode(){

    setForm({
      ...form,
      barcode:Date.now().toString()
    });

  }

  return(

<div className="product-form-card">

<h2>

{form.id ? "Ürünü Düzenle" : "Yeni Ürün"}

</h2>

<div className="product-form-grid">

<input
name="barcode"
placeholder="Barkod"
value={form.barcode}
onChange={change}
/>

<button
className="barcode-btn"
onClick={barcode}
type="button"
>

Barkod Oluştur

</button>

<input
name="name"
placeholder="Ürün Adı"
value={form.name}
onChange={change}
/>

<input
name="category"
placeholder="Kategori"
value={form.category}
onChange={change}
/>

<input
name="brand"
placeholder="Marka"
value={form.brand}
onChange={change}
/>

<input
name="purchasePrice"
type="number"
placeholder="Alış Fiyatı"
value={form.purchasePrice}
onChange={change}
/>

<input
name="salePrice"
type="number"
placeholder="Satış Fiyatı"
value={form.salePrice}
onChange={change}
/>

<input
name="stock"
type="number"
placeholder="Stok"
value={form.stock}
onChange={change}
/>

<input
name="minStock"
type="number"
placeholder="Minimum Stok"
value={form.minStock}
onChange={change}
/>

<input
name="shelf"
placeholder="Raf"
value={form.shelf}
onChange={change}
/>

<button
className="save-btn"
onClick={onSave}
type="button"
>

{form.id ? "Kaydet" : "Ürün Ekle"}

</button>

</div>

</div>

);

}

export default ProductForm;