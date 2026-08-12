const defaultCustomers = [
  {
    id: 1,
    name: "Örnek Müşteri",
    type: "Müşteri",
    phone: "",
    address: "",
    taxOffice: "",
    taxNumber: "",
    balance: 0,
    note: "",
  },
  {
    id: 2,
    name: "Poyraz Gıda",
    type: "Tedarikçi",
    phone: "",
    address: "",
    taxOffice: "",
    taxNumber: "",
    balance: 0,
    note: "",
  },
  {
    id: 3,
    name: "Kuzey Kimya",
    type: "Tedarikçi",
    phone: "",
    address: "",
    taxOffice: "",
    taxNumber: "",
    balance: 0,
    note: "",
  },
];

if (!localStorage.getItem("customers")) {
  localStorage.setItem(
    "customers",
    JSON.stringify(defaultCustomers)
  );
}

function save(customers) {
  localStorage.setItem(
    "customers",
    JSON.stringify(customers)
  );
}

export function getCustomers() {
  return (
    JSON.parse(localStorage.getItem("customers")) || []
  );
}

export function getCustomer(id) {
  return getCustomers().find(
    (item) => Number(item.id) === Number(id)
  );
}

export function addCustomer(customer) {
  const customers = getCustomers();

  const newCustomer = {
    id: Date.now(),
    name: customer.name || "",
    type: customer.type || "Müşteri",
    phone: customer.phone || "",
    address: customer.address || "",
    taxOffice: customer.taxOffice || "",
    taxNumber: customer.taxNumber || "",
    balance: Number(customer.balance || 0),
    note: customer.note || "",
  };

  customers.push(newCustomer);

  save(customers);

  return newCustomer;
}

export function updateCustomer(customer) {
  const customers = getCustomers();

  const index = customers.findIndex(
    (item) => Number(item.id) === Number(customer.id)
  );

  if (index === -1) return false;

  customers[index] = {
    ...customers[index],
    ...customer,
    balance: Number(customer.balance),
  };

  save(customers);

  return true;
}

export function deleteCustomer(id) {
  const customers = getCustomers().filter(
    (item) => Number(item.id) !== Number(id)
  );

  save(customers);
}

export function updateCustomerBalance(
  customerId,
  amount,
  type
) {
  const customers = getCustomers();

  const index = customers.findIndex(
    (item) => Number(item.id) === Number(customerId)
  );

  if (index === -1) return;

  let balance = Number(
    customers[index].balance || 0
  );

  switch (type) {
    case "satis":
      balance += Number(amount);
      break;

    case "alis":
      balance -= Number(amount);
      break;

    case "tahsilat":
      balance -= Number(amount);
      break;

    case "odeme":
      balance += Number(amount);
      break;

    default:
      break;
  }

  customers[index].balance = balance;

  save(customers);
}

export function searchCustomers(text) {
  const search = text.toLowerCase();

  return getCustomers().filter(
    (item) =>
      item.name.toLowerCase().includes(search) ||
      item.type.toLowerCase().includes(search)
  );
}

export function getCustomersByType(type) {
  return getCustomers().filter(
    (item) =>
      item.type === type ||
      item.type === "Her İkisi"
  );
}

export default getCustomers();