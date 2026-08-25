const PRODUCT_STORAGE_KEY = "ren_erp_products";

export function getProducts() {
  try {
    const saved =
      localStorage.getItem(
        PRODUCT_STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      "REN ERP ürünleri okunamadı:",
      error
    );

    return [];
  }
}

export function getProductById(
  id
) {
  return getProducts().find(
    (product) =>
      String(product.id) ===
      String(id)
  );
}

export function saveProducts(
  products
) {
  localStorage.setItem(
    PRODUCT_STORAGE_KEY,
    JSON.stringify(products)
  );

  window.dispatchEvent(
    new Event(
      "ren-products-updated"
    )
  );
}

export function updateProduct(
  id,
  updates
) {
  const products =
    getProducts();

  const updated =
    products.map(
      (product) =>
        String(product.id) ===
        String(id)
          ? {
              ...product,
              ...updates,
            }
          : product
    );

  saveProducts(updated);

  return updated;
}

export function addProduct(
  product
) {
  const products =
    getProducts();

  const updated = [
    ...products,
    product,
  ];

  saveProducts(updated);

  return updated;
}

export function deleteProduct(
  id
) {
  const products =
    getProducts();

  const updated =
    products.filter(
      (product) =>
        String(product.id) !==
        String(id)
    );

  saveProducts(updated);

  return updated;
}