import { getProducts, increaseStock } from "./products";
import { updateCustomerBalance } from "./customers";

const STORAGE_KEY = "purchases";

export function getPurchases() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function save(purchases) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
}

export function getPurchase(id) {
  return getPurchases().find(
    (item) => Number(item.id) === Number(id)
  );
}

export function addPurchase(data) {
  const purchases = getPurchases();

  const purchase = {
    id: Date.now(),
    supplierId: Number(data.supplierId),
    supplier: data.supplier,
    date: new Date().toLocaleString("tr-TR"),
    total: Number(data.total),
    items: data.items,
  };

  purchases.unshift(purchase);

  save(purchases);

  data.items.forEach((item) => {
    increaseStock(item.productId, item.quantity);
  });

  updateCustomerBalance(
    data.supplierId,
    data.total,
    "alis"
  );

  return purchase;
}

export function deletePurchase(id) {
  const purchases = getPurchases();

  const purchase = purchases.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!purchase) return;

  const products = getProducts();

  purchase.items.forEach((item) => {
    const index = products.findIndex(
      (p) => Number(p.id) === Number(item.productId)
    );

    if (index !== -1) {
      products[index].stock -= Number(item.quantity);

      if (products[index].stock < 0) {
        products[index].stock = 0;
      }
    }
  });

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  updateCustomerBalance(
    purchase.supplierId,
    purchase.total,
    "odeme"
  );

  save(
    purchases.filter(
      (item) => Number(item.id) !== Number(id)
    )
  );
}

export function getTodayPurchases() {
  const today = new Date().toLocaleDateString("tr-TR");

  return getPurchases().filter((item) =>
    item.date.startsWith(today)
  );
}

export function getTotalPurchaseAmount() {
  return getPurchases().reduce(
    (total, item) => total + Number(item.total),
    0
  );
}

export default getPurchases();