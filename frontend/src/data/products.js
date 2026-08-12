const defaultProducts = [
  {
    id: 1,
    barcode: "1001",
    name: "Tex Jel Bulaşık 35 Kg",
    purchasePrice: 2600,
    salePrice: 3200,
    stock: 25,
    minStock: 5,
    category: "Temizlik",
    unit: "Adet",
  },
  {
    id: 2,
    barcode: "1002",
    name: "Cif Pro 5 Litre",
    purchasePrice: 450,
    salePrice: 650,
    stock: 15,
    minStock: 5,
    category: "Temizlik",
    unit: "Adet",
  },
  {
    id: 3,
    barcode: "1003",
    name: "Selpak Havlu Kağıt",
    purchasePrice: 120,
    salePrice: 180,
    stock: 50,
    minStock: 10,
    category: "Kağıt",
    unit: "Paket",
  },
];

if (!localStorage.getItem("products")) {
  localStorage.setItem("products", JSON.stringify(defaultProducts));
}

function save(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

export function getProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

export function getProduct(id) {
  return getProducts().find((item) => Number(item.id) === Number(id));
}

export function addProduct(product) {
  const products = getProducts();

  const newProduct = {
    id: Date.now(),
    barcode: product.barcode || "",
    name: product.name || "",
    purchasePrice: Number(product.purchasePrice || 0),
    salePrice: Number(product.salePrice || 0),
    stock: Number(product.stock || 0),
    minStock: Number(product.minStock || 0),
    category: product.category || "",
    unit: product.unit || "Adet",
  };

  products.push(newProduct);

  save(products);

  return newProduct;
}

export function updateProduct(product) {
  const products = getProducts();

  const index = products.findIndex(
    (item) => Number(item.id) === Number(product.id)
  );

  if (index === -1) return false;

  products[index] = {
    ...products[index],
    ...product,
    purchasePrice: Number(product.purchasePrice),
    salePrice: Number(product.salePrice),
    stock: Number(product.stock),
    minStock: Number(product.minStock),
  };

  save(products);

  return true;
}

export function deleteProduct(id) {
  const products = getProducts().filter(
    (item) => Number(item.id) !== Number(id)
  );

  save(products);
}

export function increaseStock(productId, quantity) {
  const products = getProducts();

  const index = products.findIndex(
    (item) => Number(item.id) === Number(productId)
  );

  if (index === -1) return;

  products[index].stock += Number(quantity);

  save(products);
}

export function decreaseStock(productId, quantity) {
  const products = getProducts();

  const index = products.findIndex(
    (item) => Number(item.id) === Number(productId)
  );

  if (index === -1) return;

  products[index].stock -= Number(quantity);

  if (products[index].stock < 0) {
    products[index].stock = 0;
  }

  save(products);
}

export function updateStock(productId, quantity) {
  decreaseStock(productId, quantity);
}

export function searchProducts(text) {
  const search = text.toLowerCase();

  return getProducts().filter(
    (item) =>
      item.name.toLowerCase().includes(search) ||
      item.barcode.toLowerCase().includes(search)
  );
}

export function getLowStockProducts() {
  return getProducts().filter(
    (item) => Number(item.stock) <= Number(item.minStock)
  );
}

export default getProducts();