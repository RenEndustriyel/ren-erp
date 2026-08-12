import { getProducts, decreaseStock } from "./products";
import { updateCustomerBalance } from "./customers";

const STORAGE_KEY = "sales";

export function getSales() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function save(sales) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

export function getSale(id) {
  return getSales().find(
    (item) => Number(item.id) === Number(id)
  );
}

export function addSale(data) {
  const sales = getSales();

  const sale = {
    id: Date.now(),
    customerId: Number(data.customerId),
    customer: data.customer,
    date: new Date().toLocaleString("tr-TR"),
    total: Number(data.total),
    items: data.items,
  };

  sales.unshift(sale);

  save(sales);

  data.items.forEach((item) => {
    decreaseStock(item.productId, item.quantity);
  });

  updateCustomerBalance(
    data.customerId,
    data.total,
    "satis"
  );

  return sale;
}

export function deleteSale(id) {
  const sales = getSales();

  const sale = sales.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!sale) return;

  const products = getProducts();

  sale.items.forEach((item) => {
    const index = products.findIndex(
      (p) => Number(p.id) === Number(item.productId)
    );

    if (index !== -1) {
      products[index].stock += Number(item.quantity);
    }
  });

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  updateCustomerBalance(
    sale.customerId,
    sale.total,
    "tahsilat"
  );

  save(
    sales.filter(
      (item) => Number(item.id) !== Number(id)
    )
  );
}

export function getTodaySales() {
  const today = new Date().toLocaleDateString("tr-TR");

  return getSales().filter((item) =>
    item.date.startsWith(today)
  );
}

export function getTotalSalesAmount() {
  return getSales().reduce(
    (total, item) => total + Number(item.total),
    0
  );
}

export default getSales();